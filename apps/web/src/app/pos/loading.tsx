function SkeletonBox({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-slate-100 ${className ?? ''}`}
    />
  );
}

export default function PosLoading() {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left — order panel */}
      <div className="w-80 flex-shrink-0 border-r border-border flex flex-col bg-white">
        <div className="p-4 border-b border-border space-y-2">
          <SkeletonBox className="h-5 w-28" />
          <SkeletonBox className="h-3 w-20" />
        </div>
        <div className="flex-1 p-4 space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="flex-1 space-y-1.5">
                <SkeletonBox className="h-4 w-32" />
                <SkeletonBox className="h-3 w-20" />
              </div>
              <SkeletonBox className="h-7 w-20 rounded-lg" />
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-border space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex justify-between">
              <SkeletonBox className="h-3 w-20" />
              <SkeletonBox className="h-3 w-16" />
            </div>
          ))}
          <SkeletonBox className="h-12 w-full rounded-2xl" />
        </div>
      </div>

      {/* Right — menu panel */}
      <div className="flex-1 flex flex-col">
        {/* Category bar */}
        <div className="px-4 py-3 border-b border-border flex gap-2 overflow-hidden">
          {[...Array(7)].map((_, i) => (
            <SkeletonBox
              key={i}
              className="h-9 w-24 rounded-xl flex-shrink-0"
            />
          ))}
        </div>

        {/* Search */}
        <div className="px-4 pt-3 pb-2">
          <SkeletonBox className="h-10 w-full rounded-xl" />
        </div>

        {/* Menu grid */}
        <div className="flex-1 overflow-hidden p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 content-start">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-border p-3 shadow-sm space-y-2"
            >
              <SkeletonBox className="h-3 w-16" />
              <SkeletonBox className="h-5 w-full" />
              <SkeletonBox className="h-3 w-12" />
              <SkeletonBox className="h-8 w-full rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
