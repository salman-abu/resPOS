'use client';

import { useState, useEffect } from 'react';
import {
  Settings,
  Store,
  Bell,
  CreditCard,
  Wifi,
  Shield,
  Save,
  ChevronRight,
  Loader2,
  Globe,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { API_BASE } from '@/lib/api';
import { getAuthToken } from '@respos/utils';

type Tab =
  | 'restaurant'
  | 'storefront'
  | 'notifications'
  | 'payments'
  | 'integrations'
  | 'security';

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  {
    key: 'restaurant',
    label: 'Restaurant',
    icon: <Store className="h-4 w-4" />,
  },
  {
    key: 'storefront',
    label: 'Storefront',
    icon: <Globe className="h-4 w-4" />,
  },
  {
    key: 'notifications',
    label: 'Notifications',
    icon: <Bell className="h-4 w-4" />,
  },
  {
    key: 'payments',
    label: 'Payments',
    icon: <CreditCard className="h-4 w-4" />,
  },
  {
    key: 'integrations',
    label: 'Integrations',
    icon: <Wifi className="h-4 w-4" />,
  },
  { key: 'security', label: 'Security', icon: <Shield className="h-4 w-4" /> },
];

function Toggle({
  checked = false,
  onChange,
}: {
  checked?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-6 w-11 rounded-full transition-colors duration-200 flex-shrink-0',
        checked ? 'bg-brand-600' : 'bg-slate-200',
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200',
          checked && 'translate-x-5',
        )}
      />
    </button>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-content-primary border-b border-border pb-2">
        {title}
      </h3>
      {children}
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex-1">
        <p className="text-sm font-medium text-content-primary">{label}</p>
        {hint && <p className="text-xs text-content-muted mt-0.5">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>('restaurant');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // State
  const [restaurant, setRestaurant] = useState({
    name: '',
    gstin: '',
    address: '',
    phone: '',
  });
  const [notifications, setNotifications] = useState({
    email_daily_report: false,
    sms_on_void: true,
    low_stock: true,
    new_order: true,
  });
  const [payments, setPayments] = useState({
    accept_card: true,
    accept_upi: true,
    service_charge_pct: 0,
  });
  const [storefront, setStorefront] = useState({
    slug: 'spice-garden',
    is_published: true,
    restaurant_name: 'Spice Garden',
    description: 'Authentic Indian flavours — Order online, pay on delivery',
    delivery_fee: 29,
  });

  useEffect(() => {
    async function fetchSettings() {
      try {
        const token = getAuthToken();
        const res = await fetch(`${API_BASE}/tenant/settings`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.settings) {
            if (data.settings.restaurant)
              setRestaurant({
                ...data.settings.restaurant,
                name: data.name,
                address: data.address,
                gstin: data.gstin,
              });
            if (data.settings.notifications)
              setNotifications({
                ...notifications,
                ...data.settings.notifications,
              });
            if (data.settings.payments)
              setPayments({ ...payments, ...data.settings.payments });
          }

          if (data.slug) {
            try {
              const sfRes = await fetch(
                `${API_BASE}/storefront/${data.slug}/menu`,
              );
              if (sfRes.ok) {
                const sfData = await sfRes.json();
                setStorefront({
                  slug: sfData.slug ?? data.slug,
                  is_published:
                    sfData.is_published ?? sfData.isPublished ?? true,
                  restaurant_name:
                    sfData.restaurantName ??
                    sfData.restaurant_name ??
                    data.name,
                  description: sfData.description ?? '',
                  delivery_fee: sfData.deliveryZones?.[0]?.fee
                    ? Math.round(sfData.deliveryZones[0].fee / 100)
                    : 29,
                });
              }
            } catch (sfErr) {
              console.error('Failed to fetch storefront settings', sfErr);
            }
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = getAuthToken();
      const payload = { restaurant, notifications, payments };

      // Save tenant settings
      const res = await fetch(`${API_BASE}/tenant/settings`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      // Save storefront settings
      const sfPayload = {
        isPublished: storefront.is_published,
        restaurantName: storefront.restaurant_name,
        description: storefront.description,
        deliveryZones: [
          {
            label: 'Standard Delivery',
            fee: storefront.delivery_fee * 100,
            minOrder: 0,
          },
        ],
        theme: { primaryColor: '#10B981', accentColor: '#F97316' },
      };

      const sfRes = await fetch(
        `${API_BASE}/online/settings/${storefront.slug}?outletId=outlet-main`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(sfPayload),
        },
      );

      if (res.ok && sfRes.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-3xl mx-auto flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-slate-700 flex items-center justify-center">
            <Settings className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-content-primary">Settings</h1>
            <p className="text-sm text-content-muted">
              Configure your restaurant POS
            </p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm',
            saved
              ? 'bg-emerald-600 text-white'
              : 'bg-brand-600 text-white hover:bg-brand-700',
            saving && 'opacity-70 cursor-not-allowed',
          )}
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saved ? 'Saved!' : saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar Tabs */}
        <div className="w-full md:w-48 flex-shrink-0">
          <nav className="space-y-1 flex md:flex-col overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all whitespace-nowrap',
                  tab === t.key
                    ? 'bg-brand-50 text-brand-700 font-semibold border border-brand-100'
                    : 'text-content-secondary hover:bg-surface-3',
                )}
              >
                <span
                  className={
                    tab === t.key ? 'text-brand-600' : 'text-content-muted'
                  }
                >
                  {t.icon}
                </span>
                {t.label}
                {tab === t.key && (
                  <ChevronRight className="h-3.5 w-3.5 text-brand-400 ml-auto hidden md:block" />
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 bg-white rounded-2xl border border-border shadow-sm p-6 space-y-6">
          {tab === 'restaurant' && (
            <>
              <Section title="Restaurant Information">
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-content-secondary mb-1 block">
                      Restaurant Name
                    </label>
                    <input
                      value={restaurant.name}
                      onChange={(e) =>
                        setRestaurant({ ...restaurant, name: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-content-secondary mb-1 block">
                      Address
                    </label>
                    <input
                      value={restaurant.address}
                      onChange={(e) =>
                        setRestaurant({
                          ...restaurant,
                          address: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-content-secondary mb-1 block">
                      Phone
                    </label>
                    <input
                      value={restaurant.phone}
                      onChange={(e) =>
                        setRestaurant({ ...restaurant, phone: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-content-secondary mb-1 block">
                      GST Number
                    </label>
                    <input
                      value={restaurant.gstin}
                      onChange={(e) =>
                        setRestaurant({ ...restaurant, gstin: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
                    />
                  </div>
                </div>
              </Section>
            </>
          )}

          {tab === 'storefront' && (
            <Section title="Storefront Configuration">
              <div className="space-y-4">
                <Field
                  label="Publish Online Store"
                  hint="Toggle whether customers can view and place orders on your online store"
                >
                  <Toggle
                    checked={storefront.is_published}
                    onChange={(v) =>
                      setStorefront({ ...storefront, is_published: v })
                    }
                  />
                </Field>

                <div className="pt-2 border-t border-border space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-content-secondary mb-1 block">
                      Storefront URL Slug
                    </label>
                    <div className="flex rounded-xl overflow-hidden shadow-sm">
                      <span className="bg-slate-100 border border-r-0 border-border px-3 py-2 text-xs text-content-muted flex items-center">
                        localhost:3000/order/
                      </span>
                      <input
                        value={storefront.slug}
                        onChange={(e) =>
                          setStorefront({ ...storefront, slug: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 rounded-r-xl"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-content-secondary mb-1 block">
                      Restaurant Display Name
                    </label>
                    <input
                      value={storefront.restaurant_name}
                      onChange={(e) =>
                        setStorefront({
                          ...storefront,
                          restaurant_name: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-content-secondary mb-1 block">
                      Description / Moto
                    </label>
                    <textarea
                      value={storefront.description}
                      onChange={(e) =>
                        setStorefront({
                          ...storefront,
                          description: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 min-h-[80px]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-content-secondary mb-1 block">
                      Flat Delivery Fee (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={storefront.delivery_fee}
                      onChange={(e) =>
                        setStorefront({
                          ...storefront,
                          delivery_fee: Number(e.target.value),
                        })
                      }
                      className="w-full sm:w-1/3 px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
                    />
                  </div>
                </div>
              </div>
            </Section>
          )}

          {tab === 'notifications' && (
            <Section title="Notification Preferences">
              <div className="space-y-4">
                <Field
                  label="Low stock alerts"
                  hint="Notify when ingredients fall below minimum level"
                >
                  <Toggle
                    checked={notifications.low_stock}
                    onChange={(v) =>
                      setNotifications({ ...notifications, low_stock: v })
                    }
                  />
                </Field>
                <Field
                  label="New order alerts"
                  hint="Play sound when a new order comes in"
                >
                  <Toggle
                    checked={notifications.new_order}
                    onChange={(v) =>
                      setNotifications({ ...notifications, new_order: v })
                    }
                  />
                </Field>
                <Field
                  label="Shift summary email"
                  hint="Send Z-Report to email when shift closes"
                >
                  <Toggle
                    checked={notifications.email_daily_report}
                    onChange={(v) =>
                      setNotifications({
                        ...notifications,
                        email_daily_report: v,
                      })
                    }
                  />
                </Field>
                <Field
                  label="Void alerts via SMS"
                  hint="Send SMS to owner when an order is voided"
                >
                  <Toggle
                    checked={notifications.sms_on_void}
                    onChange={(v) =>
                      setNotifications({ ...notifications, sms_on_void: v })
                    }
                  />
                </Field>
              </div>
            </Section>
          )}

          {tab === 'payments' && (
            <Section title="Payment Settings">
              <div className="space-y-4">
                <Field label="Accept Credit/Debit Cards">
                  <Toggle
                    checked={payments.accept_card}
                    onChange={(v) =>
                      setPayments({ ...payments, accept_card: v })
                    }
                  />
                </Field>
                <Field label="Accept UPI Payments">
                  <Toggle
                    checked={payments.accept_upi}
                    onChange={(v) =>
                      setPayments({ ...payments, accept_upi: v })
                    }
                  />
                </Field>
                <div className="pt-2 border-t border-border">
                  <label className="text-xs font-semibold text-content-secondary mb-1 block">
                    Default Service Charge (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={payments.service_charge_pct}
                    onChange={(e) =>
                      setPayments({
                        ...payments,
                        service_charge_pct: Number(e.target.value),
                      })
                    }
                    className="w-full sm:w-1/3 px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
                  />
                  <p className="text-xs text-content-muted mt-1">
                    Automatically applied to all dine-in bills.
                  </p>
                </div>
              </div>
            </Section>
          )}

          {(tab === 'integrations' || tab === 'security') && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-16 w-16 bg-surface-3 rounded-2xl flex items-center justify-center mb-4">
                {tab === 'integrations' ? (
                  <Wifi className="h-8 w-8 text-content-disabled" />
                ) : (
                  <Shield className="h-8 w-8 text-content-disabled" />
                )}
              </div>
              <h3 className="text-lg font-bold text-content-primary">
                Coming Soon
              </h3>
              <p className="text-content-muted text-sm max-w-sm mt-1">
                {tab === 'integrations'
                  ? 'Zomato, Swiggy, and accounting integrations are rolling out next month.'
                  : 'Two-factor authentication and role-based IP restrictions are currently in beta.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
