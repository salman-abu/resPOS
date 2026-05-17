import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  /** All numbers the dashboard home needs — single DB round-trip batch */
  async getDashboardStats(tenantId: string) {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(todayStart.getDate() - 1);

    const lastWeekStart = new Date(todayStart);
    lastWeekStart.setDate(todayStart.getDate() - 7);

    // Run all queries in parallel
    const [
      todayInvoices,
      yesterdayInvoices,
      lastWeekInvoices,
      todayOrders,
      tables,
      activeStaff,
      topSellers,
    ] = await Promise.all([
      // Today's settled invoices
      this.prisma.invoice.findMany({
        where: {
          order: { tenant_id: tenantId, settled_at: { gte: todayStart } },
        },
        select: { total: true },
      }),
      // Yesterday's settled invoices
      this.prisma.invoice.findMany({
        where: {
          order: {
            tenant_id: tenantId,
            settled_at: { gte: yesterdayStart, lt: todayStart },
          },
        },
        select: { total: true },
      }),
      // Last week same day
      this.prisma.invoice.findMany({
        where: {
          order: {
            tenant_id: tenantId,
            settled_at: {
              gte: lastWeekStart,
              lt: new Date(lastWeekStart.getTime() + 86400000),
            },
          },
        },
        select: { total: true },
      }),
      // Today's orders count
      this.prisma.order.count({
        where: {
          tenant_id: tenantId,
          created_at: { gte: todayStart },
          status: { not: 'VOID' },
        },
      }),
      // All tables with status
      this.prisma.table.findMany({
        where: { tenant_id: tenantId },
        select: { status: true, current_order_id: true },
      }),
      // Staff clocked-in today (orders placed today as proxy until attendance module)
      this.prisma.user.count({
        where: { tenant_id: tenantId, is_active: true },
      }),
      // Top 5 sellers today by quantity
      this.prisma.orderItem.groupBy({
        by: ['item_id'],
        where: {
          order: {
            tenant_id: tenantId,
            created_at: { gte: todayStart },
            status: { not: 'VOID' },
          },
        },
        _sum: { quantity: true },
        _count: { item_id: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5,
      }),
    ]);

    // Resolve item names for top sellers
    const itemIds = topSellers.map((s) => s.item_id);
    const items = await this.prisma.item.findMany({
      where: { id: { in: itemIds } },
      select: { id: true, name: true, base_price: true },
    });
    const itemMap = Object.fromEntries(items.map((i) => [i.id, i]));

    // Aggregate
    const revenueToday = todayInvoices.reduce((s, i) => s + i.total, 0);
    const revenueYesterday = yesterdayInvoices.reduce((s, i) => s + i.total, 0);
    const revenueLastWeek = lastWeekInvoices.reduce((s, i) => s + i.total, 0);
    const avgCheck =
      todayOrders > 0 ? Math.round(revenueToday / todayOrders) : 0;

    const activeTables = tables.filter(
      (t) => t.status !== 'AVAILABLE' && t.status !== 'DIRTY',
    ).length;
    const totalTables = tables.length;

    // Health score: weighted formula
    const occupancyScore =
      totalTables > 0 ? (activeTables / totalTables) * 40 : 0;
    const revenueScore =
      revenueToday > 0
        ? Math.min(40, (revenueToday / Math.max(revenueYesterday, 1)) * 40)
        : 20;
    const ordersScore = Math.min(20, (todayOrders / 50) * 20); // 50 orders = perfect
    const health = Math.round(occupancyScore + revenueScore + ordersScore);

    const topSellersFormatted = topSellers.map((s) => ({
      id: s.item_id,
      name: itemMap[s.item_id]?.name ?? 'Unknown',
      qty: s._sum.quantity ?? 0,
      revenue: (s._sum.quantity ?? 0) * (itemMap[s.item_id]?.base_price ?? 0),
    }));

    return {
      revenue_today: revenueToday,
      revenue_yesterday: revenueYesterday,
      revenue_last_week: revenueLastWeek,
      orders_today: todayOrders,
      avg_check: avgCheck,
      active_tables: activeTables,
      total_tables: totalTables,
      staff: activeStaff,
      health: Math.max(10, Math.min(100, health)),
      top_sellers: topSellersFormatted,
    };
  }

  /** Floor plan table statuses for dashboard widget */
  async getTableStatuses(tenantId: string) {
    const tables = await this.prisma.table.findMany({
      where: { tenant_id: tenantId },
      select: {
        table_number: true,
        status: true,
        current_order_id: true,
      },
      orderBy: { table_number: 'asc' },
    });

    return tables.map((t) => ({
      n: t.table_number,
      s: t.status,
    }));
  }

  /** Real top sellers — 7-day window */
  async getTopSellers(tenantId: string, period: 'week' | 'month' = 'week') {
    const days = period === 'week' ? 7 : 30;
    const since = new Date();
    since.setDate(since.getDate() - days);

    const grouped = await this.prisma.orderItem.groupBy({
      by: ['item_id'],
      where: {
        order: {
          tenant_id: tenantId,
          created_at: { gte: since },
          status: { not: 'VOID' },
        },
      },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 10,
    });

    const itemIds = grouped.map((g) => g.item_id);
    const items = await this.prisma.item.findMany({
      where: { id: { in: itemIds } },
      select: { id: true, name: true, base_price: true },
    });
    const itemMap = Object.fromEntries(items.map((i) => [i.id, i]));

    return grouped.map((g) => ({
      id: g.item_id,
      name: itemMap[g.item_id]?.name ?? 'Unknown',
      qty: g._sum.quantity ?? 0,
      revenue: (g._sum.quantity ?? 0) * (itemMap[g.item_id]?.base_price ?? 0),
    }));
  }

  /** Slow movers — items with < 5 orders in last 30 days */
  async getSlowMovers(tenantId: string) {
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const allItems = await this.prisma.item.findMany({
      where: { tenant_id: tenantId, is_available: true },
      select: { id: true, name: true, base_price: true },
    });

    const sold = await this.prisma.orderItem.groupBy({
      by: ['item_id'],
      where: {
        order: {
          tenant_id: tenantId,
          created_at: { gte: since },
          status: { not: 'VOID' },
        },
      },
      _sum: { quantity: true },
    });
    const soldMap = Object.fromEntries(
      sold.map((s) => [s.item_id, s._sum.quantity ?? 0]),
    );

    return allItems
      .map((i) => ({ ...i, ordersLast30Days: soldMap[i.id] ?? 0 }))
      .filter((i) => i.ordersLast30Days < 5)
      .sort((a, b) => a.ordersLast30Days - b.ordersLast30Days)
      .slice(0, 5);
  }

  async getForecast(tenantId: string, days: number = 7) {
    const today = new Date();
    const ninetyDaysAgo = new Date(today);
    ninetyDaysAgo.setDate(today.getDate() - 90);

    // Get historical data for the last 90 days for better seasonality
    const historicalInvoices = await this.prisma.invoice.findMany({
      where: {
        tenant_id: tenantId,
        created_at: { gte: ninetyDaysAgo },
      },
      select: {
        created_at: true,
        total: true,
      },
      orderBy: { created_at: 'asc' },
    });

    const historicalOrders = await this.prisma.order.findMany({
      where: {
        tenant_id: tenantId,
        created_at: { gte: ninetyDaysAgo },
        status: { not: 'VOID' },
      },
      select: {
        created_at: true,
        pax_count: true,
      },
    });

    // Group by date
    const dailyRevenue: Record<string, number> = {};
    const dailyCovers: Record<string, number> = {};

    historicalInvoices.forEach((inv) => {
      const dateStr = inv.created_at.toISOString().split('T')[0];
      dailyRevenue[dateStr] = (dailyRevenue[dateStr] || 0) + inv.total;
    });

    historicalOrders.forEach((ord) => {
      const dateStr = ord.created_at.toISOString().split('T')[0];
      dailyCovers[dateStr] = (dailyCovers[dateStr] || 0) + (ord.pax_count || 1);
    });

    const dates = Object.keys(dailyRevenue).sort();
    const n = dates.length;

    // ── Compute day-of-week weights from historical data ──
    const dowRevenue: number[][] = [[], [], [], [], [], [], []]; // 0=Sun
    const dowCovers: number[][] = [[], [], [], [], [], [], []];

    dates.forEach((dateStr) => {
      const dow = new Date(dateStr).getDay();
      dowRevenue[dow].push(dailyRevenue[dateStr]);
      dowCovers[dow].push(dailyCovers[dateStr] || 0);
    });

    const avgOverallRev =
      n > 0 ? dates.reduce((s, d) => s + dailyRevenue[d], 0) / n : 1;
    const avgOverallCov =
      n > 0 ? dates.reduce((s, d) => s + (dailyCovers[d] || 0), 0) / n : 1;

    const dowWeightRev: number[] = [];
    const dowWeightCov: number[] = [];
    for (let dow = 0; dow < 7; dow++) {
      const avgRev =
        dowRevenue[dow].length > 0
          ? dowRevenue[dow].reduce((s, v) => s + v, 0) / dowRevenue[dow].length
          : avgOverallRev;
      const avgCov =
        dowCovers[dow].length > 0
          ? dowCovers[dow].reduce((s, v) => s + v, 0) / dowCovers[dow].length
          : avgOverallCov;
      dowWeightRev.push(avgOverallRev > 0 ? avgRev / avgOverallRev : 1);
      dowWeightCov.push(avgOverallCov > 0 ? avgCov / avgOverallCov : 1);
    }

    // ── Linear regression + standard error for confidence interval ──
    let sumX = 0,
      sumYRev = 0,
      sumXYRev = 0,
      sumX2 = 0,
      sumYCov = 0,
      sumXYCov = 0;
    const revValues: number[] = [];
    const covValues: number[] = [];

    dates.forEach((dateStr, i) => {
      const x = i;
      const rev = dailyRevenue[dateStr];
      const cov = dailyCovers[dateStr] || 0;
      revValues.push(rev);
      covValues.push(cov);

      sumX += x;
      sumYRev += rev;
      sumXYRev += x * rev;
      sumX2 += x * x;
      sumYCov += cov;
      sumXYCov += x * cov;
    });

    let slopeRev = 0,
      interceptRev = 0;
    let slopeCov = 0,
      interceptCov = 0;

    if (n > 1) {
      const denominator = n * sumX2 - sumX * sumX;
      if (denominator !== 0) {
        slopeRev = (n * sumXYRev - sumX * sumYRev) / denominator;
        interceptRev = (sumYRev - slopeRev * sumX) / n;
        slopeCov = (n * sumXYCov - sumX * sumYCov) / denominator;
        interceptCov = (sumYCov - slopeCov * sumX) / n;
      }
    } else if (n === 1) {
      interceptRev = dailyRevenue[dates[0]];
      interceptCov = dailyCovers[dates[0]];
    }

    // Compute standard error for confidence intervals
    const computeStdErr = (
      values: number[],
      slope: number,
      intercept: number,
    ) => {
      if (values.length < 3) return 0;
      const residuals = values.map((y, x) => y - (slope * x + intercept));
      const sse = residuals.reduce((s, r) => s + r * r, 0);
      const mse = sse / (values.length - 2);
      return Math.sqrt(mse);
    };

    const stdErrRev = computeStdErr(revValues, slopeRev, interceptRev);
    const stdErrCov = computeStdErr(covValues, slopeCov, interceptCov);

    // ── Build forecast ──
    const forecast: any[] = [];
    for (let i = 1; i <= days; i++) {
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + i);
      const dateStr = targetDate.toISOString().split('T')[0];
      const x = n + i - 1;
      const dow = targetDate.getDay();

      let predictedRevenue = slopeRev * x + interceptRev;
      let predictedCovers = slopeCov * x + interceptCov;

      // Apply data-driven day-of-week seasonality
      predictedRevenue *= dowWeightRev[dow] || 1;
      predictedCovers *= dowWeightCov[dow] || 1;

      predictedRevenue = Math.max(0, Math.round(predictedRevenue));
      predictedCovers = Math.max(0, Math.round(predictedCovers));

      // Fallbacks if data is too sparse
      if (predictedRevenue === 0 && n === 0) predictedRevenue = 15000;
      if (predictedCovers === 0 && n === 0) predictedCovers = 40;

      // Confidence interval (±1.96 * stderr for ~95%)
      const ciRev = Math.round(1.96 * stdErrRev);
      const ciCov = Math.round(1.96 * stdErrCov);

      forecast.push({
        date: dateStr,
        dayOfWeek: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dow],
        predictedRevenue,
        predictedRevenueLow: Math.max(0, predictedRevenue - ciRev),
        predictedRevenueHigh: predictedRevenue + ciRev,
        predictedCovers,
        predictedCoversLow: Math.max(0, predictedCovers - ciCov),
        predictedCoversHigh: predictedCovers + ciCov,
        confidenceInterval: `±${ciRev}`,
      });
    }

    return forecast;
  }

  async getFoodCostAlerts(tenantId: string) {
    const items = await this.prisma.item.findMany({
      where: { tenant_id: tenantId, is_available: true },
      include: {
        recipes: {
          include: { ingredient: true },
        },
      },
    });

    const alerts: any[] = [];
    for (const item of items) {
      if (!item.base_price || item.recipes.length === 0) continue;

      let totalCost = 0;
      for (const recipe of item.recipes) {
        totalCost += recipe.quantity_used * recipe.ingredient.cost_per_unit;
      }

      if (totalCost > 0) {
        const costPercentage = (totalCost / item.base_price) * 100;
        if (costPercentage > 35) {
          // Industry standard threshold is ~30-35%
          alerts.push({
            itemId: item.id,
            itemName: item.name,
            cost: totalCost,
            price: item.base_price,
            costPercentage: Math.round(costPercentage * 100) / 100,
            severity: costPercentage > 50 ? 'HIGH' : 'MEDIUM',
          });
        }
      }
    }

    return alerts.sort((a, b) => b.costPercentage - a.costPercentage);
  }

  async getTableTurn(tenantId: string) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dineInOrders = await this.prisma.order.findMany({
      where: {
        tenant_id: tenantId,
        order_type: 'DINE_IN',
        status: { in: ['SETTLED', 'BILLED'] },
        settled_at: { not: null },
        created_at: { gte: thirtyDaysAgo },
      },
      select: {
        created_at: true,
        settled_at: true,
        table_id: true,
        table: { select: { zone: { select: { name: true } } } },
      },
    });

    if (dineInOrders.length === 0)
      return { averageTurnTimeMinutes: 0, zones: [] };

    let totalDurationMs = 0;
    const zoneStats: Record<string, { count: number; duration: number }> = {};

    dineInOrders.forEach((order) => {
      const durationMs =
        order.settled_at!.getTime() - order.created_at.getTime();
      totalDurationMs += durationMs;

      const zoneName = order.table?.zone?.name || 'Unknown Zone';
      if (!zoneStats[zoneName]) zoneStats[zoneName] = { count: 0, duration: 0 };
      zoneStats[zoneName].count++;
      zoneStats[zoneName].duration += durationMs;
    });

    const averageTurnTimeMinutes = Math.round(
      totalDurationMs / dineInOrders.length / 60000,
    );

    const zones = Object.entries(zoneStats).map(([name, stats]) => ({
      zone: name,
      averageTurnTimeMinutes: Math.round(stats.duration / stats.count / 60000),
      orders: stats.count,
    }));

    return { averageTurnTimeMinutes, zones };
  }

  async getStaffPerformance(tenantId: string) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const users = await this.prisma.user.findMany({
      where: { tenant_id: tenantId, is_active: true },
      select: { id: true, name: true, role: true },
    });

    const orders = await this.prisma.order.findMany({
      where: {
        tenant_id: tenantId,
        created_at: { gte: todayStart },
        status: { not: 'VOID' },
      },
      select: {
        waiter_id: true,
        captain_id: true,
        table_id: true,
        pax_count: true,
        invoices: { select: { total: true } },
      },
    });

    const statsMap = new Map<
      string,
      { orders: number; revenue: number; tables: Set<string>; covers: number }
    >();

    for (const order of orders) {
      const revenue = order.invoices.reduce((s, inv) => s + inv.total, 0);
      const covers = order.pax_count || 1;

      for (const userId of [order.waiter_id, order.captain_id].filter(
        Boolean,
      ) as string[]) {
        const existing = statsMap.get(userId) || {
          orders: 0,
          revenue: 0,
          tables: new Set<string>(),
          covers: 0,
        };
        existing.orders += 1;
        existing.revenue += revenue;
        existing.covers += covers;
        if (order.table_id) existing.tables.add(order.table_id);
        statsMap.set(userId, existing);
      }
    }

    const result = users.map((user) => {
      const s = statsMap.get(user.id) || {
        orders: 0,
        revenue: 0,
        tables: new Set<string>(),
        covers: 0,
      };
      return {
        id: user.id,
        name: user.name,
        role: user.role,
        stats: {
          orders: s.orders,
          revenue: s.revenue,
          avg_check: s.orders > 0 ? Math.round(s.revenue / s.orders) : 0,
          tables: s.tables.size,
          covers: s.covers,
          tips: 0,
          orders_target: user.role === 'KITCHEN' ? 50 : 40,
          revenue_target: user.role === 'KITCHEN' ? 0 : 100000,
        },
        rank: 0,
        rank_delta: 0,
        hourly: Array(15).fill(0),
        coach_tips: [],
      };
    });

    result.sort(
      (a, b) =>
        b.stats.revenue - a.stats.revenue || b.stats.orders - a.stats.orders,
    );
    result.forEach((r, i) => {
      r.rank = i + 1;
    });

    return result;
  }

  async getRevenueTrend(
    tenantId: string,
    days: number,
  ): Promise<{ labels: string[]; revenue: number[]; orders: number[] }> {
    const since = new Date();
    since.setDate(since.getDate() - days);
    since.setHours(0, 0, 0, 0);

    const invoices = await this.prisma.invoice.findMany({
      where: {
        tenant_id: tenantId,
        created_at: { gte: since },
      },
      select: { created_at: true, total: true },
      orderBy: { created_at: 'asc' },
    });

    const orders = await this.prisma.order.count({
      where: {
        tenant_id: tenantId,
        created_at: { gte: since },
        status: { not: 'VOID' },
      },
    });

    const dailyRevenue: Record<string, number> = {};
    const dailyOrders: Record<string, number> = {};

    for (let i = 0; i < days; i++) {
      const d = new Date(since);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().split('T')[0];
      dailyRevenue[key] = 0;
      dailyOrders[key] = 0;
    }

    invoices.forEach((inv) => {
      const key = inv.created_at.toISOString().split('T')[0];
      dailyRevenue[key] = (dailyRevenue[key] || 0) + inv.total;
    });

    // Approximate daily orders distribution (backend doesn't track daily order counts easily without grouping)
    const orderDates = await this.prisma.$queryRaw<
      Array<{ date: string; count: bigint }>
    >`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM "Order"
      WHERE tenant_id = ${tenantId}
        AND created_at >= ${since}
        AND status != 'VOID'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    orderDates.forEach((o) => {
      const key = new Date(o.date).toISOString().split('T')[0];
      dailyOrders[key] = Number(o.count);
    });

    const labels = Object.keys(dailyRevenue).map((d) => {
      const date = new Date(d);
      return date.toLocaleDateString('en-IN', { weekday: 'short' });
    });

    return {
      labels,
      revenue: Object.values(dailyRevenue),
      orders: Object.values(dailyOrders),
    };
  }

  async getPaymentMix(tenantId: string, days: number) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    since.setHours(0, 0, 0, 0);

    const payments = await this.prisma.payment.findMany({
      where: {
        invoice: { tenant_id: tenantId, created_at: { gte: since } },
      },
      select: { method: true, amount: true },
    });

    const mix = { cash: 0, upi: 0, card: 0 };
    payments.forEach((p) => {
      const method = p.method.toLowerCase();
      if (method === 'cash') mix.cash += p.amount;
      else if (method === 'upi') mix.upi += p.amount;
      else if (method === 'card') mix.card += p.amount;
      else mix.cash += p.amount; // default to cash for unknown methods
    });

    return mix;
  }
}
