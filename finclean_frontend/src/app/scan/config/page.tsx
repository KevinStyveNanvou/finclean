'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Target, ArrowRight, Info, Loader2 } from 'lucide-react';
import { PlatformLayout } from '@/components/platform-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';

export default function ScanConfigPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [scanId, setScanId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    target: '',
    name: '',
    description: '',
    scanType: 'quick',
    speed: 3
  });

  /* -------------------------
     LANCEMENT DU SCAN CLASSIQUE
  ------------------------- */
  // Dans n'importe quel composant Next.js
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await api.post('/scans/create/', {
        target: formData.target,
        name: formData.name,
        description: formData.description,
        scan_type: formData.scanType,
        speed: `-T${formData.speed}` // Convertit le nombre en format T1, T2, etc.
      });

      setScanId(res.data.scan_id);

      toast({
        title: 'Scan started',
        description: `Target: ${formData.target}`,
      });

    } catch (error: any) {
      toast({
        title: 'Failed to start scan',
        description: error.response?.data?.error || 'Unauthorized',
        variant: 'destructive'
      });
      setLoading(false);
    }
  };

  /* -------------------------
     SCAN DE DECOUVERTE
  ------------------------- */
  const handleDiscoveryScan = async () => {
    setLoading(true);

    try {
      const res = await api.get('/scans/decouverte/');

      const id = res.data.scan_id;

      setScanId(id);

      toast({
        title: 'Discovery scan started',
        description: 'Scanning network for reachable hosts...',
      });

      setLoading(false);

    } catch (error: any) {
      toast({
        title: 'Discovery scan failed',
        description: error.response?.data?.error || 'Network error',
        variant: 'destructive'
      });

      setLoading(false);
    }
  };

  /* -------------------------
     POLLING STATUS
  ------------------------- */

  useEffect(() => {
    if (!scanId) return;

    const interval = setInterval(async () => {
      try {
        const res = await api.get(`/scans/status/${scanId}/`);

        const status = await res.data.status;

        if (status === 'completed') {
          clearInterval(interval);
          router.replace(`/scan/results/${scanId}`);
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [scanId, router]);

  /* ------------------------- */

  return (
    <PlatformLayout>
      <div className="max-w-4xl space-y-8 items-center justify-center">

        <div>
          <h1 className="text-3xl font-bold">Configure Scan</h1>
          <p className="text-base-content/70">
            Set up a new vulnerability scan
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 25, x: 100 }}
          animate={{ opacity: 1, y: 0, x: 50 }}
          transition={{ duration: 0.4 }}
          className='items-center justify-center'
        >
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-semibold">Scan actions</h2>
              <p className="text-base-content/70">
                Start a discovery scan or configure a vulnerability scan below.
              </p>
            </div>

            <Button
              type="button"
              className="btn btn-secondary"
              onClick={handleDiscoveryScan}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="animate-spin h-5 w-5" />
              ) : (
                <>
                  Discovery Scan
                  <Info className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
          <Card className="bg-base-100/20 border border-base-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Scan Configuration
              </CardTitle>
              <CardDescription>
                Define target, name, description and scan mode
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-8">

                {/* TARGET */}
                <div className="space-y-2">
                  <Label htmlFor="target">Target</Label>
                  <Input
                    id="target"
                    placeholder="192.168.1.0/24 or example.com"
                    value={formData.target}
                    onChange={(e) =>
                      setFormData(prev => ({ ...prev, target: e.target.value }))
                    }
                    required
                  />
                </div>

                {/* NAME */}
                <div className="space-y-2">
                  <Label htmlFor="name">Scan Name</Label>
                  <Input
                    id="name"
                    placeholder="Descriptive scan name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData(prev => ({ ...prev, name: e.target.value }))
                    }
                    required
                  />
                </div>

                {/* DESCRIPTION */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <textarea
                    id="description"
                    placeholder="Optional description of the scan. You can write multiple lines."
                    value={formData.description}
                    onChange={(e) =>
                      setFormData(prev => ({ ...prev, description: e.target.value }))
                    }
                    className="w-full rounded-lg border border-base-300 bg-base-100 p-2 text-base-content resize-y min-h-[100px]"
                  />
                </div>

                {/* SCAN MODE CARDS */}
                <div className="space-y-4">
                  <Label>Scan Mode</Label>

                  <div className="grid md:grid-cols-3 gap-4">
                    {[
                      { value: 'quick', title: 'Quick Scan', desc: 'Top common ports - fast' },
                      { value: 'service', title: 'Service Detection', desc: 'Detect versions (-sV)' },
                      { value: 'full', title: 'Full Scan', desc: 'All 65535 ports' }
                    ].map(mode => (
                      <div
                        key={mode.value}
                        onClick={() =>
                          setFormData(prev => ({ ...prev, scanType: mode.value }))
                        }
                        className={`
                          cursor-pointer rounded-xl border p-4 transition-all
                          ${formData.scanType === mode.value
                            ? 'border-primary bg-primary/10'
                            : 'border-base-300 bg-base-100 hover:border-secondary'}
                        `}
                      >
                        <h3 className="font-semibold">{mode.title}</h3>
                        <p className="text-sm text-base-content/60">{mode.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* RISK SLIDER */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Scanning Speed</Label>
                    <span className="text-sm font-semibold text-secondary">
                      {formData.speed === 1 && 'T1 (Slow)'}
                      {formData.speed === 2 && 'T2 (Medium)'}
                      {formData.speed === 3 && 'T3 (Fast)'}
                      {formData.speed === 4 && 'T4 (Very Fast)'}
                      {formData.speed === 5 && 'T5 (Instant)'}
                    </span>
                  </div>

                  <Slider
                    value={[formData.speed]}
                    onValueChange={(value) =>
                      setFormData(prev => ({ ...prev, speed: value[0] }))
                    }
                    min={1}
                    max={5}
                    step={1}
                  />
                </div>

                {/* BUTTONS */}
                <div className="flex bg-secondary gap-4 pt-4">

                  <Button
                    type="submit"
                    className="flex-1 btn text-amber-50"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="animate-spin h-5 w-5" />
                    ) : (
                      <>
                        Start Scan
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>

                  <Button
                    type="button"
                    className="btn btn-secondary flex-1"
                    onClick={() => router.push('/scan/config')}
                  >
                    Cancel
                  </Button>

                </div>

              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </PlatformLayout>
  );
}