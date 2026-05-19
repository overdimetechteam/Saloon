from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('salons', '0011_add_cosmetics_enabled'),
    ]

    operations = [
        migrations.AddField(
            model_name='salon',
            name='color_palette',
            field=models.CharField(
                choices=[('teal', 'Teal'), ('purple', 'Purple'), ('olive', 'Olive')],
                default='teal',
                max_length=20,
            ),
        ),
    ]
