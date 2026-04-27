'use client';

import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface SecurityScoreProps {
  score: number;
  loading?: boolean;
}

export function SecurityScore({ score, loading }: SecurityScoreProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreStatus = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Critical';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Posture
          </CardTitle>
          <CardDescription>Overall security score</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-32 w-32 rounded-full bg-muted mx-auto" />
            <div className="h-4 bg-muted rounded w-24 mx-auto" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Security Posture
        </CardTitle>
        <CardDescription>Overall security score</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        <div className="relative h-32 w-32">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-muted"
            />
            <motion.circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeLinecap="round"
              className={getScoreColor(score)}
              initial={{ strokeDasharray: '0 251.2' }}
              animate={{ strokeDasharray: `${(score / 100) * 251.2} 251.2` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span
              className={`text-3xl font-bold ${getScoreColor(score)}`}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              {score}
            </motion.span>
            <span className="text-xs text-muted-foreground">/ 100</span>
          </div>
        </div>
        <div className="mt-4 text-center">
          <p className={`text-lg font-semibold ${getScoreColor(score)}`}>
            {getScoreStatus(score)}
          </p>
          <p className="text-xs text-muted-foreground">
            Based on current vulnerabilities
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
