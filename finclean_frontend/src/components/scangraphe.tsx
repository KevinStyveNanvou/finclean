"use client";

import { useState, useMemo } from "react";
import {
  LineChart, Line, BarChart, Bar, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Area, AreaChart, PolarRadiusAxis
} from "recharts";

// ─────────────────────────────────────────────
// RAW DATA (subset representative, parsed)
// ─────────────────────────────────────────────
const RAW_SCANS = [
    {"scan_id":5,"name":"rapide permanent — 2026-03-27 09:38","description":"Exécution automatique toutes les 1h","target":"192.168.2.119","status":"completed","begin_at":"2026-03-27T09:38:00.725090Z","end_at":"2026-03-27T09:38:16.105154Z","scan_type":"quick","user":{"id":1,"username":"kev","email":"kev@kev.com","role":"analyst"},"vulnerabilities":[{"id":2,"title":"SMB Service Exposed","description":"SMB service exposed. This can be vulnerable to various attacks.","severity":"high","cvss_score":8.0,"cve_id":null,"exploit_available":false,"risk_score":3.0,"remediation":"Restrict SMB access with firewall rules","port_id":6,"host_id":4,"scan_id":5}]}
] as const; // Remplacer par les données réelles des scans, formatées comme suit :

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────
const SEVERITY_KEYS = ["critical", "high", "medium", "low", "info"] as const;
const SEVERITY_LABELS: Record<string, string> = {
  critical: "Critique", high: "Élevé", medium: "Moyen", low: "Faible", info: "Info",
};

// DaisyUI-compatible CSS variable colors
const SEVERITY_CSS: Record<string, string> = {
  critical: "hsl(var(--er))",
  high:     "hsl(var(--wa))",
  medium:   "hsl(var(--in))",
  low:      "hsl(var(--su))",
  info:     "hsl(var(--p))",
};

const STATUS_COLORS: Record<string, string> = {
  completed: "hsl(var(--su))",
  failed:    "hsl(var(--er))",
  running:   "hsl(var(--in))",
};

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
function classifyScans(scans: typeof RAW_SCANS) {
  const permanents: Record<string, typeof RAW_SCANS> = {};
  const ponctuels: typeof RAW_SCANS = [];

  scans.forEach((s) => {
    if (s.permanent) {
      if (!permanents[s.permanent]) permanents[s.permanent] = [];
      permanents[s.permanent].push(s);
    } else {
      ponctuels.push(s);
    }
  });
  return { permanents, ponctuels };
}

// ─────────────────────────────────────────────
// CUSTOM TOOLTIP
// ─────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-base-100 border border-base-300 rounded-xl px-4 py-3 shadow-xl text-xs">
      <p className="font-bold text-base-content mb-2">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span style={{ background: p.color }} className="w-2 h-2 rounded-full inline-block" />
          <span className="text-base-content/70">{p.name}:</span>
          <span className="font-semibold text-base-content">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────
// KPI CARD
// ─────────────────────────────────────────────
function KpiCard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: string }) {
  return (
    <div className={`card bg-base-200 border border-base-300 shadow-sm hover:shadow-md transition-shadow`}>
      <div className="card-body p-4 gap-1">
        <p className="text-xs font-medium text-base-content/50 uppercase tracking-widest">{label}</p>
        <p className={`text-3xl font-black text-base-content`}>{value}</p>
        {sub && <p className="text-xs text-base-content/40">{sub}</p>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// SECTION HEADER
// ─────────────────────────────────────────────
function SectionHeader({ title, badge, children }: { title: string; badge?: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <h2 className="text-lg font-black text-base-content tracking-tight">{title}</h2>
      {badge && <span className="badge badge-neutral badge-sm font-mono">{badge}</span>}
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────
export default function ScanDashboard() {
  const [activePermanent, setActivePermanent] = useState<string | null>(null);

  const { permanents, ponctuels } = useMemo(() => classifyScans(RAW_SCANS), []);

  // ── KPIs globaux
  const totalScans   = RAW_SCANS.length;
  const totalVulns   = RAW_SCANS.reduce((s, x) => s + x.vulnCount, 0);
  const totalCritical = RAW_SCANS.reduce((s, x) => s + x.critical, 0);
  const completedPct  = Math.round((RAW_SCANS.filter((s) => s.status === "completed").length / totalScans) * 100);

  // ── Distribution sévérité globale (pie)
  const severityPie = SEVERITY_KEYS.map((k) => ({
    name: SEVERITY_LABELS[k],
    value: RAW_SCANS.reduce((s, x) => s + (x[k] as number), 0),
    key: k,
  })).filter((d) => d.value > 0);

  // ── Répartition ponctuels par sévérité (bar)
  const ponctuelBar = ponctuels.map((s) => ({
    name: s.name.length > 16 ? s.name.slice(0, 14) + "…" : s.name,
    fullName: s.name,
    ...Object.fromEntries(SEVERITY_KEYS.map((k) => [k, s[k]])),
    total: s.vulnCount,
  })).filter((s) => s.total > 0);

  // ── Répartition scans permanents vs ponctuels (donut)
  const classificationData = [
    { name: "Permanents", value: Object.keys(permanents).length, key: "perm" },
    { name: "Ponctuels", value: ponctuels.length, key: "ponc" },
  ];

  // ── Statuts globaux
  const statusData = [
    { name: "Complétés", value: RAW_SCANS.filter((s) => s.status === "completed").length, key: "completed" },
    { name: "Échoués",   value: RAW_SCANS.filter((s) => s.status === "failed").length,    key: "failed" },
    { name: "En cours",  value: RAW_SCANS.filter((s) => s.status === "running").length,   key: "running" },
  ];

  // ── Croissance par scan permanent sélectionné
  const permanentNames = Object.keys(permanents);
  const selectedPerm = activePermanent || permanentNames[0] || null;
  const growthData = selectedPerm
    ? permanents[selectedPerm]
        .sort((a, b) => a.scan_id - b.scan_id)
        .map((s, i) => ({
          exec: `#${i + 1}`,
          date: s.date,
          total: s.vulnCount,
          critical: s.critical,
          high: s.high,
          medium: s.medium,
          low: s.low,
          info: s.info,
        }))
    : [];

  // ── Radar: profil de risque par scan ponctuel (top vulnérables)
  const radarScans = ponctuels.filter((s) => s.vulnCount > 0).slice(0, 5);
  const radarData = SEVERITY_KEYS.map((k) => ({
    subject: SEVERITY_LABELS[k],
    ...Object.fromEntries(radarScans.map((s) => [s.name.slice(0, 10), s[k] as number])),
  }));

  // ── Timeline d'exécution par date
  const timelineMap: Record<string, { date: string; scansTotal: number; vulnsTotal: number; critical: number }> = {};
  RAW_SCANS.forEach((s) => {
    if (!timelineMap[s.date]) timelineMap[s.date] = { date: s.date, scansTotal: 0, vulnsTotal: 0, critical: 0 };
    timelineMap[s.date].scansTotal++;
    timelineMap[s.date].vulnsTotal += s.vulnCount;
    timelineMap[s.date].critical += s.critical;
  });
  const timelineData = Object.values(timelineMap).sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="min-h-screen bg-base-100 text-base-content">
      {/* ── HEADER ── */}
      <header className="border-b border-base-300 bg-base-200/60 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <svg className="w-4 h-4 text-primary-content" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <span className="font-black text-base-content tracking-tight text-lg">FinClean</span>
            <span className="text-base-content/30 text-sm font-light">/ Analyse des scans</span>
          </div>
          <div className="flex gap-2 items-center">
            <span className="badge badge-outline badge-sm">{totalScans} scans</span>
            <span className="badge badge-error badge-sm">{totalCritical} critiques</span>
          </div>
        </div>
      </header>


      <main className="max-w-7xl mx-auto px-6 py-8 space-y-10">

        {/* ── KPI ROW ── */}
        <section>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="Total scans"       value={totalScans}           sub={`${completedPct}% complétés`} />
            <KpiCard label="Vulnérabilités"    value={totalVulns}           sub="toutes sévérités confondues" />
            <KpiCard label="Critiques"         value={totalCritical}        sub="exploitation potentielle" />
            <KpiCard label="Scans permanents"  value={permanentNames.length} sub={`${ponctuels.length} ponctuels`} />
          </div>
        </section>

        {/* ── CLASSIFICATION + STATUTS ── */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Donut classification */}
          <div className="card bg-base-200 border border-base-300 shadow-sm">
            <div className="card-body p-5">
              <SectionHeader title="Classification des scans" />
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={classificationData}
                    cx="50%" cy="50%"
                    innerRadius={55} outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                    labelLine={false}
                  >
                    <Cell key="perm" fill="hsl(var(--p))" />
                    <Cell key="ponc" fill="hsl(var(--s))" />
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex gap-4 justify-center mt-2">
                <div className="flex items-center gap-2 text-xs">
                  <span className="w-3 h-3 rounded-sm bg-primary inline-block" />
                  <span className="text-base-content/70">Permanents</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="w-3 h-3 rounded-sm bg-secondary inline-block" />
                  <span className="text-base-content/70">Ponctuels</span>
                </div>
              </div>
            </div>
          </div>

          {/* Statuts */}
          <div className="card bg-base-200 border border-base-300 shadow-sm">
            <div className="card-body p-5">
              <SectionHeader title="Statuts d'exécution" />
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={statusData} barSize={40} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--bc)/0.08)" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--bc)/0.5)" }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--bc)/0.7)" }} width={75} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                    {statusData.map((d) => <Cell key={d.key} fill={STATUS_COLORS[d.key]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* ── TIMELINE GLOBALE ── */}
        <section>
          <div className="card bg-base-200 border border-base-300 shadow-sm">
            <div className="card-body p-5">
              <SectionHeader title="Timeline d'activité" badge="par jour" />
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={timelineData}>
                  <defs>
                    <linearGradient id="gradScans" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="hsl(var(--p))"  stopOpacity={0.25} />
                      <stop offset="95%" stopColor="hsl(var(--p))"  stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradVulns" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="hsl(var(--er))" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="hsl(var(--er))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--bc)/0.08)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--bc)/0.5)" }} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(var(--bc)/0.5)" }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Area type="monotone" dataKey="scansTotal" name="Scans exécutés"    stroke="hsl(var(--p))"  fill="url(#gradScans)" strokeWidth={2} dot={{ r: 3 }} />
                  <Area type="monotone" dataKey="vulnsTotal"  name="Vulnérabilités"   stroke="hsl(var(--er))" fill="url(#gradVulns)" strokeWidth={2} dot={{ r: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* ── RÉPARTITION GLOBALE SÉVÉRITÉ ── */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card bg-base-200 border border-base-300 shadow-sm">
            <div className="card-body p-5">
              <SectionHeader title="Distribution globale des sévérités" />
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={severityPie}
                    cx="50%" cy="50%"
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {severityPie.map((d) => <Cell key={d.key} fill={SEVERITY_CSS[d.key]} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    formatter={(val) => <span style={{ fontSize: 11, color: "hsl(var(--bc)/0.7)" }}>{val}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Radar profil de risque ponctuels */}
          <div className="card bg-base-200 border border-base-300 shadow-sm">
            <div className="card-body p-5">
              <SectionHeader title="Profil de risque" badge="scans ponctuels vulnérables" />
              {radarScans.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="hsl(var(--bc)/0.15)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: "hsl(var(--bc)/0.6)" }} />
                    <PolarRadiusAxis tick={false} axisLine={false} />
                    {radarScans.map((s, i) => {
                      const colors = ["hsl(var(--p))", "hsl(var(--s))", "hsl(var(--a))", "hsl(var(--er))", "hsl(var(--wa))"];
                      return (
                        <Radar key={s.scan_id} name={s.name.slice(0, 14)} dataKey={s.name.slice(0, 10)}
                          stroke={colors[i % colors.length]} fill={colors[i % colors.length]} fillOpacity={0.12} strokeWidth={1.5} />
                      );
                    })}
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-40 text-base-content/30 text-sm">Aucune vulnérabilité dans les scans ponctuels</div>
              )}
            </div>
          </div>
        </section>

        {/* ══ SCANS PONCTUELS ══ */}
        <section>
          <div className="divider">
            <span className="badge badge-secondary font-bold text-secondary-content px-4">Scans Ponctuels</span>
          </div>

          {ponctuelBar.length > 0 ? (
            <div className="card bg-base-200 border border-base-300 shadow-sm mt-4">
              <div className="card-body p-5">
                <SectionHeader title="Vulnérabilités par scan ponctuel" />
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={ponctuelBar} barSize={22}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--bc)/0.08)" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--bc)/0.6)" }} />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(var(--bc)/0.5)" }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    {SEVERITY_KEYS.map((k) => (
                      <Bar key={k} dataKey={k} name={SEVERITY_LABELS[k]} stackId="a"
                        fill={SEVERITY_CSS[k]} radius={k === "info" ? [4, 4, 0, 0] : [0, 0, 0, 0]} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="alert bg-base-200 border border-base-300 mt-4">
              <span className="text-sm text-base-content/50">Aucun scan ponctuel avec des vulnérabilités détectées.</span>
            </div>
          )}

          {/* Table ponctuels */}
          <div className="card bg-base-200 border border-base-300 shadow-sm mt-4 overflow-hidden">
            <div className="card-body p-0">
              <div className="p-5 pb-2">
                <SectionHeader title="Détail des scans ponctuels" badge={`${ponctuels.length} scans`} />
              </div>
              <div className="overflow-x-auto">
                <table className="table table-sm">
                  <thead>
                    <tr className="text-xs text-base-content/50 border-base-300">
                      <th>Nom</th>
                      <th>Cible</th>
                      <th>Type</th>
                      <th>Date</th>
                      <th>Statut</th>
                      <th className="text-right">Vulnérabilités</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ponctuels.map((s) => (
                      <tr key={s.scan_id} className="hover:bg-base-300/50 transition-colors text-xs border-base-300">
                        <td className="font-medium text-base-content">{s.name}</td>
                        <td className="font-mono text-base-content/60">{s.target}</td>
                        <td><span className="badge badge-ghost badge-xs">{s.type}</span></td>
                        <td className="text-base-content/50">{s.date}</td>
                        <td>
                          <span className={`badge badge-xs ${s.status === "completed" ? "badge-success" : s.status === "failed" ? "badge-error" : "badge-info"}`}>
                            {s.status}
                          </span>
                        </td>
                        <td className="text-right">
                          {s.vulnCount > 0 ? (
                            <div className="flex gap-1 justify-end flex-wrap">
                              {s.critical > 0 && <span className="badge badge-error badge-xs">{s.critical}C</span>}
                              {s.high > 0 && <span className="badge badge-warning badge-xs">{s.high}H</span>}
                              {s.medium > 0 && <span className="badge badge-info badge-xs">{s.medium}M</span>}
                              {s.low > 0 && <span className="badge badge-success badge-xs">{s.low}L</span>}
                            </div>
                          ) : (
                            <span className="text-base-content/30">–</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* ══ SCANS PERMANENTS ══ */}
        <section>
          <div className="divider">
            <span className="badge badge-primary font-bold text-primary-content px-4">Scans Permanents</span>
          </div>

          {/* Résumé scans permanents */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-4">
            {permanentNames.map((name) => {
              const execs = permanents[name];
              const totalV = execs.reduce((s, x) => s + x.vulnCount, 0);
              const runs   = execs.filter(e => e.status === "completed").length;
              return (
                <button
                  key={name}
                  onClick={() => setActivePermanent(name === selectedPerm ? null : name)}
                  className={`card border transition-all cursor-pointer text-left p-3 gap-1 hover:border-primary ${
                    selectedPerm === name ? "bg-primary/10 border-primary shadow-md" : "bg-base-200 border-base-300"
                  }`}
                >
                  <p className="text-xs font-bold text-base-content truncate" title={name}>{name}</p>
                  <p className="text-xl font-black text-base-content">{runs}</p>
                  <p className="text-xs text-base-content/40">exécutions</p>
                  {totalV > 0 && <span className="badge badge-error badge-xs mt-1">{totalV} vulns</span>}
                </button>
              );
            })}
          </div>

          {/* Courbe de croissance vulnérabilités du permanent sélectionné */}
          {selectedPerm && (
            <div className="card bg-base-200 border border-base-300 shadow-sm mt-5">
              <div className="card-body p-5">
                <SectionHeader title={`Évolution des vulnérabilités — ${selectedPerm}`} badge="croissance temporelle">
                  <span className="text-xs text-base-content/40 ml-2">({growthData.length} exécutions)</span>
                </SectionHeader>
                {growthData.some(d => d.total > 0) ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={growthData}>
                      <defs>
                        {SEVERITY_KEYS.map((k) => (
                          <linearGradient key={k} id={`grad_${k}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor={SEVERITY_CSS[k]} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={SEVERITY_CSS[k]} stopOpacity={0} />
                          </linearGradient>
                        ))}
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--bc)/0.08)" />
                      <XAxis dataKey="exec" tick={{ fontSize: 10, fill: "hsl(var(--bc)/0.5)" }} />
                      <YAxis tick={{ fontSize: 10, fill: "hsl(var(--bc)/0.5)" }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      {SEVERITY_KEYS.map((k) => (
                        <Area key={k} type="monotone" dataKey={k} name={SEVERITY_LABELS[k]}
                          stroke={SEVERITY_CSS[k]} fill={`url(#grad_${k})`} strokeWidth={2} dot={{ r: 3 }} />
                      ))}
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-40 rounded-xl bg-base-300/40">
                    <div className="text-center space-y-2">
                      <div className="w-12 h-12 mx-auto rounded-full bg-success/20 flex items-center justify-center">
                        <svg className="w-6 h-6 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <p className="text-sm font-medium text-base-content">Aucune vulnérabilité détectée</p>
                      <p className="text-xs text-base-content/40">Ce scan permanent est clean sur toutes ses exécutions</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Barchart comparatif des permanents (exécutions) */}
          <div className="card bg-base-200 border border-base-300 shadow-sm mt-5">
            <div className="card-body p-5">
              <SectionHeader title="Nombre d'exécutions par scan permanent" />
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={permanentNames.map((name) => ({
                    name: name.length > 14 ? name.slice(0, 12) + "…" : name,
                    fullName: name,
                    exécutions: permanents[name].length,
                    avec_vulns: permanents[name].filter(e => e.vulnCount > 0).length,
                  }))}
                  barSize={28}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--bc)/0.08)" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--bc)/0.6)" }} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(var(--bc)/0.5)" }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="exécutions"  name="Total exécutions"        fill="hsl(var(--p))"  radius={[4, 4, 0, 0]} />
                  <Bar dataKey="avec_vulns"  name="Avec vulnérabilités"     fill="hsl(var(--er))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}