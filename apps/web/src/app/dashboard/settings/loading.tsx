function SkeletonBox({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-slate-100 ${className ?? ''}`}
    />
  );
}

export default function SettingsLoading() {
  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <SkeletonBox className="h-10 w-10 rounded-2xl" />
          <div className="space-y-2">
            <SkeletonBox className="h-5 w-24" />
            <SkeletonBox className="h-3 w-40" />
          </div>
        </div>
        <SkeletonBox className="h-9 w-32 rounded-xl" />
      </div>

      <div className="flex gap-6">
        {/* Sidebar tabs skeleton */}
        <div className="w-48 flex-shrink-0 space-y-1">
          {[...Array(5)].map((_, i) => (
            <SkeletonBox key={i} className="h-10 w-full rounded-xl" />
          ))}
        </div>

        {/* Content skeleton */}
        <div className="flex-1 bg-white rounded-2xl border border-border shadow-sm p-6 space-y-6">
          <SkeletonBox className="h-4 w-40 mb-4" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="space-y-1.5">
              <SkeletonBox className="h-3 w-24" />
              <SkeletonBox className="h-9 w-full rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
