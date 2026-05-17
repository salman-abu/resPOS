'use client';

import { useState, useEffect } from 'react';
import {
  Brain,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Clock,
  Users,
  DollarSign,
  Star,
  RefreshCw,
  ChevronRight,
  Flame,
  Snowflake,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { API_BASE } from '@/lib/api';
import { getAuthToken } from '@respos/utils';

type InsightType = 'all' | 'revenue' | 'staff' | 'menu' | 'operations';

const INSIGHTS = [
  {
    id: '1',
    type: 'hot',
    category: 'revenue',
    title: 'Peak hour revenue spike detected',
    body: 'Your 7–9 PM slot generates 42% of daily revenue. Consider adding a dedicated cashier during this window.',
    action: 'View Analytics',
    actionHref: '/dashboard/analytics',
    impact: 'high',
    time: '2 hours ago',
  },
  {
    id: '2',
    type: 'warning',
    category: 'menu',
    title: 'Butter Chicken has 3 low-stock ingredients',
    body: 'Tomato purée, fresh cream, and kasuri methi are running low. At current order rates you may run out by tomorrow.',
    action: 'Check Inventory',
    actionHref: '/dashboard/inventory',
    impact: 'high',
    time: '4 hours ago',
  },
  {
    id: '3',
    type: 'win',
    category: 'revenue',
    title: 'Weekend revenue up 18% vs last week',
    body: 'Saturday and Sunday combined revenue hit ₹48,200 — your best weekend in 6 weeks. The new combo offers are driving this.',
    impact: 'high',
    time: '1 day ago',
  },
  {
    id: '4',
    type: 'cold',
    category: 'menu',
    title: '4 menu items have zero orders this week',
    body: 'Veg Biryani, Raita, Masala Papad, and Shahi Tukda have not been ordered in 7 days. Consider removing or promoting them.',
    action: 'Manage Menu',
    actionHref: '/dashboard/menu',
    impact: 'medium',
    time: '1 day ago',
  },
  {
    id: '5',
    type: 'staff',
    category: 'staff',
    title: 'Rahul has the fastest KOT completion time',
    body: 'Average ticket: 4m 12s vs team average of 7m 30s. Consider making him lead chef during peak hours.',
    impact: 'medium',
    time: '2 days ago',
  },
  {
    id: '6',
    type: 'time',
    category: 'operations',
    title: 'Table turnover is slow on Fridays',
    body: 'Average dine-in on Fridays is 67 minutes — 23 minutes longer than weekdays. Pre-setting tables could help.',
    impact: 'medium',
    time: '2 days ago',
  },
  {
    id: '7',
    type: 'tip',
    category: 'operations',
    title: 'Enable Zomato integration for 22% more orders',
    body: 'Restaurants in your area using Zomato integration see an average 22% increase in total orders.',
    action: 'Setup Now',
    actionHref: '/dashboard/settings',
    impact: 'low',
    time: '4 days ago',
  },
] as const;

const TYPE_CFG: Record<
  string,
  { icon: React.ReactNode; color: string; bg: string; label: string }
> = {
  hot: {
    icon: <Flame className="h-4 w-4" />,
    color: 'text-orange-500',
    bg: 'bg-orange-50 border-orange-200',
    label: 'Trending',
  },
  cold: {
    icon: <Snowflake className="h-4 w-4" />,
    color: 'text-cyan-500',
    bg: 'bg-cyan-50 border-cyan-200',
    label: 'Slow',
  },
  win: {
    icon: <Star className="h-4 w-4" />,
    color: 'text-yellow-500',
    bg: 'bg-yellow-50 border-yellow-200',
    label: 'Win',
  },
  warning: {
    icon: <AlertTriangle className="h-4 w-4" />,
    color: 'text-red-500',
    bg: 'bg-red-50 border-red-200',
    label: 'Alert',
  },
  time: {
    icon: <Clock className="h-4 w-4" />,
    color: 'text-amber-500',
    bg: 'bg-amber-50 border-amber-200',
    label: 'Time',
  },
  staff: {
    icon: <Users className="h-4 w-4" />,
    color: 'text-blue-500',
    bg: 'bg-blue-50 border-blue-200',
    label: 'Staff',
  },
  revenue: {
    icon: <DollarSign className="h-4 w-4" />,
    color: 'text-emerald-500',
    bg: 'bg-emerald-50 border-emerald-200',
    label: 'Revenue',
  },
  tip: {
    icon: <Lightbulb className="h-4 w-4" />,
    color: 'text-violet-500',
    bg: 'bg-violet-50 border-violet-200',
    label: 'Tip',
  },
};

const IMPACT_CFG: Record<string, string> = {
  high: 'text-red-600 bg-red-50 border-red-200',
  medium: 'text-amber-600 bg-amber-50 border-amber-200',
  low: 'text-slate-500 bg-slate-50 border-slate-200',
};

const FILTERS = [
  { key: 'all' as InsightType, label: 'All' },
  { key: 'revenue' as InsightType, label: 'Revenue' },
  { key: 'menu' as InsightType, label: 'Menu' },
  { key: 'staff' as InsightType, label: 'Staff' },
  { key: 'operations' as InsightType, label: 'Operations' },
];

export default function InsightsPage() {
  const [filter, setFilter] = useState<InsightType>('all');
  const [spin, setSpin] = useState(false);
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInsights = async () => {
    setSpin(true);
    setLoading(true);
    try {
      const token = getAuthToken();
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch from API
      const [foodCostRes, tableTurnRes, forecastRes, slowMoversRes] =
        await Promise.all([
          fetch(`${API_BASE}/analytics/food-cost-alert`, { headers }),
          fetch(`${API_BASE}/analytics/table-turn`, { headers }),
          fetch(`${API_BASE}/analytics/forecast?days=7`, { headers }),
          fetch(`${API_BASE}/analytics/slow-movers`, { headers }),
        ]);

      const foodCosts = await foodCostRes.json();
      const tableTurn = await tableTurnRes.json();
      const forecast = await forecastRes.json();
      const slowMovers = await slowMoversRes.json();

      const newInsights = [];

      // 1. Food Cost Alerts
      if (foodCosts && foodCosts.length > 0) {
        newInsights.push({
          id: 'fc-1',
          type: 'warning',
          category: 'menu',
          title: `High Food Cost on ${foodCosts.length} items`,
          body: `${foodCosts
            .slice(0, 3)
            .map((i: any) => i.itemName)
            .join(
              ', ',
            )} are exceeding target 30% cost threshold (Highest: ${foodCosts[0].itemName} at ${foodCosts[0].costPercentage}%).`,
          action: 'Adjust Pricing/Recipes',
          actionHref: '/dashboard/menu',
          impact: 'high',
          time: 'Just now',
        });
      }

      // 2. Table Turn
      if (tableTurn && tableTurn.averageTurnTimeMinutes) {
        if (tableTurn.averageTurnTimeMinutes > 60) {
          newInsights.push({
            id: 'tt-1',
            type: 'time',
            category: 'operations',
            title: 'Table turnover is slowing down',
            body: `Average dine-in time is ${tableTurn.averageTurnTimeMinutes} minutes. Consider streamlining the order-to-table process.`,
            impact: 'medium',
            time: 'Just now',
          });
        } else {
          newInsights.push({
            id: 'tt-2',
            type: 'win',
            category: 'operations',
            title: 'Excellent Table Turnover',
            body: `Average dine-in time is a healthy ${tableTurn.averageTurnTimeMinutes} minutes, maximizing seating capacity.`,
            impact: 'low',
            time: 'Just now',
          });
        }
      }

      // 3. Forecast Peaks
      if (forecast && forecast.length > 0) {
        // Find highest predicted revenue
        const peak = [...forecast].sort(
          (a, b) => b.predictedRevenue - a.predictedRevenue,
        )[0];
        const peakDate = new Date(peak.date).toLocaleDateString('en-US', {
          weekday: 'long',
        });
        newInsights.push({
          id: 'fo-1',
          type: 'hot',
          category: 'revenue',
          title: `Peak Demand Predicted for ${peakDate}`,
          body: `Our ML model forecasts a revenue spike of ₹${peak.predictedRevenue.toLocaleString()} and ~${peak.predictedCovers} covers. Ensure adequate staff scheduling.`,
          action: 'View Schedule',
          actionHref: '/dashboard/staff',
          impact: 'high',
          time: 'Just now',
        });
      }

      // 4. Slow Movers
      if (slowMovers && slowMovers.length > 0) {
        newInsights.push({
          id: 'sm-1',
          type: 'cold',
          category: 'menu',
          title: `${slowMovers.length} menu items are underperforming`,
          body: `${slowMovers.map((i: any) => i.name).join(', ')} have fewer than 5 orders in the last 30 days. Consider removing or promoting them.`,
          action: 'Manage Menu',
          actionHref: '/dashboard/menu',
          impact: 'medium',
          time: 'Just now',
        });
      }

      setInsights(newInsights);
    } catch (e) {
      console.error('Error fetching insights:', e);
    } finally {
      setSpin(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  const list =
    filter === 'all' ? insights : insights.filter((i) => i.category === filter);

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-violet-600 flex items-center justify-center">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-content-primary">
              AI Insights
            </h1>
            <p className="text-sm text-content-muted">
              Smart recommendations from your data
            </p>
          </div>
        </div>
        <button
          onClick={fetchInsights}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-surface-2 text-sm text-content-secondary hover:bg-surface-3 transition-colors"
        >
          <RefreshCw className={cn('h-4 w-4', spin && 'animate-spin')} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          {
            label: 'Total',
            value: insights.length,
            icon: <Brain className="h-4 w-4" />,
            color: 'text-violet-600',
          },
          {
            label: 'High Priority',
            value: insights.filter((i) => i.impact === 'high').length,
            icon: <TrendingUp className="h-4 w-4" />,
            color: 'text-red-500',
          },
          {
            label: 'Wins',
            value: insights.filter((i) => i.type === 'win').length,
            icon: <Star className="h-4 w-4" />,
            color: 'text-yellow-500',
          },
          {
            label: 'Alerts',
            value: insights.filter((i) => i.type === 'warning').length,
            icon: <AlertTriangle className="h-4 w-4" />,
            color: 'text-orange-500',
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-2xl border border-border p-4 shadow-sm"
          >
            <div className={cn('mb-1', s.color)}>{s.icon}</div>
            <p className="text-2xl font-black text-content-primary">
              {s.value}
            </p>
            <p className="text-xs text-content-muted">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              'px-4 py-1.5 rounded-full text-sm font-semibold border transition-all',
              filter === f.key
                ? 'bg-violet-600 text-white border-violet-600'
                : 'bg-white text-content-secondary border-border hover:border-violet-300',
            )}
          >
            {f.label}
          </button>
        ))}
        <span className="ml-auto text-sm text-content-muted">
          {list.length} insights
        </span>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin mb-4" />
            <p className="text-sm font-bold uppercase tracking-widest">
              Running AI Models...
            </p>
          </div>
        ) : list.length === 0 ? (
          <div className="py-20 text-center text-slate-400">
            <p className="text-sm font-bold uppercase tracking-widest">
              No insights found
            </p>
          </div>
        ) : (
          list.map((insight) => {
            const cfg = TYPE_CFG[insight.type];
            return (
              <div
                key={insight.id}
                className="bg-white rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4 p-5">
                  <div
                    className={cn(
                      'h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 border',
                      cfg.bg,
                    )}
                  >
                    <span className={cfg.color}>{cfg.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-bold text-content-primary text-sm">
                        {insight.title}
                      </h3>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span
                          className={cn(
                            'text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize',
                            IMPACT_CFG[insight.impact],
                          )}
                        >
                          {insight.impact}
                        </span>
                        <span
                          className={cn(
                            'text-[10px] font-bold px-2 py-0.5 rounded-full border',
                            cfg.bg,
                            cfg.color,
                          )}
                        >
                          {cfg.label}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-content-secondary leading-relaxed">
                      {insight.body}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-content-muted flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {insight.time}
                      </span>
                      {'action' in insight && insight.action && (
                        <a
                          href={insight.actionHref}
                          className={cn(
                            'text-xs font-semibold flex items-center gap-1 hover:underline',
                            cfg.color,
                          )}
                        >
                          {insight.action}
                          <ChevronRight className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
