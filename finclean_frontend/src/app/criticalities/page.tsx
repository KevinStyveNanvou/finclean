'use client';

import { useState, useEffect } from 'react';
import { getDiscoveredHosts, updateCriticalities } from '@/lib/api';
import { PlatformLayout } from '@/components/platform-layout';

interface Host {
  id: number;
  ip_address: string;
  os: string | null;
  business_criticality: number;
  scan_name: string;
  scan_date: string;
}

function CriticalitiesContent() {
  const [hosts, setHosts] = useState<Host[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedHosts, setSelectedHosts] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    loadHosts();
  }, []);

  const loadHosts = async () => {
    try {
      const response = await getDiscoveredHosts();
      setHosts(response.data);
    } catch (error) {
      console.error('Error loading hosts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCriticalityChange = (ip: string, criticality: number) => {
    setSelectedHosts(prev => ({
      ...prev,
      [ip]: criticality
    }));
  };

  const handleUpdate = async () => {
    const criticalities = Object.entries(selectedHosts).map(([ip, criticality]) => ({
      ip,
      criticality
    }));

    if (criticalities.length === 0) {
      alert('Sélectionnez au moins un hôte à mettre à jour');
      return;
    }

    try {
      await updateCriticalities({ criticalities });
      alert('Criticités mises à jour avec succès');
      setSelectedHosts({});
      loadHosts();
    } catch (error) {
      console.error('Error updating criticalities:', error);
      alert('Erreur lors de la mise à jour');
    }
  };

  if (loading) return <div className="p-6">Chargement...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestion des Criticités Métier</h1>
        <button
          onClick={handleUpdate}
          className="text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Mettre à jour les sélections
        </button>
      </div>

      <div className="shadow rounded">
        <table className="w-full">
          <thead className="">
            <tr>
              <th className="px-4 py-2 text-left">IP</th>
              <th className="px-4 py-2 text-left">OS</th>
              <th className="px-4 py-2 text-left">Scan</th>
              <th className="px-4 py-2 text-left">Date Scan</th>
              <th className="px-4 py-2 text-left">Criticité Actuelle</th>
              <th className="px-4 py-2 text-left">Nouvelle Criticité</th>
            </tr>
          </thead>
          <tbody>
            {hosts.map((host) => (
              <tr key={host.id} className="border-t">
                <td className="px-4 py-2 font-mono">{host.ip_address}</td>
                <td className="px-4 py-2">{host.os || 'Inconnu'}</td>
                <td className="px-4 py-2">{host.scan_name}</td>
                <td className="px-4 py-2">{new Date(host.scan_date).toLocaleDateString()}</td>
                <td className="px-4 py-2">
                  <span className="px-2 py-1 rounded text-sm">
                    {host.business_criticality}/10
                  </span>
                </td>
                <td className="px-4 py-2">
                  <select
                    value={selectedHosts[host.ip_address] || host.business_criticality}
                    onChange={(e) => handleCriticalityChange(host.ip_address, parseInt(e.target.value))}
                    className="bg-transparent p-1 border rounded"
                  >
                    {Array.from({ length: 10 }, (_, i) => i + 1).map(num => (
                      <option
                        key={num}
                        value={num}
                        className={
                          num <= 3
                            ? "bg-neutral text-primary"
                            : num <= 7
                              ? "bg-neutral text-warning"
                              : "bg-neutral text-error"
                        }
                      >
                        {num}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hosts.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          Aucun hôte découvert. Effectuez un scan de découverte d'abord.
        </div>
      )}
    </div>
  );
}

export default function CriticalitiesPage() {
  return (
    <PlatformLayout>
      <CriticalitiesContent />
    </PlatformLayout>
  );
}