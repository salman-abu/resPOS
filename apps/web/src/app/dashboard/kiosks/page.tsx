'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  getOwnerKiosks,
  createKiosk,
  updateKioskStatus,
} from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/Toast';
import {
  Monitor,
  Plus,
  Pause,
  Play,
  Settings,
  Activity,
  ShoppingCart,
  AlertCircle,
} from 'lucide-react';

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-success-light text-success-default',
  PAUSED: 'bg-warning-light text-warning-default',
  OFFLINE: 'bg-surface-sunken text-content-secondary',
  MAINTENANCE: 'bg-danger-light text-danger-default',
};

export default function KiosksPage() {
  const router = useRouter();
  const { error: toastError, success: toastSuccess } = useToast();
  const [kiosks, setKiosks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', adminPin: '0000' });

  useEffect(() => {
    loadKiosks();
  }, []);

  async function loadKiosks() {
    setLoading(true);
    try {
      const data = await getOwnerKiosks();
      setKiosks(data);
    } catch (err: any) {
      toastError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!formData.name) {
      toastError('Kiosk name is required');
      return;
    }
    try {
      await createKiosk({
        name: formData.name,
        adminPin: formData.adminPin,
      });
      toastSuccess('Kiosk created');
      setShowForm(false);
      setFormData({ name: '', adminPin: '0000' });
      loadKiosks();
    } catch (err: any) {
      toastError(err.message);
    }
  }

  async function handleToggleStatus(kioskId: string, currentStatus: string) {
    const newStatus = currentStatus === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    try {
      await updateKioskStatus(kioskId, newStatus);
      toastSuccess(`Kiosk ${newStatus.toLowerCase()}`);
      loadKiosks();
    } catch (err: any) {
      toastError(err.message);
    }
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold">Kiosk Terminals</h1>
            <p className="text-sm text-content-secondary">
              Self-service ordering stations
            </p>
          </div>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="w-4 h-4 mr-1.5" />
            {showForm ? 'Cancel' : 'Add Kiosk'}
          </Button>
        </div>

        {showForm && (
          <div className="bg-surface-card rounded-2xl border border-border p-5 mb-6 shadow-sm">
            <h2 className="font-semibold mb-4">New Kiosk Terminal</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Name</label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g. Counter 1, Entrance"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Admin PIN (4 digits)
                </label>
                <Input
                  type="password"
                  maxLength={4}
                  value={formData.adminPin}
                  onChange={(e) =>
                    setFormData({ ...formData, adminPin: e.target.value })
                  }
                  placeholder="0000"
                />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button onClick={handleCreate}>Create Kiosk</Button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-full text-center py-12 text-content-muted">
              Loading...
            </div>
          ) : kiosks.length === 0 ? (
            <div className="col-span-full text-center py-12 bg-surface-card rounded-2xl border border-dashed border-border">
              <Monitor className="w-12 h-12 text-content-muted mx-auto mb-4" />
              <p className="text-content-secondary font-medium">No kiosk terminals yet</p>
              <p className="text-sm text-content-muted mt-1">
                Add your first kiosk to start self-service ordering
              </p>
            </div>
          ) : (
            kiosks.map((kiosk) => (
              <div
                key={kiosk.id}
                className="bg-surface-card rounded-2xl border border-border p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        kiosk.isOnline ? 'bg-success-light' : 'bg-surface-sunken'
                      }`}
                    >
                      <Monitor
                        className={`w-5 h-5 ${
                          kiosk.isOnline ? 'text-success-default' : 'text-content-muted'
                        }`}
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold text-content-primary">
                        {kiosk.name}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                            statusColors[kiosk.status]
                          }`}
                        >
                          <Activity className="w-3 h-3" />
                          {kiosk.status}
                        </span>
                        {kiosk.isOnline ? (
                          <span className="text-xs text-success-default font-medium">
                            Online
                          </span>
                        ) : (
                          <span className="text-xs text-content-muted">Offline</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-surface-sunken rounded-xl p-3">
                    <div className="flex items-center gap-1.5 text-content-secondary text-xs mb-1">
                      <ShoppingCart className="w-3.5 h-3.5" />
                      Today&apos;s Orders
                    </div>
                    <div className="text-xl font-bold text-content-primary">
                      {kiosk.todayOrderCount || 0}
                    </div>
                  </div>
                  <div className="bg-surface-sunken rounded-xl p-3">
                    <div className="flex items-center gap-1.5 text-content-secondary text-xs mb-1">
                      <Settings className="w-3.5 h-3.5" />
                      Zone
                    </div>
                    <div className="text-sm font-medium text-content-primary truncate">
                      {kiosk.zone?.name || 'Unassigned'}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() =>
                      handleToggleStatus(kiosk.id, kiosk.status)
                    }
                  >
                    {kiosk.status === 'ACTIVE' ? (
                      <>
                        <Pause className="w-3.5 h-3.5 mr-1" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 mr-1" />
                        Activate
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      router.push(`/dashboard/kiosks/${kiosk.id}`)
                    }
                  >
                    <Settings className="w-3.5 h-3.5" />
                  </Button>
                </div>

                <div className="mt-3 pt-3 border-t border-border text-xs text-content-muted flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Kiosk URL: /kiosk/{kiosk.id}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
