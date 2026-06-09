import os
from django.db import migrations
import utils.encryption


def encrypt_existing(apps, schema_editor):
    key = os.getenv('FIELD_ENCRYPTION_KEY', '')
    if not key:
        return
    from cryptography.fernet import Fernet
    f = Fernet(key.encode())

    def enc(val):
        if not val:
            return val
        try:
            f.decrypt(val.encode())
            return val  # already encrypted
        except Exception:
            return f.encrypt(val.encode()).decode()

    Salon = apps.get_model('salons', 'Salon')
    salons = list(Salon.objects.all())
    for salon in salons:
        salon.contact_number = enc(salon.contact_number)
    if salons:
        Salon.objects.bulk_update(salons, ['contact_number'])

    SalonStaff = apps.get_model('salons', 'SalonStaff')
    staff = list(SalonStaff.objects.all())
    for s in staff:
        s.phone = enc(s.phone)
    if staff:
        SalonStaff.objects.bulk_update(staff, ['phone'])


class Migration(migrations.Migration):

    dependencies = [
        ('salons', '0014_salon_cover_image'),
    ]

    operations = [
        migrations.AlterField(
            model_name='salon',
            name='contact_number',
            field=utils.encryption.EncryptedTextField(),
        ),
        migrations.AlterField(
            model_name='salonstaff',
            name='phone',
            field=utils.encryption.EncryptedTextField(blank=True, default=''),
        ),
        migrations.RunPython(encrypt_existing, migrations.RunPython.noop),
    ]
