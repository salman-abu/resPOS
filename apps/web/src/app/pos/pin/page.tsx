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
import { setAuthToken } from '@respos/utils';

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
    setError(false);

    try {
      const tenantId = localStorage.getItem('device_tenant_id');
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

      const res = await fetch(`${apiUrl}/auth/staff/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          userId: selected!.id,
          pin: pinValue,
        }),
      });

      if (!res.ok) {
        throw new Error('Invalid PIN');
      }

      const data = await res.json();

      // Store token
      setAuthToken(data.access_token);
      localStorage.setItem('user_info', JSON.stringify(data.user));

      router.push(ROLE_REDIRECT[selected!.role] ?? '/pos');
    } catch (err) {
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
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6">
        <Loader2 className="h-8 w-8 text-cyan-400 animate-spin mb-4" />
        <p className="text-slate-500 font-black uppercase tracking-wider">
          Initializing Terminal...
        </p>
      </div>
    );
  }

  if (!isPaired) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative">
        <button
          onClick={() => router.push('/')}
          className="absolute top-8 left-8 flex items-center gap-2 text-slate-500 active:text-slate-300 font-bold uppercase tracking-wider text-xs transition-colors"
        >
          <ChevronLeft className="w-5 h-5" /> Back to Home
        </button>

        <div className="w-full max-w-sm bg-slate-900 border-2 border-slate-700 p-8 text-center">
          <div className="mx-auto bg-cyan-500/10 w-16 h-16 border border-cyan-500/30 flex items-center justify-center mb-6">
            <MonitorSmartphone className="h-8 w-8 text-cyan-400" />
          </div>
          <h2 className="text-2xl font-black text-slate-100 uppercase tracking-widest mb-2">
            Terminal Not Paired
          </h2>
          <p className="text-slate-500 text-sm mb-8 leading-relaxed font-bold uppercase tracking-wider">
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
              className="w-full bg-slate-950 border-2 border-slate-700 px-4 py-3 outline-none focus:border-cyan-500 transition-all text-slate-100 font-mono tracking-tight text-center placeholder:text-slate-600"
              required
            />
            {pairError && (
              <p className="text-rose-400 text-sm font-bold uppercase tracking-wider">
                {pairError}
              </p>
            )}
            <button
              type="submit"
              className="w-full py-3 border-2 border-cyan-400 bg-cyan-500 text-slate-900 font-black uppercase tracking-widest active:bg-cyan-400 active:scale-[0.97] transition-all"
            >
              Pair Device
            </button>
          </form>
          <p className="mt-6 text-xs text-slate-600 font-bold uppercase tracking-wider">
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
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6">
        {/* Subtle background pattern */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, #334155 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* Header */}
        <div className="relative flex flex-col items-center mb-10 animate-fade-in">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-11 w-11 bg-cyan-500 flex items-center justify-center border-2 border-cyan-400">
              <Zap className="h-5 w-5 text-slate-900" />
            </div>
            <div>
              <p className="text-slate-100 font-black text-xl tracking-tight uppercase">
                resPOS
              </p>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">
                {tenantName}
              </p>
            </div>
          </div>

          <h1 className="text-3xl font-black text-slate-100 uppercase tracking-widest mb-2">
            Who&apos;s working today?
          </h1>
          <p className="text-slate-500 text-sm font-mono tracking-tight">
            {time}
          </p>
        </div>

        {/* Staff Grid */}
        <div className="relative grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2 max-w-5xl w-full animate-fade-in">
          {staffList.length === 0 && (
            <div className="col-span-full text-center text-slate-500 py-8 font-black uppercase tracking-wider">
              No staff members found for this terminal.
            </div>
          )}
          {staffList.map((staff) => (
            <button
              key={staff.id}
              onClick={() => setSelected(staff)}
              className={cn(
                'group flex flex-col items-center gap-3 p-5',
                'bg-slate-800 border-2 border-slate-700',
                'active:bg-slate-700 active:border-slate-600 active:scale-[0.97]',
                'transition-all duration-75',
              )}
            >
              <Avatar name={staff.name} role={staff.role} size="xl" />
              <div className="text-center">
                <p className="text-slate-100 font-bold text-sm tracking-tight">
                  {staff.name.split(' ')[0]}
                </p>
                <p className="text-slate-500 text-[10px] font-black tracking-widest uppercase mt-0.5">
                  {staff.role}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-cyan-400 transition-colors" />
            </button>
          ))}
        </div>

        <p className="relative mt-10 text-slate-500 text-sm font-bold uppercase tracking-wider">
          Owner or Manager?{' '}
          <a
            href="/login"
            className="text-cyan-400 active:text-cyan-300 font-black hover:underline"
          >
            Sign in with email →
          </a>
        </p>
      </div>
    );
  }

  // ── PIN Entry ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      {/* Dot grid bg */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, #334155 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }}
      />

      <div
        className={cn(
          'relative z-10 w-full max-w-sm',
          shake && 'animate-shake',
        )}
      >
        <div className="bg-slate-900 border-2 border-slate-700 p-8 flex flex-col items-center gap-6">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-3 animate-bounce-in">
            <Avatar name={selected.name} role={selected.role} size="2xl" />
            <div className="text-center">
              <h2 className="text-xl font-black text-slate-100 uppercase tracking-widest">
                {selected.name}
              </h2>
              <p className="text-slate-500 text-sm mt-0.5 font-bold uppercase tracking-wider">
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
                  'h-4 w-4 border-2 transition-all duration-75',
                  i < pin.length
                    ? error
                      ? 'bg-rose-500 border-rose-400'
                      : 'bg-cyan-500 border-cyan-400'
                    : 'bg-transparent border-slate-600',
                )}
              />
            ))}
          </div>

          {error && (
            <p className="text-rose-400 text-sm font-black uppercase tracking-wider -mt-2 animate-fade-in">
              Wrong PIN. Please try again.
            </p>
          )}

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-2 w-full">
            {KEYPAD.map((num) => (
              <button
                key={num}
                onClick={() => handleKey(num)}
                disabled={loading}
                className={cn(
                  'h-16 text-2xl font-black text-slate-100',
                  'bg-slate-800 border-2 border-slate-700',
                  'active:bg-slate-700 active:border-slate-600 active:scale-[0.97]',
                  'transition-all duration-75',
                  'disabled:opacity-40 disabled:cursor-not-allowed',
                )}
              >
                {num}
              </button>
            ))}

            <button
              onClick={() => setSelected(null)}
              className="h-16 text-sm font-black text-slate-300 bg-slate-800 border-2 border-slate-700 active:bg-slate-700 active:text-slate-100 active:scale-[0.97] transition-all duration-75 uppercase tracking-wider"
            >
              ← Back
            </button>

            <button
              onClick={() => handleKey('0')}
              disabled={loading}
              className={cn(
                'h-16 text-2xl font-black text-slate-100',
                'bg-slate-800 border-2 border-slate-700',
                'active:bg-slate-700 active:border-slate-600 active:scale-[0.97]',
                'transition-all duration-75 disabled:opacity-40',
              )}
            >
              0
            </button>

            <button
              onClick={handleDelete}
              disabled={loading || pin.length === 0}
              className="h-16 flex items-center justify-center text-slate-400 bg-slate-800 border-2 border-slate-700 active:bg-rose-500/10 active:text-rose-400 active:border-rose-500/30 active:scale-[0.97] transition-all duration-75 disabled:opacity-20"
            >
              <Delete className="h-5 w-5" />
            </button>
          </div>

          {loading && (
            <div className="flex items-center gap-2 text-cyan-400 animate-fade-in">
              <ShieldCheck className="h-4 w-4" />
              <span className="text-sm font-black uppercase tracking-wider">
                Authenticating…
              </span>
            </div>
          )}

          <p className="text-slate-600 text-xs text-center font-mono tracking-tight">
            Demo PIN:{' '}
            <code className="font-mono font-black text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 border border-cyan-500/30">
              1234
            </code>{' '}
            (Check DB for specific user PIN hash)
          </p>
        </div>
      </div>
    </div>
  );
}
