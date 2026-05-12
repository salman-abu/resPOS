'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, RefreshCw, Users, Clock, CheckCircle2, AlertCircle, Sparkles, Brush } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface TableOrder { id: string; status: string; created_at: string; pax_count?: number; }
interface TableData { id: string; table_number: string; capacity: number; status: string; orders: TableOrder[]; }
interface Zone { id: string; name: string; tables: TableData[]; }

// ─── Status Config ────────────────────────────────────────────────────────────
const STATUS_CFG: Record<string, { label: string; bg: string; border: string; dot: string }> = {
  AVAILABLE: { label: 'Available', bg: '#22c55e18', border: '#22c55e', dot: '#22c55e' },
  OCCUPIED:  { label: 'Occupied',  bg: '#6366f118', border: '#6366f1', dot: '#6366f1' },
  BILLED:    { label: 'Billed',    bg: '#f9731618', border: '#f97316', dot: '#f97316' },
  RESERVED:  { label: 'Reserved',  bg: '#eab30818', border: '#eab308', dot: '#eab308' },
  DIRTY:     { label: 'Needs Clean', bg: '#ef444418', border: '#ef4444', dot: '#ef4444' },
};

function elapsed(dateStr: string) {
  const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

export default function TablesPage() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<string>('ALL');
  const router = useRouter();

  const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
  const token = typeof window !== 'undefined' ? localStorage.getItem('rpos_token') ?? '' : '';

  const fetchTables = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API}/billing/tables`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Failed to load floor plan');
      setZones(await res.json());
    } catch (e: unknown) { setError((e as Error).message); }
    finally { setLoading(false); }
  }, [API, token]);

  useEffect(() => { fetchTables(); const t = setInterval(fetchTables, 30000); return () => clearInterval(t); }, [fetchTables]);

  // ── Summary counts ──
  const allTables = zones.flatMap(z => z.tables);
  const counts = Object.fromEntries(Object.keys(STATUS_CFG).map(s => [s, allTables.filter(t => t.status === s).length]));

  const filteredZones = zones.map(z => ({
    ...z,
    tables: filter === 'ALL' ? z.tables : z.tables.filter(t => t.status === filter),
  })).filter(z => z.tables.length > 0);

  const handleTableClick = (table: TableData) => {
    if (table.status === 'AVAILABLE') {
      // Navigate to POS with table pre-selected
      router.push(`/pos?table_id=${table.id}&table_number=${table.table_number}`);
    } else if (['OCCUPIED', 'BILLED'].includes(table.status) && table.orders[0]) {
      router.push(`/pos?order_id=${table.orders[0].id}`);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 px-6 py-4" style={{ background: 'var(--bg-base)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>Floor Plan</h1>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{allTables.length} tables · Auto-refresh every 30s</p>
            </div>
            <button onClick={fetchTables} className="p-2.5 rounded-xl transition-colors"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          {/* Status Filter Pills */}
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setFilter('ALL')}
              className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
              style={{ background: filter === 'ALL' ? 'var(--brand)' : 'var(--bg-elevated)', color: filter === 'ALL' ? '#fff' : 'var(--text-muted)', border: '1px solid var(--border)' }}>
              All ({allTables.length})
            </button>
            {Object.entries(STATUS_CFG).map(([s, cfg]) => (
              <button key={s} onClick={() => setFilter(s)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
                style={{ background: filter === s ? cfg.dot + '33' : 'var(--bg-elevated)', color: filter === s ? cfg.dot : 'var(--text-muted)', border: `1px solid ${filter === s ? cfg.dot : 'var(--border)'}` }}>
                <span className="w-2 h-2 rounded-full" style={{ background: cfg.dot }} />
                {cfg.label} ({counts[s] ?? 0})
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6 space-y-8">
        {loading && zones.length === 0 && (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={32} className="animate-spin" style={{ color: 'var(--brand)' }} />
          </div>
        )}

        {error && (
          <div className="rounded-xl p-4 text-center" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
            <AlertCircle size={28} className="mx-auto mb-2" style={{ color: '#ef4444' }} />
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{error}</p>
          </div>
        )}

        {filteredZones.map(zone => (
          <div key={zone.id}>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={14} style={{ color: 'var(--brand)' }} />
              <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>{zone.name}</h2>
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                {zone.tables.length} tables
              </span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
              {zone.tables.map(table => {
                const cfg = STATUS_CFG[table.status] ?? STATUS_CFG.AVAILABLE;
                const activeOrder = table.orders[0];
                const isClickable = ['AVAILABLE', 'OCCUPIED', 'BILLED'].includes(table.status);

                return (
                  <button key={table.id}
                    onClick={() => isClickable && handleTableClick(table)}
                    className="rounded-xl p-3 text-left transition-all duration-200 group"
                    style={{
                      background: cfg.bg,
                      border: `2px solid ${cfg.border}`,
                      cursor: isClickable ? 'pointer' : 'default',
                      opacity: table.status === 'DIRTY' ? 0.8 : 1,
                      transform: 'scale(1)',
                    }}
                    onMouseEnter={e => { if (isClickable) (e.currentTarget as HTMLElement).style.transform = 'scale(1.04)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}>

                    {/* Table Number */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-lg font-black" style={{ color: cfg.border }}>T{table.table_number}</span>
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: cfg.dot }} />
                    </div>

                    {/* Status */}
                    <p className="text-xs font-semibold" style={{ color: cfg.border }}>{cfg.label}</p>

                    {/* Capacity */}
                    <div className="flex items-center gap-1 mt-1" style={{ color: 'var(--text-muted)' }}>
                      <Users size={10} />
                      <span className="text-xs">{table.capacity}</span>
                    </div>

                    {/* Active order info */}
                    {activeOrder && (
                      <div className="mt-2 pt-2" style={{ borderTop: `1px solid ${cfg.border}44` }}>
                        <div className="flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                          <Clock size={10} />
                          <span className="text-xs">{elapsed(activeOrder.created_at)}</span>
                        </div>
                        {activeOrder.pax_count && (
                          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{activeOrder.pax_count} pax</p>
                        )}
                      </div>
                    )}

                    {/* Dirty overlay icon */}
                    {table.status === 'DIRTY' && <Brush size={14} className="mt-1" style={{ color: cfg.dot }} />}
                    {table.status === 'BILLED' && <CheckCircle2 size={14} className="mt-1" style={{ color: cfg.dot }} />}
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
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: cfg.dot }} />
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{cfg.label}</span>
              </div>
            ))}
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>· Click table to open order</span>
          </div>
        )}
      </div>
    </div>
  );
}
