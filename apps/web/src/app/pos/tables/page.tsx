'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE } from '@/lib/api';
import { getAuthToken } from '@respos/utils';
import { useTableSocket } from '@/lib/table-socket';
import { useTableStore } from '@/store/tables';
import {
  Loader2,
  RefreshCw,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Brush,
  ArrowRightLeft,
  UtensilsCrossed,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────
interface TableOrder {
  id: string;
  status: string;
  created_at: string;
  pax_count?: number;
}
interface TableData {
  id: string;
  table_number: string;
  capacity: number;
  status: string;
  orders: TableOrder[];
}
interface Zone {
  id: string;
  name: string;
  tables: TableData[];
}

// ─── Status Config ────────────────────────────────────────────────────────────
const STATUS_CFG: Record<
  string,
  { label: string; bg: string; border: string; dot: string; text: string }
> = {
  AVAILABLE: {
    label: 'Available',
    bg: 'bg-lime-500/10',
    border: 'border-lime-500/40',
    dot: 'bg-lime-500',
    text: 'text-lime-400',
  },
  OCCUPIED: {
    label: 'Occupied',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/40',
    dot: 'bg-cyan-500',
    text: 'text-cyan-400',
  },
  BILLED: {
    label: 'Billed',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/40',
    dot: 'bg-amber-500',
    text: 'text-amber-400',
  },
  RESERVED: {
    label: 'Reserved',
    bg: 'bg-fuchsia-500/10',
    border: 'border-fuchsia-500/40',
    dot: 'bg-fuchsia-500',
    text: 'text-fuchsia-400',
  },
  DIRTY: {
    label: 'Needs Clean',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/40',
    dot: 'bg-rose-500',
    text: 'text-rose-400',
  },
};

function elapsed(dateStr: string) {
  const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

export default function TablesPage() {
  const { zones, setZones, loading, setLoading, updateTableStatus } =
    useTableStore();
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<string>('ALL');
  const router = useRouter();

  const API = API_BASE;
  const token = typeof window !== 'undefined' ? getAuthToken() : '';
  const tenantId =
    typeof window !== 'undefined'
      ? (localStorage.getItem('device_tenant_id') ?? '')
      : '';

  const [markingClean, setMarkingClean] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Transfer state
  const [actionTable, setActionTable] = useState<TableData | null>(null);
  const [transferMode, setTransferMode] = useState(false);
  const [transferring, setTransferring] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Phase 1.5: Subscribe to socket — update only the changed table, no polling
  useTableSocket({
    tenantId,
    token,
    onTableStatusChanged: (payload) => {
      updateTableStatus(payload.id, payload.status);
    },
  });

  const fetchTables = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/billing/tables`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load floor plan');
      setZones(await res.json());
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [API, token]);

  useEffect(() => {
    fetchTables();

    // Refresh only when user returns to this tab — no wasted background calls
    const onVisible = () => {
      if (!document.hidden) fetchTables();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [fetchTables]);

  // ── Summary counts ──
  const allTables = zones.flatMap((z) => z.tables);
  const counts = Object.fromEntries(
    Object.keys(STATUS_CFG).map((s) => [
      s,
      allTables.filter((t) => t.status === s).length,
    ]),
  );

  const filteredZones = zones
    .map((z) => ({
      ...z,
      tables:
        filter === 'ALL'
          ? z.tables
          : z.tables.filter((t) => t.status === filter),
    }))
    .filter((z) => z.tables.length > 0);

  const [checkInTable, setCheckInTable] = useState<TableData | null>(null);
  const [adultPax, setAdultPax] = useState(2);
  const [childPax, setChildPax] = useState(0);

  const handleTableClick = (table: TableData) => {
    if (table.status === 'AVAILABLE') {
      setAdultPax(2);
      setChildPax(0);
      setCheckInTable(table);
    } else if (['OCCUPIED', 'BILLED'].includes(table.status)) {
      setActionTable(table);
    }
  };

  const confirmCheckIn = () => {
    if (!checkInTable) return;
    const totalPax = adultPax + childPax;
    router.push(
      `/pos?table_id=${checkInTable.id}&table_number=${checkInTable.table_number}&pax_count=${totalPax}&adult_pax=${adultPax}&child_pax=${childPax}`,
    );
  };

  const handleMarkClean = async (e: React.MouseEvent, table: TableData) => {
    e.stopPropagation();
    setMarkingClean(table.id);
    try {
      const res = await fetch(`${API}/floor-plan/tables/${table.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: 'AVAILABLE' }),
      });
      if (!res.ok) throw new Error('Failed');
      updateTableStatus(table.id, 'AVAILABLE');
      showToast(`Table ${table.table_number} marked as available`);
    } catch {
      showToast('Failed to update table status');
    } finally {
      setMarkingClean(null);
    }
  };

  const handleTransfer = async (targetTable: TableData) => {
    if (!actionTable) return;
    const activeOrder = actionTable.orders[0];
    if (!activeOrder) {
      showToast('No active order on this table');
      return;
    }

    setTransferring(true);
    try {
      const res = await fetch(`${API}/orders/${activeOrder.id}/transfer`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ new_table_id: targetTable.id }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || 'Transfer failed');
      }
      showToast(
        `Order transferred from T${actionTable.table_number} to T${targetTable.table_number}`,
      );
      setTransferMode(false);
      setActionTable(null);
      // WebSocket will handle the status updates, but refresh to update orders array
      fetchTables();
    } catch (e: any) {
      showToast(e.message || 'Transfer failed');
    } finally {
      setTransferring(false);
    }
  };

  const availableTables = allTables.filter(
    (t) => t.status === 'AVAILABLE' && t.id !== actionTable?.id,
  );

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <div className="sticky top-0 z-10 px-6 py-4 bg-slate-950 border-b-2 border-slate-800">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-black text-slate-100 uppercase tracking-widest">
                Floor Plan
              </h1>
              <p className="text-xs mt-0.5 text-slate-500 font-bold uppercase tracking-wider">
                {allTables.length} tables · Auto-refresh every 30s
              </p>
            </div>
            <button
              onClick={fetchTables}
              className="p-2.5 bg-slate-800 border-2 border-slate-700 text-slate-400 active:bg-slate-700 active:text-slate-100 active:scale-[0.92] transition-all"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          {/* Status Filter Pills */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilter('ALL')}
              className={cn(
                'px-3 py-1.5 text-xs font-black uppercase tracking-wider border-2 active:scale-[0.97] transition-all duration-75',
                filter === 'ALL'
                  ? 'bg-slate-100 text-slate-900 border-slate-100'
                  : 'bg-slate-800 text-slate-400 border-slate-700 active:bg-slate-700 active:text-slate-200',
              )}
            >
              All ({allTables.length})
            </button>
            {Object.entries(STATUS_CFG).map(([s, cfg]) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={cn(
                  'px-3 py-1.5 text-xs font-black uppercase tracking-wider border-2 flex items-center gap-1.5 active:scale-[0.97] transition-all duration-75',
                  filter === s
                    ? `${cfg.bg} ${cfg.text} ${cfg.border}`
                    : 'bg-slate-800 text-slate-400 border-slate-700 active:bg-slate-700 active:text-slate-200',
                )}
              >
                <span className={cn('w-2 h-2', cfg.dot)} />
                {cfg.label} ({counts[s] ?? 0})
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6 space-y-8">
        {loading && zones.length === 0 && (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={32} className="animate-spin text-cyan-400" />
          </div>
        )}

        {error && (
          <div className="border-2 border-rose-500/30 bg-rose-500/10 p-4 text-center">
            <AlertCircle size={28} className="mx-auto mb-2 text-rose-400" />
            <p className="text-sm text-rose-400 font-bold uppercase tracking-wider">
              {error}
            </p>
          </div>
        )}

        {filteredZones.map((zone) => (
          <div key={zone.id}>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={14} className="text-cyan-400" />
              <h2 className="text-sm font-black text-slate-300 uppercase tracking-widest">
                {zone.name}
              </h2>
              <span className="text-xs px-2 py-0.5 bg-slate-800 border border-slate-700 text-slate-500 font-black uppercase tracking-wider">
                {zone.tables.length} tables
              </span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
              {zone.tables.map((table) => {
                const cfg = STATUS_CFG[table.status] ?? STATUS_CFG.AVAILABLE;
                const activeOrder = table.orders[0];
                const isClickable = [
                  'AVAILABLE',
                  'OCCUPIED',
                  'BILLED',
                ].includes(table.status);

                return (
                  <button
                    key={table.id}
                    onClick={() => isClickable && handleTableClick(table)}
                    className={cn(
                      'p-3 text-left border-2 active:scale-[0.97] transition-transform duration-75',
                      cfg.bg,
                      cfg.border,
                      isClickable
                        ? 'cursor-pointer'
                        : 'cursor-default opacity-60',
                    )}
                  >
                    {/* Table Number */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-lg font-black text-slate-100 tracking-tight">
                        T{table.table_number}
                      </span>
                      <span className={cn('w-2.5 h-2.5', cfg.dot)} />
                    </div>

                    {/* Status */}
                    <p
                      className={cn(
                        'text-xs font-black uppercase tracking-wider',
                        cfg.text,
                      )}
                    >
                      {cfg.label}
                    </p>

                    {/* Capacity */}
                    <div className="flex items-center gap-1 mt-1 text-slate-500">
                      <Users size={10} />
                      <span className="text-xs font-bold">
                        {table.capacity}
                      </span>
                    </div>

                    {/* Active order info */}
                    {activeOrder && (
                      <div className="mt-2 pt-2 border-t-2 border-dashed border-slate-700/50">
                        <div className="flex items-center gap-1 text-slate-500">
                          <Clock size={10} />
                          <span className="text-xs font-mono tracking-tight">
                            {elapsed(activeOrder.created_at)}
                          </span>
                        </div>
                        {activeOrder.pax_count && (
                          <p className="text-xs mt-0.5 text-slate-500 font-mono tracking-tight">
                            {activeOrder.pax_count} pax
                          </p>
                        )}
                      </div>
                    )}

                    {/* Dirty — Mark Clean button (Phase 1.4) */}
                    {table.status === 'DIRTY' && (
                      <button
                        onClick={(e) => handleMarkClean(e, table)}
                        disabled={markingClean === table.id}
                        className="mt-2 w-full flex items-center justify-center gap-1 px-2 py-1 text-xs font-black uppercase tracking-wider border-2 border-rose-500/40 bg-rose-500/10 text-rose-400 active:bg-rose-500/20 active:scale-[0.97] transition-all duration-75 disabled:opacity-40"
                      >
                        <Brush size={10} />
                        {markingClean === table.id ? 'Cleaning…' : 'Mark Clean'}
                      </button>
                    )}
                    {table.status === 'BILLED' && (
                      <CheckCircle2
                        size={14}
                        className="mt-1"
                        style={{ color: cfg.dot.replace('bg-', '') }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Legend */}
        {zones.length > 0 && (
          <div className="flex flex-wrap gap-4 pt-2 pb-6">
            {Object.entries(STATUS_CFG).map(([s, cfg]) => (
              <div key={s} className="flex items-center gap-1.5">
                <span className={cn('w-2.5 h-2.5', cfg.dot)} />
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                  {cfg.label}
                </span>
              </div>
            ))}
            <span className="text-xs text-slate-600 font-bold uppercase tracking-wider">
              · Click table to open order
            </span>
          </div>
        )}
      </div>

      {/* Toast (Phase 1.4) */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 bg-slate-950 border-2 border-slate-700 text-sm font-black text-slate-100 uppercase tracking-wider animate-fade-in">
          {toast}
        </div>
      )}

      {/* Table Check-In Modal (Phase 3: Buffet Cover Count) */}
      {checkInTable && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border-2 border-slate-700 w-full max-w-sm overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b-2 border-slate-800 bg-slate-950">
              <h2 className="text-xl font-black text-slate-100 uppercase tracking-widest">
                Check-in Table {checkInTable.table_number}
              </h2>
              <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">
                Enter cover count (Adult/Child split)
              </p>
            </div>

            <div className="p-6 space-y-6 bg-slate-900">
              {/* Adults */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-slate-100 uppercase tracking-wider">
                    Adults
                  </h3>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                    Standard rate
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setAdultPax(Math.max(0, adultPax - 1))}
                    className="h-10 w-10 bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-lg font-black text-slate-100 active:bg-slate-700 active:scale-[0.92] transition-all"
                  >
                    -
                  </button>
                  <span
                    className="w-8 text-center text-xl font-black text-slate-100 font-mono"
                    style={{ fontVariantNumeric: 'tabular-nums' }}
                  >
                    {adultPax}
                  </span>
                  <button
                    onClick={() => setAdultPax(adultPax + 1)}
                    className="h-10 w-10 bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-lg font-black text-slate-100 active:bg-slate-700 active:scale-[0.92] transition-all"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Children */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-slate-100 uppercase tracking-wider">
                    Children
                  </h3>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                    Child rate
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setChildPax(Math.max(0, childPax - 1))}
                    className="h-10 w-10 bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-lg font-black text-slate-100 active:bg-slate-700 active:scale-[0.92] transition-all"
                  >
                    -
                  </button>
                  <span
                    className="w-8 text-center text-xl font-black text-slate-100 font-mono"
                    style={{ fontVariantNumeric: 'tabular-nums' }}
                  >
                    {childPax}
                  </span>
                  <button
                    onClick={() => setChildPax(childPax + 1)}
                    className="h-10 w-10 bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-lg font-black text-slate-100 active:bg-slate-700 active:scale-[0.92] transition-all"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-950 border-t-2 border-slate-800 grid grid-cols-2 gap-3">
              <button
                onClick={() => setCheckInTable(null)}
                className="px-4 py-3 font-black text-slate-300 bg-slate-800 border-2 border-slate-700 active:bg-slate-700 active:text-slate-100 active:scale-[0.97] transition-all uppercase tracking-wider text-xs"
              >
                Cancel
              </button>
              <button
                onClick={confirmCheckIn}
                disabled={adultPax + childPax === 0}
                className="px-4 py-3 font-black text-slate-900 bg-lime-500 border-2 border-lime-400 active:bg-lime-400 active:scale-[0.97] transition-all disabled:opacity-40 uppercase tracking-wider text-xs"
              >
                Start Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table Action Modal (Occupied / Billed) */}
      {actionTable && !transferMode && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border-2 border-slate-700 w-full max-w-sm overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b-2 border-slate-800 bg-slate-950">
              <h2 className="text-xl font-black text-slate-100 uppercase tracking-widest">
                Table {actionTable.table_number}
              </h2>
              <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">
                {actionTable.status === 'BILLED' ? 'Billed' : 'Occupied'} ·{' '}
                {actionTable.orders[0]?.pax_count ?? 0} pax
              </p>
            </div>

            <div className="p-6 space-y-3 bg-slate-900">
              <button
                onClick={() => {
                  router.push(
                    `/pos?table_id=${actionTable.id}&table_number=${actionTable.table_number}`,
                  );
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 font-black text-slate-900 bg-cyan-500 border-2 border-cyan-400 active:bg-cyan-400 active:scale-[0.97] transition-all uppercase tracking-wider text-xs"
              >
                <UtensilsCrossed size={14} />
                Open Order
              </button>

              {actionTable.status === 'OCCUPIED' && (
                <button
                  onClick={() => setTransferMode(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 font-black text-slate-100 bg-slate-800 border-2 border-slate-700 active:bg-slate-700 active:scale-[0.97] transition-all uppercase tracking-wider text-xs"
                >
                  <ArrowRightLeft size={14} />
                  Transfer Table
                </button>
              )}
            </div>

            <div className="p-4 bg-slate-950 border-t-2 border-slate-800">
              <button
                onClick={() => setActionTable(null)}
                className="w-full px-4 py-3 font-black text-slate-300 bg-slate-800 border-2 border-slate-700 active:bg-slate-700 active:text-slate-100 active:scale-[0.97] transition-all uppercase tracking-wider text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Mode — Select Target Table */}
      {actionTable && transferMode && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border-2 border-slate-700 w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]">
            <div className="px-6 py-4 border-b-2 border-slate-800 bg-slate-950">
              <h2 className="text-xl font-black text-slate-100 uppercase tracking-widest">
                Transfer Order
              </h2>
              <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">
                From T{actionTable.table_number} to an available table
              </p>
            </div>

            <div className="p-4 overflow-y-auto bg-slate-900">
              {availableTables.length === 0 ? (
                <p className="text-center text-slate-500 py-8 text-sm font-bold uppercase tracking-wider">
                  No available tables
                </p>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {availableTables.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => handleTransfer(t)}
                      disabled={transferring}
                      className="p-3 text-left border-2 border-lime-500/40 bg-lime-500/10 active:scale-[0.97] transition-transform duration-75 disabled:opacity-40"
                    >
                      <span className="text-lg font-black text-slate-100 tracking-tight block">
                        T{t.table_number}
                      </span>
                      <span className="text-xs font-black uppercase tracking-wider text-lime-400">
                        Available
                      </span>
                      <div className="flex items-center gap-1 mt-1 text-slate-500">
                        <Users size={10} />
                        <span className="text-xs font-bold">{t.capacity}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-950 border-t-2 border-slate-800 flex gap-3">
              <button
                onClick={() => setTransferMode(false)}
                disabled={transferring}
                className="flex-1 px-4 py-3 font-black text-slate-300 bg-slate-800 border-2 border-slate-700 active:bg-slate-700 active:text-slate-100 active:scale-[0.97] transition-all uppercase tracking-wider text-xs"
              >
                Back
              </button>
              <button
                onClick={() => {
                  setTransferMode(false);
                  setActionTable(null);
                }}
                disabled={transferring}
                className="flex-1 px-4 py-3 font-black text-slate-300 bg-slate-800 border-2 border-slate-700 active:bg-slate-700 active:text-slate-100 active:scale-[0.97] transition-all uppercase tracking-wider text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
