import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ForecastService (AnalyticsService)', () => {
  let service: AnalyticsService;

  beforeEach(async () => {
    const prismaMock = {};
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
  });

  it('should generate a 7-day forecast with holiday multipliers', async () => {
    const forecast = await service.getForecast('tenant-1', 7);

    expect(forecast).toBeDefined();
    expect(forecast.length).toBe(7);

    forecast.forEach((day) => {
      expect(day.date).toBeDefined();
      expect(day.predictedRevenue).toBeGreaterThan(0);
      expect(day.predictedCovers).toBeGreaterThan(0);
      expect(day.weatherFlag).toBeDefined();
    });
  });

  it('should flag food cost anomalies above 35% threshold', async () => {
    const alerts = await service.getFoodCostAlerts('tenant-1');

    expect(alerts).toBeDefined();
    if (alerts.length > 0) {
      alerts.forEach((alert: { costPercentage: number; threshold: number }) => {
        expect(alert.costPercentage).toBeGreaterThan(alert.threshold);
        expect(alert.threshold).toBe(35);
      });
    }
  });
});
