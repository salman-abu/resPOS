import { Test, TestingModule } from '@nestjs/testing';
import { LoyaltyService } from './loyalty.service';
import { PrismaService } from '../prisma/prisma.service';
import { getQueueToken } from '@nestjs/bullmq';

describe('LoyaltyEngine (LoyaltyService)', () => {
  let service: LoyaltyService;
  let prisma: PrismaService;
  let queueMock: any;

  beforeEach(async () => {
    queueMock = {
      add: jest.fn().mockResolvedValue({ id: 'job-1' }),
    };

    const prismaMock = {
      customer: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      loyaltyConfig: {
        findUnique: jest.fn(),
      },
      loyaltyTransaction: {
        create: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoyaltyService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: getQueueToken('loyalty'), useValue: queueMock },
      ],
    }).compile();

    service = module.get<LoyaltyService>(LoyaltyService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should queue loyalty processing event asynchronously', async () => {
    const res = await service.triggerEarnPoints('tenant-1', {
      customerId: 'cust-1',
      orderId: 'order-1',
      amountSpent: 50000, // ₹500
    });

    expect(queueMock.add).toHaveBeenCalledWith('earn', {
      tenantId: 'tenant-1',
      customerId: 'cust-1',
      orderId: 'order-1',
      amountSpent: 50000,
    });

    expect(res.success).toBe(true);
  });

  it('should compute exact points based on config conversion rate (processPoints)', async () => {
    // Mock Config (e.g. ₹100 = 5 points -> conversion rate 0.05)
    (prisma.loyaltyConfig.findUnique as jest.Mock).mockResolvedValue({
      points_per_rupee: 0.05,
    });

    const txMock = {
      customer: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'cust-1',
          total_spent: 10000,
          loyalty_points: 0,
          tier: 'BRONZE',
        }),
        update: jest.fn(),
      },
      loyaltyTransaction: {
        create: jest.fn(),
      },
    };
    (prisma.$transaction as jest.Mock).mockImplementation(async (cb) => {
      await cb(txMock);
    });

    // Process job directly
    await service.processEarnLoyalty({
      tenantId: 'tenant-1',
      customerId: 'cust-1',
      orderId: 'order-1',
      amountSpent: 50000, // ₹500
    });

    // Expect 25 points earned (500 * 0.05 = 25)
    expect(txMock.loyaltyTransaction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: 'EARN',
          points: 25,
        }),
      }),
    );

    // Expect customer updated with points and spend
    expect(txMock.customer.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'cust-1' },
        data: expect.objectContaining({
          loyalty_points: 25,
          total_spent: 60000, // 10000 + 50000
        }),
      }),
    );
  });
});
