import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="text-center space-y-6 max-w-md">
        <div className="relative inline-block">
          <p className="text-[120px] font-black text-slate-800 leading-none select-none">404</p>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-16 w-16 rounded-2xl bg-brand-600 flex items-center justify-center shadow-2xl shadow-brand-600/40">
              <span className="text-3xl">🍽️</span>
            </div>
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-black text-white mb-2">Page Not Found</h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            Looks like this page went to the kitchen and never came back. Let&#39;s get you back on track.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3">
          <Link href="/dashboard"
            className="px-5 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-colors shadow-sm">
            Go to Dashboard
          </Link>
          <Link href="/pos"
            className="px-5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-sm font-semibold hover:bg-slate-700 transition-colors">
            Open POS
          </Link>
        </div>
      </div>
    </div>
  );
}
