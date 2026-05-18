'use client';

import { cn } from '@/lib/utils';
import type { Category } from '@respos/types';
import { UtensilsCrossed } from 'lucide-react';

interface CategoryTabsProps {
  categories: Category[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  loading?: boolean;
}

const NEON_PALETTE: string[] = [
  'bg-cyan-500 text-slate-900 border-cyan-500',
  'bg-fuchsia-500 text-slate-900 border-fuchsia-500',
  'bg-lime-500 text-slate-900 border-lime-500',
  'bg-amber-500 text-slate-900 border-amber-500',
  'bg-rose-500 text-slate-900 border-rose-500',
  'bg-violet-500 text-slate-900 border-violet-500',
  'bg-orange-500 text-slate-900 border-orange-500',
];

export function CategoryTabs({
  categories,
  selectedId,
  onSelect,
  loading,
}: CategoryTabsProps) {
  if (loading) {
    return (
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="h-9 w-24 flex-shrink-0 rounded-sm bg-surface-sunken animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
      {/* All tab */}
      <button
        onClick={() => onSelect(null)}
        className={cn(
          'flex-shrink-0 px-4 py-2 rounded-sm text-sm font-black border-2 uppercase tracking-widest whitespace-nowrap active:scale-[0.97] transition-transform duration-75',
          selectedId === null
            ? 'bg-brand-default text-content-inverse border-brand-default'
            : 'bg-surface-sunken text-content-secondary border-border-subtle active:bg-surface-base active:text-content-primary',
        )}
      >
        <UtensilsCrossed className="inline-block h-3.5 w-3.5 mr-1.5 -mt-0.5" />
        All
      </button>

      {categories.map((cat, idx) => {
        const activeClass = NEON_PALETTE[idx % NEON_PALETTE.length];
        const isActive = selectedId === cat.id;
        return (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            className={cn(
              'flex-shrink-0 px-4 py-2 rounded-sm text-sm font-black border-2 uppercase tracking-widest whitespace-nowrap active:scale-[0.97] transition-transform duration-75',
              isActive
                ? activeClass
                : 'bg-surface-sunken text-content-secondary border-border-subtle active:bg-surface-base active:text-content-primary',
            )}
          >
            {cat.name}
          </button>
        );
      })}
    </div>
  );
}
