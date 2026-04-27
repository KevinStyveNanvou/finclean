export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface Vulnerability {
  id: string;
  title: string;
  description: string;
  severity: SeverityLevel;
  cvss: number;
  businessRisk: number;
  exploitability: number;
  asset: string;
  assetType: 'server' | 'database' | 'application' | 'network' | 'endpoint';
  discoveredAt: string;
  status: 'open' | 'in_progress' | 'resolved' | 'accepted';
  cve?: string;
  affectedComponent: string;
  recommendation: string;
}

export interface Scan {
  id: string;
  name: string;
  target: string;
  type: 'quick' | 'deep' | 'compliance';
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  startedAt: string;
  completedAt?: string;
  vulnerabilitiesFound: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
}

export interface ExploitationLog {
  id: string;
  vulnerabilityId: string;
  vulnerabilityTitle: string;
  target: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  startedAt: string;
  completedAt?: string;
  result?: string;
  proof?: string;
  riskScore: number;
}

export interface SystemMetric {
  name: string;
  value: string | number;
  change: number;
  status: 'good' | 'warning' | 'critical';
}

export interface RiskDistribution {
  critical: number;
  high: number;
  medium: number;
  low: number;
}
