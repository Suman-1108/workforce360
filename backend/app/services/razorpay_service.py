import hmac
import hashlib
import uuid
import secrets
from typing import Dict, Any, Tuple, Optional
from app.core.config import settings
from app.core.exceptions import ValidationException
from app.core.logging import logger


class RazorpayService:
    """Service handling Razorpay merchant transactions and cryptographic HMAC signature validation."""

    def __init__(
        self,
        key_id: str = settings.RAZORPAY_KEY_ID,
        key_secret: str = settings.RAZORPAY_KEY_SECRET,
    ):
        self.key_id = key_id
        self.key_secret = key_secret

    def create_order(
        self, amount_in_currency: float, currency: str = "USD", receipt: Optional[str] = None
    ) -> Dict[str, Any]:
        """Create or simulate a Razorpay merchant order."""
        amount_subunits = int(round(amount_in_currency * 100))
        order_id = f"order_{secrets.token_hex(10)}"
        return {
            "order_id": order_id,
            "amount": amount_in_currency,
            "amount_subunits": amount_subunits,
            "currency": currency,
            "receipt": receipt or f"rcpt_{uuid.uuid4().hex[:8]}",
            "key_id": self.key_id,
        }

    def generate_signature(self, order_id: str, payment_id: str) -> str:
        """Compute expected HMAC-SHA256 signature for test validation or assertions."""
        msg = f"{order_id}|{payment_id}".encode("utf-8")
        return hmac.new(self.key_secret.encode("utf-8"), msg, hashlib.sha256).hexdigest()

    def verify_signature(
        self, order_id: str, payment_id: str, received_signature: str
    ) -> bool:
        """Cryptographically verify authenticity of Razorpay payment payload."""
        if not order_id or not payment_id or not received_signature:
            return False

        expected_sig = self.generate_signature(order_id, payment_id)
        is_valid = hmac.compare_digest(expected_sig, received_signature)
        if not is_valid:
            logger.warning(
                f"[RAZORPAY] Signature mismatch for order {order_id} and payment {payment_id}"
            )
        return is_valid


razorpay_service = RazorpayService()
