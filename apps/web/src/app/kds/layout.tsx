import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kitchen Display — resPOS',
  description: 'Real-time kitchen order display system',
};

export default function KDSLayout({ children }: { children: React.ReactNode }) {
  // KDS is full-screen, no sidebar, dark theme
  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-950 text-white select-none">
      {children}
    </div>
  );
}
