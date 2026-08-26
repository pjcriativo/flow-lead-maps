import hashlib
import hmac
import json
import logging
import os
import time
from datetime import datetime, timedelta, timezone
from importlib.metadata import version
from typing import Any

import httpx
from cryptography.fernet import Fernet, InvalidToken
from fastapi import FastAPI, Header, HTTPException, Request
from instagrapi import Client
from instagrapi.exceptions import (
    BadPassword,
    ChallengeRequired,
    FeedbackRequired,
    LoginRequired,
    PleaseWaitFewMinutes,
    TwoFactorRequired,
)
from pydantic import BaseModel, Field
from starlette.concurrency import run_in_threadpool


app = FastAPI(title="Flow Business Instagram Connector", docs_url=None, redoc_url=None)
logger = logging.getLogger("flow_business_instagram_connector")


class ConnectRequest(BaseModel):
    requestId: str = Field(min_length=10, max_length=100)
    instanceId: str = Field(min_length=36, max_length=36)
    username: str = Field(pattern=r"^[a-z0-9._]{1,30}$")
    password: str = Field(min_length=1, max_length=200)
    verificationCode: str = Field(default="", max_length=20)


class AutomationRunRequest(BaseModel):
    requestId: str = Field(min_length=10, max_length=100)
    maxAccounts: int = Field(default=1, ge=1, le=1)


def required_env(name: str) -> str:
    value = os.environ.get(name, "").strip()
    if not value:
        raise RuntimeError(f"missing_config:{name}")
    return value


def verify_signature(raw_body: bytes, timestamp: str | None, signature: str | None) -> None:
    if not timestamp or not signature:
        raise HTTPException(status_code=401, detail="missing_signature")
    try:
        age = abs(int(time.time()) - int(timestamp))
    except ValueError as error:
        raise HTTPException(status_code=401, detail="invalid_signature") from error
    if age > 60:
        raise HTTPException(status_code=401, detail="expired_signature")
    expected = hmac.new(
        required_env("CONNECTOR_SHARED_SECRET").encode(),
        timestamp.encode() + b"." + raw_body,
        hashlib.sha256,
    ).hexdigest()
    if not hmac.compare_digest(expected, signature):
        raise HTTPException(status_code=401, detail="invalid_signature")


def scrub_settings(value: Any) -> Any:
    if isinstance(value, dict):
        return {
            key: scrub_settings(item)
            for key, item in value.items()
            if key.lower() not in {"password", "verification_code"}
        }
    if isinstance(value, list):
        return [scrub_settings(item) for item in value]
    return value


def supabase_headers(prefer: str | None = None) -> dict[str, str]:
    service_key = required_env("SUPABASE_SERVICE_ROLE_KEY")
    headers = {
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
        "Content-Type": "application/json",
    }
    if prefer:
        headers["Prefer"] = prefer
    return headers


async def supabase_rpc(name: str, payload: dict[str, Any]) -> Any:
    base = required_env("SUPABASE_URL").rstrip("/")
    async with httpx.AsyncClient(timeout=25) as http:
        response = await http.post(
            f"{base}/rest/v1/rpc/{name}",
            headers=supabase_headers(),
            json=payload,
        )
    if response.status_code >= 300:
        raise RuntimeError(f"database_rpc_failed:{name}:{response.status_code}")
    if not response.content:
        return None
    return response.json()


async def persist_session(
    instance_id: str,
    settings: dict[str, Any],
    *,
    verified: bool = True,
    error_code: str | None = None,
    pending_challenge: dict[str, Any] | None = None,
) -> None:
    stored: dict[str, Any] = {"clientSettings": scrub_settings(settings)}
    if pending_challenge:
        stored["pendingChallenge"] = scrub_settings(pending_challenge)
    encrypted = Fernet(required_env("CONNECTOR_ENCRYPTION_KEY")).encrypt(
        json.dumps(stored, separators=(",", ":")).encode()
    ).decode()
    base = required_env("SUPABASE_URL").rstrip("/")
    payload = {
        "instance_id": instance_id,
        "encrypted_settings": encrypted,
        "settings_version": 2,
        "last_verified_at": datetime.now(timezone.utc).isoformat() if verified else None,
        "last_error_code": error_code,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    async with httpx.AsyncClient(timeout=20) as http:
        response = await http.post(
            f"{base}/rest/v1/instagram_connector_sessions?on_conflict=instance_id",
            headers=supabase_headers("resolution=merge-duplicates,return=minimal"),
            json=payload,
        )
    if response.status_code >= 300:
        raise HTTPException(status_code=502, detail="session_persistence_failed")


async def load_stored_session(instance_id: str) -> dict[str, Any]:
    base = required_env("SUPABASE_URL").rstrip("/")
    async with httpx.AsyncClient(timeout=20) as http:
        response = await http.get(
            f"{base}/rest/v1/instagram_connector_sessions",
            headers=supabase_headers(),
            params={
                "select": "encrypted_settings,settings_version",
                "instance_id": f"eq.{instance_id}",
                "limit": "1",
            },
        )
    if response.status_code >= 300:
        raise RuntimeError("session_load_failed")
    rows = response.json()
    if not isinstance(rows, list) or not rows:
        raise RuntimeError("session_not_found")
    encrypted = rows[0].get("encrypted_settings")
    if not isinstance(encrypted, str):
        raise RuntimeError("session_invalid")
    try:
        raw = Fernet(required_env("CONNECTOR_ENCRYPTION_KEY")).decrypt(encrypted.encode())
        stored = json.loads(raw)
    except (InvalidToken, json.JSONDecodeError) as error:
        raise RuntimeError("session_invalid") from error
    if not isinstance(stored, dict):
        raise RuntimeError("session_invalid")
    if int(rows[0].get("settings_version") or 1) >= 2:
        settings = stored.get("clientSettings")
        pending = stored.get("pendingChallenge")
        if not isinstance(settings, dict) or (pending is not None and not isinstance(pending, dict)):
            raise RuntimeError("session_invalid")
        return {"clientSettings": settings, "pendingChallenge": pending}
    return {"clientSettings": stored, "pendingChallenge": None}


async def load_session(instance_id: str) -> dict[str, Any]:
    stored = await load_stored_session(instance_id)
    return stored["clientSettings"]


async def optional_stored_session(instance_id: str) -> dict[str, Any] | None:
    try:
        return await load_stored_session(instance_id)
    except RuntimeError as error:
        if str(error) == "session_not_found":
            return None
        raise


def pending_challenge(client: Client) -> dict[str, Any]:
    raw = client.last_json if isinstance(client.last_json, dict) else {}
    raw_challenge = raw.get("challenge") if isinstance(raw.get("challenge"), dict) else {}
    last_json = {
        key: raw[key]
        for key in ("bloks_action", "challenge_context", "step_name", "action", "type", "status")
        if key in raw
    }
    if raw_challenge:
        last_json["challenge"] = {
            key: raw_challenge[key]
            for key in ("api_path", "native_flow", "challenge_context")
            if key in raw_challenge
        }
    bloks_approval = last_json.get("bloks_action") == "com.bloks.www.ig.challenge.redirect.async"
    app_approval = bool(
        bloks_approval
        or (isinstance(last_json.get("challenge"), dict) and last_json["challenge"].get("native_flow"))
        or str(last_json.get("challenge", {}).get("api_path", "")).startswith("/auth_platform/")
    )
    return {
        "mode": "app_approval" if app_approval else "verification_code",
        "resume": "bloks_dismiss" if bloks_approval else "retry_login",
        "lastJson": last_json,
    }


def restore_pending_challenge(client: Client, stored: dict[str, Any] | None) -> dict[str, str] | None:
    if not stored:
        return None
    settings = stored.get("clientSettings")
    if not isinstance(settings, dict):
        raise RuntimeError("session_invalid")
    client.set_settings(settings)
    pending = stored.get("pendingChallenge")
    if not isinstance(pending, dict):
        return None
    last_json = pending.get("lastJson")
    if isinstance(last_json, dict):
        client.last_json = last_json
    mode = pending.get("mode")
    resume = pending.get("resume")
    if mode not in {"app_approval", "verification_code"}:
        return None
    if resume not in {"bloks_dismiss", "retry_login"}:
        resume = "bloks_dismiss" if last_json.get("bloks_action") == "com.bloks.www.ig.challenge.redirect.async" else "retry_login"
    return {"mode": mode, "resume": resume}


def parse_timestamp(value: str) -> datetime:
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def comment_timestamp(comment: Any) -> datetime:
    value = getattr(comment, "created_at_utc", None) or getattr(comment, "created_at", None)
    if not isinstance(value, datetime):
        return datetime.now(timezone.utc)
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def collect_recent_comments(
    client: Client,
    since_at: datetime,
    media_limit: int,
    comments_limit: int,
) -> list[dict[str, Any]]:
    lower_bound = since_at - timedelta(minutes=2)
    own_user_id = str(client.user_id or "")
    if not own_user_id.isdigit():
        raise RuntimeError("session_invalid")
    events: dict[str, dict[str, Any]] = {}
    media_items = client.user_medias(own_user_id, amount=media_limit)
    for media in media_items:
        for comment in client.media_comments(media.pk, amount=comments_limit):
            occurred_at = comment_timestamp(comment)
            commenter = getattr(comment, "user", None)
            commenter_id = str(getattr(commenter, "pk", "") or "")
            username = str(getattr(commenter, "username", "") or "").strip().lower()
            comment_id = str(getattr(comment, "pk", "") or "")
            text = str(getattr(comment, "text", "") or "").strip()
            if (
                occurred_at < lower_bound
                or not comment_id
                or not commenter_id
                or commenter_id == own_user_id
                or not username
                or not text
            ):
                continue
            events[comment_id] = {
                "p_external_media_id": str(media.pk),
                "p_external_comment_id": comment_id,
                "p_external_commenter_id": commenter_id,
                "p_commenter_username": username,
                "p_commenter_name": str(getattr(commenter, "full_name", "") or "").strip(),
                "p_comment_text": text,
                "p_occurred_at": occurred_at.isoformat(),
                "p_raw_payload": {
                    "mediaCode": str(getattr(media, "code", "") or ""),
                    "source": "session_comment_monitor",
                },
            }
    return sorted(events.values(), key=lambda event: event["p_occurred_at"])


def automation_error_code(error: Exception) -> str:
    if isinstance(error, ChallengeRequired):
        return "challenge_required"
    if isinstance(error, LoginRequired):
        return "login_required"
    if isinstance(error, FeedbackRequired):
        return "feedback_required"
    if isinstance(error, PleaseWaitFewMinutes):
        return "rate_limited"
    if isinstance(error, RuntimeError):
        code = str(error).split(":", 1)[0]
        if code in {"session_not_found", "session_invalid", "session_load_failed"}:
            return code
    return "automation_failed"


async def finish_account(
    instance_id: str,
    worker_id: str,
    success: bool,
    error_code: str | None = None,
) -> None:
    await supabase_rpc(
        "flow_business_finish_automation_account",
        {
            "p_instance_id": instance_id,
            "p_worker_id": worker_id,
            "p_success": success,
            "p_error_code": error_code,
        },
    )


async def process_account(claim: dict[str, Any], worker_id: str) -> dict[str, int | bool]:
    instance_id = str(claim.get("instance_id") or "")
    if not instance_id:
        raise RuntimeError("invalid_account_claim")
    try:
        settings = await load_session(instance_id)
        client = Client()
        client.delay_range = [1, 3]
        client.set_settings(settings)
        await run_in_threadpool(client.account_info)
        comments = await run_in_threadpool(
            collect_recent_comments,
            client,
            parse_timestamp(str(claim.get("since_at"))),
            int(claim.get("media_limit") or 4),
            int(claim.get("comments_limit") or 15),
        )

        queued = 0
        for comment in comments:
            result = await supabase_rpc(
                "flow_business_record_session_comment",
                {"p_instance_id": instance_id, **comment},
            )
            if isinstance(result, dict) and result.get("queued") is True:
                queued += 1

        job = await supabase_rpc(
            "flow_business_claim_automation_job",
            {"p_instance_id": instance_id, "p_worker_id": worker_id},
        )
        sent = False
        if isinstance(job, dict) and job.get("id"):
            payload = job.get("payload")
            if not isinstance(payload, dict):
                raise RuntimeError("invalid_job_payload")
            message = str(payload.get("renderedMessage") or "").strip()
            recipient_id = str(payload.get("recipientId") or "").strip()
            if not message or not recipient_id.isdigit():
                await supabase_rpc(
                    "flow_business_finish_automation_job",
                    {
                        "p_job_id": job["id"],
                        "p_worker_id": worker_id,
                        "p_success": False,
                        "p_external_result_id": None,
                        "p_error_code": "invalid_job_payload",
                    },
                )
            else:
                try:
                    delivered = await run_in_threadpool(
                        client.direct_send,
                        message,
                        [int(recipient_id)],
                    )
                    await supabase_rpc(
                        "flow_business_finish_automation_job",
                        {
                            "p_job_id": job["id"],
                            "p_worker_id": worker_id,
                            "p_success": True,
                            "p_external_result_id": str(getattr(delivered, "id", "") or ""),
                            "p_error_code": None,
                        },
                    )
                    sent = True
                except Exception as send_error:
                    # A biblioteca não confirma se uma exceção ocorreu antes ou depois da entrega.
                    # Nunca repetimos automaticamente uma tentativa de resultado desconhecido.
                    await supabase_rpc(
                        "flow_business_finish_automation_job",
                        {
                            "p_job_id": job["id"],
                            "p_worker_id": worker_id,
                            "p_success": False,
                            "p_external_result_id": None,
                            "p_error_code": "delivery_unknown",
                        },
                    )
                    raise

        await persist_session(instance_id, client.get_settings())
        await finish_account(instance_id, worker_id, True)
        return {"ok": True, "comments": len(comments), "queued": queued, "sent": sent}
    except Exception as error:
        code = automation_error_code(error)
        try:
            await finish_account(instance_id, worker_id, False, code)
        except Exception as finish_error:
            logger.error(
                "Failed to release Instagram automation lease",
                extra={"instance_id": instance_id, "error": type(finish_error).__name__},
            )
        return {"ok": False, "comments": 0, "queued": 0, "sent": False}


@app.get("/v1/health")
async def health() -> dict[str, str]:
    return {
        "status": "ok",
        "mode": "controlled_automation",
        "connectorVersion": version("instagrapi"),
    }


@app.post("/v1/connect")
async def connect(
    request: Request,
    x_flow_timestamp: str | None = Header(default=None),
    x_flow_signature: str | None = Header(default=None),
) -> dict[str, Any]:
    raw = await request.body()
    verify_signature(raw, x_flow_timestamp, x_flow_signature)
    try:
        data = ConnectRequest.model_validate_json(raw)
    except ValueError as error:
        raise HTTPException(status_code=422, detail="invalid_body") from error

    client = Client()
    client.delay_range = [1, 3]
    stored = await optional_stored_session(data.instanceId)
    challenge_state = restore_pending_challenge(client, stored)
    client.challenge_code_handler = lambda _username, _choice: data.verificationCode.strip()
    try:
        if challenge_state and challenge_state["resume"] == "bloks_dismiss":
            await run_in_threadpool(client.challenge_bloks_redirect_dismiss)
        await run_in_threadpool(
            client.login,
            data.username,
            data.password,
            verification_code=data.verificationCode,
        )
        account = await run_in_threadpool(client.account_info)
        await persist_session(data.instanceId, client.get_settings(), verified=True)
        return {
            "connected": True,
            "username": account.username,
            "fullName": account.full_name,
        }
    except TwoFactorRequired as error:
        await persist_session(
            data.instanceId,
            client.get_settings(),
            verified=False,
            error_code="two_factor_required",
        )
        raise HTTPException(status_code=409, detail={"code": "two_factor_required"}) from error
    except ChallengeRequired as error:
        challenge = pending_challenge(client)
        logger.info(
            "Instagram connection requires a resumable challenge",
            extra={
                "instance_id": data.instanceId,
                "mode": challenge["mode"],
                "resume": challenge["resume"],
            },
        )
        await persist_session(
            data.instanceId,
            client.get_settings(),
            verified=False,
            error_code="challenge_required",
            pending_challenge=challenge,
        )
        raise HTTPException(
            status_code=409,
            detail={"code": "challenge_required", "mode": challenge["mode"]},
        ) from error
    except BadPassword as error:
        raise HTTPException(status_code=401, detail={"code": "invalid_credentials"}) from error
    except LoginRequired as error:
        raise HTTPException(status_code=401, detail={"code": "login_required"}) from error
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(status_code=502, detail={"code": "connection_failed"}) from error


@app.post("/v1/automation/run")
async def run_automation(
    request: Request,
    x_flow_timestamp: str | None = Header(default=None),
    x_flow_signature: str | None = Header(default=None),
) -> dict[str, Any]:
    raw = await request.body()
    verify_signature(raw, x_flow_timestamp, x_flow_signature)
    try:
        data = AutomationRunRequest.model_validate_json(raw)
    except ValueError as error:
        raise HTTPException(status_code=422, detail="invalid_body") from error

    claims = await supabase_rpc(
        "flow_business_claim_automation_accounts",
        {"p_worker_id": data.requestId, "p_limit": data.maxAccounts},
    )
    if not isinstance(claims, list):
        claims = []
    results = [await process_account(claim, data.requestId) for claim in claims]
    return {
        "processedAccounts": len(results),
        "successfulAccounts": sum(1 for result in results if result["ok"] is True),
        "commentsSeen": sum(int(result["comments"]) for result in results),
        "jobsQueued": sum(int(result["queued"]) for result in results),
        "messagesSent": sum(1 for result in results if result["sent"] is True),
    }
