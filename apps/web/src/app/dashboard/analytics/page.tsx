'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { StatCard } from '@/components/ui/StatCard';
import { getAuthToken } from '@respos/utils';
import {
  IndianRupee,
  ShoppingBag,
  TrendingUp,
  Clock,
  Printer,
  CalendarDays,
  BarChart3,
  ArrowLeft,
  CreditCard,
  Banknote,
  Smartphone,
  FileText,
  Loader2,
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

type Range = 'today' | 'week' | 'month';

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

interface TrendData {
  labels: string[];
  revenue: number[];
  orders: number[];
}

interface PaymentMix {
  cash: number;
  upi: number;
  card: number;
}

interface TableTurnData {
  averageTurnTimeMinutes: number;
}

function fmt(p: number) {
  const r = p / 100;
  return r >= 100000
    ? `₹${(r / 100000).toFixed(1)}L`
    : r >= 1000
      ? `₹${(r / 1000).toFixed(1)}K`
      : `₹${r.toFixed(0)}`;
}

function authHeaders(): Record<string, string> {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

// ─── SVG Line Chart ──────────────────────────────────────────────────────────
function LineChart({
  data,
  labels,
  color = '#3B82F6',
}: {
  data: number[];
  labels: string[];
  color?: string;
}) {
  const W = 560,
    H = 120,
    PAD = 20;
  const max = Math.max(...data, 1),
    min = 0;
  const pts = data
    .map(
      (v, i) =>
        `${PAD + (i / (data.length - 1)) * (W - 2 * PAD)},${H - PAD - ((v - min) / (max - min)) * (H - 2 * PAD)}`,
    )
    .join(' ');
  const area = `${PAD},${H - PAD} ${pts} ${PAD + ((data.length - 1) / (data.length - 1)) * (W - 2 * PAD)},${H - PAD}`;
  return (
    <svg viewBox={`0 0 ${W} ${H + 20}`} className="w-full h-auto">
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#lg)" />
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {data.map((v, i) => {
        const x = PAD + (i / (data.length - 1)) * (W - 2 * PAD),
          y = H - PAD - ((v - min) / (max - min)) * (H - 2 * PAD);
        return (
          <g key={i}>
            <circle cx={x} cy={y} r="3.5" fill={color} />
            <text
              x={x}
              y={H + 14}
              textAnchor="middle"
              fontSize="9"
              fill="#94A3B8"
            >
              {labels[i]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── SVG Bar Chart ───────────────────────────────────────────────────────────
function BarChart({
  data,
  labels,
  color = '#8B5CF6',
}: {
  data: number[];
  labels: string[];
  color?: string;
}) {
  const W = 560,
    H = 100,
    PAD = 12;
  const max = Math.max(...data, 1);
  const bw = (W - 2 * PAD) / (data.length * 1.5) - 2;
  return (
    <svg viewBox={`0 0 ${W} ${H + 20}`} className="w-full h-auto">
      {data.map((v, i) => {
        const bh = (v / max) * (H - PAD);
        const x =
          PAD +
          i * ((W - 2 * PAD) / data.length) +
          ((W - 2 * PAD) / data.length - bw) / 2;
        return (
          <g key={i}>
            <rect
              x={x}
              y={H - PAD - bh}
              width={bw}
              height={bh}
              rx="3"
              fill={color}
              fillOpacity="0.85"
            />
            <text
              x={x + bw / 2}
              y={H + 14}
              textAnchor="middle"
              fontSize="9"
              fill="#94A3B8"
            >
              {labels[i]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── Donut Chart ─────────────────────────────────────────────────────────────
function Donut({
  cash,
  upi,
  card,
}: {
  cash: number;
  upi: number;
  card: number;
}) {
  const total = cash + upi + card;
  const r = 42,
    cx = 60,
    cy = 60,
    stroke = 14;
  const c = 2 * Math.PI * r;
  const segs = [
    { val: cash, color: '#10B981', label: 'Cash' },
    { val: upi, color: '#8B5CF6', label: 'UPI' },
    { val: card, color: '#3B82F6', label: 'Card' },
  ];
  let offset = 0;
  const arcs = segs.map((s) => {
    const dash = (s.val / total) * c;
    const el = (
      <circle
        key={s.label}
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={s.color}
        strokeWidth={stroke}
        strokeDasharray={`${dash} ${c - dash}`}
        strokeDashoffset={-offset}
        transform={`rotate(-90 ${cx} ${cy})`}
      />
    );
    offset += dash;
    return el;
  });
  return (
    <div className="flex items-center gap-6">
      <svg width="120" height="120">
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="#E2E8F0"
          strokeWidth={stroke}
        />
        {arcs}
      </svg>
      <div className="space-y-2">
        {segs.map((s) => (
          <div key={s.label} className="flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-full flex-shrink-0"
              style={{ background: s.color }}
            />
            <span className="text-content-secondary text-xs">{s.label}</span>
            <span className="text-content-primary text-xs font-bold ml-auto">
              {total > 0 ? Math.round((s.val / total) * 100) : 0}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Z-Report ────────────────────────────────────────────────────────────────
function ZReport({
  stats,
  payment,
}: {
  stats: DashboardStats;
  payment: PaymentMix;
}) {
  const now = new Date();
  const ref = `ZREP-${now.toISOString().slice(0, 10).replace(/-/g, '')}-001`;
  const total = payment.cash + payment.upi + payment.card;
  const gstRate = 0.05; // 2.5% CGST + 2.5% SGST
  const taxable = total > 0 ? Math.round(total / (1 + gstRate)) : 0;
  const cgst = total > 0 ? Math.round(taxable * 0.025) : 0;
  const sgst = total > 0 ? Math.round(taxable * 0.025) : 0;

  const print = () => {
    const w = window.open('', '_blank', 'width=400,height=700');
    if (!w) return;
    w.document.write(`<html><head><title>${ref}</title>
    <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Courier New',monospace;font-size:12px;width:80mm;padding:8px}.c{text-align:center}.b{font-weight:bold}.ln{border-top:1px dashed #000;margin:6px 0}.row{display:flex;justify-content:space-between;padding:2px 0}.big{font-size:16px;font-weight:bold}</style>
    </head><body>
    <div class="c b" style="font-size:16px">Z-REPORT</div>
    <div class="c">Spice Garden · GST:29ABCDE1234F1Z5</div>
    <div class="c">${now.toLocaleString('en-IN')}</div>
    <div class="ln"></div>
    <div class="row"><span>Ref</span><span class="b">${ref}</span></div>
    <div class="row"><span>Orders</span><span>${stats.orders_today}</span></div>
    <div class="ln"></div>
    <div class="row"><span>Taxable</span><span>${fmt(taxable)}</span></div>
    <div class="row"><span>CGST (2.5%)</span><span>${fmt(cgst)}</span></div>
    <div class="row"><span>SGST (2.5%)</span><span>${fmt(sgst)}</span></div>
    <div class="ln"></div>
    <div class="row big"><span>TOTAL</span><span>${fmt(total)}</span></div>
    <div class="ln"></div>
    <div class="row"><span>Cash</span><span>${fmt(payment.cash)}</span></div>
    <div class="row"><span>UPI</span><span>${fmt(payment.upi)}</span></div>
    <div class="row"><span>Card</span><span>${fmt(payment.card)}</span></div>
    <div class="ln"></div>
    <div class="c">*** END OF Z-REPORT ***</div>
    </body></html>`);
    w.document.close();
    w.print();
  };

  return (
    <div className="card p-6 max-w-lg mx-auto font-mono text-sm">
      <div className="text-center mb-4">
        <p className="text-content-primary font-black text-lg">Z-REPORT</p>
        <p className="text-content-muted text-xs">
          Spice Garden · GST: 29ABCDE1234F1Z5
        </p>
        <p className="text-content-muted text-xs">
          {now.toLocaleString('en-IN')}
        </p>
      </div>
      <div className="border-t border-dashed border-border-strong my-3" />
      <div className="flex justify-between">
        <span className="text-content-muted">Report Ref</span>
        <span className="font-bold text-content-primary">{ref}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-content-muted">Total Orders</span>
        <span className="font-bold text-content-primary">{stats.orders_today}</span>
      </div>
      <div className="border-t border-dashed border-border-strong my-3" />
      <p className="text-content-secondary font-bold text-xs uppercase tracking-wider mb-2">
        GST Breakdown
      </p>
      <div className="flex justify-between text-content-secondary">
        <span>Taxable Sales</span>
        <span>{fmt(taxable)}</span>
      </div>
      <div className="flex justify-between text-content-muted text-xs">
        <span>CGST @ 2.5%</span>
        <span>{fmt(cgst)}</span>
      </div>
      <div className="flex justify-between text-content-muted text-xs">
        <span>SGST @ 2.5%</span>
        <span>{fmt(sgst)}</span>
      </div>
      <div className="border-t border-dashed border-border-strong my-3" />
      <div className="flex justify-between text-xl font-black text-content-primary">
        <span>TOTAL</span>
        <span className="text-brand-700">{fmt(total)}</span>
      </div>
      <div className="border-t border-dashed border-border-strong my-3" />
      <p className="text-content-secondary font-bold text-xs uppercase tracking-wider mb-2">
        Payment Breakdown
      </p>
      <div className="flex justify-between text-content-secondary items-center">
        <span className="flex items-center gap-1.5">
          <Banknote className="h-3.5 w-3.5" />
          Cash
        </span>
        <span className="font-bold">{fmt(payment.cash)}</span>
      </div>
      <div className="flex justify-between text-content-secondary items-center">
        <span className="flex items-center gap-1.5">
          <Smartphone className="h-3.5 w-3.5" />
          UPI
        </span>
        <span className="font-bold">{fmt(payment.upi)}</span>
      </div>
      <div className="flex justify-between text-content-secondary items-center">
        <span className="flex items-center gap-1.5">
          <CreditCard className="h-3.5 w-3.5" />
          Card
        </span>
        <span className="font-bold">{fmt(payment.card)}</span>
      </div>
      <div className="border-t border-dashed border-border-strong my-3" />
      <div className="text-center text-content-muted text-xs">
        *** END OF Z-REPORT ***
      </div>
      <button
        onClick={print}
        className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-surface-3 border border-border hover:bg-surface-4 text-content-secondary text-sm font-semibold transition-colors"
      >
        <Printer className="h-4 w-4" /> Print Z-Report
      </button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
type Tab = 'overview' | 'zreport' | 'items';

export default function AnalyticsPage() {
  const [range, setRange] = useState<Range>('today');
  const [tab, setTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [trend, setTrend] = useState<TrendData | null>(null);
  const [payment, setPayment] = useState<PaymentMix>({ cash: 0, upi: 0, card: 0 });
  const [topItems, setTopItems] = useState<DashboardStats['top_sellers']>([]);
  const [tableTurn, setTableTurn] = useState<TableTurnData | null>(null);

  const days = range === 'today' ? 1 : range === 'week' ? 7 : 30;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    async function load() {
      try {
        const [dashboard, trendData, payMix, turn, sellers] = await Promise.all([
          fetchJSON<DashboardStats>(`${API_BASE}/analytics/dashboard-stats`),
          fetchJSON<TrendData>(`${API_BASE}/analytics/revenue-trend?days=${days}`),
          fetchJSON<PaymentMix>(`${API_BASE}/analytics/payment-mix?days=${days}`),
          fetchJSON<TableTurnData>(`${API_BASE}/analytics/table-turn`),
          range !== 'today'
            ? fetchJSON<DashboardStats['top_sellers']>(
                `${API_BASE}/analytics/top-sellers?period=${range}`,
              )
            : Promise.resolve([]),
        ]);

        if (cancelled) return;
        setStats(dashboard);
        setTrend(trendData);
        setPayment(payMix);
        setTableTurn(turn);
        setTopItems(range === 'today' ? dashboard.top_sellers : sellers);
      } catch (e) {
        console.error('Analytics fetch failed', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [range, days]);

  const revenue = stats?.revenue_today ?? 0;
  const orders = stats?.orders_today ?? 0;
  const avgCheck = stats?.avg_check ?? 0;
  const tableTurnTime = tableTurn?.averageTurnTimeMinutes ?? 0;
  const revTrend = stats
    ? stats.revenue_yesterday > 0
      ? Math.round(
          ((stats.revenue_today - stats.revenue_yesterday) /
            stats.revenue_yesterday) *
            100,
        )
      : 0
    : 0;
  const ordTrend = stats
    ? stats.revenue_last_week > 0
      ? Math.round(
          ((stats.revenue_today - stats.revenue_last_week) /
            Math.max(stats.revenue_last_week, 1)) *
            100,
        )
      : 0
    : 0;

  const RANGES: { key: Range; label: string }[] = [
    { key: 'today', label: 'Today' },
    { key: 'week', label: 'This Week' },
    { key: 'month', label: 'This Month' },
  ];
  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    {
      key: 'overview',
      label: 'Overview',
      icon: <BarChart3 className="h-3.5 w-3.5" />,
    },
    {
      key: 'zreport',
      label: 'Z-Report',
      icon: <FileText className="h-3.5 w-3.5" />,
    },
    {
      key: 'items',
      label: 'Top Items',
      icon: <TrendingUp className="h-3.5 w-3.5" />,
    },
  ];

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
          <div className="h-8 w-8 rounded-xl bg-violet-600 flex items-center justify-center">
            <BarChart3 className="h-4 w-4 text-white" />
          </div>
          <div>
            <h1 className="text-content-primary font-black text-sm">
              Analytics & Reports
            </h1>
            <p className="text-content-muted text-xs flex items-center gap-1">
              <CalendarDays className="h-3 w-3" />{' '}
              {new Date().toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>
        {/* Range selector */}
        <div className="ml-auto flex items-center gap-1.5 bg-surface-3 p-1 rounded-xl border border-border">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                range === r.key
                  ? 'bg-white text-content-primary shadow-sm border border-border'
                  : 'text-content-muted hover:text-content-secondary',
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </header>

      <div className="max-w-screen-xl mx-auto px-4 py-6 space-y-6">
        {/* Tab nav */}
        <div className="flex items-center gap-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all border',
                tab === t.key
                  ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                  : 'bg-white text-content-secondary border-border hover:bg-surface-3',
              )}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
          </div>
        )}

        {/* ── Overview ───────────────────────────────────────────────────── */}
        {tab === 'overview' && !loading && (
          <div className="space-y-6">
            {/* KPI row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="Revenue"
                value={fmt(revenue)}
                trend={revTrend}
                trendLabel="vs prev"
                icon={<IndianRupee className="h-4 w-4" />}
                accentColor="blue"
              />
              <StatCard
                label="Orders"
                value={orders}
                trend={ordTrend}
                trendLabel="vs prev"
                icon={<ShoppingBag className="h-4 w-4" />}
                accentColor="green"
              />
              <StatCard
                label="Avg Check"
                value={fmt(avgCheck)}
                icon={<TrendingUp className="h-4 w-4" />}
                accentColor="violet"
              />
              <StatCard
                label="Table Turn"
                value={String(tableTurnTime)}
                suffix=" min"
                icon={<Clock className="h-4 w-4" />}
                accentColor={tableTurnTime > 45 ? 'amber' : 'green'}
              />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="card p-5">
                <p className="text-content-primary font-bold text-sm mb-4 flex items-center gap-2">
                  <IndianRupee className="h-4 w-4 text-blue-500" />
                  Revenue Trend
                </p>
                {trend && trend.revenue.length > 0 ? (
                  <LineChart
                    data={trend.revenue}
                    labels={trend.labels}
                    color="#3B82F6"
                  />
                ) : (
                  <div className="h-[140px] flex items-center justify-center text-content-muted text-sm">
                    No data available
                  </div>
                )}
              </div>
              <div className="card p-5">
                <p className="text-content-primary font-bold text-sm mb-4 flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4 text-violet-500" />
                  Orders
                </p>
                {trend && trend.orders.length > 0 ? (
                  <BarChart
                    data={trend.orders}
                    labels={trend.labels}
                    color="#8B5CF6"
                  />
                ) : (
                  <div className="h-[120px] flex items-center justify-center text-content-muted text-sm">
                    No data available
                  </div>
                )}
              </div>
            </div>

            {/* Payment mix */}
            <div className="card p-5">
              <p className="text-content-primary font-bold text-sm mb-4 flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-emerald-500" />
                Payment Mix
              </p>
              <div className="flex flex-wrap gap-8 items-center">
                <Donut
                  cash={payment.cash}
                  upi={payment.upi}
                  card={payment.card}
                />
                <div className="flex gap-4 flex-wrap">
                  {[
                    {
                      l: 'Cash',
                      v: payment.cash,
                      c: 'bg-emerald-100 text-emerald-700',
                    },
                    {
                      l: 'UPI',
                      v: payment.upi,
                      c: 'bg-violet-100 text-violet-700',
                    },
                    {
                      l: 'Card',
                      v: payment.card,
                      c: 'bg-blue-100 text-blue-700',
                    },
                  ].map((p) => (
                    <div
                      key={p.l}
                      className={cn(
                        'px-4 py-3 rounded-xl border text-center min-w-[100px]',
                        p.c,
                      )}
                    >
                      <p className="text-xs font-semibold opacity-70">{p.l}</p>
                      <p className="text-lg font-black">{fmt(p.v)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Z-Report ───────────────────────────────────────────────────── */}
        {tab === 'zreport' && !loading && stats && (
          <ZReport stats={stats} payment={payment} />
        )}

        {/* ── Top Items ──────────────────────────────────────────────────── */}
        {tab === 'items' && !loading && (
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <p className="text-content-primary font-bold">
                Top Performing Items
              </p>
              <span className="text-content-muted text-xs">
                {range === 'today'
                  ? 'Today'
                  : range === 'week'
                    ? 'This Week'
                    : 'This Month'}
              </span>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-surface-2 border-b border-border">
                <tr>
                  {['#', 'Item', 'Qty', 'Revenue', 'Trend'].map((h) => (
                    <th
                      key={h}
                      className="text-left px-5 py-3 text-xs font-bold text-content-muted uppercase tracking-wide"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {topItems.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-8 text-center text-content-muted text-sm"
                    >
                      No sales data for this period.
                    </td>
                  </tr>
                )}
                {topItems.map((item, i) => (
                  <tr
                    key={item.id}
                    className="hover:bg-surface-2 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <span
                        className={cn(
                          'h-6 w-6 rounded-lg flex items-center justify-center text-xs font-bold',
                          i === 0
                            ? 'bg-amber-100 text-amber-700'
                            : i === 1
                              ? 'bg-slate-100 text-slate-600'
                              : i === 2
                                ? 'bg-orange-100 text-orange-600'
                                : 'bg-surface-3 text-content-muted',
                        )}
                      >
                        {i + 1}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-content-primary font-semibold">
                      {item.name}
                    </td>
                    <td className="px-5 py-3.5 text-content-secondary">
                      {item.qty}
                    </td>
                    <td className="px-5 py-3.5 text-content-primary font-bold">
                      {fmt(item.revenue)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="flex items-center gap-1 text-xs font-bold text-emerald-600">
                        <TrendingUp className="h-3.5 w-3.5" />
                        --
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
