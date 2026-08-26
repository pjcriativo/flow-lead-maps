import hashlib
import hmac
import os
import time
import unittest

from fastapi import HTTPException

from app import scrub_settings, verify_signature


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


if __name__ == "__main__":
    unittest.main()
