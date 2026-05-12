'use client';

import { useState } from 'react';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Mock data
const STATS = {
  revenue_today: 124500,
  revenue_yesterday: 111000,
  revenue_last_week: 108500,
  orders_today: 87,
  avg_check: 28160,
  table_turn_min: 48,
  active_tables: 6,
  total_tables: 12,
  staff: 5,
  health: 78,
};

const INSIGHTS: {
  type: InsightType;
  headline: string;
  detail: string;
  action?: string;
}[] = [
  {
    type: 'win',
    headline: 'Best Tuesday in 3 months! 🎉',
    detail:
      'Revenue is 12% above last Tuesday. Your Paneer Biryani launch is working.',
  },
  {
    type: 'hot',
    headline: 'Butter Chicken is your star today',
    detail: '34 units sold — 2.4× daily average. Feature it on Zomato tonight.',
    action: 'Manage aggregator menu',
  },
  {
    type: 'revenue',
    headline: 'Dessert upsell = ₹1,500/day extra',
    detail:
      'Only 18% of tables ordered dessert. Suggesting one per table adds ₹1,500 daily.',
    action: 'Set up upsell prompts',
  },
  {
    type: 'time',
    headline: '2–4 PM is your dead zone',
    detail:
      'Only 4 orders in 2 hours. A Happy Hour combo could drive foot traffic.',
    action: 'Create time offer',
  },
  {
    type: 'cold',
    headline: 'Dal Makhani: 0 sales in 2 days',
    detail:
      'Consider a price discount or remove from menu to cut ingredient waste.',
    action: 'Manage item',
  },
  {
    type: 'staff',
    headline: "Rohan's avg bill is ₹180 below team",
    detail:
      'Team avg is ₹281. Coaching on add-ons & desserts could close the gap.',
    action: 'View staff',
  },
  {
    type: 'warning',
    headline: 'Table 7 occupied 112 minutes',
    detail: 'Avg table turn is 48 min. Consider offering the bill politely.',
  },
  {
    type: 'tip',
    headline: 'Add a QR menu for faster orders',
    detail: 'QR menus reduce table turn time by 22% on average.',
    action: 'Go to Settings',
  },
];

const TOP_SELLERS = [
  { name: 'Butter Chicken', qty: 34, revenue: 40800, trend: +18 },
  { name: 'Garlic Naan', qty: 28, revenue: 8400, trend: +5 },
  { name: 'Paneer Biryani', qty: 22, revenue: 30800, trend: +41 },
  { name: 'Masala Chai', qty: 19, revenue: 3800, trend: -3 },
  { name: 'Gulab Jamun', qty: 14, revenue: 5600, trend: +12 },
];

const TABLE_STATUS = [
  { n: '1', s: 'OCCUPIED', m: 32 },
  { n: '2', s: 'AVAILABLE', m: 0 },
  { n: '3', s: 'OCCUPIED', m: 18 },
  { n: '4', s: 'BILLED', m: 55 },
  { n: '5', s: 'AVAILABLE', m: 0 },
  { n: '6', s: 'OCCUPIED', m: 112 },
  { n: '7', s: 'DIRTY', m: 0 },
  { n: '8', s: 'AVAILABLE', m: 0 },
  { n: '9', s: 'OCCUPIED', m: 7 },
  { n: '10', s: 'RESERVED', m: 0 },
  { n: '11', s: 'AVAILABLE', m: 0 },
  { n: '12', s: 'OCCUPIED', m: 45 },
];

const TABLE_STYLE: Record<string, string> = {
  AVAILABLE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  OCCUPIED: 'bg-blue-50   text-blue-700   border-blue-200',
  BILLED: 'bg-amber-50  text-amber-700  border-amber-200',
  DIRTY: 'bg-slate-50  text-slate-500  border-slate-200',
  RESERVED: 'bg-violet-50 text-violet-700 border-violet-200',
};

function fmt(paise: number) {
  const r = paise / 100;
  if (r >= 100000) return `₹${(r / 100000).toFixed(1)}L`;
  if (r >= 1000) return `₹${(r / 1000).toFixed(1)}K`;
  return `₹${r.toFixed(0)}`;
}
function trend(a: number, b: number) {
  return Math.round(((a - b) / b) * 100);
}

function HealthRing({ score }: { score: number }) {
  const r = 42,
    c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  const color = score >= 80 ? '#059669' : score >= 60 ? '#D97706' : '#DC2626';
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
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-2xl font-black text-content-primary">
          {score}
        </span>
        <span className="text-[10px] text-content-muted">/100</span>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [filter, setFilter] = useState<'all' | InsightType>('all');
  const today = new Date();
  const h = today.getHours();
  const greet =
    h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  const filtered =
    filter === 'all' ? INSIGHTS : INSIGHTS.filter((i) => i.type === filter);

  return (
    <div className="min-h-full bg-background">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-sm border-b border-border px-6 py-3.5 flex items-center gap-4 shadow-sm">
        <div className="flex-1">
          <h1 className="text-lg font-bold text-content-primary">
            {greet}, <span className="gradient-text">Salman</span> 👋
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
          <button className="h-9 w-9 rounded-xl bg-surface-3 border border-border flex items-center justify-center text-content-secondary hover:bg-surface-4 hover:text-content-primary transition-all">
            <RefreshCw className="h-4 w-4" />
          </button>
          <button className="relative h-9 w-9 rounded-xl bg-surface-3 border border-border flex items-center justify-center text-content-secondary hover:bg-surface-4 transition-all">
            <Bell className="h-4 w-4" />
            <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full" />
          </button>
          <a
            href="/pos"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition-all shadow-sm"
          >
            <ShoppingBag className="h-4 w-4" /> Open POS
          </a>
        </div>
      </header>

      <div className="px-6 py-6 space-y-6 max-w-screen-xl">
        {/* Health + Stats */}
        <section className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-1 card p-5 flex flex-col items-center justify-center gap-2">
            <p className="text-content-secondary text-sm font-semibold">
              Business Health
            </p>
            <HealthRing score={STATS.health} />
            <p className="text-xs text-content-muted text-center">
              {STATS.health >= 75
                ? '🟢 Looking great!'
                : '🟡 Some areas to improve.'}
            </p>
          </div>
          <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-3 gap-4">
            <StatCard
              label="Today's Revenue"
              value={fmt(STATS.revenue_today)}
              trend={trend(STATS.revenue_today, STATS.revenue_yesterday)}
              trendLabel="vs yesterday"
              icon={<IndianRupee className="h-4 w-4" />}
              accentColor="blue"
            />
            <StatCard
              label="Orders Today"
              value={STATS.orders_today}
              subValue={`Avg: ${fmt(STATS.avg_check)}/order`}
              trend={+8}
              trendLabel="vs yesterday"
              icon={<ShoppingBag className="h-4 w-4" />}
              accentColor="green"
            />
            <StatCard
              label="Avg Table Time"
              value={String(STATS.table_turn_min)}
              suffix=" min"
              subValue="Target: <45 min"
              trend={-5}
              trendLabel="vs last week"
              icon={<Clock className="h-4 w-4" />}
              accentColor={STATS.table_turn_min > 45 ? 'amber' : 'green'}
            />
            <StatCard
              label="Active Tables"
              value={`${STATS.active_tables}/${STATS.total_tables}`}
              subValue="50% occupancy"
              icon={<TableProperties className="h-4 w-4" />}
              accentColor="violet"
            />
            <StatCard
              label="Staff on Shift"
              value={STATS.staff}
              subValue="2 waiters · 1 cashier · 2 kitchen"
              icon={<Users className="h-4 w-4" />}
              accentColor="rose"
            />
            <StatCard
              label="vs Last Week"
              value={`+${trend(STATS.revenue_today, STATS.revenue_last_week)}%`}
              subValue={`Was ${fmt(STATS.revenue_last_week)}`}
              icon={<TrendingUp className="h-4 w-4" />}
              accentColor="green"
            />
          </div>
        </section>

        {/* Insights + Right panel */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* AI Insights */}
          <section className="xl:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-violet-600" />
                <h2 className="text-content-primary font-bold">
                  AI Growth Insights
                </h2>
                <span className="badge bg-violet-100 text-violet-700">
                  {INSIGHTS.length}
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
                  action={ins.action}
                  onAction={() => {}}
                />
              ))}
            </div>
          </section>

          {/* Right panel */}
          <div className="space-y-5">
            {/* Top Sellers */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-content-primary font-bold flex items-center gap-2">
                  <ChefHat className="h-4 w-4 text-orange-500" /> Top Sellers
                </h2>
                <a
                  href="/dashboard/analytics"
                  className="text-xs text-brand-600 hover:text-brand-700 flex items-center gap-1 font-medium"
                >
                  Full report <ArrowRight className="h-3 w-3" />
                </a>
              </div>
              <div className="card overflow-hidden divide-y divide-border">
                {TOP_SELLERS.map((item, i) => (
                  <div
                    key={item.name}
                    className="flex items-center gap-3 px-4 py-3"
                  >
                    <span
                      className={cn(
                        'h-6 w-6 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0',
                        i === 0
                          ? 'bg-amber-100 text-amber-700'
                          : i === 1
                            ? 'bg-slate-100 text-slate-600'
                            : i === 2
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-surface-3 text-content-muted',
                      )}
                    >
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-content-primary text-xs font-semibold truncate">
                          {item.name}
                        </p>
                        <span
                          className={cn(
                            'text-[10px] font-bold ml-2',
                            item.trend > 0
                              ? 'text-success-DEFAULT'
                              : 'text-danger',
                          )}
                        >
                          {item.trend > 0 ? '+' : ''}
                          {item.trend}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand-500 rounded-full transition-all duration-700"
                          style={{
                            width: `${(item.qty / TOP_SELLERS[0].qty) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-content-primary text-xs font-bold">
                        {item.qty}
                      </p>
                      <p className="text-content-muted text-[10px]">
                        {fmt(item.revenue)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Floor map */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-content-primary font-bold flex items-center gap-2">
                  <TableProperties className="h-4 w-4 text-brand-600" /> Floor
                  Status
                </h2>
                <a
                  href="/pos/tables"
                  className="text-xs text-brand-600 hover:text-brand-700 flex items-center gap-1 font-medium"
                >
                  Full map <ArrowRight className="h-3 w-3" />
                </a>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {TABLE_STATUS.map((t) => (
                  <div
                    key={t.n}
                    className={cn(
                      'rounded-xl border flex flex-col items-center justify-center py-2.5 text-center text-xs font-bold',
                      TABLE_STYLE[t.s] ??
                        'bg-surface-3 text-content-muted border-border',
                    )}
                  >
                    <span className="text-sm font-black">{t.n}</span>
                    {t.m > 0 && (
                      <span className="text-[9px] font-medium opacity-70">
                        {t.m}m
                      </span>
                    )}
                  </div>
                ))}
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
