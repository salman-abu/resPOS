'use client';
import { useState, useCallback, useEffect } from 'react';
import { API_BASE } from '@/lib/api';
import { getAuthToken } from '@respos/utils';
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
  AlertCircle,
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
import { cn } from '@/lib/utils';

const METHOD_META: Record<
  PayMethod,
  { label: string; icon: LucideIcon; color: string; bg: string; border: string }
> = {
  CASH: {
    label: 'Cash',
    icon: Banknote,
    color: '#84cc16',
    bg: 'bg-lime-500/10',
    border: 'border-lime-500/30',
  },
  UPI: {
    label: 'UPI',
    icon: Smartphone,
    color: '#22d3ee',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/30',
  },
  CARD: {
    label: 'Card',
    icon: CreditCard,
    color: '#a78bfa',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/30',
  },
  COMPLIMENTARY: {
    label: 'Comp',
    icon: Gift,
    color: '#f97316',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
  },
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
        className={cn(
          'text-xs font-bold uppercase tracking-wider',
          muted ? 'text-slate-500' : 'text-slate-400',
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          'font-mono tracking-tight',
          bold ? 'text-slate-100 font-black' : 'text-slate-300 font-bold',
        )}
        style={{
          fontVariantNumeric: 'tabular-nums',
          color: accent || undefined,
        }}
      >
        {val}
      </span>
    </div>
  );
}

import { useCartStore } from '@/store/cart';

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
  const [status, setStatus] = useState<'IDLE' | 'BUSY' | 'DONE'>('IDLE');
  const [error, setError] = useState<string | null>(null);
  const [isSplitMode, setIsSplitMode] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [orderItems, setOrderItems] = useState<any[]>([]);

  const [step, setStep] = useState<'billing' | 'payment' | 'success'>(
    'billing',
  );
  const [invoiceId, setInvoiceId] = useState('');
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const {
    customer: cartCustomer,
    redeem_points,
    rupees_per_point,
  } = useCartStore();

  const fetchOrderDetails = useCallback(async () => {
    const token = getAuthToken();
    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setOrderItems(
          data.order_items.filter(
            (oi: any) => !oi.invoice_id && oi.status !== 'VOID',
          ),
        );
      }
    } catch (e) {
      console.error('Fetch Order Error:', e);
    }
  }, [orderId]);

  useEffect(() => {
    if (isSplitMode) fetchOrderDetails();
  }, [isSplitMode, fetchOrderDetails]);

  const splitTotal = selectedItemIds.reduce((acc, id) => {
    const item = orderItems.find((oi) => oi.id === id);
    return acc + (item ? item.unit_price * item.quantity : 0);
  }, 0);

  const effectiveTotal = isSplitMode ? splitTotal : totals.total;

  const API = API_BASE;
  const token = getAuthToken();

  const discAmt =
    dType === 'PERCENT'
      ? Math.round(totals.subtotal * (Number(discount) / 100))
      : Math.round(Number(discount) * 100);
  const pointsDiscAmt = Math.round(redeem_points * rupees_per_point * 100);
  const billTotal =
    totals.subtotal +
    totals.cgst +
    totals.sgst +
    totals.igst +
    totals.service_charge -
    discAmt -
    pointsDiscAmt;
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
    setStatus('BUSY');
    setError(null);
    const token = getAuthToken();

    try {
      let res;
      if (isSplitMode) {
        if (selectedItemIds.length === 0)
          throw new Error('Select items to split');
        res = await fetch(`${API_BASE}/billing/invoice/split`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            order_id: orderId,
            splits: [{ itemIds: selectedItemIds }],
          }),
        });
      } else {
        res = await fetch(`${API_BASE}/billing/invoice`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            order_id: orderId,
            discount: Number(discount) * 100,
            service_charge: totals.service_charge,
          }),
        });
      }

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to generate invoice');
      }

      const data = await res.json();
      const invoiceObj = isSplitMode ? data[0] : data;
      setInvoiceData(invoiceObj);
      setInvoiceId(invoiceObj.invoice.id);
      setInvoiceData(invoiceObj);
      setStep('payment');
      setLines([
        { id: nid(), method: 'CASH', amount: fmt(invoiceObj.invoice.total) },
      ]);
      setStatus('DONE');
    } catch (err: any) {
      setError(err.message);
      setStatus('IDLE');
    }
  }, [orderId, isSplitMode, selectedItemIds, discount, totals.service_charge]);

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
          redeem_points,
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
  }, [invoiceId, lines, balance, API, token, onSuccess, redeem_points]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="relative w-full max-w-lg rounded-sm overflow-hidden border-2 border-slate-700"
        style={{ background: '#0B0F19' }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-slate-800 bg-slate-950">
          <div>
            <h2 className="text-lg font-black text-slate-100 uppercase tracking-widest">
              {step === 'billing'
                ? 'Generate Bill'
                : step === 'payment'
                  ? 'Collect Payment'
                  : 'Settled!'}
            </h2>
            {tableNumber && (
              <p className="text-xs mt-0.5 text-slate-500 font-mono tracking-tight uppercase">
                Table {tableNumber}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-500 active:text-slate-300 active:scale-[0.92] transition-all"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto bg-slate-900">
          {step === 'success' && (
            <div className="text-center py-8 space-y-4">
              <div className="w-20 h-20 bg-lime-500/10 border-2 border-lime-500/30 flex items-center justify-center mx-auto">
                <CheckCircle2 size={40} className="text-lime-400" />
              </div>
              <div>
                <p className="text-xl font-black text-slate-100 uppercase tracking-widest">
                  Payment Complete
                </p>
                <p className="text-sm mt-1 text-slate-500 font-mono tracking-tight uppercase">
                  Invoice #{invoiceData?.invoice?.invoice_number}
                </p>
              </div>
              <p
                className="text-3xl font-black text-lime-400 font-mono tracking-tight"
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                ₹{fmt(invoiceData?.invoice?.total ?? 0)}
              </p>
              {balance < 0 && (
                <div className="border-2 border-amber-500/30 bg-amber-500/10 p-3">
                  <p className="text-sm font-black text-amber-400 uppercase tracking-wider">
                    Change: ₹{fmt(Math.abs(balance))}
                  </p>
                </div>
              )}
              <button
                onClick={onClose}
                className="w-full py-3 border-2 border-cyan-500 bg-cyan-500 text-slate-900 font-black text-sm uppercase tracking-widest active:bg-cyan-400 active:scale-[0.97] transition-all duration-75"
              >
                Done
              </button>
            </div>
          )}

          {step === 'billing' && (
            <div className="space-y-6">
              {/* Split Toggle */}
              <div className="flex items-center justify-between">
                <h3 className="font-black text-lg text-slate-100 uppercase tracking-widest">
                  Bill Summary
                </h3>
                <button
                  onClick={() => setIsSplitMode(!isSplitMode)}
                  className={cn(
                    'px-4 py-1.5 text-xs font-black uppercase tracking-widest border-2 active:scale-[0.97] transition-all duration-75',
                    isSplitMode
                      ? 'bg-fuchsia-500 text-slate-900 border-fuchsia-400'
                      : 'bg-slate-800 text-slate-300 border-slate-700 active:bg-slate-700',
                  )}
                >
                  {isSplitMode ? 'Exit Split' : 'Split by Items'}
                </button>
              </div>

              {isSplitMode ? (
                <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2 scrollbar-none">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">
                    Select items for this payment
                  </p>
                  {orderItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        setSelectedItemIds((prev) =>
                          prev.includes(item.id)
                            ? prev.filter((id) => id !== item.id)
                            : [...prev, item.id],
                        );
                      }}
                      className={cn(
                        'p-3 border-2 cursor-pointer flex justify-between items-center active:scale-[0.98] transition-transform duration-75',
                        selectedItemIds.includes(item.id)
                          ? 'bg-fuchsia-500/10 border-fuchsia-500/40'
                          : 'bg-slate-800 border-slate-700 active:border-slate-600',
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'h-5 w-5 border-2 flex items-center justify-center transition-all',
                            selectedItemIds.includes(item.id)
                              ? 'bg-fuchsia-500 border-fuchsia-400 text-slate-900'
                              : 'border-slate-600',
                          )}
                        >
                          {selectedItemIds.includes(item.id) && (
                            <Plus size={12} strokeWidth={4} />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-slate-100 tracking-tight">
                            {item.item.name}
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono tracking-tight">
                            Qty: {item.quantity}
                          </p>
                        </div>
                      </div>
                      <span
                        className="font-black text-sm text-slate-100 font-mono tracking-tight"
                        style={{ fontVariantNumeric: 'tabular-nums' }}
                      >
                        ₹{fmt(item.unit_price * item.quantity)}
                      </span>
                    </div>
                  ))}
                  {orderItems.length === 0 && (
                    <p className="text-center py-10 text-slate-500 font-black uppercase text-[10px] tracking-[0.2em]">
                      No items left to bill
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="border-2 border-slate-800 bg-slate-950 p-4 space-y-2">
                    <Row label="Subtotal" val={`₹${fmt(totals.subtotal)}`} />
                    <Row
                      label="Taxes"
                      val={`₹${fmt(totals.cgst + totals.sgst)}`}
                    />
                    {totals.service_charge > 0 && (
                      <Row
                        label="Service Charge"
                        val={`₹${fmt(totals.service_charge)}`}
                      />
                    )}
                    {discAmt > 0 && (
                      <Row
                        label="Discount"
                        val={`- ₹${fmt(discAmt)}`}
                        accent="#f43f5e"
                      />
                    )}
                    {pointsDiscAmt > 0 && (
                      <Row
                        label="Points Discount"
                        val={`- ₹${fmt(pointsDiscAmt)}`}
                        accent="#d946ef"
                      />
                    )}
                  </div>
                </div>
              )}

              <div className="p-5 bg-cyan-500 flex justify-between items-center border-2 border-cyan-400">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">
                    Payable Now
                  </span>
                  <span className="text-sm font-bold text-slate-900/70">
                    Inclusive of all taxes
                  </span>
                </div>
                <span
                  className="text-4xl font-black text-slate-900 tracking-tight font-mono"
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                >
                  ₹{fmt(effectiveTotal)}
                </span>
              </div>

              {!isSplitMode && (
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block">
                    Discount (Optional)
                  </label>
                  <div className="flex gap-2">
                    <div className="flex overflow-hidden border-2 border-slate-700 bg-slate-950">
                      {(['FLAT', 'PERCENT'] as const).map((t) => (
                        <button
                          key={t}
                          onClick={() => setDType(t)}
                          className={cn(
                            'px-4 py-2 text-xs font-black uppercase tracking-widest active:scale-[0.97] transition-all duration-75',
                            dType === t
                              ? 'bg-cyan-500 text-slate-900'
                              : 'text-slate-400 active:bg-slate-800 active:text-slate-200',
                          )}
                        >
                          {t === 'FLAT' ? '₹' : '%'}
                        </button>
                      ))}
                    </div>
                    <input
                      type="number"
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value)}
                      placeholder="Enter amount"
                      className="flex-1 px-4 py-2 text-sm bg-slate-950 border-2 border-slate-700 outline-none focus:border-cyan-500 text-slate-100 font-mono tracking-tight placeholder:text-slate-600"
                    />
                  </div>

                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block">
                    Loyalty Membership
                  </label>
                  {cartCustomer ? (
                    <div className="p-3 bg-lime-500/10 border-2 border-lime-500/30 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-lime-500 text-slate-900 flex items-center justify-center text-xs font-black">
                          {cartCustomer.name[0]}
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-100 tracking-tight uppercase">
                            {cartCustomer.name}
                          </p>
                          <p className="text-[9px] text-lime-400 font-black uppercase tracking-[0.2em]">
                            {cartCustomer.points} Points Available
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 border-2 border-dashed border-slate-700 text-center">
                      <p className="text-[10px] text-slate-500 font-black uppercase italic tracking-[0.2em]">
                        No customer attached
                      </p>
                    </div>
                  )}
                </div>
              )}

              {error && (
                <div className="text-xs text-rose-400 font-bold bg-rose-500/10 p-4 border-2 border-rose-500/30 flex items-start gap-3 animate-shake">
                  <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                  <div className="flex flex-col">
                    <span>{error}</span>
                    {error.includes('Unauthorized') && (
                      <span className="text-[10px] font-medium opacity-70 mt-1">
                        Try logging out and back in to refresh your session.
                      </span>
                    )}
                  </div>
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={
                  status === 'BUSY' ||
                  (isSplitMode && selectedItemIds.length === 0)
                }
                className="w-full py-4 border-2 border-cyan-400 bg-cyan-500 text-slate-900 font-black text-sm flex items-center justify-center gap-3 active:bg-cyan-400 active:scale-[0.98] disabled:opacity-30 transition-all duration-75 uppercase tracking-widest"
              >
                {status === 'BUSY' ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={18} />
                )}
                {isSplitMode
                  ? 'Generate Partial Invoice'
                  : 'Generate Full Invoice'}
              </button>
            </div>
          )}

          {step === 'payment' && invoiceData && (
            <>
              <div className="p-4 text-center bg-cyan-500 border-2 border-cyan-400">
                <p className="text-xs font-black opacity-70 text-slate-900 uppercase tracking-[0.2em]">
                  Bill Total
                </p>
                <p
                  className="text-3xl font-black text-slate-900 mt-0.5 font-mono tracking-tight"
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                >
                  ₹{fmt(invoiceData.invoice.total)}
                </p>
                <p className="text-xs text-slate-900/70 mt-0.5 font-mono tracking-tight uppercase">
                  {invoiceData.invoice.invoice_number}
                </p>
              </div>
              <div
                className={cn(
                  'p-3 flex items-center justify-between border-2',
                  balance === 0
                    ? 'bg-lime-500/10 border-lime-500/30'
                    : balance < 0
                      ? 'bg-amber-500/10 border-amber-500/30'
                      : 'bg-slate-950 border-slate-800',
                )}
              >
                <span className="text-xs font-black text-slate-500 uppercase tracking-wider">
                  {balance > 0
                    ? 'Remaining'
                    : balance < 0
                      ? 'Change Due'
                      : 'Exact ✓'}
                </span>
                <span
                  className={cn(
                    'text-lg font-black font-mono tracking-tight',
                    balance === 0
                      ? 'text-lime-400'
                      : balance < 0
                        ? 'text-amber-400'
                        : 'text-slate-100',
                  )}
                  style={{ fontVariantNumeric: 'tabular-nums' }}
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
                      className="p-3 space-y-2 bg-slate-950 border-2 border-slate-800"
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
                                  className={cn(
                                    'flex items-center gap-1 px-2 py-1.5 text-xs font-black uppercase tracking-wider border-2 active:scale-[0.97] transition-all duration-75',
                                    line.method === m
                                      ? `${M.bg} ${M.border} text-white`
                                      : 'border-slate-700 text-slate-500 active:bg-slate-800 active:text-slate-300',
                                  )}
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
                            className="p-1.5 text-rose-400 active:bg-rose-500/20 active:scale-[0.92] transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <span
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-black"
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
                            className="w-full pl-7 pr-3 py-2 text-sm font-black outline-none bg-slate-900 text-slate-100 font-mono tracking-tight placeholder:text-slate-600"
                            style={{
                              border: `2px solid ${meta.color}44`,
                              fontVariantNumeric: 'tabular-nums',
                            }}
                            placeholder="0.00"
                          />
                        </div>
                        <button
                          onClick={() => setExact(line.id)}
                          className="px-3 py-2 text-xs font-black uppercase tracking-wider active:scale-[0.97] transition-all duration-75"
                          style={{
                            background: `${meta.color}22`,
                            color: meta.color,
                            border: `2px solid ${meta.color}`,
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
                              className="px-2 py-1 text-xs font-black bg-slate-900 border-2 border-slate-700 text-slate-400 active:bg-slate-800 active:text-slate-200 active:scale-[0.92] transition-all duration-75"
                              style={{ fontVariantNumeric: 'tabular-nums' }}
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
                          className="w-full px-3 py-2 text-xs outline-none bg-slate-900 border-2 border-slate-700 text-slate-100 font-mono tracking-tight placeholder:text-slate-600"
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
                          className="w-full px-3 py-2 text-xs outline-none bg-slate-900 border-2 border-slate-700 text-slate-100 font-mono tracking-tight placeholder:text-slate-600"
                        />
                      )}
                    </div>
                  );
                })}
                <button
                  onClick={addLine}
                  className="w-full py-2.5 text-sm font-black flex items-center justify-center gap-2 border-2 border-dashed border-slate-700 text-slate-500 active:bg-slate-800 active:text-slate-300 active:scale-[0.98] transition-all duration-75 uppercase tracking-widest"
                >
                  <Plus size={14} /> Split Payment
                </button>
              </div>
              {error && (
                <p className="text-xs text-rose-400 bg-rose-500/10 border-2 border-rose-500/30 rounded-sm px-3 py-2 font-bold">
                  {error}
                </p>
              )}
              <button
                onClick={handleSettle}
                disabled={loading || balance > 0}
                className="w-full py-3.5 border-2 border-lime-400 bg-lime-500 text-slate-900 font-black text-sm flex items-center justify-center gap-2 disabled:opacity-40 active:bg-lime-400 active:scale-[0.98] transition-all duration-75 uppercase tracking-widest"
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
