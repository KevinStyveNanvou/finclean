from django.db import models
from django.contrib.auth import get_user_model
import uuid

User = get_user_model()


# ==============================
class Scan(models.Model):
    scan_id = models.AutoField(primary_key=True, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="scans")

    # 🔥 Lien vers PermanentScan (IMPORTANT)
    permanent_scan = models.ForeignKey(
        "PermanentScan",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="scans"
    )

    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    target = models.CharField(max_length=255)
    speed = models.CharField(max_length=20, default="-T3")
    status = models.CharField(max_length=50, default="pending")
    scan_type = models.CharField(max_length=50, default="full")

    begin_at = models.DateTimeField(auto_now_add=True)
    end_at = models.DateTimeField(null=True, blank=True)
    raw_output = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Scan {self.scan_id} - {self.target}"


# ==============================
class HostInfo(models.Model):
    scan = models.OneToOneField(Scan, on_delete=models.CASCADE, related_name="host_info")

    ip_address = models.GenericIPAddressField()
    os = models.CharField(max_length=255, blank=True, null=True)
    cpe = models.CharField(max_length=255, blank=True, null=True)

    latency = models.FloatField(null=True, blank=True)

    total_ports_scanned = models.IntegerField(default=0)
    closed_ports = models.IntegerField(default=0)
    filtered_ports = models.IntegerField(default=0)
    open_ports = models.IntegerField(default=0)

    business_criticality = models.IntegerField(
        default=5,
        choices=[(i, str(i)) for i in range(1, 11)]
    )

    def __str__(self):
        return f"{self.ip_address} ({self.os})"


# ==============================
class Port(models.Model):
    scan = models.ForeignKey(Scan, on_delete=models.CASCADE, related_name="ports")
    host = models.ForeignKey(HostInfo, on_delete=models.CASCADE, related_name="ports")

    port_number = models.IntegerField()
    protocol = models.CharField(max_length=10, default="tcp")

    state = models.CharField(max_length=50)
    service = models.CharField(max_length=255, blank=True, null=True)
    version = models.TextField(blank=True, null=True)

    is_web_service = models.BooleanField(default=False)
    is_potentially_risky = models.BooleanField(default=False)

    banner = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.port_number}/{self.protocol} - {self.state}"


# ==============================
class Vulnerability(models.Model):

    SEVERITY_CHOICES = [
        ("info", "Informational"),
        ("low", "Low"),
        ("medium", "Medium"),
        ("high", "High"),
        ("critical", "Critical"),
    ]

    scan = models.ForeignKey(
        Scan,
        on_delete=models.CASCADE,
        related_name="vulnerabilities"
    )

    port = models.ForeignKey(
        Port,
        on_delete=models.CASCADE,
        related_name="vulnerabilities",
        null=True,
        blank=True
    )

    host = models.ForeignKey(
        HostInfo,
        on_delete=models.CASCADE,
        related_name="vulnerabilities"
    )

    title = models.CharField(max_length=255)
    description = models.TextField()

    severity = models.CharField(
        max_length=20,
        choices=SEVERITY_CHOICES,
        default="info"
    )

    cvss_score = models.FloatField(null=True, blank=True)
    cve_id = models.CharField(max_length=50, blank=True, null=True)

    exploit_available = models.BooleanField(default=False)
    risk_score = models.FloatField(null=True, blank=True)

    remediation = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.title} ({self.severity})"


# ==============================
class PermanentScan(models.Model):
    SCAN_TYPES = [
        ('full', 'Full Scan'),
        ('quick', 'Quick Scan'),
        ('service', 'Service Scan'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="permanent_scans")

    name = models.CharField(max_length=255)
    target = models.CharField(max_length=255)
    scan_type = models.CharField(max_length=50, choices=SCAN_TYPES, default='full')

    frequency_hours = models.PositiveIntegerField()

    is_active = models.BooleanField(default=True)

    last_run = models.DateTimeField(null=True, blank=True)
    next_run = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Permanent Scan: {self.name} - {self.target} (every {self.frequency_hours}h)"




class WebScanResult(models.Model):
    """Conteneur d'un scan web sur un (scan, host, port) donné."""

    STATUS_CHOICES = [
        ("pending",   "En attente"),
        ("running",   "En cours"),
        ("completed", "Terminé"),
        ("failed",    "Échoué"),
    ]

    id             = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    scan           = models.ForeignKey("scans.Scan", on_delete=models.CASCADE, related_name="web_scan_results")
    host           = models.ForeignKey("scans.HostInfo", on_delete=models.CASCADE, related_name="web_scan_results")
    port           = models.ForeignKey("scans.Port", on_delete=models.CASCADE, related_name="web_scan_results", null=True)
    target_url     = models.URLField(max_length=500)
    status         = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    findings_count = models.IntegerField(default=0)
    started_at     = models.DateTimeField(null=True, blank=True)
    finished_at    = models.DateTimeField(null=True, blank=True)
    created_at     = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "web_scan_results"
        ordering = ["-created_at"]

    def __str__(self):
        return f"WebScan {self.target_url} [{self.status}]"

    @property
    def duration_seconds(self):
        if self.started_at and self.finished_at:
            return (self.finished_at - self.started_at).total_seconds()
        return None


class WebFinding(models.Model):
    """Une constatation unitaire issue du scan web."""

    SEVERITY_CHOICES = [
        ("critical", "Critical"),
        ("high",     "High"),
        ("medium",   "Medium"),
        ("low",      "Low"),
        ("info",     "Info"),
    ]

    FINDING_TYPE_CHOICES = [
        ("vulnerability",    "Vulnérabilité"),
        ("misconfiguration", "Mauvaise configuration"),
        ("missing_header",   "Header manquant"),
        ("dangerous_header", "Header dangereux"),
        ("enumeration",      "Énumération"),
        ("technology",       "Technologie détectée"),
        ("cookie",           "Problème cookie"),
        ("info",             "Information"),
    ]

    SOURCE_CHOICES = [
        ("whatweb",  "WhatWeb"),
        ("nikto",    "Nikto"),
        ("gobuster", "Gobuster"),
        ("headers",  "Headers HTTP"),
        ("manual",   "Manuel"),
    ]

    id              = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    web_scan_result = models.ForeignKey(WebScanResult, on_delete=models.CASCADE, related_name="findings")
    scan            = models.ForeignKey("scans.Scan", on_delete=models.CASCADE, related_name="web_findings")
    host            = models.ForeignKey("scans.HostInfo", on_delete=models.CASCADE, related_name="web_findings")

    source          = models.CharField(max_length=20, choices=SOURCE_CHOICES)
    finding_type    = models.CharField(max_length=30, choices=FINDING_TYPE_CHOICES, default="info")
    title           = models.CharField(max_length=255)
    description     = models.TextField(blank=True)
    severity        = models.CharField(max_length=20, choices=SEVERITY_CHOICES, default="info")
    cvss_score      = models.FloatField(null=True, blank=True)
    cve_id          = models.CharField(max_length=30, null=True, blank=True, db_index=True)
    evidence        = models.CharField(max_length=500, blank=True)
    url             = models.CharField(max_length=500, blank=True)
    remediation     = models.TextField(blank=True)
    risk_score      = models.FloatField(null=True, blank=True)
    created_at      = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "web_findings"
        ordering = ["-severity", "-cvss_score", "created_at"]
        indexes  = [
            models.Index(fields=["scan", "severity"]),
            models.Index(fields=["scan", "source"]),
            models.Index(fields=["cve_id"]),
        ]

    def __str__(self):
        return f"[{self.severity.upper()}] {self.source} — {self.title[:60]}"

    @property
    def severity_order(self):
        return {"critical": 0, "high": 1, "medium": 2, "low": 3, "info": 4}.get(self.severity, 5)