'use client';
import { useState, useCallback } from 'react';
import {
  X,
  Plus,
  Trash2,
  CreditCard,
  Banknote,
  Smartphone,
  Gift,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

type PayMethod = 'CASH' | 'CARD' | 'UPI' | 'COMPLIMENTARY';
interface PayLine {
  id: string;
  method: PayMethod;
  amount: string;
  upi_ref?: string;
  transaction_id?: string;
}
interface CartTotals {
  subtotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  service_charge: number;
  discount: number;
  total: number;
}
interface Props {
  orderId: string;
  totals: CartTotals;
  tableNumber?: string;
  onSuccess: (invoiceId: string) => void;
  onClose: () => void;
}

import { LucideIcon } from 'lucide-react';

const METHOD_META: Record<
  PayMethod,
  { label: string; icon: LucideIcon; color: string }
> = {
  CASH: { label: 'Cash', icon: Banknote, color: '#22c55e' },
  UPI: { label: 'UPI', icon: Smartphone, color: '#818cf8' },
  CARD: { label: 'Card', icon: CreditCard, color: '#38bdf8' },
  COMPLIMENTARY: { label: 'Comp', icon: Gift, color: '#f97316' },
};
const QUICK = [50, 100, 200, 500, 1000];
const fmt = (p: number) => (p / 100).toFixed(2);
let _uid = 0;
const nid = () => String(++_uid);

function Row({
  label,
  val,
  muted,
  accent,
  bold,
}: {
  label: string;
  val: string;
  muted?: boolean;
  accent?: string;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span
        style={{ color: muted ? 'var(--text-muted)' : 'var(--text-secondary)' }}
      >
        {label}
      </span>
      <span
        style={{
          color:
            accent ?? (bold ? 'var(--text-primary)' : 'var(--text-secondary)'),
          fontWeight: bold ? 700 : 500,
        }}
      >
        {val}
      </span>
    </div>
  );
}

export default function PaymentModal({
  orderId,
  totals,
  tableNumber,
  onSuccess,
  onClose,
}: Props) {
  const [discount, setDiscount] = useState('0');
  const [dType, setDType] = useState<'FLAT' | 'PERCENT'>('FLAT');
  const [lines, setLines] = useState<PayLine[]>([
    { id: nid(), method: 'CASH', amount: '' },
  ]);
  const [step, setStep] = useState<'billing' | 'payment' | 'success'>(
    'billing',
  );
  const [invoiceId, setInvoiceId] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
  const token =
    typeof window !== 'undefined'
      ? (localStorage.getItem('rpos_token') ?? '')
      : '';

  const discAmt =
    dType === 'PERCENT'
      ? Math.round(totals.subtotal * (Number(discount) / 100))
      : Math.round(Number(discount) * 100);
  const billTotal =
    totals.subtotal +
    totals.cgst +
    totals.sgst +
    totals.igst +
    totals.service_charge -
    discAmt;
  const paidSoFar = lines.reduce(
    (s, l) => s + (Number(l.amount) || 0) * 100,
    0,
  );
  const balance = billTotal - paidSoFar;

  const addLine = () =>
    setLines((p) => [...p, { id: nid(), method: 'CASH', amount: '' }]);
  const removeLine = (id: string) =>
    setLines((p) => p.filter((l) => l.id !== id));
  const updateLine = (id: string, patch: Partial<PayLine>) =>
    setLines((p) => p.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  const setExact = (id: string) => {
    const other = lines
      .filter((l) => l.id !== id)
      .reduce((s, l) => s + (Number(l.amount) || 0) * 100, 0);
    const rem = (invoiceData?.invoice?.total ?? billTotal) - other;
    if (rem > 0) updateLine(id, { amount: fmt(rem) });
  };

  const handleGenerate = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/billing/invoice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          order_id: orderId,
          discount: discAmt,
          discount_type: dType,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).message ?? 'Failed');
      const data = await res.json();
      setInvoiceId(data.invoice.id);
      setInvoiceData(data);
      setStep('payment');
      setLines([
        { id: nid(), method: 'CASH', amount: fmt(data.invoice.total) },
      ]);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [orderId, discAmt, dType, API, token]);

  const handleSettle = useCallback(async () => {
    if (balance > 0) {
      setError(`Still ₹${fmt(balance)} pending`);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/billing/invoice/${invoiceId}/settle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          payments: lines.map((l) => ({
            amount: Math.round(Number(l.amount) * 100),
            method: l.method,
            upi_ref: l.upi_ref,
            transaction_id: l.transaction_id,
          })),
        }),
      });
      if (!res.ok) throw new Error((await res.json()).message ?? 'Failed');
      setStep('success');
      onSuccess(invoiceId);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [invoiceId, lines, balance, API, token, onSuccess]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl overflow-hidden"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
        }}
      >
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{
            borderBottom: '1px solid var(--border)',
            background: 'var(--bg-elevated)',
          }}
        >
          <div>
            <h2
              className="text-lg font-bold"
              style={{ color: 'var(--text-primary)' }}
            >
              {step === 'billing'
                ? '🧾 Generate Bill'
                : step === 'payment'
                  ? '💳 Collect Payment'
                  : '✅ Settled!'}
            </h2>
            {tableNumber && (
              <p
                className="text-xs mt-0.5"
                style={{ color: 'var(--text-muted)' }}
              >
                Table {tableNumber}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl transition-colors hover:bg-red-500/10"
            style={{ color: 'var(--text-muted)' }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {step === 'success' && (
            <div className="text-center py-8 space-y-4">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
                style={{ background: '#22c55e22' }}
              >
                <CheckCircle2 size={40} style={{ color: '#22c55e' }} />
              </div>
              <div>
                <p
                  className="text-xl font-bold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Payment Complete
                </p>
                <p
                  className="text-sm mt-1"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Invoice #{invoiceData?.invoice?.invoice_number}
                </p>
              </div>
              <p className="text-3xl font-black" style={{ color: '#22c55e' }}>
                ₹{fmt(invoiceData?.invoice?.total ?? 0)}
              </p>
              {balance < 0 && (
                <div
                  className="rounded-xl p-3"
                  style={{
                    background: '#f9731622',
                    border: '1px solid #f97316',
                  }}
                >
                  <p
                    className="text-sm font-semibold"
                    style={{ color: '#f97316' }}
                  >
                    Change: ₹{fmt(Math.abs(balance))}
                  </p>
                </div>
              )}
              <button
                onClick={onClose}
                className="w-full py-3 rounded-xl font-bold text-sm"
                style={{ background: 'var(--brand)', color: '#fff' }}
              >
                Done
              </button>
            </div>
          )}

          {step === 'billing' && (
            <>
              <div
                className="rounded-xl p-4 space-y-2"
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                }}
              >
                <Row label="Subtotal" val={`₹${fmt(totals.subtotal)}`} />
                {totals.cgst > 0 && (
                  <Row label="CGST" val={`₹${fmt(totals.cgst)}`} muted />
                )}
                {totals.sgst > 0 && (
                  <Row label="SGST" val={`₹${fmt(totals.sgst)}`} muted />
                )}
                {totals.igst > 0 && (
                  <Row label="IGST" val={`₹${fmt(totals.igst)}`} muted />
                )}
                {discAmt > 0 && (
                  <Row
                    label="Discount"
                    val={`- ₹${fmt(discAmt)}`}
                    accent="#ef4444"
                  />
                )}
                <div
                  className="pt-2"
                  style={{ borderTop: '1px solid var(--border)' }}
                >
                  <Row label="Total" val={`₹${fmt(billTotal)}`} bold />
                </div>
              </div>
              <div>
                <label
                  className="text-xs font-semibold mb-2 block"
                  style={{ color: 'var(--text-muted)' }}
                >
                  DISCOUNT (optional)
                </label>
                <div className="flex gap-2">
                  <div
                    className="flex rounded-xl overflow-hidden"
                    style={{ border: '1px solid var(--border)' }}
                  >
                    {(['FLAT', 'PERCENT'] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setDType(t)}
                        className="px-3 py-2 text-xs font-bold transition-colors"
                        style={{
                          background:
                            dType === t ? 'var(--brand)' : 'transparent',
                          color: dType === t ? '#fff' : 'var(--text-muted)',
                        }}
                      >
                        {t === 'FLAT' ? '₹' : '%'}
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    className="flex-1 px-4 py-2 rounded-xl text-sm outline-none"
                    style={{
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-primary)',
                    }}
                    placeholder="0"
                  />
                </div>
              </div>
              {error && (
                <p className="text-xs text-red-400 bg-red-400/10 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                style={{
                  background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                  color: '#fff',
                }}
              >
                {loading && <Loader2 size={18} className="animate-spin" />}
                Generate Invoice
              </button>
            </>
          )}

          {step === 'payment' && invoiceData && (
            <>
              <div
                className="rounded-xl p-4 text-center"
                style={{
                  background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                }}
              >
                <p className="text-xs font-semibold opacity-70 text-white">
                  Bill Total
                </p>
                <p className="text-3xl font-black text-white mt-0.5">
                  ₹{fmt(invoiceData.invoice.total)}
                </p>
                <p className="text-xs text-white/70 mt-0.5">
                  {invoiceData.invoice.invoice_number}
                </p>
              </div>
              <div
                className="rounded-xl p-3 flex items-center justify-between"
                style={{
                  background:
                    balance === 0
                      ? '#22c55e22'
                      : balance < 0
                        ? '#f9731622'
                        : 'var(--bg-elevated)',
                  border: `1px solid ${balance === 0 ? '#22c55e' : balance < 0 ? '#f97316' : 'var(--border)'}`,
                }}
              >
                <span
                  className="text-xs font-semibold"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {balance > 0
                    ? 'Remaining'
                    : balance < 0
                      ? 'Change Due'
                      : 'Exact ✓'}
                </span>
                <span
                  className="text-lg font-black"
                  style={{
                    color:
                      balance === 0
                        ? '#22c55e'
                        : balance < 0
                          ? '#f97316'
                          : 'var(--text-primary)',
                  }}
                >
                  ₹{fmt(Math.abs(balance))}
                </span>
              </div>
              <div className="space-y-3">
                {lines.map((line) => {
                  const meta = METHOD_META[line.method];
                  return (
                    <div
                      key={line.id}
                      className="rounded-xl p-3 space-y-2"
                      style={{
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1 flex-1 flex-wrap">
                          {(Object.keys(METHOD_META) as PayMethod[]).map(
                            (m) => {
                              const M = METHOD_META[m];
                              const MI = M.icon;
                              return (
                                <button
                                  key={m}
                                  onClick={() =>
                                    updateLine(line.id, { method: m })
                                  }
                                  className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold transition-all"
                                  style={{
                                    background:
                                      line.method === m
                                        ? M.color + '33'
                                        : 'transparent',
                                    border: `1px solid ${line.method === m ? M.color : 'var(--border)'}`,
                                    color:
                                      line.method === m
                                        ? M.color
                                        : 'var(--text-muted)',
                                  }}
                                >
                                  <MI size={12} />
                                  {M.label}
                                </button>
                              );
                            },
                          )}
                        </div>
                        {lines.length > 1 && (
                          <button
                            onClick={() => removeLine(line.id)}
                            className="p-1.5 rounded-lg hover:bg-red-500/20"
                            style={{ color: '#ef4444' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <span
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold"
                            style={{ color: meta.color }}
                          >
                            ₹
                          </span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={line.amount}
                            onChange={(e) =>
                              updateLine(line.id, { amount: e.target.value })
                            }
                            className="w-full pl-7 pr-3 py-2 rounded-xl text-sm font-bold outline-none"
                            style={{
                              background: 'var(--bg-card)',
                              border: `1px solid ${meta.color}55`,
                              color: 'var(--text-primary)',
                            }}
                            placeholder="0.00"
                          />
                        </div>
                        <button
                          onClick={() => setExact(line.id)}
                          className="px-3 py-2 rounded-xl text-xs font-bold"
                          style={{
                            background: meta.color + '22',
                            color: meta.color,
                            border: `1px solid ${meta.color}`,
                          }}
                        >
                          Exact
                        </button>
                      </div>
                      {line.method === 'CASH' && (
                        <div className="flex gap-1 flex-wrap">
                          {QUICK.map((a) => (
                            <button
                              key={a}
                              onClick={() =>
                                updateLine(line.id, { amount: String(a) })
                              }
                              className="px-2 py-1 rounded-lg text-xs font-semibold"
                              style={{
                                background: 'var(--bg-card)',
                                border: '1px solid var(--border)',
                                color: 'var(--text-muted)',
                              }}
                            >
                              ₹{a}
                            </button>
                          ))}
                        </div>
                      )}
                      {line.method === 'UPI' && (
                        <input
                          type="text"
                          placeholder="UPI Ref (optional)"
                          value={line.upi_ref ?? ''}
                          onChange={(e) =>
                            updateLine(line.id, { upi_ref: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-xl text-xs outline-none"
                          style={{
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border)',
                            color: 'var(--text-primary)',
                          }}
                        />
                      )}
                      {line.method === 'CARD' && (
                        <input
                          type="text"
                          placeholder="Transaction ID (optional)"
                          value={line.transaction_id ?? ''}
                          onChange={(e) =>
                            updateLine(line.id, {
                              transaction_id: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 rounded-xl text-xs outline-none"
                          style={{
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border)',
                            color: 'var(--text-primary)',
                          }}
                        />
                      )}
                    </div>
                  );
                })}
                <button
                  onClick={addLine}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
                  style={{
                    border: '1px dashed var(--border)',
                    color: 'var(--text-muted)',
                  }}
                >
                  <Plus size={14} /> Split Payment
                </button>
              </div>
              {error && (
                <p className="text-xs text-red-400 bg-red-400/10 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}
              <button
                onClick={handleSettle}
                disabled={loading || balance > 0}
                className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg,#22c55e,#16a34a)',
                  color: '#fff',
                }}
              >
                {loading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={18} />
                )}
                {balance > 0
                  ? `₹${fmt(balance)} Remaining`
                  : 'Confirm & Settle'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
