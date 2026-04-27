# scans/routing.py
from django.urls import re_path
from scans import consumers

websocket_urlpatterns = [
    re_path(r'ws/scans/(?P<scan_id>\d+)/$', consumers.ScanConsumer.as_asgi()),
]