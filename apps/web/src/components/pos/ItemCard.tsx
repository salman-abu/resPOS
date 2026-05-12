'use client';

import { cn } from '@/lib/utils';
import type { MenuItem } from '@respos/types';
import { Plus } from 'lucide-react';

interface ItemCardProps {
  item: MenuItem;
  onAdd: (item: MenuItem) => void;
  inCartQty?: number;
}

const ITEM_TYPE_BADGE: Record<
  string,
  { label: string; color: string; dot: string }
> = {
  VEG: {
    label: 'V',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
  },
  NON_VEG: {
    label: 'NV',
    color: 'bg-red-50 text-red-700 border-red-200',
    dot: 'bg-red-500',
  },
  EGG: {
    label: 'E',
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-500',
  },
  VEGAN: {
    label: 'VG',
    color: 'bg-teal-50 text-teal-700 border-teal-200',
    dot: 'bg-teal-500',
  },
};

function formatPrice(paise: number): string {
  return `₹${(paise / 100).toFixed(0)}`;
}

export function ItemCard({ item, onAdd, inCartQty = 0 }: ItemCardProps) {
  const badge = ITEM_TYPE_BADGE[item.item_type] ?? ITEM_TYPE_BADGE.VEG;

  return (
    <div
      className={cn(
        'group relative flex flex-col bg-white border rounded-2xl overflow-hidden cursor-pointer',
        'transition-all duration-200 hover:-translate-y-0.5',
        inCartQty > 0
          ? 'border-brand-400 shadow-glow-blue'
          : 'border-border shadow-card hover:shadow-card-hover hover:border-border-strong',
      )}
      onClick={() => onAdd(item)}
    >
      {/* Image */}
      <div className="relative h-28 bg-surface-3 overflow-hidden">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">
            🍽️
          </div>
        )}

        {/* Cart qty badge */}
        {inCartQty > 0 && (
          <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-brand-600 text-white text-xs font-bold flex items-center justify-center shadow-md">
            {inCartQty}
          </div>
        )}

        {/* Veg/NonVeg indicator */}
        <span
          className={cn(
            'absolute top-2 left-2 text-[10px] font-bold px-1.5 py-0.5 rounded border',
            badge.color,
          )}
        >
          {badge.label}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 p-3 flex flex-col gap-1">
        <p className="text-content-primary text-sm font-semibold leading-tight line-clamp-2">
          {item.name}
        </p>
        {item.description && (
          <p className="text-content-muted text-xs line-clamp-1">
            {item.description}
          </p>
        )}
        <div className="mt-auto pt-2 flex items-center justify-between">
          <span className="text-brand-700 font-bold text-sm">
            {formatPrice(item.base_price)}
          </span>
          <button
            className={cn(
              'h-7 w-7 rounded-full flex items-center justify-center transition-all duration-150 press',
              inCartQty > 0
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-surface-3 text-content-secondary group-hover:bg-brand-600 group-hover:text-white group-hover:shadow-sm',
            )}
            onClick={(e) => {
              e.stopPropagation();
              onAdd(item);
            }}
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function ItemCardSkeleton() {
  return (
    <div className="flex flex-col bg-white border border-border rounded-2xl overflow-hidden shadow-card">
      <div className="h-28 skeleton rounded-none" />
      <div className="p-3 space-y-2">
        <div className="h-3.5 skeleton w-3/4" />
        <div className="h-3 skeleton w-1/2" />
        <div className="flex justify-between items-center pt-2">
          <div className="h-4 skeleton w-10" />
          <div className="h-7 w-7 skeleton rounded-full" />
        </div>
      </div>
    </div>
  );
}
