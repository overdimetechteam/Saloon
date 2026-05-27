from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('bookings', '0007_home_visit_address'),
        ('staff', '0002_staffmember_home_visit_available_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='booking',
            name='staff_member',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='bookings',
                to='staff.staffmember',
            ),
        ),
    ]
