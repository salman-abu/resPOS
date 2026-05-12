'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Users,
  LogOut,
  Settings,
  Building2,
} from 'lucide-react';

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [admin, setAdmin] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    setIsMounted(true);
    const token = localStorage.getItem('super_admin_token');
    if (!token && !pathname.includes('/super-admin/login')) {
      router.push('/super-admin/login');
    } else {
      const storedAdmin = localStorage.getItem('super_admin_user');
      if (storedAdmin) {
        setAdmin(JSON.parse(storedAdmin));
      }
    }
  }, [pathname, router]);

  if (!isMounted) return null;

  if (pathname.includes('/super-admin/login')) {
    return <>{children}</>;
  }

  const handleLogout = () => {
    localStorage.removeItem('super_admin_token');
    localStorage.removeItem('super_admin_user');
    router.push('/super-admin/login');
  };

  const navItems = [
    { name: 'Platform Stats', href: '/super-admin', icon: LayoutDashboard },
    { name: 'Tenants', href: '/super-admin/tenants', icon: Building2 },
    { name: 'SaaS Users', href: '#', icon: Users },
    { name: 'Platform Settings', href: '#', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-neutral-950 text-white overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 border-r border-neutral-800 bg-neutral-900/50 flex flex-col">
        <div className="p-6 border-b border-neutral-800">
          <h2 className="text-xl font-bold bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
            ResPOS Admin
          </h2>
          <p className="text-xs text-neutral-500 font-mono mt-1">
            GOD MODE ENABLED
          </p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-red-500/10 text-red-500'
                    : 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200'
                }`}
              >
                <item.icon
                  className={`w-5 h-5 ${isActive ? 'text-red-500' : 'text-neutral-500'}`}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-neutral-800">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center font-bold text-xs">
              {(admin?.name as string)?.[0] || 'A'}
            </div>
            <div>
              <p className="text-sm font-medium leading-none">
                {(admin?.name as string) || 'Admin'}
              </p>
              <p className="text-xs text-neutral-500 mt-1">
                Level {(admin?.level as number) || 3}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
