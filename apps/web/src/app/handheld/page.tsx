'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { useCartStore } from '@/store/cart';
import { getAuthToken } from '@respos/utils';
import { createOrder, fireKot } from '@/lib/api';
import {
  QrCode,
  Plus,
  Minus,
  ChefHat,
  CreditCard,
  ArrowLeft,
  Loader2,
  Utensils,
} from 'lucide-react';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

export default function HandheldPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { items, addItem, updateQuantity, removeItem, clearCart } =
    useCartStore();
  const [tables, setTables] = useState<any[]>([]);
  const [selectedTable, setSelectedTable] = useState<any>(null);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [showQr, setShowQr] = useState(false);
  const [qrInput, setQrInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleFireKOT = async () => {
    if (submitting || !selectedTable || !items.length) return;
    setSubmitting(true);
    try {
      const order = await createOrder({
        order_type: 'DINE_IN',
        table_id: selectedTable.id,
        pax_count: 1,
        items: items.map((i) => ({
          item_id: i.id,
          quantity: i.quantity,
          unit_price: i.unit_price,
          notes: 'Handheld POS Order',
        })),
      });

      if (order && order.order_items) {
        await fireKot(order.id, {
          item_ids: order.order_items.map((oi: any) => oi.id),
        });
      }

      alert(`KOT Fired Successfully for Table ${selectedTable.table_number}!`);
      clearCart();
      setSelectedTable(null);
    } catch (err: any) {
      alert(`Failed to fire KOT: ${err.message || err}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePayment = async () => {
    if (submitting || !selectedTable || !items.length) return;
    setSubmitting(true);
    try {
      const order = await createOrder({
        order_type: 'DINE_IN',
        table_id: selectedTable.id,
        pax_count: 1,
        items: items.map((i) => ({
          item_id: i.id,
          quantity: i.quantity,
          unit_price: i.unit_price,
          notes: 'Handheld Cash Settle',
        })),
      });

      alert(
        `Order & Payment recorded for Table ${selectedTable.table_number}! Total: ₹${(subtotal / 100).toFixed(0)}`,
      );
      clearCart();
      setSelectedTable(null);
    } catch (err: any) {
      alert(`Payment failed: ${err.message || err}`);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (
      !user ||
      (user.role !== 'CASHIER' &&
        user.role !== 'OWNER' &&
        user.role !== 'MANAGER')
    ) {
      router.replace('/login');
      return;
    }

    const token = getAuthToken();
    Promise.all([
      fetch(`${API_BASE}/billing/tables`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .catch(() => []),
      fetch(`${API_BASE}/menu/items`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .catch(() => []),
    ]).then(([t, m]) => {
      setTables(t || []);
      setMenuItems(m || []);
      setLoading(false);
    });
  }, [user, router]);

  const categories = [
    'all',
    ...Array.from(
      new Set(menuItems.map((i) => i.category?.name).filter(Boolean)),
    ),
  ];
  const filteredItems =
    activeCategory === 'all'
      ? menuItems
      : menuItems.filter((i) => i.category?.name === activeCategory);

  const subtotal = items.reduce((s, i) => s + i.unit_price * i.quantity, 0);

  const handleQrDecode = () => {
    // Simple QR token decode: token format is UUID, we just use it as table identifier
    const table = tables.find(
      (t) => t.id === qrInput || t.table_number === qrInput,
    );
    if (table) {
      setSelectedTable(table);
      setShowQr(false);
      setQrInput('');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  // ─── Table Selection View ───────────────────────────────────────────────
  if (!selectedTable) {
    return (
      <div className="min-h-screen bg-slate-950 text-white p-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-black uppercase tracking-widest">
            Handheld POS
          </h1>
          <button
            onClick={() => setShowQr(true)}
            className="h-12 w-12 bg-cyan-500 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
          >
            <QrCode className="h-6 w-6 text-slate-900" />
          </button>
        </div>

        {showQr && (
          <div className="mb-4 p-4 bg-slate-800 rounded-xl border-2 border-slate-700">
            <label className="text-xs font-bold uppercase text-slate-400 block mb-2">
              Scan Table QR or Enter Table Number
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={qrInput}
                onChange={(e) => setQrInput(e.target.value)}
                placeholder="Table # or ID"
                className="flex-1 bg-slate-950 border-2 border-slate-700 rounded-lg px-3 py-2 text-white font-bold"
                autoFocus
              />
              <button
                onClick={handleQrDecode}
                className="px-4 py-2 bg-cyan-500 text-slate-900 font-bold rounded-lg active:scale-90"
              >
                Go
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {tables.map((table: any) => (
            <button
              key={table.id}
              onClick={() => setSelectedTable(table)}
              className={`p-4 rounded-xl border-2 text-left active:scale-[0.97] transition-transform min-h-[80px] flex flex-col justify-between ${
                table.status === 'OCCUPIED'
                  ? 'bg-amber-500/10 border-amber-500/30'
                  : table.status === 'BILLED'
                    ? 'bg-rose-500/10 border-rose-500/30'
                    : 'bg-slate-800 border-slate-700'
              }`}
            >
              <span className="text-lg font-black">{table.table_number}</span>
              <span
                className={`text-xs font-bold uppercase ${
                  table.status === 'AVAILABLE'
                    ? 'text-emerald-400'
                    : table.status === 'OCCUPIED'
                      ? 'text-amber-400'
                      : 'text-rose-400'
                }`}
              >
                {table.status}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ─── Order Taking View ──────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 p-4 bg-slate-900 border-b-2 border-slate-800 flex items-center gap-3">
        <button
          onClick={() => {
            setSelectedTable(null);
            clearCart();
          }}
          className="h-10 w-10 bg-slate-800 rounded-lg flex items-center justify-center active:scale-90"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-lg font-black">
            Table {selectedTable.table_number}
          </h1>
          <p className="text-xs text-slate-400 font-bold uppercase">
            {items.length} items · ₹{(subtotal / 100).toFixed(0)}
          </p>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex-shrink-0 flex gap-2 p-2 overflow-x-auto scrollbar-thin border-b-2 border-slate-800">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap active:scale-90 transition-transform ${
              activeCategory === cat
                ? 'bg-cyan-500 text-slate-900'
                : 'bg-slate-800 text-slate-300'
            }`}
          >
            {cat === 'all' ? 'All' : cat}
          </button>
        ))}
      </div>

      {/* Item Grid */}
      <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 gap-3">
        {filteredItems.map((item) => (
          <button
            key={item.id}
            onClick={() => addItem(item)}
            className="p-3 bg-slate-800 border-2 border-slate-700 rounded-xl text-left active:border-cyan-500 active:bg-slate-700 transition-all min-h-[90px] flex flex-col justify-between"
          >
            <span className="text-sm font-bold line-clamp-2">{item.name}</span>
            <span className="text-cyan-400 text-sm font-black">
              ₹{Math.round(item.base_price / 100)}
            </span>
          </button>
        ))}
      </div>

      {/* Cart Summary + Actions */}
      {items.length > 0 && (
        <div className="flex-shrink-0 bg-slate-900 border-t-2 border-slate-800 p-4 space-y-3">
          <div className="space-y-2 max-h-[160px] overflow-y-auto">
            {items.map((item) => (
              <div
                key={item.cartLineId}
                className="flex items-center justify-between bg-slate-800 rounded-lg p-2"
              >
                <span className="text-sm font-bold flex-1 truncate">
                  {item.name}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.cartLineId, -1)}
                    className="h-8 w-8 bg-slate-700 rounded-lg flex items-center justify-center active:bg-slate-600"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="text-sm font-black w-6 text-center">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.cartLineId, 1)}
                    className="h-8 w-8 bg-cyan-500 rounded-lg flex items-center justify-center active:bg-cyan-400"
                  >
                    <Plus className="h-4 w-4 text-slate-900" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleFireKOT}
              disabled={submitting || !selectedTable || !items.length}
              className="flex items-center justify-center gap-2 py-4 bg-amber-500 text-slate-900 font-black rounded-xl text-sm uppercase tracking-wider active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none"
            >
              {submitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <ChefHat className="h-5 w-5" />
              )}
              Fire KOT
            </button>
            <button
              onClick={handlePayment}
              disabled={submitting || !selectedTable || !items.length}
              className="flex items-center justify-center gap-2 py-4 bg-emerald-500 text-slate-900 font-black rounded-xl text-sm uppercase tracking-wider active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none"
            >
              {submitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <CreditCard className="h-5 w-5" />
              )}
              ₹{(subtotal / 100).toFixed(0)}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
