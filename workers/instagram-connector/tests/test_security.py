import hashlib
import hmac
import os
import time
import unittest
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

from fastapi import HTTPException
from fastapi.testclient import TestClient
from instagrapi.exceptions import ChallengeRequired

from app import app, automation_error_code, collect_recent_comments, scrub_settings, verify_signature


class ConnectorSecurityTests(unittest.TestCase):
    def setUp(self) -> None:
        os.environ["CONNECTOR_SHARED_SECRET"] = "segredo-de-teste-comprido"

    def test_rejects_expired_signature(self) -> None:
        body = b'{}'
        timestamp = str(int(time.time()) - 61)
        signature = hmac.new(
            os.environ["CONNECTOR_SHARED_SECRET"].encode(),
            timestamp.encode() + b"." + body,
            hashlib.sha256,
        ).hexdigest()
        with self.assertRaises(HTTPException):
            verify_signature(body, timestamp, signature)

    def test_removes_password_from_nested_settings(self) -> None:
        settings = {"cookies": {"sessionid": "ok"}, "password": "nunca", "nested": {"password": "não"}}
        scrubbed = scrub_settings(settings)
        self.assertNotIn("password", scrubbed)
        self.assertNotIn("password", scrubbed["nested"])
        self.assertEqual(scrubbed["cookies"]["sessionid"], "ok")

    def test_collects_each_new_external_comment_only_once(self) -> None:
        now = datetime.now(timezone.utc)
        visitor = SimpleNamespace(pk=22, username="Cliente.Real", full_name="Cliente Real")
        own_user = SimpleNamespace(pk=10, username="minha_conta", full_name="Minha Conta")
        media = SimpleNamespace(pk=100, code="ABC")
        recent = SimpleNamespace(pk=200, text="QUERO", user=visitor, created_at_utc=now)
        duplicate = SimpleNamespace(pk=200, text="QUERO", user=visitor, created_at_utc=now)
        own_comment = SimpleNamespace(pk=201, text="resposta", user=own_user, created_at_utc=now)
        old = SimpleNamespace(
            pk=202,
            text="QUERO",
            user=visitor,
            created_at_utc=now - timedelta(hours=1),
        )

        class FakeClient:
            user_id = 10

            def user_medias(self, user_id: int, amount: int):
                self.media_request = (user_id, amount)
                return [media]

            def media_comments(self, media_id: int, amount: int):
                self.comment_request = (media_id, amount)
                return [recent, duplicate, own_comment, old]

        client = FakeClient()
        events = collect_recent_comments(client, now - timedelta(minutes=5), 4, 15)
        self.assertEqual(len(events), 1)
        self.assertEqual(events[0]["p_external_comment_id"], "200")
        self.assertEqual(events[0]["p_commenter_username"], "cliente.real")
        self.assertEqual(client.media_request, ("10", 4))
        self.assertEqual(client.comment_request, (100, 15))

    def test_keeps_session_failures_specific_without_leaking_details(self) -> None:
        self.assertEqual(automation_error_code(RuntimeError("session_invalid:segredo")), "session_invalid")
        self.assertEqual(automation_error_code(RuntimeError("qualquer detalhe")), "automation_failed")

    def test_preserves_device_state_when_instagram_requires_app_approval(self) -> None:
        class ChallengeClient:
            def __init__(self) -> None:
                self.delay_range = []
                self.last_json = {
                    "message": "challenge_required",
                    "bloks_action": "com.bloks.www.ig.challenge.redirect.async",
                    "challenge_context": "contexto-seguro",
                }

            def login(self, *_args, **_kwargs):
                raise ChallengeRequired(**self.last_json)

            def get_settings(self):
                return {"uuids": {"android_device_id": "android-mesmo-dispositivo"}}

        body = (
            b'{"requestId":"request-test-123","instanceId":"00000000-0000-0000-0000-000000000001",'
            b'"username":"conta.teste","password":"senha-segura","verificationCode":""}'
        )
        timestamp = str(int(time.time()))
        signature = hmac.new(
            os.environ["CONNECTOR_SHARED_SECRET"].encode(),
            timestamp.encode() + b"." + body,
            hashlib.sha256,
        ).hexdigest()
        persisted = AsyncMock()

        with (
            patch("app.Client", ChallengeClient),
            patch("app.optional_stored_session", AsyncMock(return_value=None)),
            patch("app.persist_session", persisted),
        ):
            response = TestClient(app).post(
                "/v1/connect",
                content=body,
                headers={
                    "Content-Type": "application/json",
                    "X-Flow-Timestamp": timestamp,
                    "X-Flow-Signature": signature,
                },
            )

        self.assertEqual(response.status_code, 409)
        self.assertEqual(response.json()["detail"]["code"], "challenge_required")
        self.assertEqual(response.json()["detail"]["mode"], "app_approval")
        self.assertEqual(persisted.await_count, 1)
        self.assertFalse(persisted.await_args.kwargs["verified"])
        self.assertEqual(
            persisted.await_args.kwargs["pending_challenge"]["lastJson"]["challenge_context"],
            "contexto-seguro",
        )

    def test_resumes_pending_app_approval_before_login(self) -> None:
        class ResumedClient:
            latest = None

            def __init__(self) -> None:
                self.delay_range = []
                self.last_json = {}
                self.dismissed = False
                self.settings = None
                ResumedClient.latest = self

            def set_settings(self, settings):
                self.settings = settings

            def challenge_bloks_redirect_dismiss(self):
                self.dismissed = True
                return True

            def login(self, *_args, **_kwargs):
                return True

            def account_info(self):
                return SimpleNamespace(username="conta.teste", full_name="Conta Teste")

            def get_settings(self):
                return self.settings

        stored = {
            "clientSettings": {"uuids": {"android_device_id": "android-mesmo-dispositivo"}},
            "pendingChallenge": {
                "mode": "app_approval",
                "resume": "bloks_dismiss",
                "lastJson": {
                    "bloks_action": "com.bloks.www.ig.challenge.redirect.async",
                    "challenge_context": "contexto-seguro",
                },
            },
        }
        body = (
            b'{"requestId":"request-test-456","instanceId":"00000000-0000-0000-0000-000000000001",'
            b'"username":"conta.teste","password":"senha-segura","verificationCode":""}'
        )
        timestamp = str(int(time.time()))
        signature = hmac.new(
            os.environ["CONNECTOR_SHARED_SECRET"].encode(),
            timestamp.encode() + b"." + body,
            hashlib.sha256,
        ).hexdigest()

        with (
            patch("app.Client", ResumedClient),
            patch("app.optional_stored_session", AsyncMock(return_value=stored)),
            patch("app.persist_session", AsyncMock()),
        ):
            response = TestClient(app).post(
                "/v1/connect",
                content=body,
                headers={
                    "Content-Type": "application/json",
                    "X-Flow-Timestamp": timestamp,
                    "X-Flow-Signature": signature,
                },
            )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["connected"])
        self.assertEqual(
            ResumedClient.latest.settings["uuids"]["android_device_id"],
            "android-mesmo-dispositivo",
        )
        self.assertTrue(ResumedClient.latest.dismissed)


if __name__ == "__main__":
    unittest.main()
