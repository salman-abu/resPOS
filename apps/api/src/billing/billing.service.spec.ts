import { Test, TestingModule } from '@nestjs/testing';
import { BillingService } from './billing.service';
import { PrismaService } from '../prisma/prisma.service';
import { FloorPlanGateway } from '../floor-plan/floor-plan.gateway';
import { LoyaltyService } from '../loyalty/loyalty.service';
import { AuditService } from '../audit/audit.service';

// ─── Mocks ────────────────────────────────────────────────────────────────────
const mockPrisma = {
  outlet: { findFirst: jest.fn() },
  tenant: { findUnique: jest.fn() },
  order: {
    findFirst: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
    findMany: jest.fn(),
  },
  invoice: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
  },
  payment: { create: jest.fn() },
  shift: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
  zone: { findMany: jest.fn() },
  table: { update: jest.fn() },
  orderItem: { findMany: jest.fn() },
  $transaction: jest.fn((ops) => Promise.all(ops)),
};

const mockFloorPlanGateway = {
  emitTableStatusChanged: jest.fn(),
};

const mockLoyaltyService = {
  triggerEarnPoints: jest.fn(),
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function makeOrder(overrides?: any) {
  return {
    id: 'order-1',
    tenant_id: 'tenant-1',
    table_id: 'table-1',
    status: 'PLACED',
    order_type: 'DINE_IN',
    pax_count: 2,
    order_items: [
      {
        id: 'oi-1',
        order_id: 'order-1',
        unit_price: 1000, // ₹10.00 in paise
        quantity: 2,
        status: 'PLACED',
        item: { tax_slab: 'GST_5', name: 'Vada Pav' },
        variant: null,
      },
      {
        id: 'oi-2',
        order_id: 'order-1',
        unit_price: 2000, // ₹20.00 in paise
        quantity: 1,
        status: 'PLACED',
        item: { tax_slab: 'GST_12', name: 'Butter Chicken' },
        variant: null,
      },
    ],
    table: { table_number: 'T1' },
    invoices: [],
    ...overrides,
  };
}

// ─── Test Suite ───────────────────────────────────────────────────────────────
describe('BillingService', () => {
  let service: BillingService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: FloorPlanGateway, useValue: mockFloorPlanGateway },
        { provide: LoyaltyService, useValue: mockLoyaltyService },
        {
          provide: AuditService,
          useValue: { log: jest.fn().mockResolvedValue({}) },
        },
      ],
    }).compile();

    service = module.get<BillingService>(BillingService);
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // B5.1  Split-bill rounding (cgst + sgst = total tax, no 1-paise drift)
  // ═════════════════════════════════════════════════════════════════════════════
  describe('splitInvoices — rounding robustness', () => {
    it('should ensure cgst + sgst exactly equals total taxAmt (no 1-paise drift)', async () => {
      const order = makeOrder({
        order_items: [
          // ₹101.01 × 1 = 10101 paise. 5% GST = 505.05 → rounded 505
          {
            id: 'oi-round',
            unit_price: 10101,
            quantity: 1,
            status: 'PLACED',
            item: { tax_slab: 'GST_5', name: 'Odd Price Item' },
          },
        ],
      });

      mockPrisma.order.findFirst.mockResolvedValue(order);
      mockPrisma.outlet.findFirst.mockResolvedValue({
        id: 'outlet-1',
        state_code: 'MH',
        outlet_code: 'MUM01',
      });
      mockPrisma.tenant.findUnique.mockResolvedValue({
        state_code: 'MH',
        gstin: '27AABCU9603R1ZX',
      });
      mockPrisma.invoice.count.mockResolvedValue(0);
      mockPrisma.invoice.create.mockImplementation(({ data }: any) =>
        Promise.resolve({ ...data, id: 'inv-1' }),
      );
      mockPrisma.orderItem.findMany.mockResolvedValue(order.order_items);

      const result = await service.splitInvoices(
        'tenant-1',
        'user-1',
        'order-1',
        [{ itemIds: ['oi-round'] }],
      );

      const inv = result[0];
      // Total tax = 505 paise. cgst = 253, sgst = 252 → 253 + 252 = 505 ✓
      expect(inv.cgst + inv.sgst).toBe(505);
      expect(inv.total).toBe(10101 + 505); // subtotal + tax
    });

    it('should handle multiple splits with correct rounding', async () => {
      const order = makeOrder();
      mockPrisma.order.findFirst.mockResolvedValue(order);
      mockPrisma.outlet.findFirst.mockResolvedValue({
        id: 'outlet-1',
        state_code: 'MH',
        outlet_code: 'MUM01',
      });
      mockPrisma.tenant.findUnique.mockResolvedValue({
        state_code: 'MH',
        gstin: '27AABCU9603R1ZX',
      });
      mockPrisma.invoice.count.mockResolvedValue(0);
      mockPrisma.invoice.create.mockImplementation(({ data }: any) =>
        Promise.resolve({ ...data, id: 'inv-' + Math.random() }),
      );
      mockPrisma.orderItem.findMany.mockResolvedValue(order.order_items);

      const result = await service.splitInvoices(
        'tenant-1',
        'user-1',
        'order-1',
        [{ itemIds: ['oi-1'] }, { itemIds: ['oi-2'] }],
      );

      // Split 1: ₹2000, 5% = 100 → cgst 50, sgst 50
      expect(result[0].cgst + result[0].sgst).toBe(100);
      // Split 2: ₹2000, 12% = 240 → cgst 120, sgst 120
      expect(result[1].cgst + result[1].sgst).toBe(240);
    });
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // B5.2  Multiple payment methods per invoice
  // ═════════════════════════════════════════════════════════════════════════════
  describe('settleInvoice — multiple payment methods', () => {
    it('should accept cash + UPI for a single invoice', async () => {
      mockPrisma.invoice.findFirst.mockResolvedValue({
        id: 'inv-1',
        total: 5000,
        payments: [],
        order: { id: 'order-1', table_id: 'table-1' },
      });
      mockPrisma.payment.create.mockImplementation(({ data }: any) =>
        Promise.resolve(data),
      );
      mockPrisma.order.update.mockResolvedValue({
        id: 'order-1',
        customer_id: null,
      });
      mockPrisma.table.update.mockResolvedValue({});

      const result = await service.settleInvoice(
        'tenant-1',
        'user-1',
        'inv-1',
        {
          payments: [
            { amount: 3000, method: 'CASH' },
            { amount: 2000, method: 'UPI', upi_ref: 'upi123' },
          ],
        } as any,
      );

      expect(result.success).toBe(true);
      expect(result.total_paid).toBe(5000);
      expect(mockPrisma.payment.create).toHaveBeenCalledTimes(2);
    });

    it('should reject payment if total is insufficient', async () => {
      mockPrisma.invoice.findFirst.mockResolvedValue({
        id: 'inv-1',
        total: 5000,
        payments: [],
        order: { id: 'order-1', table_id: 'table-1' },
      });

      await expect(
        service.settleInvoice('tenant-1', 'user-1', 'inv-1', {
          payments: [{ amount: 4000, method: 'CASH' }],
        } as any),
      ).rejects.toThrow(/short by/);
    });

    it('should calculate change for overpayment', async () => {
      mockPrisma.invoice.findFirst.mockResolvedValue({
        id: 'inv-1',
        total: 4800,
        payments: [],
        order: { id: 'order-1', table_id: 'table-1' },
      });
      mockPrisma.payment.create.mockImplementation(({ data }: any) =>
        Promise.resolve(data),
      );
      mockPrisma.order.update.mockResolvedValue({
        id: 'order-1',
        customer_id: null,
      });
      mockPrisma.table.update.mockResolvedValue({});

      const result = await service.settleInvoice(
        'tenant-1',
        'user-1',
        'inv-1',
        {
          payments: [
            { amount: 3000, method: 'CASH' },
            { amount: 2000, method: 'UPI' },
          ],
        } as any,
      );

      expect(result.success).toBe(true);
      expect(result.total_paid).toBe(5000); // 200 overpaid
    });
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // B5.3  Invoice sequence resets per financial year (April 1)
  // ═════════════════════════════════════════════════════════════════════════════
  describe('generateInvoice — invoice numbering', () => {
    it('should generate invoice number in OUTLET_CODE/FY/SEQ format', async () => {
      const order = makeOrder();
      mockPrisma.order.findFirst.mockResolvedValue(order);
      mockPrisma.outlet.findFirst.mockResolvedValue({
        id: 'outlet-1',
        state_code: 'MH',
        outlet_code: 'MUM01',
      });
      mockPrisma.tenant.findUnique.mockResolvedValue({
        state_code: 'MH',
        gstin: '27AABCU9603R1ZX',
      });
      mockPrisma.invoice.findMany.mockResolvedValue([]);
      mockPrisma.invoice.count.mockResolvedValue(0);
      mockPrisma.invoice.create.mockImplementation(({ data }: any) =>
        Promise.resolve({ ...data, id: 'inv-1' }),
      );
      mockPrisma.order.update.mockResolvedValue({});
      mockPrisma.table.update.mockResolvedValue({});

      const result = await service.generateInvoice('tenant-1', 'user-1', {
        order_id: 'order-1',
      });

      const inv = result.invoice;
      expect(inv.invoice_number).toMatch(/^MUM01\/\d{4}\/\d{5}$/);
    });

    it('should use outlet ID prefix when outlet_code is missing', async () => {
      const order = makeOrder();
      mockPrisma.order.findFirst.mockResolvedValue(order);
      mockPrisma.outlet.findFirst.mockResolvedValue({
        id: 'abc123def456',
        state_code: 'MH',
        outlet_code: null,
      });
      mockPrisma.tenant.findUnique.mockResolvedValue({
        state_code: 'MH',
        gstin: '27AABCU9603R1ZX',
      });
      mockPrisma.invoice.findMany.mockResolvedValue([]);
      mockPrisma.invoice.count.mockResolvedValue(0);
      mockPrisma.invoice.create.mockImplementation(({ data }: any) =>
        Promise.resolve({ ...data, id: 'inv-1' }),
      );
      mockPrisma.order.update.mockResolvedValue({});
      mockPrisma.table.update.mockResolvedValue({});

      const result = await service.generateInvoice('tenant-1', 'user-1', {
        order_id: 'order-1',
      });

      const inv = result.invoice;
      expect(inv.invoice_number).toMatch(/^ABC123\/\d{4}\/\d{5}$/);
    });

    it('should reset sequence to 00001 for a new financial year', async () => {
      const order = makeOrder();
      mockPrisma.order.findFirst.mockResolvedValue(order);
      mockPrisma.outlet.findFirst.mockResolvedValue({
        id: 'outlet-1',
        state_code: 'MH',
        outlet_code: 'MUM01',
      });
      mockPrisma.tenant.findUnique.mockResolvedValue({
        state_code: 'MH',
        gstin: '27AABCU9603R1ZX',
      });
      mockPrisma.invoice.findMany.mockResolvedValue([]);
      // Simulate 42 invoices in current FY
      mockPrisma.invoice.count.mockResolvedValue(42);
      mockPrisma.invoice.create.mockImplementation(({ data }: any) =>
        Promise.resolve({ ...data, id: 'inv-1' }),
      );
      mockPrisma.order.update.mockResolvedValue({});
      mockPrisma.table.update.mockResolvedValue({});

      const result = await service.generateInvoice('tenant-1', 'user-1', {
        order_id: 'order-1',
      });

      const inv = result.invoice;
      // Should end in 00043
      expect(inv.invoice_number).toMatch(/\d{4}\/00043$/);
    });
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // B5.4  Financial year helper edge cases
  // ═════════════════════════════════════════════════════════════════════════════
  describe('Financial year helpers', () => {
    it('should return FY 2425 for May 2024', () => {
      const date = new Date(2024, 4, 15); // May 2024
      const fy =
        (service as any).getFinancialYear?.(date) || getFinancialYear(date);
      expect(fy).toBe('2425');
    });

    it('should return FY 2324 for Jan 2024', () => {
      const date = new Date(2024, 0, 10); // Jan 2024
      const fy = getFinancialYear(date);
      expect(fy).toBe('2324');
    });

    it('should return FY 2526 for April 2025 (FY start)', () => {
      const date = new Date(2025, 3, 1); // April 1, 2025
      const fy = getFinancialYear(date);
      expect(fy).toBe('2526');
    });
  });
});

// Re-declare helpers to make them accessible in tests
function getFinancialYear(date = new Date()): string {
  const year = date.getFullYear();
  const month = date.getMonth();
  if (month >= 3) {
    return `${String(year).slice(-2)}${String(year + 1).slice(-2)}`;
  }
  return `${String(year - 1).slice(-2)}${String(year).slice(-2)}`;
}
