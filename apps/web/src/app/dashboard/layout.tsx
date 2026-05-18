'use client';

import { DashboardSidebar } from '@/components/ui/DashboardSidebar';
import { useEffect, useState } from 'react';
import { Menu } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const info = localStorage.getItem('user_info');
    if (info) {
      setUser(JSON.parse(info));
    }
  }, []);

  return (
    <div className="flex h-screen bg-background overflow-hidden relative">
      <DashboardSidebar
        tenantName="resPOS"
        userName={user?.name || 'User'}
        role={user?.role || 'OWNER'}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="lg:hidden flex items-center p-3 border-b border-border bg-surface-card shadow-sm shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="p-2 text-content-secondary active:text-content-primary">
            <Menu className="h-5 w-5" />
          </button>
          <span className="ml-3 font-bold text-sm text-content-primary">resPOS Dashboard</span>
        </div>
        <main className="flex-1 overflow-y-auto scrollbar-thin">{children}</main>
      </div>
    </div>
  );
}
