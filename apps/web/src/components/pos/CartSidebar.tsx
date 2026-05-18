'use client';

import { cn } from '@/lib/utils';
import { useCartStore, calcCartTotals } from '@/store/cart';
import { useDeviceRole } from '@/hooks';
import { ShiftCloseModal } from '@/components/pos/ShiftCloseModal';
import type { CartItem } from '@respos/types';
import {
  Minus,
  Plus,
  Trash2,
  ChefHat,
  ReceiptText,
  ShoppingCart,
  StickyNote,
  Pause,
  Play,
  User,
  Star,
  ChevronRight,
  UserPlus,
  PauseCircle,
  Scissors,
  Printer,
  PlusCircle,
  LogOut,
  PlayCircle,
  Wine,
  RotateCcw,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { scheduleVoidItem, cancelVoidJob, getUpsellSuggestions } from '@/lib/api';
import { CustomerModal } from './CustomerModal';

interface CartSidebarProps {
  onFireKOT: () => void;
  onBill: () => void;
  onHold?: () => void;
  onSplitPay?: () => void;
  onPrintReceipt?: () => void;
  onNewOrder?: () => void;
  onFireHeld?: () => void;
  onRepeatRound?: () => void;
  onOpenTab?: () => void;
  disabled?: boolean;
}

function formatPrice(paise: number): string {
  return `₹${(paise / 100).toFixed(2)}`;
}

function ItemTypeDot({ type }: { type: string }) {
  const colors: Record<string, string> = {
    VEG: 'bg-success-default',
    NON_VEG: 'bg-danger-default',
    EGG: 'bg-warning-default',
    VEGAN: 'bg-info-default',
  };
  return (
    <span
      className={cn(
        'inline-block h-2 w-2 rounded-none flex-shrink-0 mt-1.5',
        colors[type] ?? 'bg-content-muted',
      )}
    />
  );
}

function CartLineItem({ item }: { item: CartItem }) {
  const {
    updateQuantity,
    removeItem,
    toggleHold,
    updateSeat,
    order_type,
    pax_count,
  } = useCartStore();
  const [editingNote, setEditingNote] = useState(false);
  const [noteValue, setNoteValue] = useState(item.notes ?? '');
  const [voiding, setVoiding] = useState(false);
  const [voidJobId, setVoidJobId] = useState<string | null>(null);

  const lineTotal = (item.unit_price + item.addons_total) * item.quantity;

  const handleRemove = async () => {
    if (!item.id) {
      removeItem(item.cartLineId);
      return;
    }
    try {
      setVoiding(true);
      const activeOrderId = useCartStore.getState().active_order_id;
      if (!activeOrderId) throw new Error('No active order ID');
      const { job_id } = await scheduleVoidItem(activeOrderId, item.id);
      setVoidJobId(job_id);
      setTimeout(() => {
        setVoiding((v) => {
          if (v) removeItem(item.cartLineId);
          return v;
        });
      }, 10000);
    } catch (e: any) {
      setVoiding(false);
      console.error(e);
      alert(e.message || 'Failed to schedule void');
    }
  };

  const handleUndoVoid = async () => {
    if (!voidJobId) return;
    try {
      const { cancelled } = await cancelVoidJob(voidJobId);
      if (cancelled) {
        setVoiding(false);
        setVoidJobId(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (voiding) {
    return (
      <div className="flex items-center justify-between py-3 border-b border-dashed border-border-subtle bg-danger-light px-2 animate-pulse">
        <div className="flex items-center gap-2">
          <Trash2 className="h-4 w-4 text-danger-default" />
          <span className="text-xs font-bold text-danger-default uppercase tracking-wider">
            Voiding in 10s...
          </span>
        </div>
        <button
          onClick={handleUndoVoid}
          className="text-xs font-black text-success-default px-3 py-2.5 bg-surface-sunken border border-success-default uppercase tracking-wider active:scale-[0.97] transition-transform duration-75 min-h-[44px] min-w-[44px]"
        >
          UNDO
        </button>
      </div>
    );
  }

  return (
    <div className="group flex flex-col gap-1 py-3 border-b border-dashed border-border-subtle last:border-0">
      <div className="flex items-start gap-2">
        <ItemTypeDot type={item.item_type} />
        <div className="flex-1 min-w-0">
          <p className="text-content-primary text-sm font-bold leading-tight truncate tracking-tight">
            {item.name}
            {item.fire_status === 'HELD' && (
              <span className="ml-2 inline-flex items-center gap-1 px-1.5 py-0.5 bg-warning-default text-content-inverse text-[9px] font-black uppercase tracking-wider">
                <Pause className="h-2 w-2" /> HELD
              </span>
            )}
          </p>
          {item.variant_name && (
            <p className="text-content-muted text-xs font-mono tracking-tight">
              {item.variant_name}
            </p>
          )}
          {(item.addons?.length ?? 0) > 0 && (
            <p className="text-content-muted text-[10px] font-mono tracking-tight">
              {item.addons!.map((a) => a.name).join(', ')}
            </p>
          )}
        </div>
        <div className="flex-shrink-0 text-right">
          <p
            className="text-content-primary text-sm font-black font-mono tracking-tight"
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {formatPrice(lineTotal)}
          </p>
          <p
            className="text-content-muted text-xs font-mono tracking-tight"
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {formatPrice(item.unit_price + item.addons_total)} ea
          </p>
        </div>
      </div>

      {/* Qty + actions */}
      <div className="flex items-center justify-between pl-4">
        <div className="flex items-center gap-1">
          <button
            onClick={() => updateQuantity(item.cartLineId, -1)}
            aria-label="Decrease quantity"
            className="h-11 w-11 bg-surface-sunken text-content-secondary flex items-center justify-center border border-border-strong active:bg-border-strong active:text-content-inverse active:scale-[0.92] transition-all duration-75"
          >
            <Minus className="h-3 w-3" />
          </button>
          <span
            className="w-7 text-center text-content-primary text-sm font-black font-mono"
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {item.quantity}
          </span>
          <button
            onClick={() => updateQuantity(item.cartLineId, +1)}
            aria-label="Increase quantity"
            className="h-11 w-11 bg-surface-sunken text-content-secondary flex items-center justify-center border border-border-strong active:bg-border-strong active:text-content-inverse active:scale-[0.92] transition-all duration-75"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-1 transition-opacity">
          {order_type === 'DINE_IN' && (
            <div className="flex items-center gap-1 mr-1 px-1.5 py-0.5 bg-surface-sunken border border-border-subtle">
              <User className="h-2.5 w-2.5 text-content-muted" />
              <select
                value={item.seat_number ?? ''}
                onChange={(e) =>
                  updateSeat(
                    item.cartLineId,
                    e.target.value ? parseInt(e.target.value) : undefined,
                  )
                }
                className="bg-transparent text-[10px] font-black text-content-muted outline-none appearance-none cursor-pointer font-mono tracking-tight"
              >
                <option value="">Seat?</option>
                {Array.from({ length: pax_count || 1 }).map((_, idx) => (
                  <option key={idx + 1} value={idx + 1}>
                    S{idx + 1}
                  </option>
                ))}
              </select>
            </div>
          )}
          <button
            onClick={() => toggleHold(item.cartLineId)}
            aria-label={item.fire_status === 'HELD' ? 'Fire Item' : 'Hold Item'}
            className={cn(
              'h-11 w-11 flex items-center justify-center border active:scale-[0.92] transition-all duration-75',
              item.fire_status === 'HELD'
                ? 'bg-warning-default text-content-inverse border-warning-default'
                : 'bg-surface-sunken text-content-muted border-border-subtle active:bg-warning-light active:text-warning-default',
            )}
            title={item.fire_status === 'HELD' ? 'Fire Item' : 'Hold Item'}
          >
            {item.fire_status === 'HELD' ? (
              <Play className="h-4 w-4" />
            ) : (
              <Pause className="h-4 w-4" />
            )}
          </button>
          <button
            onClick={() => setEditingNote((v) => !v)}
            aria-label="Edit Note"
            className="h-11 w-11 bg-surface-sunken text-content-muted flex items-center justify-center border border-border-subtle active:bg-border-strong active:text-content-inverse active:scale-[0.92] transition-all duration-75"
          >
            <StickyNote className="h-4 w-4" />
          </button>
          <button
            onClick={handleRemove}
            aria-label="Remove Item"
            className="h-11 w-11 bg-surface-sunken text-content-muted flex items-center justify-center border border-border-subtle active:bg-danger-light active:text-danger-default active:scale-[0.92] transition-all duration-75"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {editingNote && (
        <div className="pl-4 pr-1">
          <input
            autoFocus
            type="text"
            value={noteValue}
            onChange={(e) => setNoteValue(e.target.value)}
            onBlur={() => {
              useCartStore.getState().updateNotes(item.cartLineId, noteValue);
              setEditingNote(false);
            }}
            placeholder="Add instruction…"
            className="w-full bg-surface-card border border-border-subtle text-content-primary text-xs py-1.5 px-2 outline-none focus:border-brand-default placeholder:text-content-muted font-mono tracking-tight"
          />
        </div>
      )}
    </div>
  );
}

// ─── Compact icon button for the secondary action row ───────────────────────
interface IconBtnProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  danger?: boolean;
}
function IconBtn({
  icon,
  label,
  onClick,
  disabled,
  active,
  danger,
}: IconBtnProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      className={cn(
        'flex flex-col items-center justify-center gap-0.5 flex-1 py-3 border-r border-border-subtle last:border-r-0 text-[9px] font-black uppercase tracking-wider active:scale-[0.94] transition-all duration-75',
        active
          ? 'bg-warning-light text-warning-default'
          : danger
            ? 'bg-surface-sunken text-danger-default hover:bg-danger-light'
            : 'bg-surface-sunken text-content-muted hover:bg-surface-base hover:text-content-primary',
        'disabled:opacity-30 disabled:cursor-not-allowed',
      )}
    >
      <span className="h-4 w-4 flex items-center justify-center">{icon}</span>
      <span className="leading-none">{label}</span>
    </button>
  );
}

export function CartSidebar({
  onFireKOT,
  onBill,
  onHold,
  onSplitPay,
  onPrintReceipt,
  onNewOrder,
  onFireHeld,
  onRepeatRound,
  onOpenTab,
}: CartSidebarProps) {
  const {
    items,
    order_type,
    table_number,
    pax_count,
    customer,
    redeem_points,
    setRedeemPoints,
    rupees_per_point,
    service_charge_rate,
    clearCart,
    active_order_id,
  } = useCartStore();
  const { role } = useDeviceRole();
  const totals = calcCartTotals(
    items,
    redeem_points,
    rupees_per_point,
    service_charge_rate,
  );
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [shiftCloseOpen, setShiftCloseOpen] = useState(false);
  const [upsells, setUpsells] = useState<any[]>([]);
  const [upsellDismissed, setUpsellDismissed] = useState(false);

  // MOD-08: Smart Upsell
  useEffect(() => {
    if (items.length === 0 || upsellDismissed) {
      setUpsells([]);
      return;
    }
    const itemIds = items.map((i) => i.item_id);
    let cancelled = false;
    getUpsellSuggestions(itemIds)
      .then((data) => {
        if (!cancelled) setUpsells(data || []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [items.map((i) => i.item_id).join(','), upsellDismissed]);

  const hasItems = items.length > 0;
  const hasActiveOrder = !!active_order_id;
  const hasHeld = items.some((i) => i.fire_status === 'HELD');

  return (
    <aside className="flex flex-col h-full bg-surface-card border-l border-border-subtle">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 px-4 py-2.5 border-b border-border-subtle bg-surface-base flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-4 w-4 text-brand-default" />
          <h2 className="text-content-primary font-black text-sm uppercase tracking-widest">
            Order
          </h2>
          {totals.item_count > 0 && (
            <span
              className="h-5 px-1.5 bg-brand-default text-content-inverse text-[10px] font-black flex items-center font-mono"
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {totals.item_count}
            </span>
          )}
        </div>
        <div className="text-right">
          <p className="text-xs text-content-secondary font-mono tracking-tight">
            {order_type === 'DINE_IN'
              ? `TBL ${table_number ?? '—'}`
              : order_type}
          </p>
          {order_type === 'DINE_IN' && (
            <p className="text-xs text-content-muted font-mono tracking-tight">
              {pax_count} PAX
            </p>
          )}
        </div>
      </div>

      {/* ── Customer Info ────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 px-3 py-2 bg-surface-base border-b border-border-subtle">
        {customer ? (
          <button
            onClick={() => setCustomerModalOpen(true)}
            className="w-full flex items-center justify-between p-2 bg-surface-sunken border border-brand-default/30 group active:scale-[0.98] transition-transform duration-75"
          >
            <div className="flex items-center gap-3">
              <div className="h-7 w-7 bg-brand-default text-content-inverse flex items-center justify-center text-xs font-black">
                {customer.name[0]}
              </div>
              <div className="text-left">
                <p className="text-xs font-black text-content-primary truncate max-w-[110px] uppercase tracking-wider">
                  {customer.name}
                </p>
                <p
                  className="text-[10px] text-brand-default font-black flex items-center gap-1 font-mono tracking-tight"
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                >
                  <Star className="h-2.5 w-2.5 fill-brand-default" />{' '}
                  {customer.points} PTS
                </p>
              </div>
            </div>
            <ChevronRight className="h-3 w-3 text-brand-default opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        ) : (
          <button
            onClick={() => setCustomerModalOpen(true)}
            className="w-full flex items-center gap-2 p-2 border border-dashed border-border-subtle active:border-brand-default active:bg-surface-sunken transition-all text-content-secondary active:text-brand-default"
          >
            <div className="h-7 w-7 bg-surface-sunken flex items-center justify-center border border-border-subtle">
              <UserPlus className="h-3.5 w-3.5" />
            </div>
            <span className="text-xs font-black uppercase tracking-widest">
              Add Guest Info
            </span>
          </button>
        )}
      </div>

      <CustomerModal
        open={customerModalOpen}
        onClose={() => setCustomerModalOpen(false)}
      />

      {/* ── Loyalty Redemption ───────────────────────────────────────────────── */}
      {customer && (customer.points > 0 || redeem_points > 0) && (
        <div className="flex-shrink-0 px-4 py-2 bg-surface-base border-b border-border-subtle flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star className="h-3.5 w-3.5 text-info-default fill-info-default" />
            <span className="text-xs font-black text-content-primary uppercase tracking-widest">
              Redeem Points
            </span>
          </div>
          <div className="flex items-center gap-2">
            {redeem_points > 0 && (
              <span
                className="text-xs font-black text-info-default font-mono tracking-tight"
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                -{formatPrice(totals.discount)}
              </span>
            )}
            <input
              type="checkbox"
              checked={redeem_points > 0}
              onChange={(e) => {
                if (e.target.checked) {
                  setRedeemPoints(customer.points);
                } else {
                  setRedeemPoints(0);
                }
              }}
              className="h-4 w-4 border border-info-default bg-surface-base text-info-default focus:ring-info-default cursor-pointer rounded-none"
            />
          </div>
        </div>
      )}

      {/* ── MOD-08: Smart Upsell ───────────────────────────────────────────── */}
      {upsells.length > 0 && !upsellDismissed && (
        <div className="flex-shrink-0 px-4 py-2 bg-surface-base border-b border-border-subtle">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-black text-content-muted uppercase tracking-widest">
              Customers also add
            </span>
            <button
              onClick={() => setUpsellDismissed(true)}
              className="text-[10px] text-content-muted hover:text-content-secondary"
            >
              Dismiss
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-thin pb-1">
            {upsells.map((u) => (
              <button
                key={u.id}
                onClick={() => {
                  // Add to cart via cart store - parent component handles this
                  // We'll dispatch a custom event for the POS page to handle
                  window.dispatchEvent(
                    new CustomEvent('add-upsell-item', {
                      detail: { itemId: u.id },
                    }),
                  );
                }}
                className="flex-shrink-0 px-3 py-1.5 bg-info-light border border-info-default rounded-lg text-left active:scale-[0.97] transition-transform"
              >
                <p className="text-xs font-bold text-content-primary truncate max-w-[140px]">
                  {u.name}
                </p>
                <p className="text-[10px] font-bold text-info-default">
                  +{formatPrice(u.price)}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Items (scrollable) ───────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 scrollbar-thin min-h-0">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-8">
            <div className="h-14 w-14 bg-surface-sunken border border-border-subtle flex items-center justify-center">
              <ShoppingCart className="h-7 w-7 text-content-muted" />
            </div>
            <p className="text-content-secondary text-sm font-black uppercase tracking-widest">
              Cart is empty
            </p>
            <p className="text-content-muted text-xs font-bold uppercase tracking-wider">
              Tap any item to add it
            </p>
          </div>
        ) : (
          items.map((item) => (
            <CartLineItem key={item.cartLineId} item={item} />
          ))
        )}
      </div>

      {/* ── Totals ──────────────────────────────────────────────────────────── */}
      {items.length > 0 && (
        <div className="flex-shrink-0 bg-surface-base border-t border-border-subtle px-4 pt-2.5 pb-2 space-y-1 text-sm">
          <div className="flex justify-between text-content-secondary">
            <span className="text-xs font-bold uppercase tracking-wider">
              Subtotal
            </span>
            <span
              className="font-medium font-mono tracking-tight"
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {formatPrice(totals.subtotal)}
            </span>
          </div>
          <div className="flex justify-between text-content-muted text-xs">
            <span className="font-bold uppercase tracking-wider">CGST</span>
            <span
              className="font-mono tracking-tight"
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {formatPrice(totals.cgst)}
            </span>
          </div>
          <div className="flex justify-between text-content-muted text-xs">
            <span className="font-bold uppercase tracking-wider">SGST</span>
            <span
              className="font-mono tracking-tight"
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {formatPrice(totals.sgst)}
            </span>
          </div>
          {totals.discount > 0 && (
            <div className="flex justify-between text-info-default text-xs font-black">
              <span className="uppercase tracking-wider">Points Discount</span>
              <span
                className="font-mono tracking-tight"
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                -{formatPrice(totals.discount)}
              </span>
            </div>
          )}
          <div className="flex justify-between text-content-primary font-black text-base pt-1.5 border-t border-border-subtle">
            <span className="uppercase tracking-widest">Total</span>
            <span
              className="text-success-default font-mono tracking-tight"
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {formatPrice(totals.total)}
            </span>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          STICKY ACTION FOOTER — always visible, never scrolled off
      ══════════════════════════════════════════════════════════════════════ */}

      {/* Primary: FIRE KOT + PAY BILL — large, always accessible */}
      <div className="flex-shrink-0 grid grid-cols-2 border-t border-border-strong">
        <button
          id="btn-fire-kot"
          onClick={onFireKOT}
          disabled={!hasItems}
          className="flex flex-col items-center justify-center gap-1 py-4 bg-success-default text-content-inverse font-black text-sm uppercase tracking-widest border-r border-success-default active:bg-success-light disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.97] transition-all duration-75"
        >
          <ChefHat className="h-6 w-6" />
          <span>Fire KOT</span>
        </button>
        {role !== 'WAITER' ? (
          <button
            id="btn-pay-bill"
            onClick={onBill}
            disabled={!hasItems}
            className="flex flex-col items-center justify-center gap-1 py-4 bg-brand-default text-content-inverse font-black text-sm uppercase tracking-widest active:bg-brand-light disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.97] transition-all duration-75"
          >
            <ReceiptText className="h-6 w-6" />
            <span>Pay Bill</span>
          </button>
        ) : (
          <div className="flex flex-col items-center justify-center gap-1 py-4 bg-surface-sunken text-content-muted text-xs font-black uppercase tracking-widest">
            <ReceiptText className="h-5 w-5" />
            <span>Pay Bill</span>
          </div>
        )}
      </div>

      {/* Secondary: compact icon row */}
      <div className="flex-shrink-0 flex border-t border-border-subtle bg-surface-sunken">
        {hasHeld && (
          <IconBtn
            icon={<PlayCircle className="h-4 w-4" />}
            label="Fire Held"
            onClick={onFireHeld ?? (() => {})}
            active
          />
        )}
        <IconBtn
          icon={<PauseCircle className="h-4 w-4" />}
          label="Hold"
          onClick={onHold ?? (() => {})}
          disabled={!hasItems}
        />
        {role !== 'WAITER' && (
          <IconBtn
            icon={<Scissors className="h-4 w-4" />}
            label="Split"
            onClick={onSplitPay ?? (() => {})}
            disabled={!hasItems}
          />
        )}
        {role !== 'WAITER' && (
          <IconBtn
            icon={<Printer className="h-4 w-4" />}
            label="Print"
            onClick={onPrintReceipt ?? (() => {})}
            disabled={!hasItems}
          />
        )}
        {hasActiveOrder && (
          <IconBtn
            icon={<RotateCcw className="h-4 w-4" />}
            label="Repeat"
            onClick={onRepeatRound ?? (() => {})}
          />
        )}
        {hasActiveOrder && (
          <IconBtn
            icon={<Wine className="h-4 w-4" />}
            label="Bar Tab"
            onClick={onOpenTab ?? (() => {})}
          />
        )}
        <IconBtn
          icon={<PlusCircle className="h-4 w-4" />}
          label="New"
          onClick={onNewOrder ?? (() => {})}
        />
        {role !== 'WAITER' && (
          <IconBtn
            icon={<Trash2 className="h-4 w-4" />}
            label="Void All"
            onClick={clearCart}
            disabled={!hasItems}
            danger
          />
        )}
      </div>

      {/* Close Shift — bottom, always visible for cashiers */}
      {role !== 'WAITER' && (
        <div className="flex-shrink-0 border-t border-border-subtle">
          <button
            id="btn-close-shift"
            onClick={() => setShiftCloseOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-surface-base text-content-muted text-xs font-black uppercase tracking-widest hover:bg-surface-sunken hover:text-content-primary active:bg-surface-base active:scale-[0.98] transition-all duration-75 border-0"
          >
            <LogOut className="h-3.5 w-3.5" />
            Close Shift
          </button>
        </div>
      )}

      <ShiftCloseModal
        open={shiftCloseOpen}
        onClose={() => setShiftCloseOpen(false)}
      />
    </aside>
  );
}
