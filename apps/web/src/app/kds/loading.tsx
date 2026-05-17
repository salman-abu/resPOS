function SkeletonBox({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-slate-100 ${className ?? ''}`}
    />
  );
}

export default function KdsLoading() {
  return (
    <div className="min-h-screen p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <SkeletonBox className="h-8 w-8 rounded-xl" />
          <SkeletonBox className="h-5 w-32" />
        </div>
        <div className="flex gap-2">
          {[...Array(4)].map((_, i) => (
            <SkeletonBox key={i} className="h-9 w-24 rounded-xl" />
          ))}
        </div>
        <SkeletonBox className="h-6 w-24 rounded-full" />
      </div>

      {/* KDS ticket grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden"
          >
            <div className="p-3 bg-slate-50 border-b border-border flex justify-between items-center">
              <SkeletonBox className="h-4 w-16" />
              <SkeletonBox className="h-5 w-12 rounded-full" />
            </div>
            <div className="p-3 space-y-2">
              {[...Array(3 + (i % 2))].map((_, j) => (
                <div key={j} className="flex justify-between items-center">
                  <SkeletonBox className="h-3 w-28" />
                  <SkeletonBox className="h-5 w-5 rounded" />
                </div>
              ))}
            </div>
            <div className="p-3 border-t border-border">
              <SkeletonBox className="h-9 w-full rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
