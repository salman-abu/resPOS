import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

import {
  UpdateLoyaltyConfigDto,
  EarnLoyaltyDto,
  RedeemLoyaltyDto,
} from './dto/loyalty.dto';
import { LoyaltyTier, LoyaltyTxType } from '@prisma/client';

@Injectable()
export class LoyaltyService {
  constructor(private readonly prisma: PrismaService) {}

  async updateConfig(tenantId: string, dto: UpdateLoyaltyConfigDto) {
    return this.prisma.loyaltyConfig.upsert({
      where: { tenant_id: tenantId },
      update: {
        points_per_rupee: dto.pointsPerRupee,
        redeem_threshold: dto.redeemThreshold,
        tier_thresholds: dto.tierThresholds,
      },
      create: {
        tenant_id: tenantId,
        points_per_rupee: dto.pointsPerRupee,
        redeem_threshold: dto.redeemThreshold,
        tier_thresholds: dto.tierThresholds,
      },
    });
  }

  async getConfig(tenantId: string) {
    return this.prisma.loyaltyConfig.findUnique({
      where: { tenant_id: tenantId },
    });
  }

  async searchCustomers(tenantId: string, query: string) {
    if (!query || query.length < 3) return [];

    return this.prisma.customer.findMany({
      where: {
        tenant_id: tenantId,
        OR: [
          { mobile: { contains: query } },
          { name: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        name: true,
        mobile: true,
        tier: true,
        loyalty_points: true,
      },
      take: 5,
    });
  }

  async getCustomerLoyalty(tenantId: string, customerId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, tenant_id: tenantId },
    });
    if (!customer) throw new NotFoundException('Customer not found');

    const transactions = await this.prisma.loyaltyTransaction.findMany({
      where: { customer_id: customerId, tenant_id: tenantId },
      orderBy: { created_at: 'desc' },
      take: 20,
    });

    return {
      balance: customer.loyalty_points,
      tier: customer.tier,
      totalVisits: customer.total_visits,
      totalSpend: customer.total_spent,
      history: transactions,
    };
  }

  async triggerEarnPoints(tenantId: string, dto: EarnLoyaltyDto) {
    // Process synchronously instead of queuing
    await this.processEarnLoyalty({ tenantId, ...dto });
    return { success: true, message: 'Processed immediately' };
  }

  async processEarnLoyalty(data: {
    tenantId: string;
    customerId: string;
    orderId: string;
    amountSpent: number;
  }) {
    const { tenantId, customerId, orderId, amountSpent } = data;

    const config = await this.prisma.loyaltyConfig.findUnique({
      where: { tenant_id: tenantId },
    });
    if (!config) return;

    // amountSpent is in paise. Rupee = amountSpent / 100
    const pointsEarned = Math.floor(
      (amountSpent / 100) * config.points_per_rupee,
    );

    if (pointsEarned > 0) {
      await this.prisma.$transaction(async (tx) => {
        const customer = await tx.customer.findUnique({
          where: { id: customerId },
        });
        if (!customer) return;

        const newPoints = customer.loyalty_points + pointsEarned;
        const newTotalSpent = customer.total_spent + amountSpent;

        let newTier: LoyaltyTier = customer.tier;
        const thresholds = config.tier_thresholds as Record<string, number>;

        if (thresholds && typeof thresholds === 'object') {
          const spentInRupees = newTotalSpent / 100;
          if (thresholds['PLATINUM'] && spentInRupees >= thresholds['PLATINUM'])
            newTier = 'PLATINUM';
          else if (thresholds['GOLD'] && spentInRupees >= thresholds['GOLD'])
            newTier = 'GOLD';
          else if (
            thresholds['SILVER'] &&
            spentInRupees >= thresholds['SILVER']
          )
            newTier = 'SILVER';
          else newTier = 'BRONZE';
        }

        await tx.customer.update({
          where: { id: customerId },
          data: {
            loyalty_points: newPoints,
            total_spent: newTotalSpent,
            total_visits: { increment: 1 },
            tier: newTier,
            last_visit_at: new Date(),
          },
        });

        await tx.loyaltyTransaction.create({
          data: {
            tenant_id: tenantId,
            customer_id: customerId,
            order_id: orderId,
            type: LoyaltyTxType.EARN,
            points: pointsEarned,
          },
        });
      });
    }
  }

  async redeemPoints(tenantId: string, dto: RedeemLoyaltyDto) {
    const config = await this.prisma.loyaltyConfig.findUnique({
      where: { tenant_id: tenantId },
    });
    if (!config) throw new BadRequestException('Loyalty not configured');

    const customer = await this.prisma.customer.findFirst({
      where: { id: dto.customerId, tenant_id: tenantId },
    });
    if (!customer) throw new NotFoundException('Customer not found');

    if (customer.loyalty_points < dto.points) {
      throw new BadRequestException('Insufficient points');
    }
    if (dto.points < config.redeem_threshold) {
      throw new BadRequestException(
        `Minimum points to redeem is ${config.redeem_threshold}`,
      );
    }

    return await this.prisma.$transaction(async (tx) => {
      const updatedCustomer = await tx.customer.update({
        where: { id: dto.customerId },
        data: {
          loyalty_points: { decrement: dto.points },
        },
      });

      const txRecord = await tx.loyaltyTransaction.create({
        data: {
          tenant_id: tenantId,
          customer_id: dto.customerId,
          type: LoyaltyTxType.REDEEM,
          points: dto.points,
        },
      });

      return {
        success: true,
        balance: updatedCustomer.loyalty_points,
        transaction: txRecord,
      };
    });
  }
}
