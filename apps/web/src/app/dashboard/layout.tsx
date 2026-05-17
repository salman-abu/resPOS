'use client';

import { DashboardSidebar } from '@/components/ui/DashboardSidebar';
import { useEffect, useState } from 'react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);

  useEffect(() => {
    const info = localStorage.getItem('user_info');
    if (info) {
      setUser(JSON.parse(info));
    }
  }, []);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <DashboardSidebar
        tenantName="resPOS"
        userName={user?.name || 'User'}
        role={user?.role || 'OWNER'}
      />
      <main className="flex-1 overflow-y-auto scrollbar-thin">{children}</main>
    </div>
  );
}
