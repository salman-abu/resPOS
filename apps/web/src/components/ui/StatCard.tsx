import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  trend?: number;
  trendLabel?: string;
  icon?: ReactNode;
  accentColor?: 'blue' | 'green' | 'amber' | 'violet' | 'rose';
  prefix?: string;
  suffix?: string;
  loading?: boolean;
  className?: string;
}

const ACCENT: Record<string, string> = {
  blue: 'border-blue-200   bg-gradient-to-br from-blue-50   to-white',
  green: 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-white',
  amber: 'border-amber-200  bg-gradient-to-br from-amber-50  to-white',
  violet: 'border-violet-200 bg-gradient-to-br from-violet-50 to-white',
  rose: 'border-rose-200   bg-gradient-to-br from-rose-50   to-white',
};

const ICON_BG: Record<string, string> = {
  blue: 'bg-blue-100   text-blue-600',
  green: 'bg-emerald-100 text-emerald-600',
  amber: 'bg-amber-100  text-amber-600',
  violet: 'bg-violet-100 text-violet-600',
  rose: 'bg-rose-100   text-rose-600',
};

export function StatCard({
  label,
  value,
  subValue,
  trend,
  trendLabel,
  icon,
  accentColor = 'blue',
  prefix,
  suffix,
  loading = false,
  className,
}: StatCardProps) {
  if (loading) {
    return (
      <div
        className={cn(
          'rounded-2xl border bg-white p-5 space-y-3 shadow-card',
          className,
        )}
      >
        <div className="h-4 w-24 skeleton" />
        <div className="h-8 w-32 skeleton" />
        <div className="h-3 w-20 skeleton" />
      </div>
    );
  }

  const trendColor =
    trend === undefined
      ? ''
      : trend > 0
        ? 'text-emerald-600'
        : trend < 0
          ? 'text-red-600'
          : 'text-content-muted';
  const TrendIcon =
    trend === undefined
      ? null
      : trend > 0
        ? TrendingUp
        : trend < 0
          ? TrendingDown
          : Minus;

  return (
    <div
      className={cn(
        'relative rounded-2xl border p-5 overflow-hidden shadow-card',
        'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover',
        ACCENT[accentColor],
        className,
      )}
    >
      {/* Top shine */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent" />

      <div className="flex items-start justify-between mb-3">
        <p className="text-content-secondary text-sm font-medium">{label}</p>
        {icon && (
          <div
            className={cn(
              'h-9 w-9 rounded-xl flex items-center justify-center',
              ICON_BG[accentColor],
            )}
          >
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-end gap-1 mb-1">
        {prefix && (
          <span className="text-content-secondary text-lg mb-0.5">
            {prefix}
          </span>
        )}
        <span className="text-3xl font-black text-content-primary tabular-nums animate-count-up">
          {typeof value === 'number' ? value.toLocaleString('en-IN') : value}
        </span>
        {suffix && (
          <span className="text-content-secondary text-lg mb-0.5">
            {suffix}
          </span>
        )}
      </div>

      {subValue && <p className="text-content-muted text-xs">{subValue}</p>}

      {trend !== undefined && TrendIcon && (
        <div
          className={cn(
            'flex items-center gap-1 mt-3 text-xs font-semibold',
            trendColor,
          )}
        >
          <TrendIcon className="h-3.5 w-3.5" />
          <span>{Math.abs(trend)}%</span>
          {trendLabel && (
            <span className="text-content-muted font-normal">{trendLabel}</span>
          )}
        </div>
      )}
    </div>
  );
}
