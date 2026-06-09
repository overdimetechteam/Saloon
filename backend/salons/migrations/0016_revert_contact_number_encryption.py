import os
from django.db import migrations, models


def decrypt_contact_numbers(apps, schema_editor):
    """Decrypt contact_number rows that were encrypted by migration 0015.
    Safe to run even if the values are already plaintext or if no key is set."""
    key = os.getenv('FIELD_ENCRYPTION_KEY', '')
    if not key:
        return  # nothing was encrypted on this instance

    from cryptography.fernet import Fernet, InvalidToken
    f = Fernet(key.encode())

    Salon = apps.get_model('salons', 'Salon')
    salons = list(Salon.objects.all())
    changed = []
    for salon in salons:
        val = salon.contact_number
        if not val:
            continue
        try:
            salon.contact_number = f.decrypt(val.encode()).decode('utf-8')
            changed.append(salon)
        except (InvalidToken, Exception):
            pass  # already plaintext — leave as-is

    if changed:
        Salon.objects.bulk_update(changed, ['contact_number'])


class Migration(migrations.Migration):

    dependencies = [
        ('salons', '0015_encrypt_pii'),
    ]

    operations = [
        # Decrypt any encrypted rows first, then revert the column to a plain CharField
        migrations.RunPython(decrypt_contact_numbers, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='salon',
            name='contact_number',
            field=models.CharField(max_length=30, blank=True, default=''),
        ),
    ]
