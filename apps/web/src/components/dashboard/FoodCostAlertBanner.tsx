'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getAuthToken } from '@respos/utils';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

interface FoodCostAlert {
  itemId: string;
  itemName: string;
  cost: number;
  price: number;
  costPercentage: number;
  severity: 'HIGH' | 'MEDIUM';
}

export function FoodCostAlertBanner() {
  const [alerts, setAlerts] = useState<FoodCostAlert[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const token = getAuthToken();
        const res = await fetch(`${API_BASE}/analytics/food-cost-alert`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!cancelled) setAlerts(json);
      } catch (e) {
        console.error('Food cost alert fetch failed', e);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (alerts.length === 0) return null;

  return (
    <div className="space-y-4 mb-6">
      {alerts.map((alert) => (
        <Alert
          variant="destructive"
          key={alert.itemId}
          className="border-red-500/50 bg-red-500/10 text-red-400"
        >
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>High Food Cost Alert!</AlertTitle>
          <AlertDescription>
            <strong>{alert.itemName}</strong> is currently at a{' '}
            <strong>{alert.costPercentage}%</strong> food cost (Recipe Cost: ₹
            {alert.cost} / Selling Price: ₹{alert.price}). Consider adjusting
            the price or recipe.
          </AlertDescription>
        </Alert>
      ))}
    </div>
  );
}
