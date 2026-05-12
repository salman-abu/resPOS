import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  GenerateInvoiceDto,
  SettleInvoiceDto,
  OpenShiftDto,
  CloseShiftDto,
} from './dto/billing.dto';
import { TaxSlab } from '@prisma/client';

// ─── Tax Rate Map ────────────────────────────────────────────────────────────
const TAX_RATES: Record<TaxSlab, number> = {
  EXEMPT: 0,
  GST_5: 5,
  GST_12: 12,
  GST_18: 18,
  GST_28: 28,
};

@Injectable()
export class BillingService {
  constructor(private prisma: PrismaService) {}

  // ─── Private: Outlet Helper ───────────────────────────────────────────────
  private async getDefaultOutlet(tenantId: string) {
    const outlet = await this.prisma.outlet.findFirst({
      where: { tenant_id: tenantId },
      select: { id: true, state_code: true },
    });
    if (!outlet) throw new BadRequestException('No outlet configured.');
    return outlet;
  }

  // ─── Generate Invoice ─────────────────────────────────────────────────────
  async generateInvoice(tenantId: string, dto: GenerateInvoiceDto) {
    const order = await this.prisma.order.findFirst({
      where: { id: dto.order_id, tenant_id: tenantId },
      include: {
        order_items: {
          include: {
            item: { select: { tax_slab: true, name: true } },
            variant: { select: { name: true } },
          },
        },
        invoices: { select: { id: true } },
        table: { select: { table_number: true } },
      },
    });

    if (!order) throw new NotFoundException('Order not found.');
    if (order.status === 'VOID')
      throw new BadRequestException('Cannot bill a voided order.');
    if (order.invoices.length > 0) {
      throw new ConflictException('Invoice already generated for this order.');
    }

    const outlet = await this.getDefaultOutlet(tenantId);
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { state_code: true, gstin: true },
    });

    // ── GST Calculation ──
    let subtotal = 0;
    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    // Inter-state if outlet state != tenant state (simplified)
    const isInterState =
      outlet.state_code &&
      tenant?.state_code &&
      outlet.state_code !== tenant.state_code;

    for (const oi of order.order_items) {
      if (oi.status === 'VOID') continue;
      const lineBase = oi.unit_price * oi.quantity;
      subtotal += lineBase;
      const rate = TAX_RATES[oi.item.tax_slab] ?? 0;
      const taxAmt = Math.round(lineBase * (rate / 100));
      if (isInterState) {
        igst += taxAmt;
      } else {
        cgst += Math.round(taxAmt / 2);
        sgst += Math.round(taxAmt / 2);
      }
    }

    // ── Discount ──
    let discount = dto.discount ?? 0;
    if (dto.discount_type === 'PERCENT' && discount > 0) {
      discount = Math.round(subtotal * (discount / 100));
    }

    const service_charge = dto.service_charge ?? 0;
    const total = subtotal + cgst + sgst + igst + service_charge - discount;

    // ── Invoice Number ──
    const invCount = await this.prisma.invoice.count();
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(invCount + 1).padStart(5, '0')}`;

    const invoice = await this.prisma.invoice.create({
      data: {
        order_id: order.id,
        invoice_number: invoiceNumber,
        subtotal,
        cgst,
        sgst,
        igst,
        service_charge,
        discount,
        discount_type: dto.discount_type,
        discount_approved_by: dto.discount_approved_by,
        total,
        printed_at: new Date(),
      },
      include: { payments: true },
    });

    // Update order status to BILLED
    await this.prisma.order.update({
      where: { id: order.id },
      data: { status: 'BILLED' },
    });

    // Update table status to BILLED
    if (order.table_id) {
      await this.prisma.table.update({
        where: { id: order.table_id },
        data: { status: 'BILLED' },
      });
    }

    return {
      invoice,
      order: {
        id: order.id,
        table_number: order.table?.table_number,
        order_type: order.order_type,
        pax_count: order.pax_count,
        items: order.order_items
          .filter((oi) => oi.status !== 'VOID')
          .map((oi) => ({
            name: oi.item.name,
            variant: oi.variant?.name,
            quantity: oi.quantity,
            unit_price: oi.unit_price,
            line_total: oi.unit_price * oi.quantity,
            tax_slab: oi.item.tax_slab,
          })),
      },
    };
  }

  // ─── Get Invoice ──────────────────────────────────────────────────────────
  async getInvoice(tenantId: string, invoiceId: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, order: { tenant_id: tenantId } },
      include: {
        payments: true,
        order: {
          include: {
            order_items: {
              where: { status: { not: 'VOID' } },
              include: {
                item: { select: { name: true, tax_slab: true } },
                variant: { select: { name: true } },
              },
            },
            table: { select: { table_number: true } },
          },
        },
      },
    });
    if (!invoice) throw new NotFoundException('Invoice not found.');
    return invoice;
  }

  // ─── Settle Invoice (Split Payment) ──────────────────────────────────────
  async settleInvoice(
    tenantId: string,
    invoiceId: string,
    dto: SettleInvoiceDto,
  ) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, order: { tenant_id: tenantId } },
      include: {
        payments: true,
        order: { select: { table_id: true, id: true } },
      },
    });
    if (!invoice) throw new NotFoundException('Invoice not found.');

    const alreadyPaid = invoice.payments
      .filter((p) => p.status === 'SUCCESS')
      .reduce((sum, p) => sum + p.amount, 0);

    const newTotal = dto.payments.reduce((s, p) => s + p.amount, 0);

    if (alreadyPaid + newTotal < invoice.total) {
      throw new BadRequestException(
        `Payment short by ₹${((invoice.total - alreadyPaid - newTotal) / 100).toFixed(2)}`,
      );
    }

    // Record all payments
    await this.prisma.$transaction(
      dto.payments.map((p) =>
        this.prisma.payment.create({
          data: {
            invoice_id: invoiceId,
            amount: p.amount,
            method: p.method,
            upi_ref: p.upi_ref,
            transaction_id: p.transaction_id,
            status: 'SUCCESS',
          },
        }),
      ),
    );

    // Settle order + free table
    await this.prisma.order.update({
      where: { id: invoice.order.id },
      data: { status: 'SETTLED', settled_at: new Date() },
    });

    if (invoice.order.table_id) {
      await this.prisma.table.update({
        where: { id: invoice.order.table_id },
        data: { status: 'DIRTY', current_order_id: null },
      });
    }

    return {
      success: true,
      invoice_id: invoiceId,
      total_paid: alreadyPaid + newTotal,
    };
  }

  // ─── Open Shift ───────────────────────────────────────────────────────────
  async openShift(tenantId: string, cashierId: string, dto: OpenShiftDto) {
    const outlet = await this.getDefaultOutlet(tenantId);

    const existingOpen = await this.prisma.shift.findFirst({
      where: { tenant_id: tenantId, status: 'OPEN' },
    });
    if (existingOpen) throw new ConflictException('A shift is already open.');

    return this.prisma.shift.create({
      data: {
        tenant_id: tenantId,
        outlet_id: outlet.id,
        cashier_id: cashierId,
        opening_float: dto.opening_float,
        status: 'OPEN',
      },
    });
  }

  // ─── Close Shift / Z-Report ───────────────────────────────────────────────
  async closeShift(tenantId: string, dto: CloseShiftDto) {
    const shift = await this.prisma.shift.findFirst({
      where: { tenant_id: tenantId, status: 'OPEN' },
    });
    if (!shift) throw new NotFoundException('No open shift found.');

    // Aggregate all settled orders in this shift window
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
          select: { unit_price: true, quantity: true },
        },
      },
    });

    // Build Z-Report data
    const paymentSummary: Record<string, number> = {};
    let grossSales = 0;
    let totalDiscount = 0;
    let totalTax = 0;
    const totalOrders = orders.length;
    const voidCount = 0;

    for (const order of orders) {
      for (const inv of order.invoices) {
        grossSales += inv.subtotal;
        totalDiscount += inv.discount;
        totalTax += inv.cgst + inv.sgst + inv.igst;
        for (const pmt of inv.payments) {
          if (pmt.status === 'SUCCESS') {
            paymentSummary[pmt.method] =
              (paymentSummary[pmt.method] ?? 0) + pmt.amount;
          }
        }
      }
    }

    const voidOrders = await this.prisma.order.count({
      where: {
        tenant_id: tenantId,
        status: 'VOID',
        created_at: { gte: shift.opened_at },
      },
    });

    const zReportData = {
      shift_id: shift.id,
      opened_at: shift.opened_at,
      closed_at: new Date(),
      cashier_id: shift.cashier_id,
      opening_float: shift.opening_float,
      closing_float: dto.closing_float,
      petty_cash: dto.petty_cash ?? 0,
      gross_sales: grossSales,
      total_discount: totalDiscount,
      total_tax: totalTax,
      net_sales: grossSales - totalDiscount,
      total_orders: totalOrders,
      void_orders: voidOrders,
      payment_summary: paymentSummary,
      cash_expected:
        (paymentSummary['CASH'] ?? 0) +
        shift.opening_float -
        (dto.petty_cash ?? 0),
      cash_variance:
        dto.closing_float -
        ((paymentSummary['CASH'] ?? 0) +
          shift.opening_float -
          (dto.petty_cash ?? 0)),
    };

    const closed = await this.prisma.shift.update({
      where: { id: shift.id },
      data: {
        status: 'CLOSED',
        closed_at: new Date(),
        closing_float: dto.closing_float,
        petty_cash: dto.petty_cash,
        z_report_data: zReportData,
      },
    });

    return { shift: closed, z_report: zReportData };
  }

  // ─── Get Z-Report for Current/Last Shift ─────────────────────────────────
  async getZReport(tenantId: string) {
    const shift = await this.prisma.shift.findFirst({
      where: { tenant_id: tenantId },
      orderBy: { opened_at: 'desc' },
    });
    if (!shift) throw new NotFoundException('No shift found.');
    return shift;
  }

  // ─── Get Tables (Floor Plan) ──────────────────────────────────────────────
  async getTables(tenantId: string) {
    return this.prisma.zone.findMany({
      where: { tenant_id: tenantId },
      include: {
        tables: {
          orderBy: { table_number: 'asc' },
          include: {
            orders: {
              where: { status: { notIn: ['SETTLED', 'VOID'] } },
              select: {
                id: true,
                status: true,
                created_at: true,
                pax_count: true,
              },
              take: 1,
              orderBy: { created_at: 'desc' },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }
}
