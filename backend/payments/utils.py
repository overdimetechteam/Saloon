import hashlib
from django.conf import settings


def _secret_hash():
    secret = settings.PAYHERE_MERCHANT_SECRET
    return hashlib.md5(secret.encode()).hexdigest().upper()


def generate_checkout_hash(merchant_id, order_id, amount_str, currency='LKR'):
    """
    Hash for the checkout form POST.
    amount_str must already be formatted to exactly 2 decimal places.
    """
    raw = f"{merchant_id}{order_id}{amount_str}{currency}{_secret_hash()}"
    return hashlib.md5(raw.encode()).hexdigest().upper()


def verify_notify_hash(merchant_id, order_id, payhere_amount, payhere_currency, status_code, md5sig):
    """Verify the md5sig in PayHere's server-to-server notify POST."""
    raw = f"{merchant_id}{order_id}{payhere_amount}{payhere_currency}{_secret_hash()}{status_code}"
    expected = hashlib.md5(raw.encode()).hexdigest().upper()
    return expected == md5sig.upper()
