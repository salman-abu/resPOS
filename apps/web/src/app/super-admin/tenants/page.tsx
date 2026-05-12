'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlayCircle, Power, PowerOff } from 'lucide-react';

type TenantData = {
  id: string;
  name: string;
  slug: string;
  subscription_plan: string;
  is_active: boolean;
  _count: { outlets: number; users: number; orders: number };
};

export default function SuperAdminTenants() {
  const [tenants, setTenants] = useState<TenantData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTenants = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('super_admin_token');
      const res = await fetch(`${apiUrl}/super-admin/tenants`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setTenants(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('super_admin_token');
      await fetch(`${apiUrl}/super-admin/tenants/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_active: !currentStatus }),
      });
      fetchTenants();
    } catch (e) {
      console.error(e);
    }
  };

  const impersonate = async (id: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('super_admin_token');
      const res = await fetch(
        `${apiUrl}/super-admin/tenants/${id}/impersonate`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.ok) {
        const data = await res.json();
        // Save the tenant token specifically for impersonation
        localStorage.setItem('tenant_token', data.access_token);
        // Redirect to standard dashboard as the impersonated user
        window.open('/dashboard', '_blank');
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Tenants Directory
          </h1>
          <p className="text-neutral-400 mt-1">
            Manage active subscriptions and perform support impersonations.
          </p>
        </div>
        <Button className="bg-red-600 hover:bg-red-700">
          Provision New Tenant
        </Button>
      </div>

      <Card className="bg-neutral-900 border-neutral-800">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-neutral-400 uppercase bg-neutral-950/50 border-b border-neutral-800">
                <tr>
                  <th className="px-6 py-4 font-medium">Tenant Name</th>
                  <th className="px-6 py-4 font-medium">Plan</th>
                  <th className="px-6 py-4 font-medium">Outlets</th>
                  <th className="px-6 py-4 font-medium">Users</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {loading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-8 text-center text-neutral-500"
                    >
                      Loading tenants...
                    </td>
                  </tr>
                ) : (
                  tenants.map((tenant) => (
                    <tr
                      key={tenant.id}
                      className="hover:bg-neutral-800/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <p className="font-medium text-white">{tenant.name}</p>
                        <p className="text-xs text-neutral-500 mt-1">
                          {tenant.slug}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          variant="outline"
                          className="bg-neutral-950 text-neutral-300"
                        >
                          {tenant.subscription_plan}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-neutral-300">
                        {tenant._count.outlets}
                      </td>
                      <td className="px-6 py-4 text-neutral-300">
                        {tenant._count.users}
                      </td>
                      <td className="px-6 py-4">
                        {tenant.is_active ? (
                          <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                            Active
                          </Badge>
                        ) : (
                          <Badge className="bg-red-500/10 text-red-500 border-red-500/20">
                            Suspended
                          </Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 border-neutral-700 bg-neutral-950 hover:bg-neutral-800 text-neutral-300"
                          onClick={() => impersonate(tenant.id)}
                        >
                          <PlayCircle className="w-4 h-4 mr-2" />
                          Act As
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className={`h-8 w-8 p-0 border-neutral-700 bg-neutral-950 hover:bg-neutral-800 ${tenant.is_active ? 'text-red-500' : 'text-green-500'}`}
                          onClick={() =>
                            toggleStatus(tenant.id, tenant.is_active)
                          }
                          title={
                            tenant.is_active
                              ? 'Suspend Tenant'
                              : 'Activate Tenant'
                          }
                        >
                          {tenant.is_active ? (
                            <PowerOff className="w-4 h-4" />
                          ) : (
                            <Power className="w-4 h-4" />
                          )}
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
