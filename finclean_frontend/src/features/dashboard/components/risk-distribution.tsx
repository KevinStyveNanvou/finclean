'use client';

import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RiskDistribution as RiskDistributionType } from '@/lib/types';

interface RiskDistributionProps {
  data: RiskDistributionType;
  loading?: boolean;
}

export function RiskDistribution({ data, loading }: RiskDistributionProps) {
  const total = data.critical + data.high + data.medium + data.low;

  const risks = [
    { label: 'Critical', count: data.critical, color: 'bg-red-500', textColor: 'text-red-500' },
    { label: 'High', count: data.high, color: 'bg-orange-500', textColor: 'text-orange-500' },
    { label: 'Medium', count: data.medium, color: 'bg-yellow-500', textColor: 'text-yellow-500' },
    { label: 'Low', count: data.low, color: 'bg-blue-500', textColor: 'text-blue-500' }
  ];

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Risk Distribution
          </CardTitle>
          <CardDescription>Vulnerabilities by severity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="h-4 bg-muted rounded w-20" />
                <div className="h-4 bg-muted rounded w-12" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Risk Distribution
        </CardTitle>
        <CardDescription>Vulnerabilities by severity</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex h-4 w-full overflow-hidden rounded-full bg-muted">
          {risks.map((risk) => {
            const percentage = total > 0 ? (risk.count / total) * 100 : 0;
            return percentage > 0 ? (
              <motion.div
                key={risk.label}
                className={risk.color}
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            ) : null;
          })}
        </div>

        <div className="space-y-3">
          {risks.map((risk, index) => (
            <motion.div
              key={risk.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <div className={`h-3 w-3 rounded-full ${risk.color}`} />
                <span className="text-sm font-medium">{risk.label}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-sm font-semibold ${risk.textColor}`}>
                  {risk.count}
                </span>
                <span className="text-xs text-muted-foreground w-12 text-right">
                  {total > 0 ? Math.round((risk.count / total) * 100) : 0}%
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
