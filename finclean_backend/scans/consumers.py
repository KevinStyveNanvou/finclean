# scans/consumers.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from rest_framework_simplejwt.tokens import AccessToken
from django.contrib.auth import get_user_model

User = get_user_model()


class ScanConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer pour les mises à jour temps réel des scans.
    URL: ws://localhost:8000/ws/scans/<scan_id>/
    """

    async def connect(self):
        self.scan_id = self.scope['url_route']['kwargs']['scan_id']
        self.room_group_name = f'scan_{self.scan_id}'

        # Authentification JWT depuis le cookie ou query param
        user = await self.get_user_from_scope()
        if user is None:
            await self.close(code=4001)
            return

        self.user = user

        # Rejoindre le groupe Redis du scan
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

        # Envoyer l'état actuel du scan immédiatement
        scan_data = await self.get_scan_status()
        if scan_data:
            await self.send(text_data=json.dumps({
                'type': 'scan.status',
                'data': scan_data
            }))

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        """Reçoit un message du frontend — pas utilisé pour les scans."""
        pass

    # ── Handlers des événements Redis → WebSocket ──────────────────────────

    async def scan_status(self, event):
        """Reçoit scan.status depuis Redis et l'envoie au frontend."""
        await self.send(text_data=json.dumps({
            'type': 'scan.status',
            'data': event['data']
        }))

    async def scan_progress(self, event):
        """Reçoit scan.progress depuis Redis."""
        await self.send(text_data=json.dumps({
            'type': 'scan.progress',
            'data': event['data']
        }))

    async def vuln_found(self, event):
        """Reçoit vuln.found depuis Redis."""
        await self.send(text_data=json.dumps({
            'type': 'vuln.found',
            'data': event['data']
        }))

    # ── Helpers ────────────────────────────────────────────────────────────

    @database_sync_to_async
    def get_user_from_scope(self):
        """Authentifie l'utilisateur via JWT (cookie ou query param)."""
        try:
            # Essayer depuis les cookies
            cookies = {}
            headers = dict(self.scope.get('headers', []))
            cookie_header = headers.get(b'cookie', b'').decode()
            for part in cookie_header.split(';'):
                if '=' in part:
                    k, v = part.strip().split('=', 1)
                    cookies[k.strip()] = v.strip()

            token = cookies.get('access_token')

            # Fallback : query param ?token=...
            if not token:
                query_string = self.scope.get('query_string', b'').decode()
                for param in query_string.split('&'):
                    if param.startswith('token='):
                        token = param.split('=', 1)[1]
                        break

            if not token:
                return None

            validated = AccessToken(token)
            user_id = validated['user_id']
            return User.objects.get(id=user_id)

        except Exception:
            return None

    @database_sync_to_async
    def get_scan_status(self):
        """Retourne l'état actuel du scan depuis la DB."""
        try:
            from scans.models import Scan
            scan = Scan.objects.get(scan_id=self.scan_id, user=self.user)
            return {
                'scan_id': scan.scan_id,
                'status': scan.status,
                'target': scan.target,
                'begin_at': str(scan.begin_at),
                'end_at': str(scan.end_at) if scan.end_at else None,
            }
        except Exception:
            return None