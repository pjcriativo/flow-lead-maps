import hashlib
import hmac
import json
import os
import time
from typing import Any

import httpx
from cryptography.fernet import Fernet
from fastapi import FastAPI, Header, HTTPException, Request
from instagrapi import Client
from instagrapi.exceptions import (
    BadPassword,
    ChallengeRequired,
    LoginRequired,
    TwoFactorRequired,
)
from pydantic import BaseModel, Field


app = FastAPI(title="Flow Business Instagram Connector", docs_url=None, redoc_url=None)


class ConnectRequest(BaseModel):
    requestId: str = Field(min_length=10, max_length=100)
    instanceId: str = Field(min_length=36, max_length=36)
    username: str = Field(pattern=r"^[a-z0-9._]{1,30}$")
    password: str = Field(min_length=1, max_length=200)
    verificationCode: str = Field(default="", max_length=20)


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


async def persist_session(instance_id: str, settings: dict[str, Any]) -> None:
    encrypted = Fernet(required_env("CONNECTOR_ENCRYPTION_KEY")).encrypt(
        json.dumps(scrub_settings(settings), separators=(",", ":")).encode()
    ).decode()
    base = required_env("SUPABASE_URL").rstrip("/")
    service_key = required_env("SUPABASE_SERVICE_ROLE_KEY")
    headers = {
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates,return=minimal",
    }
    payload = {
        "instance_id": instance_id,
        "encrypted_settings": encrypted,
        "settings_version": 1,
        "last_verified_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "last_error_code": None,
        "updated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }
    async with httpx.AsyncClient(timeout=20) as client:
        response = await client.post(
            f"{base}/rest/v1/instagram_connector_sessions?on_conflict=instance_id",
            headers=headers,
            json=payload,
        )
    if response.status_code >= 300:
        raise HTTPException(status_code=502, detail="session_persistence_failed")


@app.get("/v1/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "mode": "pilot"}


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
    try:
        client.login(
            data.username,
            data.password,
            verification_code=data.verificationCode,
        )
        account = client.account_info()
        await persist_session(data.instanceId, client.get_settings())
        return {
            "connected": True,
            "username": account.username,
            "fullName": account.full_name,
        }
    except TwoFactorRequired as error:
        raise HTTPException(status_code=409, detail={"code": "two_factor_required"}) from error
    except ChallengeRequired as error:
        raise HTTPException(status_code=409, detail={"code": "challenge_required"}) from error
    except BadPassword as error:
        raise HTTPException(status_code=401, detail={"code": "invalid_credentials"}) from error
    except LoginRequired as error:
        raise HTTPException(status_code=401, detail={"code": "login_required"}) from error
    except HTTPException:
        raise
    except Exception as error:
        # Não devolve detalhes do Instagram nem dados sensíveis ao chamador.
        raise HTTPException(status_code=502, detail={"code": "connection_failed"}) from error
