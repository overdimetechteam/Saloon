from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('inventory', '0006_encrypt_pii_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='grnitem',
            name='expiry_date',
            field=models.DateField(blank=True, null=True),
        ),
    ]
