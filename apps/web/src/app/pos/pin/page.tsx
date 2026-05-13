'use client';

import { useState, useEffect } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { useRouter } from 'next/navigation';
import {
  Delete,
  Zap,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  MonitorSmartphone,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const ROLE_REDIRECT: Record<string, string> = {
  OWNER: '/dashboard',
  MANAGER: '/dashboard',
  CASHIER: '/pos',
  WAITER: '/pos',
  KITCHEN: '/kds',
  CAPTAIN: '/pos',
};

const KEYPAD = ['1', '2', '3', '4', '5', '6', '7', '8', '9'] as const;

export default function PinPadPage() {
  const [staffList, setStaffList] = useState<
    { id: string; name: string; role: string }[]
  >([]);
  const [tenantName, setTenantName] = useState('Restaurant');
  const [isPaired, setIsPaired] = useState<boolean>(true);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [pairCode, setPairCode] = useState('');
  const [pairError, setPairError] = useState('');

  const [selected, setSelected] = useState<{
    id: string;
    name: string;
    role: string;
  } | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const router = useRouter();

  const [time, setTime] = useState('');
  useEffect(() => {
    const tick = () =>
      setTime(
        new Date().toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        }),
      );
    tick();
    const id = setInterval(tick, 30000);

    // Initial pair check
    const tenantId = localStorage.getItem('device_tenant_id');
    if (tenantId) {
      fetchTerminalInfo(tenantId);
    } else {
      setIsPaired(false);
      setLoadingInitial(false);
    }

    return () => clearInterval(id);
  }, []);

  const fetchTerminalInfo = async (tenantId: string) => {
    try {
      setLoadingInitial(true);
      setPairError('');

      const cleanTenantId = tenantId.trim();
      if (cleanTenantId.length !== 36) {
        throw new Error(
          `Invalid Tenant ID format. It should be 36 characters (you have ${cleanTenantId.length}). Did you miss a character?`,
        );
      }

      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      const res = await fetch(
        `${apiUrl}/auth/terminal-info?tenantId=${cleanTenantId}`,
      );
      if (!res.ok) {
        throw new Error('Invalid Tenant ID or Server Error');
      }
      const data = await res.json();
      if (data && data.staff) {
        setStaffList(data.staff);
        setTenantName(data.tenantName);
        setIsPaired(true);
      } else {
        throw new Error('Tenant not found or inactive');
      }
    } catch (err: unknown) {
      console.error(err);
      if (err instanceof Error) {
        setPairError(err.message);
      } else {
        setPairError('Failed to pair terminal');
      }
      setIsPaired(false);
      localStorage.removeItem('device_tenant_id');
    } finally {
      setLoadingInitial(false);
    }
  };

  const handlePair = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pairCode) return;
    localStorage.setItem('device_tenant_id', pairCode);
    fetchTerminalInfo(pairCode);
  };

  const handleKey = (digit: string) => {
    if (pin.length >= 4) return;
    const next = pin + digit;
    setPin(next);
    setError(false);
    if (next.length === 4) submitPin(next);
  };

  const handleDelete = () => setPin((p) => p.slice(0, -1));

  const submitPin = async (pinValue: string) => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 700));
    if (pinValue === '1234') {
      router.push(ROLE_REDIRECT[selected!.role] ?? '/pos');
    } else {
      setLoading(false);
      setError(true);
      setShake(true);
      setPin('');
      setTimeout(() => setShake(false), 500);
    }
  };

  // ── Loading & Pairing ───────────────────────────────────────────────────
  if (loadingInitial) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <Loader2 className="h-8 w-8 text-brand-600 animate-spin mb-4" />
        <p className="text-content-muted font-medium">
          Initializing Terminal...
        </p>
      </div>
    );
  }

  if (!isPaired) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative">
        <button
          onClick={() => router.push('/')}
          className="absolute top-8 left-8 flex items-center gap-2 text-content-muted hover:text-content-primary font-medium transition-colors"
        >
          <ChevronLeft className="w-5 h-5" /> Back to Home
        </button>

        <div className="w-full max-w-sm bg-white rounded-3xl border border-border shadow-elevated p-8 text-center">
          <div className="mx-auto bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mb-6">
            <MonitorSmartphone className="h-8 w-8 text-brand-600" />
          </div>
          <h2 className="text-2xl font-bold text-content-primary mb-2">
            Terminal Not Paired
          </h2>
          <p className="text-content-muted text-sm mb-8 leading-relaxed">
            This device has not been linked to a restaurant. Please enter your
            Tenant ID to pair this terminal.
          </p>
          <form onSubmit={handlePair} className="flex flex-col gap-3">
            <input
              type="text"
              placeholder="Tenant ID (Paste from DB)"
              value={pairCode}
              onChange={(e) => {
                setPairCode(e.target.value);
                setPairError('');
              }}
              className="input-field w-full font-mono text-center"
              required
            />
            {pairError && (
              <p className="text-danger text-sm font-medium">{pairError}</p>
            )}
            <button type="submit" className="btn-primary w-full py-3">
              Pair Device
            </button>
          </form>
          <p className="mt-6 text-xs text-content-disabled">
            In production, you would generate a 6-digit pin from the Owner
            Dashboard.
          </p>
        </div>
      </div>
    );
  }

  // ── Staff Selection ───────────────────────────────────────────────────────
  if (!selected) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        {/* Subtle background pattern */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, #E2E8F0 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* Header */}
        <div className="relative flex flex-col items-center mb-10 animate-fade-in">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-11 w-11 rounded-2xl bg-brand-600 flex items-center justify-center shadow-lg">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-content-primary font-black text-xl tracking-tight">
                resPOS
              </p>
              <p className="text-content-muted text-xs">{tenantName}</p>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-content-primary mb-2">
            Who&apos;s working today?
          </h1>
          <p className="text-content-muted text-sm">{time}</p>
        </div>

        {/* Staff Grid */}
        <div className="relative grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 max-w-5xl w-full animate-fade-in">
          {staffList.length === 0 && (
            <div className="col-span-full text-center text-content-muted py-8">
              No staff members found for this terminal.
            </div>
          )}
          {staffList.map((staff) => (
            <button
              key={staff.id}
              onClick={() => setSelected(staff)}
              className={cn(
                'group flex flex-col items-center gap-3 p-5 rounded-2xl',
                'bg-white border border-border shadow-card',
                'hover:shadow-card-hover hover:border-brand-200 hover:-translate-y-0.5',
                'transition-all duration-200 press',
              )}
            >
              <Avatar name={staff.name} role={staff.role} size="xl" />
              <div className="text-center">
                <p className="text-content-primary font-semibold text-sm">
                  {staff.name.split(' ')[0]}
                </p>
                <p className="text-content-muted text-[10px] font-bold tracking-widest uppercase mt-0.5">
                  {staff.role}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-content-disabled group-hover:text-brand-500 transition-colors" />
            </button>
          ))}
        </div>

        <p className="relative mt-10 text-content-muted text-sm animate-fade-in">
          Owner or Manager?{' '}
          <a
            href="/login"
            className="text-brand-600 hover:text-brand-700 font-semibold hover:underline"
          >
            Sign in with email →
          </a>
        </p>
      </div>
    );
  }

  // ── PIN Entry ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      {/* Dot grid bg */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, #E2E8F0 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }}
      />

      <div
        className={cn(
          'relative z-10 w-full max-w-sm',
          shake && 'animate-shake',
        )}
      >
        <div className="bg-white rounded-3xl border border-border shadow-elevated p-8 flex flex-col items-center gap-6">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-3 animate-bounce-in">
            <Avatar name={selected.name} role={selected.role} size="2xl" />
            <div className="text-center">
              <h2 className="text-xl font-bold text-content-primary">
                {selected.name}
              </h2>
              <p className="text-content-muted text-sm mt-0.5">
                Enter your 4-digit PIN
              </p>
            </div>
          </div>

          {/* PIN dots */}
          <div className="flex gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={cn(
                  'h-4 w-4 rounded-full border-2 transition-all duration-200',
                  i < pin.length
                    ? error
                      ? 'bg-danger border-danger'
                      : 'bg-brand-600 border-brand-600 scale-110'
                    : 'bg-transparent border-border-strong',
                )}
              />
            ))}
          </div>

          {error && (
            <p className="text-danger text-sm font-medium -mt-2 animate-fade-in">
              Wrong PIN. Please try again.
            </p>
          )}

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-2.5 w-full">
            {KEYPAD.map((num) => (
              <button
                key={num}
                onClick={() => handleKey(num)}
                disabled={loading}
                className={cn(
                  'h-14 rounded-2xl text-2xl font-bold text-content-primary',
                  'bg-surface-3 border border-border hover:bg-surface-4 hover:border-border-strong',
                  'active:scale-95 transition-all duration-150 shadow-sm',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                )}
              >
                {num}
              </button>
            ))}

            <button
              onClick={() => setSelected(null)}
              className="h-14 rounded-2xl text-sm font-semibold text-content-secondary hover:bg-surface-3 border border-border transition-all duration-150 active:scale-95"
            >
              ← Back
            </button>

            <button
              onClick={() => handleKey('0')}
              disabled={loading}
              className={cn(
                'h-14 rounded-2xl text-2xl font-bold text-content-primary',
                'bg-surface-3 border border-border hover:bg-surface-4 hover:border-border-strong',
                'active:scale-95 transition-all duration-150 shadow-sm disabled:opacity-50',
              )}
            >
              0
            </button>

            <button
              onClick={handleDelete}
              disabled={loading || pin.length === 0}
              className="h-14 rounded-2xl flex items-center justify-center text-content-muted hover:text-danger hover:bg-danger/10 border border-border transition-all duration-150 active:scale-95 disabled:opacity-30"
            >
              <Delete className="h-5 w-5" />
            </button>
          </div>

          {loading && (
            <div className="flex items-center gap-2 text-brand-600 animate-fade-in">
              <ShieldCheck className="h-4 w-4" />
              <span className="text-sm font-medium">Authenticating…</span>
            </div>
          )}

          <p className="text-content-muted text-xs text-center">
            Demo PIN:{' '}
            <code className="font-mono font-bold text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded">
              1234
            </code>
          </p>
        </div>
      </div>
    </div>
  );
}
