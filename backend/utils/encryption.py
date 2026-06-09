import logging
from cryptography.fernet import Fernet, InvalidToken
from django.conf import settings
from django.db import models

logger = logging.getLogger(__name__)

_fernet = None


def _get_fernet():
    global _fernet
    if _fernet is None:
        key = getattr(settings, 'FIELD_ENCRYPTION_KEY', None)
        if not key:
            raise RuntimeError(
                'FIELD_ENCRYPTION_KEY is not set. '
                'Generate one with: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"'
            )
        _fernet = Fernet(key.encode() if isinstance(key, str) else key)
    return _fernet


def encrypt(value: str) -> str:
    """Encrypt a plaintext string. Returns URL-safe base64 ciphertext."""
    if not value:
        return value
    return _get_fernet().encrypt(value.encode('utf-8')).decode('utf-8')


def decrypt(value: str) -> str:
    """Decrypt a ciphertext string. Returns original plaintext.
    Falls back to the raw value if decryption fails (handles legacy plaintext rows).
    """
    if not value:
        return value
    try:
        return _get_fernet().decrypt(value.encode('utf-8')).decode('utf-8')
    except (InvalidToken, Exception):
        # Legacy plaintext — return as-is so the row can be re-saved and encrypted.
        return value


class EncryptedTextField(models.TextField):
    """A TextField that transparently encrypts on write and decrypts on read.

    - get_prep_value  → called before INSERT/UPDATE → encrypts
    - from_db_value   → called after SELECT        → decrypts
    Existing plaintext rows are returned as-is on first read and encrypted on next save.
    """

    def from_db_value(self, value, expression, connection):
        return decrypt(value) if value else value

    def to_python(self, value):
        return value

    def get_prep_value(self, value):
        return encrypt(value) if value else value
