import { Test, TestingModule } from '@nestjs/testing';
import { GstService } from './gst.service';
import { PrismaService } from '../prisma/prisma.service';

describe('GstService', () => {
  let service: GstService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const prismaMock = {
      invoice: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
      },
      tenant: {
        findUnique: jest.fn(),
      },
      eInvoice: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [GstService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();

    service = module.get<GstService>(GstService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('getGstr1', () => {
    it('should generate GSTR-1 with correct intra-state tax breakdown', async () => {
      const mockInvoices = [
        {
          id: 'inv-1',
          subtotal: 20000,
          cgst: 500,
          sgst: 500,
          igst: 0,
          printed_at: new Date(),
        },
        {
          id: 'inv-2',
          subtotal: 50000,
          cgst: 2500,
          sgst: 2500,
          igst: 0,
          printed_at: new Date(),
        },
      ];

      (prisma.invoice.findMany as jest.Mock).mockResolvedValue(mockInvoices);
      (prisma.tenant.findUnique as jest.Mock).mockResolvedValue({
        gstin: '27AAPFU0939F1ZV',
        state_code: '27',
      });

      const result = await service.getGstr1('tenant-1', '2026-05');

      expect(result.gstin).toBe('27AAPFU0939F1ZV');
      expect(result.fp).toBe('202605');
      expect(result.b2c).toHaveLength(1);
      expect(result.b2c[0].sply_ty).toBe('INTRA');
      expect(result.b2c[0].txval).toBe(700); // (20000 + 50000) / 100 = ₹700
      expect(result.b2c[0].camt).toBe(30); // (500 + 2500) / 100 = ₹30
      expect(result.b2c[0].samt).toBe(30);
      expect(result.b2c[0].iamt).toBe(0);
    });

    it('should handle empty invoice list', async () => {
      (prisma.invoice.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.tenant.findUnique as jest.Mock).mockResolvedValue({
        gstin: '27AAPFU0939F1ZV',
        state_code: '27',
      });

      const result = await service.getGstr1('tenant-1', '2026-04');

      expect(result.b2c[0].txval).toBe(0);
      expect(result.b2c[0].camt).toBe(0);
      expect(result.b2c[0].samt).toBe(0);
    });

    it('should return empty gstin when tenant has no GSTIN', async () => {
      (prisma.invoice.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.tenant.findUnique as jest.Mock).mockResolvedValue({
        gstin: null,
        state_code: '27',
      });

      const result = await service.getGstr1('tenant-1', '2026-05');
      expect(result.gstin).toBe('');
    });
  });

  describe('getGstr3b', () => {
    it('should aggregate CGST+SGST correctly for intra-state invoices', async () => {
      const mockInvoices = [
        { id: 'inv-1', subtotal: 20000, cgst: 500, sgst: 500, igst: 0 },
        { id: 'inv-2', subtotal: 50000, cgst: 2500, sgst: 2500, igst: 0 },
        { id: 'inv-3', subtotal: 100000, cgst: 9000, sgst: 9000, igst: 0 },
      ];

      (prisma.invoice.findMany as jest.Mock).mockResolvedValue(mockInvoices);

      const result = await service.getGstr3b('tenant-1', '2026-05');

      // totalTaxable = 170000 → ₹1,700
      expect(result.outward_supplies.taxable_value).toBe(1700);
      // totalTax = 500+500+2500+2500+9000+9000 = 24000 → central_tax = 120, state_tax = 120
      expect(result.outward_supplies.central_tax).toBe(120);
      expect(result.outward_supplies.state_tax).toBe(120);
    });

    it('should aggregate IGST correctly for inter-state invoices', async () => {
      const mockInvoices = [
        { id: 'inv-1', subtotal: 100000, cgst: 0, sgst: 0, igst: 18000 },
        { id: 'inv-2', subtotal: 50000, cgst: 0, sgst: 0, igst: 2500 },
      ];

      (prisma.invoice.findMany as jest.Mock).mockResolvedValue(mockInvoices);

      const result = await service.getGstr3b('tenant-1', '2026-05');

      // totalTaxable = 150000 → ₹1,500
      expect(result.outward_supplies.taxable_value).toBe(1500);
      // totalTax = 20500 → ₹205 → central_tax = 102.5, state_tax = 102.5
      expect(result.outward_supplies.central_tax).toBe(102.5);
      expect(result.outward_supplies.state_tax).toBe(102.5);
    });

    it('should handle mixed intra-state and inter-state invoices', async () => {
      const mockInvoices = [
        { id: 'inv-1', subtotal: 20000, cgst: 500, sgst: 500, igst: 0 },
        { id: 'inv-2', subtotal: 100000, cgst: 0, sgst: 0, igst: 18000 },
      ];

      (prisma.invoice.findMany as jest.Mock).mockResolvedValue(mockInvoices);

      const result = await service.getGstr3b('tenant-1', '2026-05');

      expect(result.outward_supplies.taxable_value).toBe(1200); // 120000 / 100
    });
  });

  describe('generateEInvoice', () => {
    it('should generate a mock e-invoice with IRN', async () => {
      const mockInvoice = {
        id: 'inv-1',
        invoice_number: 'INV001',
      };

      (prisma.invoice.findFirst as jest.Mock).mockResolvedValue(mockInvoice);
      (prisma.eInvoice.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.eInvoice.upsert as jest.Mock).mockImplementation(
        async ({ create }) => ({ ...create, id: 'einv-1' }),
      );

      const result = await service.generateEInvoice('tenant-1', 'inv-1');

      expect(result.irn).toBeDefined();
      expect(result.irn!.length).toBe(64); // 2 UUIDs concatenated, hyphens removed
      expect(result.qr_code).toContain('INV001');
      expect(result.status).toBe('GENERATED');
    });

    it('should return existing e-invoice if already generated', async () => {
      const existing = {
        id: 'einv-1',
        invoice_id: 'inv-1',
        irn: 'existing-irn',
        status: 'GENERATED',
      };

      (prisma.invoice.findFirst as jest.Mock).mockResolvedValue({
        id: 'inv-1',
      });
      (prisma.eInvoice.findUnique as jest.Mock).mockResolvedValue(existing);

      const result = await service.generateEInvoice('tenant-1', 'inv-1');

      expect(result.irn).toBe('existing-irn');
    });

    it('should throw NotFoundException if invoice does not exist', async () => {
      (prisma.invoice.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        service.generateEInvoice('tenant-1', 'nonexistent'),
      ).rejects.toThrow('Invoice not found');
    });
  });
});
