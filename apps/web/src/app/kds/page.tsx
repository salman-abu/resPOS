'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
  ChefHat,
  Clock,
  CheckCircle2,
  LayoutGrid,
  Flame,
  Snowflake,
  Wine,
  Croissant,
  AlertTriangle,
  Volume2,
  VolumeX,
  BarChart3,
  ArrowRight,
  Wifi,
  WifiOff,
  Loader2,
} from 'lucide-react';
import { useKdsSocket, KdsTicket } from '@/lib/kds-socket';

// ─── Types ────────────────────────────────────────────────────────────────────

type Station = 'ALL' | 'HOT_KITCHEN' | 'COLD_KITCHEN' | 'BAR' | 'BAKERY';

// ─── Station config ───────────────────────────────────────────────────────────

const STATION_CFG: Record<
  string,
  {
    label: string;
    icon: React.ReactNode;
    bg: string;
    border: string;
    accent: string;
    header: string;
  }
> = {
  HOT_KITCHEN: {
    label: 'Hot Kitchen',
    icon: <Flame className="h-4 w-4" />,
    bg: 'bg-orange-950/60',
    border: 'border-orange-800',
    accent: 'text-orange-400',
    header: 'bg-orange-900/70',
  },
  COLD_KITCHEN: {
    label: 'Cold Kitchen',
    icon: <Snowflake className="h-4 w-4" />,
    bg: 'bg-cyan-950/60',
    border: 'border-cyan-800',
    accent: 'text-cyan-400',
    header: 'bg-cyan-900/70',
  },
  BAR: {
    label: 'Bar',
    icon: <Wine className="h-4 w-4" />,
    bg: 'bg-violet-950/60',
    border: 'border-violet-800',
    accent: 'text-violet-400',
    header: 'bg-violet-900/70',
  },
  BAKERY: {
    label: 'Bakery',
    icon: <Croissant className="h-4 w-4" />,
    bg: 'bg-amber-950/60',
    border: 'border-amber-800',
    accent: 'text-amber-400',
    header: 'bg-amber-900/70',
  },
};

// ─── Demo data ────────────────────────────────────────────────────────────────

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

function getAuthHeader(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('rpos_token'); // Ensure this matches your auth storage
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function getTenantId(): string {
  // Decode JWT or get from local storage. For now, defaulting or extracting.
  if (typeof window === 'undefined') return '';
  const token = localStorage.getItem('rpos_token');
  if (!token) return '';
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.tenantId || ''; // Adjust based on your JWT payload structure
  } catch {
    return '';
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function elapsed(ts: number): number {
  return Math.floor((Date.now() - ts) / 1000);
}

function fmtElapsed(secs: number): string {
  const m = Math.floor(secs / 60),
    s = secs % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function urgencyClass(secs: number): string {
  if (secs < 600) return 'text-emerald-400';
  if (secs < 1200) return 'text-amber-400';
  return 'text-red-400';
}

function urgencyBg(secs: number): string {
  if (secs < 600) return '';
  if (secs < 1200) return 'ring-1 ring-amber-500/40';
  return 'ring-2 ring-red-500/60 shadow-red-900/40 shadow-lg';
}

// ─── Ticket Card ──────────────────────────────────────────────────────────────

function TicketCard({
  ticket,
  onBump,
  onToggleItem,
}: {
  ticket: KdsTicket;
  onBump: (id: string) => void;
  onToggleItem: (
    ticketId: string,
    itemId: string,
    currentDone: boolean,
  ) => void;
}) {
  const cfg = STATION_CFG[ticket.station] || STATION_CFG['HOT_KITCHEN'];
  const secs = elapsed(new Date(ticket.created_at).getTime());
  const doneCount = ticket.items.filter(
    (i) => i.status === 'READY' || i.status === 'SERVED',
  ).length;
  const allDone = doneCount === ticket.items.length && ticket.items.length > 0;

  return (
    <div
      className={cn(
        'flex flex-col rounded-2xl border overflow-hidden transition-all duration-300',
        'kds-card-enter',
        cfg.bg,
        cfg.border,
        urgencyBg(secs),
      )}
    >
      {/* Card Header */}
      <div
        className={cn(
          'flex items-center justify-between px-3.5 py-2.5',
          cfg.header,
        )}
      >
        <div className="flex items-center gap-2">
          {ticket.priority && (
            <AlertTriangle className="h-3.5 w-3.5 text-red-400 animate-pulse" />
          )}
          <span className={cn('font-black text-base', cfg.accent)}>
            {ticket.order_type === 'DINE_IN'
              ? `T-${ticket.table_number || '?'}`
              : ticket.order_type.slice(0, 2)}
          </span>
          <span className="text-slate-400 text-xs font-mono">
            {ticket.order_id}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn('text-xs font-bold font-mono', urgencyClass(secs))}
          >
            ⏱ {fmtElapsed(secs)}
          </span>
          <span
            className={cn(
              'text-[10px] font-bold px-2 py-0.5 rounded-full',
              ticket.status === 'PREPARING'
                ? 'bg-amber-500/20 text-amber-400'
                : ticket.status === 'READY'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-slate-700 text-slate-400',
            )}
          >
            {ticket.status === 'PREPARING'
              ? 'COOKING'
              : ticket.status === 'READY'
                ? 'READY'
                : 'NEW'}
          </span>
        </div>
      </div>

      {/* Items */}
      <div className="flex-1 px-3.5 py-3 space-y-2.5">
        {ticket.items.map((item) => {
          const isDone = item.status === 'READY' || item.status === 'SERVED';
          return (
            <button
              key={item.id}
              onClick={() => onToggleItem(ticket.id, item.id, isDone)}
              className={cn(
                'w-full flex items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-200 press',
                isDone
                  ? 'bg-slate-800/60 opacity-50'
                  : 'bg-slate-800/80 hover:bg-slate-700/80',
              )}
            >
              <div
                className={cn(
                  'h-5 w-5 rounded-md border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors',
                  isDone
                    ? 'bg-emerald-500 border-emerald-500'
                    : 'border-slate-500',
                )}
              >
                {isDone && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'text-sm font-bold',
                      isDone ? 'line-through text-slate-500' : 'text-white',
                    )}
                  >
                    {item.name}
                  </span>
                  <span
                    className={cn(
                      'text-xs font-black px-1.5 py-0.5 rounded-md flex-shrink-0',
                      isDone
                        ? 'bg-slate-700 text-slate-500'
                        : 'bg-slate-600 text-slate-200',
                    )}
                  >
                    ×{item.quantity}
                  </span>
                </div>
                {item.variant && (
                  <p className="text-slate-400 text-xs mt-0.5">
                    {item.variant}
                  </p>
                )}
                {item.notes && (
                  <p className="text-amber-400 text-xs mt-0.5 flex items-center gap-1">
                    <span>📝</span> {item.notes}
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Progress bar */}
      {ticket.items.length > 1 && (
        <div className="px-3.5 pb-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-slate-500 text-[10px]">
              {doneCount}/{ticket.items.length} items
            </span>
            <span className="text-slate-500 text-[10px]">
              {Math.round((doneCount / ticket.items.length) * 100)}%
            </span>
          </div>
          <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                allDone ? 'bg-emerald-500' : 'bg-amber-500',
              )}
              style={{ width: `${(doneCount / ticket.items.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Bump button */}
      <div className="px-3.5 pb-3.5">
        <button
          onClick={() => onBump(ticket.id)}
          className={cn(
            'w-full py-2.5 rounded-xl text-sm font-black transition-all duration-200 press flex items-center justify-center gap-2',
            allDone
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/40'
              : 'bg-slate-700 hover:bg-slate-600 text-slate-200',
          )}
        >
          <CheckCircle2 className="h-4 w-4" />
          {allDone ? 'SERVE ✓' : 'BUMP'}
        </button>
      </div>
    </div>
  );
}

// ─── Main KDS Page ────────────────────────────────────────────────────────────

export default function KDSPage() {
  const [tickets, setTickets] = useState<KdsTicket[]>([]);
  const [station, setStation] = useState<Station>('ALL');
  // tick state removed — secs computed inline from Date.now() on each render
  const [muted, setMuted] = useState(false);
  const [bumped, setBumped] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const tenantId = useMemo(() => getTenantId(), []);
  const token =
    typeof window !== 'undefined'
      ? (localStorage.getItem('rpos_token') ?? undefined)
      : undefined;

  // No live-clock interval needed - elapsed() reads Date.now() each render

  const playAlert = useCallback(() => {
    if (!muted) {
      try {
        const a = new Audio(
          'data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAA...',
        );
        a.play().catch(() => {});
      } catch {}
    }
  }, [muted]);

  const { status: socketStatus } = useKdsSocket({
    tenantId,
    station,
    token,
    onNewKot: useCallback(
      (kot) => {
        setTickets((prev) => {
          // Prevent duplicates
          if (prev.some((t) => t.id === kot.id)) return prev;
          return [kot, ...prev];
        });
        playAlert();
      },
      [playAlert],
    ),
    onKotBumped: useCallback((kotId) => {
      setBumped((prev) => [...prev, kotId]);
      setTimeout(() => {
        setTickets((prev) => prev.filter((t) => t.id !== kotId));
        setBumped((prev) => prev.filter((b) => b !== kotId));
      }, 400);
    }, []),
    onItemDone: useCallback((kotId, itemId, done) => {
      setTickets((prev) =>
        prev.map((t) => {
          if (t.id !== kotId) return t;
          const items = t.items.map((i) =>
            i.id === itemId
              ? { ...i, status: done ? 'READY' : 'SENT_TO_KDS' }
              : i,
          );
          return { ...t, items };
        }),
      );
    }, []),
    onKotStatus: useCallback((kotId, status) => {
      setTickets((prev) =>
        prev.map((t) => {
          if (t.id !== kotId) return t;
          return { ...t, status };
        }),
      );
    }, []),
  });

  const fetchActiveKots = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${API_URL}/kds/kots${station !== 'ALL' ? `?station=${station}` : ''}`,
        {
          headers: getAuthHeader(),
        },
      );
      if (res.ok) {
        const data = await res.json();
        // Transform backend response to match KdsTicket structure if needed
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const formattedData: KdsTicket[] = data.map((kot: any) => ({
          id: kot.id,
          kot_number: kot.kot_number,
          station: kot.station,
          status: kot.status,
          order_id: kot.order_id,
          order_type: kot.order?.order_type || 'UNKNOWN',
          table_number: kot.order?.table?.table_number,
          pax_count: kot.order?.pax_count,
          created_at: kot.printed_at || new Date().toISOString(),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          items: kot.items.map((i: any) => ({
            id: i.id,
            name: i.item.name,
            variant: i.variant?.name,
            quantity: i.quantity,
            notes: i.notes,
            status: i.status,
          })),
        }));
        setTickets(formattedData);
      }
    } catch (e) {
      console.error('Failed to fetch KOTs', e);
    } finally {
      setLoading(false);
    }
  }, [station]);

  useEffect(() => {
    fetchActiveKots();
  }, [fetchActiveKots]);

  const handleBump = useCallback(async (id: string) => {
    // Optimistic UI
    setBumped((prev) => [...prev, id]);
    setTimeout(() => {
      setTickets((prev) => prev.filter((t) => t.id !== id));
      setBumped((prev) => prev.filter((b) => b !== id));
    }, 400);

    // API call
    try {
      await fetch(`${API_URL}/kds/kot/${id}/bump`, {
        method: 'PATCH',
        headers: getAuthHeader(),
      });
    } catch (e) {
      console.error('Failed to bump KOT', e);
      // Could revert optimistic update here on error
    }
  }, []);

  const handleToggleItem = useCallback(
    async (ticketId: string, itemId: string, currentDone: boolean) => {
      const newDoneState = !currentDone;

      // Optimistic UI
      setTickets((prev) =>
        prev.map((t) => {
          if (t.id !== ticketId) return t;
          const items = t.items.map((i) =>
            i.id === itemId
              ? { ...i, status: newDoneState ? 'READY' : 'SENT_TO_KDS' }
              : i,
          );
          const anyDone = items.some(
            (i) => i.status === 'READY' || i.status === 'SERVED',
          );
          const allDone = items.every(
            (i) => i.status === 'READY' || i.status === 'SERVED',
          );

          let newStatus = t.status;
          if (allDone) newStatus = 'READY';
          else if (anyDone) newStatus = 'PREPARING';
          else newStatus = 'PRINTED'; // Or whatever default is appropriate

          return { ...t, items, status: newStatus };
        }),
      );

      // API call
      try {
        await fetch(`${API_URL}/kds/kot/${ticketId}/item/${itemId}`, {
          method: 'PATCH',
          headers: {
            ...getAuthHeader(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ done: newDoneState }),
        });
      } catch (e) {
        console.error('Failed to toggle item', e);
        // Could revert here on error
      }
    },
    [],
  );

  const visible = tickets.filter(
    (t) => station === 'ALL' || t.station === station,
  );

  const pending = tickets.filter((t) => t.status !== 'READY').length;
  const avgSecs = tickets.length
    ? Math.floor(
        tickets.reduce(
          (s, t) => s + elapsed(new Date(t.created_at).getTime()),
          0,
        ) / tickets.length,
      )
    : 0;
  const oldest = tickets.reduce(
    (max, t) => Math.max(max, elapsed(new Date(t.created_at).getTime())),
    0,
  );

  const TABS: { key: Station; label: string; icon: React.ReactNode }[] = [
    { key: 'ALL', label: 'All', icon: <LayoutGrid className="h-3.5 w-3.5" /> },
    {
      key: 'HOT_KITCHEN',
      label: 'Hot Kitchen',
      icon: <Flame className="h-3.5 w-3.5" />,
    },
    {
      key: 'COLD_KITCHEN',
      label: 'Cold Kitchen',
      icon: <Snowflake className="h-3.5 w-3.5" />,
    },
    { key: 'BAR', label: 'Bar', icon: <Wine className="h-3.5 w-3.5" /> },
    {
      key: 'BAKERY',
      label: 'Bakery',
      icon: <Croissant className="h-3.5 w-3.5" />,
    },
  ];

  return (
    <div className="flex flex-col h-screen bg-slate-950 overflow-hidden">
      {/* ── Top Bar ────────────────────────────────────────────────────────── */}
      <header className="flex-shrink-0 flex items-center gap-4 px-5 py-3 bg-slate-900 border-b border-slate-800">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-orange-600 flex items-center justify-center">
            <ChefHat className="h-4 w-4 text-white" />
          </div>
          <div className="hidden sm:block">
            <p className="text-white font-black text-sm leading-none">
              Kitchen Display
            </p>
            <p className="text-slate-500 text-[10px]">resPOS</p>
          </div>
          <div className="flex items-center gap-2">
            {socketStatus === 'connected' ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Wifi className="h-3 w-3" />
                <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:block">
                  Live
                </span>
              </div>
            ) : socketStatus === 'connecting' ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:block">
                  Connecting
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                <WifiOff className="h-3 w-3" />
                <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:block">
                  Offline
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 ml-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700">
            <div
              className={cn(
                'h-2 w-2 rounded-full',
                pending > 0 ? 'bg-orange-500 animate-pulse' : 'bg-emerald-500',
              )}
            />
            <span className="text-white font-bold text-sm">{pending}</span>
            <span className="text-slate-400 text-xs">pending</span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700">
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            <span className={cn('font-bold text-sm', urgencyClass(avgSecs))}>
              {fmtElapsed(avgSecs)}
            </span>
            <span className="text-slate-400 text-xs">avg wait</span>
          </div>
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700">
            <AlertTriangle
              className={cn(
                'h-3.5 w-3.5',
                oldest > 1200 ? 'text-red-400' : 'text-slate-400',
              )}
            />
            <span className={cn('font-bold text-sm', urgencyClass(oldest))}>
              {fmtElapsed(oldest)}
            </span>
            <span className="text-slate-400 text-xs">longest</span>
          </div>
        </div>

        {/* Station tabs */}
        <div className="flex items-center gap-1.5 mx-auto">
          {TABS.map(({ key, label, icon }) => {
            const cnt =
              key === 'ALL'
                ? tickets.length
                : tickets.filter((t) => t.station === key).length;
            return (
              <button
                key={key}
                onClick={() => setStation(key)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200',
                  station === key
                    ? 'bg-white text-slate-900 shadow-md'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200',
                )}
              >
                {icon}
                <span className="hidden sm:block">{label}</span>
                {cnt > 0 && (
                  <span
                    className={cn(
                      'h-4 min-w-[1rem] px-1 rounded-full text-[10px] font-black flex items-center justify-center',
                      station === key
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-700 text-slate-300',
                    )}
                  >
                    {cnt}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={() => setMuted((v) => !v)}
            className="h-8 w-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors"
            title={muted ? 'Unmute alerts' : 'Mute alerts'}
          >
            {muted ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </button>
          <a
            href="/dashboard"
            className="h-8 w-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors"
            title="Dashboard"
          >
            <BarChart3 className="h-4 w-4" />
          </a>
          <a
            href="/pos"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 text-xs font-semibold transition-colors"
          >
            POS <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </header>

      {/* ── Ticket Grid ────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
        </div>
      ) : visible.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
          <div className="h-20 w-20 rounded-3xl bg-slate-800 flex items-center justify-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
          </div>
          <div>
            <p className="text-white font-bold text-xl">All caught up!</p>
            <p className="text-slate-500 text-sm mt-1">
              No pending tickets for this station
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-slate-700">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 auto-rows-min">
            {visible.map((ticket) => (
              <div
                key={ticket.id}
                className={cn(
                  'transition-all duration-400',
                  bumped.includes(ticket.id) &&
                    'opacity-0 scale-95 -translate-y-2',
                )}
              >
                <TicketCard
                  ticket={ticket}
                  onBump={handleBump}
                  onToggleItem={handleToggleItem}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Bottom Legend ───────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 flex items-center justify-center gap-6 px-5 py-2 bg-slate-900/80 border-t border-slate-800">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <div className="h-2 w-2 rounded-full bg-emerald-500" />
          <span>&lt;10 min</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <div className="h-2 w-2 rounded-full bg-amber-500" />
          <span>10-20 min</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <div className="h-2 w-2 rounded-full bg-red-500" />
          <span>&gt;20 min ⚠️</span>
        </div>
        <span className="text-slate-600 text-xs">|</span>
        <span className="text-slate-500 text-xs">
          Tap item to mark done · Tap BUMP when served
        </span>
      </div>
    </div>
  );
}
