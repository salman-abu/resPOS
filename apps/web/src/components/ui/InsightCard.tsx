import { cn } from '@/lib/utils';

export type InsightType =
  | 'hot'
  | 'cold'
  | 'revenue'
  | 'warning'
  | 'time'
  | 'staff'
  | 'win'
  | 'tip';

interface InsightCardProps {
  type: InsightType;
  headline: string;
  detail?: string;
  action?: string;
  onAction?: () => void;
  className?: string;
}

const INSIGHT_META: Record<
  InsightType,
  {
    emoji: string;
    label: string;
    border: string;
    bg: string;
    badge: string;
  }
> = {
  hot: {
    emoji: '🔥',
    label: 'Trending',
    border: 'before:bg-warning-default',
    bg: 'bg-warning-light border-warning-light',
    badge: 'bg-warning-light text-warning-default',
  },
  cold: {
    emoji: '📉',
    label: 'Slow Item',
    border: 'before:bg-content-muted',
    bg: 'bg-surface-sunken border-border-subtle',
    badge: 'bg-surface-sunken text-content-muted',
  },
  revenue: {
    emoji: '💰',
    label: 'Opportunity',
    border: 'before:bg-success-default',
    bg: 'bg-success-light border-success-light',
    badge: 'bg-success-light text-success-default',
  },
  warning: {
    emoji: '⚠️',
    label: 'Alert',
    border: 'before:bg-warning-default',
    bg: 'bg-warning-light border-warning-light',
    badge: 'bg-warning-light text-warning-default',
  },
  time: {
    emoji: '⏰',
    label: 'Time Insight',
    border: 'before:bg-brand-default',
    bg: 'bg-brand-light border-brand-light',
    badge: 'bg-brand-light text-brand-default',
  },
  staff: {
    emoji: '👥',
    label: 'Staff',
    border: 'before:bg-info-default',
    bg: 'bg-info-light border-info-light',
    badge: 'bg-info-light text-info-default',
  },
  win: {
    emoji: '🌟',
    label: 'Win!',
    border: 'before:bg-warning-default',
    bg: 'bg-warning-light border-warning-light',
    badge: 'bg-warning-light text-warning-default',
  },
  tip: {
    emoji: '💡',
    label: 'Growth Tip',
    border: 'before:bg-brand-default',
    bg: 'bg-brand-light border-brand-light',
    badge: 'bg-brand-light text-brand-default',
  },
};

export function InsightCard({
  type,
  headline,
  detail,
  action,
  onAction,
  className,
}: InsightCardProps) {
  const m = INSIGHT_META[type];
  return (
    <div
      className={cn(
        'relative pl-4 rounded-xl border py-3.5 pr-4 overflow-hidden',
        'before:absolute before:left-0 before:top-3 before:bottom-3 before:w-1 before:rounded-r-full',
        m.border,
        m.bg,
        'transition-all duration-150 hover:shadow-card',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <span className="text-xl flex-shrink-0 mt-0.5">{m.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={cn(
                'text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide',
                m.badge,
              )}
            >
              {m.label}
            </span>
          </div>
          <p className="text-content-primary text-sm font-semibold leading-snug">
            {headline}
          </p>
          {detail && (
            <p className="text-content-secondary text-xs mt-1 leading-relaxed">
              {detail}
            </p>
          )}
          {action && onAction && (
            <button
              onClick={onAction}
              className="mt-2 text-xs font-semibold text-brand-600 hover:text-brand-700 underline underline-offset-2 transition-colors"
            >
              {action} →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function InsightCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-surface-card py-4 px-4 space-y-2 animate-pulse">
      <div className="flex gap-3">
        <div className="h-6 w-6 skeleton rounded-lg" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-16 skeleton rounded-full" />
          <div className="h-4 w-full skeleton" />
          <div className="h-3 w-3/4 skeleton" />
        </div>
      </div>
    </div>
  );
}
