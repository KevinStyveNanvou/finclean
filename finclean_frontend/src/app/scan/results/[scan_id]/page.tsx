'use client';
import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileSearch, Filter, Download, ChevronDown, ChevronRight,
  Globe, Server, AlertTriangle, Shield, Info, XCircle, Clock,
  Network, Activity, Target, Calendar, Hash, Gauge, AlertCircle,
  CheckCircle, HelpCircle, Radio, Wifi, Zap, Lock, Unlock,
  Terminal, Eye, EyeOff, Cpu, Bug, ExternalLink, RefreshCw,
  BarChart3, ShieldAlert, ShieldCheck, Fingerprint, Binary,
  MessageCircle
} from 'lucide-react';
import { PlatformLayout } from '@/components/platform-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Chat, { ChatMessage } from '@/components/chat';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';

// ============================================================
// TYPES — aligned with the new backend API
// ============================================================

type User = {
  id: number;
  username: string;
  email: string;
  role: string;
};

interface Vulnerability {
  id: number;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  cvss_score: number | null;
  cve_id: string | null;
  exploit_available: boolean;
  risk_score: number | null;
  remediation: string | null;
}

interface Port {
  id: number;
  port_number: number;
  protocol: string;
  state: string;
  service: string;
  version: string | null;
  banner: string | null;
  is_web_service: boolean;
  is_potentially_risky: boolean;
  vuln_count: number;
  has_critical: boolean;
  has_exploit: boolean;
  vulnerabilities: Vulnerability[];
}

interface SeverityDistribution {
  critical: number;
  high: number;
  medium: number;
  low: number;
  info: number;
}

interface Host {
  id: number;
  ip_address: string;
  os: string | null;
  os_cpe: string | null;
  latency_ms: number | null;
  open_ports: number;
  business_criticality: number;
  total_vulns: number;
  severity_distribution: SeverityDistribution;
  has_critical_vuln: boolean;
  has_exploit: boolean;
  ports: Port[];
}

interface ScanCapabilities {
  os_detection: boolean;
  script_vulns: boolean;
  all_ports: boolean;
  description: string;
}

interface ScanResult {
  user: User | null;
  scan_id: number;
  name: string;
  target: string;
  scan_type: string;
  status: string;
  begin_at: string;
  end_at: string | null;
  capabilities: ScanCapabilities;
  host: Host | null;
  raw_output: string | null;
}

// Enriched vuln for display
interface DisplayVulnerability extends Vulnerability {
  port_number: number;
  service: string;
  protocol: string;
}

// ============================================================
// DESIGN CONSTANTS
// Uses CSS-variable-based Tailwind classes so the theme can
// switch between dark/light without hard-coded color values.
//
// Mapping used:
//   critical  → destructive  (red)
//   high      → warning      (orange — mapped to amber/yellow via custom var or destructive/80)
//   medium    → warning/60
//   low       → primary      (blue-ish accent)
//   info      → muted        (neutral)
//
// For bg/text/border we rely on:
//   bg-background, bg-card, bg-muted, bg-accent
//   text-foreground, text-muted-foreground, text-card-foreground
//   border-border
//   text-destructive, text-primary, text-secondary-foreground
// ============================================================

const SEVERITY_CONFIG: Record<string, {
  label: string;
  bg: string;
  text: string;
  border: string;
  badgeBg: string;
  dot: string;
  barColor: string;
  icon: React.ReactNode;
}> = {
  critical: {
    label: 'Critical',
    bg: 'bg-destructive/10',
    text: 'text-destructive',
    border: 'border-destructive/40',
    badgeBg: 'bg-destructive/20 text-destructive border-destructive/40',
    dot: 'bg-destructive',
    barColor: 'bg-destructive',
    icon: <XCircle className="h-4 w-4 text-destructive" />,
  },
  high: {
    label: 'High',
    // No built-in "warning" in shadcn — use destructive at lower opacity + amber override via inline style or a muted orange class
    bg: 'bg-orange-500/10 dark:bg-orange-950/30',
    text: 'text-orange-600 dark:text-orange-400',
    border: 'border-orange-500/30 dark:border-orange-700/50',
    badgeBg: 'bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30 dark:border-orange-700',
    dot: 'bg-orange-500',
    barColor: 'bg-orange-500',
    icon: <AlertTriangle className="h-4 w-4 text-orange-500" />,
  },
  medium: {
    label: 'Medium',
    bg: 'bg-yellow-500/10 dark:bg-yellow-950/25',
    text: 'text-yellow-600 dark:text-yellow-400',
    border: 'border-yellow-500/30 dark:border-yellow-700/50',
    badgeBg: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-300 border-yellow-500/30 dark:border-yellow-700',
    dot: 'bg-yellow-500',
    barColor: 'bg-yellow-500',
    icon: <AlertCircle className="h-4 w-4 text-yellow-500" />,
  },
  low: {
    label: 'Low',
    bg: 'bg-primary/5',
    text: 'text-primary',
    border: 'border-primary/30',
    badgeBg: 'bg-primary/10 text-primary border-primary/30',
    dot: 'bg-primary',
    barColor: 'bg-primary',
    icon: <Info className="h-4 w-4 text-primary" />,
  },
  info: {
    label: 'Info',
    bg: 'bg-muted/50',
    text: 'text-muted-foreground',
    border: 'border-border',
    badgeBg: 'bg-muted text-muted-foreground border-border',
    dot: 'bg-muted-foreground',
    barColor: 'bg-muted-foreground',
    icon: <HelpCircle className="h-4 w-4 text-muted-foreground" />,
  },
};

// ============================================================
// UTILITIES
// ============================================================

function getSeverityCfg(severity: string) {
  return SEVERITY_CONFIG[severity?.toLowerCase()] ?? SEVERITY_CONFIG.info;
}

function formatDate(dateString: string | null) {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleString('en-US', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return 'Invalid date';
  }
}

function formatDuration(start: string | null, end: string | null) {
  if (!start || !end) return null;
  try {
    const sec = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 1000);
    if (sec < 60) return `${sec}s`;
    if (sec < 3600) return `${Math.floor(sec / 60)}m ${sec % 60}s`;
    return `${Math.floor(sec / 3600)}h ${Math.floor((sec % 3600) / 60)}m`;
  } catch {
    return null;
  }
}

function CvssBar({ score }: { score: number | null }) {
  if (score === null) return <span className="text-muted-foreground text-xs">N/A</span>;
  const pct = (score / 10) * 100;
  // Keep semantic color progression: green → yellow → orange → red
  const colorClass = score >= 9
    ? 'bg-destructive'
    : score >= 7
    ? 'bg-orange-500'
    : score >= 4
    ? 'bg-yellow-500'
    : 'bg-primary';
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full ${colorClass} rounded-full transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-mono text-foreground">{score.toFixed(1)}</span>
    </div>
  );
}

function RiskScoreBadge({ score }: { score: number | null }) {
  if (score === null) return <span className="text-muted-foreground text-xs">—</span>;
  const rounded = Math.round(score * 10) / 10;
  const colorClass = rounded >= 9
    ? 'text-destructive'
    : rounded >= 7
    ? 'text-orange-500'
    : rounded >= 4
    ? 'text-yellow-500'
    : 'text-primary';
  return <span className={`font-mono font-bold text-sm ${colorClass}`}>{rounded}</span>;
}

function StatCard({
  icon, label, value, sub, accent
}: {
  icon: React.ReactNode;
  label: React.ReactNode;
  value: React.ReactNode;
  sub?: React.ReactNode;
  accent?: string;
}) {
  return (
    <div className={`rounded-xl border bg-card p-4 flex flex-col gap-1 ${accent ?? 'border-border'}`}>
      <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-2xl font-bold text-card-foreground font-mono">{value}</div>
      {sub}
    </div>
  );
}

function EmptyState({ message, sub }: { message: string; sub?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
      <Shield className="h-12 w-12 text-muted-foreground/40" />
      <p className="text-foreground font-medium">{message}</p>
      {sub && <p className="text-muted-foreground text-sm">{sub}</p>}
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function ScanResultsPage({ params }: { params: Promise<{ scan_id: string }> }) {
  const { toast } = useToast();
  const resolvedParams = React.use(params);
  const scan_id = resolvedParams.scan_id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scanData, setScanData] = useState<ScanResult | null>(null);
  const [allVulns, setAllVulns] = useState<DisplayVulnerability[]>([]);
  const [filteredVulns, setFilteredVulns] = useState<DisplayVulnerability[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [exploitFilter, setExploitFilter] = useState(false);
  const [expandedVuln, setExpandedVuln] = useState<number | null>(null);
  const [expandedPorts, setExpandedPorts] = useState(true);
  const [showRaw, setShowRaw] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  /* ------------------ CHAT FUNCTIONS ------------------ */
  const sendChatMessage = async (message: string) => {
    if (!message.trim() || isChatLoading) return;
    const msg =
      'Based on these scan results, ' +
      (scanData?.raw_output) +
      " answer this user question: \n" +
      message;
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date(),
    };

    setChatMessages(prev => [...prev, userMessage]);
    setIsChatLoading(true);

    try {
      const response = await api.post('ia/chat/', {
        message,
        query: message,
        context: {
          userId: currentUser?.id,
          role: currentUser?.role,
          timestamp: new Date().toISOString()
        }
      });

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.data.response || response.data.message || 'No response from assistant',
        timestamp: new Date(),
      };

      setChatMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${error.response?.data?.error || error.message || 'Failed to get response'}`,
        timestamp: new Date(),
      };
      setChatMessages(prev => [...prev, errorMessage]);

      toast({
        title: 'Chat Error',
        description: error.response?.data?.error || 'Failed to send message',
        variant: 'destructive'
      });
    } finally {
      setIsChatLoading(false);
    }
  };

  // ----------------------------------------------------------
  // Data loading
  // ----------------------------------------------------------
  const loadScan = useCallback(async () => {
    if (!scan_id) return;
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/scans/status/${scan_id}/`);
      const data: ScanResult = response.data;
      setScanData(data);
      setCurrentUser(data.user ?? null);

      // Flatten all vulnerabilities from host.ports
      const vulns: DisplayVulnerability[] = [];
      if (data.host?.ports) {
        for (const port of data.host.ports) {
          for (const vuln of port.vulnerabilities) {
            vulns.push({
              ...vuln,
              port_number: port.port_number,
              service: port.service || 'unknown',
              protocol: port.protocol,
            });
          }
        }
      }

      // Sort: critical first, then by risk_score descending
      const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
      vulns.sort((a, b) => {
        const sd = (severityOrder[a.severity] ?? 4) - (severityOrder[b.severity] ?? 4);
        if (sd !== 0) return sd;
        return (b.risk_score ?? 0) - (a.risk_score ?? 0);
      });

      setAllVulns(vulns);
      setFilteredVulns(vulns);
    } catch (err: any) {
      const msg = err.response?.data?.error ?? err.message ?? 'Loading error';
      setError(msg);
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [scan_id, toast]);

  useEffect(() => { loadScan(); }, [loadScan]);

  // ----------------------------------------------------------
  // Reactive filtering
  // ----------------------------------------------------------
  useEffect(() => {
    let result = allVulns;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(v =>
        v.title?.toLowerCase().includes(q) ||
        v.cve_id?.toLowerCase().includes(q) ||
        v.service?.toLowerCase().includes(q) ||
        v.description?.toLowerCase().includes(q) ||
        String(v.port_number).includes(q)
      );
    }

    if (severityFilter !== 'all') {
      result = result.filter(v => v.severity?.toLowerCase() === severityFilter);
    }

    if (exploitFilter) {
      result = result.filter(v => v.exploit_available);
    }

    setFilteredVulns(result);
  }, [searchQuery, severityFilter, exploitFilter, allVulns]);

  // ----------------------------------------------------------
  // PDF Export
  // ----------------------------------------------------------
  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}scans/status/${scan_id}/pdf`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP Error ${res.status}`);
      }

      const blob = new Blob([await res.arrayBuffer()], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `FinClean_Scan_${scan_id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: 'Export successful', description: `PDF report generated for scan #${scan_id}` });
    } catch (err: any) {
      toast({ title: 'PDF export error', description: err.message, variant: 'destructive' });
    } finally {
      setExporting(false);
    }
  };

  // ----------------------------------------------------------
  // Derived stats
  // ----------------------------------------------------------
  const host = scanData?.host ?? null;
  const dist = host?.severity_distribution ?? { critical: 0, high: 0, medium: 0, low: 0, info: 0 };

  // ----------------------------------------------------------
  // Loading state
  // ----------------------------------------------------------
  if (loading) {
    return (
      <PlatformLayout>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-border border-t-primary animate-spin" />
            <Binary className="absolute inset-0 m-auto h-6 w-6 text-primary" />
          </div>
          <p className="text-muted-foreground text-sm">Analyzing scan data…</p>
        </div>
      </PlatformLayout>
    );
  }

  // ----------------------------------------------------------
  // Error state
  // ----------------------------------------------------------
  if (error || !scanData) {
    return (
      <PlatformLayout>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] gap-4 p-8">
          <div className="w-16 h-16 rounded-full bg-destructive/10 border border-destructive/40 flex items-center justify-center">
            <XCircle className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Scan not found</h2>
          <p className="text-muted-foreground text-sm text-center max-w-md">
            {error ?? `Scan #${scan_id} does not exist or you do not have access rights.`}
          </p>
          <Button variant="outline" onClick={loadScan} className="gap-2 mt-2">
            <RefreshCw className="h-4 w-4" /> Retry
          </Button>
        </div>
      </PlatformLayout>
    );
  }

  const duration = formatDuration(scanData.begin_at, scanData.end_at);
  const CHAT_WIDTH = 360;

  return (
    <PlatformLayout>
      <div
        className="flex-1 transition-all duration-300"
        style={{ marginRight: isChatOpen ? `${CHAT_WIDTH}px` : '0' }}
      >
        <div className="min-h-screen bg-background text-foreground">
          <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">

            {/* ====================================================
              HEADER
            ==================================================== */}
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl font-bold text-foreground tracking-tight">
                    {scanData.name || `Scan #${scanData.scan_id}`}
                  </h1>
                  <span className="px-2 py-0.5 rounded-md bg-muted border border-border text-muted-foreground text-xs font-mono">
                    #{scanData.scan_id}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                    scanData.status === 'completed'
                      ? 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30'
                      : scanData.status === 'running'
                      ? 'bg-primary/10 text-primary border-primary/30'
                      : 'bg-destructive/10 text-destructive border-destructive/30'
                  }`}>
                    {scanData.status === 'completed' ? '✓ Completed'
                      : scanData.status === 'running' ? '⟳ Running'
                      : '✗ Failed'}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Target className="h-3.5 w-3.5" />
                    <span className="font-mono text-foreground">{scanData.target}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Activity className="h-3.5 w-3.5" />
                    <span className="capitalize">{scanData.scan_type}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(scanData.begin_at)}
                  </span>
                  {duration && (
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      {duration}
                    </span>
                  )}
                </div>

                {/* Scan capabilities */}
                {scanData.capabilities && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {[
                      { key: 'os_detection', label: 'OS Detection' },
                      { key: 'script_vulns', label: 'Vuln Scripts' },
                      { key: 'all_ports', label: 'All Ports' },
                    ].map(({ key, label }) => (
                      <span
                        key={key}
                        className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded border ${
                          scanData.capabilities[key as keyof ScanCapabilities]
                            ? 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30'
                            : 'bg-muted text-muted-foreground border-border'
                        }`}
                      >
                        {scanData.capabilities[key as keyof ScanCapabilities]
                          ? <CheckCircle className="h-3 w-3" />
                          : <XCircle className="h-3 w-3" />}
                        {label}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadScan}
                  className="gap-1.5"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Refresh
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsChatOpen(true)}
                  className="gap-1.5"
                >
                  <MessageCircle className="h-4 w-4 mr-1" /> AI Secure Chat
                </Button>
                <Button
                  size="sm"
                  onClick={handleExportPDF}
                  disabled={exporting}
                  className="gap-1.5"
                >
                  {exporting
                    ? <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    : <Download className="h-3.5 w-3.5" />}
                  Export PDF
                </Button>
              </div>
            </div>

            {/* ====================================================
              NO RESULTS — scan running or empty
            ==================================================== */}
            {!host && scanData.status === 'running' && (
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-6 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full border-4 border-primary/30 border-t-primary animate-spin shrink-0" />
                <div>
                  <p className="text-primary font-medium">Scan is running…</p>
                  <p className="text-muted-foreground text-sm mt-0.5">
                    Results will appear automatically once the scan completes.
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={loadScan} className="ml-auto text-primary">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            )}

            {!host && scanData.status === 'completed' && (
              <div className="rounded-xl border border-border bg-card p-8">
                <EmptyState
                  message="No host detected"
                  sub="The target returned no results. Verify that the target is reachable from the container."
                />
              </div>
            )}

            {!host && scanData.status === 'failed' && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 flex items-center gap-4">
                <XCircle className="h-8 w-8 text-destructive shrink-0" />
                <div>
                  <p className="text-destructive font-medium">Scan failed</p>
                  <p className="text-muted-foreground text-sm mt-0.5">
                    Check the container logs for more details.
                  </p>
                </div>
              </div>
            )}

            {/* ====================================================
              FULL RESULTS
            ==================================================== */}
            {host && (
              <>
                {/* ---- STAT CARDS ---- */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                  <StatCard
                    icon={<Cpu className="h-3.5 w-3.5" />}
                    label={<p className="items-center text-primary">SYSTEM</p>}
                    value={<span className="text-base font-medium truncate block">{host.os ?? 'Unknown OS'}</span>}
                    sub={<div className="text-xs mt-2 text-muted-foreground bg-accent/30 align-middle text-center p-2 rounded-2xl">{host.os_cpe ?? undefined}</div>}
                  />
                  <StatCard
                    icon={<Radio className="h-3.5 w-3.5" />}
                    label="Open Ports"
                    value={host.open_ports}
                    sub={<div className="text-xs text-muted-foreground bg-accent/30 align-middle text-center p-2 rounded-2xl">{`Business criticality: ${host.business_criticality}/10`}</div>}
    
                  />
                  <StatCard
                    icon={<XCircle className="h-3.5 w-3.5 text-error" />}
                    label={<p className="items-center text-error">CRITICAL</p>}
                    value={<span className="text-error">{dist.critical}</span>}
                    accent="border-error/70"
                    sub={<div className="text-xs text-muted-foreground bg-secondary-content/20 align-middle text-center text-warning p-2 rounded-2xl">{`${dist.high} high`}</div>}
                  />
                  <StatCard
                    icon={<AlertCircle className="h-3.5 w-3.5 text-warning" />}
                    label="Medium"
                    value={<span className="text-warning">{dist.medium}</span>}
                    accent="border-warning/70"
                    sub={<div className="text-xs text-muted-foreground bg-secondary/10 align-middle text-center text-info p-2 rounded-2xl">{`${dist.low} low`}</div>}
                  />
                  <StatCard
                    icon={<Bug className="h-3.5 w-3.5 text-info" />}
                    label="Known Exploits"
                    value={
                      <span className="text-info">
                        {allVulns.filter(v => v.exploit_available).length}
                      </span>
                    }
                    accent="border-info/70"
                    sub="ExploitDB + NVD"
                  />
                  <StatCard
                    icon={<Gauge className="h-3.5 w-3.5 text-primary" />}
                    label="Total Vulnerabilities"
                    value={host.total_vulns}
                    sub={`Latency: ${host.latency_ms !== null ? `${host.latency_ms}ms` : 'N/A'}`}
                  />
                </div>

                {/* ---- TABS ---- */}
                <Tabs defaultValue="vulnerabilities" className="space-y-4">
                  <TabsList className="bg-card border border-border p-1 gap-1">
                    <TabsTrigger
                      value="vulnerabilities"
                      className="data-[state=active]:bg-muted data-[state=active]:text-foreground text-muted-foreground gap-2"
                    >
                      <ShieldAlert className="h-4 w-4" />
                      Vulnerabilities
                      <span className="ml-1 px-1.5 py-0.5 rounded text-xs bg-muted text-foreground">
                        {allVulns.length}
                      </span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="ports"
                      className="data-[state=active]:bg-muted data-[state=active]:text-foreground text-muted-foreground gap-2"
                    >
                      <Network className="h-4 w-4" />
                      Ports & Services
                      <span className="ml-1 px-1.5 py-0.5 rounded text-xs bg-muted text-foreground">
                        {host.open_ports}
                      </span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="details"
                      className="data-[state=active]:bg-muted data-[state=active]:text-foreground text-muted-foreground gap-2"
                    >
                      <FileSearch className="h-4 w-4" />
                      Details
                    </TabsTrigger>
                  </TabsList>

                  {/* ================================================
                    VULNERABILITIES TAB
                  ================================================ */}
                  <TabsContent value="vulnerabilities">
                    <div className="rounded-xl border border-border bg-card overflow-hidden">
                      {/* Filter bar */}
                      <div className="p-4 border-b border-border flex flex-wrap gap-3 items-center">
                        <div className="relative flex-1 min-w-[200px]">
                          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                          <Input
                            placeholder="CVE, service, port, title…"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="pl-9 h-8 text-sm"
                          />
                        </div>
                        <Select value={severityFilter} onValueChange={setSeverityFilter}>
                          <SelectTrigger className="w-36 h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All severities</SelectItem>
                            <SelectItem value="critical">Critical</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="info">Info</SelectItem>
                          </SelectContent>
                        </Select>
                        <button
                          onClick={() => setExploitFilter(v => !v)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs border transition-colors ${
                            exploitFilter
                              ? 'bg-purple-500/15 text-purple-600 dark:text-purple-300 border-purple-500/40'
                              : 'bg-muted text-muted-foreground border-border hover:border-foreground/30'
                          }`}
                        >
                          <Bug className="h-3.5 w-3.5" />
                          Exploits only
                        </button>
                        {(searchQuery || severityFilter !== 'all' || exploitFilter) && (
                          <span className="text-xs text-muted-foreground">
                            {filteredVulns.length} / {allVulns.length} results
                          </span>
                        )}
                      </div>

                      {/* Vulnerability list */}
                      {filteredVulns.length === 0 ? (
                        <EmptyState
                          message="No vulnerabilities match the filters"
                          sub="Try adjusting your search criteria."
                        />
                      ) : (
                        <div className="divide-y divide-border">
                          {filteredVulns.map((vuln, idx) => {
                            const cfg = getSeverityCfg(vuln.severity);
                            const isOpen = expandedVuln === vuln.id;
                            return (
                              <motion.div
                                key={vuln.id}
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: Math.min(idx * 0.02, 0.3) }}
                              >
                                {/* Main row */}
                                <button
                                  className="w-full text-left px-4 py-3.5 hover:bg-muted/50 transition-colors flex items-start gap-3"
                                  onClick={() => setExpandedVuln(isOpen ? null : vuln.id)}
                                >
                                  {/* Severity indicator */}
                                  <div className={`mt-0.5 w-1 self-stretch rounded-full ${cfg.dot}`} />

                                  {/* Icon */}
                                  <div className="mt-0.5 shrink-0">{cfg.icon}</div>

                                  {/* Content */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                      <span className="font-medium text-foreground text-sm leading-snug">
                                        {vuln.title}
                                      </span>
                                      <div className="flex items-center gap-2 shrink-0">
                                        {vuln.exploit_available && (
                                          <span className="px-1.5 py-0.5 rounded text-xs bg-destructive/15 text-destructive border border-destructive/30">
                                            EXPLOIT
                                          </span>
                                        )}
                                        {isOpen
                                          ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                          : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                                      </div>
                                    </div>

                                    <div className="flex flex-wrap gap-2 mt-2">
                                      <span className={`px-2 py-0.5 rounded-full text-xs border font-medium ${cfg.badgeBg}`}>
                                        {cfg.label}
                                      </span>
                                      {vuln.cve_id && (
                                        <span className="px-2 py-0.5 rounded text-xs bg-muted text-foreground border border-border font-mono">
                                          {vuln.cve_id}
                                        </span>
                                      )}
                                      <span className="px-2 py-0.5 rounded text-xs bg-muted text-muted-foreground border border-border font-mono">
                                        :{vuln.port_number}/{vuln.protocol}
                                      </span>
                                      <span className="px-2 py-0.5 rounded text-xs bg-muted text-muted-foreground border border-border">
                                        {vuln.service}
                                      </span>
                                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                        Risk: <RiskScoreBadge score={vuln.risk_score} />
                                      </span>
                                    </div>
                                  </div>
                                </button>

                                {/* Expanded details */}
                                <AnimatePresence>
                                  {isOpen && (
                                    <motion.div
                                      key="detail"
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      transition={{ duration: 0.2 }}
                                      className="overflow-hidden"
                                    >
                                      <div className={`mx-4 mb-4 rounded-lg border p-4 space-y-4 ${cfg.bg} ${cfg.border}`}>

                                        {/* Metrics */}
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                          <div className="rounded-lg bg-background border border-border p-3">
                                            <div className="text-xs text-muted-foreground mb-1.5">CVSS Score</div>
                                            <CvssBar score={vuln.cvss_score} />
                                          </div>
                                          <div className="rounded-lg bg-background border border-border p-3">
                                            <div className="text-xs text-muted-foreground mb-1.5">Business Risk Score</div>
                                            <RiskScoreBadge score={vuln.risk_score} />
                                          </div>
                                          <div className="rounded-lg bg-background border border-border p-3">
                                            <div className="text-xs text-muted-foreground mb-1.5">Port / Service</div>
                                            <span className="text-xs font-mono text-foreground">
                                              {vuln.port_number}/{vuln.protocol} — {vuln.service}
                                            </span>
                                          </div>
                                          <div className="rounded-lg bg-background border border-border p-3">
                                            <div className="text-xs text-muted-foreground mb-1.5">Exploit Available</div>
                                            {vuln.exploit_available
                                              ? <span className="text-destructive text-sm font-medium flex items-center gap-1">
                                                  <Bug className="h-3.5 w-3.5" /> Yes
                                                </span>
                                              : <span className="text-green-600 dark:text-green-400 text-sm font-medium flex items-center gap-1">
                                                  <ShieldCheck className="h-3.5 w-3.5" /> No
                                                </span>}
                                          </div>
                                        </div>

                                        {/* Description */}
                                        {vuln.description && (
                                          <div>
                                            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                              Description
                                            </div>
                                            <p className="text-sm text-foreground leading-relaxed bg-background rounded-lg border border-border p-3">
                                              {vuln.description}
                                            </p>
                                          </div>
                                        )}

                                        {/* Remediation */}
                                        {vuln.remediation && (
                                          <div>
                                            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                              <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                                              Recommended Remediation
                                            </div>
                                            <div className="text-sm text-green-700 dark:text-green-300 bg-green-500/10 border border-green-500/30 rounded-lg p-3 leading-relaxed">
                                              {vuln.remediation}
                                            </div>
                                          </div>
                                        )}

                                        {/* NVD link */}
                                        {vuln.cve_id && (
                                          <a
                                            href={`https://nvd.nist.gov/vuln/detail/${vuln.cve_id}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors"
                                          >
                                            <ExternalLink className="h-3 w-3" />
                                            View {vuln.cve_id} on NVD
                                          </a>
                                        )}
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </motion.div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  {/* ================================================
                    PORTS & SERVICES TAB
                  ================================================ */}
                  <TabsContent value="ports">
                    <div className="rounded-xl border border-border bg-card overflow-hidden">
                      {/* Host header */}
                      <div className="p-4 border-b border-border flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-primary" />
                          <span className="font-mono font-semibold text-foreground">{host.ip_address}</span>
                        </div>
                        {host.os && (
                          <span className="px-2 py-0.5 rounded text-xs bg-muted border border-border text-foreground">
                            {host.os}
                          </span>
                        )}
                        {host.os_cpe && (
                          <span className="px-2 py-0.5 rounded text-xs bg-muted border border-border text-muted-foreground font-mono">
                            {host.os_cpe}
                          </span>
                        )}
                        {host.latency_ms !== null && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Activity className="h-3 w-3" />
                            {host.latency_ms}ms
                          </span>
                        )}
                        <span className="ml-auto text-xs text-muted-foreground">
                          Business criticality:
                          <span className={`ml-1 font-bold ${
                            host.business_criticality >= 8
                              ? 'text-destructive'
                              : host.business_criticality >= 5
                              ? 'text-yellow-500'
                              : 'text-green-500'
                          }`}>
                            {host.business_criticality}/10
                          </span>
                        </span>
                      </div>

                      {/* Ports table */}
                      {host.ports.length === 0 ? (
                        <EmptyState message="No open ports detected" />
                      ) : (
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow className="border-border hover:bg-transparent">
                                <TableHead className="text-muted-foreground text-xs w-24">Port</TableHead>
                                <TableHead className="text-muted-foreground text-xs w-24">State</TableHead>
                                <TableHead className="text-muted-foreground text-xs">Service</TableHead>
                                <TableHead className="text-muted-foreground text-xs">Version</TableHead>
                                <TableHead className="text-muted-foreground text-xs w-24">Type</TableHead>
                                <TableHead className="text-muted-foreground text-xs">Vulnerabilities</TableHead>
                                <TableHead className="text-muted-foreground text-xs w-20">Banner</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {host.ports.map(port => (
                                <TableRow
                                  key={port.id}
                                  className={`border-border transition-colors ${
                                    port.has_critical ? 'hover:bg-destructive/5' : 'hover:bg-muted/40'
                                  }`}
                                >
                                  <TableCell className="font-mono text-sm font-medium text-foreground">
                                    {port.port_number}
                                    <span className="text-muted-foreground">/{port.protocol}</span>
                                  </TableCell>
                                  <TableCell>
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${
                                      port.state === 'open'
                                        ? 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30'
                                        : port.state === 'filtered'
                                        ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/30'
                                        : 'bg-muted text-muted-foreground border-border'
                                    }`}>
                                      {port.state === 'open'
                                        ? <Unlock className="h-2.5 w-2.5" />
                                        : <Lock className="h-2.5 w-2.5" />}
                                      {port.state}
                                    </span>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-sm text-foreground">{port.service || '—'}</span>
                                      {port.is_potentially_risky && (
                                        <span className="px-1 py-0.5 rounded text-xs bg-destructive/10 text-destructive border border-destructive/30">
                                          Risky
                                        </span>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell className="max-w-[220px]">
                                    <span
                                      className="text-xs text-muted-foreground font-mono truncate block"
                                      title={port.version ?? undefined}
                                    >
                                      {port.version || <span className="opacity-30">—</span>}
                                    </span>
                                  </TableCell>
                                  <TableCell>
                                    {port.is_web_service ? (
                                      <span className="px-1.5 py-0.5 rounded text-xs bg-primary/10 text-primary border border-primary/30">
                                        Web
                                      </span>
                                    ) : (
                                      <span className="text-muted-foreground/40 text-xs">—</span>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    {port.vuln_count > 0 ? (
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        {port.has_critical && (
                                          <span className="w-2 h-2 rounded-full bg-destructive inline-block" title="Critical" />
                                        )}
                                        {port.has_exploit && (
                                          <Bug className="h-3.5 w-3.5 text-purple-500" title="Exploit available" />
                                        )}
                                        <span className="text-xs text-foreground">
                                          {port.vuln_count} vuln{port.vuln_count > 1 ? 's' : ''}
                                        </span>
                                      </div>
                                    ) : (
                                      <span className="text-muted-foreground/40 text-xs">—</span>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    {port.banner ? (
                                      <span
                                        className="text-xs text-muted-foreground font-mono truncate block max-w-[120px]"
                                        title={port.banner}
                                      >
                                        {port.banner}
                                      </span>
                                    ) : (
                                      <span className="text-muted-foreground/40 text-xs">—</span>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  {/* ================================================
                    DETAILS TAB
                  ================================================ */}
                  <TabsContent value="details">
                    <div className="space-y-4">
                      {/* Metadata */}
                      <div className="rounded-xl border border-border bg-card p-5">
                        <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                          <Fingerprint className="h-4 w-4 text-muted-foreground" />
                          Scan Metadata
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {[
                            { label: 'Scan ID', value: `#${scanData.scan_id}` },
                            { label: 'Name', value: scanData.name || '—' },
                            { label: 'Target', value: scanData.target, mono: true },
                            { label: 'Scan Type', value: scanData.scan_type },
                            { label: 'Status', value: scanData.status },
                            { label: 'Started', value: formatDate(scanData.begin_at) },
                            { label: 'Completed', value: formatDate(scanData.end_at) },
                            { label: 'Duration', value: duration ?? 'N/A' },
                            { label: 'Target IP', value: host.ip_address, mono: true },
                            { label: 'Detected OS', value: host.os ?? 'Unknown' },
                            { label: 'OS CPE', value: host.os_cpe ?? '—', mono: true },
                            { label: 'Business Criticality', value: `${host.business_criticality} / 10` },
                          ].map(({ label, value, mono }) => (
                            <div key={label} className="rounded-lg bg-muted/50 border border-border p-3">
                              <div className="text-xs text-muted-foreground mb-1">{label}</div>
                              <div className={`text-sm text-foreground break-all ${mono ? 'font-mono' : 'font-medium'}`}>
                                {value}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Severity distribution */}
                      <div className="rounded-xl border border-border bg-card p-5">
                        <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                          <BarChart3 className="h-4 w-4 text-muted-foreground" />
                          Severity Distribution
                        </h3>
                        <div className="space-y-2">
                          {(['critical', 'high', 'medium', 'low', 'info'] as const).map(sev => {
                            const cfg = getSeverityCfg(sev);
                            const count = dist[sev];
                            const total = host.total_vulns;
                            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                            return (
                              <div key={sev} className="flex items-center gap-3">
                                <span className={`text-xs w-16 ${cfg.text}`}>{cfg.label}</span>
                                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${pct}%` }}
                                    transition={{ duration: 0.6, delay: 0.1 }}
                                    className={`h-full rounded-full ${cfg.barColor}`}
                                  />
                                </div>
                                <span className="text-xs font-mono text-muted-foreground w-12 text-right">
                                  {count} <span className="opacity-50">({pct}%)</span>
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Raw output */}
                      <div className="rounded-xl border border-border bg-card overflow-hidden">
                        <button
                          onClick={() => setShowRaw(v => !v)}
                          className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-muted/40 transition-colors"
                        >
                          <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                            <Terminal className="h-4 w-4 text-muted-foreground" />
                            Raw Nmap Output
                          </span>
                          {showRaw
                            ? <EyeOff className="h-4 w-4 text-muted-foreground" />
                            : <Eye className="h-4 w-4 text-muted-foreground" />}
                        </button>

                        <AnimatePresence>
                          {showRaw && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.25 }}
                              className="overflow-hidden border-t border-border"
                            >
                              {scanData.raw_output ? (
                                <pre className="p-4 overflow-x-auto text-xs font-mono text-primary bg-muted leading-relaxed max-h-[600px] overflow-y-auto">
                                  {scanData.raw_output}
                                </pre>
                              ) : (
                                <div className="p-6 text-center text-muted-foreground text-sm">
                                  Raw output not available.
                                  <br />
                                  <span className="text-xs opacity-70">
                                    Add <code className="font-mono">?debug=1</code> to the URL to enable it.
                                  </span>
                                </div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </>
            )}
          </div>
        </div>

        <Chat
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          messages={chatMessages}
          onSendMessage={sendChatMessage}
          isLoading={isChatLoading}
          initialWidth={CHAT_WIDTH}
          connected={true}
        />
      </div>
    </PlatformLayout>
  );
}