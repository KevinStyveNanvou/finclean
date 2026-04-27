from django.contrib.auth import get_user_model
from .scan_engine import start_scan, start_discovery_scan
from .serializers import ScanSerializer, ScanDetailSerializer, PermanentScanSerializer
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction
from .models import Scan, PermanentScan, HostInfo
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from django.http import HttpResponse
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from io import BytesIO
import logging

logger = logging.getLogger(__name__)
User = get_user_model()


# ==============================================================================
# EXPORT PDF
# ==============================================================================


import io
from datetime import datetime
from django.http import HttpResponse
from django.shortcuts import get_object_or_404

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, HRFlowable, PageBreak
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT

import matplotlib.pyplot as plt
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend

from .models import Scan, HostInfo, Port, Vulnerability, WebScanResult, WebFinding

# Constants for colors
GOLD = colors.HexColor("#D4AF37")
GREEN = colors.HexColor("#228B22")
DARK_GRAY = colors.HexColor("#333333")
LIGHT_GRAY = colors.HexColor("#F0F0F0")
CRITICAL_RED = colors.HexColor("#8B0000")
HIGH_ORANGE = colors.HexColor("#FF8C00")
MEDIUM_YELLOW = colors.HexColor("#FFD700")
LOW_BLUE = colors.HexColor("#1E90FF")
INFO_GRAY = colors.HexColor("#808080")

def get_finclean_logo():
    """Returns the branded finclean logo as a Paragraph."""
    style = ParagraphStyle(
        name='Logo',
        fontSize=24,
        leading=28,
        alignment=TA_LEFT,
        fontName='Helvetica-Bold'
    )
    return Paragraph(f'<font color="{GOLD}">FIN</font><font color="{GREEN}">clean</font>', style)

def draw_footer(canvas, doc):
    """Callback to draw the footer on each page."""
    canvas.saveState()
    footer_style = ParagraphStyle(name='Footer', fontSize=8, textColor=colors.gray, alignment=TA_RIGHT)
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    p = Paragraph(f"finclean - Généré le {now} - Page {doc.page}", footer_style)
    w, h = p.wrap(doc.width, doc.bottomMargin)
    p.drawOn(canvas, doc.leftMargin, doc.bottomMargin - 0.5*cm)
    canvas.restoreState()

def generate_vulnerability_pie_chart(scan):
    """Generates a pie chart of vulnerability severities."""
    counts = {
        "critical": scan.vulnerabilities.filter(severity="critical").count() + scan.web_findings.filter(severity="critical").count(),
        "high": scan.vulnerabilities.filter(severity="high").count() + scan.web_findings.filter(severity="high").count(),
        "medium": scan.vulnerabilities.filter(severity="medium").count() + scan.web_findings.filter(severity="medium").count(),
        "low": scan.vulnerabilities.filter(severity="low").count() + scan.web_findings.filter(severity="low").count(),
        "info": scan.vulnerabilities.filter(severity="info").count() + scan.web_findings.filter(severity="info").count(),
    }
    
    labels = [k.capitalize() for k, v in counts.items() if v > 0]
    sizes = [v for v in counts.values() if v > 0]
    color_map = {
        "Critical": "#8B0000",
        "High": "#FF8C00",
        "Medium": "#FFD700",
        "Low": "#1E90FF",
        "Info": "#808080"
    }
    colors_list = [color_map[l] for l in labels]

    if not sizes:
        return None

    plt.figure(figsize=(4, 3))
    plt.pie(sizes, labels=labels, autopct='%1.1f%%', startangle=140, colors=colors_list)
    plt.axis('equal')
    plt.title("Répartition des Vulnérabilités", fontsize=10)
    
    img_buffer = io.BytesIO()
    plt.savefig(img_buffer, format='png', bbox_inches='tight', transparent=True)
    plt.close()
    img_buffer.seek(0)
    return Image(img_buffer, width=6*cm, height=4.5*cm)

def generate_port_summary_chart(scan):
    """Generates a bar chart of port states."""
    if not hasattr(scan, 'host_info'):
        return None
    
    host = scan.host_info
    categories = ['Ouverts', 'Fermés', 'Filtrés']
    values = [host.open_ports, host.closed_ports, host.filtered_ports]
    
    plt.figure(figsize=(4, 3))
    plt.bar(categories, values, color=['#228B22', '#8B0000', '#FF8C00'])
    plt.title("Résumé des Ports", fontsize=10)
    plt.ylabel("Nombre")
    
    img_buffer = io.BytesIO()
    plt.savefig(img_buffer, format='png', bbox_inches='tight', transparent=True)
    plt.close()
    img_buffer.seek(0)
    return Image(img_buffer, width=6*cm, height=4.5*cm)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_scan_pdf(request, scan_id):
    try:
        scan = Scan.objects.prefetch_related(
            "host_info",
            "ports__vulnerabilities",
            "vulnerabilities",
            "web_scan_results__findings",
            "web_findings"
        ).get(scan_id=scan_id, user=request.user)
    except Scan.DoesNotExist:
        return HttpResponse("Scan non trouvé", status=404)

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=2*cm, leftMargin=2*cm, topMargin=2*cm, bottomMargin=2*cm)
    elements = []
    styles = getSampleStyleSheet()
    
    # Custom Styles
    title_style = ParagraphStyle('MainTitle', parent=styles['Title'], fontSize=22, textColor=DARK_GRAY, spaceAfter=20)
    h1_style = ParagraphStyle('Heading1', parent=styles['Heading1'], fontSize=16, textColor=DARK_GRAY, spaceBefore=15, spaceAfter=10, borderPadding=5)
    h2_style = ParagraphStyle('Heading2', parent=styles['Heading2'], fontSize=14, textColor=colors.gray, spaceBefore=10, spaceAfter=5)
    normal_style = styles['Normal']
    bold_style = ParagraphStyle('Bold', parent=normal_style, fontName='Helvetica-Bold')

    # Header section
    header_data = [[get_finclean_logo(), Paragraph(f"RAPPORT DE SÉCURITÉ<br/><font size=10>Cible: {scan.target}</font>", ParagraphStyle('HeaderRight', parent=styles['Normal'], alignment=TA_RIGHT))]]
    header_table = Table(header_data, colWidths=[doc.width/2.0]*2)
    header_table.setStyle(TableStyle([('VALIGN', (0,0), (-1,-1), 'MIDDLE')]))
    elements.append(header_table)
    elements.append(HRFlowable(width="100%", thickness=1, color=colors.gray, spaceBefore=5, spaceAfter=20))

    # Executive Summary
    elements.append(Paragraph(f"Résumé Exécutif: {scan.name}", title_style))
    
    # Stats Row
    total_vulns = scan.vulnerabilities.count() + scan.web_findings.count()
    open_ports = scan.host_info.open_ports if hasattr(scan, 'host_info') else 0
    
    stats_data = [
        [Paragraph(f"<b>{open_ports}</b><br/>Ports Ouverts", ParagraphStyle('Stat', alignment=TA_CENTER)),
         Paragraph(f"<b>{total_vulns}</b><br/>Vulnérabilités Total", ParagraphStyle('Stat', alignment=TA_CENTER)),
         Paragraph(f"<b>{scan.status.upper()}</b><br/>Statut du Scan", ParagraphStyle('Stat', alignment=TA_CENTER))]
    ]
    stats_table = Table(stats_data, colWidths=[doc.width/3.0]*3)
    stats_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), LIGHT_GRAY),
        ('BOX', (0,0), (-1,-1), 1, colors.white),
        ('INNERGRID', (0,0), (-1,-1), 1, colors.white),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 10),
        ('TOPPADDING', (0,0), (-1,-1), 10),
    ]))
    elements.append(stats_table)
    elements.append(Spacer(1, 15))

    # Graphs Row
    v_chart = generate_vulnerability_pie_chart(scan)
    p_chart = generate_port_summary_chart(scan)
    if v_chart or p_chart:
        charts_data = [[v_chart if v_chart else "", p_chart if p_chart else ""]]
        charts_table = Table(charts_data, colWidths=[doc.width/2.0]*2)
        elements.append(charts_table)
        elements.append(Spacer(1, 15))

    # Host Information
    if hasattr(scan, 'host_info'):
        host = scan.host_info
        elements.append(Paragraph("Informations sur l'Hôte", h1_style))
        host_data = [
            ["Adresse IP:", host.ip_address],
            ["Système d'Exploitation:", host.os or "Inconnu"],
            ["Latence:", f"{host.latency} ms"],
            ["Criticité Métier:", f"{host.business_criticality}/10"]
        ]
        host_table = Table(host_data, colWidths=[4*cm, 10*cm])
        host_table.setStyle(TableStyle([
            ('FONTNAME', (0,0), (0,-1), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ]))
        elements.append(host_table)
        elements.append(Spacer(1, 12))

    # Network Vulnerabilities
    elements.append(Paragraph("Analyse des Vulnérabilités Réseau", h1_style))
    vulns = scan.vulnerabilities.all().order_by('-cvss_score')
    
    if vulns.exists():
        for vuln in vulns:
            sev_color = {
                'critical': CRITICAL_RED, 'high': HIGH_ORANGE, 'medium': MEDIUM_YELLOW, 
                'low': LOW_BLUE, 'info': INFO_GRAY
            }.get(vuln.severity, colors.black)
            
            elements.append(Paragraph(f"<b>[{vuln.severity.upper()}]</b> {vuln.title}", ParagraphStyle('VulnTitle', parent=normal_style, textColor=sev_color, fontSize=11)))
            elements.append(Paragraph(f"CVE: {vuln.cve_id or 'N/A'} | CVSS: {vuln.cvss_score or 'N/A'} | Port: {vuln.port.port_number if vuln.port else 'Host'}", normal_style))
            elements.append(Paragraph(f"<i>Description:</i> {vuln.description}", ParagraphStyle('Italic', parent=normal_style, leftIndent=10)))
            if vuln.remediation:
                elements.append(Paragraph(f"<b>Conseils de remédiation:</b> {vuln.remediation}", ParagraphStyle('Remed', parent=normal_style, textColor=GREEN, leftIndent=10)))
            elements.append(Spacer(1, 8))
    else:
        elements.append(Paragraph("Aucune vulnérabilité réseau détectée.", normal_style))

    elements.append(PageBreak())

    # Web Scan Analysis
    elements.append(Paragraph("Analyse de Sécurité Web", h1_style))
    web_findings = scan.web_findings.all()
    
    if web_findings.exists():
        for finding in web_findings:
            sev_color = {
                'critical': CRITICAL_RED, 'high': HIGH_ORANGE, 'medium': MEDIUM_YELLOW, 
                'low': LOW_BLUE, 'info': INFO_GRAY
            }.get(finding.severity, colors.black)
            
            elements.append(Paragraph(f"<b>[{finding.severity.upper()}]</b> {finding.title} ({finding.source})", ParagraphStyle('WebVulnTitle', parent=normal_style, textColor=sev_color)))
            elements.append(Paragraph(f"Type: {finding.get_finding_type_display()} | URL: {finding.url or 'N/A'}", normal_style))
            elements.append(Paragraph(f"<i>Preuve:</i> {finding.evidence[:200] if finding.evidence else 'N/A'}", ParagraphStyle('Evidence', parent=normal_style, fontSize=8, leftIndent=10)))
            if finding.remediation:
                elements.append(Paragraph(f"<b>Conseils:</b> {finding.remediation}", ParagraphStyle('Remed', parent=normal_style, textColor=GREEN, leftIndent=10)))
            elements.append(Spacer(1, 8))
    else:
        elements.append(Paragraph("Aucune vulnérabilité web détectée ou scan web non effectué.", normal_style))

    # Final build
    doc.build(elements, onFirstPage=draw_footer, onLaterPages=draw_footer)
    
    buffer.seek(0)
    response = HttpResponse(buffer, content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="Rapport_Scan_{scan_id}_{datetime.now().strftime("%Y%m%d")}.pdf"'
    return response



# @api_view(['GET'])
# @permission_classes([IsAuthenticated])
# def export_scan_pdf(request, scan_id):
#     try:
#         scan = Scan.objects.prefetch_related(
#             "ports__vulnerabilities",
#             "ports",
#             "host_info"
#         ).get(scan_id=scan_id, user=request.user)
#     except Scan.DoesNotExist:
#         return HttpResponse("Scan not found", status=404)
#     except Exception as e:
#         return HttpResponse(f"Error retrieving scan: {str(e)}", status=500)

#     buffer = BytesIO()
#     doc = SimpleDocTemplate(buffer, pagesize=A4)
#     elements = []
#     styles = getSampleStyleSheet()

#     elements.append(Paragraph(f"Rapport Scan {scan.name}", styles['Title']))
#     elements.append(Spacer(1, 12))
#     elements.append(Paragraph(f"Target: {scan.target}", styles['Normal']))
#     elements.append(Paragraph(f"Statut: {scan.status}", styles['Normal']))
#     elements.append(Paragraph(f"Début: {scan.begin_at}", styles['Normal']))
#     elements.append(Paragraph(f"Fin: {scan.end_at}", styles['Normal']))
#     elements.append(Spacer(1, 12))

#     if hasattr(scan, "host_info") and scan.host_info:
#         host = scan.host_info
#         elements.append(Paragraph(
#             f"<b>Host:</b> {host.ip_address} ({host.os or 'OS inconnu'})",
#             styles['Heading2']
#         ))
#         elements.append(Paragraph(f"Latence: {host.latency} ms", styles['Normal']))
#         elements.append(Spacer(1, 8))

#         for port in host.ports.all():
#             elements.append(Paragraph(
#                 f"<b>Port {port.port_number}/{port.protocol}</b> — {port.service} {port.version or ''}",
#                 styles['Normal']
#             ))
#             elements.append(Paragraph(
#                 f"État: {port.state} | Web: {port.is_web_service} | Risque: {port.is_potentially_risky}",
#                 styles['Normal']
#             ))

#             if port.vulnerabilities.exists():
#                 data = [["CVE", "Titre", "CVSS", "Sévérité", "Exploit", "Risk Score", "Remédiation"]]
#                 for vuln in port.vulnerabilities.all():
#                     data.append([
#                         vuln.cve_id or "-",
#                         vuln.title[:40],
#                         str(vuln.cvss_score or "-"),
#                         vuln.severity,
#                         "Oui" if vuln.exploit_available else "Non",
#                         str(round(vuln.risk_score, 2)) if vuln.risk_score else "-",
#                         (vuln.remediation or "-")[:60],
#                     ])
#                 table = Table(data, hAlign='LEFT')
#                 table.setStyle(TableStyle([
#                     ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#444444")),
#                     ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
#                     ('GRID', (0, 0), (-1, -1), 0.5, colors.gray),
#                     ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor("#222222")),
#                     ('TEXTCOLOR', (0, 1), (-1, -1), colors.white),
#                     ('FONTSIZE', (0, 0), (-1, -1), 7),
#                 ]))
#                 elements.append(table)
#                 elements.append(Spacer(1, 6))
#             elements.append(Spacer(1, 6))

#     doc.build(elements)

#     with open(f"Scan_{scan_id}_local.pdf", "wb") as f:
#         f.write(buffer.getvalue())

#     buffer.seek(0)
#     response = HttpResponse(buffer, content_type='application/pdf')
#     response['Content-Disposition'] = f'attachment; filename="Scan_{scan_id}.pdf"'
#     return response


# ==============================================================================
# SUPPRESSION DE SCANS
# ==============================================================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def delete_scans(request):
    """
    Supprime plusieurs scans appartenant à l'utilisateur connecté.
    Body : { "liste_scans_id": [1, 2, 3] }
    """
    liste_ids = request.data.get("liste_scans_id")

    if not isinstance(liste_ids, list) or not liste_ids:
        return Response(
            {"error": "liste_scans_id must be a non-empty list"},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        with transaction.atomic():
            scans_to_delete = Scan.objects.filter(
                scan_id__in=liste_ids,
                user=request.user
            )
            if not scans_to_delete.exists():
                return Response(
                    {"error": "No valid scans found for this user"},
                    status=status.HTTP_404_NOT_FOUND
                )
            scans_to_delete.delete()

        remaining_scans = Scan.objects.filter(user=request.user).order_by('-begin_at')
        serializer = ScanSerializer(remaining_scans, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ==============================================================================
# LISTE DES SCANS
# ==============================================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_scans(request):
    scans = Scan.objects.filter(user=request.user).order_by('-begin_at')
    serializer = ScanSerializer(scans, many=True)
    return Response(serializer.data)


# ==============================================================================
# DÉTAIL D'UN SCAN (serializer)
# ==============================================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def scan_detail(request, scan_id):
    try:
        scan = Scan.objects.get(scan_id=scan_id, user=request.user)
    except Scan.DoesNotExist:
        return Response({'error': 'Scan not found'}, status=404)

    serializer = ScanDetailSerializer(scan)
    return Response(serializer.data)


# ==============================================================================
# CRÉATION D'UN SCAN
# ==============================================================================

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_scan(request):
    target      = request.data.get("target")
    scan_type   = request.data.get("scan_type", "version")
    name        = request.data.get("name")
    description = request.data.get("description")
    speed       = request.data.get("speed", "T3")

    if not target:
        return Response({"error": "Target required"}, status=status.HTTP_400_BAD_REQUEST)

    if scan_type not in ("quick", "service", "full"):
        return Response(
            {"error": "scan_type must be one of: quick, service, full"},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        scan_id = start_scan(
            user=request.user,
            name=name,
            description=description,
            target=target,
            scan_type=scan_type,
            speed=speed,
        )
        logger.info(f"[CREATE_SCAN] Scan {scan_id} lancé — target={target} type={scan_type}")
        return Response({"scan_id": str(scan_id), "status": "started"}, status=status.HTTP_201_CREATED)

    except Exception as e:
        logger.error(f"[CREATE_SCAN] Erreur : {e}", exc_info=True)
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ==============================================================================
# STATUT ET RÉSULTATS COMPLETS D'UN SCAN
# ==============================================================================

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def scan_status(request, scan_id):
    """
    Retourne le statut complet d'un scan avec tous ses résultats :
    hôte, OS, ports, versions, vulnérabilités CVE, scores de risque.

    Le niveau de détail dépend du type de scan :
    - quick   : ports + services + versions + CVE NVD (sans scripts vuln)
    - service : ports + services + versions + OS + CVE NVD
    - full    : tout + CVE confirmés par scripts + exploits vérifiés
    """
    try:
        scan = Scan.objects.prefetch_related(
            "ports__vulnerabilities",
            "ports__host",
            "host_info__ports__vulnerabilities",
        ).get(scan_id=scan_id, user=request.user)
    except Scan.DoesNotExist:
        return Response({"error": "Scan not found"}, status=status.HTTP_404_NOT_FOUND)

    # ------------------------------------------------------------------
    # Construire les données de l'hôte
    # ------------------------------------------------------------------
    host_data = None

    if hasattr(scan, 'host_info') and scan.host_info:
        host = scan.host_info
        ports_data = []

        for port in host.ports.select_related('host').prefetch_related('vulnerabilities').all():

            # --- Vulnérabilités du port ---
            vulns_data = []
            for vuln in port.vulnerabilities.all().order_by('-risk_score'):
                vulns_data.append({
                    "id":               vuln.id,
                    "cve_id":           vuln.cve_id,
                    "title":            vuln.title,
                    "description":      vuln.description,
                    "severity":         vuln.severity,
                    "cvss_score":       vuln.cvss_score,
                    "exploit_available": vuln.exploit_available,
                    "risk_score":       round(vuln.risk_score, 2) if vuln.risk_score else None,
                    "remediation":      vuln.remediation,
                })

            ports_data.append({
                "id":                  port.id,
                "port_number":         port.port_number,
                "protocol":            port.protocol,
                "state":               port.state,
                "service":             port.service,
                "version":             port.version,
                "banner":              port.banner,
                "is_web_service":      port.is_web_service,
                "is_potentially_risky": port.is_potentially_risky,
                "vuln_count":          len(vulns_data),
                "has_critical":        any(v["severity"] == "critical" for v in vulns_data),
                "has_exploit":         any(v["exploit_available"] for v in vulns_data),
                "vulnerabilities":     vulns_data,
            })

        # Trier les ports : risqués + vulnérables d'abord
        ports_data.sort(key=lambda p: (
            int(p["has_critical"]),
            int(p["has_exploit"]),
            int(p["is_potentially_risky"]),
            p["vuln_count"]
        ), reverse=True)

        # Statistiques globales de l'hôte
        all_vulns     = [v for p in ports_data for v in p["vulnerabilities"]]
        severity_dist = {s: 0 for s in ("critical", "high", "medium", "low", "info")}
        for v in all_vulns:
            sev = v["severity"]
            if sev in severity_dist:
                severity_dist[sev] += 1

        host_data = {
            "id":                  host.id,
            "ip_address":          host.ip_address,
            "os":                  host.os,
            "os_cpe":              host.cpe,
            "latency_ms":          host.latency,
            "open_ports":          host.open_ports,
            "business_criticality": host.business_criticality,
            "total_vulns":         len(all_vulns),
            "severity_distribution": severity_dist,
            "has_critical_vuln":   severity_dist["critical"] > 0,
            "has_exploit":         any(v["exploit_available"] for v in all_vulns),
            "ports":               ports_data,
        }

    # ------------------------------------------------------------------
    # Métadonnées du scan selon son type
    # ------------------------------------------------------------------
    scan_capabilities = {
        "quick": {
            "os_detection":      False,
            "script_vulns":      False,
            "all_ports":         False,
            "description":       "Scan rapide — Top 1000 ports, détection service uniquement",
        },
        "service": {
            "os_detection":      True,
            "script_vulns":      False,
            "all_ports":         True,
            "description":       "Scan service — Tous les ports + OS + versions",
        },
        "full": {
            "os_detection":      True,
            "script_vulns":      True,
            "all_ports":         True,
            "description":       "Scan complet — Tous les ports + OS + CVE confirmés + exploits",
        },
    }

    capabilities = scan_capabilities.get(scan.scan_type, scan_capabilities["full"])

    user = {
        "id": scan.user.id,
        "username": scan.user.username,
        "role": scan.user.role,
        "email": scan.user.email,
    }

    # ------------------------------------------------------------------
    # Réponse finale
    # ------------------------------------------------------------------
    logger.info(f"[SCAN_DETAIL] Récupération du détail du scan {scan_id} pour l'utilisateur {request.user.username}")
    response_data = {
        "user":         user,
        "scan_id":      scan.scan_id,
        "name":         scan.name,
        "target":       scan.target,
        "scan_type":    scan.scan_type,
        "status":       scan.status,
        "begin_at":     scan.begin_at,
        "end_at":       scan.end_at,
        "capabilities": capabilities,
        "host":         host_data,

        # raw_output uniquement en DEBUG pour éviter la fuite d'informations
        "raw_output": scan.raw_output, #if request.query_params.get("debug") == "1" else None,
    }

    logger.info(
        f"[SCAN_STATUS] scan={scan_id} status={scan.status} "
        f"type={scan.scan_type} "
        f"vulns={host_data['total_vulns'] if host_data else 0}"
    )
    logger.debug(f"[SCAN_STATUS] Détails du scan {scan_id} : {response_data}")
    return Response(response_data, status=status.HTTP_200_OK)


# ==============================================================================
# DÉCOUVERTE RÉSEAU
# ==============================================================================

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def decouverte(request):
    try:
        scan_id = start_discovery_scan(user=request.user)
        logger.info(f"[DISCOVERY] Lancé — scan_id={scan_id}")
        return Response({
            "scan_id": str(scan_id),
            "status":  "started",
            "type":    "discovery",
        })
    except Exception as e:
        logger.error(f"[DISCOVERY] Erreur : {e}", exc_info=True)
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ==============================================================================
# PERMANENT SCANS
# ==============================================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_permanent_scans(request):
    permanent_scans = PermanentScan.objects.filter(user=request.user).order_by('next_run')
    serializer = PermanentScanSerializer(permanent_scans, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_permanent_scan(request):
    serializer = PermanentScanSerializer(data=request.data)
    if serializer.is_valid():
        from django.utils import timezone
        from datetime import timedelta
        permanent_scan = serializer.save(user=request.user)
        permanent_scan.next_run = timezone.now() + timedelta(hours=permanent_scan.frequency_hours)
        permanent_scan.save()
        return Response(PermanentScanSerializer(permanent_scan).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_permanent_scan(request, pk):
    try:
        permanent_scan = PermanentScan.objects.get(pk=pk, user=request.user)
    except PermanentScan.DoesNotExist:
        return Response({'error': 'Permanent scan not found'}, status=status.HTTP_404_NOT_FOUND)

    serializer = PermanentScanSerializer(permanent_scan, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_permanent_scan(request, pk):
    try:
        permanent_scan = PermanentScan.objects.get(pk=pk, user=request.user)
        permanent_scan.delete()
        return Response({'message': 'Permanent scan deleted'}, status=status.HTTP_204_NO_CONTENT)
    except PermanentScan.DoesNotExist:
        return Response({'error': 'Permanent scan not found'}, status=status.HTTP_404_NOT_FOUND)


# ==============================================================================
# HÔTES DÉCOUVERTS + CRITICITÉ MÉTIER
# ==============================================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_discovered_hosts(request):
    """Liste tous les hôtes découverts avec leur criticité métier (admin uniquement)."""
    if getattr(request.user, 'role', None) != 'admin':
        return Response({"error": "Admin access required"}, status=status.HTTP_403_FORBIDDEN)

    hosts = HostInfo.objects.select_related('scan').all()
    data = [
        {
            "id":                  host.id,
            "ip_address":          host.ip_address,
            "os":                  host.os,
            "business_criticality": host.business_criticality,
            "scan_name":           host.scan.name,
            "scan_date":           host.scan.begin_at,
        }
        for host in hosts
    ]
    return Response(data)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_business_criticalities(request):
    """Met à jour la criticité métier pour plusieurs IPs (admin uniquement)."""
    if getattr(request.user, 'role', None) != 'admin':
        return Response({"error": "Admin access required"}, status=status.HTTP_403_FORBIDDEN)

    criticalities = request.data.get("criticalities", [])
    if not isinstance(criticalities, list):
        return Response(
            {"error": "criticalities must be a list"},
            status=status.HTTP_400_BAD_REQUEST
        )

    updated = []
    errors  = []

    for item in criticalities:
        ip          = item.get("ip")
        criticality = item.get("criticality")

        if not ip or not isinstance(criticality, int) or not (1 <= criticality <= 10):
            errors.append(f"Données invalides pour IP {ip} : criticality doit être entre 1 et 10")
            continue

        try:
            host = HostInfo.objects.get(ip_address=ip)
            host.business_criticality = criticality
            host.save()
            updated.append(ip)
        except HostInfo.DoesNotExist:
            errors.append(f"IP {ip} introuvable")

    return Response({"updated": updated, "errors": errors}, status=status.HTTP_200_OK)