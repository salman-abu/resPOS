function SkeletonBox({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-slate-100 ${className ?? ''}`}
    />
  );
}

export default function InventoryLoading() {
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

      <div className="grid grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-border p-4 shadow-sm space-y-2"
          >
            <SkeletonBox className="h-7 w-12" />
            <SkeletonBox className="h-3 w-24" />
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="px-5 py-3 bg-slate-50 border-b border-border flex gap-6">
          {[...Array(5)].map((_, i) => (
            <SkeletonBox key={i} className="h-3 w-20" />
          ))}
        </div>
        {[...Array(7)].map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-6 px-5 py-3.5 border-b border-border last:border-0"
          >
            <SkeletonBox className="h-4 w-32 flex-1" />
            <SkeletonBox className="h-4 w-20" />
            <SkeletonBox className="h-4 w-16" />
            <SkeletonBox className="h-6 w-20 rounded-full" />
            <SkeletonBox className="h-8 w-8 rounded-lg ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}
