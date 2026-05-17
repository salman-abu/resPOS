function SkeletonBox({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-slate-100 ${className ?? ''}`}
    />
  );
}

export default function TablesLoading() {
  return (
    <div className="min-h-screen">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 px-6 py-4 bg-white border-b border-border">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="space-y-2">
              <SkeletonBox className="h-5 w-28" />
              <SkeletonBox className="h-3 w-40" />
            </div>
            <SkeletonBox className="h-9 w-9 rounded-xl" />
          </div>
          {/* Filter pills */}
          <div className="flex gap-2">
            {[...Array(6)].map((_, i) => (
              <SkeletonBox key={i} className="h-8 w-20 rounded-lg" />
            ))}
          </div>
        </div>
      </div>

      {/* Floor grid */}
      <div className="max-w-6xl mx-auto px-6 py-6 space-y-8">
        {[...Array(2)].map((_, z) => (
          <div key={z}>
            <div className="flex items-center gap-2 mb-3">
              <SkeletonBox className="h-3 w-3 rounded-full" />
              <SkeletonBox className="h-3 w-24" />
              <SkeletonBox className="h-5 w-14 rounded-full" />
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
              {[...Array(12)].map((_, i) => (
                <SkeletonBox key={i} className="h-20 rounded-xl" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
