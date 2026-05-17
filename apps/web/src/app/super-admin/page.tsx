'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Server, TrendingUp, Users } from 'lucide-react';
import { API_BASE } from '@/lib/api';

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const apiUrl = API_BASE;
        const token = localStorage.getItem('super_admin_token');
        const res = await fetch(`${apiUrl}/super-admin/stats`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok) {
          setStats(await res.json());
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Platform Overview</h1>
        <p className="text-neutral-400 mt-1">
          Real-time metrics across all SaaS tenants.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Tenants"
          value={loading ? '...' : stats?.totalTenants || 0}
          icon={Building2}
          color="text-blue-500"
          bg="bg-blue-500/10"
        />
        <StatCard
          title="Active Tenants"
          value={loading ? '...' : stats?.activeTenants || 0}
          icon={Server}
          color="text-green-500"
          bg="bg-green-500/10"
        />
        <StatCard
          title="Total Orders Processed"
          value={loading ? '...' : stats?.totalOrders || 0}
          icon={Users}
          color="text-purple-500"
          bg="bg-purple-500/10"
        />
        <StatCard
          title="Platform GMV"
          value={
            loading
              ? '...'
              : `₹${((stats?.totalGmv || 0) / 100).toLocaleString()}`
          }
          icon={TrendingUp}
          color="text-amber-500"
          bg="bg-amber-500/10"
        />
      </div>

      {/* Placeholder for future charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle>GMV Trend (30 Days)</CardTitle>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center text-neutral-500 border border-dashed border-neutral-800 m-6 rounded-lg">
            Chart integration pending
          </CardContent>
        </Card>
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle>Tenant Onboarding</CardTitle>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center text-neutral-500 border border-dashed border-neutral-800 m-6 rounded-lg">
            Chart integration pending
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  bg,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  bg: string;
}) {
  return (
    <Card className="bg-neutral-900/50 border-neutral-800">
      <CardContent className="p-6 flex items-center gap-4">
        <div className={`p-4 rounded-full ${bg}`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
        <div>
          <p className="text-sm font-medium text-neutral-400">{title}</p>
          <h3 className="text-2xl font-bold mt-1">{value}</h3>
        </div>
      </CardContent>
    </Card>
  );
}
