import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kiosk Terminal | resPOS',
  description: 'Self-service ordering terminal',
};

export default function KioskLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-950 select-none touch-none overflow-hidden">
      {children}
    </div>
  );
}
