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
            return val
        except Exception:
            return f.encrypt(val.encode()).decode()

    Booking = apps.get_model('bookings', 'Booking')
    bookings = list(Booking.objects.all())
    for b in bookings:
        b.home_visit_address = enc(b.home_visit_address)
        b.notes = enc(b.notes)
    if bookings:
        Booking.objects.bulk_update(bookings, ['home_visit_address', 'notes'])


class Migration(migrations.Migration):

    dependencies = [
        ('bookings', '0008_booking_staff_member_to_staffmember'),
    ]

    operations = [
        migrations.AlterField(
            model_name='booking',
            name='home_visit_address',
            field=utils.encryption.EncryptedTextField(blank=True, default=''),
        ),
        migrations.AlterField(
            model_name='booking',
            name='notes',
            field=utils.encryption.EncryptedTextField(blank=True, default=''),
        ),
        migrations.RunPython(encrypt_existing, migrations.RunPython.noop),
    ]
