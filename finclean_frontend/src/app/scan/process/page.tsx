'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, CheckCircle2, Loader2 } from 'lucide-react';
import { PlatformLayout } from '@/components/platform-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

const scanPhases = [
  { name: 'Initializing', message: 'Setting up scan environment...' },
  { name: 'Port Scanning', message: 'Discovering open ports and services...' },
  { name: 'Service Detection', message: 'Identifying running services and versions...' },
  { name: 'Vulnerability Analysis', message: 'Checking for known vulnerabilities...' },
  { name: 'Risk Assessment', message: 'Calculating business impact scores...' },
  { name: 'Finalizing', message: 'Generating scan report...' }
];

const mockLogs = [
  '[00:00] Scan initiated for target: api.finclean.com',
  '[00:01] Port scan started (1-65535)',
  '[00:03] Found 8 open ports',
  '[00:05] Port 22: SSH (OpenSSH 8.2)',
  '[00:05] Port 80: HTTP (nginx 1.18)',
  '[00:06] Port 443: HTTPS (nginx 1.18)',
  '[00:08] Checking CVE database...',
  '[00:12] Found 3 potential vulnerabilities',
  '[00:14] Analyzing CVE-2024-12345 (SQL Injection)',
  '[00:16] CVSS Score: 9.8 (Critical)',
  '[00:18] Business Risk: 95/100',
  '[00:20] Analyzing CVE-2024-12346 (XSS)',
  '[00:22] CVSS Score: 7.5 (High)',
  '[00:24] Business Risk: 72/100',
  '[00:26] Scan completed successfully'
];

export default function ScanProcessPage() {
  const router = useRouter();
  const [progress, setProgress] = useState(0);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setCompleted(true);
          return 100;
        }
        return Math.min(prev + 2, 100);
      });
    }, 200);

    const phaseInterval = setInterval(() => {
      setCurrentPhase((prev) => {
        if (prev >= scanPhases.length - 1) {
          clearInterval(phaseInterval);
          return prev;
        }
        return prev + 1;
      });
    }, 3000);

    let logIndex = 0;
    const logInterval = setInterval(() => {
      if (logIndex < mockLogs.length) {
        setLogs((prev) => [...prev, mockLogs[logIndex]]);
        logIndex++;
      } else {
        clearInterval(logInterval);
      }
    }, 1200);

    return () => {
      clearInterval(progressInterval);
      clearInterval(phaseInterval);
      clearInterval(logInterval);
    };
  }, []);

  const handleViewResults = () => {
    router.push('/scan/results');
  };

  return (
    <PlatformLayout>
      <div className="max-w-4xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Scan in Progress</h1>
          <p className="text-muted-foreground">
            Real-time vulnerability detection
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {completed ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                ) : (
                  <Loader2 className="h-5 w-5 animate-spin text-emerald-500" />
                )}
                {completed ? 'Scan Completed' : 'Scanning'}
              </CardTitle>
              <CardDescription>
                Target: api.finclean.com
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Progress</span>
                  <span className="text-emerald-500 font-semibold">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              <div className="space-y-3">
                {scanPhases.map((phase, index) => (
                  <motion.div
                    key={phase.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className={`flex items-start gap-3 p-3 rounded-lg ${
                      index === currentPhase
                        ? 'bg-emerald-500/10 border border-emerald-500/20'
                        : index < currentPhase
                        ? 'bg-muted/50'
                        : 'opacity-50'
                    }`}
                  >
                    <div className="mt-0.5">
                      {index < currentPhase ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      ) : index === currentPhase ? (
                        <Loader2 className="h-5 w-5 animate-spin text-emerald-500" />
                      ) : (
                        <Activity className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">{phase.name}</p>
                      <p className="text-xs text-muted-foreground">{phase.message}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {completed && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="pt-4"
                >
                  <Button onClick={handleViewResults} className="w-full">
                    View Scan Results
                  </Button>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Live Scan Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-black/50 rounded-lg p-4 h-80 overflow-y-auto font-mono text-xs space-y-1">
                <AnimatePresence mode="popLayout">
                  {logs.map((log, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="text-emerald-400"
                    >
                      {log}
                    </motion.div>
                  ))}
                </AnimatePresence>
                {!completed && (
                  <motion.div
                    animate={{ opacity: [1, 0] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                    className="text-emerald-500"
                  >
                    ▋
                  </motion.div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </PlatformLayout>
  );
}
