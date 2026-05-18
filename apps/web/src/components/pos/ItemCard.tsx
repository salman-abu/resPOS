'use client';

import { cn } from '@/lib/utils';
import type { MenuItem } from '@respos/types';
import { Plus } from 'lucide-react';

interface ItemCardProps {
  item: MenuItem;
  onAdd: (item: MenuItem) => void;
  inCartQty?: number;
  managerMode?: boolean;
}

const ITEM_TYPE_ACCENT: Record<
  string,
  { label: string; bg: string; border: string; text: string; dot: string }
> = {
  VEG: {
    label: 'V',
    bg: 'bg-success-light/50',
    border: 'border-success-default/40',
    text: 'text-success-default',
    dot: 'bg-success-default',
  },
  NON_VEG: {
    label: 'NV',
    bg: 'bg-danger-light/50',
    border: 'border-danger-default/40',
    text: 'text-danger-default',
    dot: 'bg-danger-default',
  },
  EGG: {
    label: 'E',
    bg: 'bg-warning-light/50',
    border: 'border-warning-default/40',
    text: 'text-warning-default',
    dot: 'bg-warning-default',
  },
  VEGAN: {
    label: 'VG',
    bg: 'bg-info-light/50',
    border: 'border-info-default/40',
    text: 'text-info-default',
    dot: 'bg-info-default',
  },
};

function formatPrice(paise: number): string {
  return `₹${(paise / 100).toFixed(0)}`;
}

export function ItemCard({
  item,
  onAdd,
  inCartQty = 0,
  managerMode = false,
}: ItemCardProps) {
  const accent = ITEM_TYPE_ACCENT[item.item_type] ?? ITEM_TYPE_ACCENT.VEG;
  const isAvailable = item.is_available ?? true;

  const handleClick = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (managerMode) {
      onAdd(item);
    } else {
      if (isAvailable) onAdd(item);
    }
  };

  return (
    <div
      className={cn(
        'group relative flex flex-col bg-surface-card border rounded-sm overflow-hidden h-28',
        managerMode
          ? 'cursor-pointer border-border-subtle active:border-warning-default'
          : isAvailable
            ? 'cursor-pointer border-border-subtle active:border-border-strong'
            : 'cursor-not-allowed opacity-60 border-border-subtle',
        'active:scale-[0.97] transition-transform duration-75',
        accent.bg,
        inCartQty > 0 && !managerMode && 'border-success-default',
      )}
      onClick={handleClick}
    >
      {/* Top bar: badge + qty block */}
      <div className="flex items-center justify-between px-2 pt-2">
        <span
          className={cn(
            'text-[10px] font-black px-1.5 py-0.5 border rounded-none uppercase tracking-wider',
            'bg-surface-sunken text-content-primary border-border-subtle',
          )}
        >
          {accent.label}
        </span>

        {/* Cart qty badge — solid geometric block */}
        {inCartQty > 0 && !managerMode && isAvailable && (
          <span
            className="h-5 px-1.5 bg-success-default text-content-inverse text-xs font-black font-mono flex items-center justify-center border border-success-default"
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {inCartQty}
          </span>
        )}
      </div>

      {/* SOLD OUT Overlay */}
      {!isAvailable && (
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
          <span className="bg-danger-default text-content-inverse text-[10px] font-black px-2 py-1 border border-danger-light tracking-[0.2em] uppercase rotate-[-12deg]">
            SOLD OUT
          </span>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 p-2 flex flex-col gap-0.5">
        <p className="text-content-primary text-sm font-bold leading-tight line-clamp-2 tracking-tight">
          {item.name}
        </p>
        {item.description && (
          <p className="text-content-secondary text-[10px] line-clamp-1 font-medium uppercase tracking-wide">
            {item.description}
          </p>
        )}
        <div className="mt-auto flex items-center justify-between">
          <span
            className="font-mono text-sm font-black text-content-primary tracking-tight"
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {formatPrice(item.base_price)}
          </span>
          {((item.variants && item.variants.length > 0) ||
            (item.addons && item.addons.some((a) => a.is_available))) && (
            <span className="text-[9px] font-black text-content-muted bg-surface-sunken px-1.5 py-0.5 border border-border-subtle uppercase tracking-wider">
              OPTS
            </span>
          )}
          {!managerMode && isAvailable && (
            <button
              className={cn(
                'h-11 w-11 flex items-center justify-center border active:scale-[0.85] transition-transform duration-75',
                inCartQty > 0
                  ? 'bg-success-default text-content-inverse border-success-default'
                  : 'bg-surface-sunken text-content-secondary border-border-strong active:bg-border-strong active:text-content-inverse',
              )}
              onClick={handleClick}
            >
              <Plus className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function ItemCardSkeleton() {
  return (
    <div className="flex flex-col bg-surface-card border border-border-subtle rounded-sm overflow-hidden h-28">
      <div className="h-8 bg-surface-sunken animate-pulse rounded-none" />
      <div className="p-2 space-y-1.5 flex-1">
        <div className="h-3.5 bg-surface-sunken animate-pulse w-3/4 rounded-none" />
        <div className="h-3 bg-surface-sunken animate-pulse w-1/2 rounded-none" />
        <div className="flex justify-between items-center mt-auto pt-1">
          <div className="h-4 bg-surface-sunken animate-pulse w-10 rounded-none" />
          <div className="h-6 w-6 bg-surface-sunken animate-pulse rounded-none" />
        </div>
      </div>
    </div>
  );
}
