"""
web_scan_engine.py  —  FinClean
================================
Module de scan web : fingerprinting, vulnérabilités, énumération, headers.

Outils orchestrés (tâches Celery parallèles) :
  1. WhatWeb    — fingerprinting (techno, CMS, versions)
  2. Nikto      — vulnérabilités web classiques (CVE, misconfig)
  3. Gobuster   — énumération répertoires & fichiers cachés
  4. Headers    — analyse sécurité HTTP (HSTS, CSP, CORS, cookies)

Déclenchement :
  - Auto depuis scan_engine.py sur chaque port WEB_PORTS détecté
  - Manuel via start_web_scan(user, target_url)
"""

import os
import re
import json
import subprocess
import threading
import requests
from logging import getLogger
from urllib.parse import urlparse

from django.utils import timezone
from django.db.models import Q
from celery import group, shared_task

from scans.models import Scan, HostInfo, Port
from scans.notifications import notify_scan_progress, notify_vuln_found
from ia.risk_engine import compute_technical_risk
from vulnerabilities.models import CVEEntry, ExploitEntry
from scans.models_web import WebScanResult, WebFinding

logger = getLogger(__name__)


# ==============================================================================
# CONSTANTES
# ==============================================================================

GOBUSTER_WORDLIST          = "/usr/share/wordlists/dirb/common.txt"
GOBUSTER_WORDLIST_FALLBACK = "/usr/share/dirb/wordlists/common.txt"
GOBUSTER_EXTENSIONS        = "php,html,txt,bak,old,zip,sql,conf,xml,json,asp,aspx,jsp"

SECURITY_HEADERS = {
    "Strict-Transport-Security": {
        "description":  "HSTS absent — force HTTPS non activé",
        "severity":     "medium",
        "remediation":  "Ajouter 'Strict-Transport-Security: max-age=31536000; includeSubDomains'.",
    },
    "X-Content-Type-Options": {
        "description":  "X-Content-Type-Options absent — MIME sniffing possible",
        "severity":     "low",
        "remediation":  "Ajouter 'X-Content-Type-Options: nosniff'.",
    },
    "X-Frame-Options": {
        "description":  "X-Frame-Options absent — clickjacking possible",
        "severity":     "medium",
        "remediation":  "Ajouter 'X-Frame-Options: DENY' ou 'SAMEORIGIN'.",
    },
    "Content-Security-Policy": {
        "description":  "Content-Security-Policy absent — XSS non mitigé",
        "severity":     "medium",
        "remediation":  "Définir une CSP adaptée. Commencer avec 'default-src self'.",
    },
    "X-XSS-Protection": {
        "description":  "X-XSS-Protection absent",
        "severity":     "low",
        "remediation":  "Ajouter 'X-XSS-Protection: 1; mode=block'.",
    },
    "Referrer-Policy": {
        "description":  "Referrer-Policy absent — fuite dans les redirections",
        "severity":     "low",
        "remediation":  "Ajouter 'Referrer-Policy: strict-origin-when-cross-origin'.",
    },
    "Permissions-Policy": {
        "description":  "Permissions-Policy absent — accès APIs sensibles non restreint",
        "severity":     "low",
        "remediation":  "Définir une Permissions-Policy restreignant caméra, micro, géoloc.",
    },
}

DANGEROUS_HEADERS = {
    "Server": {
        "description":  "Version du serveur exposée (information disclosure)",
        "severity":     "low",
        "remediation":  "Masquer la version : ServerTokens Prod (Apache) / server_tokens off (Nginx).",
    },
    "X-Powered-By": {
        "description":  "Technologie backend exposée (information disclosure)",
        "severity":     "low",
        "remediation":  "Supprimer X-Powered-By via la config serveur ou le framework.",
    },
    "X-AspNet-Version": {
        "description":  "Version ASP.NET exposée (information disclosure)",
        "severity":     "low",
        "remediation":  "Désactiver via <httpRuntime enableVersionHeader='false'> dans web.config.",
    },
}

HIGH_RISK_PATHS = {
    ".git", ".env", "config", "backup", "admin", "phpmyadmin",
    "manager", "console", "server-status", "web.config", ".htaccess",
    "wp-config.php", "phpinfo.php", ".DS_Store", "database.yml", ".svn",
}

TIMEOUTS = {"whatweb": 60, "nikto": 300, "gobuster": 180, "headers": 15}


# ==============================================================================
# UTILITAIRES
# ==============================================================================

def _build_url(ip, port_number, service):
    scheme = "https" if port_number in {443, 8443} else "http"
    if port_number in {80, 443}:
        return f"{scheme}://{ip}"
    return f"{scheme}://{ip}:{port_number}"


def _cvss_to_severity(score):
    if score is None: return "info"
    if score >= 9.0:  return "critical"
    if score >= 7.0:  return "high"
    if score >= 4.0:  return "medium"
    if score > 0.0:   return "low"
    return "info"


def _get_cve_entry(cve_id):
    try:
        return CVEEntry.objects.get(cve_id=cve_id)
    except CVEEntry.DoesNotExist:
        return None


def _has_exploit_in_db(cve_id):
    if not cve_id:
        return False
    return ExploitEntry.objects.filter(cve_codes__icontains=cve_id).exists()


def _get_wordlist():
    for wl in (GOBUSTER_WORDLIST, GOBUSTER_WORDLIST_FALLBACK):
        if os.path.exists(wl):
            return wl
    minimal = "/tmp/finclean_minimal_wordlist.txt"
    if not os.path.exists(minimal):
        with open(minimal, "w") as f:
            f.write("\n".join([
                "admin","administrator","login","wp-admin","dashboard",
                "api","api/v1","api/v2","upload","uploads","backup",
                "config","conf","test","dev","staging","phpinfo.php",
                ".git",".env","robots.txt","sitemap.xml","web.config",
                "readme.txt","README.md","CHANGELOG","server-status",
                "manager","console","phpmyadmin","dbadmin","sql",
            ]))
    return minimal


# ==============================================================================
# WHATWEB — FINGERPRINTING
# ==============================================================================

def run_whatweb(url):
    try:
        r = subprocess.run(
            ["whatweb", "--log-json=-", "--quiet", url],
            capture_output=True, text=True, timeout=TIMEOUTS["whatweb"],
        )
        output = r.stdout.strip()
        if not output:
            return None
        data = json.loads(output)
        return data[0] if isinstance(data, list) and data else data
    except FileNotFoundError:
        logger.warning("[WHATWEB] Non installé")
        return None
    except (subprocess.TimeoutExpired, json.JSONDecodeError) as e:
        logger.warning(f"[WHATWEB] {e}")
        return None
    except Exception as e:
        logger.error(f"[WHATWEB] {e}", exc_info=True)
        return None


def parse_whatweb(raw_data, url):
    findings = []
    if not raw_data:
        return findings

    plugins = raw_data.get("plugins", {})

    for plugin_name, plugin_data in plugins.items():
        versions = plugin_data.get("version", [])
        strings  = plugin_data.get("string", [])
        version_str = versions[0] if versions else None

        evidence = plugin_name
        if version_str:
            evidence += f" {version_str}"
        if strings:
            evidence += f" ({strings[0][:80]})"

        findings.append({
            "finding_type": "technology",
            "title":        f"Technologie détectée : {plugin_name}",
            "description":  evidence,
            "severity":     "info",
            "evidence":     evidence,
            "url":          url,
            "cve_id":       None,
            "cvss_score":   None,
            "remediation":  "Vérifier que cette technologie est à jour.",
        })

        # Matching CVE NVD si version connue
        if version_str and plugin_name:
            for cve in CVEEntry.objects.filter(
                Q(description__icontains=plugin_name) &
                Q(description__icontains=version_str)
            ).order_by("-cvss_v3_score")[:3]:
                score = cve.cvss_v3_score or cve.cvss_v2_score
                sev   = cve.cvss_v3_severity or _cvss_to_severity(score)
                findings.append({
                    "finding_type": "vulnerability",
                    "title":        f"{cve.cve_id} — {plugin_name} {version_str}",
                    "description":  cve.description,
                    "severity":     sev.lower() if sev else "medium",
                    "evidence":     f"Version {version_str} détectée par WhatWeb",
                    "url":          url,
                    "cve_id":       cve.cve_id,
                    "cvss_score":   score,
                    "remediation":  f"Mettre à jour {plugin_name} vers la dernière version stable.",
                })

    # Cookies détectés
    for cookie in plugins.get("Cookies", {}).get("string", []):
        findings.append({
            "finding_type": "cookie",
            "title":        f"Cookie détecté : {cookie}",
            "description":  f"Vérifier les flags Secure, HttpOnly et SameSite sur '{cookie}'.",
            "severity":     "info",
            "evidence":     f"Cookie: {cookie}",
            "url":          url,
            "cve_id":       None,
            "cvss_score":   None,
            "remediation":  "Ajouter les attributs Secure, HttpOnly et SameSite=Strict sur tous les cookies de session.",
        })

    return findings


# ==============================================================================
# NIKTO — VULNÉRABILITÉS WEB
# ==============================================================================

def run_nikto(url):
    try:
        parsed   = urlparse(url)
        host     = parsed.hostname
        port     = parsed.port or (443 if parsed.scheme == "https" else 80)
        ssl_flag = ["-ssl"] if parsed.scheme == "https" else []

        r = subprocess.run(
            ["nikto", "-h", host, "-p", str(port),
             "-Format", "json", "-nointeractive", "-Tuning", "1234578b"] + ssl_flag,
            capture_output=True, text=True, timeout=TIMEOUTS["nikto"],
        )
        output = r.stdout.strip()
        if not output:
            return None
        return json.loads(output)
    except FileNotFoundError:
        logger.warning("[NIKTO] Non installé")
        return None
    except subprocess.TimeoutExpired:
        logger.warning(f"[NIKTO] Timeout")
        return None
    except json.JSONDecodeError:
        # Fallback parsing texte
        vulns = []
        for line in r.stdout.split("\n"):
            line = line.strip().lstrip("+ ").strip()
            if line and not line.startswith(("Target", "Start", "End", "-")):
                vulns.append({"id": "NIKTO", "msg": line})
        return {"vulnerabilities": vulns}
    except Exception as e:
        logger.error(f"[NIKTO] {e}", exc_info=True)
        return None


def parse_nikto(raw_data, url):
    findings = []
    if not raw_data:
        return findings

    for vuln in raw_data.get("vulnerabilities", []):
        msg      = vuln.get("msg", "")
        osvdb    = vuln.get("references", {}).get("osvdb", "")
        url_path = vuln.get("url", "")
        if not msg:
            continue

        cve_ids = re.findall(r'CVE-\d{4}-\d+', msg)
        cve_id  = cve_ids[0] if cve_ids else None

        msg_lower = msg.lower()
        if any(w in msg_lower for w in ["remote code execution","rce","sql injection"]):
            severity = "critical"
        elif any(w in msg_lower for w in ["xss","cross-site","traversal","inclusion"]):
            severity = "high"
        elif any(w in msg_lower for w in ["disclosure","exposed","default password","outdated"]):
            severity = "medium"
        else:
            severity = "low"

        cvss_score = None
        if cve_id:
            entry = _get_cve_entry(cve_id)
            if entry:
                cvss_score = entry.cvss_v3_score or entry.cvss_v2_score
                sev = entry.cvss_v3_severity
                if sev and sev.lower() != "unknown":
                    severity = sev.lower()

        full_url = url.rstrip("/") + url_path if url_path else url

        # Remédiation heuristique
        rem = "Analyser et corriger le problème. Consulter la documentation officielle."
        if "default" in msg_lower and "password" in msg_lower:
            rem = "Changer immédiatement le mot de passe par défaut."
        elif "directory listing" in msg_lower:
            rem = "Désactiver le directory listing (Options -Indexes / autoindex off)."
        elif "xss" in msg_lower:
            rem = "Échapper toutes les entrées utilisateur. Implémenter une CSP stricte."
        elif "sql" in msg_lower:
            rem = "Utiliser des requêtes paramétrées. Auditer tous les points d'injection SQL."
        elif "backup" in msg_lower or ".bak" in msg_lower:
            rem = "Supprimer les fichiers de sauvegarde accessibles publiquement."
        elif ".git" in msg_lower:
            rem = "Bloquer l'accès aux répertoires .git et .svn via le serveur web."

        findings.append({
            "finding_type": "vulnerability",
            "title":        f"Nikto : {msg[:120]}",
            "description":  msg,
            "severity":     severity,
            "evidence":     f"OSVDB-{osvdb}" if osvdb else "Nikto",
            "url":          full_url,
            "cve_id":       cve_id,
            "cvss_score":   cvss_score,
            "remediation":  rem,
        })

    return findings


# ==============================================================================
# GOBUSTER — ÉNUMÉRATION DIRS & FICHIERS
# ==============================================================================

def run_gobuster(url):
    wordlist = _get_wordlist()
    try:
        r = subprocess.run(
            ["gobuster", "dir", "-u", url, "-w", wordlist,
             "-x", GOBUSTER_EXTENSIONS, "-t", "20", "-q", "--no-error", "-o", "-"],
            capture_output=True, text=True, timeout=TIMEOUTS["gobuster"],
        )
        return r.stdout
    except FileNotFoundError:
        # Fallback ffuf
        try:
            r = subprocess.run(
                ["ffuf", "-u", f"{url}/FUZZ", "-w", wordlist,
                 "-e", GOBUSTER_EXTENSIONS, "-t", "20", "-s",
                 "-mc", "200,201,204,301,302,307,401,403"],
                capture_output=True, text=True, timeout=TIMEOUTS["gobuster"],
            )
            return r.stdout
        except FileNotFoundError:
            logger.warning("[GOBUSTER] Ni gobuster ni ffuf installés")
            return ""
    except subprocess.TimeoutExpired:
        logger.warning(f"[GOBUSTER] Timeout")
        return ""
    except Exception as e:
        logger.error(f"[GOBUSTER] {e}", exc_info=True)
        return ""


def parse_gobuster(raw_output, url):
    findings = []
    if not raw_output:
        return findings

    for line in raw_output.strip().split("\n"):
        line = line.strip()
        if not line or line.startswith("#"):
            continue

        # Format gobuster : '/path   (Status: 200) [Size: 1234]'
        m = re.match(r'^(/[^\s]+)\s+\(Status:\s+(\d+)\)', line)
        if not m:
            # Format ffuf : '/path  [Status: 200, ...]'
            m = re.match(r'^(/\S+)\s+\[Status:\s+(\d+),', line)
        if not m:
            continue

        path   = m.group(1)
        status = int(m.group(2))
        full   = url.rstrip("/") + path

        if status == 404:
            continue

        path_lower = path.lower().strip("/")
        is_risky   = any(r in path_lower for r in HIGH_RISK_PATHS)

        if is_risky:
            sev  = "high" if status in (200, 403) else "medium"
            title = f"Ressource sensible accessible : {path}"
            rem   = "Bloquer l'accès via la config serveur. Supprimer les fichiers inutiles."
        elif status == 200:
            sev  = "medium"
            title = f"Répertoire/fichier accessible : {path}"
            rem   = "Vérifier si cette ressource doit être accessible publiquement."
        elif status == 403:
            sev  = "low"
            title = f"Accès interdit (403) : {path} — ressource existe"
            rem   = "Confirmer que les protections sur cette ressource sont suffisantes."
        elif status in (301, 302, 307):
            sev  = "info"
            title = f"Redirection ({status}) : {path}"
            rem   = "Vérifier la destination de la redirection."
        elif status == 401:
            sev  = "info"
            title = f"Zone protégée (401) : {path}"
            rem   = "Vérifier que l'authentification est robuste sur cette zone."
        else:
            continue

        findings.append({
            "finding_type": "enumeration",
            "title":        title,
            "description":  f"Gobuster/ffuf a trouvé '{full}' (HTTP {status})",
            "severity":     sev,
            "evidence":     f"HTTP {status} — {full}",
            "url":          full,
            "cve_id":       None,
            "cvss_score":   None,
            "remediation":  rem,
        })

    return findings


# ==============================================================================
# HEADERS HTTP — ANALYSE SÉCURITÉ
# ==============================================================================

def run_headers_check(url):
    import urllib3
    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
    try:
        r = requests.head(
            url, timeout=TIMEOUTS["headers"], allow_redirects=True,
            verify=False, headers={"User-Agent": "FinClean-Scanner/1.0"},
        )
        return dict(r.headers)
    except requests.exceptions.ConnectionError as e:
        logger.warning(f"[HEADERS] Connexion impossible à {url} : {e}")
        return {}
    except requests.exceptions.Timeout:
        logger.warning(f"[HEADERS] Timeout sur {url}")
        return {}
    except Exception as e:
        logger.error(f"[HEADERS] {e}", exc_info=True)
        return {}


def parse_headers(headers_dict, url):
    findings = []
    if not headers_dict:
        return findings

    headers_low = {k.lower(): v for k, v in headers_dict.items()}

    # Headers de sécurité manquants
    for name, meta in SECURITY_HEADERS.items():
        if name.lower() not in headers_low:
            findings.append({
                "finding_type": "missing_header",
                "title":        f"Header manquant : {name}",
                "description":  meta["description"],
                "severity":     meta["severity"],
                "evidence":     f"Header '{name}' absent de la réponse HTTP",
                "url":          url,
                "cve_id":       None,
                "cvss_score":   None,
                "remediation":  meta["remediation"],
            })

    # Headers dangereux présents
    for name, meta in DANGEROUS_HEADERS.items():
        if name.lower() in headers_low:
            val = headers_low[name.lower()]
            findings.append({
                "finding_type": "dangerous_header",
                "title":        f"Header exposant des infos : {name}",
                "description":  f"{meta['description']} — valeur : {val[:200]}",
                "severity":     meta["severity"],
                "evidence":     f"{name}: {val[:200]}",
                "url":          url,
                "cve_id":       None,
                "cvss_score":   None,
                "remediation":  meta["remediation"],
            })

    # CORS wildcard
    acao = headers_low.get("access-control-allow-origin", "")
    if acao == "*":
        findings.append({
            "finding_type": "misconfiguration",
            "title":        "CORS wildcard : Access-Control-Allow-Origin: *",
            "description":  "Toute origine peut accéder aux ressources de ce serveur.",
            "severity":     "high",
            "evidence":     f"Access-Control-Allow-Origin: {acao}",
            "url":          url,
            "cve_id":       None,
            "cvss_score":   7.5,
            "remediation":  "Restreindre CORS aux origines autorisées. Ne jamais utiliser '*' avec des APIs authentifiées.",
        })

    # HSTS max-age trop court
    hsts = headers_low.get("strict-transport-security", "")
    if hsts:
        m = re.search(r'max-age=(\d+)', hsts)
        if m and int(m.group(1)) < 31536000:
            findings.append({
                "finding_type": "misconfiguration",
                "title":        f"HSTS max-age trop court ({m.group(1)}s)",
                "description":  f"max-age={m.group(1)} est inférieur à 1 an (31536000s).",
                "severity":     "low",
                "evidence":     f"Strict-Transport-Security: {hsts}",
                "url":          url,
                "cve_id":       None,
                "cvss_score":   None,
                "remediation":  "Augmenter max-age à 31536000. Ajouter includeSubDomains; preload.",
            })

    # Cookies sans flags
    for k, v in headers_dict.items():
        if k.lower() != "set-cookie":
            continue
        cname = v.split("=")[0].strip()
        missing = [f for f in ("Secure", "HttpOnly", "SameSite") if f not in v]
        if missing:
            findings.append({
                "finding_type": "cookie",
                "title":        f"Cookie '{cname}' — flags manquants : {', '.join(missing)}",
                "description":  f"Cookie sans attributs de sécurité : {', '.join(missing)}.",
                "severity":     "medium" if "Secure" in missing or "HttpOnly" in missing else "low",
                "evidence":     f"Set-Cookie: {v[:200]}",
                "url":          url,
                "cve_id":       None,
                "cvss_score":   None,
                "remediation":  f"Ajouter les flags {', '.join(missing)} sur le cookie '{cname}'.",
            })

    return findings


# ==============================================================================
# TÂCHES CELERY
# ==============================================================================

@shared_task(bind=True, max_retries=2, default_retry_delay=30)
def task_whatweb(self, web_scan_result_id, url):
    try:
        wr = WebScanResult.objects.get(id=web_scan_result_id)
        _save_findings(wr, parse_whatweb(run_whatweb(url), url), "whatweb")
    except Exception as e:
        logger.error(f"[TASK WHATWEB] {e}", exc_info=True)
        raise self.retry(exc=e)


@shared_task(bind=True, max_retries=1, default_retry_delay=60)
def task_nikto(self, web_scan_result_id, url):
    try:
        wr = WebScanResult.objects.get(id=web_scan_result_id)
        _save_findings(wr, parse_nikto(run_nikto(url), url), "nikto")
    except Exception as e:
        logger.error(f"[TASK NIKTO] {e}", exc_info=True)
        raise self.retry(exc=e)


@shared_task(bind=True, max_retries=2, default_retry_delay=30)
def task_gobuster(self, web_scan_result_id, url):
    try:
        wr = WebScanResult.objects.get(id=web_scan_result_id)
        _save_findings(wr, parse_gobuster(run_gobuster(url), url), "gobuster")
    except Exception as e:
        logger.error(f"[TASK GOBUSTER] {e}", exc_info=True)
        raise self.retry(exc=e)


@shared_task(bind=True, max_retries=3, default_retry_delay=10)
def task_headers(self, web_scan_result_id, url):
    try:
        wr = WebScanResult.objects.get(id=web_scan_result_id)
        _save_findings(wr, parse_headers(run_headers_check(url), url), "headers")
    except Exception as e:
        logger.error(f"[TASK HEADERS] {e}", exc_info=True)
        raise self.retry(exc=e)


def _save_findings(web_result, findings_list, source):
    """Persiste les WebFinding en base et notifie via WebSocket."""
    scan = web_result.scan
    host = web_result.host

    for f in findings_list:
        cvss = f.get("cvss_score") or 0.0
        risk_score = compute_technical_risk(
            cvss=cvss,
            exploit_available=_has_exploit_in_db(f.get("cve_id")),
            verified=(source == "nikto" and f.get("cve_id") is not None),
            remote=True,
            criticality=getattr(host, "business_criticality", 1.0),
        )

        WebFinding.objects.create(
            web_scan_result=web_result,
            scan=scan,
            host=host,
            source=source,
            finding_type=f.get("finding_type", "info"),
            title=f.get("title", "")[:255],
            description=f.get("description", ""),
            severity=f.get("severity", "info"),
            cvss_score=f.get("cvss_score"),
            cve_id=f.get("cve_id"),
            evidence=f.get("evidence", "")[:500],
            url=f.get("url", "")[:500],
            remediation=f.get("remediation", ""),
            risk_score=risk_score,
        )

        if f.get("severity") in ("critical", "high", "medium"):
            notify_vuln_found(scan.scan_id, {
                "type":     "web_finding",
                "source":   source,
                "title":    f.get("title", ""),
                "severity": f.get("severity"),
                "url":      f.get("url", ""),
                "cve_id":   f.get("cve_id"),
            })


# ==============================================================================
# ORCHESTRATEUR PRINCIPAL
# ==============================================================================

def run_web_scan(scan_id, host_id, port_id):
    """
    Orchestrateur : lance les 4 sous-tâches Celery en parallèle (group()).
    Appelé automatiquement depuis scan_engine.py sur chaque port WEB_PORTS.
    """
    try:
        scan = Scan.objects.get(scan_id=scan_id)
        host = HostInfo.objects.get(id=host_id)
        port = Port.objects.get(id=port_id)

        url = _build_url(host.ip_address, port.port_number, port.service)
        logger.info(f"[WEB SCAN] Démarrage sur {url}")

        web_result = WebScanResult.objects.create(
            scan=scan, host=host, port=port,
            target_url=url, status="running",
            started_at=timezone.now(),
        )

        notify_scan_progress(scan_id, {
            "step":    "web_scan_started",
            "url":     url,
            "port":    port.port_number,
            "service": port.service,
        })

        # Lancer les 4 tâches en parallèle
        job    = group(
            task_whatweb.s(web_result.id, url),
            task_nikto.s(web_result.id, url),
            task_gobuster.s(web_result.id, url),
            task_headers.s(web_result.id, url),
        )
        result = job.apply_async()

        # Callback non-bloquant pour marquer completed
        def _finalize():
            try:
                result.join(timeout=600, propagate=False)
                total = WebFinding.objects.filter(web_scan_result=web_result).count()
                web_result.status        = "completed"
                web_result.finished_at   = timezone.now()
                web_result.findings_count = total
                web_result.save()
                logger.info(f"[WEB SCAN] Terminé — {total} finding(s) sur {url}")
                notify_scan_progress(scan_id, {
                    "step":           "web_scan_completed",
                    "url":            url,
                    "total_findings": total,
                })
            except Exception as e:
                web_result.status = "failed"
                web_result.save()
                logger.error(f"[WEB SCAN] Erreur callback : {e}", exc_info=True)

        threading.Thread(target=_finalize, daemon=True).start()
        return web_result.id

    except Exception as e:
        logger.error(f"[WEB SCAN] Erreur inattendue : {e}", exc_info=True)
        return None


def start_web_scan(user, target_url, scan_id=None):
    """Point d'entrée manuel : lancer un scan web sur une URL directement."""
    parsed = urlparse(target_url)
    ip     = parsed.hostname
    port_n = parsed.port or (443 if parsed.scheme == "https" else 80)

    if scan_id:
        scan = Scan.objects.get(scan_id=scan_id)
    else:
        scan = Scan.objects.create(
            user=user, name=f"Web Scan {target_url}",
            target=ip, description=f"Scan web sur {target_url}",
            status="running", scan_type="web", begin_at=timezone.now(),
        )

    host, _ = HostInfo.objects.get_or_create(
        scan=scan, ip_address=ip,
        defaults={"os": None, "cpe": None, "latency": None, "open_ports": 1},
    )
    port, _ = Port.objects.get_or_create(
        scan=scan, host=host, port_number=port_n,
        defaults={
            "protocol": "tcp", "state": "open",
            "service":  "https" if parsed.scheme == "https" else "http",
            "version":  None, "is_web_service": True,
            "is_potentially_risky": False,
        },
    )

    web_result_id = run_web_scan(scan.scan_id, host.id, port.id)
    logger.info(f"[WEB SCAN] Lancé — {target_url} — web_result_id={web_result_id}")
    return scan.scan_id