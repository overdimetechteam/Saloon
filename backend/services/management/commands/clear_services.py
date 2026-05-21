from django.core.management.base import BaseCommand
from services.models import Service


class Command(BaseCommand):
    help = 'Delete all Service records from the database.'

    def handle(self, *args, **options):
        confirm = input(
            'Are you sure you want to delete all services? This cannot be undone.\n'
            'Type YES to confirm: '
        )
        if confirm.strip() != 'YES':
            self.stdout.write(self.style.WARNING('Operation cancelled.'))
            return
        count = Service.objects.count()
        Service.objects.all().delete()
        self.stdout.write(self.style.SUCCESS(f'Deleted {count} service(s).'))
