'use client'

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Calendar,
  Target,
  Wrench,
  CheckCircle,
  Clock,
  XCircle,
  ChevronDown,
  ChevronRight,
  Shield,
  Server,
  FileText,
  Bot,
  Users,
  Activity,
  Brain,
  AlertTriangle
} from "lucide-react"

type Status = "deja_realise" | "en_cours" | "non_realise"

const statusConfig = {
  deja_realise: {
    label: "Déjà réalisé",
    color: "bg-green-600",
    icon: CheckCircle,
  },
  en_cours: {
    label: "En cours",
    color: "bg-yellow-500",
    icon: Clock,
  },
  non_realise: {
    label: "Non réalisé",
    color: "bg-red-600",
    icon: XCircle,
  },
}

const roadmapData = [
  {
    month: "Janvier",
    objectif:
      "Mettre en place le socle technique de FinClean : moteur de scan fonctionnel, génération PDF, base IAM et structure backend sécurisée.",
    outils: [
      "Django",
      "PostgreSQL",
      "Redis",
      "Next.js",
      "Nmap"
    ],
    status: "deja_realise",
    percentage: 100,
    weeks: [
      {
        week: "Semaine 1",
        objectif: "Architecture globale et base projet",
        outils: ["Django", "PostgreSQL", "Next.js"],
        status: "deja_realise",
        taches: [
          "Initialisation backend Django sécurisé",
          "Connexion PostgreSQL",
          "Structure des modèles Scan / User",
          "Initialisation frontend Next.js",
          "Configuration environnement sécurisé"
        ]
      },
      {
        week: "Semaine 2",
        objectif: "Implémentation du moteur de scan",
        outils: ["Nmap", "Subprocess Python"],
        status: "deja_realise",
        taches: [
          "Exécution scan réseau",
          "Parsing résultats Nmap",
          "Stockage vulnérabilités en base",
          "Gestion historique des scans"
        ]
      },
      {
        week: "Semaine 3",
        objectif: "Génération de rapport PDF",
        outils: ["ReportLab"],
        status: "deja_realise",
        taches: [
          "Création endpoint PDF",
          "Structuration données JSON",
          "Export PDF dynamique",
          "Gestion erreurs serveur 500"
        ]
      },
      {
        week: "Semaine 4",
        objectif: "Gestion utilisateurs et rôles",
        outils: ["Keycloak", "JWT"],
        status: "deja_realise",
        taches: [
          "Authentification JWT",
          "Rôles admin / user",
          "Admin peut voir tous les scans",
          "Suppression scans utilisateur"
        ]
      }
    ]
  },

  {
    month: "Février",
    objectif:
      "Améliorer UX, corriger bugs critiques, intégrer le chat IA pour exploitation des résultats.",
    outils: ["Mistral", "Ollama", "Framer Motion"],
    status: "en_cours",
    percentage: 100,
    weeks: [
      {
        week: "Semaine 1",
        objectif: "Correction bugs login et API",
        outils: ["Django Debug", "React DevTools"],
        status: "deja_realise",
        taches: [
          "Correction erreur removeChild",
          "Fix erreur 406 / PDF",
          "Stabilisation authentification"
        ]
      },
      {
        week: "Semaine 2",
        objectif: "Intégration Chat IA",
        outils: ["Ollama", "Mistral"],
        status: "deja_realise",
        taches: [
          "Connexion modèle local",
          "Envoi résultats scan au LLM",
          "Réponse contextualisée sécurité"
        ]
      },
      {
        week: "Semaine 3",
        objectif: "Rapport exploitation IA",
        outils: ["Django", "LLM"],
        status: "deja_realise",
        taches: [
          "Génération rapport exploitation",
          "Analyse priorisation vulnérabilités",
          "Score risque métier"
        ]
      },
      {
        week: "Semaine 4",
        objectif: "Amélioration design",
        outils: ["Framer Motion"],
        status: "deja_realise",
        taches: [
          "Animations texte",
          "Effets lumineux boutons",
          "Refonte UX dashboard"
        ]
      }
    ]
  },

  {
    month: "Mars",
    objectif:
      "Implémenter automatisation d’exploitation en environnement contrôlé + corrélation ExploitDB.",
    outils: ["Metasploit", "ExploitDB", "Docker"],
    status: "en_cours",
    percentage: 30,
    weeks: [
      {
        week: "Semaine 1",
        objectif: "Connexion ExploitDB",
        outils: ["API ExploitDB"],
        status: "deja_realise",
        taches: [
          "Recherche CVE automatique",
          "Corrélation vulnérabilité-scan"
        ]
      },
      {
        week: "Semaine 2",
        objectif: "Lab exploitation contrôlé",
        outils: ["Docker", "Kali"],
        status: "non_realise",
        taches: [
          "Création VM vulnérable",
          "Simulation attaque contrôlée"
        ]
      },
      {
        week: "Semaine 3",
        objectif: "Automatisation C2",
        outils: ["Metasploit"],
        status: "non_realise",
        taches: [
          "Déploiement listener",
          "Simulation canal C2"
        ]
      },
      {
        week: "Semaine 4",
        objectif: "Journalisation et traçabilité",
        outils: ["Redis"],
        status: "en_cours",
        taches: [
          "Logs exploitation",
          "Tracking session"
        ]
      }
    ]
  },

  {
    month: "Avril",
    objectif:
      "Réduction faux positifs + scoring risque métier avancé.",
    outils: ["IA scoring", "Analyse comportementale"],
    status: "en_cours",
    percentage: 10,
    weeks: [
      { week: "Semaine 1", objectif: "Détection faux positifs", outils: ["Machine Learning"], status: "non_realise", taches: ["Analyse patterns"] },
      { week: "Semaine 2", objectif: "Score financier contextualisé", outils: ["IA scoring"], status: "deja_realise", taches: ["Priorité vulnérabilité banque"] },
      { week: "Semaine 3", objectif: "Optimisation base données", outils: ["PostgreSQL"], status: "non_realise", taches: ["Indexation performance"] },
      { week: "Semaine 4", objectif: "Tests charge", outils: ["Celery"], status: "deja_realise", taches: ["Simulation multi-scan"] }
    ]
  },

  {
    month: "Mai",
    objectif:
      "Sécurisation avancée plateforme + audit interne.",
    outils: ["OWASP", "Audit sécurité"],
    status: "non_realise",
    percentage: 0,
    weeks: [
      { week: "Semaine 1", objectif: "Audit code backend", outils: ["Bandit"], status: "non_realise", taches: ["Scan code Python"] },
      { week: "Semaine 2", objectif: "Audit frontend", outils: ["OWASP ZAP"], status: "non_realise", taches: ["Scan vulnérabilité web"] },
      { week: "Semaine 3", objectif: "Durcissement serveur", outils: ["Linux Hardening"], status: "non_realise", taches: ["Firewall, fail2ban"] },
      { week: "Semaine 4", objectif: "Documentation technique", outils: ["Markdown"], status: "non_realise", taches: ["Rédaction soutenance"] }
    ]
  },

  {
    month: "Juin",
    objectif:
      "Finalisation projet + préparation soutenance + démonstration exploitation intelligente.",
    outils: ["PowerPoint", "Démo Live"],
    status: "non_realise",
    percentage: 0,
    weeks: [
      { week: "Semaine 1", objectif: "Tests finaux", outils: ["Tests QA"], status: "non_realise", taches: ["Validation complète workflow"] },
      { week: "Semaine 2", objectif: "Préparation slides", outils: ["PowerPoint"], status: "non_realise", taches: ["Architecture + Démo"] },
      { week: "Semaine 3", objectif: "Simulation soutenance", outils: ["Oral training"], status: "non_realise", taches: ["Questions pièges"] },
      { week: "Semaine 4", objectif: "Soutenance officielle", outils: ["Présentation"], status: "non_realise", taches: ["Démo FinClean complète"] }
    ]
  }
]

export default function RoadmapPage() {
  const [openMonth, setOpenMonth] = useState<string | null>(null)

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <h1 className="text-4xl font-bold mb-10 text-center">
        Roadmap FinClean 2026
      </h1>

      <div className="space-y-6">
        {roadmapData.map((month) => {
          const StatusIcon = statusConfig[month.status].icon

          return (
            <div
              key={month.month}
              className="bg-gray-900 rounded-2xl p-6 shadow-xl border border-gray-800"
            >
              <div
                onClick={() =>
                  setOpenMonth(openMonth === month.month ? null : month.month)
                }
                className="cursor-pointer flex justify-between items-center"
              >
                <div>
                  <h2 className="text-2xl font-semibold flex items-center gap-3">
                    <Calendar size={22} />
                    {month.month}
                  </h2>
                  <p className="text-gray-400 mt-2">{month.objectif}</p>

                  <div className="mt-3 flex gap-3 flex-wrap">
                    {month.outils.map((outil, i) => (
                      <span
                        key={i}
                        className="bg-blue-700 text-xs px-3 py-1 rounded-full"
                      >
                        {outil}
                      </span>
                    ))}
                  </div>

                  <div className="mt-4 flex items-center gap-3">
                    <div
                      className={`px-3 py-1 rounded-full text-sm ${statusConfig[month.status].color}`}
                    >
                      {statusConfig[month.status].label}
                    </div>
                    <span>{month.percentage}% complété</span>
                  </div>
                </div>

                {openMonth === month.month ? (
                  <ChevronDown />
                ) : (
                  <ChevronRight />
                )}
              </div>

              <AnimatePresence>
                {openMonth === month.month && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="mt-6 space-y-4"
                  >
                    {month.weeks.map((week) => (
                      <div
                        key={week.week}
                        className="bg-gray-800 p-5 rounded-xl border border-gray-700"
                      >
                        <h3 className="text-lg font-semibold mb-2">
                          {week.week} — {week.objectif}
                        </h3>

                        <div className="flex gap-2 flex-wrap mb-3">
                          {week.outils.map((outil, i) => (
                            <span
                              key={i}
                              className="bg-purple-700 text-xs px-2 py-1 rounded-full"
                            >
                              {outil}
                            </span>
                          ))}
                        </div>

                        <ul className="list-disc list-inside text-gray-300 space-y-1">
                          {week.taches.map((tache, i) => (
                            <li key={i}>{tache}</li>
                          ))}
                        </ul>

                        <div className="mt-3 text-sm">
                          Statut:{" "}
                          <span
                            className={`px-2 py-1 rounded ${statusConfig[week.status].color}`}
                          >
                            {statusConfig[week.status].label}
                          </span>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>
    </div>
  )
}