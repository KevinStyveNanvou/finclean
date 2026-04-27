import os
import subprocess
import threading
import re
import socket
import ipaddress
from logging import getLogger
import re
from django.utils import timezone
from django.db.models import Q

from scans.models import Scan, HostInfo, Port, Vulnerability
from scans.notifications import notify_scan_status, notify_vuln_found, notify_scan_progress
from ia.risk_engine import compute_technical_risk
from vulnerabilities.models import CVEEntry, ExploitEntry

logger = getLogger(__name__)


# ==============================================================================
# CONSTANTES
# ==============================================================================

WEB_PORTS = {80, 443, 3000, 3001, 5500,5432, 8080, 8180, 8443, 8000, 8888}

RISKY_PORTS = {
    21, 23, 25, 53, 111, 135, 139, 445, 512, 513, 514,
    902, 912, 1099, 1524, 2049, 5432, 5900, 6000, 6667, 6697, 8787
}

REMEDIATION_MAP = {
    'ftp':        "Désactiver FTP et utiliser SFTP/FTPS. Mettre à jour vsftpd vers la dernière version stable.",
    'ssh':        "Mettre à jour OpenSSH. Désactiver l'auth par mot de passe, utiliser les clés SSH.",
    'telnet':     "Désactiver Telnet immédiatement et remplacer par SSH.",
    'smtp':       "Mettre à jour le serveur SMTP. Désactiver les relais ouverts.",
    'http':       "Mettre à jour le serveur web. Appliquer les patches de sécurité disponibles.",
    'ssl':        "Mettre à jour OpenSSL. Désactiver SSLv3/TLSv1.0. Utiliser TLS 1.2+ uniquement.",
    'smb':        "Appliquer les patches Microsoft critiques. Désactiver SMBv1.",
    'netbios':    "Désactiver NetBIOS si non utilisé. Appliquer les patches Samba disponibles.",
    'vnc':        "Sécuriser VNC avec un mot de passe fort ou désactiver si non nécessaire.",
    'irc':        "Désactiver UnrealIRCd ou mettre à jour vers une version non compromise.",
    'java-rmi':   "Restreindre l'accès RMI par firewall. Désactiver le chargement de classes distantes.",
    'drb':        "Restreindre Ruby DRb par firewall. Ne pas exposer sur des réseaux non fiables.",
    'ajp13':      "Désactiver le connecteur AJP si non utilisé (CVE-2020-1938 Ghostcat).",
    'mysql':      "Restreindre l'accès MySQL au localhost. Mettre à jour vers une version supportée.",
    'postgresql': "Configurer pg_hba.conf. Restreindre l'accès réseau si non nécessaire.",
    'bindshell':  "Fermer immédiatement ce shell root. Réinstaller le système compromis.",
    'nfs':        "Restreindre les exports NFS. Vérifier /etc/exports. Désactiver si non utilisé.",
}

# Scripts qui ne font que lister des CVE (source 2 uniquement, jamais script_vuln)
_LISTING_SCRIPTS = {'vulners'}

# Scripts confirmés vulnérables même sans mot "VULNERABLE" dans leur output
_ALWAYS_VULN_SCRIPTS = {'irc-unrealircd-backdoor', 'rmi-vuln-classloader'}

# Scores par défaut pour les scripts sans CVE ID
_SCRIPT_DEFAULT_SCORES = {
    'rmi-vuln-classloader':   (9.8, 'critical'),
    'ssl-dh-params':          (5.3, 'medium'),
    'http-slowloris-check':   (7.5, 'high'),
    'irc-unrealircd-backdoor': (10.0, 'critical'),
}


# ==============================================================================
# UTILITAIRES
# ==============================================================================

def _cvss_to_severity(score):
    if score is None:
        return "info"
    if score >= 9.0:
        return "critical"
    if score >= 7.0:
        return "high"
    if score >= 4.0:
        return "medium"
    if score > 0.0:
        return "low"
    return "info"


def _get_remediation_hint(cve_id, service):
    service_lower = (service or '').lower()
    for keyword, hint in REMEDIATION_MAP.items():
        if keyword in service_lower:
            return hint
    return (
        f"Appliquer les patches de sécurité disponibles pour {cve_id}. "
        f"Consulter le bulletin NVD : https://nvd.nist.gov/vuln/detail/{cve_id}"
    )


def _get_cve_entry(cve_id):
    try:
        return CVEEntry.objects.get(cve_id=cve_id)
    except CVEEntry.DoesNotExist:
        return None


def _has_exploit_in_db(cve_id):
    return ExploitEntry.objects.filter(cve_codes__icontains=cve_id).exists()


# ==============================================================================
# DÉCOUVERTE RÉSEAU
# ==============================================================================

def get_local_subnet():
    try:
        host_ip = socket.gethostbyname("host.docker.internal")
    except socket.gaierror:
        hostname = socket.gethostname()
        host_ip = socket.gethostbyname(hostname)
    network = str(ipaddress.ip_network(host_ip + '/24', strict=False))
    logger.info(f"[DISCOVERY] Subnet détecté : {network}")
    return network


def run_discovery_scan(scan_id):
    try:
        scan = Scan.objects.get(scan_id=scan_id)
        subnet = get_local_subnet()
        logger.info(f"[DISCOVERY] Lancement nmap -sn {subnet}")
        process = subprocess.run(
            ["nmap", "-sn", subnet],
            capture_output=True, text=True, timeout=600
        )
        raw_output = process.stdout
        scan.raw_output = raw_output
        scan.status = "completed"
        scan.end_at = timezone.now()
        scan.save()

        host_lines = re.findall(r'Nmap scan report for (.+)', raw_output)
        hosts_created = 0
        for line in host_lines:
            ip_match = re.search(r'\(?(\d+\.\d+\.\d+\.\d+)\)?', line)
            ip = ip_match.group(1) if ip_match else None
            if ip:
                HostInfo.objects.create(
                    scan=scan, ip_address=ip,
                    os=None, cpe=None, latency=None, open_ports=0
                )
                hosts_created += 1
        logger.info(f"[DISCOVERY] {hosts_created} hôte(s) découvert(s) sur {subnet}")

    except Exception as e:
        logger.error(f"[DISCOVERY] Erreur scan {scan_id} : {e}", exc_info=True)
        try:
            scan = Scan.objects.get(scan_id=scan_id)
            scan.status = "failed"
            scan.save()
        except Exception:
            pass


def start_discovery_scan(user):
    subnet = get_local_subnet()
    scan = Scan.objects.create(
        user=user,
        name=f"Discovery Scan {subnet}",
        target=subnet,
        description="Automatic network discovery",
        status="running",
        begin_at=timezone.now(),
    )
    thread = threading.Thread(
        target=run_discovery_scan, args=(scan.scan_id,), daemon=True
    )
    thread.start()
    return scan.scan_id


# ==============================================================================
# PARSER NMAP
# ==============================================================================

def _extract_port_cpes(port_block):
    return re.findall(r'(cpe:/[^\s|\n]+)', port_block)


def _extract_script_vulns(port_block):
    """
    Extrait les vulnérabilités confirmées par les scripts Nmap.

    Gère 3 formats du fichier texte_brute.txt Metasploitable2 :
      1. Ligne unique |_ : '|_irc-unrealircd-backdoor: Looks like trojaned...'
      2. Bloc multi-lignes : '| script-name:' ... 'VULNERABLE' ... 'State:'
      3. Scripts sans CVE : rmi-vuln-classloader (RCE sans CVE ID)

    Filtre automatiquement :
      - Les scripts listeurs purs (vulners)
      - Les 'NOT VULNERABLE'
    """
    vulns = []
    seen_scripts = set()

    # --- FORMAT 1 : ligne unique |_script: message ---
    for m in re.finditer(r'\|_\s*([\w\-]+):\s*(.+)', port_block):
        script_name = m.group(1)
        content     = m.group(2).strip()

        if script_name in _LISTING_SCRIPTS:
            continue

        is_trojaned = 'trojaned' in content.lower()
        is_not_vuln = 'NOT VULNERABLE' in content or content.lower().strip() == 'false'
        is_always   = script_name in _ALWAYS_VULN_SCRIPTS

        if (is_trojaned or is_always) and not is_not_vuln:
            seen_scripts.add(script_name)
            cve_ids = re.findall(r'CVE-\d{4}-\d+', content)
            vulns.append({
                'script':      script_name,
                'title':       script_name.replace('-', ' ').title(),
                'state':       'VULNERABLE',
                'cve_ids':     cve_ids,
                'description': content,
                'exploitable': is_trojaned,
            })

    # --- FORMAT 2 : blocs multi-lignes '| script-name:' ---
    script_sections = re.split(r'\n\| (?=[\w\-]+:)', '\n' + port_block)

    for section in script_sections:
        if not section.strip():
            continue

        script_match = re.match(r'[\|\s]*([\w\-]+):\s*', section.strip())
        if not script_match:
            continue
        script_name = script_match.group(1)

        if script_name in _LISTING_SCRIPTS:
            continue
        if script_name in seen_scripts:
            continue

        # Doit contenir VULNERABLE (ou être dans _ALWAYS_VULN_SCRIPTS)
        has_vuln = 'VULNERABLE' in section
        is_always = script_name in _ALWAYS_VULN_SCRIPTS
        if not has_vuln and not is_always:
            continue

        # Exclure les "NOT VULNERABLE" stricts
        if has_vuln and 'NOT VULNERABLE' in section:
            states = re.findall(r'State:\s+(.+)', section)
            all_not_vuln = all('NOT' in s for s in states) if states else False
            if all_not_vuln:
                continue

        seen_scripts.add(script_name)

        state_match = re.search(r'State:\s+(.+)', section)
        state = state_match.group(1).strip() if state_match else 'VULNERABLE'

        # Titre : première ligne de contenu significatif
        _skip_words = {'vulnerable', 'vulnerable:', 'state:', 'ids:', 'references:',
                       'check results:', 'exploit results:'}
        title = script_name.replace('-', ' ').title()
        for line in section.strip().split('\n')[1:]:
            clean = re.sub(r'^[\|\s]+', '', line).strip()
            if (clean
                    and clean.lower() not in _skip_words
                    and not re.match(r'(State|IDs|BID|Disclosure|References?):', clean)
                    and not clean.startswith('http')):
                title = clean[:120]
                break

        # CVE IDs
        cve_ids = []
        for pattern in [r'CVE:(CVE-\d{4}-\d+)', r'\bCVE-(\d{4}-\d+)\b']:
            for m2 in re.finditer(pattern, section):
                raw_id = m2.group(1)
                cve_id = raw_id if raw_id.startswith('CVE-') else f'CVE-{raw_id}'
                if cve_id not in cve_ids:
                    cve_ids.append(cve_id)

        # Description
        desc_lines = re.findall(r'\|\s{6,}(.+)', section)
        description = ' '.join(l.strip() for l in desc_lines[:5]).strip()
        if not description:
            free = [re.sub(r'^[\|\s]+', '', l).strip()
                    for l in section.split('\n')[2:5] if l.strip() and '|' in l]
            description = ' '.join(free[:3]).strip()

        exploitable = (
            '(Exploitable)' in section
            or 'uid=0(root)' in section
            or 'trojaned' in section.lower()
        )

        vulns.append({
            'script':      script_name,
            'title':       title,
            'state':       state,
            'cve_ids':     cve_ids,
            'description': description,
            'exploitable': exploitable,
        })

    return vulns


def _extract_vulners_cves(port_block):
    """
    Extrait les CVE listés par le script vulners.

    Format réel texte_brute.txt :
      '|     \\tCVE-2023-38408\\t9.8\\thttps://vulners.com/cve/CVE-2023-38408'
    Filtre uniquement les entrées CVE-XXXX-YYYY (ignore EDB-ID, PACKETSTORM, etc.)
    """
    entries = []
    seen = set()

    for match in re.finditer(
        r'\|\s+CVE-(\d{4}-\d+)\t([\d.]+)\t\S+(\t\*EXPLOIT\*)?',
        port_block
    ):
        cve_id = f"CVE-{match.group(1)}"
        score  = float(match.group(2))
        is_exp = bool(match.group(3))
        if cve_id not in seen:
            seen.add(cve_id)
            entries.append({'cve_id': cve_id, 'score': score, 'is_exploit': is_exp})

    entries.sort(key=lambda x: x['score'], reverse=True)
    return entries


def _parse_service_version(version_string):
    if not version_string:
        return None, None, None
    version_string = version_string.strip()
    match = re.match(
        r'^([\w/\.\-]+(?: [\w/\.\-]+)?)\s+([\d][\w\.\-]*)\s*(.*)',
        version_string
    )
    if match:
        return match.group(1).strip(), match.group(2).strip(), match.group(3).strip()
    return version_string, None, None


def parse_nmap_output(raw_output):
    """
    Parse complet de la sortie brute Nmap.

    CORRECTION CRITIQUE : utilise ([\s\S]*?) au lieu de (.*)
    pour capturer les blocs ports multi-lignes avec scripts.
    """
    hosts = []
    host_blocks = re.split(r'Nmap scan report for ', raw_output)
    logger.debug(f"[PARSER] {len(host_blocks)-1} bloc(s) hôte trouvé(s)")

    for block in host_blocks[1:]:
        lines = block.split('\n')
        if not lines:
            continue

        # IP et hostname (format: 'HOSTNAME (IP)' ou 'IP')
        header = lines[0].strip()
        ip_match = re.search(r'\(?(\d+\.\d+\.\d+\.\d+)\)?', header)
        ip = ip_match.group(1) if ip_match else None
        if not ip:
            logger.warning(f"[PARSER] IP introuvable : {header}")
            continue

        hostname_match = re.match(r'^([\w\.\-]+)\s+\(', header)
        hostname = hostname_match.group(1) if hostname_match else None

        latency_match = re.search(r'Host is up \(([\d.]+)s latency\)', block)
        latency = float(latency_match.group(1)) if latency_match else None

        os_match = re.search(r'OS details: (.+)', block)
        os_detected = os_match.group(1).strip() if os_match else None

        os_cpe_match = re.search(r'OS CPE: (.+)', block)
        os_cpe = os_cpe_match.group(1).strip() if os_cpe_match else None

        mac_match = re.search(r'MAC Address: ([\w:]+)', block)
        mac = mac_match.group(1) if mac_match else None

        # Section ports — CORRECTION CRITIQUE : ([\s\S]*?)
        port_section_match = re.search(
            r'PORT\s+STATE\s+SERVICE[^\n]*\n([\s\S]*?)'
            r'(?=\nOS details:|\nMAC Address:|\nNmap done:|\nHost script results:|\nService Info:|\Z)',
            block
        )
        if not port_section_match:
            port_section_match = re.search(
                r'PORT\s+STATE\s+SERVICE[^\n]*\n([\s\S]*)', block
            )

        if not port_section_match:
            logger.warning(f"[PARSER] Section PORT introuvable pour {ip}")
            hosts.append({
                'ip': ip, 'hostname': hostname, 'latency': latency,
                'os': os_detected, 'os_cpe': os_cpe, 'mac': mac, 'ports': []
            })
            continue

        ports_raw = port_section_match.group(1)
        port_blocks_list = re.split(r'\n(?=\d+/(?:tcp|udp)\s)', ports_raw)

        ports = []
        for pblock in port_blocks_list:
            pblock = pblock.strip()
            if not pblock:
                continue

            ph = re.match(r'^(\d+)/(tcp|udp)\s+(\w+)\s+(\S+)\s*(.*)', pblock)
            if not ph:
                continue

            port_number    = int(ph.group(1))
            protocol       = ph.group(2)
            state          = ph.group(3)
            service        = ph.group(4)
            version_raw    = re.sub(r'\s+', ' ', ph.group(5)).strip()
            product, version_number, _ = _parse_service_version(version_raw)

            script_vulns = _extract_script_vulns(pblock)
            vulners_cves = _extract_vulners_cves(pblock)
            port_cpes    = _extract_port_cpes(pblock)

            banner_match = re.search(r'\|_\s+(.+)', pblock)
            banner = banner_match.group(1).strip() if banner_match else None

            logger.debug(
                f"[PARSER] {ip}:{port_number}/{protocol} {state} {service} "
                f"| script_vulns={len(script_vulns)} vulners={len(vulners_cves)}"
            )

            ports.append({
                'port_number':    port_number,
                'protocol':       protocol,
                'state':          state,
                'service':        service,
                'version':        version_raw or None,
                'product':        product,
                'version_number': version_number,
                'port_cpes':      port_cpes,
                'script_vulns':   script_vulns,
                'vulners_cves':   vulners_cves,
                'banner':         banner,
            })

        hosts.append({
            'ip': ip, 'hostname': hostname, 'latency': latency,
            'os': os_detected, 'os_cpe': os_cpe, 'mac': mac, 'ports': ports,
        })
        open_count = sum(1 for p in ports if p['state'] == 'open')
        logger.info(f"[PARSER] Hôte {ip} — {open_count} port(s) ouverts parsés")

    return hosts


# ==============================================================================
# CVE MATCHER
# ==============================================================================

def match_cves_for_port(port_data, host_cpe=None):
    """
    Matching CVE multi-sources pour un port.

    Priorité :
    1. Scripts VULNERABLE (confirmés) — avec ou sans CVE ID
    2. Script vulners (CVE listés avec score)
    3. Matching CPE NVD (complément si < 5 CVE)
    4. Matching service+version NVD (fallback si < 3 CVE)
    """
    results   = []
    seen_cves = set()
    service   = port_data.get('service', '')

    # --- SOURCE 1 : Scripts VULNERABLE ---
    for sv in port_data.get('script_vulns', []):
        cve_list = sv.get('cve_ids', [])

        if cve_list:
            for cve_id in cve_list:
                if cve_id in seen_cves:
                    continue
                seen_cves.add(cve_id)

                cve_entry     = _get_cve_entry(cve_id)
                exploit_in_db = _has_exploit_in_db(cve_id)

                if cve_entry:
                    score   = cve_entry.cvss_v3_score or cve_entry.cvss_v2_score
                    desc    = cve_entry.description or sv.get('description', '')
                    sev     = cve_entry.cvss_v3_severity
                    if not sev or sev.lower() == 'unknown':
                        sev = _cvss_to_severity(score)
                    has_exp = cve_entry.has_exploit or exploit_in_db or sv.get('exploitable', False)
                else:
                    score   = None
                    desc    = sv.get('description', '') or f"Vulnérabilité {cve_id} confirmée par script {sv['script']}."
                    sev     = _cvss_to_severity(score)
                    has_exp = sv.get('exploitable', False) or exploit_in_db

                results.append({
                    'cve_id':            cve_id,
                    'cvss_score':        score,
                    'severity':          sev,
                    'description':       desc,
                    'title':             sv.get('title', cve_id),
                    'exploit_available': has_exp,
                    'verified':          True,
                    'exploitable':       sv.get('exploitable', False),
                    'remediation':       _get_remediation_hint(cve_id, service),
                })
        else:
            # Script confirmé sans CVE ID (rmi-vuln-classloader, irc-unrealircd-backdoor, etc.)
            synthetic_id = f"SCRIPT-{sv['script'].upper()}"
            if synthetic_id in seen_cves:
                continue
            seen_cves.add(synthetic_id)

            score, sev = _SCRIPT_DEFAULT_SCORES.get(sv['script'], (7.0, 'high'))

            results.append({
                'cve_id':            synthetic_id,
                'cvss_score':        score,
                'severity':          sev,
                'description':       sv.get('description', '') or f"Vulnérabilité confirmée par le script Nmap {sv['script']}.",
                'title':             sv.get('title', sv['script'].replace('-', ' ').title()),
                'exploit_available': sv.get('exploitable', False),
                'verified':          True,
                'exploitable':       sv.get('exploitable', False),
                'remediation':       _get_remediation_hint(synthetic_id, service),
            })

    # --- SOURCE 2 : Script vulners ---
    for vc in port_data.get('vulners_cves', []):
        cve_id = vc['cve_id']
        if cve_id in seen_cves:
            continue
        seen_cves.add(cve_id)

        cve_entry     = _get_cve_entry(cve_id)
        exploit_in_db = _has_exploit_in_db(cve_id)

        if cve_entry:
            score   = cve_entry.cvss_v3_score or cve_entry.cvss_v2_score or vc['score']
            desc    = cve_entry.description
            sev     = cve_entry.cvss_v3_severity
            if not sev or sev.lower() == 'unknown':
                sev = _cvss_to_severity(score)
            has_exp = cve_entry.has_exploit or exploit_in_db or vc['is_exploit']
        else:
            score   = vc['score']
            desc    = f"Vulnérabilité référencée par vulners pour {service} {port_data.get('version', '')}."
            sev     = _cvss_to_severity(score)
            has_exp = vc['is_exploit'] or exploit_in_db

        results.append({
            'cve_id':            cve_id,
            'cvss_score':        score,
            'severity':          sev,
            'description':       desc,
            'title':             f"{cve_id} — {service}",
            'exploit_available': has_exp,
            'verified':          False,
            'exploitable':       False,
            'remediation':       _get_remediation_hint(cve_id, service),
        })

    # --- SOURCE 3 : Matching CPE NVD ---
    if len(results) < 5:
        cpes_to_check = port_data.get('port_cpes', [])
        if not cpes_to_check and host_cpe:
            cpes_to_check = [host_cpe]

        for cpe in cpes_to_check[:3]:
            cpe_clean = cpe.replace('cpe:/', '').replace('cpe:', '')
            parts = cpe_clean.split(':')
            if len(parts) < 3:
                continue
            cpe_product = parts[2]
            cpe_version = parts[3] if len(parts) > 3 else None

            q = Q(affected_products__icontains=cpe_product)
            if cpe_version:
                q &= Q(affected_products__icontains=cpe_version)

            for cve_entry in CVEEntry.objects.filter(q).exclude(
                cve_id__in=seen_cves
            ).order_by('-cvss_v3_score')[:10]:
                seen_cves.add(cve_entry.cve_id)
                exploit_in_db = _has_exploit_in_db(cve_entry.cve_id)
                score = cve_entry.cvss_v3_score or cve_entry.cvss_v2_score
                sev   = cve_entry.cvss_v3_severity
                if not sev or sev.lower() == 'unknown':
                    sev = _cvss_to_severity(score)

                results.append({
                    'cve_id':            cve_entry.cve_id,
                    'cvss_score':        score,
                    'severity':          sev,
                    'description':       cve_entry.description,
                    'title':             f"{cve_entry.cve_id} — {service}",
                    'exploit_available': cve_entry.has_exploit or exploit_in_db,
                    'verified':          False,
                    'exploitable':       False,
                    'remediation':       _get_remediation_hint(cve_entry.cve_id, service),
                })

    # --- SOURCE 4 : Fallback description NVD ---
    if len(results) < 3 and port_data.get('product') and port_data.get('version_number'):
        for cve_entry in CVEEntry.objects.filter(
            Q(description__icontains=port_data['product']) &
            Q(description__icontains=port_data['version_number'])
        ).exclude(cve_id__in=seen_cves).order_by('-cvss_v3_score')[:5]:
            seen_cves.add(cve_entry.cve_id)
            exploit_in_db = _has_exploit_in_db(cve_entry.cve_id)
            score = cve_entry.cvss_v3_score or cve_entry.cvss_v2_score
            sev   = cve_entry.cvss_v3_severity
            if not sev or sev.lower() == 'unknown':
                sev = _cvss_to_severity(score)

            results.append({
                'cve_id':            cve_entry.cve_id,
                'cvss_score':        score,
                'severity':          sev,
                'description':       cve_entry.description,
                'title':             f"{cve_entry.cve_id} — {service}",
                'exploit_available': cve_entry.has_exploit or exploit_in_db,
                'verified':          False,
                'exploitable':       False,
                'remediation':       _get_remediation_hint(cve_entry.cve_id, service),
            })

    results.sort(
        key=lambda x: (int(x['verified']), int(x['exploitable']), x['cvss_score'] or 0),
        reverse=True
    )
    return results


# ==============================================================================
# CRÉATION DES VULNÉRABILITÉS EN BASE
# ==============================================================================

def create_vulnerabilities_for_port(scan, host, port, port_data):
    matched_cves = match_cves_for_port(port_data, host_cpe=host.cpe)
    count = 0

    for vuln_data in matched_cves:
        risk_score = compute_technical_risk(
            cvss=vuln_data['cvss_score'] or 0.0,
            exploit_available=vuln_data['exploit_available'],
            verified=vuln_data['verified'],
            remote=True,
            criticality=host.business_criticality
        )

        Vulnerability.objects.create(
            scan=scan,
            host=host,
            port=port,
            title=vuln_data['title'][:255],
            description=vuln_data['description'] or '',
            severity=vuln_data['severity'],
            cvss_score=vuln_data['cvss_score'],
            cve_id=vuln_data['cve_id'],
            exploit_available=vuln_data['exploit_available'],
            risk_score=risk_score,
            remediation=vuln_data['remediation'],
        )
        count += 1

        if vuln_data['verified']:
            notify_vuln_found(scan.scan_id, {
                'cve_id':      vuln_data['cve_id'],
                'severity':    vuln_data['severity'],
                'title':       vuln_data['title'],
                'exploitable': vuln_data['exploitable'],
                'port':        port.port_number,
                'service':     port.service,
            })

        logger.info(
            f"[VULN] {vuln_data['cve_id']} | {vuln_data['severity'].upper()} "
            f"| CVSS={vuln_data['cvss_score']} "
            f"| Port {port.port_number}/{port.service} "
            f"| Exploit={'OUI' if vuln_data['exploit_available'] else 'NON'} "
            f"| Vérifié={'OUI' if vuln_data['verified'] else 'NON'}"
        )

    return count


# ==============================================================================
# MOTEUR DE SCAN PRINCIPAL
# ==============================================================================
def run_nmap_scan(scan_id, target, scan_type):
    scan = None
    try:
        scan = Scan.objects.get(scan_id=scan_id)

        if scan_type == "quick":
            args = ["nmap", "-F", f"{scan.speed}", "-sV", "-sS",
                    "--stats-every", "5s", "-v", target]
        elif scan_type == "service":
            args = ["nmap", "-p-", f"{scan.speed}", "-sV",
                    "--stats-every", "5s", "-v", target]
        elif scan_type == "full":
            args = [
                "nmap", "-p-", f"{scan.speed}", "-sV", "-sS", "-O",
                "--script=vuln,exploit,vulners",
                "--script-args=vulners.showall=true",
                "--stats-every", "5s", "-v",
                target
            ]
        else:
            args = ["nmap", f"{scan.speed}", "-sV",
                    "--stats-every", "5s", "-v", target]

        logger.info(f"[SCAN {scan_id}] Démarrage : {' '.join(args)}")
        notify_scan_status(scan_id, 'running', {'target': target, 'scan_type': scan_type})

        # ---- MODE PRODUCTION — streaming temps réel ----
        process = subprocess.Popen(
            args,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,  # merge stderr dans stdout pour capturer les stats
            text=True,
            bufsize=1
        )

        raw_lines = []

        for line in process.stdout:
            line = line.rstrip()
            if not line:
                continue
            raw_lines.append(line)

            # Progression chiffrée (émise toutes les 5s grâce à --stats-every)
            # Ex: "About 34.56% done; ETC: 14:32 (0:01:23 remaining)"
            progress_match = re.search(r'About ([\d.]+)% done', line)
            if progress_match:
                progress = round(float(progress_match.group(1)))
                eta_match = re.search(r'ETC:.*\((.*?) remaining\)', line)
                eta = eta_match.group(1) if eta_match else None
                notify_scan_status(scan_id, 'running', {
                    'progress': progress,
                    'eta': eta,
                    'message': f"Scan en cours... {progress}%"
                })
                logger.info(f"[SCAN {scan_id}] Progression : {progress}% | ETA : {eta}")
                continue

            # Détection de phase
            # Ex: "Initiating SYN Stealth Scan at 14:30"
            phase_match = re.search(r'Initiating (.+?) (?:Stealth )?Scan', line)
            if phase_match:
                phase = phase_match.group(1)
                notify_scan_status(scan_id, 'running', {
                    'message': f"Phase : {phase}...",
                    'progress': None
                })
                logger.info(f"[SCAN {scan_id}] Phase : {phase}")
                continue

            # Port ouvert découvert
            # Ex: "Discovered open port 443/tcp on 192.168.1.1"
            port_match = re.search(r'Discovered open port (\d+/\w+)', line)
            if port_match:
                notify_scan_status(scan_id, 'running', {
                    'message': f"Port ouvert : {port_match.group(1)}",
                    'progress': None
                })
                continue

            # Script NSE en cours
            # Ex: "NSE: Script scanning 192.168.1.1"
            if re.search(r'NSE: Script scanning', line):
                notify_scan_status(scan_id, 'running', {
                    'message': "Analyse des scripts NSE (CVE, vulns)...",
                    'progress': None
                })
                continue

        process.wait(timeout=18000)
        raw_output = "\n".join(raw_lines)

        if process.returncode != 0:
            raise Exception(f"Nmap a retourné le code {process.returncode}")

        # # ---- MODE TEST ----
        # BASE_DIR  = os.path.dirname(os.path.abspath(__file__))
        # file_path = os.path.join(BASE_DIR, "texte_brute.txt")
        # with open(file_path, "r", encoding="utf-8") as f:
        #     raw_output = f.read()
        # logger.info(f"[SCAN {scan_id}] Mode test — {file_path} ({len(raw_output)} chars)")

        scan.raw_output = raw_output
        scan.save()

        parsed_hosts = parse_nmap_output(raw_output)
        logger.info(f"[SCAN {scan_id}] {len(parsed_hosts)} hôte(s) parsé(s)")

        if not parsed_hosts:
            logger.warning(f"[SCAN {scan_id}] Aucun hôte parsé — vérifier texte_brute.txt")

        total_vulns = 0

        for host_data in parsed_hosts:
            open_ports = [p for p in host_data['ports'] if p['state'] == 'open']

            host = HostInfo.objects.create(
                scan=scan,
                ip_address=host_data['ip'],
                os=host_data['os'],
                cpe=host_data['os_cpe'],
                latency=host_data['latency'],
                open_ports=len(open_ports),
            )

            notify_scan_progress(scan_id, {
                'step': 'host_discovered',
                'ip': host_data['ip'],
                'os': host_data['os'],
                'open_ports': len(open_ports),
            })

            logger.info(
                f"[SCAN {scan_id}] Hôte {host_data['ip']} — "
                f"{len(open_ports)} port(s) ouverts — OS: {host_data['os']}"
            )

            for port_data in host_data['ports']:
                if port_data['state'] != 'open':
                    continue

                port = Port.objects.create(
                    scan=scan,
                    host=host,
                    port_number=port_data['port_number'],
                    protocol=port_data['protocol'],
                    state=port_data['state'],
                    service=port_data['service'],
                    version=port_data['version'],
                    is_web_service=port_data['port_number'] in WEB_PORTS,
                    is_potentially_risky=port_data['port_number'] in RISKY_PORTS,
                    banner=port_data.get('banner'),
                )

                n = create_vulnerabilities_for_port(scan, host, port, port_data)
                total_vulns += n

                # ---- SCAN WEB AUTOMATIQUE ----
                # if port_data['port_number'] in WEB_PORTS:
                #     try:
                #         from scans.webscan_engine import run_web_scan
                #         run_web_scan(scan.scan_id, host.id, port.id)
                #         logger.info(
                #             f"[SCAN {scan_id}] Scan web lancé sur "
                #             f"{host.ip_address}:{port.port_number}"
                #         )
                #     except Exception as web_err:
                #         logger.warning(
                #             f"[SCAN {scan_id}] Impossible de lancer le scan web : {web_err}"
                #         )

                notify_scan_progress(scan_id, {
                    'step':        'port_scanned',
                    'port':        port_data['port_number'],
                    'service':     port_data['service'],
                    'vulns_found': n,
                })

        scan.status = "completed"
        scan.end_at = timezone.now()
        scan.save()

        logger.info(f"[SCAN {scan_id}] Terminé — {total_vulns} vulnérabilité(s) créée(s).")
        notify_scan_status(scan_id, 'completed', {'target': target, 'total_vulns': total_vulns})

    except Scan.DoesNotExist:
        logger.error(f"[SCAN {scan_id}] Scan introuvable en base.")

    except FileNotFoundError as e:
        logger.error(f"[SCAN {scan_id}] Fichier introuvable : {e}")
        if scan:
            scan.status = "failed"
            scan.save()
        notify_scan_status(scan_id, 'failed', {'reason': str(e)})

    except subprocess.TimeoutExpired:
        logger.error(f"[SCAN {scan_id}] Timeout.")
        if scan:
            scan.status = "failed"
            scan.save()
        notify_scan_status(scan_id, 'failed', {'reason': 'timeout'})

    except Exception as e:
        logger.error(f"[SCAN {scan_id}] Erreur inattendue : {e}", exc_info=True)
        if scan:
            try:
                scan.status = "failed"
                scan.save()
            except Exception:
                pass
        notify_scan_status(scan_id, 'failed', {'reason': str(e)})

# ==============================================================================
# POINT D'ENTRÉE PUBLIC
# ==============================================================================

def start_scan(user, name, description, target, scan_type, speed):
    scan = Scan.objects.create(
        user=user,
        name=name or f"Scan {target}",
        target=target,
        description=description,
        speed=speed,
        status="running",
        scan_type=scan_type,
        begin_at=timezone.now(),
    )
    logger.info(f"[START] Scan {scan.scan_id} créé — cible={target} type={scan_type}")
    thread = threading.Thread(
        target=run_nmap_scan,
        args=(scan.scan_id, target, scan_type),
        daemon=True
    )
    thread.start()
    logger.info(f"[START] Scan {scan.scan_id} lancé — cible={target} type={scan_type}")
    return scan.scan_id
