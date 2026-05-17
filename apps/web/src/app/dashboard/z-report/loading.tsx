function SkeletonBox({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-slate-100 ${className ?? ''}`}
    />
  );
}

export default function ZReportLoading() {
  return (
    <div className="min-h-screen p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <SkeletonBox className="h-7 w-28" />
            <SkeletonBox className="h-3 w-40" />
          </div>
          <SkeletonBox className="h-9 w-9 rounded-xl" />
        </div>

        {/* Status banner */}
        <SkeletonBox className="h-16 w-full rounded-xl" />

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="rounded-xl p-4 bg-white border border-border shadow-sm space-y-2"
            >
              <SkeletonBox className="h-3 w-20" />
              <SkeletonBox className="h-8 w-24" />
            </div>
          ))}
        </div>

        {/* Payment breakdown */}
        <div className="rounded-xl p-4 bg-white border border-border shadow-sm space-y-4">
          <SkeletonBox className="h-3 w-36" />
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="flex justify-between">
                <SkeletonBox className="h-3 w-16" />
                <SkeletonBox className="h-3 w-20" />
              </div>
              <SkeletonBox className="h-2 w-full rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
