from django.core.management.base import BaseCommand
from django.utils import timezone
from scans.tasks import schedule_permanent_scans


class Command(BaseCommand):
    help = 'Check and schedule permanent scans that are due'

    def handle(self, *args, **options):
        schedule_permanent_scans.delay()
        self.stdout.write(self.style.SUCCESS('Permanent scans check scheduled'))