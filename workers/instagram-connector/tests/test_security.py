import hashlib
import hmac
import os
import time
import unittest
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace

from fastapi import HTTPException

from app import automation_error_code, collect_recent_comments, scrub_settings, verify_signature


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


if __name__ == "__main__":
    unittest.main()
