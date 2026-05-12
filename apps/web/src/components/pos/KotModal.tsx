'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import type { CartItem } from '@respos/types';
import { ChefHat, X, CheckCircle2, Loader2 } from 'lucide-react';

interface KotGroup { station: string; items: CartItem[]; }

interface KotModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (itemIds: string[]) => Promise<void>;
  pendingItems: CartItem[];
  tableNumber?: string;
  orderType: string;
}

const STATION_META: Record<string, { label: string; emoji: string; bg: string; text: string }> = {
  HOT_KITCHEN:  { label: 'Hot Kitchen',  emoji: '🔥', bg: 'bg-orange-50 border-orange-200', text: 'text-orange-700' },
  COLD_KITCHEN: { label: 'Cold Kitchen', emoji: '❄️', bg: 'bg-blue-50 border-blue-200',     text: 'text-blue-700'   },
  BAR:          { label: 'Bar',          emoji: '🍹', bg: 'bg-violet-50 border-violet-200', text: 'text-violet-700' },
  BAKERY:       { label: 'Bakery',       emoji: '🥐', bg: 'bg-amber-50 border-amber-200',   text: 'text-amber-700'  },
};

function groupByStation(items: CartItem[]): KotGroup[] {
  const map = new Map<string, CartItem[]>();
  items.forEach((i) => {
    const list = map.get(i.station_route) ?? [];
    list.push(i);
    map.set(i.station_route, list);
  });
  return Array.from(map.entries()).map(([station, items]) => ({ station, items }));
}

export function KotModal({ open, onClose, onConfirm, pendingItems, tableNumber, orderType }: KotModalProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const groups = groupByStation(pendingItems);

  useEffect(() => {
    if (!open) { setSuccess(false); setLoading(false); }
  }, [open]);

  if (!open) return null;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm(pendingItems.map((i) => i.cartLineId));
      setSuccess(true);
      setTimeout(onClose, 1000);
    } catch { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white border border-border rounded-2xl shadow-modal overflow-hidden animate-scale-in">

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
          <div className="h-9 w-9 rounded-xl bg-amber-100 flex items-center justify-center">
            <ChefHat className="h-5 w-5 text-amber-700" />
          </div>
          <div>
            <h3 className="text-content-primary font-bold">Fire KOT</h3>
            <p className="text-content-muted text-xs">
              {orderType === 'DINE_IN' ? `Table ${tableNumber ?? '—'}` : orderType}
              {' · '}{pendingItems.length} item{pendingItems.length !== 1 && 's'}
            </p>
          </div>
          <button onClick={onClose} className="ml-auto text-content-muted hover:text-content-secondary transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Preview */}
        <div className="px-5 py-4 max-h-72 overflow-y-auto space-y-3 scrollbar-thin">
          {groups.map(({ station, items }) => {
            const meta = STATION_META[station] ?? { label: station, emoji: '🍽️', bg: 'bg-surface-3 border-border', text: 'text-content-secondary' };
            return (
              <div key={station} className={cn("rounded-xl border p-3", meta.bg)}>
                <div className={cn("flex items-center gap-1.5 text-xs font-bold mb-2 uppercase tracking-wide", meta.text)}>
                  <span>{meta.emoji}</span>
                  <span>{meta.label}</span>
                </div>
                <div className="space-y-1.5">
                  {items.map((item) => (
                    <div key={item.cartLineId} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="h-5 w-5 rounded-md bg-white text-content-primary text-xs font-bold flex items-center justify-center border border-border shadow-sm">
                          {item.quantity}
                        </span>
                        <span className="text-content-primary text-sm font-medium">{item.name}</span>
                        {item.variant_name && (
                          <span className="text-content-muted text-xs">({item.variant_name})</span>
                        )}
                      </div>
                      {item.notes && (
                        <span className="text-warning-DEFAULT text-xs italic">{item.notes}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-border flex gap-3 bg-surface-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-border bg-white text-content-secondary hover:bg-surface-3 text-sm font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || success}
            className={cn(
              'flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2',
              success
                ? 'bg-success-DEFAULT text-white'
                : 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm hover:shadow-md',
              'disabled:cursor-not-allowed'
            )}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : success ? (
              <><CheckCircle2 className="h-4 w-4" /> Fired!</>
            ) : (
              <><ChefHat className="h-4 w-4" /> Confirm & Fire</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
