from django.core.management.base import BaseCommand
from users.models import CustomUser
from services.models import Service


class Command(BaseCommand):
    help = 'Create superuser and seed 3 global services'

    def handle(self, *args, **options):
        email = 'admin@salon.com'
        if not CustomUser.objects.filter(email=email).exists():
            CustomUser.objects.create_superuser(
                email=email,
                password='admin123',
                full_name='System Admin',
            )
            self.stdout.write(self.style.SUCCESS(f'Superuser created: {email} / admin123'))
        else:
            self.stdout.write(f'Superuser already exists: {email}')

        services = [
            {'name': 'Haircut & Style', 'category': 'Hair', 'description': 'Classic haircut and styling', 'default_duration_minutes': 60, 'default_price': '25.00'},
            {'name': 'Manicure', 'category': 'Nails', 'description': 'Basic manicure with nail polish', 'default_duration_minutes': 45, 'default_price': '20.00'},
            {'name': 'Facial', 'category': 'Skin', 'description': 'Deep cleansing facial treatment', 'default_duration_minutes': 90, 'default_price': '45.00'},
        ]

        for s in services:
            obj, created = Service.objects.get_or_create(name=s['name'], defaults=s)
            if created:
                self.stdout.write(self.style.SUCCESS(f'Service created: {s["name"]}'))
            else:
                self.stdout.write(f'Service already exists: {s["name"]}')
