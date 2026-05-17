// Shared skeleton primitives
function SkeletonBox({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-slate-100 ${className ?? ''}`}
    />
  );
}

// Generic dashboard page loading skeleton
export default function DashboardLoading() {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <SkeletonBox className="h-10 w-10 rounded-2xl" />
          <div className="space-y-2">
            <SkeletonBox className="h-5 w-40" />
            <SkeletonBox className="h-3 w-28" />
          </div>
        </div>
        <SkeletonBox className="h-9 w-28 rounded-xl" />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-border p-4 shadow-sm space-y-2"
          >
            <SkeletonBox className="h-7 w-12" />
            <SkeletonBox className="h-3 w-20" />
          </div>
        ))}
      </div>

      {/* Tab bar skeleton */}
      <div className="flex gap-2 border-b border-border pb-0">
        <SkeletonBox className="h-10 w-28 rounded-t-xl" />
        <SkeletonBox className="h-10 w-28 rounded-t-xl" />
      </div>

      {/* Table skeleton */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="px-5 py-3 bg-slate-50 border-b border-border flex gap-6">
          {[...Array(5)].map((_, i) => (
            <SkeletonBox key={i} className="h-3 w-16" />
          ))}
        </div>
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-6 px-5 py-4 border-b border-border last:border-0"
          >
            <SkeletonBox className="h-8 w-8 rounded-lg flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <SkeletonBox className="h-4 w-36" />
              <SkeletonBox className="h-3 w-52" />
            </div>
            <SkeletonBox className="h-5 w-20 rounded-lg" />
            <SkeletonBox className="h-5 w-14 rounded-lg" />
            <SkeletonBox className="h-5 w-16 rounded-full" />
            <div className="flex gap-2 ml-auto">
              <SkeletonBox className="h-8 w-8 rounded-lg" />
              <SkeletonBox className="h-8 w-8 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
