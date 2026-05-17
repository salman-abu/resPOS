import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { KdsGateway } from '../kds/kds.gateway';
import { FloorPlanGateway } from '../floor-plan/floor-plan.gateway';
import { InventoryService } from '../inventory/inventory.service';
import { AuditService } from '../audit/audit.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('OrdersService — KOT Generation', () => {
  let service: OrdersService;
  let prisma: PrismaService;
  let gateway: KdsGateway;

  beforeEach(async () => {
    const gatewayMock = {
      emitNewKot: jest.fn(),
      emitOrderUpdate: jest.fn(),
      emitTableStatusChanged: jest.fn(),
    };

    const inventoryMock = {
      deductForKot: jest.fn().mockResolvedValue({}),
    };

    const auditMock = {
      log: jest.fn().mockResolvedValue({}),
    };

    const prismaMock = {
      order: {
        findFirst: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
      },
      orderItem: {
        createMany: jest.fn(),
        updateMany: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
      },
      kOT: {
        create: jest.fn(),
        count: jest.fn(),
      },
      outlet: {
        findFirst: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: KdsGateway, useValue: gatewayMock },
        { provide: FloorPlanGateway, useValue: gatewayMock },
        { provide: InventoryService, useValue: inventoryMock },
        { provide: AuditService, useValue: auditMock },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    prisma = module.get<PrismaService>(PrismaService);
    gateway = module.get<KdsGateway>(KdsGateway);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('fireKot', () => {
    it('should group items by station_route and create one KOT per station', async () => {
      const mockOrder = {
        id: 'order-1',
        tenant_id: 'tenant-1',
        status: 'DRAFT',
        order_type: 'DINE_IN',
        pax_count: 4,
        table: { table_number: 'T5' },
        order_items: [
          {
            id: 'oi-1',
            item: { name: 'Butter Chicken', station_route: 'HOT_KITCHEN' },
            variant: null,
            quantity: 2,
            status: 'PENDING',
            fire_status: 'FIRED',
          },
          {
            id: 'oi-2',
            item: { name: 'Paneer Tikka', station_route: 'HOT_KITCHEN' },
            variant: null,
            quantity: 1,
            status: 'PENDING',
            fire_status: 'FIRED',
          },
          {
            id: 'oi-3',
            item: { name: 'Masala Chai', station_route: 'BAR' },
            variant: null,
            quantity: 3,
            status: 'PENDING',
            fire_status: 'FIRED',
          },
        ],
      };

      (prisma.order.findFirst as jest.Mock).mockResolvedValue(mockOrder);
      (prisma.kOT.count as jest.Mock).mockResolvedValue(0);
      (prisma.kOT.create as jest.Mock).mockImplementation(async ({ data }) => ({
        id: `kot-${data.station}`,
        ...data,
        items: [],
      }));
      (prisma.order.update as jest.Mock).mockResolvedValue({
        ...mockOrder,
        status: 'PLACED',
        queue_token_number: 1,
      });

      const result = await service.fireKot('tenant-1', 'order-1', 'user-1', [
        'oi-1',
        'oi-2',
        'oi-3',
      ]);

      // Should create 2 KOTs: one for HOT_KITCHEN, one for BAR
      expect(prisma.kOT.create).toHaveBeenCalledTimes(2);
      expect(gateway.emitNewKot).toHaveBeenCalledTimes(2);

      // Verify KOT grouping
      const createCalls = (prisma.kOT.create as jest.Mock).mock.calls;
      const stations = createCalls.map((call: any) => call[0].data.station);
      expect(stations).toContain('HOT_KITCHEN');
      expect(stations).toContain('BAR');

      // HOT_KITCHEN KOT should have 2 items
      const hotKitchenCall = createCalls.find(
        (call: any) => call[0].data.station === 'HOT_KITCHEN',
      );
      expect(hotKitchenCall[0].data.items.connect).toHaveLength(2);

      // BAR KOT should have 1 item
      const barCall = createCalls.find(
        (call: any) => call[0].data.station === 'BAR',
      );
      expect(barCall[0].data.items.connect).toHaveLength(1);

      // Order status should be updated to PLACED
      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        data: { status: 'PLACED' },
      });

      expect(result.kots).toHaveLength(2);
      expect(result.table_number).toBe('T5');
    });

    it('should generate sequential KOT numbers', async () => {
      const mockOrder = {
        id: 'order-1',
        tenant_id: 'tenant-1',
        status: 'PLACED',
        order_type: 'DINE_IN',
        pax_count: 2,
        table: { table_number: 'T1' },
        order_items: [
          {
            id: 'oi-1',
            item: { name: 'Item A', station_route: 'HOT_KITCHEN' },
            variant: null,
            quantity: 1,
            status: 'PENDING',
            fire_status: 'FIRED',
          },
        ],
      };

      (prisma.order.findFirst as jest.Mock).mockResolvedValue(mockOrder);
      (prisma.kOT.count as jest.Mock).mockResolvedValue(5); // 5 existing KOTs
      (prisma.kOT.create as jest.Mock).mockImplementation(async ({ data }) => ({
        id: 'kot-new',
        ...data,
        items: [],
      }));

      await service.fireKot('tenant-1', 'order-1', 'user-1', ['oi-1']);

      const createCall = (prisma.kOT.create as jest.Mock).mock.calls[0];
      expect(createCall[0].data.kot_number).toBe('KOT-0006'); // 5 + 1 = 6, padded to 4 digits
    });

    it('should throw NotFoundException if order does not exist', async () => {
      (prisma.order.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        service.fireKot('tenant-1', 'order-999', 'user-1', ['oi-1']),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if no pending items to fire', async () => {
      const mockOrder = {
        id: 'order-1',
        tenant_id: 'tenant-1',
        status: 'PLACED',
        order_items: [],
      };

      (prisma.order.findFirst as jest.Mock).mockResolvedValue(mockOrder);

      await expect(
        service.fireKot('tenant-1', 'order-1', 'user-1', ['oi-1']),
      ).rejects.toThrow(BadRequestException);
    });

    it('should not update order status if already PLACED', async () => {
      const mockOrder = {
        id: 'order-1',
        tenant_id: 'tenant-1',
        status: 'PLACED',
        order_type: 'DINE_IN',
        pax_count: 2,
        table: { table_number: 'T1' },
        order_items: [
          {
            id: 'oi-1',
            item: { name: 'Item A', station_route: 'HOT_KITCHEN' },
            variant: null,
            quantity: 1,
            status: 'PENDING',
            fire_status: 'FIRED',
          },
        ],
      };

      (prisma.order.findFirst as jest.Mock).mockResolvedValue(mockOrder);
      (prisma.kOT.count as jest.Mock).mockResolvedValue(0);
      (prisma.kOT.create as jest.Mock).mockImplementation(async ({ data }) => ({
        id: 'kot-new',
        ...data,
        items: [],
      }));

      await service.fireKot('tenant-1', 'order-1', 'user-1', ['oi-1']);

      // order.update should NOT be called since status is already PLACED
      const updateCalls = (prisma.order.update as jest.Mock).mock.calls;
      const statusUpdateCalls = updateCalls.filter(
        (call: any) => call[0].data?.status === 'PLACED',
      );
      expect(statusUpdateCalls).toHaveLength(0);
    });

    it('should handle items with BAKERY station route', async () => {
      const mockOrder = {
        id: 'order-1',
        tenant_id: 'tenant-1',
        status: 'DRAFT',
        order_type: 'DINE_IN',
        pax_count: 2,
        table: { table_number: 'T3' },
        order_items: [
          {
            id: 'oi-1',
            item: { name: 'Chocolate Brownie', station_route: 'BAKERY' },
            variant: null,
            quantity: 1,
            status: 'PENDING',
            fire_status: 'FIRED',
          },
        ],
      };

      (prisma.order.findFirst as jest.Mock).mockResolvedValue(mockOrder);
      (prisma.kOT.count as jest.Mock).mockResolvedValue(0);
      (prisma.kOT.create as jest.Mock).mockImplementation(async ({ data }) => ({
        id: 'kot-bakery',
        ...data,
        items: [],
      }));
      (prisma.order.update as jest.Mock).mockResolvedValue({
        ...mockOrder,
        status: 'PLACED',
      });

      await service.fireKot('tenant-1', 'order-1', 'user-1', ['oi-1']);

      const createCall = (prisma.kOT.create as jest.Mock).mock.calls[0];
      expect(createCall[0].data.station).toBe('BAKERY');
    });
  });

  describe('fireHeldItems (Course Firing)', () => {
    it('should fire held items for a specific course number', async () => {
      const heldItems = [{ id: 'oi-1' }, { id: 'oi-2' }];

      const mockOrder = {
        id: 'order-1',
        tenant_id: 'tenant-1',
        status: 'PLACED',
        order_type: 'DINE_IN',
        pax_count: 2,
        table: { table_number: 'T1' },
        order_items: [
          {
            id: 'oi-1',
            item: { name: 'Main Course', station_route: 'HOT_KITCHEN' },
            variant: null,
            quantity: 1,
            status: 'PENDING',
            fire_status: 'FIRED',
          },
          {
            id: 'oi-2',
            item: { name: 'Rice', station_route: 'HOT_KITCHEN' },
            variant: null,
            quantity: 1,
            status: 'PENDING',
            fire_status: 'FIRED',
          },
        ],
      };

      (prisma.orderItem.findMany as jest.Mock).mockResolvedValue(heldItems);
      (prisma.order.findFirst as jest.Mock).mockResolvedValue(mockOrder);
      (prisma.kOT.count as jest.Mock).mockResolvedValue(0);
      (prisma.kOT.create as jest.Mock).mockImplementation(async ({ data }) => ({
        id: `kot-${data.station}`,
        ...data,
        items: [],
      }));

      await service.fireHeldItems('tenant-1', 'order-1', 'user-1', 2);

      // Should fire the held items
      expect(prisma.orderItem.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['oi-1', 'oi-2'] } },
        data: { fire_status: 'FIRED' },
      });
    });

    it('should throw BadRequestException if no held items for course', async () => {
      (prisma.orderItem.findMany as jest.Mock).mockResolvedValue([]);

      await expect(
        service.fireHeldItems('tenant-1', 'order-1', 'user-1', 2),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
