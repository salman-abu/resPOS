'use client';

import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingCart,
  BarChart3,
  Users,
  UtensilsCrossed,
  Package,
  Brain,
  Settings,
  ChevronRight,
  Zap,
  LogOut,
  ChefHat,
  FileBarChart2,
  TableProperties,
  MonitorSmartphone,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
  badgeColor?: string;
  section: string;
}

const NAV: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: <LayoutDashboard className="h-4 w-4" />,
    section: 'overview',
  },
  {
    label: 'AI Insights',
    href: '/dashboard/insights',
    icon: <Brain className="h-4 w-4" />,
    section: 'overview',
    badge: 'NEW',
    badgeColor: 'bg-violet-100 text-violet-700',
  },
  {
    label: 'Analytics',
    href: '/dashboard/analytics',
    icon: <BarChart3 className="h-4 w-4" />,
    section: 'overview',
  },
  {
    label: 'POS Terminal',
    href: '/pos',
    icon: <ShoppingCart className="h-4 w-4" />,
    section: 'operations',
  },
  {
    label: 'Menu Manager',
    href: '/dashboard/menu',
    icon: <UtensilsCrossed className="h-4 w-4" />,
    section: 'operations',
  },
  {
    label: 'Staff',
    href: '/dashboard/staff',
    icon: <Users className="h-4 w-4" />,
    section: 'operations',
    badge: 'NEW',
    badgeColor: 'bg-emerald-100 text-emerald-700',
  },
  {
    label: 'Kitchen (KDS)',
    href: '/kds',
    icon: <ChefHat className="h-4 w-4" />,
    section: 'operations',
  },
  {
    label: 'Floor Plan',
    href: '/pos/tables',
    icon: <TableProperties className="h-4 w-4" />,
    section: 'operations',
  },
  {
    label: 'Z-Report',
    href: '/dashboard/z-report',
    icon: <FileBarChart2 className="h-4 w-4" />,
    section: 'operations',
    badge: 'SHIFT',
    badgeColor: 'bg-amber-100 text-amber-700',
  },
  {
    label: 'Inventory',
    href: '/dashboard/inventory',
    icon: <Package className="h-4 w-4" />,
    section: 'operations',
  },
  {
    label: 'Terminals',
    href: '/dashboard/terminals',
    icon: <MonitorSmartphone className="h-4 w-4" />,
    section: 'system',
  },
  {
    label: 'Settings',
    href: '/dashboard/settings',
    icon: <Settings className="h-4 w-4" />,
    section: 'system',
  },
];

const SECTIONS: Record<string, string> = {
  overview: 'Overview',
  operations: 'Operations',
  system: 'System',
};

interface Props {
  tenantName?: string;
  userName?: string;
}

export function DashboardSidebar({
  tenantName = 'My Restaurant',
  userName = 'Owner',
}: Props) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    // We intentionally do NOT remove device_tenant_id so the POS terminal stays paired
    router.push('/login');
  };

  const grouped = NAV.reduce<Record<string, NavItem[]>>((acc, item) => {
    if (!acc[item.section]) acc[item.section] = [];
    acc[item.section].push(item);
    return acc;
  }, {});

  return (
    <aside className="flex flex-col w-60 h-screen bg-white border-r border-border flex-shrink-0 shadow-sm">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
        <div className="h-9 w-9 rounded-xl bg-brand-600 flex items-center justify-center shadow-sm flex-shrink-0">
          <Zap className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-content-primary font-bold text-sm truncate">
            {tenantName}
          </p>
          <p className="text-content-muted text-xs">resPOS Dashboard</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5 scrollbar-thin">
        {Object.entries(grouped).map(([section, items]) => (
          <div key={section}>
            <p className="text-[10px] font-bold text-content-muted uppercase tracking-widest px-3 mb-2">
              {SECTIONS[section]}
            </p>
            <div className="space-y-0.5">
              {items.map((item) => {
                const isActive =
                  item.href === '/dashboard'
                    ? pathname === '/dashboard'
                    : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 group',
                      isActive
                        ? 'bg-brand-50 text-brand-700 font-semibold border border-brand-100'
                        : 'text-content-secondary hover:bg-surface-3 hover:text-content-primary',
                    )}
                  >
                    <span
                      className={cn(
                        'flex-shrink-0',
                        isActive
                          ? 'text-brand-600'
                          : 'text-content-muted group-hover:text-content-secondary',
                      )}
                    >
                      {item.icon}
                    </span>
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.badge && (
                      <span
                        className={cn(
                          'text-[10px] font-bold px-1.5 py-0.5 rounded-full',
                          item.badgeColor ?? 'bg-surface-3 text-content-muted',
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                    {isActive && (
                      <ChevronRight className="h-3.5 w-3.5 text-brand-400 flex-shrink-0" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-border">
        <div
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-3 hover:bg-danger/5 transition-colors cursor-pointer group"
        >
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0 text-xs font-bold text-white">
            {userName.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-content-primary text-sm font-semibold truncate group-hover:text-danger transition-colors">
              {userName}
            </p>
            <p className="text-content-muted text-[10px] uppercase font-bold tracking-wider group-hover:text-danger/70 transition-colors">
              Logout
            </p>
          </div>
          <LogOut className="h-4 w-4 text-content-muted group-hover:text-danger transition-colors flex-shrink-0" />
        </div>
      </div>
    </aside>
  );
}
