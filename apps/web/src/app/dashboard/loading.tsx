function SkeletonBox({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-slate-100 ${className ?? ''}`}
    />
  );
}

export default function DashboardHomeLoading() {
  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-border px-6 py-3.5 flex items-center gap-4">
        <div className="flex-1 space-y-1.5">
          <SkeletonBox className="h-5 w-48" />
          <SkeletonBox className="h-3 w-36" />
        </div>
        <div className="flex items-center gap-2">
          <SkeletonBox className="h-9 w-9 rounded-xl" />
          <SkeletonBox className="h-9 w-9 rounded-xl" />
          <SkeletonBox className="h-9 w-28 rounded-xl" />
        </div>
      </div>

      <div className="px-6 py-6 space-y-6 max-w-screen-xl">
        {/* Health + stats */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <SkeletonBox className="lg:col-span-1 h-40 rounded-2xl" />
          <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-border p-4 shadow-sm space-y-2"
              >
                <SkeletonBox className="h-3 w-24" />
                <SkeletonBox className="h-8 w-20" />
                <SkeletonBox className="h-3 w-16" />
              </div>
            ))}
          </div>
        </div>

        {/* Insights + right panel */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <SkeletonBox className="h-5 w-40" />
              <div className="flex gap-1">
                {[...Array(4)].map((_, i) => (
                  <SkeletonBox key={i} className="h-7 w-16 rounded-full" />
                ))}
              </div>
            </div>
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-border p-4 shadow-sm flex gap-3"
              >
                <SkeletonBox className="h-9 w-9 rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <SkeletonBox className="h-4 w-48" />
                  <SkeletonBox className="h-3 w-full" />
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-5">
            <div className="space-y-2">
              <SkeletonBox className="h-5 w-28" />
              <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0"
                  >
                    <SkeletonBox className="h-6 w-6 rounded-lg flex-shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <SkeletonBox className="h-3 w-32" />
                      <SkeletonBox className="h-2 w-full rounded-full" />
                    </div>
                    <SkeletonBox className="h-3 w-8" />
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <SkeletonBox className="h-5 w-28" />
              <div className="grid grid-cols-4 gap-2">
                {[...Array(12)].map((_, i) => (
                  <SkeletonBox key={i} className="h-16 rounded-xl" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
