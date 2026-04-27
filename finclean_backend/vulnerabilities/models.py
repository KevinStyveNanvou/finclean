# vulnerabilities/models.py
from django.db import models

class Vulnerabilite(models.Model):
    """Modèle principal pour une CVE."""
    id = models.CharField(max_length=20, primary_key=True)  # CVE-ID
    source_identifier = models.CharField(max_length=100, blank=True, null=True)
    published_date = models.DateTimeField(blank=True, null=True)
    last_modified_date = models.DateTimeField(blank=True, null=True)
    vuln_status = models.CharField(max_length=50, blank=True, null=True)
    description_en = models.TextField(blank=True, null=True)
    description_fr = models.TextField(blank=True, null=True)

    # Métriques CVSS v2
    base_score_v2 = models.DecimalField(max_digits=3, decimal_places=1, blank=True, null=True)
    severity_v2 = models.CharField(max_length=20, blank=True, null=True)
    vector_string_v2 = models.CharField(max_length=100, blank=True, null=True)

    # Métriques CVSS v3
    base_score_v3 = models.DecimalField(max_digits=3, decimal_places=1, blank=True, null=True)
    severity_v3 = models.CharField(max_length=20, blank=True, null=True)
    vector_string_v3 = models.CharField(max_length=100, blank=True, null=True)
    exploitability_score_v3 = models.DecimalField(max_digits=3, decimal_places=1, blank=True, null=True)
    impact_score_v3 = models.DecimalField(max_digits=3, decimal_places=1, blank=True, null=True)

    class Meta:
        verbose_name = "Vulnérabilité"
        verbose_name_plural = "Vulnérabilités"
        indexes = [
            models.Index(fields=['id']),
            models.Index(fields=['published_date']),
        ]

    def __str__(self):
        return self.id


class FaiblesseCWE(models.Model):
    """Modèle pour les faiblesses CWE associées."""
    cve = models.ForeignKey(Vulnerabilite, on_delete=models.CASCADE, related_name='faiblesses')
    cwe_id = models.CharField(max_length=20)

    class Meta:
        verbose_name = "Faiblesse CWE"
        verbose_name_plural = "Faiblesses CWE"

    def __str__(self):
        return f"{self.cve_id} - {self.cwe_id}"


class Reference(models.Model):
    """Modèle pour les références externes."""
    cve = models.ForeignKey(Vulnerabilite, on_delete=models.CASCADE, related_name='references')
    url = models.URLField(max_length=2000)  # Les URL peuvent être longues
    source = models.CharField(max_length=100, blank=True, null=True)
    tags = models.JSONField(default=list, blank=True, null=True)  # Utilise JSONField pour les tags

    class Meta:
        verbose_name = "Référence"
        verbose_name_plural = "Références"

    def __str__(self):
        return f"{self.cve_id} - {self.url[:50]}"


class Configuration(models.Model):
    """Modèle pour les configurations de produits vulnérables."""
    cve = models.ForeignKey(Vulnerabilite, on_delete=models.CASCADE, related_name='configurations')
    criteria = models.TextField()  # Le CPE
    version_start_incl = models.CharField(max_length=50, blank=True, null=True)
    version_start_excl = models.CharField(max_length=50, blank=True, null=True)
    version_end_incl = models.CharField(max_length=50, blank=True, null=True)
    version_end_excl = models.CharField(max_length=50, blank=True, null=True)
    vulnerable = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Configuration"
        verbose_name_plural = "Configurations"
        indexes = [
            models.Index(fields=['criteria']),
        ]

    def __str__(self):
        return f"{self.cve_id} - {self.criteria}"


# ==============================
# CVE NVD — Base nationale des vulnérabilités
class CVEEntry(models.Model):

    SEVERITY_CHOICES = [
        ("none", "None"),
        ("low", "Low"),
        ("medium", "Medium"),
        ("high", "High"),
        ("critical", "Critical"),
        ("unknown", "Unknown"),
    ]

    cve_id = models.CharField(max_length=30, unique=True, db_index=True)
    description = models.TextField(blank=True, default='')
    published = models.DateTimeField(null=True, blank=True)
    last_modified = models.DateTimeField(null=True, blank=True)

    # CVSS v3 (prioritaire)
    cvss_v3_score = models.FloatField(null=True, blank=True)
    cvss_v3_vector = models.CharField(max_length=100, blank=True, default='')
    cvss_v3_severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES, default='unknown')

    # CVSS v2 (fallback pour anciens CVE)
    cvss_v2_score = models.FloatField(null=True, blank=True)
    cvss_v2_severity = models.CharField(max_length=20, blank=True, default='')

    # CWE
    cwe_ids = models.CharField(max_length=255, blank=True, default='')

    # CPE (produits affectés) — stocké en JSON texte
    affected_products = models.TextField(blank=True, default='')

    # Références
    references = models.TextField(blank=True, default='')

    # Lien avec Exploit-DB (rempli après import Exploit-DB)
    has_exploit = models.BooleanField(default=False)

    class Meta:
        ordering = ['-published']
        indexes = [
            models.Index(fields=['cvss_v3_severity']),
            models.Index(fields=['published']),
            models.Index(fields=['has_exploit']),
        ]

    def __str__(self):
        return f"{self.cve_id} — CVSS {self.cvss_v3_score or self.cvss_v2_score or 'N/A'}"


# ==============================
# Exploit-DB — Base des exploits publics
class ExploitEntry(models.Model):

    exploit_id = models.IntegerField(unique=True, db_index=True)
    file_path = models.CharField(max_length=255, blank=True, default='')
    description = models.TextField(blank=True, default='')
    date_published = models.DateField(null=True, blank=True)
    date_added = models.DateField(null=True, blank=True)
    date_updated = models.DateField(null=True, blank=True)
    author = models.CharField(max_length=255, blank=True, default='')
    exploit_type = models.CharField(max_length=100, blank=True, default='')
    platform = models.CharField(max_length=100, blank=True, default='')
    port = models.CharField(max_length=20, blank=True, default='')
    verified = models.BooleanField(default=False)
    tags = models.CharField(max_length=255, blank=True, default='')

    # CVE liés extraits du champ codes (ex: "CVE-2009-3699;OSVDB-58726")
    cve_codes = models.CharField(max_length=500, blank=True, default='')

    source_url = models.URLField(max_length=500, blank=True, default='')

    class Meta:
        ordering = ['-date_published']
        indexes = [
            models.Index(fields=['platform']),
            models.Index(fields=['exploit_type']),
            models.Index(fields=['date_published']),
        ]

    def __str__(self):
        return f"EDB-{self.exploit_id} — {self.description[:60]}"


# ==============================
# CVE NVD — Base nationale des vulnérabilités
class CVEEntry(models.Model):

    SEVERITY_CHOICES = [
        ("info", "Info"),
        ("low", "Low"),
        ("medium", "Medium"),
        ("high", "High"),
        ("critical", "Critical"),
        ("unknown", "Unknown"),
    ]

    cve_id = models.CharField(max_length=30, unique=True, db_index=True)
    description = models.TextField(blank=True, default='')
    published = models.DateTimeField(null=True, blank=True)
    last_modified = models.DateTimeField(null=True, blank=True)

    # CVSS v3 (prioritaire)
    cvss_v3_score = models.FloatField(null=True, blank=True)
    cvss_v3_vector = models.CharField(max_length=100, blank=True, default='')
    cvss_v3_severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES, default='unknown')

    # CVSS v2 (fallback pour anciens CVE)
    cvss_v2_score = models.FloatField(null=True, blank=True)
    cvss_v2_severity = models.CharField(max_length=20, blank=True, default='')

    # CWE
    cwe_ids = models.CharField(max_length=255, blank=True, default='')

    # CPE (produits affectés) — stocké en JSON texte
    affected_products = models.TextField(blank=True, default='')

    # Références
    references = models.TextField(blank=True, default='')

    # Lien avec Exploit-DB (rempli après import Exploit-DB)
    has_exploit = models.BooleanField(default=False)

    class Meta:
        ordering = ['-published']
        indexes = [
            models.Index(fields=['cvss_v3_severity']),
            models.Index(fields=['published']),
            models.Index(fields=['has_exploit']),
        ]

    def __str__(self):
        return f"{self.cve_id} — CVSS {self.cvss_v3_score or self.cvss_v2_score or 'N/A'}"


# ==============================
# Exploit-DB — Base des exploits publics
class ExploitEntry(models.Model):

    exploit_id = models.IntegerField(unique=True, db_index=True)
    file_path = models.CharField(max_length=255, blank=True, default='')
    description = models.TextField(blank=True, default='')
    date_published = models.DateField(null=True, blank=True)
    date_added = models.DateField(null=True, blank=True)
    date_updated = models.DateField(null=True, blank=True)
    author = models.CharField(max_length=255, blank=True, default='')
    exploit_type = models.CharField(max_length=100, blank=True, default='')
    platform = models.CharField(max_length=100, blank=True, default='')
    port = models.CharField(max_length=20, blank=True, default='')
    verified = models.BooleanField(default=False)
    tags = models.CharField(max_length=255, blank=True, default='')

    # CVE liés extraits du champ codes (ex: "CVE-2009-3699;OSVDB-58726")
    cve_codes = models.CharField(max_length=500, blank=True, default='')

    source_url = models.URLField(max_length=500, blank=True, default='')

    class Meta:
        ordering = ['-date_published']
        indexes = [
            models.Index(fields=['platform']),
            models.Index(fields=['exploit_type']),
            models.Index(fields=['date_published']),
        ]

    def __str__(self):
        return f"EDB-{self.exploit_id} — {self.description[:60]}"