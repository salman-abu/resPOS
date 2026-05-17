'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function LoyaltyConfigPage() {
  const [pointsPerRupee, setPointsPerRupee] = useState('0.1');
  const [redeemThreshold, setRedeemThreshold] = useState('100');
  const [silverThreshold, setSilverThreshold] = useState('5000');
  const [goldThreshold, setGoldThreshold] = useState('15000');
  const [platinumThreshold, setPlatinumThreshold] = useState('50000');

  const handleSave = async () => {
    // In real app, make API call to /loyalty/config
    const payload = {
      pointsPerRupee: parseFloat(pointsPerRupee),
      redeemThreshold: parseInt(redeemThreshold, 10),
      tierThresholds: {
        SILVER: parseInt(silverThreshold, 10),
        GOLD: parseInt(goldThreshold, 10),
        PLATINUM: parseInt(platinumThreshold, 10),
      },
    };
    console.log('Saving loyalty config', payload);
    // await api.post('/loyalty/config', payload);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">
        Loyalty & CRM Settings
      </h1>
      <p className="text-muted-foreground">
        Configure points earning, redemption rules, and customer tiers.
      </p>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Earning & Redemption</CardTitle>
            <CardDescription>
              Set the base values for points generation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Points Per Rupee Spent</Label>
              <Input
                type="number"
                step="0.01"
                value={pointsPerRupee}
                onChange={(e) => setPointsPerRupee(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Example: 0.1 means 1 point for every ₹10 spent.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Minimum Redeem Threshold (Points)</Label>
              <Input
                type="number"
                value={redeemThreshold}
                onChange={(e) => setRedeemThreshold(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Customers cannot redeem points until they reach this balance.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Loyalty Tiers (Spend in ₹)</CardTitle>
            <CardDescription>
              Set lifetime spend thresholds for each tier.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-400">Bronze</Label>
              <Input value="0" disabled />
              <p className="text-xs text-muted-foreground">
                Default tier for all new customers.
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Silver</Label>
              <Input
                type="number"
                value={silverThreshold}
                onChange={(e) => setSilverThreshold(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-amber-400">Gold</Label>
              <Input
                type="number"
                value={goldThreshold}
                onChange={(e) => setGoldThreshold(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-indigo-400">Platinum</Label>
              <Input
                type="number"
                value={platinumThreshold}
                onChange={(e) => setPlatinumThreshold(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} className="w-32">
          Save Config
        </Button>
      </div>
    </div>
  );
}
