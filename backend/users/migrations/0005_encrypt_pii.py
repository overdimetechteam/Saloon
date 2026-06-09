import os
from django.db import migrations
import utils.encryption


def encrypt_existing(apps, schema_editor):
    key = os.getenv('FIELD_ENCRYPTION_KEY', '')
    if not key:
        return  # Skip if key not set (local dev without key)
    from cryptography.fernet import Fernet
    f = Fernet(key.encode())

    CustomUser = apps.get_model('users', 'CustomUser')
    to_update = []
    for user in CustomUser.objects.all():
        changed = False
        if user.full_name:
            try:
                f.decrypt(user.full_name.encode())  # already encrypted
            except Exception:
                user.full_name = f.encrypt(user.full_name.encode()).decode()
                changed = True
        if user.phone:
            try:
                f.decrypt(user.phone.encode())
            except Exception:
                user.phone = f.encrypt(user.phone.encode()).decode()
                changed = True
        if changed:
            to_update.append(user)

    if to_update:
        CustomUser.objects.bulk_update(to_update, ['full_name', 'phone'])


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0004_add_email_verified'),
    ]

    operations = [
        migrations.AlterField(
            model_name='customuser',
            name='full_name',
            field=utils.encryption.EncryptedTextField(),
        ),
        migrations.AlterField(
            model_name='customuser',
            name='phone',
            field=utils.encryption.EncryptedTextField(blank=True, default=''),
        ),
        migrations.RunPython(encrypt_existing, migrations.RunPython.noop),
    ]
