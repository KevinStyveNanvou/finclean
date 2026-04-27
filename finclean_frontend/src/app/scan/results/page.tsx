'use client';
import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, MoreVertical,Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { PlatformLayout } from '@/components/platform-layout';

interface Scan {
  scan_id: number;
  target: string;
  status: string;
  begin_at: string;
}

export default function UserScansPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedScans, setSelectedScans] = useState<number[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const loadScans = async () => {
    try {
      const res = await api.get('scans/status/');
      setScans(res.data);
    } catch (error: any) {
      toast({
        title: 'Failed to load scans',
        description: error.response?.data?.error || 'Unauthorized',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadScans();
  }, []);

  const toggleSelection = (scanId: number) => {
    setSelectedScans(prev =>
      prev.includes(scanId)
        ? prev.filter(id => id !== scanId)
        : [...prev, scanId]
    );
  };

  const handleLongPressStart = (scanId: number) => {
    timerRef.current = setTimeout(() => {
      toggleSelection(scanId);
    }, 600); // 600ms long press
  };

  const handleLongPressEnd = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const handleDelete = async () => {
    try {
      const res = await api.post('scans/delete/', {
        liste_scans_id: selectedScans
      });

      toast({
        title: 'Scans deleted successfully'
      });

      setSelectedScans([]);
      setScans(res.data); // backend retourne nouvelle liste
    } catch (error: any) {
      toast({
        title: 'Delete failed',
        description: error.response?.data?.error || 'Error deleting scans',
        variant: 'destructive'
      });
    }
  };

  return (
    <PlatformLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Your Scans</h1>

          {selectedScans.length > 0 && (
            <button
              onClick={handleDelete}
              className="btn btn-warning/10 text-error px-4 py-2 rounded-lg hover:opacity-90"
            >
              <Trash2 />
              Delete ({selectedScans.length})
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : scans.length === 0 ? (
          <p className="text-center text-muted-foreground">No scans found</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {scans.map(scan => {
              const isSelected = selectedScans.includes(scan.scan_id);

              return (
                <Card
                  key={scan.scan_id}
                  className={`cursor-pointer hover:shadow-lg relative ${
                    isSelected ? 'ring-2 ring-primary' : ''
                  }`}
                  onMouseDown={() => handleLongPressStart(scan.scan_id)}
                  onMouseUp={handleLongPressEnd}
                  onMouseLeave={handleLongPressEnd}
                  onClick={() => {
                    if (selectedScans.length > 0) {
                      toggleSelection(scan.scan_id);
                    } else {
                      router.push(`/scan/results/${scan.scan_id}`);
                    }
                  }}
                >
                  {/* Trois points */}
                  <div className="absolute top-3 right-3 text-muted-foreground">
                    <MoreVertical className="h-4 w-4" />
                  </div>

                  <CardHeader>
                    <CardTitle>Scan #{scan.name}</CardTitle>
                    <CardDescription>
                      Target: {scan.target}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="flex items-center justify-between">
                    <Badge variant={scan.status === 'completed' ? 'default' : 'destructive'} className='btn btn-accent text-amber-50'>
                      {scan.status.toUpperCase()}
                    </Badge>

                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-primary" />
                      <span className="text-sm">
                        {new Date(scan.begin_at).toLocaleDateString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </PlatformLayout>
  );
}