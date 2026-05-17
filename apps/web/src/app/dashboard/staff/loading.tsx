function SkeletonBox({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-slate-100 ${className ?? ''}`}
    />
  );
}

export default function StaffLoading() {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <SkeletonBox className="h-10 w-10 rounded-2xl" />
          <div className="space-y-2">
            <SkeletonBox className="h-5 w-32" />
            <SkeletonBox className="h-3 w-48" />
          </div>
        </div>
        <SkeletonBox className="h-9 w-28 rounded-xl" />
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-border p-4 shadow-sm space-y-2"
          >
            <SkeletonBox className="h-7 w-10" />
            <SkeletonBox className="h-3 w-20" />
          </div>
        ))}
      </div>

      <div className="grid gap-4">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-border p-4 shadow-sm flex items-center gap-4"
          >
            <SkeletonBox className="h-10 w-10 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <SkeletonBox className="h-4 w-36" />
              <SkeletonBox className="h-3 w-24" />
            </div>
            <SkeletonBox className="h-6 w-16 rounded-full" />
            <SkeletonBox className="h-8 w-8 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
