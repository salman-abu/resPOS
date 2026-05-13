'use client';

import { useState } from 'react';
import { MonitorSmartphone, Copy, CheckCircle2, Zap } from 'lucide-react';

export default function TerminalsPage() {
  const [copied, setCopied] = useState(false);
  const tenantId = 'f5e51ebe-1709-46ca-94d8-2b325dd946c0'; // Hardcoded test DB tenant for the presentation demo

  const handleCopy = () => {
    navigator.clipboard.writeText(tenantId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const pairCurrentDevice = () => {
    localStorage.setItem('device_tenant_id', tenantId);
    window.location.href = '/pos/pin';
  };

  return (
    <div className="p-8 max-w-5xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-content-primary">Terminals & Devices</h1>
        <p className="text-content-muted">Manage the POS terminals connected to your restaurant.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white rounded-3xl border border-border p-8 shadow-sm">
          <div className="bg-blue-50 w-12 h-12 rounded-2xl flex items-center justify-center mb-6">
            <MonitorSmartphone className="w-6 h-6 text-brand-600" />
          </div>
          <h2 className="text-xl font-bold mb-2">Pair a New Terminal</h2>
          <p className="text-content-muted text-sm mb-6 leading-relaxed">
            To set up a new iPad or tablet as a POS terminal, open the landing page on that device, click Launch POS, and enter your exact Tenant ID below:
          </p>

          <div className="flex items-center gap-2 bg-surface-2 border border-border p-3 rounded-xl mb-6">
            <code className="text-sm font-mono flex-1 text-content-secondary truncate text-center">
              {tenantId}
            </code>
            <button 
              onClick={handleCopy}
              className="p-2 hover:bg-surface-3 rounded-lg transition-colors text-content-muted hover:text-content-primary"
            >
              {copied ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-border p-8 shadow-sm flex flex-col">
          <div className="bg-emerald-50 w-12 h-12 rounded-2xl flex items-center justify-center mb-6">
            <Zap className="w-6 h-6 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold mb-2">Quick Pair This Device</h2>
          <p className="text-content-muted text-sm mb-6 leading-relaxed flex-1">
            Want to use this current computer as the POS Terminal right now? Click the button below to instantly pair it and launch the PIN Pad.
          </p>

          <button 
            onClick={pairCurrentDevice}
            className="btn-primary w-full py-4 text-base font-semibold"
          >
            Pair & Launch POS
          </button>
        </div>
      </div>
    </div>
  );
}
