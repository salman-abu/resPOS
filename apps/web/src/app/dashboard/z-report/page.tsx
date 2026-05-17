'use client';
import { useEffect, useState, useCallback } from 'react';
import { API_BASE } from '@/lib/api';
import { getAuthToken } from '@respos/utils';
import {
  TrendingUp,
  Banknote,
  CreditCard,
  Smartphone,
  ShoppingBag,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  RefreshCw,
} from 'lucide-react';

interface ZReport {
  shift_id: string;
  opened_at: string;
  closed_at?: string;
  cashier_id: string;
  opening_float: number;
  closing_float?: number;
  petty_cash?: number;
  gross_sales: number;
  total_discount: number;
  total_tax: number;
  net_sales: number;
  total_orders: number;
  void_orders: number;
  payment_summary: Record<string, number>;
  source_summary?: Record<string, number>;
  cash_expected?: number;
  cash_variance?: number;
}

const fmt = (p: number) =>
  `₹${(p / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
const METHOD_ICON: Record<string, React.ElementType> = {
  CASH: Banknote,
  CARD: CreditCard,
  UPI: Smartphone,
  WALLET: ShoppingBag,
};
const METHOD_COLOR: Record<string, string> = {
  CASH: '#22c55e',
  CARD: '#38bdf8',
  UPI: '#818cf8',
  WALLET: '#f97316',
};

function StatBox({
  label,
  value,
  sub,
  color,
  icon: Icon,
}: {
  label: string;
  value: string;
  sub?: string;
  color?: string;
  icon?: React.ElementType;
}) {
  return (
    <div
      className="rounded-xl p-4 space-y-1"
      style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
      }}
    >
      <div className="flex items-center justify-between">
        <span
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: 'var(--text-muted)' }}
        >
          {label}
        </span>
        {Icon && (
          <Icon size={16} style={{ color: color ?? 'var(--text-muted)' }} />
        )}
      </div>
      <p
        className="text-2xl font-black"
        style={{ color: color ?? 'var(--text-primary)' }}
      >
        {value}
      </p>
      {sub && (
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {sub}
        </p>
      )}
    </div>
  );
}

export default function ZReportPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<{ shift: any; z_report?: ZReport } | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [closing, setClosing] = useState(false);
  const [closingFloat, setClosingFloat] = useState('');
  const [pettyCash, setPettyCash] = useState('0');

  const API = API_BASE;
  const token = getAuthToken();

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/billing/shift/z-report`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('No shift data found');
      const d = await res.json();
      setData(d);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [API, token]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleClose = async () => {
    if (!closingFloat) {
      setError('Enter closing float');
      return;
    }
    setClosing(true);
    setError('');
    try {
      const res = await fetch(`${API}/billing/shift/close`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          closing_float: Math.round(Number(closingFloat) * 100),
          petty_cash: Math.round(Number(pettyCash) * 100),
        }),
      });
      if (!res.ok) throw new Error((await res.json()).message);
      const d = await res.json();
      setData(d);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setClosing(false);
    }
  };

  const report: ZReport | undefined =
    data?.z_report ??
    (data?.shift?.z_report_data
      ? (data.shift.z_report_data as ZReport)
      : undefined);
  const shift = data?.shift;
  const isOpen = shift?.status === 'OPEN';

  return (
    <div className="min-h-screen p-6" style={{ background: 'var(--bg-base)' }}>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1
              className="text-2xl font-black"
              style={{ color: 'var(--text-primary)' }}
            >
              Z-Report
            </h1>
            <p
              className="text-sm mt-0.5"
              style={{ color: 'var(--text-muted)' }}
            >
              Daily Shift Summary
            </p>
          </div>
          <button
            onClick={fetchReport}
            className="p-2.5 rounded-xl transition-colors"
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              color: 'var(--text-muted)',
            }}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {loading && !data && (
          <div className="flex items-center justify-center py-24">
            <Loader2
              size={32}
              className="animate-spin"
              style={{ color: 'var(--brand)' }}
            />
          </div>
        )}

        {error && !data && (
          <div
            className="rounded-xl p-4 text-center"
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
            }}
          >
            <AlertTriangle
              size={32}
              className="mx-auto mb-2"
              style={{ color: '#f97316' }}
            />
            <p style={{ color: 'var(--text-secondary)' }}>{error}</p>
          </div>
        )}

        {shift && (
          <>
            {/* Shift Status Banner */}
            <div
              className="rounded-xl px-4 py-3 flex items-center gap-3"
              style={{
                background: isOpen ? '#22c55e22' : '#6366f122',
                border: `1px solid ${isOpen ? '#22c55e' : '#6366f1'}`,
              }}
            >
              {isOpen ? (
                <CheckCircle2 size={20} style={{ color: '#22c55e' }} />
              ) : (
                <CheckCircle2 size={20} style={{ color: '#6366f1' }} />
              )}
              <div>
                <p
                  className="text-sm font-bold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Shift {isOpen ? 'OPEN' : 'CLOSED'}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Opened: {new Date(shift.opened_at).toLocaleString('en-IN')}
                  {shift.closed_at &&
                    ` · Closed: ${new Date(shift.closed_at).toLocaleString('en-IN')}`}
                </p>
              </div>
            </div>

            {/* Sales Overview */}
            {report && (
              <>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <StatBox
                    label="Gross Sales"
                    value={fmt(report.gross_sales)}
                    icon={TrendingUp}
                    color="#22c55e"
                  />
                  <StatBox
                    label="Net Sales"
                    value={fmt(report.net_sales)}
                    sub={`After ₹${fmt(report.total_discount)} discount`}
                    color="#6366f1"
                  />
                  <StatBox
                    label="Total Tax"
                    value={fmt(report.total_tax)}
                    sub="GST collected"
                  />
                  <StatBox
                    label="Orders"
                    value={String(report.total_orders)}
                    icon={ShoppingBag}
                  />
                  <StatBox
                    label="Void Orders"
                    value={String(report.void_orders)}
                    color={report.void_orders > 0 ? '#ef4444' : undefined}
                    icon={AlertTriangle}
                  />
                  <StatBox
                    label="Opening Float"
                    value={fmt(report.opening_float)}
                  />
                </div>

                {/* Payment Breakdown */}
                <div
                  className="rounded-xl p-4"
                  style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <p
                    className="text-xs font-semibold uppercase tracking-wider mb-3"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Payment Breakdown
                  </p>
                  <div className="space-y-3">
                    {Object.entries(report.payment_summary).map(
                      ([method, amount]) => {
                        const Icon = METHOD_ICON[method] ?? Banknote;
                        const color = METHOD_COLOR[method] ?? '#888';
                        const pct =
                          report.gross_sales > 0
                            ? (amount / report.gross_sales) * 100
                            : 0;
                        return (
                          <div key={method}>
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <Icon size={14} style={{ color }} />
                                <span
                                  className="text-sm font-semibold"
                                  style={{ color: 'var(--text-primary)' }}
                                >
                                  {method}
                                </span>
                              </div>
                              <span
                                className="text-sm font-bold"
                                style={{ color }}
                              >
                                {fmt(amount)}
                              </span>
                            </div>
                            <div
                              className="h-1.5 rounded-full overflow-hidden"
                              style={{ background: 'var(--border)' }}
                            >
                              <div
                                className="h-full rounded-full transition-all"
                                style={{ width: `${pct}%`, background: color }}
                              />
                            </div>
                          </div>
                        );
                      },
                    )}
                  </div>
                </div>

                {/* Source Breakdown (Dine-in vs Online) */}
                <div
                  className="rounded-xl p-4"
                  style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <p
                    className="text-xs font-semibold uppercase tracking-wider mb-3"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Revenue by Source
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(report.source_summary || {}).map(
                      ([source, amount]) => (
                        <div key={source} className="flex flex-col">
                          <span className="text-[10px] font-black uppercase text-content-muted">
                            {source === 'POS' ? 'Dine-in / Direct' : source}
                          </span>
                          <span className="text-sm font-bold text-content-primary">
                            {fmt(amount as number)}
                          </span>
                        </div>
                      ),
                    )}
                  </div>
                </div>

                {/* Cash Reconciliation */}
                {report.cash_expected !== undefined && (
                  <div
                    className="rounded-xl p-4"
                    style={{
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <p
                      className="text-xs font-semibold uppercase tracking-wider mb-3"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      Cash Reconciliation
                    </p>
                    <div className="space-y-2">
                      {[
                        {
                          label: 'Opening Float',
                          val: fmt(report.opening_float),
                        },
                        {
                          label: 'Cash Sales',
                          val: fmt(report.payment_summary['CASH'] ?? 0),
                        },
                        {
                          label: 'Petty Cash Out',
                          val: `- ${fmt(report.petty_cash ?? 0)}`,
                        },
                        {
                          label: 'Expected in Drawer',
                          val: fmt(report.cash_expected),
                        },
                        {
                          label: 'Actual Closing Float',
                          val:
                            report.closing_float !== undefined
                              ? fmt(report.closing_float)
                              : '—',
                        },
                      ].map((r, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span style={{ color: 'var(--text-muted)' }}>
                            {r.label}
                          </span>
                          <span
                            style={{
                              color: 'var(--text-primary)',
                              fontWeight: 600,
                            }}
                          >
                            {r.val}
                          </span>
                        </div>
                      ))}
                      {report.cash_variance !== undefined && (
                        <div
                          className="flex justify-between text-sm pt-2"
                          style={{ borderTop: '1px solid var(--border)' }}
                        >
                          <span style={{ color: 'var(--text-muted)' }}>
                            Variance
                          </span>
                          <span
                            style={{
                              color:
                                report.cash_variance < 0
                                  ? '#ef4444'
                                  : '#22c55e',
                              fontWeight: 700,
                            }}
                          >
                            {report.cash_variance > 0 ? '+' : ''}
                            {fmt(report.cash_variance)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Close Shift (only if open) */}
            {isOpen && !report && (
              <div
                className="rounded-xl p-5 space-y-4"
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                }}
              >
                <p
                  className="font-bold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Close Shift
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      className="text-xs font-semibold block mb-1"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      Closing Float (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={closingFloat}
                      onChange={(e) => setClosingFloat(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                      style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-primary)',
                      }}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label
                      className="text-xs font-semibold block mb-1"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      Petty Cash Out (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={pettyCash}
                      onChange={(e) => setPettyCash(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                      style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-primary)',
                      }}
                      placeholder="0.00"
                    />
                  </div>
                </div>
                {error && (
                  <p className="text-xs text-red-400 bg-red-400/10 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}
                <button
                  onClick={handleClose}
                  disabled={closing}
                  className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                  style={{
                    background: 'linear-gradient(135deg,#ef4444,#dc2626)',
                    color: '#fff',
                  }}
                >
                  {closing && <Loader2 size={16} className="animate-spin" />}
                  Close Shift & Print Z-Report
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
