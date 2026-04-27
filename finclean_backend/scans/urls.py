from django.urls import path
from .views import (
    create_scan,
    scan_status,
    export_scan_pdf,
    user_scans,
    delete_scans,
    decouverte,
    user_permanent_scans,
    create_permanent_scan,
    update_permanent_scan,
    delete_permanent_scan,
    update_business_criticalities,
    list_discovered_hosts,
)
from .vvvv import export_scan_pdf as pdf

urlpatterns = [
    path("create/", create_scan),
    path("status/", user_scans),
    path("delete/", delete_scans),
    path("decouverte/", decouverte),
    path("status/<str:scan_id>/", scan_status),
    path("status/<str:scan_id>/pdf/", pdf),
    # Permanent scans
    path("permanent/", user_permanent_scans),
    path("permanent/create/", create_permanent_scan),
    path("permanent/<int:pk>/update/", update_permanent_scan),
    path("permanent/<int:pk>/delete/", delete_permanent_scan),
    # Business criticalities
    path("criticalities/update/", update_business_criticalities),
    path("hosts/discovered/", list_discovered_hosts),
]
