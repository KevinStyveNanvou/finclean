
**I.1. Présentation du cadre de stage**

**I.1.1. Présentation de Nala Security Consulting**

Le cycle d'ingénieur de conception au Cameroun exige un stage de fin de formation de six mois, destiné à relier les compétences théoriques et professionnelles de l'élève ingénieur à un cadre réel d'exercice. C'est dans cet élan que du 5 janvier au 30 juin 2026, nous avons exercé en qualité de stagiaire au sein de l'entreprise Nala Security Consulting, sise à Douala, quartier Bonamoussadi.

Nala Security Consulting est une entreprise camerounaise spécialisée dans la prestation de services en cybersécurité. Opérant dans un environnement où la demande en expertise sécuritaire est en pleine croissance, elle accompagne ses clients dans l'évaluation, la protection et la surveillance de leurs systèmes d'information. Son offre de services s'articule autour de quatre pôles complémentaires : NALA Expert, dédié aux audits de sécurité, aux scans de vulnérabilités, à la gestion des risques et à la réponse aux incidents ; NALA Training, orienté vers les formations, la sensibilisation et les certifications professionnelles ; NALA Solution, centré sur le déploiement de solutions de sécurité ; et NALA Web Development, pour le développement d'applications et de sites web sécurisés.

Forte d'une expérience avérée dans le secteur financier, Nala Security Consulting a accompagné plus d'une centaine de clients, avec un taux de satisfaction déclaré de 90%. Parmi ses références figurent des institutions de premier plan telles que SCB Cameroun, BICEC, CCA Bank, BGFI Bank, Union Bank of Cameroon, Wafacash Central Africa, Express Exchange Financial, BNI Madagascar, CECIC SA et Loto Québec. Ces missions lui ont permis de développer une connaissance fine des enjeux de sécurité propres aux environnements à données sensibles, où la confidentialité, l'intégrité et la disponibilité des systèmes constituent des impératifs opérationnels non négociables. Par ailleurs, l'entreprise entretient des partenariats technologiques avec des acteurs de référence mondiale tels que Tenable, Qualys, Rapid7, Fortinet, Kaspersky, CyberArk et Wallix, ce qui lui confère une vision large du marché des outils de cybersécurité disponibles.

source: https://nalasecurity.com/fr/references 

**I.1.2. Contexte opérationnel et motivation du sujet**

Dans le cadre de ses activités quotidiennes, Nala Security Consulting est régulièrement confrontée à une réalité partagée par de nombreuses structures de cybersécurité opérant en Afrique : la nécessité de réaliser des évaluations de vulnérabilités pour le compte de clients, en s'appuyant sur des outils dont le coût de licence représente une charge significative, et dont les données transitent par des infrastructures situées en dehors du territoire africain.

Cette double contrainte, financière et souverainiste, a orienté la réflexion vers la conception d'un outil maison, capable de répondre aux besoins opérationnels de l'entreprise et de ses clients, tout en s'affranchissant des dépendances aux solutions propriétaires étrangères. C'est dans cette perspective que l'encadreur professionnel a proposé, en début de stage, le développement d'une plateforme de scan de vulnérabilités intégrant une assistance intelligente à l'exploitation. Ce sujet, accepté avec intérêt, est devenu le fil conducteur de l'ensemble des travaux présentés dans ce mémoire.

---
***I.2. Contexte général***

**I.2.1. La transformation numérique et l'élargissement des surfaces d'attaque**

La transformation numérique constitue aujourd'hui l'un des leviers les plus puissants du développement économique et institutionnel à l'échelle mondiale. Entreprises privées, administrations publiques, établissements académiques et institutions financières s'appuient de plus en plus sur des systèmes d'information interconnectés pour assurer la continuité et la compétitivité de leurs activités. Cette mutation, portée par l'essor du cloud computing, de la mobilité, des objets connectés et plus récemment des intelligences artificielles, a profondément reconfiguré les architectures informatiques traditionnelles.

Là où une organisation devait autrefois protéger quelques serveurs centraux physiquement isolés, elle doit aujourd'hui sécuriser des dizaines, voire des centaines de points d'entrée potentiels : interfaces web, APIs partenaires, terminaux mobiles, équipements réseau, postes de travail distants et services cloud. Cette multiplication des points de contact avec l'extérieur élargit mécaniquement la surface d'attaque exposée aux acteurs malveillants. Chaque nouveau service déployé, chaque nouveau périphérique connecté, chaque nouvelle dépendance logicielle introduit un risque potentiel que l'organisation doit être en mesure d'identifier et de maîtriser.

C'est précisément dans ce contexte que la gestion des vulnérabilités est devenue une discipline centrale de la cybersécurité moderne. Une vulnérabilité non détectée ou non corrigée constitue une porte d'entrée que tout acteur malveillant disposant des outils adéquats peut exploiter. Or, l'essor des intelligences artificielles a considérablement abaissé le niveau de compétence technique nécessaire pour conduire une attaque : des outils automatisés permettent désormais d'identifier et d'exploiter des failles connues avec une rapidité et une précision sans précédent.


**I.2.2. Panorama des cybermenaces en Afrique et au Cameroun**

La croissance numérique du continent africain, bien qu'elle constitue un levier de développement indéniable, s'accompagne d'une exposition croissante aux cybermenaces. À l'échelle du continent, les cyberattaques constituent désormais un défi majeur pour les économies locales. Selon la Commission économique pour l'Afrique des Nations unies, le manque de préparation en cybersécurité fait perdre aux États africains en moyenne 10 % de leur PIB, soit près de 4 milliards de dollars par an [1]. Le rapport INTERPOL 2024 sur l'évaluation des cybermenaces en Afrique confirme cette tendance, soulignant que les méthodes utilisées par les cybercriminels s'adaptent en permanence aux évolutions technologiques et sont toujours plus élaborées pour exploiter les failles des systèmes [2]. Cette réalité est d'autant plus préoccupante que la transformation numérique s'accélère sur le continent, élargissant mécaniquement les surfaces exposées aux attaques.

Au Cameroun, le tableau est particulièrement éloquent. Selon l'Agence de Régulation des Télécommunications (ART), le pays comptait plus de 10 millions d'internautes en 2024, avec un taux de pénétration Internet estimé à 45 % [3]. L'essor des transactions en ligne, du cloud computing et du télétravail amplifie la vulnérabilité des entreprises et des institutions publiques. Les analyses de Kaspersky Security Network révèlent qu'en 2024, ce sont près de 19 millions de cybermenaces ciblant principalement les entreprises et les institutions qui ont été répertoriées au Cameroun [4]. Plus alarmant encore, le pays s'est classé au 36ème rang mondial des pays les plus attaqués en février 2025, selon le même rapport [4]. À l'échelle mondiale, le rapport IBM X-Force Threat Intelligence Index 2024 confirme que les cybercriminels exploitent de plus en plus l'intelligence artificielle générative pour optimiser leurs attaques, automatiser la recherche de failles et personnaliser leurs campagnes de phishing à grande échelle [5]. Ce constat est renforcé par le rapport annuel sur la cybercriminalité 2025 du Commandement du Ministère de l'Intérieur dans le cyberespace (COMCYBER-MI), qui souligne que les attaques sont devenues plus nombreuses, plus ciblées et davantage difficiles à détecter, notamment grâce à l'usage de l'intelligence artificielle [6]."

L'examen des vecteurs d'attaque dominants révèle une tendance qui nous a particulièrement interpéler : les attaques exploitant des failles de sécurité connues, appelées exploits, ont presque doublé en un an au Cameroun, passant de 174 472 en 2023 à 333 930 en 2024, soit une augmentation de 91 % [4]. À cela s'ajoutent 163 298 attaques via le protocole RDP ciblant des accès distants mal protégés [4]. Ces chiffres ont été révélés lors de la conférence KNext 2025, organisée à Douala et Yaoundé les 12 et 13 février 2025, sous le haut patronage du Ministère des Postes et Télécommunications.

Le tableau I.1 ci-dessous synthétise l'évolution des principaux types de cyberattaques au Cameroun entre 2023 et 2024 :

|Type d'attaque|2023|2024|Évolution|
|---|---|---|---|
|Attaques par exploit (failles logicielles)|174 472|333 930|+91 %|
|Attaques via protocole RDP|non communiqué|163 298|--|
|Total cybermenaces recensées|~9,5 millions|19 millions|+100 %|

_Tableau I.1 : Évolution des cyberattaques au Cameroun (Source : Kaspersky Security Network, KNext 2025 [4])_

**I.2.3. Les vulnérabilités comme principal vecteur d'attaque**

Les données précédentes révèlent un enseignement fondamental : la grande majorité des cyberattaques enregistrées au Cameroun en 2024 exploitent des vulnérabilités connues, c'est-à-dire des failles déjà répertoriées dans les bases de données publiques mais non corrigées. Ce constat n'est pas propre au Cameroun. Le rapport INTERPOL 2024 souligne que les cybercriminels africains et mondiaux exploitent systématiquement les failles techniques, l'utilisation de logiciels obsolètes et l'absence de politiques de sécurité robustes pour infiltrer les réseaux et voler des données sensibles [2]. À l'échelle mondiale, selon une étude de Cybersecurity Ventures, 50 % des cybercriminels ont intégré l'intelligence artificielle dans leurs stratégies d'attaque, ce qui leur permet d'automatiser la recherche et l'exploitation des failles avec une efficacité sans précédent [5].

Une vulnérabilité est définie comme une faiblesse dans un système, un logiciel ou un processus, susceptible d'être exploitée par un acteur malveillant pour compromettre la confidentialité, l'intégrité ou la disponibilité d'un système d'information. Ces faiblesses peuvent résulter d'erreurs de conception, de défauts de configuration, de l'utilisation de composants logiciels obsolètes ou encore de l'absence de mécanismes de mise à jour. Comme l'ont souligné les experts lors de la conférence KNext Yaoundé 2025, ces failles sont exploitées par des acteurs malveillants pour infiltrer les réseaux, voler des données sensibles ou perturber les activités des organisations [4]. Face à ce constat, la détection et la correction rapide des vulnérabilités sont devenues l'étape primordiale de toute démarche de cybersécurité. C'est précisément sur ce maillon critique que se concentre notre travail, avec pour objectif de proposer une solution d'évaluation continue et automatisée de la posture de sécurité des systèmes d'information, accessible et souveraine.

---

**I.2.4. Cadre normatif de référence**

Face à l'ampleur des cybermenaces décrites dans les sections précédentes, la communauté internationale et les États ont progressivement élaboré des référentiels normatifs visant à encadrer et à standardiser les pratiques de cybersécurité au sein des organisations. Ces cadres constituent le socle sur lequel repose toute démarche structurée d'évaluation de la posture de sécurité, et permettent aux organisations de mesurer leur niveau de maturité face aux risques numériques.

**I.2.4.1. La norme ISO/IEC 27001**

La norme ISO/IEC 27001 est la référence internationale la plus reconnue en matière de management de la sécurité de l'information. Elle définit les exigences pour l'établissement, la mise en œuvre, le maintien et l'amélioration continue d'un Système de Management de la Sécurité de l'Information (SMSI). Son annexe A recense un ensemble de mesures de sécurité couvrant notamment la gestion des vulnérabilités techniques, imposant aux organisations d'identifier régulièrement les failles de leurs systèmes et d'y apporter des correctifs dans des délais maîtrisés [7].

**I.2.4.2. Le NIST Cybersecurity Framework**

Le National Institute of Standards and Technology (NIST) des États-Unis a publié le Cybersecurity Framework (CSF), un cadre de référence largement adopté à l'échelle mondiale pour la gestion des risques de cybersécurité. Il s'articule autour de cinq fonctions fondamentales : Identifier, Protéger, Détecter, Répondre et Récupérer [8]. La fonction "Identifier" couvre explicitement la gestion des vulnérabilités et l'évaluation des risques, tandis que la fonction "Détecter" impose la mise en place de processus de surveillance continue des systèmes d'information. Ces deux fonctions constituent le coeur de toute démarche sérieuse d'évaluation de la posture de sécurité.

**I.2.4.3. Le cadre juridique camerounais**

Sur le plan national, le Cameroun s'est doté d'un cadre juridique en matière de cybersécurité avec la promulgation de la Loi N°2010/012 du 21 décembre 2010 relative à la cybersécurité et à la cybercriminalité. Cette loi constitue le texte de référence qui régit le cadre de sécurité des réseaux de communications électroniques et des systèmes d'information au Cameroun [9]. Elle confie à l'Agence Nationale des Technologies de l'Information et de la Communication (ANTIC) la mission de régulation des activités de sécurité électronique, notamment la certification électronique, l'audit de sécurité et la veille sécuritaire [10]. La loi définit par ailleurs explicitement la cybersécurité comme l'ensemble des mesures de prévention, de protection et de dissuasion d'ordre technique, organisationnel, juridique, financier et humain permettant d'atteindre les objectifs de sécurité fixés [9].
Il convient de noter qu'en mai 2024, le Cameroun a bénéficié de l'expertise du Conseil de l'Europe dans le cadre du projet Global Action on Cybercrime Enhanced (GLACY-e), pour examiner et actualiser les recommandations issues de cette loi [10]. Cet engagement témoigne de la volonté des autorités camerounaises de renforcer progressivement leur arsenal juridique face à l'évolution rapide des cybermenaces.

C'est dans ce triple cadre normatif, international et national, que s'inscrit la démarche de toute organisation soucieuse de sa sécurité numérique. Toutefois, l'existence de ces référentiels ne suffit pas à garantir leur mise en application effective, notamment lorsque les outils disponibles pour y répondre présentent des limites significatives. C'est précisément ce constat qui fonde la problématique de notre travail.

**I.3. Problématique**

**I.3.1. Identification du problème**

Les sections précédentes ont mis en évidence une réalité préoccupante : les cyberattaques exploitant des vulnérabilités connues sont en forte progression au Cameroun et sur le continent africain, tandis que les cadres normatifs de référence imposent aux organisations une évaluation régulière et structurée de leur posture de sécurité. Ce double constat soulève une question de fond : pour se conformer à ces exigences, les organisations doivent être en mesure d'analyser régulièrement leurs systèmes afin de détecter les vulnérabilités présentes et d'y apporter les correctifs nécessaires avant qu'un acteur malveillant ne les exploite.
Cette démarche d'évaluation soulève cependant une préoccupation majeure : les résultats d'un scan de vulnérabilités contiennent des informations stratégiques et sensibles sur l'architecture interne d'un système d'information, notamment les services exposés, les ports ouverts et les failles identifiées. Ces données constituent en elles-mêmes une ressource précieuse pour un attaquant. Il est donc primordial qu'elles soient conservées dans un environnement maîtrisé, en interne, à l'abri de toute exposition non contrôlée.
Par ailleurs, face à l'essor de l'intelligence artificielle, il serait contre-productif de s'en priver dans une démarche de cybersécurité. Les attaquants l'utilisent déjà pour affiner leurs stratégies et automatiser leurs offensives. Il devient donc tout aussi légitime que les équipes de sécurité des organisations puissent bénéficier à leur tour de cette capacité analytique, de façon optimale et sécurisée, pour mieux interpréter les vulnérabilités détectées et orienter leurs actions défensives.

**I.3.2. Questions de recherche**
Ces constats soulèvent plusieurs questions auxquelles ce mémoire s'efforce de répondre :

Comment concevoir un système d'évaluation continue de la posture de sécurité, permettant aux organisations de détecter et de suivre l'évolution de leurs vulnérabilités de façon régulière et automatisée, tout en garantissant que les résultats des analyses restent sous leur contrôle exclusif grâce à un traitement et un stockage entièrement local ?
Comment intégrer une assistance intelligente à l'exploitation des vulnérabilités, en s'appuyant sur un modèle de langage déployé localement et enrichi par une base de connaissances spécialisée, afin de limiter les risques d'imprécision et de produire des recommandations fiables et contextualisées pour les équipes de sécurité ?
Comment rendre cette démarche accessible aux organisations qui ne disposent pas des résources limitées?

**I.3.3. Problématique centrale**

Ces questions convergent vers une problématique centrale que l'on peut formuler ainsi :

_Comment concevoir et mettre en place une plateforme d'évaluation continue de la posture de sécurité des systèmes d'information, garantissant la souveraineté totale des données, intégrant une assistance intelligente à l'exploitation basée sur un modèle de langage local enrichi par une base de connaissances spécialisée, et accessible sans coût de licence pour les organisations soucieuses de leur sécurité numérique ?_

---

**I.4. Méthodologie**

**I.4.1. Démarche adoptée**

Pour répondre à la problématique posée, nous avons adopté une démarche structurée en quatre phases successives, allant de l'analyse des besoins jusqu'à la validation expérimentale de la solution développée.
La première phase est celle de l'analyse et de la conception. Elle a consisté à identifier précisément les besoins fonctionnels et non fonctionnels de la plateforme, à étudier les technologies et bases de données disponibles susceptibles de répondre à ces besoins, et à concevoir l'architecture globale de la solution. Cette phase a abouti à la définition du cahier des charges de FinClean et au choix des technologies retenues.
La deuxième phase est celle du développement. Elle a porté sur l'implémentation progressive des différents modules de la plateforme : le moteur de scan s'appuyant sur Nmap, le pipeline de corrélation avec les bases de données NVD/NIST et ExploitDB, le système de scan permanent paramétrable, le module d'assistance intelligente basé sur une approche RAG avec un modèle de langage local, ainsi que l'interface utilisateur et le système de génération de rapports PDF.
La troisième phase est celle des tests fonctionnels. Chaque module a été testé de manière indépendante au fur et à mesure de son développement, afin de valider son comportement avant son intégration dans l'ensemble de la plateforme. Ces tests ont été conduits dans un environnement local isolé, garantissant qu'aucune donnée sensible ne transitait vers l'extérieur.
La quatrième phase est celle de la validation expérimentale. Elle a consisté à déployer la plateforme dans un environnement de laboratoire structuré, en ciblant des machines intentionnellement vulnérables, notamment Metasploitable2, afin d'évaluer les capacités de détection de FinClean, la pertinence de ses corrélations CVE et la qualité des recommandations produites par le module RAG. Les résultats obtenus ont ensuite été comparés à ceux d'OpenVAS sur le même environnement, afin d'apporter des éléments objectifs de discussion.

**I.4.2. Protocole de validation**

La validation expérimentale de FinClean a été conduite dans un réseau local isolé, constitué de machines virtuelles déployées sous VirtualBox. L'environnement de test comprend Metasploitable2, une distribution Linux volontairement vulnérable et largement utilisée dans la communauté de la cybersécurité pour l'évaluation des outils de scan, ainsi que la machine hôte hébergeant FinClean.

Les métriques retenues pour évaluer les performances de la plateforme sont les suivantes : le nombre de vulnérabilités détectées et leur niveau de sévérité, la fidélité du scheduler dans l'exécution des scans permanents, la qualité et la lisibilité des rapports PDF générés, ainsi que la pertinence des recommandations produites par le module RAG. Ces éléments feront l'objet d'une présentation détaillée dans le Chapitre V.

---

**I.5. Objectifs**

**I.5.1. Objectif général**

L'objectif général de ce travail est de concevoir et de mettre en place une plateforme d'évaluation continue de la posture de sécurité des systèmes d'information, fonctionnant entièrement en local, intégrant une assistance intelligente à l'exploitation des vulnérabilités basée sur un modèle de langage enrichi par une base de connaissances spécialisée, et accessible sans coût de licence pour les organisations soucieuses de leur sécurité numérique et de la souveraineté de leurs données.

**I.5.2. Objectifs spécifiques**

De manière plus spécifique, nos travaux visent à :

- mettre en œuvre un moteur de scan de vulnérabilités réseau s'appuyant sur Nmap, avec trois niveaux de profondeur paramétrables, et une corrélation automatique des résultats avec les données de vulnérabilités du NVD/NIST couvrant la période 2002 à 2026 ;
    
- développer un système de scan permanent et programmable, permettant une évaluation continue de la posture de sécurité à fréquence paramétrable, avec un suivi de l'évolution des vulnérabilités dans le temps ;
    
- intégrer un module d'assistance intelligente à l'exploitation, basé sur une approche RAG alimentée par la base de données ExploitDB et pilotée par un modèle de langage déployé localement, afin de produire des recommandations fiables et contextualisées tout en conservant les données sensibles au sein de l'infrastructure de l'organisation ;
    
- concevoir un tableau de bord analytique permettant aux équipes de sécurité de visualiser en temps réel la répartition et l'évolution des vulnérabilités détectées ;
    
- générer automatiquement des rapports PDF professionnels synthétisant les résultats des scans, les niveaux de criticité et les recommandations associées ;
    
- garantir la souveraineté des données en assurant un déploiement et un fonctionnement entièrement local de l'ensemble des composants de la plateforme, sans dépendance à des services cloud externes.
    

---
Ce chapitre a posé le cadre général de notre travail. Nous avons présenté le contexte professionnel dans lequel ce projet a pris naissance, dressé un panorama des cybermenaces actuelles en Afrique et au Cameroun, examiné les référentiels normatifs qui encadrent la gestion de la sécurité des systèmes d'information, formulé la problématique centrale qui motive notre démarche, et défini les objectifs que nous nous sommes fixés.

Le chapitre suivant est consacré à l'état de l'art et au cadre conceptuel de notre solution. Nous y examinerons les concepts fondamentaux liés à la gestion des vulnérabilités, les outils existants et leurs limites, les bases de données de référence que nous exploitons, ainsi que les principes de l'intelligence artificielle appliquée à la cybersécurité, avant de positionner FinClean par rapport à l'ensemble de ces éléments.

--- 

**RÉFÉRENCES — Style IEEE**

[1] We Are Tech Africa, "Cybersécurité : le Cameroun a fait face à 333 930 attaques d'exploit en 2024," _wearetech.africa_, 18 févr. 2025. [En ligne]. Disponible : [https://www.wearetech.africa/fr/fils/actualites/tech/cybersecurite-le-cameroun-a-fait-face-a-333-930-attaques-d-exploit-en-2024](https://www.wearetech.africa/fr/fils/actualites/tech/cybersecurite-le-cameroun-a-fait-face-a-333-930-attaques-d-exploit-en-2024). [Consulté le : 29 avr. 2026].

[2] INTERPOL, _Rapport INTERPOL de 2024 sur l'évaluation des cybermenaces en Afrique, 3ème édition_, INTERPOL, Lyon, France, avr. 2024. [En ligne]. Disponible : [https://www.interpol.int/fr/content/download/21048/file/Rappot-d'evaluation-des-cybermenaces-en-Afrique.pdf](https://www.interpol.int/fr/content/download/21048/file/Rappot-d'evaluation-des-cybermenaces-en-Afrique.pdf). [Consulté le : 29 avr. 2026].

[3] Agence Ecofin, "Cameroun : Kaspersky alerte sur 19 millions de cybermenaces en 2024 lors des KNext Douala et Yaoundé," _agenceecofin.com_, 13 févr. 2025. [En ligne]. Disponible : [https://www.agenceecofin.com/actualites-numerique/1302-125800-cameroun-kaspersky-alerte-sur-19-millions-de-cybermenaces-en-2024-lors-des-knext-douala-et-yaounde](https://www.agenceecofin.com/actualites-numerique/1302-125800-cameroun-kaspersky-alerte-sur-19-millions-de-cybermenaces-en-2024-lors-des-knext-douala-et-yaounde). [Consulté le : 29 avr. 2026].

[4] Kaspersky Security Network, _Rapport KNext Cameroun 2025 : Bilan des cybermenaces au Cameroun en 2024_, Kaspersky, Douala et Yaoundé, févr. 2025. [En ligne]. Disponible : [https://teleasu.tv/wp-content/uploads/2025/02/Kaspersky-rapport-Cameroun_2025.pdf](https://teleasu.tv/wp-content/uploads/2025/02/Kaspersky-rapport-Cameroun_2025.pdf). [Consulté le : 29 avr. 2026].

[5] IBM Security, _X-Force Threat Intelligence Index 2024_, IBM, Cambridge, USA, févr. 2024. [En ligne]. Disponible : [https://fr.newsroom.ibm.com/IBM-annonce-aujourdhui-les-resultats-de-ledition-2024-de-son-rapport-annuel-X-Force-Threat-Intelligence-Index-sur-le-paysage-mondial-des-menaces](https://fr.newsroom.ibm.com/IBM-annonce-aujourdhui-les-resultats-de-ledition-2024-de-son-rapport-annuel-X-Force-Threat-Intelligence-Index-sur-le-paysage-mondial-des-menaces). [Consulté le : 29 avr. 2026].

[6] COMCYBER-MI, _Rapport annuel sur la cybercriminalité 2025_, Ministère de l'Intérieur, France, 2025. [En ligne]. Disponible : [https://www.interieur.gouv.fr/actualites/communiques-de-presse/publication-du-rapport-annuel-relatif-a-cybercriminalite](https://www.interieur.gouv.fr/actualites/communiques-de-presse/publication-du-rapport-annuel-relatif-a-cybercriminalite). [Consulté le : 29 avr. 2026].

[7] ISO/IEC, _Norme ISO/IEC 27001:2022 — Technologies de l'information — Techniques de sécurité — Systèmes de management de la sécurité de l'information — Exigences_, Organisation internationale de normalisation, Genève, Suisse, 2022. [En ligne]. Disponible : [https://www.iso.org/fr/standard/27001](https://www.iso.org/fr/standard/27001). [Consulté le : 29 avr. 2026].

[8] NIST, _Cybersecurity Framework Version 2.0_, National Institute of Standards and Technology, Gaithersburg, USA, 2024. [En ligne]. Disponible : [https://www.nist.gov/cyberframework](https://nvlpubs.nist.gov/nistpubs/CSWP/NIST.CSWP.29.pdf). [Consulté le : 29 avr. 2026].

[9] République du Cameroun, _Loi N°2010/012 du 21 décembre 2010 relative à la cybersécurité et à la cybercriminalité au Cameroun_, Agence de Régulation des Télécommunications, Yaoundé, Cameroun, 2010. [En ligne]. Disponible : [https://www.art.cm/sites/default/files/documents/loi_2010-012_cybersecurite_cybercriminalite.pdf](https://www.art.cm/sites/default/files/documents/loi_2010-012_cybersecurite_cybercriminalite.pdf). [Consulté le : 29 avr. 2026].

[10] Ministère des Postes et Télécommunications du Cameroun, _Atelier d'examen de la loi N°2010/012 dans le cadre du projet GLACY-e_, MINPOSTEL, Yaoundé, Cameroun, mai 2024. [En ligne]. Disponible : [http://www.minjustice.gov.cm/index.php/fr/textes-lois/lois/295-loi-n-2010-12-du-12-decembre-2010-relative-a-la-cybersecurite-et-a-la-cybercriminalite-au-cameroun](http://www.minjustice.gov.cm/index.php/fr/textes-lois/lois/295-loi-n-2010-12-du-12-decembre-2010-relative-a-la-cybersecurite-et-a-la-cybercriminalite-au-cameroun). [Consulté le : 29 avr. 2026].

---
