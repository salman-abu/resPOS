function SkeletonBox({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-slate-100 ${className ?? ''}`}
    />
  );
}

export default function AnalyticsLoading() {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <SkeletonBox className="h-6 w-36" />
          <SkeletonBox className="h-3 w-52" />
        </div>
        <SkeletonBox className="h-9 w-36 rounded-xl" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-border p-4 shadow-sm space-y-3"
          >
            <div className="flex items-center justify-between">
              <SkeletonBox className="h-3 w-20" />
              <SkeletonBox className="h-7 w-7 rounded-lg" />
            </div>
            <SkeletonBox className="h-8 w-24" />
            <SkeletonBox className="h-3 w-16" />
          </div>
        ))}
      </div>

      {/* Chart area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-border shadow-sm p-5 space-y-4">
          <SkeletonBox className="h-4 w-32" />
          <SkeletonBox className="h-56 w-full rounded-xl" />
        </div>
        <div className="bg-white rounded-2xl border border-border shadow-sm p-5 space-y-4">
          <SkeletonBox className="h-4 w-28" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <SkeletonBox className="h-6 w-6 rounded-md flex-shrink-0" />
              <div className="flex-1 space-y-1">
                <SkeletonBox className="h-3 w-28" />
                <SkeletonBox className="h-2 w-full rounded-full" />
              </div>
              <SkeletonBox className="h-3 w-10" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
