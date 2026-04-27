# ai/services/reporting/report_generator.py

from ia.services.analyts.vulnerability_analyzer import analyze_vulnerability

def generate_report(vulnerabilities):
    report = []

    for vuln in vulnerabilities:
        analysis = analyze_vulnerability(vuln)

        report.append({
            "vulnerability": vuln["name"],
            "analysis": analysis
        })

    return report