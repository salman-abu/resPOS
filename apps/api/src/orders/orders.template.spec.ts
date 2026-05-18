import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { KdsGateway } from '../kds/kds.gateway';
import { FloorPlanGateway } from '../floor-plan/floor-plan.gateway';
import { InventoryService } from '../inventory/inventory.service';
import { AuditService } from '../audit/audit.service';
import { NotFoundException } from '@nestjs/common';

describe('OrdersService — Load Template (MOD-07)', () => {
  let service: OrdersService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const prismaMock = {
      customerOrderHistory: {
        findFirst: jest.fn(),
      },
      item: {
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: KdsGateway, useValue: {} },
        { provide: FloorPlanGateway, useValue: {} },
        { provide: InventoryService, useValue: {} },
        { provide: AuditService, useValue: { log: jest.fn() } },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should load a valid order template', async () => {
    const mockHistory = {
      id: 'hist-1',
      tenant_id: 'tenant-1',
      order_snapshot: {
        items: [
          {
            item_id: 'item-1',
            quantity: 2,
            unit_price: 15000,
            notes: 'Extra spicy',
            variant_id: 'var-1',
            addons: [{ id: 'addon-1', name: 'Extra Cheese', price: 2000 }],
          },
        ],
        total: 34000,
      },
    };

    const mockItem = {
      id: 'item-1',
      name: 'Margherita Pizza',
      base_price: 15000,
      is_available: true,
      variants: [{ id: 'var-1', name: 'Large', additional_price: 0 }],
      addons: [
        {
          id: 'addon-1',
          name: 'Extra Cheese',
          price: 2000,
          is_available: true,
        },
      ],
      modifier_groups: [],
    };

    (prisma.customerOrderHistory.findFirst as jest.Mock).mockResolvedValue(
      mockHistory,
    );
    (prisma.item.findUnique as jest.Mock).mockResolvedValue(mockItem);

    const result = await service.loadTemplate('tenant-1', 'hist-1');

    expect(result.items).toHaveLength(1);
    expect(result.items[0].name).toBe('Margherita Pizza');
    expect(result.skipped).toHaveLength(0);
  });

  it('should skip unavailable items', async () => {
    const mockHistory = {
      id: 'hist-1',
      tenant_id: 'tenant-1',
      order_snapshot: {
        items: [
          { item_id: 'item-gone', quantity: 1, name: 'Old Item' },
          { item_id: 'item-2', quantity: 1 },
        ],
        total: 20000,
      },
    };

    (prisma.customerOrderHistory.findFirst as jest.Mock).mockResolvedValue(
      mockHistory,
    );
    (prisma.item.findUnique as jest.Mock).mockImplementation(({ where }) => {
      if (where.id === 'item-gone') return null;
      return {
        id: 'item-2',
        name: 'Available Item',
        base_price: 10000,
        is_available: true,
        variants: [],
        addons: [],
        modifier_groups: [],
      };
    });

    const result = await service.loadTemplate('tenant-1', 'hist-1');

    expect(result.items).toHaveLength(1);
    expect(result.skipped).toContain('Old Item');
  });

  it('should throw NotFoundException for missing history', async () => {
    (prisma.customerOrderHistory.findFirst as jest.Mock).mockResolvedValue(
      null,
    );

    await expect(service.loadTemplate('tenant-1', 'missing')).rejects.toThrow(
      NotFoundException,
    );
  });
});
