'use client';

import { useSync } from '@/hooks/useSync';
import { Wifi, WifiOff, RefreshCw, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OfflineIndicatorProps {
  tenantId?: string;
}

function formatTimeAgo(timestamp: number): string {
  if (!timestamp) return 'Never';
  const diff = Date.now() - timestamp;
  if (diff < 60_000) return 'Just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

export function OfflineIndicator({ tenantId }: OfflineIndicatorProps) {
  const { isOnline, isSyncing, unsyncedCount, lastSyncAt, syncNow } =
    useSync(tenantId);

  // Don't show if online and fully synced
  if (isOnline && unsyncedCount === 0 && !isSyncing) return null;

  return (
    <div
      className={cn(
        'fixed top-0 left-0 right-0 z-[90] px-4 py-2 text-xs font-black uppercase tracking-wider flex items-center justify-between transition-colors border-b-2',
        isOnline
          ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
          : 'bg-rose-500/10 border-rose-500/20 text-rose-400',
      )}
    >
      <div className="flex items-center gap-2">
        {isOnline ? (
          <Wifi className="h-4 w-4" />
        ) : (
          <WifiOff className="h-4 w-4" />
        )}
        <span>
          {!isOnline
            ? 'Offline — changes will sync when connection is restored'
            : unsyncedCount > 0
              ? `${unsyncedCount} unsynced ${unsyncedCount === 1 ? 'change' : 'changes'} queued`
              : 'Syncing...'}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 text-[10px] opacity-80 font-mono tracking-tight">
          <Clock className="h-3 w-3" />
          Last sync: {formatTimeAgo(lastSyncAt)}
        </div>

        {isOnline && (
          <button
            onClick={syncNow}
            disabled={isSyncing || unsyncedCount === 0}
            className={cn(
              'flex items-center gap-1 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider border-2 active:scale-[0.92] transition-all duration-75',
              isSyncing || unsyncedCount === 0
                ? 'opacity-40 cursor-not-allowed border-slate-700 text-slate-500'
                : 'bg-slate-800 active:bg-slate-700 border-slate-700 text-amber-400',
            )}
          >
            <RefreshCw className={cn('h-3 w-3', isSyncing && 'animate-spin')} />
            {isSyncing ? 'Syncing' : 'Sync Now'}
          </button>
        )}
      </div>
    </div>
  );
}
