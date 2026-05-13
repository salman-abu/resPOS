import Link from 'next/link';
import {
  ArrowRight,
  UtensilsCrossed,
  MonitorSmartphone,
  LineChart,
  ShieldCheck,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 selection:bg-blue-500/30 overflow-hidden relative font-sans">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[400px] bg-indigo-600/10 blur-[100px] rounded-full pointer-events-none" />

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2.5 rounded-xl shadow-lg shadow-blue-500/20">
            <UtensilsCrossed className="w-6 h-6 text-white" />
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-white">
            resPOS
          </span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium">
          <Link
            href="/login"
            className="text-slate-300 hover:text-white transition-colors"
          >
            Owner Login
          </Link>
          <Link
            href="/super-admin/login"
            className="text-red-400/80 hover:text-red-400 transition-colors"
          >
            God Mode
          </Link>
          <Link
            href="/pos/pin"
            className="bg-white/10 hover:bg-white/20 border border-white/10 px-6 py-2.5 rounded-full backdrop-blur-md transition-all text-white flex items-center gap-2"
          >
            Staff PIN Pad <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center text-center px-4 pt-24 pb-20 max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-10">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
          v2.0 Beta Now Live
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 mb-8 leading-[1.1]">
          The Intelligent OS for <br className="hidden md:block" /> Modern
          Restaurants
        </h1>

        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mb-12 leading-relaxed">
          A lightning-fast, offline-capable Point of Sale built for scale.
          Manage tables, multi-channel orders, and kitchen display systems in
          real-time.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <Link
            href="/login"
            className="w-full sm:w-auto flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-full font-semibold transition-all shadow-[0_0_40px_-10px_rgba(37,99,235,0.5)] hover:shadow-[0_0_60px_-15px_rgba(37,99,235,0.6)]"
          >
            Access Dashboard
          </Link>
          <Link
            href="/pos/pin"
            className="w-full sm:w-auto flex justify-center items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-8 py-4 rounded-full font-semibold transition-all border border-slate-700"
          >
            Launch POS Terminal
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-32 w-full text-left">
          <div className="p-8 rounded-[2rem] bg-slate-900/40 border border-slate-800/50 backdrop-blur-md hover:bg-slate-900/60 transition-colors">
            <div className="bg-indigo-500/20 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border border-indigo-500/20 shadow-inner">
              <MonitorSmartphone className="w-7 h-7 text-indigo-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-200 mb-3">
              Offline First
            </h3>
            <p className="text-slate-400 leading-relaxed">
              Never miss a sale. resPOS uses Dexie.js to store menus and draft
              orders locally when the internet drops.
            </p>
          </div>

          <div className="p-8 rounded-[2rem] bg-slate-900/40 border border-slate-800/50 backdrop-blur-md hover:bg-slate-900/60 transition-colors">
            <div className="bg-emerald-500/20 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border border-emerald-500/20 shadow-inner">
              <LineChart className="w-7 h-7 text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-200 mb-3">
              Real-time KDS
            </h3>
            <p className="text-slate-400 leading-relaxed">
              Instant web-socket synchronization between the cashier and the
              kitchen. No more lost paper tickets.
            </p>
          </div>

          <div className="p-8 rounded-[2rem] bg-slate-900/40 border border-slate-800/50 backdrop-blur-md hover:bg-slate-900/60 transition-colors">
            <div className="bg-orange-500/20 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border border-orange-500/20 shadow-inner">
              <ShieldCheck className="w-7 h-7 text-orange-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-200 mb-3">
              Multi-Tenant SaaS
            </h3>
            <p className="text-slate-400 leading-relaxed">
              Built on a secure SaaS architecture. Manage hundreds of outlets
              and franchises from a single God Mode panel.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
