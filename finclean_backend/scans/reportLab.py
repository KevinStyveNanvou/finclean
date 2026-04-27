from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
import json

# Supposons que ton JSON soit dans un fichier scan.json
with open("scan.json", "r") as f:
    data = json.load(f)

pdf_file = "scan_report.pdf"
c = canvas.Canvas(pdf_file, pagesize=letter)
width, height = letter

y = height - 50

# Infos principales
c.setFont("Helvetica-Bold", 14)
c.drawString(50, y, f"Scan Report: ID {data['scan_id']}")
y -= 20
c.setFont("Helvetica", 12)
c.drawString(50, y, f"Target: {data['target']}")
y -= 20
c.drawString(50, y, f"Status: {data['status']}")
y -= 20
c.drawString(50, y, f"Start: {data['begin_at']}")
y -= 20
c.drawString(50, y, f"End: {data['end_at']}")
y -= 30

# Boucle sur les hosts et ports
for host in data.get("hosts", []):
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, y, f"Host: {host['ip_address']} - OS: {host['os']}")
    y -= 20
    c.setFont("Helvetica", 11)
    for port in host.get("ports", []):
        c.drawString(60, y, f"Port {port['port_number']}/{port['protocol']} - {port['state']} - {port['service']}")
        y -= 15
        for vuln in port.get("vulnerabilities", []):
            c.drawString(70, y, f"Vuln: {vuln['title']} | Severity: {vuln['severity']} | Risk: {vuln['risk_score']}")
            y -= 15
        y -= 5
    y -= 10
    if y < 100:
        c.showPage()
        y = height - 50

c.save()
print(f"PDF généré: {pdf_file}")
