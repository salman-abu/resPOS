'use client';

import { useEffect, useState, useCallback } from 'react';
import { API_BASE } from '@/lib/api';
import { getAuthToken } from '@respos/utils';
import {
  Clock,
  ExternalLink,
  ChefHat,
  PackageCheck,
  Bike,
  IndianRupee,
  ShoppingBag,
  Filter,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────
interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  status: string;
}

interface Order {
  id: string;
  status: string;
  order_type: string;
  source: 'POS' | 'SWIGGY' | 'ZOMATO' | 'STOREFRONT';
  brand_id?: string;
  created_at: string;
  order_name?: string;
  order_items: any[];
}

const SOURCE_CONFIG = {
  POS: {
    color: 'bg-slate-100 text-slate-700',
    label: 'Walk-in',
    icon: ShoppingBag,
  },
  SWIGGY: {
    color: 'bg-orange-100 text-orange-700',
    label: 'Swiggy',
    icon: Bike,
  },
  ZOMATO: { color: 'bg-red-100 text-red-700', label: 'Zomato', icon: Bike },
  STOREFRONT: {
    color: 'bg-indigo-100 text-indigo-700',
    label: 'Direct Online',
    icon: ExternalLink,
  },
};

const BRAND_COLORS: Record<string, string> = {
  'brand-1': 'border-l-orange-500', // Burger Hub
  'brand-2': 'border-l-red-600', // Pizza Express
  'brand-3': 'border-l-emerald-500', // Salad Garden
};

export default function CloudKitchenDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'SWIGGY' | 'ZOMATO' | 'DIRECT'>(
    'ALL',
  );

  const fetchOrders = useCallback(async () => {
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
    const interval = setInterval(fetchOrders, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const filteredOrders = orders.filter((o) => {
    if (filter === 'ALL') return true;
    if (filter === 'DIRECT')
      return o.source === 'POS' || o.source === 'STOREFRONT';
    return o.source === filter;
  });

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <ChefHat className="h-6 w-6 text-brand-600" />
            <h1 className="text-2xl font-black text-content-primary tracking-tight uppercase">
              Cloud Kitchen Stream
            </h1>
          </div>
          <p className="text-sm text-content-muted font-medium">
            Unified dashboard for multi-brand delivery fulfillment
          </p>
        </div>

        <div className="flex items-center gap-2 bg-surface-2 p-1 rounded-2xl border border-border">
          {(['ALL', 'SWIGGY', 'ZOMATO', 'DIRECT'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-4 py-2 rounded-xl text-xs font-bold transition-all',
                filter === f
                  ? 'bg-white text-brand-700 shadow-sm border border-border'
                  : 'text-content-muted hover:text-content-secondary',
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-border shadow-sm">
          <p className="text-[10px] font-bold text-content-muted uppercase tracking-widest mb-1">
            Active Now
          </p>
          <p className="text-2xl font-black text-content-primary">
            {orders.length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-border shadow-sm">
          <p className="text-[10px] font-bold text-content-muted uppercase tracking-widest mb-1">
            In Prep
          </p>
          <p className="text-2xl font-black text-amber-600">
            {orders.filter((o) => o.status === 'PREPARING').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-border shadow-sm">
          <p className="text-[10px] font-bold text-content-muted uppercase tracking-widest mb-1">
            Ready/Pending Pickup
          </p>
          <p className="text-2xl font-black text-emerald-600">
            {orders.filter((o) => o.status === 'READY').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-border shadow-sm">
          <p className="text-[10px] font-bold text-content-muted uppercase tracking-widest mb-1">
            Delayed (&gt;15m)
          </p>
          <p className="text-2xl font-black text-danger">
            {
              orders.filter((o) => {
                const diff = Date.now() - new Date(o.created_at).getTime();
                return diff > 15 * 60 * 1000 && o.status !== 'READY';
              }).length
            }
          </p>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading && orders.length === 0 ? (
          [...Array(8)].map((_, i) => (
            <div
              key={i}
              className="h-64 rounded-3xl bg-white border border-border p-6 animate-pulse"
            />
          ))
        ) : filteredOrders.length === 0 ? (
          <div className="col-span-full py-32 flex flex-col items-center justify-center text-center">
            <div className="h-20 w-20 rounded-full bg-surface-2 flex items-center justify-center mb-4">
              <Filter className="h-10 w-10 text-content-disabled" />
            </div>
            <h2 className="text-xl font-bold text-content-secondary">
              No orders matching filter
            </h2>
            <p className="text-sm text-content-muted">
              When a new Swiggy/Zomato order arrives, it will pop up here.
            </p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const config = SOURCE_CONFIG[order.source] || SOURCE_CONFIG.POS;
            const SourceIcon = config.icon;
            const brandColor = order.brand_id
              ? BRAND_COLORS[order.brand_id] || 'border-l-slate-300'
              : 'border-l-transparent';

            const timeElapsed = Math.floor(
              (Date.now() - new Date(order.created_at).getTime()) / 60000,
            );
            const isLate = timeElapsed > 15 && order.status !== 'READY';

            return (
              <div
                key={order.id}
                className={cn(
                  'group relative bg-white rounded-3xl border-2 border-border transition-all duration-300 hover:shadow-xl hover:border-brand-200 flex flex-col overflow-hidden',
                  brandColor && `border-l-[6px] ${brandColor}`,
                  isLate && 'border-danger/30 bg-danger/[0.02]',
                )}
              >
                {/* Order Header */}
                <div className="p-5 flex items-start justify-between border-b border-border/50">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tighter',
                          config.color,
                        )}
                      >
                        {config.label}
                      </span>
                      <span className="text-[10px] font-bold text-content-muted">
                        #{order.id.slice(-4).toUpperCase()}
                      </span>
                    </div>
                    <h3 className="font-black text-content-primary text-lg truncate w-40">
                      {order.order_name || `Order ${order.id.slice(-4)}`}
                    </h3>
                  </div>

                  <div className="flex flex-col items-end">
                    <div
                      className={cn(
                        'flex items-center gap-1 text-[10px] font-black uppercase tracking-tight',
                        isLate ? 'text-danger' : 'text-content-muted',
                      )}
                    >
                      <Clock className="h-3 w-3" />
                      {timeElapsed}m ago
                    </div>
                    <span
                      className={cn(
                        'mt-1 px-2 py-0.5 rounded-md text-[9px] font-black uppercase',
                        order.status === 'READY'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700',
                      )}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>

                {/* Items */}
                <div className="p-5 flex-1 space-y-3">
                  {order.order_items.map((oi, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="h-5 w-5 rounded-md bg-surface-2 flex items-center justify-center text-[10px] font-bold text-content-secondary flex-shrink-0">
                        {oi.quantity}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-content-primary truncate">
                          {oi.item?.name}
                        </p>
                        {oi.variant && (
                          <p className="text-[10px] text-content-muted font-medium">
                            {oi.variant.name}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Action Footer */}
                <div className="p-4 bg-surface-1 border-t border-border/50 flex items-center gap-2">
                  {order.status !== 'READY' ? (
                    <button className="flex-1 bg-brand-600 hover:bg-brand-700 text-white py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-brand-500/20 transition-all active:scale-95 flex items-center justify-center gap-2">
                      <ChefHat className="h-4 w-4" /> Mark Ready
                    </button>
                  ) : (
                    <button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 transition-all active:scale-95 flex items-center justify-center gap-2">
                      <PackageCheck className="h-4 w-4" /> Mark Dispatched
                    </button>
                  )}
                </div>

                {/* Decorative Brand Corner */}
                {order.brand_id && (
                  <div className="absolute top-2 right-2 opacity-10 group-hover:opacity-20 transition-opacity">
                    <ChefHat className="h-12 w-12" />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <style jsx>{`
        @keyframes pulse-soft {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }
        .animate-pulse-soft {
          animation: pulse-soft 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
