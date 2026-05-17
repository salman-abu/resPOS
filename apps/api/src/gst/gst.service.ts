import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { randomUUID } from 'crypto';

@Injectable()
export class GstService {
  constructor(private prisma: PrismaService) {}

  async getGstr1(tenantId: string, period: string) {
    // period format: YYYY-MM
    const [year, month] = period.split('-');
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);

    const invoices = await this.prisma.invoice.findMany({
      where: {
        order: { tenant_id: tenantId },
        printed_at: { gte: startDate, lte: endDate },
      },
    });

    let totalB2cTaxable = 0;
    let totalCgst = 0;
    let totalSgst = 0;

    invoices.forEach((inv) => {
      totalB2cTaxable += inv.subtotal;
      totalCgst += inv.cgst;
      totalSgst += inv.sgst;
    });

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { gstin: true, state_code: true },
    });

    const gstr1Json = {
      gstin: tenant?.gstin ?? '',
      fp: period.replace('-', ''),
      b2c: [
        {
          sply_ty: 'INTRA',
          rt: 5,
          typ: 'OE',
          pos: '27',
          txval: totalB2cTaxable / 100,
          iamt: 0,
          camt: totalCgst / 100,
          samt: totalSgst / 100,
        },
      ],
      b2b: [],
      hsn: { data: [] },
    };

    return gstr1Json;
  }

  async getGstr3b(tenantId: string, period: string) {
    // Basic aggregation
    const [year, month] = period.split('-');
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);

    const invoices = await this.prisma.invoice.findMany({
      where: {
        order: { tenant_id: tenantId },
        printed_at: { gte: startDate, lte: endDate },
      },
    });

    let totalTaxable = 0;
    let totalTax = 0;

    invoices.forEach((inv) => {
      totalTaxable += inv.subtotal;
      totalTax += inv.cgst + inv.sgst + inv.igst;
    });

    return {
      period,
      outward_supplies: {
        taxable_value: totalTaxable / 100,
        integrated_tax: 0,
        central_tax: totalTax / 200,
        state_tax: totalTax / 200,
        cess: 0,
      },
      itc_available: {
        integrated_tax: 0,
        central_tax: 0,
        state_tax: 0,
      },
    };
  }

  async getTcsReconciliation(tenantId: string, period: string) {
    return {
      period,
      status: 'RECONCILED',
      discrepancies: 0,
      aggregator_sales: 0,
      tcs_deducted: 0,
      system_sales: 0,
    };
  }

  async getHsnSummary(tenantId: string, period: string) {
    return {
      period,
      data: [
        {
          hsn: '9963',
          desc: 'Accommodation, food and beverage services',
          taxable_value: 0,
          cgst: 0,
          sgst: 0,
        },
      ],
    };
  }
}
