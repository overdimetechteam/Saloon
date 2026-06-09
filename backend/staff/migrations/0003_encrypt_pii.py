import os
from django.db import migrations
import utils.encryption


def encrypt_existing(apps, schema_editor):
    key = os.getenv('FIELD_ENCRYPTION_KEY', '')
    if not key:
        return
    from cryptography.fernet import Fernet
    f = Fernet(key.encode())

    StaffMember = apps.get_model('staff', 'StaffMember')
    members = list(StaffMember.objects.all())
    for m in members:
        if m.phone:
            try:
                f.decrypt(m.phone.encode())
            except Exception:
                m.phone = f.encrypt(m.phone.encode()).decode()
    if members:
        StaffMember.objects.bulk_update(members, ['phone'])


class Migration(migrations.Migration):

    dependencies = [
        ('staff', '0002_staffmember_home_visit_available_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='staffmember',
            name='phone',
            field=utils.encryption.EncryptedTextField(blank=True, default=''),
        ),
        migrations.RunPython(encrypt_existing, migrations.RunPython.noop),
    ]
