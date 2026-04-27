"""
FinClean — export_scan_pdf.py
=============================================================
Vue Django REST qui génère un rapport PDF professionnel pour
un scan réseau (et web si disponible). Inspiré du format
Acunetix : fond blanc, typographie claire, badges de sévérité
colorés, graphiques statistiques intégrés.

Auteur   : FinClean / NALA Security Consulting
Licence  : Propriétaire
=============================================================
"""

from __future__ import annotations

import io
import textwrap
from collections import Counter
from datetime import datetime
from typing import List, Optional

import matplotlib
matplotlib.use("Agg")                          # Pas de display X11 cote serveur
import matplotlib.pyplot as plt

from django.http import HttpResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    Image,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)
from reportlab.platypus.flowables import HRFlowable

from scans.models import Scan


# ─────────────────────────────────────────────────────────────────────────────
# PALETTE & CONSTANTES
# ─────────────────────────────────────────────────────────────────────────────

FC_GOLD  = colors.HexColor("#C9A84C")   # "FIN" dore
FC_GREEN = colors.HexColor("#2E7D32")   # "Clean" vert
FC_DARK  = colors.HexColor("#1A1A2E")   # Fond sombre titres
FC_LIGHT = colors.HexColor("#F5F7FA")   # Fond gris tres clair
FC_LINE  = colors.HexColor("#E0E4EC")   # Separateurs

SEV_COLORS = {
    "critical": colors.HexColor("#B71C1C"),
    "high":     colors.HexColor("#E53935"),
    "medium":   colors.HexColor("#FB8C00"),
    "low":      colors.HexColor("#F9A825"),
    "info":     colors.HexColor("#1976D2"),
}
SEV_LIGHT = {
    "critical": colors.HexColor("#FFEBEE"),
    "high":     colors.HexColor("#FFEBEE"),
    "medium":   colors.HexColor("#FFF3E0"),
    "low":      colors.HexColor("#FFFDE7"),
    "info":     colors.HexColor("#E3F2FD"),
}
SEV_ORDER  = ["critical", "high", "medium", "low", "info"]
SEV_LABELS = {
    "critical": "Critical",
    "high":     "High",
    "medium":   "Medium",
    "low":      "Low",
    "info":     "Informational",
}

PAGE_W, PAGE_H = A4
MARGIN_L = MARGIN_R = 18 * mm
MARGIN_T = 28 * mm
MARGIN_B = 20 * mm


# ─────────────────────────────────────────────────────────────────────────────
# CONSEILS DYNAMIQUES PAR TYPE DE VULNERABILITE
# ─────────────────────────────────────────────────────────────────────────────

VULN_ADVICE: dict[str, str] = {
    "ssl":        "Renouvelez le certificat TLS/SSL aupres de votre AC avant expiration. Activez le renouvellement automatique via Let's Encrypt / ACME.",
    "tls":        "Desactivez TLSv1.0 et TLSv1.1. Configurez uniquement TLS 1.2+ avec des suites de chiffrement fortes (AES-GCM, CHACHA20).",
    "ftp":        "Remplacez FTP par SFTP ou FTPS. Si FTP est indispensable, restreignez l'acces par IP et activez le chiffrement.",
    "ssh":        "Desactivez l'authentification par mot de passe. Utilisez des cles ED25519/RSA-4096. Mettez a jour OpenSSH vers la derniere version stable.",
    "smb":        "Desactivez SMBv1. Activez la signature SMB. Bloquez les ports 139/445 sur le perimetre externe.",
    "http":       "Redirigez tout le trafic HTTP vers HTTPS (301). Activez HSTS avec includeSubDomains et preload.",
    "rpc":        "Bloquez les ports RPC (135, 137-139, 445) au niveau du pare-feu perimetrique.",
    "mysql":      "Limitez l'acces MySQL a 127.0.0.1 ou au reseau interne. Desactivez le compte 'root' distant. Chiffrez les connexions.",
    "postgresql": "Restreignez pg_hba.conf. Activez ssl=on dans postgresql.conf. N'exposez jamais le port 5432 sur Internet.",
    "redis":      "Protegez Redis avec un mot de passe fort (requirepass). Liez-le a 127.0.0.1. Desactivez les commandes dangereuses (FLUSHALL, CONFIG).",
    "mongodb":    "Activez l'authentification MongoDB. Chiffrez les donnees au repos. Bloquez le port 27017 depuis l'exterieur.",
    "vnc":        "Desactivez VNC si non necessaire. Sinon, tunnelez-le via SSH et protegez-le par un mot de passe fort.",
    "telnet":     "Desactivez Telnet immediatement : utilisez SSH a la place. Telnet transmet les donnees en clair.",
    "backdoor":   "CRITIQUE : Isolez l'hote du reseau immediatement. Effectuez une analyse forensique complete avant reinstallation.",
    "exploit":    "Un exploit public est disponible. Appliquez le correctif du fournisseur en urgence ou deployez un WAF/IPS comme mesure temporaire.",
    "default":    "Appliquez les derniers correctifs de securite du fournisseur. Suivez les recommandations CIS Benchmark pour ce service.",
}


def get_advice(title: str, description: str = "") -> str:
    """Retourne un conseil adapte selon les mots-cles de la vulnerabilite."""
    combined = (title + " " + description).lower()
    for kw, advice in VULN_ADVICE.items():
        if kw in combined:
            return advice
    return VULN_ADVICE["default"]


# ─────────────────────────────────────────────────────────────────────────────
# STYLES TYPOGRAPHIQUES
# ─────────────────────────────────────────────────────────────────────────────

def build_styles() -> dict:
    """Cree et retourne le dictionnaire de tous les styles paragraphes."""
    s = {}

    s["report_title"] = ParagraphStyle(
        "report_title", fontName="Helvetica-Bold", fontSize=26,
        leading=32, textColor=FC_DARK, alignment=TA_CENTER, spaceAfter=4,
    )
    s["report_subtitle"] = ParagraphStyle(
        "report_subtitle", fontName="Helvetica", fontSize=13,
        leading=18, textColor=colors.HexColor("#555555"),
        alignment=TA_CENTER, spaceAfter=2,
    )
    s["section_title"] = ParagraphStyle(
        "section_title", fontName="Helvetica-Bold", fontSize=14,
        leading=18, textColor=FC_DARK, spaceBefore=14, spaceAfter=6,
    )
    s["subsection_title"] = ParagraphStyle(
        "subsection_title", fontName="Helvetica-Bold", fontSize=11,
        leading=15, textColor=FC_DARK, spaceBefore=10, spaceAfter=4,
    )
    s["body"] = ParagraphStyle(
        "body", fontName="Helvetica", fontSize=9,
        leading=13, textColor=colors.HexColor("#333333"), spaceAfter=4,
    )
    s["meta"] = ParagraphStyle(
        "meta", fontName="Helvetica", fontSize=9,
        leading=14, textColor=colors.HexColor("#444444"),
    )
    s["advice"] = ParagraphStyle(
        "advice", fontName="Helvetica-Oblique", fontSize=8.5,
        leading=13, textColor=colors.HexColor("#1A5276"),
        spaceAfter=6, spaceBefore=4, leftIndent=8,
    )
    s["table_header"] = ParagraphStyle(
        "table_header", fontName="Helvetica-Bold", fontSize=8,
        leading=11, textColor=colors.white, alignment=TA_CENTER,
    )
    s["table_cell"] = ParagraphStyle(
        "table_cell", fontName="Helvetica", fontSize=8,
        leading=11, textColor=colors.HexColor("#222222"),
    )
    return s


# ─────────────────────────────────────────────────────────────────────────────
# EN-TETE & PIED DE PAGE
# ─────────────────────────────────────────────────────────────────────────────

def _draw_header(canvas, doc):
    """En-tete FinClean : logo + nom du scan + cible."""
    canvas.saveState()
    w = PAGE_W

    # Ligne sous l'en-tete
    canvas.setStrokeColor(FC_LINE)
    canvas.setLineWidth(0.7)
    canvas.line(MARGIN_L, PAGE_H - 20 * mm, w - MARGIN_R, PAGE_H - 20 * mm)

    # "FIN" en dore
    canvas.setFont("Helvetica-Bold", 15)
    canvas.setFillColor(FC_GOLD)
    canvas.drawString(MARGIN_L, PAGE_H - 15 * mm, "FIN")

    # "Clean" en vert — positionne juste apres "FIN"
    fin_w = canvas.stringWidth("FIN", "Helvetica-Bold", 15)
    canvas.setFillColor(FC_GREEN)
    canvas.drawString(MARGIN_L + fin_w, PAGE_H - 15 * mm, "Clean")

    # Nom du rapport a droite
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(colors.HexColor("#888888"))
    canvas.drawRightString(
        w - MARGIN_R, PAGE_H - 14 * mm,
        f"Rapport de Securite — {getattr(doc, '_scan_name', '')}",
    )
    canvas.setFont("Helvetica", 7.5)
    canvas.drawRightString(
        w - MARGIN_R, PAGE_H - 18 * mm,
        f"Cible : {getattr(doc, '_scan_target', '')}",
    )
    canvas.restoreState()


def _draw_footer(canvas, doc):
    """Pied de page : copyright · date · numero de page."""
    canvas.saveState()
    w = PAGE_W

    canvas.setStrokeColor(FC_LINE)
    canvas.setLineWidth(0.5)
    canvas.line(MARGIN_L, MARGIN_B - 4 * mm, w - MARGIN_R, MARGIN_B - 4 * mm)

    now_str = datetime.now().strftime("%d/%m/%Y a %H:%M")
    canvas.setFont("Helvetica", 7.5)
    canvas.setFillColor(colors.HexColor("#888888"))
    canvas.drawString(MARGIN_L, MARGIN_B - 9 * mm, "FinClean — NALA Security Consulting")
    canvas.drawCentredString(w / 2, MARGIN_B - 9 * mm, f"Genere le {now_str}")
    canvas.drawRightString(w - MARGIN_R, MARGIN_B - 9 * mm, f"Page {doc.page}")
    canvas.restoreState()


def _on_page(canvas, doc):
    _draw_header(canvas, doc)
    _draw_footer(canvas, doc)


# ─────────────────────────────────────────────────────────────────────────────
# GRAPHIQUES MATPLOTLIB
# ─────────────────────────────────────────────────────────────────────────────

def _hex_from_rl(rl_color) -> str:
    """Convertit une couleur ReportLab en chaine hex matplotlib."""
    return "#" + rl_color.hexval()[2:]


def _severity_bar_chart(vuln_counts: dict) -> Image:
    """
    Graphique en barres horizontales : distribution des severites.
    Fonctionne meme quand toutes les valeurs sont a zero (machine saine).
    """
    labels     = [SEV_LABELS[s] for s in SEV_ORDER]
    values     = [vuln_counts.get(s, 0) for s in SEV_ORDER]
    mpl_colors = [_hex_from_rl(SEV_COLORS[s]) for s in SEV_ORDER]
    max_val    = max(values) if any(v > 0 for v in values) else 0

    fig, ax = plt.subplots(figsize=(5.5, 2.2))
    bars = ax.barh(
        labels[::-1], values[::-1],
        color=mpl_colors[::-1],
        height=0.55, edgecolor="white", linewidth=0.5,
    )
    for bar, val in zip(bars, values[::-1]):
        if val > 0:
            ax.text(
                bar.get_width() + 0.05,
                bar.get_y() + bar.get_height() / 2,
                str(val), va="center", ha="left",
                fontsize=9, fontweight="bold", color="#333333",
            )

    ax.set_xlim(0, max_val * 1.3 + 1 if max_val > 0 else 3)
    ax.set_xlabel("Nombre de vulnerabilites", fontsize=8, color="#555555")
    ax.set_title("Distribution des Severites", fontsize=10,
                 fontweight="bold", color="#1A1A2E", pad=8)
    ax.tick_params(axis="y", labelsize=8.5)
    ax.tick_params(axis="x", labelsize=7.5)
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    ax.set_facecolor("#FAFAFA")
    fig.patch.set_facecolor("#FAFAFA")

    # Annotation "Aucune vulnerabilite detectee" si tout est a zero
    if max_val == 0:
        ax.text(
            1.5, 2.0,
            "Aucune vulnerabilite detectee",
            ha="center", va="center", fontsize=10,
            color="#2E7D32", fontweight="bold",
            transform=ax.transData,
        )

    plt.tight_layout(pad=0.8)

    buf = io.BytesIO()
    fig.savefig(buf, format="png", dpi=150, bbox_inches="tight",
                facecolor="#FAFAFA")
    plt.close(fig)
    buf.seek(0)
    return Image(buf, width=128 * mm, height=52 * mm)


def _severity_pie_chart(vuln_counts: dict) -> Image:
    """
    Camembert : repartition des severites.
    Affiche un disque gris avec message si aucune vulnerabilite.
    """
    active = [s for s in SEV_ORDER if vuln_counts.get(s, 0) > 0]

    fig, ax = plt.subplots(figsize=(3.0, 2.5))

    if not active:
        # Disque gris placeholder
        ax.pie(
            [1], labels=["Aucune"], colors=["#E0E4EC"],
            startangle=140,
            wedgeprops={"edgecolor": "white", "linewidth": 1.5},
        )
        ax.text(0, 0, "0", ha="center", va="center",
                fontsize=16, fontweight="bold", color="#AAAAAA")
    else:
        vals       = [vuln_counts.get(s, 0) for s in active]
        pie_labels = [SEV_LABELS[s] for s in active]
        pie_colors = [_hex_from_rl(SEV_COLORS[s]) for s in active]
        wedges, texts, autotexts = ax.pie(
            vals, labels=pie_labels, colors=pie_colors,
            autopct="%1.0f%%", startangle=140, pctdistance=0.75,
            wedgeprops={"edgecolor": "white", "linewidth": 1.5},
        )
        for t in texts:
            t.set_fontsize(7.5)
        for at in autotexts:
            at.set_fontsize(7)
            at.set_color("white")
            at.set_fontweight("bold")

    ax.set_title("Repartition", fontsize=9, fontweight="bold",
                 color="#1A1A2E", pad=6)
    fig.patch.set_facecolor("#FAFAFA")
    plt.tight_layout(pad=0.3)

    buf = io.BytesIO()
    fig.savefig(buf, format="png", dpi=150, bbox_inches="tight",
                facecolor="#FAFAFA")
    plt.close(fig)
    buf.seek(0)
    return Image(buf, width=60 * mm, height=52 * mm)


def _port_type_chart(web_ports: int, net_ports: int) -> Image:
    """
    Graphique en barres : ports web vs reseau.
    Gere le cas ou les deux valeurs sont zero.
    """
    fig, ax = plt.subplots(figsize=(3.2, 2.0))
    cats    = ["Services Web", "Services Reseau"]
    vals    = [web_ports, net_ports]
    colors_ = ["#1976D2", "#455A64"]
    max_val = max(vals) if any(v > 0 for v in vals) else 0

    ax.bar(cats, vals, color=colors_, width=0.45,
           edgecolor="white", linewidth=0.8)
    for i, v in enumerate(vals):
        ax.text(i, v + 0.05, str(v), ha="center", va="bottom",
                fontsize=9, fontweight="bold", color="#333333")

    ax.set_title("Ports par Type", fontsize=9, fontweight="bold",
                 color="#1A1A2E", pad=6)
    ax.set_ylim(0, max_val * 1.4 + 1 if max_val > 0 else 3)
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    ax.tick_params(labelsize=8)
    ax.set_facecolor("#FAFAFA")
    fig.patch.set_facecolor("#FAFAFA")
    plt.tight_layout(pad=0.5)

    buf = io.BytesIO()
    fig.savefig(buf, format="png", dpi=150, bbox_inches="tight",
                facecolor="#FAFAFA")
    plt.close(fig)
    buf.seek(0)
    return Image(buf, width=62 * mm, height=44 * mm)


def _cvss_distribution_chart(all_vulns: list) -> Image:
    """
    Histogramme de la distribution des scores CVSS parmi toutes
    les vulnerabilites ayant un score renseigne.
    """
    scores = [v.cvss_score for v in all_vulns if v.cvss_score is not None]
    if not scores:
        return None

    fig, ax = plt.subplots(figsize=(5.5, 2.0))
    bins = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    n, _, patches = ax.hist(scores, bins=bins, edgecolor="white", linewidth=0.7)

    # Colorer chaque barre selon la plage CVSS
    bin_colors = {
        (0, 4):   "#F9A825",   # low
        (4, 7):   "#FB8C00",   # medium
        (7, 9):   "#E53935",   # high
        (9, 10):  "#B71C1C",   # critical
    }
    for patch in patches:
        x = patch.get_x()
        for (lo, hi), c in bin_colors.items():
            if lo <= x < hi:
                patch.set_facecolor(c)
                break

    ax.set_xlabel("Score CVSS", fontsize=8, color="#555555")
    ax.set_ylabel("Nombre", fontsize=8, color="#555555")
    ax.set_title("Distribution des Scores CVSS", fontsize=10,
                 fontweight="bold", color="#1A1A2E", pad=8)
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    ax.set_facecolor("#FAFAFA")
    fig.patch.set_facecolor("#FAFAFA")
    plt.tight_layout(pad=0.8)

    buf = io.BytesIO()
    fig.savefig(buf, format="png", dpi=150, bbox_inches="tight",
                facecolor="#FAFAFA")
    plt.close(fig)
    buf.seek(0)
    return Image(buf, width=128 * mm, height=46 * mm)


# ─────────────────────────────────────────────────────────────────────────────
# COMPOSANTS REUTILISABLES
# ─────────────────────────────────────────────────────────────────────────────

def section_separator() -> list:
    """Separateur vert epais sous un titre de section."""
    return [
        Spacer(1, 2),
        HRFlowable(width="100%", thickness=1.5, color=FC_GREEN,
                   spaceAfter=6, spaceBefore=2),
    ]


def thin_separator() -> HRFlowable:
    """Separateur fin gris entre items."""
    return HRFlowable(width="100%", thickness=0.4, color=FC_LINE,
                      spaceAfter=5, spaceBefore=5)


def advice_box(text: str, bg: str = "#EAFAF1", border: str = "#2E7D32",
               styles: dict = None) -> Table:
    """Encadre colore pour un conseil ou une remediation."""
    para = Paragraph(text, styles["advice"] if styles else ParagraphStyle(
        "_adv", fontName="Helvetica-Oblique", fontSize=8.5, leading=13,
        textColor=colors.HexColor("#1A5276"), leftIndent=8,
    ))
    t = Table(
        [[para]],
        colWidths=[PAGE_W - MARGIN_L - MARGIN_R - 4 * mm],
    )
    t.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, -1), colors.HexColor(bg)),
        ("LEFTPADDING",   (0, 0), (-1, -1), 10),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 10),
        ("TOPPADDING",    (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("BOX",           (0, 0), (-1, -1), 0.6, colors.HexColor(border)),
    ]))
    return t


# ─────────────────────────────────────────────────────────────────────────────
# SECTIONS DU RAPPORT
# ─────────────────────────────────────────────────────────────────────────────

def build_cover_page(scan: Scan, host, vuln_counts: dict,
                     total_vulns: int, styles: dict) -> list:
    """Page de garde avec logo, metadonnees et tableau recap des severites."""
    elems = []

    # Grand logo FinClean
    elems.append(Spacer(1, 22 * mm))
    elems.append(Paragraph(
        '<font color="#C9A84C"><b>FIN</b></font>'
        '<font color="#2E7D32"><b>Clean</b></font>',
        ParagraphStyle("logo_big", fontName="Helvetica-Bold",
                       fontSize=48, leading=58, alignment=TA_CENTER),
    ))
    elems.append(Spacer(1, 3 * mm))
    elems.append(Paragraph(
        "Rapport de Securite — Evaluation de Posture",
        styles["report_subtitle"],
    ))
    elems.append(Spacer(1, 8 * mm))

    # Titre du scan
    elems.append(Paragraph(scan.name, styles["report_title"]))
    elems.append(Spacer(1, 3 * mm))

    # Metadonnees dans un tableau propre
    meta_rows_data = [
        ("Cible",                    scan.target),
        ("Type de scan",             scan.scan_type.upper()),
        ("Statut",                   scan.status.upper()),
        ("Demarre le",               scan.begin_at.strftime("%d/%m/%Y %H:%M") if scan.begin_at else "—"),
        ("Termine le",               scan.end_at.strftime("%d/%m/%Y %H:%M")   if scan.end_at   else "En cours"),
    ]
    if host:
        meta_rows_data += [
            ("Adresse IP",           host.ip_address),
            ("Systeme d'exploitation", host.os or "Non detecte"),
            ("CPE",                  host.cpe or "—"),
            ("Criticite metier",     f"{host.business_criticality} / 10"),
        ]

    meta_rows = [[
        Paragraph(f"<b>{k}</b>", styles["meta"]),
        Paragraph(str(v), styles["meta"]),
    ] for k, v in meta_rows_data]

    meta_t = Table(meta_rows, colWidths=[55 * mm, 105 * mm], hAlign="CENTER")
    meta_t.setStyle(TableStyle([
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [colors.white, FC_LIGHT]),
        ("GRID",           (0, 0), (-1, -1), 0.3, FC_LINE),
        ("TOPPADDING",     (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING",  (0, 0), (-1, -1), 5),
        ("LEFTPADDING",    (0, 0), (-1, -1), 8),
        ("RIGHTPADDING",   (0, 0), (-1, -1), 8),
    ]))
    elems.append(meta_t)
    elems.append(Spacer(1, 8 * mm))

    # Tableau recap severites (style Acunetix)
    elems.append(Paragraph("Resume des Vulnerabilites", styles["section_title"]))
    elems.extend(section_separator())

    header_cells = [
        Paragraph(
            f'<font color="white"><b>{SEV_LABELS[s]}</b></font>',
            ParagraphStyle("th", fontSize=9, alignment=TA_CENTER,
                           fontName="Helvetica-Bold"),
        )
        for s in SEV_ORDER
    ]
    count_cells = [
        Paragraph(
            f'<b>{vuln_counts.get(s, 0)}</b>',
            ParagraphStyle("cnt", fontSize=26, alignment=TA_CENTER,
                           fontName="Helvetica-Bold",
                           textColor=SEV_COLORS[s]),
        )
        for s in SEV_ORDER
    ]

    sev_t = Table(
        [header_cells, count_cells],
        colWidths=[34 * mm] * 5,
        rowHeights=[10 * mm, 20 * mm],
        hAlign="CENTER",
    )
    sev_t.setStyle(TableStyle([
        *[("BACKGROUND", (i, 0), (i, 0), SEV_COLORS[s])
          for i, s in enumerate(SEV_ORDER)],
        ("BACKGROUND",    (0, 1), (-1, 1), colors.white),
        ("BOX",           (0, 0), (-1, -1), 0.5, FC_LINE),
        ("INNERGRID",     (0, 0), (-1, -1), 0.3, FC_LINE),
        ("ALIGN",         (0, 0), (-1, -1), "CENTER"),
        ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING",    (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    elems.append(sev_t)
    elems.append(Spacer(1, 4 * mm))

    if total_vulns == 0:
        # Badge "machine saine" en vert
        sain_para = Paragraph(
            '<font color="#2E7D32"><b>Aucune vulnerabilite detectee — Machine saine</b></font>',
            ParagraphStyle("sain", fontSize=11, alignment=TA_CENTER,
                           fontName="Helvetica-Bold"),
        )
        sain_box = Table([[sain_para]], colWidths=[170 * mm], hAlign="CENTER")
        sain_box.setStyle(TableStyle([
            ("BACKGROUND",    (0, 0), (-1, -1), colors.HexColor("#EAFAF1")),
            ("BOX",           (0, 0), (-1, -1), 1.0, FC_GREEN),
            ("TOPPADDING",    (0, 0), (-1, -1), 8),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ("ALIGN",         (0, 0), (-1, -1), "CENTER"),
        ]))
        elems.append(sain_box)
    else:
        elems.append(Paragraph(
            f"Total : <b>{total_vulns}</b> vulnerabilite(s) detectee(s)",
            ParagraphStyle("total", fontSize=10, alignment=TA_CENTER,
                           textColor=colors.HexColor("#333333")),
        ))

    elems.append(PageBreak())
    return elems


def build_stats_page(vuln_counts: dict, port_count: int, web_ports: int,
                     net_ports: int, total_vulns: int,
                     all_vulns: list, styles: dict) -> list:
    """Page de statistiques : KPI, graphiques barres + camembert + CVSS."""
    elems = []
    elems.append(Paragraph("Analyse Statistique", styles["section_title"]))
    elems.extend(section_separator())
    elems.append(Spacer(1, 4 * mm))

    # KPI cards
    kpi_items = [
        (str(port_count), "Ports ouverts",    "#1A1A2E"),
        (str(total_vulns), "Vulnerabilites",   "#1A1A2E"),
        (str(web_ports),   "Services Web",     "#1976D2"),
        (str(net_ports),   "Services Reseau",  "#455A64"),
    ]
    kpi_cells = [[
        Paragraph(
            f'<font color="{c}"><b>{v}</b></font><br/>'
            f'<font color="#888888">{lbl}</font>',
            ParagraphStyle("kpi", fontSize=12, alignment=TA_CENTER, leading=18),
        )
        for v, lbl, c in kpi_items
    ]]
    kpi_t = Table(kpi_cells, colWidths=[42 * mm] * 4,
                  rowHeights=[20 * mm], hAlign="CENTER")
    kpi_t.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, -1), FC_LIGHT),
        ("BOX",           (0, 0), (-1, -1), 0.5, FC_LINE),
        ("INNERGRID",     (0, 0), (-1, -1), 0.3, FC_LINE),
        ("ALIGN",         (0, 0), (-1, -1), "CENTER"),
        ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING",    (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    elems.append(kpi_t)
    elems.append(Spacer(1, 6 * mm))

    # Barres + Camembert cote a cote
    bar_img = _severity_bar_chart(vuln_counts)
    pie_img = _severity_pie_chart(vuln_counts)
    charts_t = Table([[bar_img, pie_img]],
                     colWidths=[132 * mm, 40 * mm], hAlign="LEFT")
    charts_t.setStyle(TableStyle([
        ("ALIGN",  (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    elems.append(charts_t)
    elems.append(Spacer(1, 6 * mm))

    # Distribution CVSS
    cvss_img = _cvss_distribution_chart(all_vulns)
    if cvss_img:
        elems.append(Paragraph(
            "Distribution des Scores CVSS", styles["subsection_title"]
        ))
        elems.append(cvss_img)
        elems.append(Spacer(1, 6 * mm))

    # Ports web vs reseau
    elems.append(Paragraph("Repartition des Services par Type", styles["subsection_title"]))
    elems.append(_port_type_chart(web_ports, net_ports))

    elems.append(PageBreak())
    return elems


def build_impacts_table(all_vulns: list, styles: dict) -> list:
    """
    Tableau recapitulatif des impacts (style Acunetix) :
    severite | instances | titre | CVSS | exploit disponible.
    """
    elems = []
    elems.append(Paragraph("Impacts", styles["section_title"]))
    elems.extend(section_separator())
    elems.append(Spacer(1, 3 * mm))

    rows = [[
        Paragraph("<b>SEVERITE</b>",  styles["table_header"]),
        Paragraph("<b>INST.</b>",     styles["table_header"]),
        Paragraph("<b>VULNERABILITE</b>", styles["table_header"]),
        Paragraph("<b>CVSS</b>",      styles["table_header"]),
        Paragraph("<b>EXPLOIT</b>",   styles["table_header"]),
        Paragraph("<b>RISK SCORE</b>",styles["table_header"]),
    ]]

    for vuln in all_vulns:
        sev       = vuln.severity.lower()
        sev_color = SEV_COLORS.get(sev, colors.gray)
        sev_hex   = _hex_from_rl(sev_color)

        rows.append([
            Paragraph(
                f'<font color="{sev_hex}"><b>{SEV_LABELS.get(sev, sev.title())}</b></font>',
                styles["table_cell"],
            ),
            Paragraph("1", ParagraphStyle("c", fontSize=8, alignment=TA_CENTER)),
            Paragraph(vuln.title, styles["table_cell"]),
            Paragraph(
                f"{vuln.cvss_score:.1f}" if vuln.cvss_score else "—",
                ParagraphStyle("c2", fontSize=8, alignment=TA_CENTER),
            ),
            Paragraph(
                '<font color="#B71C1C"><b>Oui</b></font>'
                if vuln.exploit_available
                else '<font color="#555555">Non</font>',
                ParagraphStyle("c3", fontSize=8, alignment=TA_CENTER),
            ),
            Paragraph(
                f"{vuln.risk_score:.2f}" if vuln.risk_score else "—",
                ParagraphStyle("c4", fontSize=8, alignment=TA_CENTER),
            ),
        ])

    t = Table(
        rows,
        colWidths=[28 * mm, 14 * mm, 78 * mm, 16 * mm, 18 * mm, 18 * mm],
        repeatRows=1,
    )
    row_bgs = [
        ("BACKGROUND", (0, i + 1), (-1, i + 1), SEV_LIGHT.get(v.severity.lower(), colors.white))
        for i, v in enumerate(all_vulns)
    ]
    t.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, 0), FC_DARK),
        ("TEXTCOLOR",     (0, 0), (-1, 0), colors.white),
        ("FONTNAME",      (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE",      (0, 0), (-1, 0), 8.5),
        ("ALIGN",         (0, 0), (-1, 0), "CENTER"),
        ("FONTSIZE",      (0, 1), (-1, -1), 8),
        ("GRID",          (0, 0), (-1, -1), 0.3, FC_LINE),
        ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING",    (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING",   (0, 0), (-1, -1), 6),
        *row_bgs,
    ]))
    elems.append(t)
    elems.append(PageBreak())
    return elems


def build_host_section(host, styles: dict) -> list:
    """Section details de l'hote (IP, OS, CPE, latence, stats ports)."""
    elems = []
    elems.append(Paragraph("Informations sur l'Hote", styles["section_title"]))
    elems.extend(section_separator())

    rows = [[
        Paragraph(f"<b>{k}</b>", styles["meta"]),
        Paragraph(str(v), styles["meta"]),
    ] for k, v in [
        ("Adresse IP",                host.ip_address or "—"),
        ("Systeme d'exploitation",    host.os or "Non detecte"),
        ("CPE",                       host.cpe or "—"),
        ("Latence",                   f"{host.latency} ms" if host.latency else "—"),
        ("Ports ouverts",             str(host.open_ports)),
        ("Ports fermes",              str(host.closed_ports)),
        ("Ports filtres",             str(host.filtered_ports)),
        ("Total ports scannes",       str(host.total_ports_scanned)),
        ("Criticite metier",          f"{host.business_criticality} / 10"),
    ]]

    t = Table(rows, colWidths=[55 * mm, 110 * mm])
    t.setStyle(TableStyle([
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [colors.white, FC_LIGHT]),
        ("GRID",           (0, 0), (-1, -1), 0.3, FC_LINE),
        ("TOPPADDING",     (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING",  (0, 0), (-1, -1), 5),
        ("LEFTPADDING",    (0, 0), (-1, -1), 8),
        ("RIGHTPADDING",   (0, 0), (-1, -1), 8),
    ]))
    elems.append(t)
    elems.append(Spacer(1, 8 * mm))
    return elems


def build_vuln_detail(vuln, styles: dict) -> list:
    """
    Bloc detaille d'une vulnerabilite unique.
    Inclut : titre colore, metadonnees, description,
    remediation constructeur, conseil FinClean dynamique.
    """
    elems = []
    sev      = vuln.severity.lower()
    sev_col  = SEV_COLORS.get(sev, colors.gray)
    sev_hex  = _hex_from_rl(sev_col)

    # Titre avec pastille de couleur
    elems.append(Paragraph(
        f'<font color="{sev_hex}"><b>■</b></font>  {vuln.title}',
        ParagraphStyle("vt", fontName="Helvetica-Bold", fontSize=10,
                       leading=14, textColor=FC_DARK, spaceBefore=4),
    ))

    # Ligne de meta
    cve_str     = f"CVE : <b>{vuln.cve_id}</b>" if vuln.cve_id else "CVE : —"
    cvss_str    = f"CVSS : <b>{vuln.cvss_score:.1f}</b>" if vuln.cvss_score else "CVSS : —"
    exploit_str = (
        '<font color="#B71C1C"><b>Exploit public disponible</b></font>'
        if vuln.exploit_available
        else '<font color="#555555">Aucun exploit public connu</font>'
    )
    risk_str = f"Risk Score : <b>{vuln.risk_score:.2f}</b>" if vuln.risk_score else ""
    meta_line = f"{cve_str} &nbsp;|&nbsp; {cvss_str} &nbsp;|&nbsp; {exploit_str}"
    if risk_str:
        meta_line += f" &nbsp;|&nbsp; {risk_str}"
    elems.append(Paragraph(meta_line, styles["body"]))

    # Description
    if vuln.description:
        elems.append(Paragraph(
            textwrap.shorten(vuln.description, width=600, placeholder="..."),
            styles["body"],
        ))

    # Remediation constructeur (boite bleue)
    if vuln.remediation:
        elems.append(advice_box(
            f"<b>Remediation :</b> "
            f"{textwrap.shorten(vuln.remediation, 400, placeholder='...')}",
            bg="#EBF5FB", border="#AED6F1", styles=styles,
        ))

    # Conseil FinClean dynamique (boite verte)
    elems.append(advice_box(
        f"<b>Conseil FinClean :</b> {get_advice(vuln.title, vuln.description or '')}",
        bg="#EAFAF1", border="#2E7D32", styles=styles,
    ))

    elems.append(Spacer(1, 5 * mm))
    return elems


def build_ports_section(host, styles: dict) -> list:
    """
    Section 'Ports et Vulnerabilites Reseau' :
    un bloc par port avec ses vulnerabilites detaillees.
    """
    elems = []
    elems.append(Paragraph(
        "Detail des Ports et Vulnerabilites Reseau",
        styles["section_title"],
    ))
    elems.extend(section_separator())
    elems.append(Spacer(1, 3 * mm))

    for port in host.ports.all():
        # Type de service
        svc_type   = "Web" if port.is_web_service else "Reseau"
        risk_flag  = " — Potentiellement risque" if port.is_potentially_risky else ""
        version_str = f" v{port.version}" if port.version else ""

        elems.append(Paragraph(
            f"Port <b>{port.port_number}/{port.protocol.upper()}</b>"
            f" — {port.service or 'Service inconnu'}{version_str}",
            styles["subsection_title"],
        ))
        elems.append(Paragraph(
            f"Etat : <b>{port.state}</b> &nbsp;|&nbsp; "
            f"Type : <b>{svc_type}</b>{risk_flag}",
            styles["body"],
        ))

        # Banner (si disponible)
        if port.banner:
            banner_str = port.banner[:150] + ("..." if len(port.banner) > 150 else "")
            elems.append(Paragraph(
                f'<font color="#888888" face="Courier">Banner : {banner_str}</font>',
                ParagraphStyle("ban", fontSize=7.5, fontName="Courier",
                               textColor=colors.HexColor("#555555"), leading=11),
            ))

        # Vulnerabilites du port
        vulns = list(port.vulnerabilities.all())
        if not vulns:
            elems.append(Paragraph(
                '<font color="#2E7D32"><b>Aucune vulnerabilite detectee sur ce port.</b></font>',
                styles["body"],
            ))
        else:
            elems.append(Spacer(1, 3 * mm))
            elems.append(Paragraph(
                f"<b>{len(vulns)}</b> vulnerabilite(s) detectee(s) sur ce port :",
                styles["body"],
            ))
            elems.append(Spacer(1, 2 * mm))
            for vuln in vulns:
                elems.extend(build_vuln_detail(vuln, styles))

        elems.append(thin_separator())

    return elems


# ─────────────────────────────────────────────────────────────────────────────
# ASSEMBLAGE DU DOCUMENT FINAL
# ─────────────────────────────────────────────────────────────────────────────

def build_pdf(scan: Scan) -> bytes:
    """
    Assemble toutes les sections et retourne le PDF complet en bytes.

    Structure du rapport :
      1. Page de garde (logo, meta, recap severites)
      2. Statistiques graphiques (KPI, barres, camembert, CVSS, ports)
      3. Tableau des impacts
      4. Informations sur l'hote
      5. Detail des ports reseau + vulnerabilites
    """
    buf = io.BytesIO()

    doc = BaseDocTemplate(
        buf,
        pagesize=A4,
        leftMargin=MARGIN_L,
        rightMargin=MARGIN_R,
        topMargin=MARGIN_T,
        bottomMargin=MARGIN_B,
        title=f"FinClean — {scan.name}",
        author="FinClean / NALA Security Consulting",
    )

    # Exposition des metadonnees au canvas (en-tete)
    doc._scan_name   = scan.name
    doc._scan_target = scan.target

    frame = Frame(
        MARGIN_L, MARGIN_B,
        PAGE_W - MARGIN_L - MARGIN_R,
        PAGE_H - MARGIN_T - MARGIN_B,
        id="main",
    )
    doc.addPageTemplates([
        PageTemplate(id="all", frames=[frame], onPage=_on_page)
    ])

    styles = build_styles()

    # ── Agregation des donnees ──
    host      = getattr(scan, "host_info", None)
    all_ports = list(host.ports.all()) if host else []

    # Toutes les vulns : par port + vulns directes sur l'hote (sans port)
    all_vulns: list = []
    for p in all_ports:
        all_vulns.extend(p.vulnerabilities.all())
    if host:
        all_vulns.extend(scan.vulnerabilities.filter(port__isnull=True))

    # Tri : critical > high > medium > low > info
    sev_rank = {s: i for i, s in enumerate(SEV_ORDER)}
    all_vulns.sort(key=lambda v: sev_rank.get(v.severity.lower(), 99))

    vuln_counts  = Counter(v.severity.lower() for v in all_vulns)
    total_vulns  = len(all_vulns)
    port_count   = len(all_ports)
    web_ports    = sum(1 for p in all_ports if p.is_web_service)
    net_ports    = port_count - web_ports

    story = []

    # 1. Page de garde
    story.extend(build_cover_page(
        scan, host, vuln_counts, total_vulns, styles
    ))

    # 2. Statistiques graphiques
    story.extend(build_stats_page(
        vuln_counts, port_count, web_ports, net_ports,
        total_vulns, all_vulns, styles
    ))

    # 3. Tableau des impacts
    if all_vulns:
        story.extend(build_impacts_table(all_vulns, styles))

    # 4. Informations hote
    if host:
        story.extend(build_host_section(host, styles))

    # 5. Ports reseau + vulnerabilites
    if host and all_ports:
        story.extend(build_ports_section(host, styles))

    doc.build(story)
    buf.seek(0)
    return buf.read()


# ─────────────────────────────────────────────────────────────────────────────
# VUE DJANGO REST
# ─────────────────────────────────────────────────────────────────────────────

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def export_scan_pdf(request, scan_id: int):
    """
    GET /api/scans/<scan_id>/export/pdf/

    Genere et retourne un rapport PDF professionnel pour le scan demande.
    Le scan doit appartenir a l'utilisateur authentifie (isolation stricte).

    Reponses :
      200  — PDF binaire en piece jointe (Content-Disposition: attachment)
      404  — Scan introuvable ou n'appartenant pas a l'utilisateur
      500  — Erreur interne lors de la recuperation ou de la generation
    """
    try:
        scan = (
            Scan.objects
            .prefetch_related(
                "host_info__ports__vulnerabilities",
                "host_info__ports",
                "vulnerabilities",
            )
            .get(scan_id=scan_id, user=request.user)
        )
    except Scan.DoesNotExist:
        return HttpResponse(
            "Scan introuvable ou acces non autorise.",
            status=404,
            content_type="text/plain; charset=utf-8",
        )
    except Exception as exc:
        return HttpResponse(
            f"Erreur lors de la recuperation du scan : {exc}",
            status=500,
            content_type="text/plain; charset=utf-8",
        )

    try:
        pdf_bytes = build_pdf(scan)
    except Exception as exc:
        return HttpResponse(
            f"Erreur lors de la generation du rapport PDF : {exc}",
            status=500,
            content_type="text/plain; charset=utf-8",
        )

    filename = (
        f"FinClean_Rapport_{scan_id}_"
        f"{datetime.now().strftime('%Y%m%d_%H%M')}.pdf"
    )
    response = HttpResponse(pdf_bytes, content_type="application/pdf")
    response["Content-Disposition"] = f'attachment; filename="{filename}"'
    response["Content-Length"]      = len(pdf_bytes)
    return response