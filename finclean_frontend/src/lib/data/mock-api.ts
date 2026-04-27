import { mockVulnerabilities } from './mock-vulnerabilities';
import { mockScans } from './mock-scans';
import { mockExploits } from './mock-exploits';
import { Vulnerability, Scan, ExploitationLog, RiskDistribution, SystemMetric } from '../types';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function fetchVulnerabilities(): Promise<Vulnerability[]> {
  await delay(500);
  return mockVulnerabilities;
}

export async function fetchScans(): Promise<Scan[]> {
  await delay(300);
  return mockScans;
}

export async function fetchExploitationLogs(): Promise<ExploitationLog[]> {
  await delay(400);
  return mockExploits;
}

export async function fetchRiskDistribution(): Promise<RiskDistribution> {
  await delay(200);
  const critical = mockVulnerabilities.filter(v => v.severity === 'critical').length;
  const high = mockVulnerabilities.filter(v => v.severity === 'high').length;
  const medium = mockVulnerabilities.filter(v => v.severity === 'medium').length;
  const low = mockVulnerabilities.filter(v => v.severity === 'low').length;

  return { critical, high, medium, low };
}

export async function fetchSecurityScore(): Promise<number> {
  await delay(300);
  const totalVulns = mockVulnerabilities.length;
  const criticalVulns = mockVulnerabilities.filter(v => v.severity === 'critical').length;
  const highVulns = mockVulnerabilities.filter(v => v.severity === 'high').length;

  const score = Math.max(0, 100 - (criticalVulns * 15) - (highVulns * 8) - (totalVulns * 2));
  return Math.round(score);
}

export async function fetchSystemMetrics(): Promise<SystemMetric[]> {
  await delay(250);
  return [
    { name: 'Assets Monitored', value: 247, change: 5, status: 'good' },
    { name: 'Active Scans', value: 3, change: 1, status: 'good' },
    { name: 'Open Vulnerabilities', value: 34, change: -8, status: 'warning' },
    { name: 'Critical Issues', value: 3, change: 0, status: 'critical' }
  ];
}

export async function simulateScan(target: string, type: string): Promise<Scan> {
  await delay(1000);

  const scan: Scan = {
    id: `scan-${Date.now()}`,
    name: `Scan: ${target}`,
    target,
    type: type as 'quick' | 'deep' | 'compliance',
    status: 'running',
    progress: 0,
    startedAt: new Date().toISOString(),
    vulnerabilitiesFound: 0,
    criticalCount: 0,
    highCount: 0,
    mediumCount: 0,
    lowCount: 0
  };

  return scan;
}

export async function simulateExploitation(vulnerabilityId: string): Promise<ExploitationLog> {
  await delay(800);

  const vulnerability = mockVulnerabilities.find(v => v.id === vulnerabilityId);

  if (!vulnerability) {
    throw new Error('Vulnerability not found');
  }

  const exploit: ExploitationLog = {
    id: `exploit-${Date.now()}`,
    vulnerabilityId,
    vulnerabilityTitle: vulnerability.title,
    target: vulnerability.asset,
    status: 'running',
    startedAt: new Date().toISOString(),
    riskScore: vulnerability.businessRisk
  };

  return exploit;
}
