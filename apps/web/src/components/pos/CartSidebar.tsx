'use client';

import { cn } from '@/lib/utils';
import { useCartStore, calcCartTotals } from '@/store/cart';
import type { CartItem } from '@respos/types';
import {
  Minus,
  Plus,
  Trash2,
  ChefHat,
  ReceiptText,
  ShoppingCart,
  StickyNote,
} from 'lucide-react';
import { useState } from 'react';

interface CartSidebarProps {
  onFireKOT: () => void;
  onBill: () => void;
  disabled?: boolean;
}

function formatPrice(paise: number): string {
  return `₹${(paise / 100).toFixed(2)}`;
}

function ItemTypeDot({ type }: { type: string }) {
  const colors: Record<string, string> = {
    VEG: 'bg-emerald-500',
    NON_VEG: 'bg-red-500',
    EGG: 'bg-amber-400',
    VEGAN: 'bg-teal-500',
  };
  return (
    <span
      className={cn(
        'inline-block h-2 w-2 rounded-sm flex-shrink-0 mt-1.5',
        colors[type] ?? 'bg-slate-400',
      )}
    />
  );
}

function CartLineItem({ item }: { item: CartItem }) {
  const { updateQuantity, removeItem } = useCartStore();
  const [editingNote, setEditingNote] = useState(false);
  const [noteValue, setNoteValue] = useState(item.notes ?? '');
  const lineTotal = (item.unit_price + item.addons_total) * item.quantity;

  return (
    <div className="group flex flex-col gap-1 py-3 border-b border-border last:border-0">
      <div className="flex items-start gap-2">
        <ItemTypeDot type={item.item_type} />
        <div className="flex-1 min-w-0">
          <p className="text-content-primary text-sm font-medium leading-tight truncate">
            {item.name}
          </p>
          {item.variant_name && (
            <p className="text-content-muted text-xs">{item.variant_name}</p>
          )}
          {item.addons.length > 0 && (
            <p className="text-content-muted text-xs">
              {item.addons.map((a) => a.name).join(', ')}
            </p>
          )}
        </div>
        <div className="flex-shrink-0 text-right">
          <p className="text-brand-700 text-sm font-bold">
            {formatPrice(lineTotal)}
          </p>
          <p className="text-content-muted text-xs">
            {formatPrice(item.unit_price + item.addons_total)} ea
          </p>
        </div>
      </div>

      {/* Qty + actions */}
      <div className="flex items-center justify-between pl-4">
        <div className="flex items-center gap-1">
          <button
            onClick={() => updateQuantity(item.cartLineId, -1)}
            className="h-6 w-6 rounded-lg bg-surface-3 hover:bg-surface-4 text-content-secondary flex items-center justify-center transition-colors border border-border"
          >
            <Minus className="h-3 w-3" />
          </button>
          <span className="w-7 text-center text-content-primary text-sm font-semibold">
            {item.quantity}
          </span>
          <button
            onClick={() => updateQuantity(item.cartLineId, +1)}
            className="h-6 w-6 rounded-lg bg-surface-3 hover:bg-surface-4 text-content-secondary flex items-center justify-center transition-colors border border-border"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setEditingNote((v) => !v)}
            className="h-6 w-6 rounded-lg bg-surface-3 hover:bg-warning/10 text-content-muted hover:text-warning-DEFAULT flex items-center justify-center transition-colors border border-border"
          >
            <StickyNote className="h-3 w-3" />
          </button>
          <button
            onClick={() => removeItem(item.cartLineId)}
            className="h-6 w-6 rounded-lg bg-surface-3 hover:bg-danger/10 text-content-muted hover:text-danger flex items-center justify-center transition-colors border border-border"
          >
            <Trash2 className="h-3 w-3" />
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
            className="input-field w-full text-xs py-1.5"
          />
        </div>
      )}
    </div>
  );
}

export function CartSidebar({ onFireKOT, onBill, disabled }: CartSidebarProps) {
  const { items, order_type, table_number, pax_count } = useCartStore();
  const totals = calcCartTotals(items);

  return (
    <aside className="flex flex-col h-full bg-surface-2 border-l border-border">
      {/* Header */}
      <div className="px-4 py-3.5 border-b border-border bg-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-brand-600" />
          <h2 className="text-content-primary font-bold text-sm">Order</h2>
          {totals.item_count > 0 && (
            <span className="h-5 px-1.5 rounded-full bg-brand-600 text-white text-[10px] font-bold flex items-center">
              {totals.item_count}
            </span>
          )}
        </div>
        <div className="text-right">
          <p className="text-xs text-content-muted">
            {order_type === 'DINE_IN'
              ? `Table ${table_number ?? '—'}`
              : order_type}
          </p>
          {order_type === 'DINE_IN' && (
            <p className="text-xs text-content-disabled">{pax_count} pax</p>
          )}
        </div>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto px-4 scrollbar-thin">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-8">
            <div className="h-16 w-16 rounded-2xl bg-surface-3 border border-border flex items-center justify-center">
              <ShoppingCart className="h-8 w-8 text-content-disabled" />
            </div>
            <p className="text-content-secondary text-sm font-medium">
              Cart is empty
            </p>
            <p className="text-content-muted text-xs">Tap any item to add it</p>
          </div>
        ) : (
          items.map((item) => (
            <CartLineItem key={item.cartLineId} item={item} />
          ))
        )}
      </div>

      {/* Totals */}
      {items.length > 0 && (
        <div className="bg-white border-t border-border px-4 pt-3 pb-2 space-y-1.5 text-sm">
          <div className="flex justify-between text-content-secondary">
            <span>Subtotal</span>
            <span className="font-medium">{formatPrice(totals.subtotal)}</span>
          </div>
          <div className="flex justify-between text-content-muted text-xs">
            <span>CGST</span>
            <span>{formatPrice(totals.cgst)}</span>
          </div>
          <div className="flex justify-between text-content-muted text-xs">
            <span>SGST</span>
            <span>{formatPrice(totals.sgst)}</span>
          </div>
          <div className="flex justify-between text-content-primary font-bold text-base pt-2 border-t border-border">
            <span>Total</span>
            <span className="text-brand-700">{formatPrice(totals.total)}</span>
          </div>
        </div>
      )}

      {/* CTA Buttons */}
      <div className="p-3 grid grid-cols-2 gap-2 bg-white border-t border-border">
        <button
          onClick={onFireKOT}
          disabled={disabled || items.length === 0}
          className={cn(
            'flex items-center justify-center gap-1.5 rounded-xl py-3 text-sm font-semibold transition-all border',
            'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200 hover:border-amber-300',
            'disabled:opacity-40 disabled:cursor-not-allowed',
          )}
        >
          <ChefHat className="h-4 w-4" /> Fire KOT
        </button>
        <button
          onClick={onBill}
          disabled={disabled || items.length === 0}
          className={cn(
            'flex items-center justify-center gap-1.5 rounded-xl py-3 text-sm font-semibold transition-all',
            'bg-brand-600 hover:bg-brand-700 text-white shadow-sm hover:shadow-md',
            'disabled:opacity-40 disabled:cursor-not-allowed',
          )}
        >
          <ReceiptText className="h-4 w-4" /> Bill
        </button>
      </div>
    </aside>
  );
}
