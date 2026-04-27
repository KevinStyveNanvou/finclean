from django.urls import path
from .views import (
    AdminMetricsView,
    AdminUsersView,
    AdminUserDetailView,
    AdminEventsView,
    RiskDistributionView,
    AdminScansView,
    AdminScanDetailView
)

urlpatterns = [
    path("metrics/", AdminMetricsView.as_view()),
    path("users/", AdminUsersView.as_view()),
    path("users/<int:user_id>/", AdminUserDetailView.as_view()),
    path("events/", AdminEventsView.as_view()),
    path("risk-distribution/", RiskDistributionView.as_view()),
    path("scans/", AdminScansView.as_view()),
    path("scans/<int:scan_id>/", AdminScanDetailView.as_view()),
]