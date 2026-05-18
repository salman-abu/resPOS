import { Test, TestingModule } from '@nestjs/testing';
import { KioskService } from './kiosk.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  kioskTerminal: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  kioskSession: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
  kioskAnalytics: {
    findMany: jest.fn(),
  },
  category: {
    findMany: jest.fn(),
  },
  order: {
    create: jest.fn(),
  },
  orderItem: {
    groupBy: jest.fn(),
  },
  item: {
    findMany: jest.fn(),
  },
};

describe('KioskService', () => {
  let service: KioskService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KioskService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<KioskService>(KioskService);
    jest.clearAllMocks();
  });

  it('should get terminal config and menu', async () => {
    mockPrisma.kioskTerminal.findUnique.mockResolvedValue({
      id: 'k1',
      tenant_id: 't1',
      name: 'Kiosk 1',
      status: 'ACTIVE',
      display_languages: ['en'],
      default_language: 'en',
      idle_timeout_seconds: 90,
      attract_loop_enabled: true,
      show_calorie_info: false,
      allow_takeaway: true,
      allow_dine_in: true,
      payment_modes: ['UPI_QR', 'PAY_AT_COUNTER'],
      upsell_enabled: true,
      loyalty_lookup_enabled: true,
      whatsapp_receipt_enabled: true,
      tenant: { id: 't1', name: 'Test Restaurant', slug: 'test', settings: {} },
    });

    mockPrisma.category.findMany.mockResolvedValue([
      {
        id: 'c1',
        name: 'Starters',
        sort_order: 1,
        items: [
          {
            id: 'i1',
            name: 'Samosa',
            base_price: 5000,
            image_url: null,
            is_available: true,
            variants: [],
            modifier_groups: [],
            recipes: [],
          },
        ],
      },
    ]);

    const result = await service.getTerminalConfig('k1');
    expect(result.terminal.name).toBe('Kiosk 1');
    expect(result.menu).toHaveLength(1);
    expect(result.paused).toBe(false);
  });

  it('should start a kiosk session', async () => {
    mockPrisma.kioskTerminal.findUnique.mockResolvedValue({
      id: 'k1',
      tenant_id: 't1',
      status: 'ACTIVE',
    });
    mockPrisma.kioskSession.create.mockResolvedValue({
      id: 's1',
      status: 'BROWSING',
    });

    const result = await service.startSession('k1', {
      serviceType: 'DINE_IN',
      language: 'en',
    });
    expect(result.sessionId).toBe('s1');
  });

  it('should abandon a session', async () => {
    mockPrisma.kioskSession.findUnique.mockResolvedValue({
      id: 's1',
      status: 'BROWSING',
    });
    mockPrisma.kioskSession.update.mockResolvedValue({
      id: 's1',
      status: 'TIMEOUT',
    });

    const result = await service.abandonSession('s1', 'TIMEOUT');
    expect(result.status).toBe('abandoned');
  });

  it('should verify admin PIN', async () => {
    const hashed =
      '9af15b336e6a9619928537df30b2e6a2376569fcf9d7e773eccede65606529a0'; // sha256 of '0000'
    mockPrisma.kioskTerminal.findUnique.mockResolvedValue({
      id: 'k1',
      admin_pin_hash: hashed,
    });

    // Wrong PIN
    const wrong = await service.verifyPin('k1', '1234');
    expect(wrong.valid).toBe(false);

    // Correct PIN (sha256 of '0000')
    const correct = await service.verifyPin('k1', '0000');
    expect(correct.valid).toBe(true);
    expect(correct.exitToken).toBeDefined();
  });
});
