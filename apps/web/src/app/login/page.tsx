'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { seedMenuCache } from '@/lib/db';
import { setAuthToken } from '@respos/utils';
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

    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

      let res: Response;
      try {
        res = await fetch(`${apiUrl}/auth/owner/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, pin }),
        });
      } catch {
        setError(
          'Cannot connect to server. Make sure the API is running on port 3001.',
        );
        setLoading(false);
        return;
      }

      if (!res.ok) {
        let message = 'Invalid email or PIN. Please try again.';
        try {
          const errBody = await res.json();
          if (errBody?.message) message = errBody.message;
        } catch {
          /* ignore */
        }
        setError(message);
        setLoading(false);
        return;
      }

      const data = await res.json();

      // Store token
      setAuthToken(data.access_token);
      localStorage.setItem('user_info', JSON.stringify(data.user));

      // Phase 2.1: Preload full menu into Dexie.js immediately after login
      try {
        const headers = { Authorization: `Bearer ${data.access_token}` };
        Promise.all([
          fetch(`${apiUrl}/menu/categories`, { headers }).then((r) => r.json()),
          fetch(`${apiUrl}/menu/items`, { headers }).then((r) => r.json()),
        ])
          .then(([cats, items]) => {
            if (cats && items) {
              seedMenuCache(cats, items).catch(console.error);
            }
          })
          .catch(console.error);
      } catch (err) {
        console.error('Failed to preload menu', err);
      }

      router.push('/dashboard');
    } catch (err: any) {
      setError(
        err.message || 'An unexpected error occurred. Please try again.',
      );
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-base flex items-center justify-center p-4">
      {/* Subtle dot pattern background */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, #334155 1px, transparent 0)',
          backgroundSize: '28px 28px',
        }}
      />

      <div className="relative w-full max-w-sm animate-scale-in">
        {/* Card */}
        <div className="bg-surface-card border-2 border-border-subtle p-8">
          {/* Brand */}
          <div className="flex flex-col items-center mb-8">
            <div className="h-14 w-14 bg-cyan-500 flex items-center justify-center border-2 border-cyan-400 shadow-lg mb-4">
              <Zap className="h-7 w-7 text-content-inverse" />
            </div>
            <h1 className="text-2xl font-black text-content-primary tracking-tight uppercase">
              resPOS
            </h1>
            <p className="text-content-muted text-sm mt-1 font-bold uppercase tracking-wider">
              Owner & Manager Portal
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="text-content-secondary text-xs font-black uppercase tracking-wider"
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
                  className="w-full bg-surface-base border-2 border-border-subtle pl-10 pr-4 py-3 text-content-primary outline-none focus:border-cyan-500 transition-all placeholder:text-content-muted font-bold tracking-tight"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="pin"
                className="text-content-secondary text-xs font-black uppercase tracking-wider"
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
                  className="w-full bg-surface-base border-2 border-border-subtle pl-10 pr-12 py-3 font-mono tracking-widest text-base text-content-primary outline-none focus:border-cyan-500 transition-all placeholder:text-content-muted"
                />
                <button
                  type="button"
                  onClick={() => setShowPin((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 flex items-center justify-center text-content-muted active:text-content-primary transition-colors"
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
              <div className="flex items-center gap-2 text-rose-400 text-sm bg-rose-500/10 border-2 border-rose-500/30 px-3 py-2.5 animate-fade-in font-bold uppercase tracking-wider">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email || !pin}
              className="w-full flex items-center justify-center gap-2 py-3 bg-cyan-500 text-content-inverse font-black uppercase tracking-widest border-2 border-cyan-400 active:bg-cyan-400 active:scale-[0.97] transition-all disabled:opacity-40"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 border-2 border-slate-900/40 border-t-slate-900 animate-spin" />
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
            <div className="flex-1 h-px bg-slate-700" />
            <span className="text-content-muted text-xs font-black uppercase tracking-wider">
              or
            </span>
            <div className="flex-1 h-px bg-slate-700" />
          </div>

          <a
            href="/pos/pin"
            className="flex items-center justify-center gap-2 w-full py-2.5 border-2 border-border-subtle bg-surface-sunken text-content-primary active:text-content-primary active:bg-slate-700 text-sm font-bold uppercase tracking-wider transition-all active:scale-[0.97]"
          >
            Staff PIN Login <ArrowRight className="h-4 w-4" />
          </a>

          <p className="mt-5 text-center text-xs text-content-muted font-bold uppercase tracking-wider">
            New restaurant?{' '}
            <a
              href="/onboarding"
              className="text-cyan-400 active:text-cyan-300 font-black hover:underline"
            >
              Set up your account →
            </a>
          </p>
        </div>

        <p className="text-center text-xs text-content-muted mt-4 font-mono tracking-tight">
          Demo — use DB email + PIN{' '}
          <code className="font-mono font-black text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 border border-cyan-500/30">
            1234
          </code>
        </p>
      </div>
    </div>
  );
}
