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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Send, Users } from 'lucide-react';
import { API_BASE } from '@/lib/api';
import { getAuthToken } from '@respos/utils';

export default function MarketingCampaignPage() {
  const [target, setTarget] = useState('ALL');
  const [template, setTemplate] = useState(
    'Hi {{name}}, get 20% off your next order! Use code NEXT20.',
  );
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleLaunch = async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_BASE}/marketing/campaign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          targetAudience: target,
          messageTemplate: template,
        }),
      });
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            WhatsApp / SMS Marketing
          </h1>
          <p className="text-muted-foreground">
            Engage your customers with targeted campaigns.
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Builder</CardTitle>
              <CardDescription>
                Select audience and draft your message.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Target Audience</label>
                <Select value={target} onValueChange={setTarget}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Audience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Customers</SelectItem>
                    <SelectItem value="TIER">
                      VIP (Gold/Platinum) Tier
                    </SelectItem>
                    <SelectItem value="INACTIVE_30DAYS">
                      Inactive (&gt;30 Days)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Message Template</label>
                <Textarea
                  rows={4}
                  value={template}
                  onChange={(e) => setTemplate(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Available variables: {'{{name}}'}, {'{{tier}}'}
                </p>
              </div>

              <Button
                onClick={handleLaunch}
                disabled={loading || !template}
                className="w-full"
              >
                {loading ? (
                  'Queuing...'
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" /> Launch Campaign
                  </>
                )}
              </Button>

              {success && (
                <div className="p-3 bg-green-500/10 text-green-500 rounded-md text-sm text-center">
                  Campaign queued successfully! Messages are being dispatched.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" /> Reach Estimate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <h2 className="text-4xl font-bold">
                {target === 'ALL' ? '1,450' : target === 'TIER' ? '320' : '480'}
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                Customers will receive this message.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
