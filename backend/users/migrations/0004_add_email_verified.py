from django.db import migrations, models


def mark_existing_verified(apps, schema_editor):
    CustomUser = apps.get_model('users', 'CustomUser')
    CustomUser.objects.all().update(email_verified=True)


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0003_alter_customuser_role'),
    ]

    operations = [
        migrations.AddField(
            model_name='customuser',
            name='email_verified',
            field=models.BooleanField(default=False),
        ),
        # Mark every existing account as already verified so nothing breaks
        migrations.RunPython(mark_existing_verified, migrations.RunPython.noop),
    ]
