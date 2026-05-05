import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('bookings', '0002_initial'),
        ('salons', '0003_salonstaff'),
    ]

    operations = [
        migrations.AddField(
            model_name='booking',
            name='staff_member',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='bookings',
                to='salons.salonstaff',
            ),
        ),
    ]
