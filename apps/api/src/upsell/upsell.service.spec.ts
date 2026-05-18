import { Test, TestingModule } from '@nestjs/testing';
import { UpsellService } from './upsell.service';
import { PrismaService } from '../prisma/prisma.service';

describe('UpsellService', () => {
  let service: UpsellService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpsellService,
        {
          provide: PrismaService,
          useValue: {
            order: {
              findMany: jest.fn().mockResolvedValue([]),
            },
            orderItem: {
              groupBy: jest.fn().mockResolvedValue([]),
            },
            item: {
              findMany: jest.fn().mockResolvedValue([]),
            },
          },
        },
      ],
    }).compile();

    service = module.get<UpsellService>(UpsellService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should return empty for no cart items', async () => {
    const result = await service.getSuggestions('tenant-1', []);
    expect(result).toEqual([]);
  });

  it('should find co-occurring items', async () => {
    (prisma.order.findMany as jest.Mock).mockResolvedValue([
      { id: 'order-1' },
      { id: 'order-2' },
    ]);
    (prisma.orderItem.groupBy as jest.Mock).mockResolvedValue([
      { item_id: 'item-b', _count: { item_id: 5 } },
    ]);
    (prisma.item.findMany as jest.Mock).mockResolvedValue([
      { id: 'item-b', name: 'Garlic Naan', base_price: 8900 },
    ]);

    const result = await service.getSuggestions('tenant-1', ['item-a']);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Garlic Naan');
  });
});
