'use client';

import { useState, useEffect } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { InsightCard } from '@/components/ui/InsightCard';
import { cn } from '@/lib/utils';
import { getAuthToken } from '@respos/utils';
import {
  TrendingUp,
  TrendingDown,
  Trophy,
  Target,
  Zap,
  IndianRupee,
  ShoppingBag,
  Users,
  Star,
  ChevronRight,
  ArrowLeft,
  BarChart3,
  Flame,
  Loader2,
} from 'lucide-react';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

// ─── Types ────────────────────────────────────────────────────────────────────

interface StaffMember {
  id: string;
  name: string;
  role: string;
  avatar_color?: string;
  stats: {
    orders: number;
    revenue: number;
    avg_check: number;
    tables: number;
    covers: number;
    tips: number;
    orders_target: number;
    revenue_target: number;
  };
  rank: number;
  rank_delta: number;
  hourly: number[];
  coach_tips: {
    type: 'revenue' | 'tip' | 'warning' | 'win';
    headline: string;
    detail: string;
  }[];
}

const HOURS = [
  '8a',
  '9a',
  '10a',
  '11a',
  '12p',
  '1p',
  '2p',
  '3p',
  '4p',
  '5p',
  '6p',
  '7p',
  '8p',
  '9p',
  '10p',
];

function fmt(paise: number): string {
  if (paise === 0) return '—';
  return paise >= 100000
    ? `₹${(paise / 100000).toFixed(1)}L`
    : `₹${(paise / 100).toFixed(0)}`;
}

function pct(val: number, target: number): number {
  if (!target) return 100;
  return Math.min(100, Math.round((val / target) * 100));
}

// ─── Leaderboard Row ──────────────────────────────────────────────────────────

function LeaderRow({
  s,
  isSelected,
  onClick,
}: {
  s: StaffMember;
  isSelected: boolean;
  onClick: () => void;
}) {
  const medalColor =
    s.rank === 1
      ? 'text-amber-500'
      : s.rank === 2
        ? 'text-slate-400'
        : s.rank === 3
          ? 'text-orange-500'
          : 'text-content-muted';
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-150 text-left',
        isSelected
          ? 'bg-brand-50 border border-brand-200'
          : 'hover:bg-surface-3 border border-transparent',
      )}
    >
      <span
        className={cn(
          'text-lg font-black w-6 text-center flex-shrink-0',
          medalColor,
        )}
      >
        {s.rank === 1
          ? '🥇'
          : s.rank === 2
            ? '🥈'
            : s.rank === 3
              ? '🥉'
              : s.rank}
      </span>
      <Avatar name={s.name} role={s.role} size="md" />
      <div className="flex-1 min-w-0">
        <p className="text-content-primary text-sm font-semibold truncate">
          {s.name.split(' ')[0]}
        </p>
        <p className="text-content-muted text-xs">{s.role}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-content-primary text-sm font-bold">
          {s.stats.orders} orders
        </p>
        <p className="text-content-muted text-xs">{fmt(s.stats.revenue)}</p>
      </div>
      <div
        className={cn(
          'flex items-center gap-0.5 text-xs font-semibold flex-shrink-0 ml-1',
          s.rank_delta > 0
            ? 'text-emerald-600'
            : s.rank_delta < 0
              ? 'text-red-500'
              : 'text-content-muted',
        )}
      >
        {s.rank_delta > 0 ? (
          <TrendingUp className="h-3 w-3" />
        ) : s.rank_delta < 0 ? (
          <TrendingDown className="h-3 w-3" />
        ) : null}
        {s.rank_delta !== 0 && Math.abs(s.rank_delta)}
      </div>
      <ChevronRight
        className={cn(
          'h-4 w-4 flex-shrink-0',
          isSelected ? 'text-brand-500' : 'text-content-muted',
        )}
      />
    </button>
  );
}

// ─── Stat Pill ────────────────────────────────────────────────────────────────

function StatPill({
  label,
  value,
  icon,
  accent = 'blue',
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent?: string;
}) {
  const accentMap: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-100 text-blue-700',
    green: 'bg-emerald-50 border-emerald-100 text-emerald-700',
    amber: 'bg-amber-50 border-amber-100 text-amber-700',
    violet: 'bg-violet-50 border-violet-100 text-violet-700',
    rose: 'bg-rose-50 border-rose-100 text-rose-700',
  };
  return (
    <div
      className={cn(
        'flex flex-col gap-1.5 p-4 rounded-2xl border',
        accentMap[accent] ?? accentMap.blue,
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold opacity-70 uppercase tracking-wide">
          {label}
        </span>
        <span className="opacity-60">{icon}</span>
      </div>
      <span className="text-2xl font-black">{value}</span>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function StaffHubPage() {
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const token = getAuthToken();
        const res = await fetch(`${API_BASE}/analytics/staff-performance`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!cancelled) {
          setStaffList(json);
          if (json.length > 0) setSelectedId(json[0].id);
        }
      } catch (e) {
        console.error('Staff performance fetch failed', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const staff = staffList.find((s) => s.id === selectedId) ?? staffList[0];
  const maxOrders = Math.max(...staffList.map((s) => s.stats.orders), 1);
  const ordersPct = staff
    ? pct(staff.stats.orders, staff.stats.orders_target)
    : 0;
  const revPct = staff
    ? pct(staff.stats.revenue, staff.stats.revenue_target)
    : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-sm border-b border-border px-6 py-3.5 flex items-center gap-4 shadow-sm">
        <a
          href="/dashboard"
          className="flex items-center gap-2 text-content-secondary hover:text-content-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm font-medium hidden sm:block">Dashboard</span>
        </a>
        <div className="h-4 w-px bg-border" />
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-brand-600 flex items-center justify-center">
            <Users className="h-4 w-4 text-white" />
          </div>
          <div>
            <h1 className="text-content-primary font-black text-sm">
              Staff Hub
            </h1>
            <p className="text-content-muted text-xs">
              Today&apos;s performance
            </p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-content-muted text-xs hidden sm:block">
            Shift: 9:00 AM – ongoing
          </span>
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <a
            href="/dashboard/staff/directory"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl transition-colors"
          >
            <Users className="h-3.5 w-3.5" /> Manage Team
          </a>
        </div>
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
        </div>
      ) : staffList.length === 0 ? (
        <div className="flex items-center justify-center py-24 text-content-muted">
          No active staff data available.
        </div>
      ) : (
        <div className="max-w-screen-xl mx-auto px-4 py-6 grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* ── LEFT: Leaderboard ─────────────────────────────────────────── */}
          <div className="xl:col-span-1 space-y-4">
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="h-5 w-5 text-amber-500" />
                <h2 className="text-content-primary font-bold">
                  Today&apos;s Leaderboard
                </h2>
              </div>

              {/* Bar chart preview */}
              <div className="flex items-end gap-1.5 h-16 mb-5">
                {staffList
                  .slice()
                  .sort((a, b) => a.rank - b.rank)
                  .map((s) => (
                    <div
                      key={s.id}
                      className="flex-1 flex flex-col items-center gap-1"
                    >
                      <div
                        className={cn(
                          'w-full rounded-t-lg transition-all duration-500',
                          s.id === selectedId ? 'bg-brand-600' : 'bg-surface-4',
                        )}
                        style={{
                          height: `${(s.stats.orders / maxOrders) * 52}px`,
                        }}
                      />
                    </div>
                  ))}
              </div>

              <div className="space-y-1">
                {staffList
                  .slice()
                  .sort((a, b) => a.rank - b.rank)
                  .map((s) => (
                    <LeaderRow
                      key={s.id}
                      s={s}
                      isSelected={selectedId === s.id}
                      onClick={() => setSelectedId(s.id)}
                    />
                  ))}
              </div>
            </div>
          </div>

          {/* ── RIGHT: Staff Detail ───────────────────────────────────────── */}
          <div className="xl:col-span-2 space-y-5">
            {/* Hero card */}
            <div className="card p-6">
              <div className="flex items-start gap-4">
                <Avatar
                  name={staff.name}
                  role={staff.role}
                  size="2xl"
                  showOnline
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-content-primary text-xl font-black">
                      {staff.name}
                    </h2>
                    {staff.rank === 1 && (
                      <span className="badge bg-amber-100 text-amber-700">
                        🏆 Top Performer
                      </span>
                    )}
                    {staff.rank_delta > 0 && (
                      <span className="badge bg-emerald-100 text-emerald-700">
                        ↑ Rising
                      </span>
                    )}
                  </div>
                  <p className="text-content-muted text-sm mt-0.5">
                    {staff.role} · On shift
                  </p>

                  {/* Goal bars */}
                  <div className="mt-4 space-y-2.5">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-content-secondary font-medium">
                          Orders goal
                        </span>
                        <span
                          className={cn(
                            'font-bold',
                            ordersPct >= 80
                              ? 'text-emerald-600'
                              : ordersPct >= 50
                                ? 'text-amber-600'
                                : 'text-red-500',
                          )}
                        >
                          {staff.stats.orders} / {staff.stats.orders_target} (
                          {ordersPct}%)
                        </span>
                      </div>
                      <div className="h-2 bg-surface-3 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all duration-700',
                            ordersPct >= 80
                              ? 'bg-emerald-500'
                              : ordersPct >= 50
                                ? 'bg-amber-500'
                                : 'bg-red-500',
                          )}
                          style={{ width: `${ordersPct}%` }}
                        />
                      </div>
                    </div>
                    {staff.stats.revenue_target > 0 && (
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-content-secondary font-medium">
                            Revenue goal
                          </span>
                          <span
                            className={cn(
                              'font-bold',
                              revPct >= 80
                                ? 'text-emerald-600'
                                : revPct >= 50
                                  ? 'text-amber-600'
                                  : 'text-red-500',
                            )}
                          >
                            {fmt(staff.stats.revenue)} /{' '}
                            {fmt(staff.stats.revenue_target)} ({revPct}%)
                          </span>
                        </div>
                        <div className="h-2 bg-surface-3 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all duration-700',
                              revPct >= 80
                                ? 'bg-brand-500'
                                : revPct >= 50
                                  ? 'bg-amber-500'
                                  : 'bg-red-500',
                            )}
                            style={{ width: `${revPct}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Rank badge */}
                <div className="flex-shrink-0 text-center">
                  <div
                    className={cn(
                      'h-14 w-14 rounded-2xl flex items-center justify-center text-2xl font-black border-2',
                      staff.rank === 1
                        ? 'bg-amber-50 border-amber-300 text-amber-600'
                        : staff.rank === 2
                          ? 'bg-slate-50 border-slate-300 text-slate-500'
                          : staff.rank === 3
                            ? 'bg-orange-50 border-orange-300 text-orange-600'
                            : 'bg-surface-3 border-border text-content-muted',
                    )}
                  >
                    {staff.rank}
                  </div>
                  <p className="text-content-muted text-xs mt-1">Rank</p>
                </div>
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <StatPill
                label="Orders"
                value={String(staff.stats.orders)}
                icon={<ShoppingBag className="h-4 w-4" />}
                accent="blue"
              />
              <StatPill
                label="Revenue"
                value={fmt(staff.stats.revenue)}
                icon={<IndianRupee className="h-4 w-4" />}
                accent="green"
              />
              <StatPill
                label="Avg Check"
                value={fmt(staff.stats.avg_check)}
                icon={<BarChart3 className="h-4 w-4" />}
                accent="violet"
              />
              <StatPill
                label="Tables"
                value={
                  staff.stats.tables > 0 ? String(staff.stats.tables) : '—'
                }
                icon={<Users className="h-4 w-4" />}
                accent="amber"
              />
              <StatPill
                label="Covers"
                value={String(staff.stats.covers)}
                icon={<Target className="h-4 w-4" />}
                accent="rose"
              />
              <StatPill
                label="Tips"
                value={staff.stats.tips > 0 ? fmt(staff.stats.tips) : '—'}
                icon={<Star className="h-4 w-4" />}
                accent="amber"
              />
            </div>

            {/* Hourly activity */}
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-4">
                <Flame className="h-4 w-4 text-orange-500" />
                <h3 className="text-content-primary font-bold text-sm">
                  Order Activity Today
                </h3>
                <span className="text-content-muted text-xs ml-auto">
                  Peak:{' '}
                  {HOURS[staff.hourly.indexOf(Math.max(...staff.hourly))] ??
                    '--'}
                </span>
              </div>
              <div className="flex items-end gap-1 h-16">
                {staff.hourly.map((v, i) => {
                  const max = Math.max(...staff.hourly, 1);
                  const isPeak = v === max && v > 0;
                  return (
                    <div
                      key={i}
                      className="flex-1 flex flex-col items-center gap-1 group relative"
                    >
                      <div
                        className={cn(
                          'w-full rounded-t-md transition-all duration-500',
                          isPeak
                            ? 'bg-brand-600'
                            : v > max * 0.6
                              ? 'bg-brand-400'
                              : v > 0
                                ? 'bg-brand-200'
                                : 'bg-surface-3',
                        )}
                        style={{ height: `${(v / max) * 52}px` }}
                      />
                      <span className="text-[9px] text-content-muted">
                        {HOURS[i]}
                      </span>
                      {/* Tooltip */}
                      {v > 0 && (
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {v} orders
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* AI Coach */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Zap className="h-4 w-4 text-violet-600" />
                <h3 className="text-content-primary font-bold text-sm">
                  AI Performance Coach
                </h3>
                <span className="badge bg-violet-100 text-violet-700 text-[10px]">
                  Personalized
                </span>
              </div>
              {staff.coach_tips.length === 0 ? (
                <p className="text-content-muted text-sm">
                  No coaching tips available yet.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {staff.coach_tips.map((tip, i) => (
                    <InsightCard
                      key={i}
                      type={tip.type}
                      headline={tip.headline}
                      detail={tip.detail}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
