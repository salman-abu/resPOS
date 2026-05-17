'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import type { CartItem } from '@respos/types';
import { ChefHat, X, CheckCircle2, Loader2 } from 'lucide-react';

interface KotGroup {
  station: string;
  items: CartItem[];
  isHeld?: boolean;
}

interface KotModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  pendingItems: CartItem[];
  tableNumber?: string;
  orderType: string;
}

const STATION_META: Record<
  string,
  { label: string; code: string; bg: string; border: string; text: string }
> = {
  HOT_KITCHEN: {
    label: 'Hot Kitchen',
    code: 'HK',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    text: 'text-orange-400',
  },
  COLD_KITCHEN: {
    label: 'Cold Kitchen',
    code: 'CK',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/30',
    text: 'text-cyan-400',
  },
  BAR: {
    label: 'Bar',
    code: 'BR',
    bg: 'bg-fuchsia-500/10',
    border: 'border-fuchsia-500/30',
    text: 'text-fuchsia-400',
  },
  BAKERY: {
    label: 'Bakery',
    code: 'BK',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
  },
};

function groupByStation(items: CartItem[], isHeld = false): KotGroup[] {
  const map = new Map<string, CartItem[]>();
  items.forEach((i) => {
    const list = map.get(i.station_route) ?? [];
    list.push(i);
    map.set(i.station_route, list);
  });
  return Array.from(map.entries()).map(([station, items]) => ({
    station,
    items,
    isHeld,
  }));
}

export function KotModal({
  open,
  onClose,
  onConfirm,
  pendingItems,
  tableNumber,
  orderType,
}: KotModalProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const firingItems = pendingItems.filter((i) => i.fire_status === 'FIRED');
  const heldItems = pendingItems.filter((i) => i.fire_status === 'HELD');

  const firingGroups = groupByStation(firingItems, false);
  const heldGroups = groupByStation(heldItems, true);

  useEffect(() => {
    if (!open) {
      setSuccess(false);
      setLoading(false);
    }
  }, [open]);

  if (!open) return null;

  const handleConfirm = async () => {
    if (firingItems.length === 0) {
      onClose();
      return;
    }
    setLoading(true);
    try {
      await onConfirm();
      setSuccess(true);
      setTimeout(onClose, 1000);
    } catch {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-slate-900 border-2 border-slate-700 rounded-sm shadow-2xl overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b-2 border-slate-800 bg-slate-950">
          <div className="h-9 w-9 bg-amber-500 flex items-center justify-center border-2 border-amber-400">
            <ChefHat className="h-5 w-5 text-slate-900" />
          </div>
          <div>
            <h3 className="text-slate-100 font-black uppercase tracking-widest">
              Fire KOT
            </h3>
            <p className="text-slate-500 text-xs font-mono tracking-tight">
              {orderType === 'DINE_IN'
                ? `TBL ${tableNumber ?? '—'}`
                : orderType}
              {' · '}
              {pendingItems.length} item{pendingItems.length !== 1 && 's'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto text-slate-500 active:text-slate-300 transition-colors active:scale-[0.92]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Preview */}
        <div className="px-5 py-4 max-h-96 overflow-y-auto space-y-4 scrollbar-thin">
          {firingGroups.length > 0 && (
            <div className="space-y-3">
              <p className="text-[10px] font-black text-lime-400 uppercase tracking-[0.2em] px-1">
                FIRING NOW
              </p>
              {firingGroups.map(({ station, items }) => {
                const meta = STATION_META[station] ?? {
                  label: station,
                  code: station.slice(0, 2).toUpperCase(),
                  bg: 'bg-slate-800',
                  border: 'border-slate-700',
                  text: 'text-slate-400',
                };
                return (
                  <div
                    key={station}
                    className={cn('border-2 p-3', meta.bg, meta.border)}
                  >
                    <div
                      className={cn(
                        'flex items-center gap-1.5 text-[10px] font-black mb-2 uppercase tracking-[0.2em]',
                        meta.text,
                      )}
                    >
                      <span className="bg-slate-950 px-1 py-0.5 border border-slate-700 text-[9px]">
                        {meta.code}
                      </span>
                      <span>{meta.label}</span>
                    </div>
                    <div className="space-y-1.5">
                      {items.map((item) => (
                        <div
                          key={item.cartLineId}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="h-5 px-1.5 bg-slate-950 text-slate-100 text-xs font-black flex items-center justify-center border-2 border-slate-700 font-mono"
                              style={{ fontVariantNumeric: 'tabular-nums' }}
                            >
                              {item.quantity}
                            </span>
                            <span className="text-slate-100 text-sm font-bold tracking-tight">
                              {item.name}
                            </span>
                            {item.variant_name && (
                              <span className="text-slate-500 text-xs font-mono tracking-tight">
                                ({item.variant_name})
                              </span>
                            )}
                            {item.seat_number && (
                              <span className="px-1 py-0.5 bg-slate-950 border border-cyan-500/40 text-[9px] font-black text-cyan-400 uppercase tracking-wider">
                                S{item.seat_number}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {heldGroups.length > 0 && (
            <div className="space-y-3">
              <p className="text-[10px] font-black text-amber-400 uppercase tracking-[0.2em] px-1">
                HELD FOR LATER
              </p>
              {heldGroups.map(({ station, items }) => (
                <div
                  key={station}
                  className="border-2 border-dashed border-amber-500/20 bg-amber-500/5 p-3"
                >
                  <div className="space-y-1.5 opacity-60">
                    {items.map((item) => (
                      <div
                        key={item.cartLineId}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="text-slate-100 text-xs font-black font-mono"
                            style={{ fontVariantNumeric: 'tabular-nums' }}
                          >
                            {item.quantity}x
                          </span>
                          <span className="text-slate-100 text-sm font-bold tracking-tight">
                            {item.name}
                          </span>
                          {item.seat_number && (
                            <span className="text-[9px] font-black text-amber-400 uppercase tracking-wider">
                              S{item.seat_number}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t-2 border-slate-800 flex gap-3 bg-slate-950">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border-2 border-slate-700 bg-slate-800 text-slate-300 text-sm font-black uppercase tracking-widest active:bg-slate-700 active:text-slate-100 active:scale-[0.97] transition-all duration-75"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || success}
            className={cn(
              'flex-1 py-2.5 text-sm font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 active:scale-[0.97] duration-75',
              success
                ? 'bg-lime-500 text-slate-900 border-2 border-lime-400'
                : 'bg-amber-500 text-slate-900 border-2 border-amber-400 active:bg-amber-400',
              'disabled:cursor-not-allowed disabled:opacity-50',
            )}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : success ? (
              <>
                <CheckCircle2 className="h-4 w-4" /> FIRED
              </>
            ) : (
              <>
                <ChefHat className="h-4 w-4" /> CONFIRM & FIRE
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
