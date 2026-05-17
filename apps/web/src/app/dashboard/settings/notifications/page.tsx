'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export default function NotificationSettingsPage() {
  const [phone, setPhone] = useState('+919876543210');
  const [dailySummary, setDailySummary] = useState(true);
  const [lowStock, setLowStock] = useState(true);

  const handleSave = () => {
    // PATCH /settings/notifications
    console.log('Saved notifications', { phone, dailySummary, lowStock });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Notification Settings
          </h1>
          <p className="text-muted-foreground">
            Manage your automated WhatsApp & SMS alerts.
          </p>
        </div>
        <Button onClick={handleSave}>Save Preferences</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Owner Alerts</CardTitle>
          <CardDescription>
            Where should we send critical business updates?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Owner / Manager Phone Number</Label>
            <Input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +91 98765 43210"
            />
          </div>

          <div className="flex items-center justify-between border p-4 rounded-lg bg-muted/20">
            <div className="space-y-0.5">
              <Label className="text-base">Daily Summary (11:00 PM)</Label>
              <p className="text-sm text-muted-foreground">
                Receive a WhatsApp message with total revenue, covers, and top
                selling item.
              </p>
            </div>
            <Switch checked={dailySummary} onCheckedChange={setDailySummary} />
          </div>

          <div className="flex items-center justify-between border p-4 rounded-lg bg-muted/20">
            <div className="space-y-0.5">
              <Label className="text-base">Low Stock Alerts (Real-time)</Label>
              <p className="text-sm text-muted-foreground">
                Receive an SMS when an ingredient falls below its reorder level.
              </p>
            </div>
            <Switch checked={lowStock} onCheckedChange={setLowStock} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
