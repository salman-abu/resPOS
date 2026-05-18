'use client';

import { useState } from 'react';
import { X, Plus, Minus, Check, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MenuItem, Variant, CartAddon } from '@respos/types';

interface Props {
  item: MenuItem;
  onConfirm: (
    item: MenuItem,
    variant?: Variant,
    addons?: CartAddon[],
    qty?: number,
  ) => void;
  onClose: () => void;
}

function fmt(paise: number) {
  return `₹${(paise / 100).toFixed(0)}`;
}

export function ItemCustomiserModal({ item, onConfirm, onClose }: Props) {
  const hasVariants = item.variants && item.variants.length > 0;
  const hasAddons =
    item.addons && item.addons.filter((a) => a.is_available).length > 0;
  const hasModifierGroups =
    item.modifier_groups && item.modifier_groups.length > 0;

  const [selectedVariant, setSelectedVariant] = useState<Variant | undefined>(
    hasVariants ? item.variants[0] : undefined,
  );
  // Using Set to store addon ids
  const [selectedAddons, setSelectedAddons] = useState<Set<string>>(new Set());
  // Mapping of ModifierGroup ID -> Array of selected Modifier IDs
  const [selectedModifiers, setSelectedModifiers] = useState<
    Record<string, string[]>
  >({});

  const [qty, setQty] = useState<number | string>(1);

  const toggleAddon = (addonId: string) => {
    setSelectedAddons((prev) => {
      const next = new Set(prev);
      if (next.has(addonId)) next.delete(addonId);
      else next.add(addonId);
      return next;
    });
  };

  const toggleModifier = (
    groupId: string,
    modifierId: string,
    minSelect: number,
    maxSelect: number,
  ) => {
    setSelectedModifiers((prev) => {
      const current = prev[groupId] || [];
      if (current.includes(modifierId)) {
        return {
          ...prev,
          [groupId]: current.filter((id) => id !== modifierId),
        };
      } else {
        if (maxSelect === 1) {
          return { ...prev, [groupId]: [modifierId] };
        }
        if (current.length < maxSelect) {
          return { ...prev, [groupId]: [...current, modifierId] };
        }
        return prev;
      }
    });
  };

  const parsedQty = typeof qty === 'number' ? qty : parseFloat(qty) || 1;
  const unitPrice = item.base_price + (selectedVariant?.additional_price ?? 0);
  const addonsTotal = item.addons
    .filter((a) => selectedAddons.has(a.id))
    .reduce((s, a) => s + a.price, 0);
  const modifiersTotal =
    item.modifier_groups?.reduce((sum, g) => {
      const selectedIds = selectedModifiers[g.id] || [];
      const groupSum = g.modifiers
        .filter((m) => selectedIds.includes(m.id))
        .reduce((s, m) => s + m.price_adjustment, 0);
      return sum + groupSum;
    }, 0) ?? 0;

  const lineTotal = (unitPrice + addonsTotal + modifiersTotal) * parsedQty;

  const isFormValid = () => {
    if (hasVariants && !selectedVariant) return false;
    if (hasModifierGroups) {
      for (const group of item.modifier_groups!) {
        const current = selectedModifiers[group.id] || [];
        if (group.is_required && current.length < group.min_select)
          return false;
      }
    }
    return true;
  };

  const handleConfirm = () => {
    const chosenAddons: CartAddon[] = item.addons
      .filter((a) => selectedAddons.has(a.id))
      .map((a) => ({ id: a.id, name: a.name, price: a.price }));

    // Add modifiers as addons for simplicity in cart representation
    if (item.modifier_groups) {
      item.modifier_groups.forEach((group) => {
        const selectedIds = selectedModifiers[group.id] || [];
        group.modifiers
          .filter((m) => selectedIds.includes(m.id))
          .forEach((m) => {
            chosenAddons.push({
              id: m.id,
              name: `${group.name}: ${m.name}`,
              price: m.price_adjustment,
              modifier_id: m.id,
            });
          });
      });
    }

    onConfirm(item, selectedVariant, chosenAddons, parsedQty);
    onClose();
  };

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Modal */}
      <div
        className="relative w-full sm:max-w-md bg-surface-card border-2 border-border-subtle shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start gap-3 p-5 border-b-2 border-border-strong bg-surface-base">
          <div className="flex-1">
            <h2 className="font-black text-lg text-content-primary leading-tight tracking-tight uppercase">
              {item.name}
            </h2>
            {item.description && (
              <p className="text-sm text-content-muted mt-0.5 line-clamp-2 font-medium uppercase tracking-wide">
                {item.description}
              </p>
            )}
            <p
              className="text-cyan-400 font-black text-sm mt-1 font-mono tracking-tight"
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {fmt(item.base_price)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 bg-surface-sunken flex items-center justify-center text-content-secondary active:text-content-primary active:bg-slate-700 active:scale-[0.92] transition-all flex-shrink-0 border-2 border-border-subtle"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[60vh] p-5 space-y-5">
          {/* Variants */}
          {hasVariants && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <p className="font-bold text-sm text-content-primary uppercase tracking-wider">
                  Choose Size / Variant
                </p>
                <span className="text-[10px] px-1.5 py-0.5 bg-rose-500/10 text-rose-400 font-black border border-rose-500/30 uppercase tracking-wider">
                  Required
                </span>
              </div>
              <div className="space-y-2">
                {item.variants.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariant(v)}
                    className={cn(
                      'w-full flex items-center justify-between px-4 py-3 border-2 text-sm active:scale-[0.98] transition-transform duration-75',
                      selectedVariant?.id === v.id
                        ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400'
                        : 'border-border-subtle bg-surface-sunken text-content-primary active:border-border-strong active:bg-slate-700',
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'h-4 w-4 border-2 flex items-center justify-center flex-shrink-0',
                          selectedVariant?.id === v.id
                            ? 'border-cyan-500 bg-cyan-500'
                            : 'border-border-strong',
                        )}
                      >
                        {selectedVariant?.id === v.id && (
                          <div className="h-1.5 w-1.5 bg-surface-card" />
                        )}
                      </div>
                      <span className="font-bold tracking-tight">{v.name}</span>
                    </div>
                    <span
                      className={cn(
                        'font-black text-xs font-mono tracking-tight',
                        v.additional_price > 0
                          ? 'text-cyan-400'
                          : 'text-content-muted',
                      )}
                    >
                      {v.additional_price > 0
                        ? `+${fmt(v.additional_price)}`
                        : 'Base'}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Modifier Groups */}
          {hasModifierGroups &&
            item.modifier_groups!.map((group) => (
              <section key={group.id}>
                <div className="flex items-center gap-2 mb-3">
                  <p className="font-bold text-sm text-content-primary uppercase tracking-wider">
                    {group.name}
                  </p>
                  {group.is_required ? (
                    <span className="text-[10px] px-1.5 py-0.5 bg-rose-500/10 text-rose-400 font-black border border-rose-500/30 uppercase tracking-wider">
                      Required (Min {group.min_select})
                    </span>
                  ) : (
                    <span className="text-[10px] px-1.5 py-0.5 bg-lime-500/10 text-lime-400 font-black border border-lime-500/30 uppercase tracking-wider">
                      Optional
                    </span>
                  )}
                  {group.max_select > 1 && (
                    <span className="text-[10px] text-content-muted font-black uppercase tracking-wider">
                      Max {group.max_select}
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  {group.modifiers
                    .filter((m) => m.is_available)
                    .map((m) => {
                      const selectedIds = selectedModifiers[group.id] || [];
                      const checked = selectedIds.includes(m.id);
                      return (
                        <button
                          key={m.id}
                          onClick={() =>
                            toggleModifier(
                              group.id,
                              m.id,
                              group.min_select,
                              group.max_select,
                            )
                          }
                          className={cn(
                            'w-full flex items-center justify-between px-4 py-3 border-2 text-sm active:scale-[0.98] transition-transform duration-75',
                            checked
                              ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400'
                              : 'border-border-subtle bg-surface-sunken text-content-primary active:border-border-strong active:bg-slate-700',
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                group.max_select === 1
                                  ? 'h-4 w-4 border-2 flex items-center justify-center flex-shrink-0'
                                  : 'h-4 w-4 border-2 flex items-center justify-center flex-shrink-0',
                                checked
                                  ? group.max_select === 1
                                    ? 'border-cyan-500 bg-cyan-500'
                                    : 'border-lime-500 bg-lime-500'
                                  : 'border-border-strong',
                              )}
                            >
                              {checked && group.max_select === 1 && (
                                <div className="h-1.5 w-1.5 bg-surface-card" />
                              )}
                              {checked && group.max_select > 1 && (
                                <Check className="h-2.5 w-2.5 text-content-inverse stroke-[3]" />
                              )}
                            </div>
                            <span className="font-bold tracking-tight">
                              {m.name}
                            </span>
                          </div>
                          <span
                            className={cn(
                              'font-black text-xs font-mono tracking-tight',
                              m.price_adjustment > 0
                                ? 'text-cyan-400'
                                : 'text-content-muted',
                            )}
                          >
                            {m.price_adjustment > 0
                              ? `+${fmt(m.price_adjustment)}`
                              : 'Free'}
                          </span>
                        </button>
                      );
                    })}
                </div>
              </section>
            ))}

          {/* Addons */}
          {hasAddons && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <p className="font-bold text-sm text-content-primary uppercase tracking-wider">
                  Add-ons
                </p>
                <span className="text-[10px] px-1.5 py-0.5 bg-lime-500/10 text-lime-400 font-black border border-lime-500/30 uppercase tracking-wider">
                  Optional
                </span>
              </div>
              <div className="space-y-2">
                {item.addons
                  .filter((a) => a.is_available)
                  .map((addon) => {
                    const checked = selectedAddons.has(addon.id);
                    return (
                      <button
                        key={addon.id}
                        onClick={() => toggleAddon(addon.id)}
                        className={cn(
                          'w-full flex items-center justify-between px-4 py-3 border-2 text-sm active:scale-[0.98] transition-transform duration-75',
                          checked
                            ? 'border-lime-500 bg-lime-500/10 text-lime-400'
                            : 'border-border-subtle bg-surface-sunken text-content-primary active:border-border-strong active:bg-slate-700',
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              'h-4 w-4 border-2 flex items-center justify-center flex-shrink-0',
                              checked
                                ? 'border-lime-500 bg-lime-500'
                                : 'border-border-strong',
                            )}
                          >
                            {checked && (
                              <Check className="h-2.5 w-2.5 text-content-inverse stroke-[3]" />
                            )}
                          </div>
                          <span className="font-bold tracking-tight">
                            {addon.name}
                          </span>
                        </div>
                        <span className="text-cyan-400 font-black text-xs font-mono tracking-tight">
                          +{fmt(addon.price)}
                        </span>
                      </button>
                    );
                  })}
              </div>
            </section>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t-2 border-border-strong space-y-3 bg-surface-base">
          {/* Quantity picker */}
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-content-primary uppercase tracking-wider">
              Quantity
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() =>
                  setQty((q) =>
                    Math.max(
                      1,
                      (typeof q === 'number' ? q : parseFloat(q) || 1) - 1,
                    ),
                  )
                }
                className="h-11 w-11 border-2 border-border-subtle bg-surface-sunken flex items-center justify-center text-content-primary active:bg-slate-700 active:text-content-primary active:scale-[0.92] transition-all duration-75"
              >
                <Minus className="h-5 w-5" />
              </button>
              <input
                type="number"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                className="text-lg font-black text-content-primary w-16 text-center bg-transparent border-b-2 border-border-subtle outline-none focus:border-cyan-500 font-mono"
                style={{ fontVariantNumeric: 'tabular-nums' }}
              />
              <button
                onClick={() =>
                  setQty(
                    (q) => (typeof q === 'number' ? q : parseFloat(q) || 1) + 1,
                  )
                }
                className="h-11 w-11 border-2 border-cyan-500/40 bg-cyan-500/10 flex items-center justify-center text-cyan-400 active:bg-cyan-500/20 active:scale-[0.92] transition-all duration-75"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Add to cart CTA */}
          <button
            onClick={handleConfirm}
            disabled={!isFormValid()}
            className="w-full flex items-center justify-between px-5 py-3.5 border-2 border-cyan-400 bg-cyan-500 text-content-inverse font-black text-sm active:bg-cyan-400 active:scale-[0.98] transition-all duration-75 disabled:opacity-40 disabled:cursor-not-allowed uppercase tracking-widest"
          >
            <span>Add to Order</span>
            <div className="flex items-center gap-2">
              <span
                className="font-black font-mono tracking-tight"
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {fmt(lineTotal)}
              </span>
              <ChevronRight className="h-4 w-4" />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
