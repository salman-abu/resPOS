import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from './audit.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  auditLog: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
};

describe('AuditService', () => {
  let service: AuditService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
  });

  describe('log', () => {
    it('should create an audit log entry', async () => {
      mockPrisma.auditLog.create.mockResolvedValue({ id: 'log-1' });

      const result = await service.log({
        tenantId: 'tenant-1',
        action: 'VOID_BILL',
        entityType: 'ORDER',
        entityId: 'order-1',
        performedBy: 'user-1',
        reason: 'Customer complaint',
        oldValue: { status: 'BILLED' },
        newValue: { status: 'VOID' },
      });

      expect(result.id).toBe('log-1');
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          tenant_id: 'tenant-1',
          action: 'VOID_BILL',
          entity_type: 'ORDER',
          entity_id: 'order-1',
          performed_by: 'user-1',
          authorized_by: undefined,
          reason: 'Customer complaint',
          old_value: { status: 'BILLED' },
          new_value: { status: 'VOID' },
          ip_address: undefined,
        },
      });
    });
  });

  describe('getLogs', () => {
    it('should return paginated logs with meta', async () => {
      const logs = [
        { id: 'log-1', action: 'VOID_BILL' },
        { id: 'log-2', action: 'APPLY_DISCOUNT' },
      ];
      mockPrisma.auditLog.findMany.mockResolvedValue(logs);
      mockPrisma.auditLog.count.mockResolvedValue(42);

      const result = await service.getLogs('tenant-1', {}, 2, 10);

      expect(result.data).toEqual(logs);
      expect(result.meta).toEqual({
        total: 42,
        page: 2,
        limit: 10,
        totalPages: 5,
      });
      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenant_id: 'tenant-1' },
          orderBy: { created_at: 'desc' },
          skip: 10,
          take: 10,
        }),
      );
    });

    it('should filter by action and date range', async () => {
      mockPrisma.auditLog.findMany.mockResolvedValue([]);
      mockPrisma.auditLog.count.mockResolvedValue(0);

      const from = new Date('2024-01-01');
      const to = new Date('2024-12-31');

      await service.getLogs(
        'tenant-1',
        { action: 'VOID_BILL', performedBy: 'user-1', from, to },
        1,
        25,
      );

      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            tenant_id: 'tenant-1',
            action: 'VOID_BILL',
            performed_by: 'user-1',
            created_at: { gte: from, lte: to },
          },
        }),
      );
    });
  });

  describe('exportToCsv', () => {
    it('should generate RFC 4180 compliant CSV', async () => {
      mockPrisma.auditLog.findMany.mockResolvedValue([
        {
          id: 'log-1',
          action: 'VOID_BILL',
          entity_type: 'ORDER',
          entity_id: 'order-1',
          performed_by: 'user-1',
          authorized_by: null,
          reason: 'Customer said "no"',
          old_value: { status: 'BILLED' },
          new_value: { status: 'VOID' },
          ip_address: '192.168.1.1',
          created_at: new Date('2024-05-15T10:30:00Z'),
        },
      ]);

      const csv = await service.exportToCsv('tenant-1');

      expect(csv).toContain('ID,Action,Entity Type,Entity ID');
      // Check that quotes in reason are escaped correctly
      expect(csv).toContain('"Customer said ""no"""');
      expect(csv).toContain('VOID_BILL');
      expect(csv).toContain('192.168.1.1');
    });
  });
});
