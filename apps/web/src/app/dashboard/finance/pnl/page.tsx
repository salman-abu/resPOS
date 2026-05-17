'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';
import { API_BASE } from '@/lib/api';
import { getAuthToken } from '@respos/utils';

export default function PnlDashboardPage() {
  const [period, setPeriod] = useState('2026-05');
  const [pnlData, setPnlData] = useState<any>(null);
  const [cashflowData, setCashflowData] = useState<any>(null);

  useEffect(() => {
    const fetchFinance = async () => {
      try {
        const token = getAuthToken();
        const headers = { Authorization: `Bearer ${token}` };

        const [pnlRes, cashflowRes] = await Promise.all([
          fetch(`${API_BASE}/finance/pnl?period=${period}`, { headers }),
          fetch(`${API_BASE}/finance/cashflow?period=${period}`, { headers }),
        ]);

        if (pnlRes.ok) setPnlData(await pnlRes.json());
        if (cashflowRes.ok) {
          const cf = await cashflowRes.json();
          setCashflowData(cf.chartData);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchFinance();
  }, [period]);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">P&L & Cash Flow</h1>
          <p className="text-muted-foreground">
            Monitor your financial health and liquidity.
          </p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Select Month" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2026-05">May 2026</SelectItem>
            <SelectItem value="2026-04">April 2026</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* P&L Statement */}
        <Card className="col-span-1 border-primary/20 bg-card">
          <CardHeader>
            <CardTitle>P&L Statement</CardTitle>
            <CardDescription>Income & Expenses</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {pnlData ? (
              <>
                <div className="flex justify-between border-b pb-2 text-lg">
                  <span className="font-medium text-green-400">Revenue</span>
                  <span className="font-bold">
                    ₹{pnlData.revenue.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>(-) COGS</span>
                  <span>₹{pnlData.cogs.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-b pb-2 pt-2 text-lg">
                  <span className="font-medium">Gross Profit</span>
                  <span className="font-bold">
                    ₹{pnlData.grossProfit.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-muted-foreground pt-2">
                  <span>(-) Labor</span>
                  <span>₹{pnlData.labor.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>(-) Overhead</span>
                  <span>₹{pnlData.overhead.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t pt-4 text-xl">
                  <span className="font-bold text-primary">Net Profit</span>
                  <span className="font-bold text-primary">
                    ₹{pnlData.netProfit.toLocaleString()}
                  </span>
                </div>

                <div className="flex gap-4 pt-4 text-xs text-muted-foreground border-t mt-4">
                  <div>
                    Gross Margin:{' '}
                    <strong className="text-white">
                      {pnlData.margins.gross}%
                    </strong>
                  </div>
                  <div>
                    Net Margin:{' '}
                    <strong className="text-white">
                      {pnlData.margins.net}%
                    </strong>
                  </div>
                </div>
              </>
            ) : (
              <div className="animate-pulse h-[200px] bg-muted rounded-md" />
            )}
          </CardContent>
        </Card>

        {/* Cash Flow Chart */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Cash Flow Trend</CardTitle>
            <CardDescription>
              Cash In vs Cash Out across the period
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {cashflowData ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={cashflowData}>
                    <defs>
                      <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor="#10b981"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="#10b981"
                          stopOpacity={0}
                        />
                      </linearGradient>
                      <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor="#ef4444"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="#ef4444"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#333"
                    />
                    <XAxis
                      dataKey="date"
                      stroke="#888"
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#888"
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => `₹${val / 1000}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1f2937',
                        borderColor: '#374151',
                      }}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="cashIn"
                      name="Cash In"
                      stroke="#10b981"
                      fillOpacity={1}
                      fill="url(#colorIn)"
                    />
                    <Area
                      type="monotone"
                      dataKey="cashOut"
                      name="Cash Out"
                      stroke="#ef4444"
                      fillOpacity={1}
                      fill="url(#colorOut)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full w-full animate-pulse bg-muted rounded-md" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
