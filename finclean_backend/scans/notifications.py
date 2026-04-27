# scans/notifications.py
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer


def notify_scan_status(scan_id, status, extra=None):
    """Pousse une mise à jour de statut vers tous les clients connectés au scan."""
    channel_layer = get_channel_layer()
    data = {'scan_id': scan_id, 'status': status}
    if extra:
        data.update(extra)
    async_to_sync(channel_layer.group_send)(
        f'scan_{scan_id}',
        {'type': 'scan.status', 'data': data}
    )


def notify_vuln_found(scan_id, vuln_data):
    """Pousse une vulnérabilité détectée en temps réel."""
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f'scan_{scan_id}',
        {'type': 'vuln.found', 'data': vuln_data}
    )


def notify_scan_progress(scan_id, message, percent=None):
    """Pousse la progression d'un scan."""
    channel_layer = get_channel_layer()
    data = {'scan_id': scan_id, 'message': message}
    if percent is not None:
        data['percent'] = percent
    async_to_sync(channel_layer.group_send)(
        f'scan_{scan_id}',
        {'type': 'scan.progress', 'data': data}
    )