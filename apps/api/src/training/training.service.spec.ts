import { Test, TestingModule } from '@nestjs/testing';
import { TrainingService } from './training.service';
import { PrismaService } from '../prisma/prisma.service';

describe('TrainingService', () => {
  let service: TrainingService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TrainingService,
        {
          provide: PrismaService,
          useValue: {
            trainingSession: {
              updateMany: jest.fn(),
              create: jest.fn(),
              findFirst: jest.fn(),
              findMany: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            orderItemAddon: { deleteMany: jest.fn() },
            orderItem: { deleteMany: jest.fn() },
            payment: { deleteMany: jest.fn() },
            invoice: { deleteMany: jest.fn() },
            kOT: { deleteMany: jest.fn() },
            order: { deleteMany: jest.fn() },
            $transaction: jest.fn((ops) => Promise.all(ops)),
          },
        },
      ],
    }).compile();

    service = module.get<TrainingService>(TrainingService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should start a training session', async () => {
    const mockSession = {
      id: 'sess-1',
      tenant_id: 'tenant-1',
      terminal_id: 'term-1',
      started_by: 'user-1',
      started_at: new Date(),
      is_active: true,
    };
    (prisma.trainingSession.updateMany as jest.Mock).mockResolvedValue({
      count: 0,
    });
    (prisma.trainingSession.create as jest.Mock).mockResolvedValue(mockSession);

    const result = await service.startTraining('tenant-1', 'term-1', 'user-1');
    expect(result.sessionId).toBe('sess-1');
    expect(prisma.trainingSession.create).toHaveBeenCalled();
  });

  it('should end training and wipe data', async () => {
    const mockSession = {
      id: 'sess-1',
      tenant_id: 'tenant-1',
      terminal_id: 'term-1',
      is_active: true,
    };
    (prisma.trainingSession.findFirst as jest.Mock).mockResolvedValue(
      mockSession,
    );
    (prisma.trainingSession.update as jest.Mock).mockResolvedValue({
      ...mockSession,
      is_active: false,
    });

    const result = await service.endTraining('tenant-1', 'term-1');
    expect(result.success).toBe(true);
  });
});
