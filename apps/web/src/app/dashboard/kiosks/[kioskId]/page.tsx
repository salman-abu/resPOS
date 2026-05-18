'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getOwnerKiosks, updateKiosk, getKioskAnalytics } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/Toast';
import {
  ArrowLeft,
  Monitor,
  Save,
  BarChart3,
  Calendar,
} from 'lucide-react';

export default function KioskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { error: toastError, success: toastSuccess } = useToast();
  const kioskId = params.kioskId as string;

  const [kiosk, setKiosk] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [analytics, setAnalytics] = useState<any>(null);
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    loadKiosk();
  }, [kioskId]);

  useEffect(() => {
    if (kiosk) loadAnalytics();
  }, [kiosk, dateRange.from, dateRange.to]);

  async function loadKiosk() {
    setLoading(true);
    try {
      const all = await getOwnerKiosks();
      const found = all.find((k: any) => k.id === kioskId);
      if (found) {
        setKiosk(found);
        setFormData({
          name: found.name,
          idleTimeoutSeconds: found.idle_timeout_seconds,
          allowTakeaway: found.allow_takeaway,
          allowDineIn: found.allow_dine_in,
          upsellEnabled: found.upsell_enabled,
          loyaltyLookupEnabled: found.loyalty_lookup_enabled,
          whatsappReceiptEnabled: found.whatsapp_receipt_enabled,
          showCalorieInfo: found.show_calorie_info,
          paymentModes: found.payment_modes || [],
          adminPin: '',
        });
      }
    } catch (err: any) {
      toastError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadAnalytics() {
    try {
      const data = await getKioskAnalytics(kioskId, dateRange.from, dateRange.to);
      setAnalytics(data);
    } catch {
      // Analytics may not exist yet
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      await updateKiosk(kioskId, {
        name: formData.name,
        idleTimeoutSeconds: Number(formData.idleTimeoutSeconds),
        allowTakeaway: formData.allowTakeaway,
        allowDineIn: formData.allowDineIn,
        upsellEnabled: formData.upsellEnabled,
        loyaltyLookupEnabled: formData.loyaltyLookupEnabled,
        whatsappReceiptEnabled: formData.whatsappReceiptEnabled,
        showCalorieInfo: formData.showCalorieInfo,
        paymentModes: formData.paymentModes,
        adminPin: formData.adminPin || undefined,
      });
      toastSuccess('Kiosk updated');
      loadKiosk();
    } catch (err: any) {
      toastError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const togglePaymentMode = (mode: string) => {
    const modes = new Set(formData.paymentModes || []);
    if (modes.has(mode)) modes.delete(mode);
    else modes.add(mode);
    setFormData({ ...formData, paymentModes: Array.from(modes) });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-content-muted">Loading...</div>
      </div>
    );
  }

  if (!kiosk) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-content-secondary">Kiosk not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/kiosks')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{kiosk.name}</h1>
            <p className="text-sm text-content-secondary">Kiosk Configuration</p>
          </div>
        </div>

        {/* Analytics Summary */}
        {analytics && (
          <div className="bg-surface-card rounded-2xl border border-border p-5 mb-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Analytics
              </h2>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-content-muted" />
                <Input
                  type="date"
                  className="w-36"
                  value={dateRange.from}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, from: e.target.value })
                  }
                />
                <span className="text-content-muted">to</span>
                <Input
                  type="date"
                  className="w-36"
                  value={dateRange.to}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, to: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-surface-sunken rounded-xl p-3">
                <div className="text-xs text-content-secondary">Total Sessions</div>
                <div className="text-2xl font-bold">
                  {analytics.summary?.totalSessions || 0}
                </div>
              </div>
              <div className="bg-surface-sunken rounded-xl p-3">
                <div className="text-xs text-content-secondary">Completed</div>
                <div className="text-2xl font-bold text-success-default">
                  {analytics.summary?.completedOrders || 0}
                </div>
              </div>
              <div className="bg-surface-sunken rounded-xl p-3">
                <div className="text-xs text-content-secondary">Abandoned</div>
                <div className="text-2xl font-bold text-danger-default">
                  {analytics.summary?.abandonedSessions || 0}
                </div>
              </div>
              <div className="bg-surface-sunken rounded-xl p-3">
                <div className="text-xs text-content-secondary">Completion Rate</div>
                <div className="text-2xl font-bold">
                  {analytics.summary?.completionRate || 0}%
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Configuration */}
        <div className="bg-surface-card rounded-2xl border border-border p-5 shadow-sm">
          <h2 className="font-semibold mb-4">Configuration</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="text-sm font-medium mb-1 block">Name</label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">
                Idle Timeout (seconds)
              </label>
              <Input
                type="number"
                value={formData.idleTimeoutSeconds}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    idleTimeoutSeconds: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">
                Admin PIN (leave blank to keep current)
              </label>
              <Input
                type="password"
                maxLength={4}
                value={formData.adminPin}
                onChange={(e) =>
                  setFormData({ ...formData, adminPin: e.target.value })
                }
                placeholder="****"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
            {[
              { key: 'allowDineIn', label: 'Allow Dine In' },
              { key: 'allowTakeaway', label: 'Allow Takeaway' },
              { key: 'upsellEnabled', label: 'Upsell Enabled' },
              { key: 'loyaltyLookupEnabled', label: 'Loyalty Lookup' },
              { key: 'whatsappReceiptEnabled', label: 'WhatsApp Receipt' },
              { key: 'showCalorieInfo', label: 'Show Calories' },
            ].map((opt) => (
              <label
                key={opt.key}
                className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-surface-sunken"
              >
                <input
                  type="checkbox"
                  checked={formData[opt.key]}
                  onChange={(e) =>
                    setFormData({ ...formData, [opt.key]: e.target.checked })
                  }
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium">{opt.label}</span>
              </label>
            ))}
          </div>

          <div className="mb-6">
            <label className="text-sm font-medium mb-2 block">
              Payment Modes
            </label>
            <div className="flex gap-3">
              {['UPI_QR', 'CARD_TAP', 'PAY_AT_COUNTER'].map((mode) => (
                <label
                  key={mode}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-colors ${
                    formData.paymentModes?.includes(mode)
                      ? 'bg-brand-light border-brand-200 text-brand-default'
                      : 'hover:bg-surface-sunken'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.paymentModes?.includes(mode)}
                    onChange={() => togglePaymentMode(mode)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium">
                    {mode.replace(/_/g, ' ')}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving}>
              <Save className="w-4 h-4 mr-1.5" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>

        {/* Kiosk URL */}
        <div className="bg-surface-card rounded-2xl border border-border p-5 mt-6 shadow-sm">
          <h2 className="font-semibold mb-3">Kiosk URL</h2>
          <p className="text-sm text-content-secondary mb-2">
            Open this URL on your kiosk device:
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-surface-sunken rounded-md px-3 py-2 text-sm font-mono">
              {typeof window !== 'undefined'
                ? `${window.location.origin}/kiosk/${kioskId}`
                : `/kiosk/${kioskId}`}
            </code>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(
                  `${window.location.origin}/kiosk/${kioskId}`,
                );
                toastSuccess('URL copied');
              }}
            >
              Copy
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
