'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useCartStore } from '@/store/cart';
import {
  Wine,
  ArrowLeft,
  Clock,
  User,
  ChevronRight,
  Loader2,
  Search,
  Plus,
} from 'lucide-react';
import { API_BASE } from '@/lib/api';
import { getAuthToken } from '@respos/utils';

const API = API_BASE;

function getAuthHeader(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function BarTabsPage() {
  const router = useRouter();
  const [tabs, setTabs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { setActiveOrderId, hydrateCart, setTable, setOrderType } =
    useCartStore();

  useEffect(() => {
    fetchTabs();
  }, []);

  const fetchTabs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/orders/tabs`, {
        headers: getAuthHeader(),
      });
      if (res.ok) {
        const data = await res.json();
        setTabs(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTab = async (tab: any) => {
    const mappedItems = tab.order_items.map((oi: any) => ({
      id: oi.id,
      cartLineId: oi.variant_id
        ? `${oi.item_id}__${oi.variant_id}`
        : oi.item_id,
      item_id: oi.item_id,
      name: oi.item.name,
      item_type: oi.item.item_type,
      station_route: oi.item.station_route,
      tax_slab: oi.item.tax_slab,
      variant_id: oi.variant_id,
      variant_name: oi.variant?.name,
      unit_price: oi.unit_price,
      quantity: oi.quantity,
      notes: oi.notes,
      course_number: oi.course_number,
      fire_status: oi.fire_status,
      seat_number: oi.seat_number,
      addons: oi.addons || [],
      addons_total: (oi.addons || []).reduce(
        (s: number, a: any) => s + a.price,
        0,
      ),
    }));

    setOrderType(tab.order_type);
    if (tab.table_id) {
      setTable(tab.table_id, tab.table?.table_number || '');
    }
    setActiveOrderId(tab.id);
    hydrateCart(mappedItems);

    router.push('/pos');
  };

  const filteredTabs = tabs.filter(
    (t) =>
      t.tab_name?.toLowerCase().includes(search.toLowerCase()) ||
      t.table?.table_number?.includes(search),
  );

  return (
    <div className="flex flex-col h-screen bg-slate-900">
      {/* Header */}
      <header className="flex-shrink-0 bg-slate-950 border-b-2 border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="h-10 w-10 bg-slate-800 border-2 border-slate-700 flex items-center justify-center active:bg-slate-700 active:text-slate-100 active:scale-[0.92] transition-all text-slate-400"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-black text-slate-100 uppercase tracking-widest">
              Bar Tabs
            </h1>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
              Manage open bar rounds and guest tabs
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search tabs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border-2 border-slate-700 rounded-none pl-10 pr-4 py-2 text-sm outline-none focus:border-cyan-500 transition-all text-slate-100 placeholder:text-slate-600 font-mono uppercase tracking-wider"
            />
          </div>
          <button
            onClick={() => router.push('/pos')}
            className="flex items-center gap-2 bg-cyan-500 text-slate-900 px-4 py-2 border-2 border-cyan-400 font-black text-sm uppercase tracking-wider active:bg-cyan-400 active:scale-[0.97] transition-all duration-75"
          >
            <Plus className="h-4 w-4" /> New Tab
          </button>
        </div>
      </header>

      {/* Grid */}
      <main className="flex-1 overflow-y-auto p-6 scrollbar-thin">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-500">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-sm font-black uppercase tracking-wider">
              Fetching open tabs...
            </p>
          </div>
        ) : filteredTabs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
            <div className="h-20 w-20 bg-slate-800 border-2 border-slate-700 flex items-center justify-center">
              <Wine className="h-10 w-10 text-slate-600" />
            </div>
            <div>
              <p className="text-slate-100 font-black text-lg uppercase tracking-widest">
                No active tabs
              </p>
              <p className="text-slate-500 text-sm mt-1 font-bold uppercase tracking-wider">
                Start a new order and save it as a tab to see it here.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredTabs.map((tab) => {
              const total = tab.order_items.reduce(
                (sum: number, i: any) => sum + i.quantity * i.unit_price,
                0,
              );
              return (
                <button
                  key={tab.id}
                  onClick={() => handleSelectTab(tab)}
                  className="flex flex-col bg-slate-800 border-2 border-slate-700 p-4 text-left active:border-slate-500 active:scale-[0.97] transition-all duration-75 relative overflow-hidden group"
                >
                  <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronRight className="h-5 w-5 text-cyan-400" />
                  </div>

                  <div className="flex items-start justify-between mb-4">
                    <div className="h-12 w-12 bg-fuchsia-500/10 flex items-center justify-center border-2 border-fuchsia-500/30">
                      <Wine className="h-6 w-6 text-fuchsia-400" />
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-fuchsia-400 uppercase tracking-[0.2em]">
                        Active
                      </p>
                      <p
                        className="text-lg font-black text-slate-100 font-mono tracking-tight"
                        style={{ fontVariantNumeric: 'tabular-nums' }}
                      >
                        ₹{(total / 100).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <h3 className="text-base font-black text-slate-100 mb-1 truncate pr-6 tracking-tight uppercase">
                    {tab.tab_name || 'Anonymous Tab'}
                  </h3>

                  <div className="flex items-center gap-3 mt-auto pt-4 border-t-2 border-dashed border-slate-700">
                    <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                      <Clock className="h-3.5 w-3.5" />
                      {new Date(tab.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                    {tab.table && (
                      <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                        <User className="h-3.5 w-3.5" />
                        Table {tab.table.table_number}
                      </div>
                    )}
                  </div>

                  <p className="mt-3 text-[10px] text-slate-600 font-black uppercase tracking-[0.2em]">
                    {tab.order_items.length} Items · {tab.order_type}
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
