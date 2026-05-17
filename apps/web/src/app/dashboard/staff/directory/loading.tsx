function SkeletonBox({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-slate-100 ${className ?? ''}`}
    />
  );
}

export default function StaffDirectoryLoading() {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <SkeletonBox className="h-10 w-10 rounded-2xl" />
          <div className="space-y-2">
            <SkeletonBox className="h-5 w-36" />
            <SkeletonBox className="h-3 w-52" />
          </div>
        </div>
        <SkeletonBox className="h-9 w-32 rounded-xl" />
      </div>

      {/* Search bar */}
      <SkeletonBox className="h-10 w-full rounded-xl" />

      {/* Staff cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-border p-5 shadow-sm space-y-4"
          >
            <div className="flex items-center gap-3">
              <SkeletonBox className="h-12 w-12 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <SkeletonBox className="h-4 w-32" />
                <SkeletonBox className="h-3 w-20" />
              </div>
              <SkeletonBox className="h-6 w-16 rounded-full" />
            </div>
            <div className="flex gap-2">
              <SkeletonBox className="h-8 flex-1 rounded-xl" />
              <SkeletonBox className="h-8 w-8 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
