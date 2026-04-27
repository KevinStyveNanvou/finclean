# scans/tasks.py

from celery import shared_task
from django.utils import timezone
from datetime import timedelta
from .models import PermanentScan, Scan
from .scan_engine import run_nmap_scan
import logging

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
def run_permanent_scan(self, permanent_scan_id):
    """
    Exécute un scan permanent — appelé par schedule_permanent_scans.
    """
    try:
        permanent_scan = PermanentScan.objects.get(id=permanent_scan_id)

        if not permanent_scan.is_active:
            logger.info(f"PermanentScan {permanent_scan_id} inactif — ignoré.")
            return "Scan inactif"

        # Créer l'entrée Scan liée au PermanentScan
        scan = Scan.objects.create(
            user=permanent_scan.user,
            permanent_scan=permanent_scan,
            name=f"{permanent_scan.name} — {timezone.now().strftime('%Y-%m-%d %H:%M')}",
            target=permanent_scan.target,
            scan_type=permanent_scan.scan_type,
            description=f"Exécution automatique toutes les {permanent_scan.frequency_hours}h",
            status="running",
            begin_at=timezone.now(),
        )

        logger.info(f"Scan {scan.scan_id} démarré pour PermanentScan {permanent_scan_id}")

        # Exécuter le scan directement (Celery worker = thread dédié, pas besoin de thread séparé)
        run_nmap_scan(scan.scan_id, permanent_scan.target, permanent_scan.scan_type)

        # Mettre à jour les timestamps
        permanent_scan.last_run = timezone.now()
        permanent_scan.next_run = permanent_scan.last_run + timedelta(hours=permanent_scan.frequency_hours)
        permanent_scan.save(update_fields=['last_run', 'next_run'])

        return f"Scan {scan.scan_id} terminé pour PermanentScan {permanent_scan_id}"

    except PermanentScan.DoesNotExist:
        logger.error(f"PermanentScan {permanent_scan_id} introuvable.")
        return "PermanentScan introuvable"

    except Exception as e:
        logger.error(f"Erreur PermanentScan {permanent_scan_id}: {str(e)}")
        # Retry automatique avec backoff exponentiel
        raise self.retry(exc=e, countdown=60 * (self.request.retries + 1))


@shared_task
def schedule_permanent_scans():
    """
    Vérifie toutes les minutes les scans permanents à exécuter.
    Planifiée par Celery Beat.
    """
    now = timezone.now()

    due_scans = PermanentScan.objects.filter(
        is_active=True,
        next_run__lte=now
    ).select_related('user')

    count = due_scans.count()

    if count == 0:
        return "Aucun scan à exécuter"

    logger.info(f"{count} scan(s) permanent(s) à lancer")

    for p_scan in due_scans:
        # Mettre à jour next_run immédiatement pour éviter les doublons
        # si Beat appelle schedule_permanent_scans deux fois de suite
        p_scan.next_run = now + timedelta(hours=p_scan.frequency_hours)
        p_scan.save(update_fields=['next_run'])

        # Envoyer la task au worker
        run_permanent_scan.delay(p_scan.id)
        logger.info(f"  → PermanentScan {p_scan.id} ({p_scan.name}) envoyé au worker")

    return f"{count} scan(s) lancé(s)"