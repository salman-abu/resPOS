import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';

@Injectable()
export class ShiftReportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly whatsappService: WhatsappService,
  ) {}

  async generateAndSave(tenantId: string, shiftId: string) {
    const shift = await this.prisma.shift.findFirst({
      where: { id: shiftId, tenant_id: tenantId },
    });
    if (!shift) throw new NotFoundException('Shift not found');

    const orders = await this.prisma.order.findMany({
      where: {
        tenant_id: tenantId,
        status: 'SETTLED',
        settled_at: { gte: shift.opened_at },
      },
      include: {
        invoices: { include: { payments: true } },
        order_items: {
          where: { status: { not: 'VOID' } },
          include: { item: { select: { name: true } } },
        },
      },
    });

    // Payment breakdown
    let cashPaise = 0;
    let upiPaise = 0;
    let cardPaise = 0;
    for (const order of orders) {
      for (const inv of order.invoices) {
        for (const pmt of inv.payments) {
          if (pmt.status === 'SUCCESS') {
            if (pmt.method === 'CASH') cashPaise += pmt.amount;
            else if (pmt.method === 'UPI') upiPaise += pmt.amount;
            else if (pmt.method === 'CARD') cardPaise += pmt.amount;
          }
        }
      }
    }

    // Void count
    const voidCount = await this.prisma.order.count({
      where: {
        tenant_id: tenantId,
        status: 'VOID',
        created_at: { gte: shift.opened_at },
      },
    });

    // Top items
    const itemMap: Record<
      string,
      { name: string; count: number; revenuePaise: number }
    > = {};
    for (const order of orders) {
      for (const oi of order.order_items) {
        const key = oi.item_id;
        if (!itemMap[key]) {
          itemMap[key] = {
            name: oi.item.name,
            count: 0,
            revenuePaise: 0,
          };
        }
        itemMap[key].count += oi.quantity;
        itemMap[key].revenuePaise += Math.round(oi.unit_price * oi.quantity);
      }
    }
    const topItems = Object.values(itemMap)
      .sort((a, b) => b.revenuePaise - a.revenuePaise)
      .slice(0, 3);

    const totalSalesPaise = orders.reduce((sum, o) => {
      return sum + o.invoices.reduce((is, inv) => is + inv.total, 0);
    }, 0);

    const report = await this.prisma.shiftReport.upsert({
      where: { shift_session_id: shiftId },
      update: {
        total_sales_paise: totalSalesPaise,
        total_orders: orders.length,
        void_count: voidCount,
        cash_paise: cashPaise,
        upi_paise: upiPaise,
        card_paise: cardPaise,
        opening_float_paise: shift.opening_float,
        closing_float_paise: shift.closing_float ?? 0,
        top_items: topItems,
      },
      create: {
        tenant_id: tenantId,
        shift_session_id: shiftId,
        total_sales_paise: totalSalesPaise,
        total_orders: orders.length,
        void_count: voidCount,
        cash_paise: cashPaise,
        upi_paise: upiPaise,
        card_paise: cardPaise,
        opening_float_paise: shift.opening_float,
        closing_float_paise: shift.closing_float ?? 0,
        top_items: topItems,
      },
    });

    // Deliver Shift Report to Tenant Owners/Managers via WhatsApp
    try {
      const owners = await this.prisma.user.findMany({
        where: {
          tenant_id: tenantId,
          role: { in: ['OWNER', 'MANAGER'] },
          is_active: true,
        },
        select: { mobile: true },
      });

      if (owners.length > 0) {
        const msg = `📊 *resPOS Shift Handover Report*
-----------------------------------
📍 *Tenant ID:* ${tenantId}
🕒 *Generated:* ${new Date().toLocaleDateString('en-IN')} ${new Date().toLocaleTimeString('en-IN')}
🛒 *Total Orders:* ${orders.length}
💰 *Total Sales:* ₹${(totalSalesPaise / 100).toFixed(2)}
💵 *Cash:* ₹${(cashPaise / 100).toFixed(2)}
💳 *Card:* ₹${(cardPaise / 100).toFixed(2)}
📱 *UPI:* ₹${(upiPaise / 100).toFixed(2)}
🚫 *Voids:* ${voidCount}
🛍️ *Top Items:*
${topItems
  .map(
    (item: any, idx: number) => `  ${idx + 1}. ${item.name} (x${item.count})`,
  )
  .join('\n')}
-----------------------------------`;

        for (const owner of owners) {
          if (owner.mobile) {
            const success = await this.whatsappService.sendTextMessage(
              owner.mobile,
              msg,
            );
            if (success) {
              await this.prisma.shiftReport.update({
                where: { id: report.id },
                data: { whatsapp_sent_at: new Date() },
              });
            }
          }
        }
      }
    } catch (err) {
      console.error('Failed to send shift report via WhatsApp:', err);
    }

    return report;
  }

  async listReports(tenantId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.shiftReport.findMany({
        where: { tenant_id: tenantId },
        orderBy: { generated_at: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.shiftReport.count({ where: { tenant_id: tenantId } }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getReport(tenantId: string, reportId: string) {
    const report = await this.prisma.shiftReport.findFirst({
      where: { id: reportId, tenant_id: tenantId },
    });
    if (!report) throw new NotFoundException('Report not found');
    return report;
  }
}
