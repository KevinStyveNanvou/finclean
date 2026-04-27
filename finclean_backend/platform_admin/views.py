from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .permissions import IsPlatformAdmin
from .serializers import AdminUserSerializer
from scans.models import Scan  # Assurez-vous que votre modèle Scan existe
from scans.serializers import ScanSerializer as ScanSerializerModel
from logging import getLogger
User = get_user_model()

# -----------------------------
# METRICS
# -----------------------------
class AdminMetricsView(APIView):
    permission_classes = [IsPlatformAdmin]

    def get(self, request):
        users_count = User.objects.count()
        scans_count = Scan.objects.count()
        vulnerabilities_count = Scan.objects.filter(vulnerabilities__isnull=False).count()
        alerts_count = Scan.objects.filter(status='alert').count()

        metrics = {
            "users": users_count,
            "scans": scans_count,
            "vulnerabilities": vulnerabilities_count,
            "alerts": alerts_count
        }

        return Response(metrics)


# -----------------------------
# USERS
# -----------------------------
class AdminUsersView(APIView):
    permission_classes = [IsPlatformAdmin]

    def get(self, request):
        users = User.objects.all().order_by("-date_joined")
        serializer = AdminUserSerializer(users, many=True)
        return Response(serializer.data)


class AdminUserDetailView(APIView):
    permission_classes = [IsPlatformAdmin]

    def get(self, request, user_id):
        user = get_object_or_404(User, id=user_id)
        serializer = AdminUserSerializer(user)
        return Response(serializer.data)

    def delete(self, request, user_id):
        user = get_object_or_404(User, id=user_id)
        user.delete()
        return Response({"message": "User deleted"}, status=status.HTTP_204_NO_CONTENT)

    def patch(self, request, user_id):
        user = get_object_or_404(User, id=user_id)
        role = request.data.get("role")
        if role not in ["analyst", "auditor", "admin"]:
            return Response({"error": "Invalid role"}, status=status.HTTP_400_BAD_REQUEST)
        user.role = role
        user.save()
        serializer = AdminUserSerializer(user)
        return Response(serializer.data)


# -----------------------------
# SCANS
# -----------------------------
class AdminScansView(APIView):
    permission_classes = [IsPlatformAdmin]

    def get(self, request):
        """
        Optional query params: sort_by=name/target/user
        """
        sort_by = request.query_params.get("sort_by")
        valid_sort_fields = {"name", "target", "user"}
        if sort_by not in valid_sort_fields:
            sort_by = "scan_id"

        scans = Scan.objects.all().select_related("user").select_related("permanent_scan").order_by(sort_by)
        serializer = ScanSerializerModel(scans, many=True)

        return Response(serializer.data)


class AdminScanDetailView(APIView):
    permission_classes = [IsPlatformAdmin]

    def get(self, request, scan_id):
        scan = get_object_or_404(Scan, scan_id=scan_id)
        serializer = ScanSerializerModel(scan)
        return Response(serializer.data)

    def delete(self, request, scan_id):
        scan = get_object_or_404(Scan, scan_id=scan_id)
        scan.delete()
        return Response({"message": "Scan deleted"}, status=status.HTTP_204_NO_CONTENT)


# -----------------------------
# RISK DISTRIBUTION
# -----------------------------
class RiskDistributionView(APIView):
    permission_classes = [IsPlatformAdmin]

    def get(self, request):
        data = {
            "critical": Scan.objects.filter(risk_score__gte=90).count(),
            "high": Scan.objects.filter(risk_score__gte=70, risk_score__lt=90).count(),
            "medium": Scan.objects.filter(risk_score__gte=40, risk_score__lt=70).count(),
            "low": Scan.objects.filter(risk_score__lt=40).count()
        }
        return Response(data)


# -----------------------------
# PLATFORM EVENTS / ALERTS
# -----------------------------
class AdminEventsView(APIView):
    permission_classes = [IsPlatformAdmin]

    def get(self, request):
        events = [
            {"type": "scan_out_of_scope", "message": "User attempted scanning external network"},
            {"type": "suspicious_activity", "message": "Multiple scans triggered in short period"},
        ]
        return Response(events)