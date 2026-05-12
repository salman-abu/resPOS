'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Zap,
  Mail,
  KeyRound,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
} from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    if (pin === '1234') {
      router.push('/dashboard');
    } else {
      setError('Invalid email or PIN. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Subtle dot pattern background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, #E2E8F0 1px, transparent 0)',
          backgroundSize: '28px 28px',
        }}
      />

      {/* Gradient blobs — light & subtle */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-60 pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-violet-100 rounded-full blur-3xl opacity-40 pointer-events-none" />

      <div className="relative w-full max-w-sm animate-scale-in">
        {/* Card */}
        <div className="bg-white rounded-3xl border border-border shadow-elevated p-8">
          {/* Brand */}
          <div className="flex flex-col items-center mb-8">
            <div className="h-14 w-14 rounded-2xl bg-brand-600 flex items-center justify-center shadow-lg mb-4">
              <Zap className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-2xl font-black text-content-primary tracking-tight">
              resPOS
            </h1>
            <p className="text-content-muted text-sm mt-1">
              Owner & Manager Portal
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="text-content-secondary text-sm font-semibold"
              >
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-content-muted" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="owner@restaurant.com"
                  required
                  className="input-field w-full pl-10"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="pin"
                className="text-content-secondary text-sm font-semibold"
              >
                Secure PIN
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-content-muted" />
                <input
                  id="pin"
                  type={showPin ? 'text' : 'password'}
                  value={pin}
                  onChange={(e) =>
                    setPin(e.target.value.replace(/\D/g, '').slice(0, 6))
                  }
                  placeholder="••••••"
                  maxLength={6}
                  required
                  className="input-field w-full pl-10 pr-12 font-mono tracking-widest text-base"
                />
                <button
                  type="button"
                  onClick={() => setShowPin((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-content-muted hover:text-content-secondary transition-colors"
                >
                  {showPin ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-danger text-sm bg-danger/8 border border-danger/20 rounded-xl px-3 py-2.5 animate-fade-in">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email || !pin}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Authenticating…
                </>
              ) : (
                <>
                  Sign In <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-content-muted text-xs font-medium">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <a
            href="/pos/pin"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-border bg-surface-2 text-content-secondary hover:text-content-primary hover:bg-surface-3 hover:border-border-strong text-sm font-medium transition-all"
          >
            Staff PIN Login <ArrowRight className="h-4 w-4" />
          </a>

          <p className="mt-5 text-center text-xs text-content-muted">
            New restaurant?{' '}
            <a
              href="/onboarding"
              className="text-brand-600 hover:text-brand-700 font-semibold"
            >
              Set up your account →
            </a>
          </p>
        </div>

        <p className="text-center text-xs text-content-muted mt-4">
          Demo — any email + PIN{' '}
          <code className="font-mono font-bold text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded">
            1234
          </code>
        </p>
      </div>
    </div>
  );
}
