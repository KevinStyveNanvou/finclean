# config/celery.py
import os
from celery import Celery
from celery.schedules import crontab

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

app = Celery('finclean')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

# Beat schedule — vérifie les scans permanents toutes les minutes
app.conf.beat_schedule = {
    'schedule-permanent-scans-every-minute': {
        'task': 'scans.tasks.schedule_permanent_scans',
        'schedule': crontab(minute='*'),  # toutes les minutes
    },
}

@app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}')