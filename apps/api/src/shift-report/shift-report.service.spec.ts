import { Test, TestingModule } from '@nestjs/testing';
import { ShiftReportService } from './shift-report.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ShiftReportService', () => {
  let service: ShiftReportService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShiftReportService,
        {
          provide: PrismaService,
          useValue: {
            shift: {
              findFirst: jest.fn(),
            },
            order: {
              findMany: jest.fn().mockResolvedValue([]),
              count: jest.fn().mockResolvedValue(0),
            },
            shiftReport: {
              upsert: jest.fn(),
              findMany: jest.fn(),
              count: jest.fn(),
              findFirst: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<ShiftReportService>(ShiftReportService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should generate and save a shift report', async () => {
    const mockShift = {
      id: 'shift-1',
      tenant_id: 'tenant-1',
      opened_at: new Date(),
      opening_float: 1000,
      closing_float: 1200,
    };
    (prisma.shift.findFirst as jest.Mock).mockResolvedValue(mockShift);
    (prisma.shiftReport.upsert as jest.Mock).mockResolvedValue({
      id: 'report-1',
      tenant_id: 'tenant-1',
      shift_session_id: 'shift-1',
      total_sales_paise: 0,
      total_orders: 0,
      void_count: 0,
      cash_paise: 0,
      upi_paise: 0,
      card_paise: 0,
      opening_float_paise: 1000,
      closing_float_paise: 1200,
      top_items: [],
    });

    const result = await service.generateAndSave('tenant-1', 'shift-1');
    expect(result.shift_session_id).toBe('shift-1');
    expect(prisma.shiftReport.upsert).toHaveBeenCalled();
  });

  it('should list shift reports', async () => {
    (prisma.shiftReport.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.shiftReport.count as jest.Mock).mockResolvedValue(0);

    const result = await service.listReports('tenant-1');
    expect(result.data).toEqual([]);
    expect(result.meta.total).toBe(0);
  });
});
