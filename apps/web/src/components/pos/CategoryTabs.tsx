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

const CATEGORY_ACTIVE: string[] = [
  'bg-violet-600 text-white border-violet-600',
  'bg-blue-600 text-white border-blue-600',
  'bg-emerald-600 text-white border-emerald-600',
  'bg-orange-500 text-white border-orange-500',
  'bg-rose-600 text-white border-rose-600',
  'bg-indigo-600 text-white border-indigo-600',
  'bg-fuchsia-600 text-white border-fuchsia-600',
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
          <div key={i} className="h-9 w-24 flex-shrink-0 rounded-xl skeleton" />
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
          'flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 border whitespace-nowrap',
          selectedId === null
            ? 'bg-slate-700 text-white border-slate-700 shadow-sm'
            : 'bg-white text-content-secondary border-border hover:bg-surface-3 hover:text-content-primary hover:border-border-strong',
        )}
      >
        <UtensilsCrossed className="inline-block h-3.5 w-3.5 mr-1.5 -mt-0.5" />
        All
      </button>

      {categories.map((cat, idx) => {
        const activeClass = CATEGORY_ACTIVE[idx % CATEGORY_ACTIVE.length];
        const isActive = selectedId === cat.id;
        return (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            className={cn(
              'flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 border whitespace-nowrap shadow-sm',
              isActive
                ? activeClass
                : 'bg-white text-content-secondary border-border hover:bg-surface-3 hover:text-content-primary hover:border-border-strong',
            )}
          >
            {cat.name}
          </button>
        );
      })}
    </div>
  );
}
