import { cn } from "@/lib/utils";

export type InsightType = "hot" | "cold" | "revenue" | "warning" | "time" | "staff" | "win" | "tip";

interface InsightCardProps {
  type: InsightType;
  headline: string;
  detail?: string;
  action?: string;
  onAction?: () => void;
  className?: string;
}

const INSIGHT_META: Record<InsightType, {
  emoji: string; label: string;
  border: string; bg: string; badge: string;
}> = {
  hot:     { emoji: "🔥", label: "Trending",    border: "before:bg-orange-500", bg: "bg-orange-50  border-orange-100", badge: "bg-orange-100 text-orange-700" },
  cold:    { emoji: "📉", label: "Slow Item",   border: "before:bg-slate-400",  bg: "bg-slate-50   border-slate-100",  badge: "bg-slate-100  text-slate-600"  },
  revenue: { emoji: "💰", label: "Opportunity", border: "before:bg-emerald-500",bg: "bg-emerald-50 border-emerald-100",badge: "bg-emerald-100 text-emerald-700"},
  warning: { emoji: "⚠️", label: "Alert",       border: "before:bg-amber-500",  bg: "bg-amber-50   border-amber-100",  badge: "bg-amber-100  text-amber-700"  },
  time:    { emoji: "⏰", label: "Time Insight", border: "before:bg-blue-500",   bg: "bg-blue-50    border-blue-100",   badge: "bg-blue-100   text-blue-700"   },
  staff:   { emoji: "👥", label: "Staff",        border: "before:bg-violet-500", bg: "bg-violet-50  border-violet-100", badge: "bg-violet-100 text-violet-700" },
  win:     { emoji: "🌟", label: "Win!",         border: "before:bg-yellow-500", bg: "bg-yellow-50  border-yellow-100", badge: "bg-yellow-100 text-yellow-700" },
  tip:     { emoji: "💡", label: "Growth Tip",  border: "before:bg-cyan-500",   bg: "bg-cyan-50    border-cyan-100",   badge: "bg-cyan-100   text-cyan-700"   },
};

export function InsightCard({ type, headline, detail, action, onAction, className }: InsightCardProps) {
  const m = INSIGHT_META[type];
  return (
    <div className={cn(
      "relative pl-4 rounded-xl border py-3.5 pr-4 overflow-hidden",
      "before:absolute before:left-0 before:top-3 before:bottom-3 before:w-1 before:rounded-r-full",
      m.border, m.bg,
      "transition-all duration-150 hover:shadow-card",
      className
    )}>
      <div className="flex items-start gap-3">
        <span className="text-xl flex-shrink-0 mt-0.5">{m.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide", m.badge)}>
              {m.label}
            </span>
          </div>
          <p className="text-content-primary text-sm font-semibold leading-snug">{headline}</p>
          {detail && <p className="text-content-secondary text-xs mt-1 leading-relaxed">{detail}</p>}
          {action && onAction && (
            <button onClick={onAction} className="mt-2 text-xs font-semibold text-brand-600 hover:text-brand-700 underline underline-offset-2 transition-colors">
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
    <div className="rounded-xl border border-border bg-white py-4 px-4 space-y-2 animate-pulse">
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
