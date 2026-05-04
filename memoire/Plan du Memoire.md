

**PLAN FINAL DU MÉMOIRE — FINCLEAN** **MISE EN PLACE D'UNE PLATEFORME D'ÉVALUATION CONTINUE DE LA POSTURE DE SÉCURITÉ AVEC ASSISTANCE INTELLIGENTE À L'EXPLOITATION (RAG)**

---

**PAGES LIMINAIRES** — _~10 pages_

- Page de garde
- Dédicace _(1 page)_
- Remerciements _(1 page)_
- Table des matières
- Liste des sigles et abréviations
- Résumé / Abstract _(2 pages)_
- Liste des tableaux
- Liste des figures et illustrations

---

**INTRODUCTION GÉNÉRALE** ✅ — _~2 pages_

---

**CHAPITRE I : CONTEXTE, PROBLÉMATIQUE ET MÉTHODOLOGIE** — _~14 pages_

- I.1. Présentation du cadre de stage _(2 pages)_
    - I.1.1. Présentation de Nala Security Consulting
    - I.1.2. Contexte opérationnel et motivation du sujet
- I.2. Contexte général _(6 pages)_
    - I.2.1. La transformation numérique et l'élargissement des surfaces d'attaque
    - I.2.2. Panorama des cybermenaces en Afrique et au Cameroun _(avec données chiffrées, tableau, figure)_
    - I.2.3. Les vulnérabilités comme principal vecteur d'attaque
    - I.2.4. Cadre normatif de référence _(ISO 27001, NIST CSF, loi camerounaise)_
- I.3. Problématique _(3 pages)_
    - I.3.1. Limites des outils existants _(tableau comparatif critères)_
    - I.3.2. Questions de recherche
    - I.3.3. Problématique centrale _(encadrée)_
- I.4. Méthodologie _(2 pages)_
    - I.4.1. Démarche adoptée _(analyse → conception → implémentation → validation)_
    - I.4.2. Protocole de validation _(Metasploitable2, métriques retenues)_
- I.5. Objectifs _(1 page)_
    - I.5.1. Objectif général
    - I.5.2. Objectifs spécifiques

---

**CHAPITRE II : ÉTAT DE L'ART ET CADRE CONCEPTUEL** — _~18 pages_

- II.1. La gestion des vulnérabilités _(4 pages)_
    - II.1.1. Définition et cycle de vie d'une vulnérabilité
    - II.1.2. Standards de classification _(CVE, CVSS, CWE)_ — direct, sans cours
    - II.1.3. Le concept d'évaluation continue de la posture de sécurité
- II.2. Outils de scan existants et analyse critique _(5 pages)_
    - II.2.1. Nmap : principes et capacités
    - II.2.2. Solutions commerciales et open source _(Nessus, Qualys, OpenVAS)_
    - II.2.3. Tableau comparatif critique _(coût, souveraineté, corrélation, intelligence)_
- II.3. Les bases de données de vulnérabilités et d'exploits _(4 pages)_
    - II.3.1. Le NVD/NIST : structure et exploitation
    - II.3.2. ExploitDB : structure et valeur opérationnelle
    - II.3.3. Corrélation CVE → exploit : enjeux et gap actuel
- II.4. L'intelligence artificielle appliquée à la cybersécurité _(3 pages)_
    - II.4.1. Généralités sur les LLM _(condensé)_
    - II.4.2. Le paradigme RAG : principes et avantages sur le fine-tuning
    - II.4.3. RAG local vs API distante : enjeux de souveraineté
- II.5. Positionnement de FinClean _(2 pages)_
    - II.5.1. Ce que font les outils existants
    - II.5.2. Ce que FinClean fait différemment et mieux
    - II.5.3. Synthèse de la contribution

---

**CHAPITRE III : CONCEPTION ET ARCHITECTURE DE FINCLEAN** — _~18 pages_

- III.1. Cahier des charges _(4 pages)_
    - III.1.1. Besoins fonctionnels
    - III.1.2. Besoins non fonctionnels _(performance, sécurité, souveraineté)_
    - III.1.3. Contraintes techniques
- III.2. Architecture globale _(4 pages)_
    - III.2.1. Vue d'ensemble de l'architecture _(figure)_
    - III.2.2. Diagramme des composants
    - III.2.3. Diagramme des cas d'utilisation
    - III.2.4. Modèle de données _(diagramme entité-relation)_
- III.3. Conception des modules critiques _(8 pages)_
    - III.3.1. Workflow du scan : de Nmap à la corrélation CVE/ExploitDB _(diagramme de séquence)_
    - III.3.2. Modèle de scoring de criticité métier _(formule, critères, justification)_
    - III.3.3. Architecture du scheduler _(scan permanent paramétrable)_
    - III.3.4. Architecture du module RAG local _(diagramme de séquence RAG)_
    - III.3.5. Workflow de génération du rapport PDF
- III.4. Choix technologiques et justifications _(2 pages)_
    - III.4.1. Backend : Django, DRF, SimpleJWT, subprocess
    - III.4.2. Frontend : Next.js
    - III.4.3. Temps réel : PostgreSQL, Redis, WebSocket
    - III.4.4. LLM local : Ollama + Mistral _(pourquoi Mistral et pas LLaMA ou Phi-3)_

---

**CHAPITRE IV : IMPLÉMENTATION ET MISE EN ŒUVRE** — _~18 pages_

- IV.1. Environnement de développement _(2 pages)_
    - IV.1.1. Configuration matérielle et logicielle
    - IV.1.2. Structure du projet
- IV.2. Développement du backend _(7 pages)_
    - IV.2.1. Authentification et gestion des utilisateurs _(SimpleJWT)_
    - IV.2.2. Orchestration du moteur de scan Nmap _(3 niveaux, détection OS, vitesse)_
    - IV.2.3. Pipeline de corrélation NVD/NIST et ExploitDB
    - IV.2.4. Système de scan permanent _(scheduler paramétrable)_
    - IV.2.5. Communication temps réel _(WebSocket, Redis)_
- IV.3. Développement du module RAG _(4 pages)_
    - IV.3.1. Préparation et indexation de la base ExploitDB
    - IV.3.2. Pipeline de recherche et génération _(embeddings, ranking)_
    - IV.3.3. Interface AI Secure Chat _(garde-fous, limites assumées)_
    - IV.3.4. Mise à jour dynamique de la base de connaissances
- IV.4. Développement du frontend _(3 pages)_
    - IV.4.1. Dashboard et visualisations statistiques
    - IV.4.2. Interface de gestion des scans et résultats
    - IV.4.3. Interface des scans permanents et courbes d'évolution
- IV.5. Génération des rapports PDF professionnels _(2 pages)_

---

**CHAPITRE V : RÉSULTATS ET DISCUSSIONS** — _~14 pages_

- V.1. Environnement de test et protocole expérimental _(2 pages)_
    - V.1.1. Configuration du laboratoire _(Metasploitable2, topologie réseau, config matérielle)_
    - V.1.2. Scénarios et métriques d'évaluation
- V.2. Résultats du module de scan _(5 pages)_
    - V.2.1. Vulnérabilités détectées sur Metasploitable2 _(captures, tableau de résultats)_
    - V.2.2. Performance du scheduler _(courbes temporelles, fidélité des exécutions)_
    - V.2.3. Qualité et contenu des rapports PDF générés
- V.3. Résultats du module RAG _(3 pages)_
    - V.3.1. Exemples concrets d'assistance à l'exploitation
    - V.3.2. Taux de pertinence des recommandations
    - V.3.3. Vérification de la souveraineté _(aucun flux sortant constaté)_
- V.4. Analyse comparative _(2 pages)_
    - V.4.1. FinClean vs OpenVAS sur environnement commun _(tableau)_
    - V.4.2. Synthèse coût / souveraineté / fonctionnalités
- V.5. Discussion critique _(2 pages)_
    - V.5.1. Forces de la solution
    - V.5.2. Limites identifiées et perspectives _(faux positifs, scalabilité, fraîcheur des données)_

---

**CONCLUSION ET PERSPECTIVES** — _~2 pages_

---

**BIBLIOGRAPHIE** _(Style IEEE)_ — _~2 pages_

---

**ANNEXES** — _~5 pages_

- Extraits de code significatifs
- Exemple complet de rapport PDF généré
- Configuration Nmap utilisée

---

**TOTAL ESTIMÉ : 87–103 pages** ✅

---
