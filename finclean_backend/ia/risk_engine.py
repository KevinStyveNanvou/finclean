def compute_technical_risk(cvss, exploit_available, verified, remote=True, criticality=5):
    """
    Calcule le risque technique en incluant la criticité métier.
    Criticité : 1-10, où 10 est la plus critique.
    """
    score = 0

    # Risque technique de base
    score += cvss * 0.5
    score += 2 if exploit_available else 0
    score += 1 if verified else 0
    score += 2 if remote else 0

    # Impact métier : multiplier par criticité (normalisée 0.1 à 1.0)
    business_impact = criticality / 10.0
    total_risk = score * business_impact

    return round(total_risk, 2)