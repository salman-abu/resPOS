function SkeletonBox({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-slate-100 ${className ?? ''}`}
    />
  );
}

export default function InsightsLoading() {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3">
        <SkeletonBox className="h-10 w-10 rounded-2xl" />
        <div className="space-y-2">
          <SkeletonBox className="h-5 w-36" />
          <SkeletonBox className="h-3 w-56" />
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2">
        {[...Array(5)].map((_, i) => (
          <SkeletonBox key={i} className="h-8 w-20 rounded-full" />
        ))}
      </div>

      {/* Insight cards */}
      <div className="space-y-3">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-border p-4 shadow-sm flex items-start gap-3"
          >
            <SkeletonBox className="h-9 w-9 rounded-xl flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <SkeletonBox className="h-4 w-56" />
              <SkeletonBox className="h-3 w-full" />
              <SkeletonBox className="h-3 w-3/4" />
            </div>
            <SkeletonBox className="h-8 w-24 rounded-xl flex-shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
