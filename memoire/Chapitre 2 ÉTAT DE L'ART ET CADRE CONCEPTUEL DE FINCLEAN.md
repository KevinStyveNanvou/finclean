
---

**II.1.1. Définition et cycle de vie d'une vulnérabilité**

Comme nous l'avons évoqué au chapitre précédent, une vulnérabilité est une faiblesse dans un système, un logiciel ou un processus, susceptible d'être exploitée par un acteur malveillant pour compromettre la confidentialité, l'intégrité ou la disponibilité d'un système d'information. Il est important de préciser qu'une vulnérabilité ne se limite pas à un simple bug de code. Elle peut tout aussi bien provenir d'une mauvaise conception architecturale, d'une application mal configurée, d'un composant logiciel obsolète, ou encore d'une absence de contrôle d'accès sur une ressource sensible [11].

Ces failles ne sont pas statiques. Elles naissent, évoluent et disparaissent au gré des mises à jour, des nouvelles découvertes et des correctifs appliqués. C'est ce qui a conduit la communauté de la cybersécurité à formaliser ce qu'on appelle le cycle de vie de la gestion des vulnérabilités. L'idée est simple : plutôt que de réagir au coup par coup quand un incident survient, une organisation doit surveiller en permanence l'état de santé de ses systèmes, de façon structurée et continue [12].

Ce cycle s'articule autour de six phases. On commence par la découverte, qui consiste simplement à savoir ce qu'on possède. Serveurs, postes de travail, applications, équipements réseau... on ne peut pas protéger ce qu'on ne connaît pas. Vient ensuite l'évaluation, où l'on analyse chaque actif identifié pour détecter les failles présentes, en confrontant les versions logicielles utilisées aux bases de données de vulnérabilités connues.

Une fois les failles détectées, encore faut-il savoir lesquelles traiter en priorité. C'est l'objet de la troisième phase, la priorisation. Toutes les vulnérabilités ne présentent pas le même niveau de danger. Une faille critique sur un serveur exposé à internet n'a pas le même poids qu'une faille mineure sur une machine isolée. On classe donc selon la sévérité, la criticité de l'actif et la disponibilité d'un exploit connu [12].

La quatrième phase est la remédiation, c'est-à-dire l'action concrète. On corrige ce qu'on peut corriger, on atténue ce qu'on ne peut pas encore corriger, et on documente ce qu'on choisit d'accepter temporairement. Après quoi vient la vérification : on rescanne pour s'assurer que la correction a bien fonctionné et qu'on n'a pas introduit de nouveaux problèmes en chemin. Enfin, la sixième phase est celle du suivi dans le temps. On produit des tableaux de bord, on observe les tendances, on ajuste les priorités. C'est cette phase qui transforme une simple opération de scan en une véritable démarche d'amélioration continue [13].

Ce caractère continu n'est pas un luxe. En 2024, plus de 40 000 nouvelles vulnérabilités ont été publiées dans les bases de données officielles, soit une hausse de 38 % par rapport à l'année précédente [13]. Dans ce contexte, une organisation qui n'évalue ses systèmes qu'une fois par trimestre s'expose à des semaines entières où des failles critiques peuvent exister sans être détectées ni corrigées.

---

**II.1.2. Standards de classification : CVE, CVSS et CWE**

Détecter une vulnérabilité, c'est bien. Encore faut-il pouvoir en parler de la même façon entre un outil de scan, un éditeur de logiciel, un chercheur en sécurité et une équipe technique. C'est précisément pour répondre à ce besoin de langage commun que la communauté internationale a mis en place trois standards de classification qui font aujourd'hui référence : le CVE, le CVSS et le CWE [14].

Le CVE, pour Common Vulnerabilities and Exposures, est simplement un identifiant unique attribué à chaque vulnérabilité publiquement divulguée. Initié en 1999 par l'organisme MITRE, il suit le format CVE-ANNÉE-NUMÉRO, par exemple CVE-2011-2523 pour la fameuse backdoor vsFTPd que l'on retrouve sur Metasploitable2. Chaque entrée CVE décrit la faille, référence les avis de sécurité des éditeurs concernés et pointe vers les données d'enrichissement disponibles dans le NVD [14]. En 2025, ce sont 48 185 nouvelles entrées CVE qui ont été publiées, soit une augmentation de 20,6 % par rapport à 2024, portant le total cumulé depuis 1999 à plus de 308 000 vulnérabilités répertoriées [15].

Le CVSS, pour Common Vulnerability Scoring System, est le système de notation qui permet d'évaluer la sévérité d'une vulnérabilité sur une échelle de 0 à 10. Maintenu par le FIRST, il est aujourd'hui dans sa version 4.0 [16]. Un score CVSS repose sur plusieurs critères : la facilité d'exploitation de la faille, l'impact potentiel sur la confidentialité, l'intégrité et la disponibilité du système, et le contexte dans lequel elle se trouve. Le résultat permet de classer les vulnérabilités en cinq niveaux : Informationnel, Faible, Moyen, Élevé et Critique. Ce barème est celui qu'utilisent la quasi-totalité des outils de scan du marché pour prioriser les alertes remontées aux équipes de sécurité, et c'est également celui que nous avons retenu dans FinClean.

Le CWE, pour Common Weakness Enumeration, complète les deux précédents en s'intéressant non pas à une vulnérabilité précise dans un produit donné, mais à la nature de la faiblesse sous-jacente. Un dépassement de tampon, une injection SQL, une gestion inadéquate des authentifications : chacune de ces catégories de faiblesses possède son identifiant CWE. Lorsqu'un CVE est publié, les analystes du NVD l'enrichissent notamment d'une classification CWE, d'un score CVSS et de données CPE précisant les versions exactes des produits affectés [14]. C'est cette articulation entre les trois standards qui constitue la colonne vertébrale de notre pipeline de corrélation dans FinClean.

Le tableau II.1 ci-dessous résume la complémentarité de ces trois standards.

|Standard|Mainteneur|Ce qu'il identifie|
|---|---|---|
|CVE|MITRE / CISA|Une vulnérabilité précise dans un produit donné|
|CVSS|FIRST|Le niveau de sévérité de cette vulnérabilité|
|CWE|MITRE|Le type de faiblesse à l'origine de la vulnérabilité|

_Tableau II.1 : Synthèse des standards de classification des vulnérabilités_

---

**II.1.3. Le concept d'évaluation continue de la posture de sécurité**

Dans le chapitre précédent, nous avons vu que les attaques exploitant des vulnérabilités connues représentent le vecteur d'attaque le plus répandu, aussi bien à l'échelle mondiale qu'au Cameroun en particulier. Ce constat amène naturellement à se poser la question suivante : comment une organisation sait-elle, à un instant donné, combien de failles connues sont présentes dans ses systèmes et lesquelles sont exploitables ? C'est précisément à cette question que répond le concept de posture de sécurité.

La posture de sécurité désigne l'état global de la sécurité d'un système d'information à un moment donné. Elle reflète le niveau d'exposition réel de l'organisation face aux menaces connues, en tenant compte des vulnérabilités présentes, des configurations en place et des pratiques opérationnelles de ses équipes [17]. En d'autres termes, évaluer la posture de sécurité d'un système revient à scanner ce système, identifier les vulnérabilités connues qui s'y trouvent, les classer par niveau de criticité et mesurer leur évolution dans le temps.

Pendant longtemps, cette évaluation s'est faite de façon ponctuelle. Un audit annuel, un test d'intrusion trimestriel, et l'organisation considérait avoir fait le nécessaire. Ce modèle reposait sur une hypothèse qui n'est plus valable aujourd'hui : celle que le périmètre technique d'une organisation évolue lentement. Or, chaque nouveau déploiement logiciel, chaque mise à jour de dépendance, chaque reconfiguration réseau peut introduire de nouvelles vulnérabilités. Et pendant ce temps, de nouvelles CVEs sont publiées quotidiennement, rendant des systèmes auparavant considérés comme sûrs potentiellement exposés du jour au lendemain [18].

C'est dans ce contexte qu'est apparu le paradigme de l'évaluation continue de la posture de sécurité. L'idée centrale est que les scans de vulnérabilités ne doivent plus être des événements calendaires ponctuels, mais des processus automatisés qui s'exécutent à fréquence paramétrable, de façon continue et sans intervention humaine systématique [17]. Ce paradigme repose sur trois principes fondamentaux.

Le premier est la permanence. Les scans doivent tourner en continu, ou du moins à une fréquence suffisamment élevée pour que l'intervalle entre deux évaluations ne laisse pas le temps à une faille critique d'être exploitée sans être détectée. Les organisations qui abordent la gestion des vulnérabilités comme un projet trimestriel créent des intervalles d'exposition dangereux entre deux scans [12].

Le deuxième est la traçabilité temporelle. L'évolution de la posture dans le temps doit être enregistrée et restituée sous forme de courbes et de tableaux de bord. C'est ce suivi qui permet aux équipes de mesurer concrètement l'impact de leurs actions correctives et d'identifier les tendances de dégradation avant qu'elles ne deviennent critiques [18].

Le troisième est la contextualisation. Un score CVSS brut ne suffit pas toujours à prendre une bonne décision. Une vulnérabilité de score 7 sur un serveur secondaire n'a pas le même impact qu'une vulnérabilité de score 5 sur le serveur principal d'une organisation. La posture de sécurité doit donc tenir compte de la criticité des actifs concernés pour produire une évaluation véritablement utile aux équipes [12].

---

**RÉFÉRENCES**

[11] Bugcrowd, "Vulnerability Management Lifecycle," _bugcrowd.com_, 4 oct. 2024. [En ligne]. Disponible : https://www.bugcrowd.com/blog/vulnerability-management-lifecycle/. [Consulté le : 29 avr. 2026].

[12] Wiz, "Vulnerability Management Lifecycle: 6 Essential Stages," _wiz.io_, mars 2026. [En ligne]. Disponible : https://www.wiz.io/academy/vulnerability-management/vulnerability-management-lifecycle. [Consulté le : 29 avr. 2026].

[13] Palo Alto Networks, "Vulnerability Management Lifecycle," _paloaltonetworks.com_, 2024. [En ligne]. Disponible : https://www.paloaltonetworks.com/cyberpedia/vulnerability-management-lifecycle. [Consulté le : 29 avr. 2026].

[14] Automox, "CVE, CWE, CVSS, and NVD: A Complete Guide to Vulnerability Acronyms," _automox.com_, 2024. [En ligne]. Disponible : https://www.automox.com/blog/vulnerabilities-software-weaknesses-acronym-breakdown. [Consulté le : 29 avr. 2026].

[15] J. Gamblin, "2025 CVE Data Review," _jerrygamblin.com_, 1 janv. 2026. [En ligne]. Disponible : https://jerrygamblin.com/2026/01/01/2025-cve-data-review/. [Consulté le : 29 avr. 2026].

[16] NIST, "NVD — Vulnerability Metrics," _nvd.nist.gov_, 2024. [En ligne]. Disponible : https://nvd.nist.gov/vuln-metrics/cvss. [Consulté le : 29 avr. 2026].

[17] IBM, "What is security posture?," _ibm.com_, 2024. [En ligne]. Disponible : https://www.ibm.com/think/topics/security-posture. [Consulté le : 29 avr. 2026].

[18] IBM, "What is the Vulnerability Management Lifecycle?," _ibm.com_, nov. 2025. [En ligne]. Disponible : https://www.ibm.com/think/topics/vulnerability-management-lifecycle. [Consulté le : 29 avr. 2026].

---
***II.2. Outils de scan existants et analyse critique***
**II.2.1. Nmap : principes et capacités**

Nmap, abréviation de Network Mapper, est sans doute l'outil de scan réseau le plus populaire et le plus utilisé dans la communauté de la cybersécurité. Créé en 1997 par Gordon Lyon, il est disponible gratuitement en open source et fonctionne sur la quasi-totalité des systèmes d'exploitation modernes [19]. Son usage principal se fait en ligne de commande, ce qui lui confère une grande flexibilité et une facilité d'intégration dans des scripts et des pipelines automatisés. Pour ceux qui préfèrent une interface graphique, Zenmap en est la version visuelle officielle, offrant les mêmes fonctionnalités dans un environnement plus accessible.

Le principe de fonctionnement de Nmap est relativement simple. Il envoie des paquets réseau vers les cibles spécifiées et analyse les réponses reçues pour en déduire des informations sur l'état des ports, les services qui y tournent et les systèmes d'exploitation en place [20]. Selon la réponse obtenue, un port peut être identifié comme ouvert, fermé ou filtré. C'est cette capacité à cartographier précisément ce qui écoute sur un réseau qui en fait le point de départ naturel de toute évaluation de la posture de sécurité.

Au-delà de la simple découverte de ports, Nmap dispose d'un ensemble de fonctionnalités avancées qui le rendent particulièrement puissant. La détection de version, activée avec l'option -sV, permet d'identifier précisément la version des services en cours d'exécution sur chaque port ouvert. C'est une information cruciale : connaître qu'un service tourne sur le port 21 est utile, mais savoir qu'il s'agit de vsFTPd version 2.3.4 permet de le confronter directement aux bases de données de vulnérabilités connues pour détecter des failles comme CVE-2011-2523 [20]. La détection du système d'exploitation, avec l'option -O, complète ce tableau en identifiant le système qui héberge les services analysés.

Nmap propose également plusieurs niveaux de profondeur de scan, du scan rapide qui couvre les ports les plus courants, au scan complet qui analyse l'ensemble des 65 535 ports disponibles. La vitesse de scan est elle aussi paramétrable via les templates T0 à T5, permettant d'adapter le comportement de l'outil selon que l'on souhaite rester discret ou au contraire obtenir des résultats rapidement [21]. Enfin, le Nmap Scripting Engine, connu sous l'acronyme NSE, étend considérablement les capacités de l'outil grâce à des scripts en Lua permettant d'automatiser des tâches avancées comme la détection de vulnérabilités spécifiques, les tests d'authentification ou l'analyse de configurations de sécurité [20].

C'est l'ensemble de ces caractéristiques qui nous a conduits à retenir Nmap comme moteur de scan de FinClean. Sa gratuité, sa flexibilité, sa capacité à produire des résultats exploitables par programme via sa sortie XML, et son intégration naturelle dans des environnements Python via le module subprocess en font un choix cohérent avec nos contraintes de souveraineté et d'accessibilité financière.

---

**II.2.2. Solutions commerciales et open source : Nessus, Qualys et OpenVAS**

Au-delà de Nmap qui reste avant tout un outil de cartographie réseau, il existe des solutions dédiées spécifiquement à la gestion des vulnérabilités. Ces outils vont plus loin : ils ne se contentent pas de détecter les ports ouverts et les services exposés, ils confrontent automatiquement les résultats aux bases de données de vulnérabilités connues, produisent des rapports détaillés et proposent des recommandations de remédiation. Parmi les plus référencés dans le domaine, on retrouve Nessus, Qualys et OpenVAS [22].

Nessus, développé par Tenable, est aujourd'hui considéré comme l'un des scanners de vulnérabilités les plus complets du marché. Lancé initialement comme projet open source en 1998, il a basculé vers un modèle propriétaire en 2005 [23]. Il s'appuie sur une bibliothèque de plus de 130 000 plugins couvrant plus de 57 000 CVEs, ce qui lui confère une couverture particulièrement large [22]. Ses points forts sont reconnus : un faible taux de faux positifs, une interface claire, des rapports détaillés et une mise à jour rapide de sa base de données dès qu'une nouvelle vulnérabilité est publiée. Sa principale limite reste son coût : la licence annuelle de Nessus Professional est affichée à environ 4 000 dollars, un seuil difficile à atteindre pour bon nombre d'organisations [24].

Qualys adopte une approche différente. C'est une plateforme entièrement cloud, accessible via un navigateur web, qui permet de surveiller en continu l'ensemble des actifs d'une organisation, y compris les environnements hybrides et cloud [22]. Sa force réside dans sa scalabilité et sa capacité à centraliser la gestion des vulnérabilités sur un grand nombre d'actifs simultanément. En revanche, cette architecture cloud soulève directement la question de la souveraineté des données : les résultats des scans, qui contiennent des informations sensibles sur l'infrastructure analysée, transitent et sont stockés sur des serveurs externes à l'organisation [22]. Pour des institutions soucieuses de la confidentialité de leurs données stratégiques, cette réalité constitue une limite importante.

OpenVAS, maintenu par Greenbone Networks, est né en 2006 comme fork open source de l'ancien Nessus, après que Tenable ait fermé les sources de ce dernier [23]. Il offre des capacités de scan comparables aux solutions commerciales, avec une couverture de plus de 50 000 tests de vulnérabilités régulièrement mis à jour via le Greenbone Community Feed [22]. Sa gratuité en fait une alternative sérieuse pour les organisations aux budgets limités. Cependant, OpenVAS présente des contraintes qui ne sont pas négligeables en pratique : son installation et sa configuration demandent une expertise technique certaine, son interface reste moins intuitive que celle de ses concurrents commerciaux, et sa maintenance peut rapidement devenir chronophage pour une équipe réduite [23].

Ces trois outils, chacun à leur façon, répondent à une partie des besoins en matière de gestion des vulnérabilités. Mais aucun d'eux ne combine à la fois gratuité, souveraineté totale des données, facilité d'utilisation et assistance intelligente à l'exploitation. C'est précisément dans cet espace que se positionne FinClean, et c'est ce que nous détaillerons dans la section suivante.

---

**II.2.3. Tableau comparatif critique**

Au regard des besoins identifiés dans notre problématique, une solution idéale de gestion des vulnérabilités devrait réunir plusieurs caractéristiques : assurer la souveraineté totale des données de l'organisation, proposer une évaluation continue et automatisée de la posture de sécurité, rester accessible financièrement, et intégrer une assistance intelligente capable d'améliorer l'interprétation des résultats tout en limitant les erreurs. C'est sur la base de ces critères que nous proposons une comparaison entre les solutions étudiées et FinClean.

Le tableau II.2 ci-dessous présente cette comparaison sur huit critères : le coût, la souveraineté des données, l'intuitivité de l'interface, l'assistance IA, la corrélation des vulnérabilités avec les bases de données de référence, la gestion des faux positifs, la qualité des rapports générés et la rapidité du scan.

|Critère|Nessus|Qualys|OpenVAS|Nmap seul|FinClean|
|---|---|---|---|---|---|
|Coût|Élevé (~4000$/an)|Élevé (sur devis)|Gratuit|Gratuit|Gratuit|
|Souveraineté des données|Non garantie|Non garantie|Oui|Oui|Oui|
|Interface intuitive|Oui|Oui|Partielle|Non|Oui|
|Assistance IA|Non|Non|Non|Non|Oui (RAG local)|
|Corrélation CVE/Exploit|Oui|Oui|Partielle|Non|Oui|
|Gestion des faux positifs|Très bonne|Très bonne|Moyenne|Faible|En cours d'évaluation|
|Qualité des rapports|Très bonne|Très bonne|Bonne|Basique|Bonne|
|Rapidité du scan|Très bonne|Très bonne|Bonne|Bonne|Bonne|

_Tableau II.2 : Comparaison des solutions de scan de vulnérabilités_

Ce tableau appelle quelques commentaires honnêtes. Sur le plan des performances pures, Nessus et Qualys restent des références incontestées. Leur maturité, leur couverture de vulnérabilités et leur faible taux de faux positifs sont le fruit de plusieurs décennies de développement et d'investissements importants que nous ne prétendons pas égaler avec FinClean à ce stade. OpenVAS, quant à lui, offre une bonne alternative open source mais son manque d'intuitivité et l'absence d'assistance intelligente le rendent moins accessible pour des équipes de taille réduite.

Là où FinClean se distingue réellement, c'est sur la combinaison de critères qu'aucune des solutions étudiées ne réunit simultanément : gratuité, souveraineté totale des données, interface accessible et assistance IA locale basée sur une approche RAG alimentée par ExploitDB. Cette dernière fonctionnalité, absente des autres solutions, permet à l'analyste de mieux interpréter les vulnérabilités détectées et d'obtenir des recommandations contextualisées sans que les données de son organisation ne quittent son infrastructure.

La gestion des faux positifs reste un point que nous n'avons pas encore évalué de façon formelle dans FinClean. Nous le reconnaissons honnêtement et le mentionnons comme perspective d'amélioration dans le chapitre V.

---

Donnez-moi votre idée brute pour **II.3** et on continue.
---
**RÉFÉRENCES**

[19] Gordon Lyon, _Nmap Network Scanning: The Official Nmap Project Guide to Network Discovery and Security Scanning_, Nmap Project, USA, 2009. [En ligne]. Disponible : https://nmap.org/book/. [Consulté le : 29 avr. 2026].

[20] IT-Connect, "Détecter des vulnérabilités avec Nmap," _it-connect.fr_, nov. 2024. [En ligne]. Disponible : https://www.it-connect.fr/chapitres/nmap-detection-des-vulnerabilites-analyse-securite/. [Consulté le : 29 avr. 2026].

[21] Stéphane Robert, "Nmap : analyser l'exposition réseau," _blog.stephane-robert.info_, janv. 2026. [En ligne]. Disponible : https://blog.stephane-robert.info/docs/securiser/reseaux/analyse/nmap/. [Consulté le : 29 avr. 2026].

[22] InfosecTrain, "Nessus vs. Qualys vs. OpenVAS," _infosectrain.com_, juil. 2024. [En ligne]. Disponible : https://www.infosectrain.com/blog/nessus-vs-qualys-vs-openvas. [Consulté le : 29 avr. 2026].

[23] Comparitech, "Nessus vs OpenVAS: Which Scanner Is For You?," _comparitech.com_, déc. 2024. [En ligne]. Disponible : https://www.comparitech.com/net-admin/nessus-vs-openvas/. [Consulté le : 29 avr. 2026].

[24] Jedha, "Les meilleurs scanners de vulnérabilités en 2026," _jedha.co_, 2026. [En ligne]. Disponible : https://www.jedha.co/formation-cybersecurite/les-meilleurs-scanners-de-vulnerabilites-en-2024. [Consulté le : 29 avr. 2026].



---