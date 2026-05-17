import { Test, TestingModule } from '@nestjs/testing';
import { KdsService } from './kds.service';
import { PrismaService } from '../prisma/prisma.service';
import { KdsGateway } from './kds.gateway';
import { AuditService } from '../audit/audit.service';

describe('KdsService', () => {
  let service: KdsService;
  let prisma: PrismaService;
  let gateway: KdsGateway;

  beforeEach(async () => {
    const gatewayMock = {
      emitItemDone: jest.fn(),
      emitKotStatus: jest.fn(),
      emitKotBumped: jest.fn(),
      emitNewKot: jest.fn(),
      emitOrderUpdate: jest.fn(),
    };

    const prismaMock = {
      kOT: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
        count: jest.fn(),
      },
      orderItem: {
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      order: {
        findUnique: jest.fn(),
        update: jest.fn(),
        findFirst: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KdsService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: KdsGateway, useValue: gatewayMock },
        {
          provide: AuditService,
          useValue: { log: jest.fn().mockResolvedValue({}) },
        },
      ],
    }).compile();

    service = module.get<KdsService>(KdsService);
    prisma = module.get<PrismaService>(PrismaService);
    gateway = module.get<KdsGateway>(KdsGateway);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getActiveKots', () => {
    it('should filter KOTs by station when station is specified', async () => {
      const mockKots = [
        { id: 'kot-1', station: 'HOT_KITCHEN', status: 'PRINTED' },
        { id: 'kot-2', station: 'HOT_KITCHEN', status: 'PREPARING' },
      ];

      (prisma.kOT.findMany as jest.Mock).mockResolvedValue(mockKots);

      const result = await service.getActiveKots('tenant-1', 'HOT_KITCHEN');

      expect(prisma.kOT.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenant_id: 'tenant-1',
            status: { in: ['PRINTED', 'PREPARING'] },
            station: 'HOT_KITCHEN',
          }),
        }),
      );
      expect(result).toEqual(mockKots);
    });

    it('should return all stations when station is ALL', async () => {
      const mockKots = [
        { id: 'kot-1', station: 'HOT_KITCHEN', status: 'PRINTED' },
        { id: 'kot-2', station: 'BAR', status: 'PREPARING' },
      ];

      (prisma.kOT.findMany as jest.Mock).mockResolvedValue(mockKots);

      const result = await service.getActiveKots('tenant-1', 'ALL');

      expect(prisma.kOT.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.not.objectContaining({ station: expect.anything() }),
        }),
      );
      expect(result).toEqual(mockKots);
    });
  });

  describe('markItemDone', () => {
    it('should mark item as READY and emit event', async () => {
      const mockKot = {
        id: 'kot-1',
        tenant_id: 'tenant-1',
        station: 'HOT_KITCHEN',
        order_id: 'order-1',
        items: [
          { id: 'oi-1', status: 'SENT_TO_KDS' },
          { id: 'oi-2', status: 'SENT_TO_KDS' },
        ],
      };

      (prisma.kOT.findFirst as jest.Mock).mockResolvedValue(mockKot);
      (prisma.orderItem.update as jest.Mock).mockResolvedValue({});
      (prisma.order.findUnique as jest.Mock).mockResolvedValue({
        id: 'order-1',
        order_items: [{ status: 'READY' }, { status: 'SENT_TO_KDS' }],
      });

      const result = await service.markItemDone(
        'tenant-1',
        'kot-1',
        'oi-1',
        true,
      );

      expect(prisma.orderItem.update).toHaveBeenCalledWith({
        where: { id: 'oi-1' },
        data: { status: 'READY' },
      });
      expect(gateway.emitItemDone).toHaveBeenCalledWith(
        'tenant-1',
        'HOT_KITCHEN',
        {
          kot_id: 'kot-1',
          item_id: 'oi-1',
          done: true,
        },
      );
      expect(result.success).toBe(true);
      expect(result.all_done).toBe(false);
    });

    it('should mark KOT as READY when all items are done', async () => {
      const mockKot = {
        id: 'kot-1',
        tenant_id: 'tenant-1',
        station: 'HOT_KITCHEN',
        order_id: 'order-1',
        items: [
          { id: 'oi-1', status: 'READY' },
          { id: 'oi-2', status: 'SENT_TO_KDS' },
        ],
      };

      (prisma.kOT.findFirst as jest.Mock).mockResolvedValue(mockKot);
      (prisma.orderItem.update as jest.Mock).mockResolvedValue({});
      (prisma.kOT.update as jest.Mock).mockResolvedValue({});
      (prisma.order.findUnique as jest.Mock).mockResolvedValue({
        id: 'order-1',
        order_items: [{ status: 'READY' }, { status: 'READY' }],
      });

      const result = await service.markItemDone(
        'tenant-1',
        'kot-1',
        'oi-2',
        true,
      );

      expect(prisma.kOT.update).toHaveBeenCalledWith({
        where: { id: 'kot-1' },
        data: { status: 'READY' },
      });
      expect(gateway.emitKotStatus).toHaveBeenCalledWith(
        'tenant-1',
        'HOT_KITCHEN',
        {
          kot_id: 'kot-1',
          status: 'READY',
        },
      );
      expect(result.all_done).toBe(true);
    });

    it('should update order status to PREPARING when first item is marked done', async () => {
      const mockKot = {
        id: 'kot-1',
        tenant_id: 'tenant-1',
        station: 'HOT_KITCHEN',
        order_id: 'order-1',
        items: [{ id: 'oi-1', status: 'SENT_TO_KDS' }],
      };

      (prisma.kOT.findFirst as jest.Mock).mockResolvedValue(mockKot);
      (prisma.orderItem.update as jest.Mock).mockResolvedValue({});
      (prisma.kOT.update as jest.Mock).mockResolvedValue({});
      (prisma.order.findUnique as jest.Mock).mockResolvedValue({
        id: 'order-1',
        queue_token_number: 42,
        order_name: 'Table 5',
        order_items: [{ status: 'READY' }],
      });

      await service.markItemDone('tenant-1', 'kot-1', 'oi-1', true);

      expect(gateway.emitOrderUpdate).toHaveBeenCalledWith('tenant-1', {
        id: 'order-1',
        status: 'READY',
        token: 42,
        name: 'Table 5',
      });
    });

    it('should throw NotFoundException if KOT does not exist', async () => {
      (prisma.kOT.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        service.markItemDone('tenant-1', 'kot-999', 'oi-1', true),
      ).rejects.toThrow('KOT not found');
    });

    it('should throw BadRequestException if item does not belong to KOT', async () => {
      const mockKot = {
        id: 'kot-1',
        tenant_id: 'tenant-1',
        station: 'HOT_KITCHEN',
        items: [{ id: 'oi-1', status: 'SENT_TO_KDS' }],
      };

      (prisma.kOT.findFirst as jest.Mock).mockResolvedValue(mockKot);

      await expect(
        service.markItemDone('tenant-1', 'kot-1', 'oi-999', true),
      ).rejects.toThrow('Item not in this KOT');
    });
  });

  describe('bumpKot', () => {
    it('should mark all items as SERVED and KOT as READY', async () => {
      const mockKot = {
        id: 'kot-1',
        tenant_id: 'tenant-1',
        station: 'HOT_KITCHEN',
        order_id: 'order-1',
        items: [
          { id: 'oi-1', status: 'READY' },
          { id: 'oi-2', status: 'READY' },
        ],
      };

      (prisma.kOT.findFirst as jest.Mock).mockResolvedValue(mockKot);
      (prisma.order.findFirst as jest.Mock).mockResolvedValue({
        id: 'order-1',
        order_items: [{ status: 'SERVED' }, { status: 'SERVED' }],
      });

      const result = await service.bumpKot('tenant-1', 'kot-1');

      expect(prisma.orderItem.updateMany).toHaveBeenCalledWith({
        where: { kot_id: 'kot-1' },
        data: { status: 'SERVED' },
      });
      expect(prisma.kOT.update).toHaveBeenCalledWith({
        where: { id: 'kot-1' },
        data: { status: 'READY' },
      });
      expect(gateway.emitKotBumped).toHaveBeenCalledWith(
        'tenant-1',
        'HOT_KITCHEN',
        'kot-1',
      );
      expect(result.success).toBe(true);
    });

    it('should update order status to SERVED when all KOTs are bumped', async () => {
      const mockKot = {
        id: 'kot-1',
        tenant_id: 'tenant-1',
        station: 'HOT_KITCHEN',
        order_id: 'order-1',
      };

      (prisma.kOT.findFirst as jest.Mock).mockResolvedValue(mockKot);
      (prisma.order.findFirst as jest.Mock).mockResolvedValue({
        id: 'order-1',
        order_items: [{ status: 'SERVED' }, { status: 'VOID' }],
      });

      await service.bumpKot('tenant-1', 'kot-1');

      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        data: { status: 'SERVED' },
      });
      expect(gateway.emitOrderUpdate).toHaveBeenCalledWith('tenant-1', {
        id: 'order-1',
        status: 'SERVED',
      });
    });

    it('should not update order status if items remain unserved', async () => {
      const mockKot = {
        id: 'kot-1',
        tenant_id: 'tenant-1',
        station: 'HOT_KITCHEN',
        order_id: 'order-1',
      };

      (prisma.kOT.findFirst as jest.Mock).mockResolvedValue(mockKot);
      (prisma.order.findFirst as jest.Mock).mockResolvedValue({
        id: 'order-1',
        order_items: [{ status: 'SERVED' }, { status: 'SENT_TO_KDS' }],
      });

      await service.bumpKot('tenant-1', 'kot-1');

      expect(prisma.order.update).not.toHaveBeenCalled();
    });
  });

  describe('recallKot', () => {
    it('should recall a bumped KOT back to PREPARING', async () => {
      const mockKot = {
        id: 'kot-1',
        tenant_id: 'tenant-1',
        station: 'HOT_KITCHEN',
        order_id: 'order-1',
      };

      const recalledKot = {
        ...mockKot,
        items: [{ id: 'oi-1', status: 'SENT_TO_KDS' }],
      };

      (prisma.kOT.findFirst as jest.Mock).mockResolvedValue(mockKot);
      (prisma.kOT.findFirst as jest.Mock).mockResolvedValueOnce(mockKot);

      await service.recallKot('tenant-1', 'user-1', 'kot-1');

      expect(prisma.kOT.update).toHaveBeenCalledWith({
        where: { id: 'kot-1' },
        data: { status: 'PREPARING' },
      });
      expect(prisma.orderItem.updateMany).toHaveBeenCalledWith({
        where: { kot_id: 'kot-1' },
        data: { status: 'SENT_TO_KDS' },
      });
    });

    it('should throw NotFoundException if KOT does not exist', async () => {
      (prisma.kOT.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        service.recallKot('tenant-1', 'user-1', 'kot-999'),
      ).rejects.toThrow('KOT not found');
    });
  });
});
