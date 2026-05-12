'use client';

import { useState } from 'react';
import { Settings, Store, Bell, CreditCard, Wifi, Shield, Save, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

type Tab = 'restaurant' | 'notifications' | 'payments' | 'integrations' | 'security';

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'restaurant', label: 'Restaurant', icon: <Store className="h-4 w-4" /> },
  { key: 'notifications', label: 'Notifications', icon: <Bell className="h-4 w-4" /> },
  { key: 'payments', label: 'Payments', icon: <CreditCard className="h-4 w-4" /> },
  { key: 'integrations', label: 'Integrations', icon: <Wifi className="h-4 w-4" /> },
  { key: 'security', label: 'Security', icon: <Shield className="h-4 w-4" /> },
];

function Toggle({ defaultChecked = false }: { defaultChecked?: boolean }) {
  const [on, setOn] = useState(defaultChecked);
  return (
    <button onClick={() => setOn(v => !v)}
      className={cn('relative h-6 w-11 rounded-full transition-colors duration-200 flex-shrink-0', on ? 'bg-brand-600' : 'bg-slate-200')}>
      <span className={cn('absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200', on && 'translate-x-5')} />
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-content-primary border-b border-border pb-2">{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
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
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

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
            <p className="text-sm text-content-muted">Configure your restaurant POS</p>
          </div>
        </div>
        <button onClick={handleSave}
          className={cn('flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm',
            saved ? 'bg-emerald-600 text-white' : 'bg-brand-600 text-white hover:bg-brand-700')}>
          <Save className="h-4 w-4" />
          {saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      <div className="flex gap-6">
        {/* Sidebar Tabs */}
        <div className="w-48 flex-shrink-0">
          <nav className="space-y-1">
            {TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={cn('w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all',
                  tab === t.key ? 'bg-brand-50 text-brand-700 font-semibold border border-brand-100' : 'text-content-secondary hover:bg-surface-3')}>
                <span className={tab === t.key ? 'text-brand-600' : 'text-content-muted'}>{t.icon}</span>
                {t.label}
                {tab === t.key && <ChevronRight className="h-3.5 w-3.5 text-brand-400 ml-auto" />}
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
                  {[
                    { label: 'Restaurant Name', placeholder: 'My Restaurant', defaultValue: 'The Grand Kitchen' },
                    { label: 'Address', placeholder: '123 Main Street, City' },
                    { label: 'Phone', placeholder: '+91 98765 43210' },
                    { label: 'GST Number', placeholder: 'GSTIN12345678' },
                    { label: 'FSSAI License', placeholder: '12345678901234' },
                  ].map(f => (
                    <div key={f.label}>
                      <label className="text-xs font-semibold text-content-secondary mb-1 block">{f.label}</label>
                      <input defaultValue={f.defaultValue} placeholder={f.placeholder}
                        className="w-full px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
                    </div>
                  ))}
                </div>
              </Section>
              <Section title="Operating Hours">
                <div className="space-y-2">
                  {['Monday–Friday', 'Saturday', 'Sunday'].map(day => (
                    <div key={day} className="flex items-center gap-3">
                      <span className="w-28 text-sm text-content-secondary">{day}</span>
                      <input defaultValue="10:00 AM" className="flex-1 px-3 py-1.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
                      <span className="text-content-muted text-sm">to</span>
                      <input defaultValue="11:00 PM" className="flex-1 px-3 py-1.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
                    </div>
                  ))}
                </div>
              </Section>
            </>
          )}

          {tab === 'notifications' && (
            <Section title="Notification Preferences">
              <div className="space-y-4">
                {[
                  { label: 'Low stock alerts', hint: 'Notify when ingredients fall below minimum level', on: true },
                  { label: 'New order alerts', hint: 'Play sound when a new order comes in', on: true },
                  { label: 'Shift summary email', hint: 'Send Z-Report to email when shift closes', on: false },
                  { label: 'Daily sales report', hint: 'Receive daily revenue summary at midnight', on: true },
                  { label: 'Staff login alerts', hint: 'Notify when a staff member clocks in', on: false },
                ].map(item => (
                  <Field key={item.label} label={item.label} hint={item.hint}>
                    <Toggle defaultChecked={item.on} />
                  </Field>
                ))}
              </div>
            </Section>
          )}

          {tab === 'payments' && (
            <Section title="Payment Methods">
              <div className="space-y-4">
                {[
                  { label: 'Cash', hint: 'Accept cash payments', on: true },
                  { label: 'UPI / QR Code', hint: 'Accept UPI payments (GPay, PhonePe, Paytm)', on: true },
                  { label: 'Card (POS Machine)', hint: 'Accept debit/credit card payments', on: false },
                  { label: 'Complimentary', hint: 'Allow marking orders as complimentary', on: true },
                ].map(item => (
                  <Field key={item.label} label={item.label} hint={item.hint}>
                    <Toggle defaultChecked={item.on} />
                  </Field>
                ))}
              </div>
            </Section>
          )}

          {tab === 'integrations' && (
            <Section title="Third-Party Integrations">
              <div className="space-y-4">
                {[
                  { label: 'Zomato', hint: 'Sync menu and receive orders from Zomato', on: false, badge: 'Setup Required' },
                  { label: 'Swiggy', hint: 'Sync menu and receive orders from Swiggy', on: false, badge: 'Setup Required' },
                  { label: 'WhatsApp Notifications', hint: 'Send bill receipts via WhatsApp', on: false },
                  { label: 'Google Reviews', hint: 'Prompt customers for Google review after billing', on: false },
                ].map(item => (
                  <Field key={item.label} label={item.label} hint={item.hint}>
                    <div className="flex items-center gap-2">
                      {item.badge && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200">{item.badge}</span>}
                      <Toggle defaultChecked={item.on} />
                    </div>
                  </Field>
                ))}
              </div>
            </Section>
          )}

          {tab === 'security' && (
            <>
              <Section title="Access & PIN">
                <div className="space-y-4">
                  {[
                    { label: 'Require PIN for discounts', hint: 'Staff must enter manager PIN to apply discounts', on: true },
                    { label: 'Require PIN for voids', hint: 'Staff must enter manager PIN to void an order', on: true },
                    { label: 'Auto-lock after 5 mins', hint: 'Return to PIN screen after inactivity', on: false },
                    { label: 'Allow multiple sessions', hint: 'Allow same staff to log in from multiple devices', on: false },
                  ].map(item => (
                    <Field key={item.label} label={item.label} hint={item.hint}>
                      <Toggle defaultChecked={item.on} />
                    </Field>
                  ))}
                </div>
              </Section>
              <Section title="Change Owner Password">
                <div className="space-y-3">
                  {['Current Password', 'New Password', 'Confirm New Password'].map(p => (
                    <div key={p}>
                      <label className="text-xs font-semibold text-content-secondary mb-1 block">{p}</label>
                      <input type="password" placeholder="••••••••" className="w-full px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
                    </div>
                  ))}
                  <button className="px-4 py-2 rounded-xl bg-slate-700 text-white text-sm font-semibold hover:bg-slate-800 transition-colors">
                    Update Password
                  </button>
                </div>
              </Section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
