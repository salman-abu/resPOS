'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { StatCard } from '@/components/ui/StatCard';
import { InsightCard, type InsightType } from '@/components/ui/InsightCard';
import {
  IndianRupee,
  ShoppingBag,
  TrendingUp,
  Users,
  Clock,
  ChefHat,
  TableProperties,
  RefreshCw,
  Bell,
  CalendarDays,
  ArrowRight,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { API_BASE } from '@/lib/api';
import { getAuthToken } from '@respos/utils';

// ── Types ──────────────────────────────────────────────────────────────────────
interface DashboardStats {
  revenue_today: number;
  revenue_yesterday: number;
  revenue_last_week: number;
  orders_today: number;
  avg_check: number;
  active_tables: number;
  total_tables: number;
  staff: number;
  health: number;
  top_sellers: { id: string; name: string; qty: number; revenue: number }[];
}

interface TableStatus {
  n: string;
  s: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function getToken() {
  if (typeof window === 'undefined') return '';
  return getAuthToken();
}
function authHeaders() {
  return { Authorization: `Bearer ${getToken()}` };
}
function fmt(paise: number) {
  const r = paise / 100;
  if (r >= 100000) return `₹${(r / 100000).toFixed(1)}L`;
  if (r >= 1000) return `₹${(r / 1000).toFixed(1)}K`;
  return `₹${r.toFixed(0)}`;
}
function trendPct(a: number, b: number) {
  if (!b) return 0;
  return Math.round(((a - b) / b) * 100);
}

const TABLE_STYLE: Record<string, string> = {
  AVAILABLE: 'bg-success-light text-success-default border-success-light',
  OCCUPIED: 'bg-brand-light text-brand-default border-brand-light',
  BILLED: 'bg-warning-light text-warning-default border-warning-light',
  DIRTY: 'bg-surface-sunken text-content-muted border-border-subtle',
  RESERVED: 'bg-info-light text-info-default border-info-light',
};

// Static insights — these are rules-based and always relevant
const STATIC_INSIGHTS: {
  type: InsightType;
  headline: string;
  detail: string;
  action?: string;
}[] = [
  {
    type: 'tip',
    headline: 'Add a QR menu for faster orders',
    detail: 'QR menus reduce table turn time by 22% on average.',
    action: 'Go to Settings',
  },
  {
    type: 'revenue',
    headline: 'Dessert upsell = ₹1,500/day extra',
    detail:
      'Only 18% of tables order dessert. Suggesting one per table adds ₹1,500 daily.',
    action: 'Set up upsell prompts',
  },
  {
    type: 'time',
    headline: '2–4 PM is your dead zone',
    detail: 'A Happy Hour combo could drive foot traffic in this window.',
    action: 'Create offer',
  },
];

// ── Health Ring ────────────────────────────────────────────────────────────────
function HealthRing({ score, loading }: { score: number; loading: boolean }) {
  const r = 42,
    c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  const color = score >= 80 ? '#16A34A' : score >= 60 ? '#D97706' : '#DC2626';
  return (
    <div className="relative flex items-center justify-center">
      <svg width="110" height="110" className="-rotate-90">
        <circle
          cx="55"
          cy="55"
          r={r}
          fill="none"
          stroke="#E2E8F0"
          strokeWidth="8"
        />
        <circle
          cx="55"
          cy="55"
          r={r}
          fill="none"
          stroke={loading ? '#E2E8F0' : color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={loading ? c : offset}
          style={{ transition: 'stroke-dashoffset 1s ease-out, stroke 0.3s' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin text-content-muted" />
        ) : (
          <>
            <span className="text-2xl font-black text-content-primary">
              {score}
            </span>
            <span className="text-[10px] text-content-muted">/100</span>
          </>
        )}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [tables, setTables] = useState<TableStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | InsightType>('all');

  const today = new Date();
  const h = today.getHours();
  const greet =
    h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const headers = authHeaders();
      const [statsRes, tablesRes] = await Promise.all([
        fetch(`${API_BASE}/analytics/dashboard-stats`, { headers }),
        fetch(`${API_BASE}/analytics/table-statuses`, { headers }),
      ]);
      if (statsRes.ok) setStats(await statsRes.json());
      if (tablesRes.ok) setTables(await tablesRes.json());
    } catch {
      /* silent — show stale data */
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh when user returns to tab
  useEffect(() => {
    const onVisible = () => {
      if (!document.hidden) fetchData(true);
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [fetchData]);

  // Build dynamic insights from real data
  const dynamicInsights: {
    type: InsightType;
    headline: string;
    detail: string;
  }[] = [];
  if (stats) {
    const rev = stats.revenue_today / 100;
    const prevRev = stats.revenue_yesterday / 100;
    if (prevRev > 0) {
      const pct = Math.round(((rev - prevRev) / prevRev) * 100);
      if (pct > 0)
        dynamicInsights.push({
          type: 'win',
          headline: `Revenue up ${pct}% vs yesterday 🎉`,
          detail: `Today ₹${rev.toFixed(0)} vs yesterday ₹${prevRev.toFixed(0)}.`,
        });
      else
        dynamicInsights.push({
          type: 'warning',
          headline: `Revenue down ${Math.abs(pct)}% vs yesterday`,
          detail: `Today ₹${rev.toFixed(0)} vs yesterday ₹${prevRev.toFixed(0)}.`,
        });
    }
    if (stats.top_sellers[0]) {
      dynamicInsights.push({
        type: 'hot',
        headline: `${stats.top_sellers[0].name} is today's star`,
        detail: `${stats.top_sellers[0].qty} units sold today — your top performer.`,
      });
    }
    const occupancy =
      stats.total_tables > 0 ? stats.active_tables / stats.total_tables : 0;
    if (occupancy < 0.3)
      dynamicInsights.push({
        type: 'cold',
        headline: 'Low table occupancy right now',
        detail: `Only ${stats.active_tables} of ${stats.total_tables} tables active. Consider a push notification deal.`,
      });
  }

  const allInsights = [...dynamicInsights, ...STATIC_INSIGHTS];
  const filtered =
    filter === 'all'
      ? allInsights
      : allInsights.filter((i) => i.type === filter);

  return (
    <div className="min-h-full bg-background">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-sm border-b border-border px-6 py-3.5 flex items-center gap-4 shadow-sm">
        <div className="flex-1">
          <h1 className="text-lg font-bold text-content-primary">
            {greet}, <span className="gradient-text">Chef</span> 👋
          </h1>
          <p className="text-content-muted text-xs flex items-center gap-1.5 mt-0.5">
            <CalendarDays className="h-3 w-3" />
            {today.toLocaleDateString('en-IN', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="h-9 w-9 rounded-xl bg-surface-3 border border-border flex items-center justify-center text-content-secondary hover:bg-surface-4 hover:text-content-primary transition-all"
          >
            <RefreshCw
              className={cn('h-4 w-4', refreshing && 'animate-spin')}
            />
          </button>
          <button className="relative h-9 w-9 rounded-xl bg-surface-3 border border-border flex items-center justify-center text-content-secondary hover:bg-surface-4 transition-all">
            <Bell className="h-4 w-4" />
            <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full" />
          </button>
          <Link
            href="/pos"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition-all shadow-sm"
          >
            <ShoppingBag className="h-4 w-4" /> Open POS
          </Link>
        </div>
      </header>

      <div className="px-6 py-6 space-y-6 max-w-screen-xl">
        {/* Health + Stats */}
        <section className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-1 card p-5 flex flex-col items-center justify-center gap-2">
            <p className="text-content-secondary text-sm font-semibold">
              Business Health
            </p>
            <HealthRing score={stats?.health ?? 0} loading={loading} />
            <p className="text-xs text-content-muted text-center">
              {loading
                ? 'Calculating...'
                : (stats?.health ?? 0) >= 75
                  ? '🟢 Looking great!'
                  : '🟡 Some areas to improve.'}
            </p>
          </div>
          <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-3 gap-4">
            <StatCard
              label="Today's Revenue"
              value={loading ? '—' : fmt(stats?.revenue_today ?? 0)}
              trend={
                stats
                  ? trendPct(stats.revenue_today, stats.revenue_yesterday)
                  : undefined
              }
              trendLabel="vs yesterday"
              icon={<IndianRupee className="h-4 w-4" />}
              accentColor="blue"
            />
            <StatCard
              label="Orders Today"
              value={loading ? '—' : (stats?.orders_today ?? 0)}
              subValue={stats ? `Avg: ${fmt(stats.avg_check)}/order` : ''}
              trend={
                stats
                  ? trendPct(stats.revenue_today, stats.revenue_last_week)
                  : undefined
              }
              trendLabel="vs last week"
              icon={<ShoppingBag className="h-4 w-4" />}
              accentColor="green"
            />
            <StatCard
              label="Active Tables"
              value={
                loading
                  ? '—'
                  : `${stats?.active_tables ?? 0}/${stats?.total_tables ?? 0}`
              }
              subValue={
                stats
                  ? `${stats.total_tables > 0 ? Math.round((stats.active_tables / stats.total_tables) * 100) : 0}% occupancy`
                  : ''
              }
              icon={<TableProperties className="h-4 w-4" />}
              accentColor="violet"
            />
            <StatCard
              label="Staff Active"
              value={loading ? '—' : (stats?.staff ?? 0)}
              subValue="Active accounts"
              icon={<Users className="h-4 w-4" />}
              accentColor="rose"
            />
            <StatCard
              label="vs Last Week"
              value={
                loading || !stats
                  ? '—'
                  : `${trendPct(stats.revenue_today, stats.revenue_last_week) >= 0 ? '+' : ''}${trendPct(stats.revenue_today, stats.revenue_last_week)}%`
              }
              subValue={stats ? `Was ${fmt(stats.revenue_last_week)}` : ''}
              icon={<TrendingUp className="h-4 w-4" />}
              accentColor="green"
            />
            <StatCard
              label="Avg Order Value"
              value={loading ? '—' : fmt(stats?.avg_check ?? 0)}
              subValue="Today"
              icon={<Clock className="h-4 w-4" />}
              accentColor="amber"
            />
          </div>
        </section>

        {/* Insights + Right panel */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* AI Insights */}
          <section className="xl:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-info-default" />
                <h2 className="text-content-primary font-bold">
                  AI Growth Insights
                </h2>
                <span className="badge bg-info-light text-info-default">
                  {allInsights.length}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {(['all', 'warning', 'revenue', 'hot', 'tip'] as const).map(
                  (f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={cn(
                        'text-xs px-2.5 py-1 rounded-full font-semibold transition-all',
                        filter === f
                          ? 'bg-brand-600 text-white shadow-sm'
                          : 'bg-surface-3 text-content-secondary hover:text-content-primary',
                      )}
                    >
                      {f === 'all'
                        ? 'All'
                        : f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  ),
                )}
              </div>
            </div>
            <div className="space-y-2.5">
              {filtered.map((ins, i) => (
                <InsightCard
                  key={i}
                  type={ins.type}
                  headline={ins.headline}
                  detail={ins.detail}
                  action={(ins as any).action}
                  onAction={() => {}}
                />
              ))}
              {filtered.length === 0 && (
                <div className="text-center py-8 text-content-muted text-sm">
                  No insights for this filter.
                </div>
              )}
            </div>
          </section>

          {/* Right panel */}
          <div className="space-y-5">
            {/* Top Sellers */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-content-primary font-bold flex items-center gap-2">
                  <ChefHat className="h-4 w-4 text-warning-default" /> Top Sellers
                </h2>
                <Link
                  href="/dashboard/analytics"
                  className="text-xs text-brand-600 hover:text-brand-700 flex items-center gap-1 font-medium"
                >
                  Full report <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="card overflow-hidden divide-y divide-border">
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 px-4 py-3 animate-pulse"
                    >
                      <div className="h-6 w-6 rounded-lg bg-surface-sunken flex-shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3 w-32 bg-surface-sunken rounded" />
                        <div className="h-1.5 w-full bg-surface-sunken rounded-full" />
                      </div>
                    </div>
                  ))
                ) : (stats?.top_sellers ?? []).length === 0 ? (
                  <div className="py-8 text-center text-content-muted text-sm">
                    No orders today yet.
                  </div>
                ) : (
                  (stats?.top_sellers ?? []).map((item, i) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 px-4 py-3"
                    >
                      <span
                        className={cn(
                          'h-6 w-6 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0',
                          i === 0
                            ? 'bg-warning-light text-warning-default'
                            : i === 1
                              ? 'bg-surface-sunken text-content-muted'
                              : i === 2
                                ? 'bg-warning-light text-warning-default'
                                : 'bg-surface-sunken text-content-muted',
                        )}
                      >
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-content-primary text-xs font-semibold truncate">
                            {item.name}
                          </p>
                          <span className="text-[10px] font-bold ml-2 text-content-muted">
                            {item.qty} sold
                          </span>
                        </div>
                        <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-brand-default rounded-full transition-all duration-700"
                            style={{
                              width: `${(stats?.top_sellers[0]?.qty ?? 1) > 0 ? (item.qty / (stats?.top_sellers[0]?.qty ?? 1)) * 100 : 0}%`,
                            }}
                          />
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-content-primary text-xs font-bold">
                          {fmt(item.revenue)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Floor map */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-content-primary font-bold flex items-center gap-2">
                  <TableProperties className="h-4 w-4 text-brand-default" /> Floor
                  Status
                </h2>
                <Link
                  href="/pos/tables"
                  className="text-xs text-brand-600 hover:text-brand-700 flex items-center gap-1 font-medium"
                >
                  Full map <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {loading ? (
                  [...Array(12)].map((_, i) => (
                  <div
                    key={i}
                    className="h-16 rounded-xl bg-surface-sunken animate-pulse"
                  />
                  ))
                ) : tables.length === 0 ? (
                  <div className="col-span-4 py-6 text-center text-content-muted text-sm">
                    No tables found.
                  </div>
                ) : (
                  tables.map((t) => (
                    <div
                      key={t.n}
                      className={cn(
                        'rounded-xl border flex flex-col items-center justify-center py-2.5 text-center text-xs font-bold',
                        TABLE_STYLE[t.s] ??
                          'bg-surface-3 text-content-muted border-border',
                      )}
                    >
                      <span className="text-sm font-black">{t.n}</span>
                      <span className="text-[9px] font-medium opacity-60">
                        {t.s.toLowerCase()}
                      </span>
                    </div>
                  ))
                )}
              </div>
              <div className="flex flex-wrap gap-3 mt-3">
                {Object.entries(TABLE_STYLE).map(([s, cls]) => (
                  <div key={s} className="flex items-center gap-1.5">
                    <div
                      className={cn('h-2.5 w-2.5 rounded-full border', cls)}
                    />
                    <span className="text-content-muted text-[10px] font-medium capitalize">
                      {s.toLowerCase()}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
