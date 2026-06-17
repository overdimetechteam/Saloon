import hashlib
from django.conf import settings as django_settings


def _get_payhere_config():
    """Return (merchant_id, merchant_secret, sandbox) — DB takes priority over env vars."""
    from .models import PlatformSettings
    ps = PlatformSettings.get()
    if ps.payhere_merchant_id:
        return ps.payhere_merchant_id, ps.payhere_merchant_secret, ps.payhere_sandbox
    return (
        django_settings.PAYHERE_MERCHANT_ID,
        django_settings.PAYHERE_MERCHANT_SECRET,
        getattr(django_settings, 'PAYHERE_SANDBOX', True),
    )


def _secret_hash():
    _, merchant_secret, _ = _get_payhere_config()
    return hashlib.md5(merchant_secret.encode()).hexdigest().upper()


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
