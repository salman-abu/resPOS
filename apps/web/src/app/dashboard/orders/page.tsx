'use client';
import { useEffect, useState, useCallback } from 'react';
import { API_BASE } from '@/lib/api';
import { getAuthToken } from '@respos/utils';
import {
  Search,
  Ban,
  Clock,
  CheckCircle2,
  AlertCircle,
  IndianRupee,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────
interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  unit_price: number;
  status: string;
}

interface Order {
  id: string;
  status: string;
  order_type: string;
  created_at: string;
  table_number?: string;
  pax_count?: number;
  items: OrderItem[];
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function VoidModal({
  order,
  onClose,
  onSuccess,
}: {
  order: Order;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVoid = async () => {
    if (!reason.trim()) {
      setError('Please provide a reason for voiding.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_BASE}/orders/${order.id}/void`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) throw new Error('Failed to void order');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden p-6">
        <h3 className="text-lg font-bold text-content-primary mb-2">
          Void Order
        </h3>
        <p className="text-sm text-content-muted mb-4">
          You are about to void{' '}
          {order.order_type === 'DINE_IN'
            ? `Table ${order.table_number}`
            : order.order_type}{' '}
          order. This action cannot be undone.
        </p>

        <div className="space-y-2 mb-6">
          <label className="text-xs font-semibold text-content-secondary">
            Reason for voiding
          </label>
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Customer cancelled, mistaken entry..."
            className="w-full px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-danger"
          />
          {error && <p className="text-xs text-danger">{error}</p>}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-border font-semibold text-content-secondary hover:bg-surface-2 transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleVoid}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-danger text-white font-semibold hover:bg-red-600 transition-colors text-sm flex items-center justify-center gap-2"
          >
            {loading ? (
              <Clock className="h-4 w-4 animate-spin" />
            ) : (
              <Ban className="h-4 w-4" />
            )}
            Confirm Void
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ActiveOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [voidingOrder, setVoidingOrder] = useState<Order | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_BASE}/orders/active`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setOrders(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const fmt = (p: number) => `₹${(p / 100).toFixed(0)}`;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-content-primary">
            Active Orders
          </h1>
          <p className="text-sm text-content-muted">
            Manage currently active and pending orders
          </p>
        </div>
        <button
          onClick={fetchOrders}
          className="h-9 w-9 flex items-center justify-center rounded-xl bg-surface-2 text-content-secondary hover:bg-surface-3 transition-colors"
        >
          <Clock className={cn('h-4 w-4', loading && 'animate-spin')} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading && orders.length === 0 ? (
          [...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-48 rounded-2xl bg-white border border-border p-4 animate-pulse"
            >
              <div className="h-6 w-1/3 bg-slate-100 rounded mb-4" />
              <div className="space-y-2">
                <div className="h-4 w-full bg-slate-100 rounded" />
                <div className="h-4 w-5/6 bg-slate-100 rounded" />
              </div>
            </div>
          ))
        ) : orders.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-dashed border-border flex flex-col items-center">
            <UtensilsCrossed className="h-10 w-10 text-content-disabled mb-3" />
            <p className="text-content-secondary font-medium">
              No active orders
            </p>
            <p className="text-xs text-content-muted mt-1">
              Orders from POS will appear here.
            </p>
          </div>
        ) : (
          orders.map((order: any) => {
            const total = order.order_items.reduce(
              (sum: number, item: any) => sum + item.unit_price * item.quantity,
              0,
            );

            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm flex flex-col"
              >
                <div className="p-4 border-b border-border flex items-center justify-between bg-surface-1">
                  <div>
                    <h3 className="font-bold text-content-primary">
                      {order.order_type === 'DINE_IN'
                        ? `Table ${order.table?.table_number || order.table_number}`
                        : order.order_type}
                    </h3>
                    <p className="text-[10px] font-medium text-content-muted">
                      {new Date(order.created_at).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'text-[10px] px-2 py-1 rounded-md font-bold',
                      order.status === 'DRAFT'
                        ? 'bg-slate-100 text-slate-600'
                        : order.status === 'PLACED'
                          ? 'bg-blue-100 text-blue-700'
                          : order.status === 'PREPARING'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-700',
                    )}
                  >
                    {order.status}
                  </span>
                </div>

                <div className="p-4 flex-1">
                  <div className="space-y-2 mb-4">
                    {order.order_items.slice(0, 3).map((oi: any, i: number) => (
                      <div
                        key={i}
                        className="flex items-start justify-between text-sm"
                      >
                        <span className="text-content-secondary line-clamp-1 flex-1 pr-2">
                          <span className="text-content-muted font-mono text-xs mr-2">
                            {oi.quantity}x
                          </span>
                          {oi.item?.name || 'Unknown Item'}
                        </span>
                        <span className="font-medium text-content-primary">
                          {fmt(oi.unit_price * oi.quantity)}
                        </span>
                      </div>
                    ))}
                    {order.order_items.length > 3 && (
                      <p className="text-xs text-content-muted italic">
                        +{order.order_items.length - 3} more items...
                      </p>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-surface-2 border-t border-border flex items-center justify-between mt-auto">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-content-muted uppercase">
                      Total
                    </span>
                    <span className="font-black text-brand-700">
                      {fmt(total)}
                    </span>
                  </div>

                  <button
                    onClick={() => setVoidingOrder(order)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-danger/30 text-danger hover:bg-danger hover:text-white transition-colors text-xs font-semibold shadow-sm"
                  >
                    <Ban className="h-3 w-3" /> Void
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {voidingOrder && (
        <VoidModal
          order={voidingOrder}
          onClose={() => setVoidingOrder(null)}
          onSuccess={fetchOrders}
        />
      )}
    </div>
  );
}
