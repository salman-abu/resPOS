'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MonitorSmartphone, Copy, CheckCircle2, Zap, GraduationCap } from 'lucide-react';
import { getAuthToken } from '@respos/utils';
import { cn } from '@/lib/utils';

export default function TerminalsPage() {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [tenantId, setTenantId] = useState('');
  const [trainingMode, setTrainingMode] = useState(false);

  useEffect(() => {
    // Decode tenant ID from the stored JWT token
    const token = getAuthToken();
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setTenantId(payload.tenantId ?? '');
        setTrainingMode(payload.mode === 'TRAINING');
      } catch {
        setTenantId('');
      }
    }
    // Fallback: also check localStorage
    const stored = localStorage.getItem('device_tenant_id');
    if (!tenantId && stored) setTenantId(stored);
  }, []);

  const handleCopy = () => {
    if (!tenantId) return;
    navigator.clipboard.writeText(tenantId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const pairCurrentDevice = () => {
    if (!tenantId) return;
    localStorage.setItem('device_tenant_id', tenantId);
    router.push('/pos/pin');
  };

  return (
    <div className="p-8 max-w-5xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-content-primary">
          Terminals & Devices
        </h1>
        <p className="text-content-muted">
          Manage the POS terminals connected to your restaurant.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white rounded-3xl border border-border p-8 shadow-sm">
          <div className="bg-blue-50 w-12 h-12 rounded-2xl flex items-center justify-center mb-6">
            <MonitorSmartphone className="w-6 h-6 text-brand-600" />
          </div>
          <h2 className="text-xl font-bold mb-2">Pair a New Terminal</h2>
          <p className="text-content-muted text-sm mb-6 leading-relaxed">
            To set up a new iPad or tablet as a POS terminal, open the landing
            page on that device, click Launch POS, and enter your exact Tenant
            ID below:
          </p>

          <div className="flex items-center gap-2 bg-surface-2 border border-border p-3 rounded-xl mb-6">
            <code className="text-sm font-mono flex-1 text-content-secondary truncate text-center">
              {tenantId}
            </code>
            <button
              onClick={handleCopy}
              className="p-2 hover:bg-surface-3 rounded-lg transition-colors text-content-muted hover:text-content-primary"
            >
              {copied ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              ) : (
                <Copy className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-border p-8 shadow-sm flex flex-col">
          <div className="bg-emerald-50 w-12 h-12 rounded-2xl flex items-center justify-center mb-6">
            <Zap className="w-6 h-6 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold mb-2">Quick Pair This Device</h2>
          <p className="text-content-muted text-sm mb-6 leading-relaxed flex-1">
            Want to use this current computer as the POS Terminal right now?
            Click the button below to instantly pair it and launch the PIN Pad.
          </p>

          <button
            onClick={pairCurrentDevice}
            className="btn-primary w-full py-4 text-base font-semibold"
          >
            Pair & Launch POS
          </button>
        </div>

        {/* MOD-06: Training Mode Toggle */}
        <div className="bg-white rounded-3xl border border-border p-8 shadow-sm flex flex-col">
          <div className="bg-amber-50 w-12 h-12 rounded-2xl flex items-center justify-center mb-6">
            <GraduationCap className="w-6 h-6 text-amber-600" />
          </div>
          <h2 className="text-xl font-bold mb-2">Training Mode</h2>
          <p className="text-content-muted text-sm mb-6 leading-relaxed flex-1">
            Enable sandbox mode for this terminal. All orders, voids, and
            payments will be isolated and auto-purged every 24 hours.
          </p>

          <div
            className={cn(
              'flex items-center justify-between p-4 rounded-xl border-2 mb-4',
              trainingMode
                ? 'bg-amber-50 border-amber-200'
                : 'bg-surface-2 border-border',
            )}
          >
            <span className="font-semibold text-sm">
              {trainingMode ? 'Training Active' : 'Training Inactive'}
            </span>
            <button
              onClick={() => {
                const token = getAuthToken();
                if (!token) return;
                const payload = JSON.parse(atob(token.split('.')[1]));
                const terminalId =
                  localStorage.getItem('terminal_id') || 'default-terminal';
                const action = trainingMode ? 'end' : 'start';
                fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1'}/training/${action}`, {
                  method: 'POST',
                  headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ terminal_id: terminalId }),
                })
                  .then((res) => {
                    if (res.ok) {
                      setTrainingMode(!trainingMode);
                    }
                  })
                  .catch(console.error);
              }}
              className={cn(
                'relative h-8 w-14 rounded-full transition-colors duration-200',
                trainingMode ? 'bg-amber-500' : 'bg-slate-200',
              )}
            >
              <span
                className={cn(
                  'absolute top-0.5 left-0.5 h-7 w-7 rounded-full bg-white shadow-sm transition-transform duration-200',
                  trainingMode && 'translate-x-6',
                )}
              />
            </button>
          </div>

          {trainingMode && (
            <div className="text-xs text-amber-700 bg-amber-100 rounded-xl p-3">
              ⚠️ All data created in this session is isolated and will be
              permanently deleted when training mode ends or after 24 hours.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
