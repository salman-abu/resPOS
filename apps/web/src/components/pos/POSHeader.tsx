'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useCartStore } from '@/store/cart';
import {
  Search,
  RefreshCw,
  LayoutGrid,
  TableProperties,
  ChevronDown,
  Zap,
  BarChart3,
  X,
  Wine,
} from 'lucide-react';

interface POSHeaderProps {
  search: string;
  setSearch: (val: string) => void;
  isOnline: boolean;
  refreshing: boolean;
  onRefresh: () => void;
}

export function POSHeader({
  search,
  setSearch,
  isOnline,
  refreshing,
  onRefresh,
  managerMode,
  setManagerMode,
}: POSHeaderProps & {
  managerMode: boolean;
  setManagerMode: (v: boolean) => void;
}) {
  const router = useRouter();
  const [showOrderTypeMenu, setShowOrderTypeMenu] = useState(false);

  const { order_type, setOrderType, table_number, pax_count } = useCartStore();

  return (
    <header className="flex-shrink-0 flex items-center gap-3 px-4 py-3 bg-surface-base border-b border-border-subtle">
      {/* Brand */}
      <div className="flex items-center gap-2.5 mr-1">
        <div className="h-8 w-8 bg-brand-default flex items-center justify-center border border-brand-strong">
          <Zap className="h-4 w-4 text-content-inverse" />
        </div>
        <span className="text-content-primary font-black text-sm hidden md:block tracking-tight uppercase">
          resPOS
        </span>
      </div>

      {/* Order type */}
      <div className="relative">
        <button
          onClick={() => setShowOrderTypeMenu((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-sunken border border-border-subtle text-content-secondary text-sm font-bold active:bg-surface-base active:text-content-primary active:border-border-strong transition-all uppercase tracking-wider"
        >
          <LayoutGrid className="h-3.5 w-3.5" />
          {order_type.replace('_', ' ')}
          <ChevronDown
            className={cn(
              'h-3 w-3 transition-transform',
              showOrderTypeMenu && 'rotate-180',
            )}
          />
        </button>
        {showOrderTypeMenu && (
            <div className="absolute top-full left-0 mt-1 w-36 bg-surface-card border border-border-subtle shadow-2xl z-20 overflow-hidden animate-scale-in">
            {(['DINE_IN', 'TAKEAWAY', 'DELIVERY'] as const).map((ot) => (
              <button
                key={ot}
                onClick={() => {
                  setOrderType(ot);
                  setShowOrderTypeMenu(false);
                }}
                className={cn(
                  'w-full text-left px-3 py-2.5 text-sm font-bold uppercase tracking-wider active:scale-[0.98] transition-transform duration-75',
                  order_type === ot
                    ? 'bg-brand-light text-brand-default'
                    : 'text-content-muted active:bg-surface-sunken active:text-content-primary',
                )}
              >
                {ot.replace('_', ' ')}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Table info */}
      {order_type === 'DINE_IN' && (
        <button
          onClick={() => router.push('/pos/tables')}
          className="flex items-center gap-2 px-3 py-1.5 bg-surface-sunken border border-border-subtle active:bg-surface-base active:border-border-strong transition-all cursor-pointer"
        >
          <TableProperties className="h-3.5 w-3.5 text-brand-default" />
          <span className="text-content-secondary text-sm font-bold">
            {table_number ? (
              <span className="text-content-primary font-black">
                TBL {table_number}
              </span>
            ) : (
              <span className="text-warning-default font-black">SELECT TBL</span>
            )}
          </span>
          {pax_count > 0 && (
            <span className="text-content-muted text-xs font-mono tracking-tight">
              · {pax_count} PAX
            </span>
          )}
        </button>
      )}

      {/* Tabs link */}
      <button
        onClick={() => router.push('/pos/tabs')}
        className="flex items-center gap-2 px-3 py-1.5 bg-surface-sunken border border-border-subtle active:bg-surface-base active:border-border-strong transition-all cursor-pointer"
      >
        <Wine className="h-3.5 w-3.5 text-info-default" />
        <span className="text-content-secondary text-sm font-bold uppercase tracking-wider">
          Tabs
        </span>
      </button>

      {/* Search */}
      <div className="flex-1 max-w-md relative ml-auto">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-content-muted pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="SEARCH MENU ITEMS…"
          className="w-full bg-surface-card border border-border-subtle pl-9 pr-8 py-2 text-sm text-content-primary placeholder:text-content-muted outline-none focus:border-brand-default focus:bg-surface-base transition-all font-mono uppercase tracking-wider"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-content-muted active:text-content-secondary"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Status + actions */}
      <div className="flex items-center gap-2">
        {/* Socket status dot — never blocks POS UI */}
        <div
          className={cn(
            'flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 border uppercase tracking-wider',
            isOnline
              ? 'text-success-default bg-success-light border-success-default/30'
              : 'text-warning-default bg-warning-light border-warning-default/30',
          )}
        >
          <span
            className={cn(
              'w-2 h-2 rounded-none flex-shrink-0',
              isOnline ? 'bg-success-default' : 'bg-warning-default animate-pulse',
            )}
          />
          <span className="hidden sm:block">
            {isOnline ? 'LIVE' : 'OFFLINE — QUEUED'}
          </span>
        </div>
        <button
          onClick={onRefresh}
          disabled={refreshing || !isOnline}
          className="h-8 w-8 bg-surface-sunken border border-border-subtle flex items-center justify-center text-content-muted active:text-content-primary active:bg-surface-base disabled:opacity-40 active:scale-[0.92] transition-all duration-75"
        >
          <RefreshCw
            className={cn('h-3.5 w-3.5', refreshing && 'animate-spin')}
          />
        </button>
        <a
          href="/dashboard"
          className="h-8 w-8 bg-surface-sunken border border-border-subtle flex items-center justify-center text-content-muted active:text-content-primary active:bg-surface-base active:scale-[0.92] transition-all duration-75"
          title="Dashboard"
        >
          <BarChart3 className="h-3.5 w-3.5" />
        </a>
        <button
          onClick={() => setManagerMode(!managerMode)}
          className={cn(
            'h-8 px-2.5 border flex items-center justify-center text-xs font-black uppercase tracking-wider active:scale-[0.92] transition-all duration-75',
            managerMode
              ? 'bg-warning-light border-warning-default text-warning-default'
              : 'bg-surface-sunken border-border-subtle text-content-muted active:text-content-primary',
          )}
          title="Manager Mode (Quick 86)"
        >
          {managerMode ? 'MGR ON' : 'MGR MODE'}
        </button>
      </div>
    </header>
  );
}
