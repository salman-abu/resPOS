import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentStatus } from '@prisma/client';

@Injectable()
export class FinanceService {
  constructor(private readonly prisma: PrismaService) {}

  async getPnl(tenantId: string, period: string) {
    const [year, month] = period.split('-');
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);

    // 1. Revenue
    const invoices = await this.prisma.invoice.findMany({
      where: {
        order: { tenant_id: tenantId },
        printed_at: { gte: startDate, lte: endDate },
      },
    });
    const revenue = invoices.reduce((acc, inv) => acc + inv.total, 0);

    // 2. COGS (mocked computation based on recipe sum)
    // Normally we fetch all order items in that period and sum recipe cost
    // For MVP, we will mock COGS as 32% of Revenue
    const cogs = Math.floor(revenue * 0.32);

    const grossProfit = revenue - cogs;

    // 3. Labor
    // In real app, calculate hours from StaffSchedule or Attendance
    const labor = Math.floor(revenue * 0.18); // MVP Mock 18%

    // 4. Overhead (Rent, utilities - Mocked)
    const overhead = Math.floor(revenue * 0.2); // MVP Mock 20%

    const netProfit = grossProfit - labor - overhead;

    return {
      period,
      revenue: revenue / 100,
      cogs: cogs / 100,
      grossProfit: grossProfit / 100,
      labor: labor / 100,
      overhead: overhead / 100,
      netProfit: netProfit / 100,
      margins: {
        gross: 68,
        net: 30,
      },
    };
  }

  async getCashflow(tenantId: string, period: string) {
    // Return daily cash in vs cash out
    return {
      period,
      chartData: [
        { date: '01', cashIn: 12000, cashOut: 5000 },
        { date: '05', cashIn: 14000, cashOut: 2000 },
        { date: '10', cashIn: 18000, cashOut: 25000 }, // Supplier payment day
        { date: '15', cashIn: 15500, cashOut: 4000 },
        { date: '20', cashIn: 19000, cashOut: 3000 },
        { date: '25', cashIn: 22000, cashOut: 12000 }, // Payroll
        { date: '30', cashIn: 24000, cashOut: 2000 },
      ],
    };
  }

  async getVendorAging(tenantId: string) {
    const today = new Date();

    // Group POs by age
    const purchaseOrders = await this.prisma.purchaseOrder.findMany({
      where: {
        tenant_id: tenantId,
        is_paid: false,
      },
      include: { vendor: true },
    });

    const aging = {
      '0-30': 0,
      '30-60': 0,
      '60+': 0,
      vendors: [] as any[],
    };

    purchaseOrders.forEach((po) => {
      const daysOld = Math.floor(
        (today.getTime() - po.created_at.getTime()) / (1000 * 3600 * 24),
      );
      let bucket = '0-30';
      if (daysOld > 60) bucket = '60+';
      else if (daysOld > 30) bucket = '30-60';

      aging[bucket] += po.total;

      aging.vendors.push({
        poId: po.id,
        vendorName: po.vendor.name,
        amount: po.total / 100,
        daysOld,
        bucket,
      });
    });

    // Mock data if empty
    if (aging.vendors.length === 0) {
      aging['30-60'] = 4500000; // 45k
      aging['60+'] = 1200000;
      aging.vendors.push(
        {
          poId: 'mock-1',
          vendorName: 'Metro Cash & Carry',
          amount: 45000,
          daysOld: 45,
          bucket: '30-60',
        },
        {
          poId: 'mock-2',
          vendorName: 'Local Dairy Co.',
          amount: 12000,
          daysOld: 65,
          bucket: '60+',
        },
      );
    } else {
      aging['0-30'] /= 100;
      aging['30-60'] /= 100;
      aging['60+'] /= 100;
    }

    return aging;
  }
}
