function SkeletonBox({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-slate-100 ${className ?? ''}`}
    />
  );
}

export default function TerminalsLoading() {
  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8 space-y-2">
        <SkeletonBox className="h-7 w-52" />
        <SkeletonBox className="h-4 w-72" />
      </div>
      <div className="grid md:grid-cols-2 gap-8">
        {[...Array(2)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-3xl border border-border p-8 shadow-sm space-y-4"
          >
            <SkeletonBox className="h-12 w-12 rounded-2xl" />
            <SkeletonBox className="h-6 w-44" />
            <SkeletonBox className="h-4 w-full" />
            <SkeletonBox className="h-4 w-3/4" />
            <SkeletonBox className="h-12 w-full rounded-2xl mt-4" />
          </div>
        ))}
      </div>
    </div>
  );
}
