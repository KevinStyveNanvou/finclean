'use client';

import { useState, useEffect, useCallback } from 'react';
import { PlatformLayout } from '@/components/platform-layout';
import api from '@/lib/api';
import {
  Clock,
  Plus,
  Trash2,
  Edit2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Calendar,
  Target,
  Zap,
  ChevronDown,
  X,
  Save,
  AlertTriangle,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PermanentScan {
  id: number;
  name: string;
  target: string;
  scan_type: string;
  frequency_hours: number;
  is_active: boolean;
  last_run: string | null;
  next_run: string | null;
  created_at: string;
}

type ScanType = 'full' | 'quick' | 'version';

interface FormState {
  name: string;
  target: string;
  scan_type: ScanType;
  frequency_hours: number;
}

const DEFAULT_FORM: FormState = {
  name: '',
  target: '',
  scan_type: 'full',
  frequency_hours: 24,
};

const SCAN_TYPE_LABELS: Record<ScanType, string> = {
  full: 'Full Scan',
  quick: 'Quick Scan',
  version: 'Version Detection',
};

// Use semantic / theme-aware color classes
// primary → full scan (blue-ish)
// success / green → quick scan
// warning / orange → version detection
const SCAN_TYPE_COLORS: Record<ScanType, string> = {
  full: 'bg-primary/10 text-primary border-primary/30',
  quick: 'bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30',
  version: 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('en-US', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso));
}

function timeUntil(iso: string | null): string {
  if (!iso) return '—';
  const diff = new Date(iso).getTime() - Date.now();
  if (diff < 0) return 'Pending';
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  if (h > 0) return `in ${h}h ${m}m`;
  return `in ${m}m`;
}

// ─── Form Modal ───────────────────────────────────────────────────────────────

interface ScanFormModalProps {
  open: boolean;
  editScan?: PermanentScan | null;
  onClose: () => void;
  onSaved: () => void;
}

function ScanFormModal({ open, editScan, onClose, onSaved }: ScanFormModalProps) {
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editScan) {
      setForm({
        name: editScan.name,
        target: editScan.target,
        scan_type: editScan.scan_type as ScanType,
        frequency_hours: editScan.frequency_hours,
      });
    } else {
      setForm(DEFAULT_FORM);
    }
    setError(null);
  }, [editScan, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (editScan) {
        await api.patch(`/scans/permanent/${editScan.id}/update/`, form);
      } else {
        await api.post('/scans/permanent/create/', form);
      }
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'An error occurred.');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-lg mx-4 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground tracking-wide">
            {editScan ? 'Edit Scan' : 'New Permanent Scan'}
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
              <AlertTriangle size={14} />
              {error}
            </div>
          )}

          {/* Scan name */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
              Scan Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Daily production server scan"
              required
              className="w-full bg-muted/40 border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/60 transition-colors"
            />
          </div>

          {/* Target */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
              Target (IP or domain)
            </label>
            <input
              type="text"
              value={form.target}
              onChange={e => setForm(f => ({ ...f, target: e.target.value }))}
              placeholder="192.168.1.0/24 or example.com"
              required
              className="w-full bg-muted/40 border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/60 transition-colors"
            />
          </div>

          {/* Type + Frequency */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
                Scan Type
              </label>
              <div className="relative">
                <select
                  value={form.scan_type}
                  onChange={e => setForm(f => ({ ...f, scan_type: e.target.value as ScanType }))}
                  className="w-full appearance-none bg-muted/40 border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/60 transition-colors"
                >
                  <option value="full">Full Scan</option>
                  <option value="version">Version Detection</option>
                  <option value="quick">Quick Scan</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
                Frequency (h)
              </label>
              <input
                type="number"
                value={form.frequency_hours}
                onChange={e => setForm(f => ({ ...f, frequency_hours: Math.max(1, parseInt(e.target.value) || 1) }))}
                min={1}
                required
                className="w-full bg-muted/40 border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/60 transition-colors"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground border border-border hover:border-foreground/30 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground rounded-lg transition-colors"
            >
              {saving ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <Save size={14} />
              )}
              {saving ? 'Saving…' : editScan ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Delete Confirmation ──────────────────────────────────────────────────────

interface DeleteConfirmProps {
  scan: PermanentScan | null;
  onClose: () => void;
  onConfirm: () => void;
  deleting: boolean;
}

function DeleteConfirm({ scan, onClose, onConfirm, deleting }: DeleteConfirmProps) {
  if (!scan) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm mx-4 bg-card border border-destructive/20 rounded-2xl shadow-2xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle size={18} className="text-destructive" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Delete this scan?</p>
            <p className="text-xs text-muted-foreground mt-0.5">This action cannot be undone.</p>
          </div>
        </div>
        <div className="bg-muted/50 border border-border rounded-lg px-3 py-2">
          <p className="text-xs text-muted-foreground">Scan: <span className="text-foreground font-medium">{scan.name}</span></p>
          <p className="text-xs text-muted-foreground mt-0.5">Target: {scan.target}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium bg-destructive hover:bg-destructive/90 disabled:opacity-50 text-destructive-foreground rounded-lg transition-colors"
          >
            {deleting ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Scan Card ────────────────────────────────────────────────────────────────

interface ScanCardProps {
  scan: PermanentScan;
  onEdit: (s: PermanentScan) => void;
  onDelete: (s: PermanentScan) => void;
}

function ScanCard({ scan, onEdit, onDelete }: ScanCardProps) {
  const typeKey = scan.scan_type as ScanType;
  return (
    <div className="group relative bg-card hover:bg-accent/30 border border-border hover:border-foreground/20 rounded-xl p-5 transition-all duration-200">

      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`inline-flex items-center text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${SCAN_TYPE_COLORS[typeKey] ?? 'bg-muted text-muted-foreground border-border'}`}>
              {SCAN_TYPE_LABELS[typeKey] ?? scan.scan_type}
            </span>
            <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${
              scan.is_active
                ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                : 'bg-muted text-muted-foreground'
            }`}>
              {scan.is_active
                ? <><CheckCircle2 size={9} /> Active</>
                : <><XCircle size={9} /> Inactive</>}
            </span>
          </div>
          <h3 className="text-sm font-semibold text-foreground truncate">{scan.name}</h3>
        </div>

        {/* Actions (visible on hover) */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(scan)}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Edit"
          >
            <Edit2 size={13} />
          </button>
          <button
            onClick={() => onDelete(scan)}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            title="Delete"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Target size={11} className="opacity-50 flex-shrink-0" />
          <span className="font-mono truncate">{scan.target}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Zap size={11} className="opacity-50 flex-shrink-0" />
          <span>Every <span className="text-foreground font-medium">{scan.frequency_hours}h</span></span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock size={11} className="opacity-50 flex-shrink-0" />
          <span>Last run: <span className="text-foreground/70">{formatDate(scan.last_run)}</span></span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar size={11} className="opacity-50 flex-shrink-0" />
          <span>
            Next: <span className="text-primary/80">{timeUntil(scan.next_run)}</span>
            <span className="opacity-50 ml-1">({formatDate(scan.next_run)})</span>
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

function PermanentScansContent() {
  const [scans, setScans] = useState<PermanentScan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editScan, setEditScan] = useState<PermanentScan | null>(null);

  const [deleteScan, setDeleteScan] = useState<PermanentScan | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadScans = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const res = await api.get('/scans/permanent/');
      setScans(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Unable to load scans.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadScans(); }, [loadScans]);

  const handleEdit = (scan: PermanentScan) => {
    setEditScan(scan);
    setModalOpen(true);
  };

  const handleNewScan = () => {
    setEditScan(null);
    setModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteScan) return;
    setDeleting(true);
    try {
      await api.delete(`/scans/permanent/${deleteScan.id}/delete/`);
      setDeleteScan(null);
      loadScans(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Deletion failed.');
      setDeleteScan(null);
    } finally {
      setDeleting(false);
    }
  };

  const activeCount = scans.filter(s => s.is_active).length;
  const nextScan = scans
    .filter(s => s.next_run)
    .sort((a, b) => new Date(a.next_run!).getTime() - new Date(b.next_run!).getTime())[0];

  return (
    <>
      <ScanFormModal
        open={modalOpen}
        editScan={editScan}
        onClose={() => setModalOpen(false)}
        onSaved={() => loadScans(true)}
      />
      <DeleteConfirm
        scan={deleteScan}
        onClose={() => setDeleteScan(null)}
        onConfirm={handleDelete}
        deleting={deleting}
      />

      <div className="p-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">Permanent Scans</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Schedule recurring scans on your critical assets
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => loadScans(true)}
              disabled={refreshing}
              className="w-9 h-9 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
              title="Refresh"
            >
              <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={handleNewScan}
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium rounded-lg transition-colors"
            >
              <Plus size={15} />
              New Scan
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total', value: scans.length, icon: <Zap size={14} />, color: 'text-foreground' },
            { label: 'Active', value: activeCount, icon: <CheckCircle2 size={14} />, color: 'text-green-600 dark:text-green-400' },
            {
              label: 'Next scan',
              value: nextScan ? timeUntil(nextScan.next_run) : '—',
              icon: <Clock size={14} />,
              color: 'text-primary',
            },
          ].map(stat => (
            <div key={stat.label} className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3">
              <div className={`${stat.color} opacity-60`}>{stat.icon}</div>
              <div>
                <p className={`text-base font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-[11px] text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Global error */}
        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3">
            <AlertTriangle size={15} />
            {error}
            <button onClick={() => setError(null)} className="ml-auto text-destructive/60 hover:text-destructive">
              <X size={14} />
            </button>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-5 animate-pulse space-y-3">
                <div className="h-3 bg-muted rounded w-1/3" />
                <div className="h-4 bg-muted rounded w-2/3" />
                <div className="space-y-2 pt-2">
                  <div className="h-3 bg-muted/50 rounded w-full" />
                  <div className="h-3 bg-muted/50 rounded w-4/5" />
                  <div className="h-3 bg-muted/50 rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : scans.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-2xl bg-muted border border-border flex items-center justify-center mb-4">
              <Clock size={22} className="text-muted-foreground/40" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">No permanent scans</p>
            <p className="text-xs text-muted-foreground/50 mt-1 mb-5">Schedule your first recurring scan</p>
            <button
              onClick={handleNewScan}
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium rounded-lg transition-colors"
            >
              <Plus size={14} />
              Create a scan
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {scans.map(scan => (
              <ScanCard
                key={scan.id}
                scan={scan}
                onEdit={handleEdit}
                onDelete={setDeleteScan}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default function PermanentScansPage() {
  return (
    <PlatformLayout>
      <PermanentScansContent />
    </PlatformLayout>
  );
}