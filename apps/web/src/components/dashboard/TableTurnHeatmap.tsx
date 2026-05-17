'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { getAuthToken } from '@respos/utils';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

interface ZoneData {
  zone: string;
  averageTurnTimeMinutes: number;
  orders: number;
}

interface HeatmapData {
  averageTurnTimeMinutes: number;
  zones: ZoneData[];
}

export function TableTurnHeatmap() {
  const [data, setData] = useState<HeatmapData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const token = getAuthToken();
        const res = await fetch(`${API_BASE}/analytics/table-turn`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!cancelled) setData(json);
      } catch (e) {
        console.error('Table turn fetch failed', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Table Turn Heatmap</CardTitle>
          <CardDescription>Average seating duration per zone.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center text-muted-foreground animate-pulse">
            Loading...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Table Turn Heatmap</CardTitle>
        <CardDescription>Average seating duration per zone.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4 mt-2">
          <div className="flex justify-between items-end border-b pb-4">
            <div>
              <p className="text-sm text-muted-foreground">Global Average</p>
              <h3 className="text-3xl font-bold tracking-tight text-primary">
                {data.averageTurnTimeMinutes}{' '}
                <span className="text-sm font-normal text-muted-foreground">
                  min
                </span>
              </h3>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            {data.zones.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No table turn data available yet.
              </p>
            )}
            {data.zones.map((zone) => {
              // Determine color based on time (faster = green, slower = red)
              let color = 'bg-emerald-500';
              if (zone.averageTurnTimeMinutes > 50) color = 'bg-red-500';
              else if (zone.averageTurnTimeMinutes > 40) color = 'bg-amber-500';

              return (
                <div key={zone.zone} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{zone.zone}</span>
                    <span className="text-muted-foreground">
                      {zone.averageTurnTimeMinutes} min
                    </span>
                  </div>
                  <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                    <div
                      className={`h-full ${color} rounded-full`}
                      style={{
                        width: `${Math.min(100, (zone.averageTurnTimeMinutes / 80) * 100)}%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {zone.orders} orders
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
