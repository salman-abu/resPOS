'use client';

import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { API_BASE } from '@/lib/api';
import { getAuthToken } from '@respos/utils';
import { cn } from '@/lib/utils';
import {
  Package,
  Truck,
  Clock,
  MapPin,
  Phone,
  CheckCircle2,
  AlertCircle,
  Bike,
  ExternalLink,
  ChevronRight,
  Search,
  Filter,
} from 'lucide-react';

interface DispatchOrder {
  id: string;
  status: string;
  order_type: string;
  aggregator_source?: string;
  aggregator_order_id?: string;
  customer_phone?: string;
  delivery_address?: string;
  order_name?: string;
  queue_token_number?: number;
  created_at: string;
  order_items: {
    id: string;
    status: string;
    quantity: number;
    item: { name: string; category: { name: string } };
    variant?: { name: string };
    addons?: { name: string }[];
  }[];
  customer?: { name: string; mobile: string };
}

const SOURCE_ACCENT: Record<
  string,
  { bg: string; border: string; text: string }
> = {
  ZOMATO: { bg: 'bg-rose-500', border: 'border-rose-400', text: 'text-white' },
  SWIGGY: {
    bg: 'bg-orange-500',
    border: 'border-orange-400',
    text: 'text-white',
  },
  DIRECT: {
    bg: 'bg-cyan-500',
    border: 'border-cyan-400',
    text: 'text-slate-900',
  },
};

export default function DispatchPage() {
  const [orders, setOrders] = useState<DispatchOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'READY' | 'PREPARING'>('ALL');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const tenantId = localStorage.getItem('device_tenant_id');
    const token = getAuthToken();

    if (!tenantId || !token) return;

    const fetchOrders = async () => {
      try {
        const res = await fetch(`${API_BASE}/orders/dispatch`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setOrders(data);
        }
      } catch (e) {
        console.error('Dispatch Fetch Error:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();

    const socket = io(`${API_BASE.replace('/api', '')}/kds`, {
      transports: ['websocket'],
    });
    socket.on('connect', () => socket.emit('subscribe_cfd', { tenantId }));

    socket.on('order:update', (payload: any) => {
      fetchOrders();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleDispatch = async (orderId: string) => {
    const token = getAuthToken();
    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: 'SERVED' }),
      });
      if (res.ok) {
        setOrders((prev) => prev.filter((o) => o.id !== orderId));
      }
    } catch (e) {
      console.error('Dispatch Error:', e);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchesFilter = filter === 'ALL' || o.status === filter;
    const matchesSearch =
      o.order_name?.toLowerCase().includes(search.toLowerCase()) ||
      o.aggregator_order_id?.toLowerCase().includes(search.toLowerCase()) ||
      o.queue_token_number?.toString().includes(search);
    return matchesFilter && matchesSearch;
  });

  if (loading)
    return (
      <div className="h-screen w-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-b-2 border-cyan-400"></div>
      </div>
    );

  return (
    <div className="h-screen w-screen bg-slate-950 flex flex-col text-slate-100">
      {/* Top Header */}
      <div className="h-20 bg-slate-950 border-b-2 border-slate-800 px-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-cyan-500 flex items-center justify-center text-slate-900 border-2 border-cyan-400">
            <Truck size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight uppercase">
              Delivery Dispatch
            </h1>
            <p className="text-xs text-slate-500 font-black uppercase tracking-widest">
              Managing {orders.length} Active Shipments
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 h-4 w-4" />
            <input
              type="text"
              placeholder="Search Order / ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 bg-slate-900 border-2 border-slate-700 text-sm outline-none focus:border-cyan-500 w-64 transition-all text-slate-100 placeholder:text-slate-600 font-mono tracking-tight"
            />
          </div>
          <div className="flex bg-slate-900 border-2 border-slate-700 p-1">
            {(['ALL', 'READY', 'PREPARING'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  'px-4 py-1.5 text-xs font-black uppercase tracking-wider transition-all active:scale-[0.97]',
                  filter === f
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-400 active:text-slate-200',
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 content-start">
        {filteredOrders.map((order) => {
          const isReady =
            order.status === 'READY' ||
            order.order_items.every(
              (i) => i.status === 'READY' || i.status === 'SERVED',
            );
          const source = order.aggregator_source || 'DIRECT';
          const accent = SOURCE_ACCENT[source] ?? SOURCE_ACCENT.DIRECT;

          return (
            <div
              key={order.id}
              className="bg-slate-900 border-2 border-slate-800 overflow-hidden flex flex-col group active:border-slate-600 transition-colors"
            >
              {/* Card Header */}
              <div
                className={cn(
                  'p-4 flex items-center justify-between border-b-2',
                  isReady
                    ? 'bg-lime-500/10 border-lime-500/20'
                    : 'bg-slate-950 border-slate-800',
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'h-10 w-10 flex items-center justify-center font-black text-sm border-2',
                      accent.bg,
                      accent.border,
                      accent.text,
                    )}
                  >
                    {source[0]}
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                      {source}
                    </p>
                    <h3 className="text-sm font-black text-slate-100 tracking-tight">
                      #
                      {order.aggregator_order_id ||
                        order.queue_token_number ||
                        order.id.slice(0, 5)}
                    </h3>
                  </div>
                </div>
                <div
                  className={cn(
                    'px-2.5 py-1 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 border-2',
                    isReady
                      ? 'bg-lime-500 text-slate-900 border-lime-400'
                      : 'bg-amber-500 text-slate-900 border-amber-400',
                  )}
                >
                  {isReady ? <CheckCircle2 size={10} /> : <Clock size={10} />}
                  {isReady ? 'Ready to Pack' : 'Preparing'}
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 flex-1 space-y-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-slate-500">
                    <MapPin size={12} />
                    <span className="text-[10px] font-black uppercase tracking-wider">
                      Destination
                    </span>
                  </div>
                  <p className="text-sm font-bold text-slate-300 line-clamp-2 leading-relaxed tracking-tight">
                    {order.delivery_address || 'Takeaway Pickup'}
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs py-2 border-y-2 border-dashed border-slate-800">
                  <div className="flex items-center gap-2">
                    <Phone size={12} className="text-slate-500" />
                    <span className="font-bold text-slate-400 font-mono tracking-tight">
                      {order.customer_phone || order.customer?.mobile || 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={12} className="text-slate-500" />
                    <span className="font-bold text-slate-400 font-mono tracking-tight">
                      {new Date(order.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                    Order Items
                  </p>
                  <div className="space-y-1.5">
                    {order.order_items.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between items-center text-xs"
                      >
                        <span className="font-medium text-slate-400">
                          <span className="font-black text-slate-100">
                            {item.quantity}x
                          </span>{' '}
                          {item.item.name}
                          {item.variant && (
                            <span className="text-slate-600 text-[10px] ml-1 font-mono">
                              ({item.variant.name})
                            </span>
                          )}
                        </span>
                        {item.status === 'READY' ? (
                          <CheckCircle2 size={12} className="text-lime-400" />
                        ) : (
                          <Clock size={12} className="text-amber-400" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card Footer / Action */}
              <div className="p-4 bg-slate-950 border-t-2 border-slate-800">
                <button
                  onClick={() => handleDispatch(order.id)}
                  disabled={!isReady}
                  className={cn(
                    'w-full py-3 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 active:scale-[0.97] transition-all duration-75 border-2',
                    isReady
                      ? 'bg-cyan-500 text-slate-900 border-cyan-400 active:bg-cyan-400'
                      : 'bg-slate-800 text-slate-600 border-slate-700 cursor-not-allowed',
                  )}
                >
                  <Bike size={16} />
                  {isReady ? 'Confirm Dispatch' : 'Awaiting Items'}
                </button>
              </div>
            </div>
          );
        })}

        {filteredOrders.length === 0 && (
          <div className="col-span-full h-96 flex flex-col items-center justify-center text-slate-600">
            <Package size={64} strokeWidth={1} />
            <p className="mt-4 font-black uppercase tracking-widest">
              No orders in pipeline
            </p>
          </div>
        )}
      </div>

      {/* Floating Status Bar */}
      <div className="h-12 bg-slate-950 border-t-2 border-slate-800 px-8 flex items-center justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
        <div className="flex gap-6">
          <span className="flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 bg-lime-500" /> Ready to Pack:{' '}
            {orders.filter((o) => o.status === 'READY').length}
          </span>
          <span className="flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 bg-amber-500" /> In Prep:{' '}
            {orders.filter((o) => o.status !== 'READY').length}
          </span>
        </div>
        <div>Last Sync: {new Date().toLocaleTimeString()}</div>
      </div>
    </div>
  );
}
