import { useState, useEffect, useRef } from "react";

const SEVERITY_COLORS = {
  critical: "#E24B4A",
  high: "#EF9F27",
  medium: "#378ADD",
  low: "#1D9E75",
  info: "#7F77DD",
};

const SEVERITY_LABELS = {
  critical: "Critique",
  high: "Élevé",
  medium: "Moyen",
  low: "Faible",
  info: "Info",
};

function useDarkMode() {
  const [dark, setDark] = useState(
    () => window.matchMedia("(prefers-color-scheme: dark)").matches
  );
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e) => setDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return dark;
}

function DonutChart({ segments, size = 160, hole = 0.6, title, subtitle }) {
  const cx = size / 2;
  const cy = size / 2;
  const r = (size / 2) * 0.82;
  const innerR = r * hole;
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) return null;

  let angle = -Math.PI / 2;
  const paths = segments.map((seg) => {
    const sweep = (seg.value / total) * 2 * Math.PI;
    const x1 = cx + r * Math.cos(angle);
    const y1 = cy + r * Math.sin(angle);
    angle += sweep;
    const x2 = cx + r * Math.cos(angle);
    const y2 = cy + r * Math.sin(angle);
    const ix1 = cx + innerR * Math.cos(angle);
    const iy1 = cy + innerR * Math.sin(angle);
    const ix2 = cx + innerR * Math.cos(angle - sweep);
    const iy2 = cy + innerR * Math.sin(angle - sweep);
    const large = sweep > Math.PI ? 1 : 0;
    return {
      d: `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${innerR} ${innerR} 0 ${large} 0 ${ix2} ${iy2} Z`,
      color: seg.color,
      label: seg.label,
      value: seg.value,
    };
  });

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      role="img"
      aria-label={title}
    >
      {paths.map((p, i) => (
        <path key={i} d={p.d} fill={p.color} stroke="none" />
      ))}
      <text
        x={cx}
        y={cy - 6}
        textAnchor="middle"
        fontSize="22"
        fontWeight="500"
        fill="#ff0000"
        
      >
        {total}
      </text>
      <text
        x={cx}
        y={cy + 14}
        textAnchor="middle"
        fontSize="11"
        fill="#5f8faa"
      >
        {subtitle}
      </text>
    </svg>
  );
}

function Legend({ items }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 16px", marginTop: 8 }}>
      {items.map((item) => (
        <span
          key={item.label}
          style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--color-text-secondary)" }}
        >
          <span
            style={{ width: 10, height: 10, borderRadius: 2, background: item.color, flexShrink: 0 }}
          />
          {item.label} ({item.value})
        </span>
      ))}
    </div>
  );
}

function MetricCard({ label, value, color }) {
  return (
    <div
      style={{
        background: "var(--color-background-secondary)",
        borderRadius: "var(--border-radius-md)",
        padding: "12px 16px",
        minWidth: 80,
        flex: 1,
      }}
    >
      <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 500, color: color || "var(--color-text-primary)" }}>
        {value}
      </div>
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <h3
      style={{
        fontSize: 14,
        fontWeight: 500,
        color: "var(--color-text-secondary)",
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        margin: "0 0 16px",
      }}
    >
      {children}
    </h3>
  );
}

function Card({ children, style }) {
  return (
    <div
      style={{
        background: "var(--color-background-primary)",
        border: "0.5px solid var(--color-border-tertiary)",
        borderRadius: "var(--border-radius-lg)",
        padding: "20px 24px",
        color: "var(--color-text-primary)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function UserBarChart({ data, dark }) {
  if (!data.length) return null;
  const max = Math.max(...data.map((d) => d.count));
  return (
    <div style={{ overflowX: "auto" }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 8,
          height: 140,
          paddingBottom: 28,
          position: "relative",
          minWidth: data.length * 64,
        }}
      >
        {data.map((d) => (
          <div
            key={d.username}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, gap: 4 }}
          >
            <span style={{ fontSize: 11, color: "var(--color-text-secondary)", fontWeight: 500 }}>
              {d.count}
            </span>
            <div
              style={{
                width: "100%",
                background: "#378ADD",
                borderRadius: "4px 4px 0 0",
                height: Math.max(4, (d.count / max) * 96),
                transition: "height 0.4s",
              }}
            />
            <span
              style={{
                fontSize: 11,
                color: "var(--color-text-secondary)",
                marginTop: 4,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: 60,
              }}
              title={d.username}
            >
              {d.username}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PermanentScanEvolution({ permScans, dark }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !permScans.length) return;
    const loadChart = async () => {
      if (!window.Chart) return;
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }

      const COLORS = ["#E24B4A", "#EF9F27", "#378ADD", "#1D9E75", "#7F77DD", "#D4537E", "#639922"];
      const datasets = permScans.map((ps, i) => ({
        label: ps.name,
        data: ps.points,
        borderColor: COLORS[i % COLORS.length],
        backgroundColor: "transparent",
        pointRadius: 3,
        pointHoverRadius: 5,
        tension: 0.35,
        borderWidth: 2,
        borderDash: i % 2 === 1 ? [4, 3] : [],
      }));

      const allTimes = permScans.flatMap((ps) => ps.points.map((p) => p.x));
      const uniqueTimes = [...new Set(allTimes)].sort();

      chartRef.current = new window.Chart(canvasRef.current, {
        type: "line",
        data: { labels: uniqueTimes, datasets },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                title: (items) => {
                  const d = new Date(items[0].label);
                  return d.toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
                },
              },
            },
          },
          scales: {
            x: {
              ticks: {
                color: dark ? "#888" : "#666",
                font: { size: 11 },
                maxRotation: 45,
                callback: function (val, idx) {
                  const label = this.getLabelForValue(val);
                  const d = new Date(label);
                  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}h`;
                },
                maxTicksLimit: 10,
              },
              grid: { color: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" },
            },
            y: {
              ticks: { color: dark ? "#888" : "#666", font: { size: 11 } },
              grid: { color: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" },
              title: { display: true, text: "Vulnérabilités", color: dark ? "#888" : "#666", font: { size: 11 } },
            },
          },
        },
      });
    };
    loadChart();
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [permScans, dark]);

  return (
    <div style={{ position: "relative", width: "100%", height: Math.max(220, permScans.length * 30 + 120) }}>
      <canvas ref={canvasRef} role="img" aria-label="Évolution des vulnérabilités par scan permanent" />
    </div>
  );
}

export default function StatsPanel({ data }) {
  const dark = useDarkMode();
  const [chartReady, setChartReady] = useState(!!window.Chart);

  useEffect(() => {
    if (window.Chart) { setChartReady(true); return; }
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js";
    script.onload = () => setChartReady(true);
    document.head.appendChild(script);
  }, []);

  if (!data || !data.length) {
    return (
      <div style={{ padding: "2rem", color: "var(--color-text-secondary)", textAlign: "center" }}>
        Aucune donnée de scan disponible.
      </div>
    );
  }

  const totalScans = data.length;
  const permanentScans = data.filter((s) => s.permanent_scan !== null);
  const punctualScans = data.filter((s) => s.permanent_scan === null);

  const statusCount = data.reduce((acc, s) => {
    acc[s.status] = (acc[s.status] || 0) + 1;
    return acc;
  }, {});

  const allVulns = data.flatMap((s) => s.vulnerabilities || []);
  const vulnBySeverity = allVulns.reduce((acc, v) => {
    const sev = v.severity || "info";
    acc[sev] = (acc[sev] || 0) + 1;
    return acc;
  }, {});

  const userScanCount = data.reduce((acc, s) => {
    const u = s.user?.username || "inconnu";
    acc[u] = (acc[u] || 0) + 1;
    return acc;
  }, {});
  const userBarData = Object.entries(userScanCount)
    .map(([username, count]) => ({ username, count }))
    .sort((a, b) => b.count - a.count);

  const scanTypeSegments = [
    { label: "Permanent", value: permanentScans.length, color: "#378ADD" },
    { label: "Ponctuel", value: punctualScans.length, color: "#7F77DD" },
  ].filter((s) => s.value > 0);

  const vulnSegments = Object.entries(vulnBySeverity)
    .map(([sev, count]) => ({
      label: SEVERITY_LABELS[sev] || sev,
      value: count,
      color: SEVERITY_COLORS[sev] || "#888",
    }))
    .sort((a, b) => b.value - a.value);

  const statusColors = {
    completed: "#1D9E75",
    failed: "#E24B4A",
    running: "#EF9F27",
  };
  const statusSegments = Object.entries(statusCount).map(([status, count]) => ({
    label: status,
    value: count,
    color: statusColors[status] || "#7F77DD",
  }));

  const permScanGroups = {};
  data.forEach((s) => {
    if (!s.permanent_scan) return;
    const id = s.permanent_scan.id;
    if (!permScanGroups[id]) {
      permScanGroups[id] = {
        id,
        name: s.permanent_scan.name,
        target: s.permanent_scan.target,
        scans: [],
      };
    }
    permScanGroups[id].scans.push(s);
  });

  const permScanEvolution = Object.values(permScanGroups).map((pg) => {
    const sorted = [...pg.scans].sort(
      (a, b) => new Date(a.begin_at) - new Date(b.begin_at)
    );
    const points = sorted
      .filter((s) => s.status === "completed")
      .map((s) => ({
        x: s.begin_at,
        y: (s.vulnerabilities || []).length,
      }));
    return { name: pg.name, target: pg.target, points };
  }).filter((pg) => pg.points.length > 0);

  const permVulns = permanentScans.flatMap((s) => s.vulnerabilities || []);
  const permVulnBySev = permVulns.reduce((acc, v) => {
    const sev = v.severity || "info";
    acc[sev] = (acc[sev] || 0) + 1;
    return acc;
  }, {});
  const permVulnSegments = Object.entries(permVulnBySev)
    .map(([sev, count]) => ({
      label: SEVERITY_LABELS[sev] || sev,
      value: count,
      color: SEVERITY_COLORS[sev] || "#888",
    }))
    .sort((a, b) => b.value - a.value);

  const exploitable = allVulns.filter((v) => v.exploit_available).length;
  const criticalCount = vulnBySeverity.critical || 0;

  return (
    <div style={{ padding: "0 0 2rem", display: "flex", flexDirection: "column", gap: 24 }}>
      <h2 style={{ fontSize: 18, fontWeight: 500, margin: 0, color: "var(--color-text-primary)" }}>
        Tableau de bord statistiques
      </h2>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 12 }}>
        <MetricCard label="Total scans" value={totalScans} />
        <MetricCard label="Permanents" value={permanentScans.length} color="#378ADD" />
        <MetricCard label="Ponctuels" value={punctualScans.length} color="#7F77DD" />
        <MetricCard label="Vulnérabilités" value={allVulns.length} color="#E24B4A" />
        <MetricCard label="Critiques" value={criticalCount} color="#E24B4A" />
        <MetricCard label="Exploitables" value={exploitable} color="#EF9F27" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
        <Card>
          <SectionTitle>Type de scan</SectionTitle>
          <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
            <DonutChart
              segments={scanTypeSegments}
              title="Répartition type de scan"
              subtitle="scans"
              size={150}
            />
            <Legend items={scanTypeSegments} />
          </div>
        </Card>

        <Card>
          <SectionTitle>Statut des scans</SectionTitle>
          <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
            <DonutChart
              segments={statusSegments}
              title="Répartition statut des scans"
              subtitle="total"
              size={150}
            />
            <Legend items={statusSegments} />
          </div>
        </Card>

        <Card>
          <SectionTitle>Sévérité des vulnérabilités</SectionTitle>
          <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
            <DonutChart
              segments={vulnSegments}
              title="Répartition sévérité des vulnérabilités"
              subtitle="vulnérabilités"
              size={150}
            />
            <Legend items={vulnSegments} />
          </div>
        </Card>
      </div>

      {userBarData.length > 1 && (
        <Card>
          <SectionTitle>Scans par utilisateur</SectionTitle>
          <UserBarChart data={userBarData} dark={dark} />
        </Card>
      )}

      {Object.keys(permScanGroups).length > 0 && (
        <>
          <h3
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: "var(--color-text-secondary)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              margin: "8px 0 0",
            }}
          >
            Scans permanents
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
            <Card>
              <SectionTitle>Vulnérabilités (scans permanents)</SectionTitle>
              {permVulnSegments.length > 0 ? (
                <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
                  <DonutChart
                    segments={permVulnSegments}
                    title="Vulnérabilités des scans permanents"
                    subtitle="vulnérabilités"
                    size={150}
                  />
                  <Legend items={permVulnSegments} />
                </div>
              ) : (
                <p style={{ color: "var(--color-text-secondary)", fontSize: 13 }}>
                  Aucune vulnérabilité détectée dans les scans permanents.
                </p>
              )}
            </Card>

            <Card style={{ gridColumn: "span 2" }}>
              <SectionTitle>Résumé des scans permanents</SectionTitle>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {Object.values(permScanGroups).map((pg) => {
                  const totalVulns = pg.scans.reduce(
                    (s, sc) => s + (sc.vulnerabilities || []).length,
                    0
                  );
                  const completed = pg.scans.filter((s) => s.status === "completed").length;
                  const failed = pg.scans.filter((s) => s.status === "failed").length;
                  return (
                    <div
                      key={pg.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "10px 14px",
                        background: "var(--color-background-secondary)",
                        borderRadius: "var(--border-radius-md)",
                        flexWrap: "wrap",
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 120 }}>
                        <div style={{ fontWeight: 500, fontSize: 13, color: "var(--color-text-primary)" }}>
                          {pg.name}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>
                          {pg.target}
                        </div>
                      </div>
                      <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
                        {pg.scans.length} exécutions
                      </span>
                      <span
                        style={{
                          fontSize: 12,
                          padding: "2px 8px",
                          borderRadius: 4,
                          background: "rgba(29,158,117,0.12)",
                          color: "#0F6E56",
                        }}
                      >
                        {completed} réussis
                      </span>
                      {failed > 0 && (
                        <span
                          style={{
                            fontSize: 12,
                            padding: "2px 8px",
                            borderRadius: 4,
                            background: "rgba(226,75,74,0.12)",
                            color: "#A32D2D",
                          }}
                        >
                          {failed} échoués
                        </span>
                      )}
                      <span
                        style={{
                          fontSize: 12,
                          padding: "2px 8px",
                          borderRadius: 4,
                          background: "rgba(226,75,74,0.1)",
                          color: "#A32D2D",
                          fontWeight: 500,
                        }}
                      >
                        {totalVulns} vuln.
                      </span>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {chartReady && permScanEvolution.length > 0 && (
            <Card>
              <SectionTitle>Évolution des vulnérabilités par scan permanent</SectionTitle>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "8px 20px",
                  marginBottom: 16,
                  fontSize: 12,
                  color: "var(--color-text-secondary)",
                }}
              >
                {permScanEvolution.map((ps, i) => {
                  const COLORS = ["#E24B4A", "#EF9F27", "#378ADD", "#1D9E75", "#7F77DD", "#D4537E", "#639922"];
                  return (
                    <span key={ps.name} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <span
                        style={{
                          width: 24,
                          height: 3,
                          background: COLORS[i % COLORS.length],
                          borderRadius: 2,
                          flexShrink: 0,
                          borderBottom: i % 2 === 1 ? "2px dashed" : "none",
                        }}
                      />
                      {ps.name}
                    </span>
                  );
                })}
              </div>
              <PermanentScanEvolution permScans={permScanEvolution} dark={dark} />
            </Card>
          )}
        </>
      )}
    </div>
  );
}