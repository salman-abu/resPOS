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

        // MOD-02: Also update LoyaltyAccount + Ledger
        if (customer.mobile) {
          const account = await tx.loyaltyAccount.upsert({
            where: {
              tenant_id_customer_phone: {
                tenant_id: tenantId,
                customer_phone: customer.mobile,
              },
            },
            update: {
              points_balance: { increment: pointsEarned },
              lifetime_points: { increment: pointsEarned },
            },
            create: {
              tenant_id: tenantId,
              customer_phone: customer.mobile,
              points_balance: pointsEarned,
              lifetime_points: pointsEarned,
            },
          });

          await tx.loyaltyLedger.create({
            data: {
              tenant_id: tenantId,
              account_id: account.id,
              order_id: orderId,
              type: LoyaltyTxType.EARN,
              points: pointsEarned,
              note: `Earned from order ${orderId}`,
            },
          });
        }
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

      // Also update LoyaltyAccount and create Ledger entry (MOD-02)
      if (customer.mobile) {
        const account = await tx.loyaltyAccount.findUnique({
          where: {
            tenant_id_customer_phone: {
              tenant_id: tenantId,
              customer_phone: customer.mobile,
            },
          },
        });
        if (account) {
          await tx.loyaltyAccount.update({
            where: { id: account.id },
            data: { points_balance: { decrement: dto.points } },
          });
          await tx.loyaltyLedger.create({
            data: {
              tenant_id: tenantId,
              account_id: account.id,
              type: LoyaltyTxType.REDEEM,
              points: -dto.points,
              note: 'Redeemed at POS',
            },
          });
        }
      }

      return {
        success: true,
        balance: updatedCustomer.loyalty_points,
        transaction: txRecord,
      };
    });
  }

  // ─── MOD-02: Loyalty Account by Phone ───────────────────────────────────
  async getAccountByPhone(tenantId: string, phone: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { tenant_id: tenantId, mobile: phone },
    });

    const account = await this.prisma.loyaltyAccount.findUnique({
      where: {
        tenant_id_customer_phone: {
          tenant_id: tenantId,
          customer_phone: phone,
        },
      },
      include: {
        ledgers: { orderBy: { created_at: 'desc' }, take: 10 },
      },
    });

    const stampProgress = await this.prisma.stampProgress.findMany({
      where: { tenant_id: tenantId, customer_phone: phone },
      include: { stamp_card: true },
    });

    return {
      customer: customer
        ? {
            id: customer.id,
            name: customer.name,
            mobile: customer.mobile,
            tier: customer.tier,
          }
        : null,
      balance: account?.points_balance ?? customer?.loyalty_points ?? 0,
      lifetimePoints: account?.lifetime_points ?? 0,
      ledgers: account?.ledgers ?? [],
      stampCards: stampProgress.map((sp) => ({
        id: sp.stamp_card.id,
        name: sp.stamp_card.name,
        goal: sp.stamp_card.goal_count,
        count: sp.count,
        completed: !!sp.completed_at,
        rewardDescription: sp.stamp_card.reward_description,
      })),
    };
  }

  // ─── MOD-02: Stamp Card CRUD ────────────────────────────────────────────
  async createStampCard(
    tenantId: string,
    data: {
      name: string;
      goalCount: number;
      rewardDescription: string;
      triggerMenuItemId?: string;
      rewardMenuItemId?: string;
    },
  ) {
    return this.prisma.stampCard.create({
      data: {
        tenant_id: tenantId,
        name: data.name,
        goal_count: data.goalCount,
        reward_description: data.rewardDescription,
        trigger_menu_item_id: data.triggerMenuItemId,
        reward_menu_item_id: data.rewardMenuItemId,
      },
    });
  }

  async listStampCards(tenantId: string) {
    return this.prisma.stampCard.findMany({
      where: { tenant_id: tenantId },
      orderBy: { created_at: 'desc' },
    });
  }

  async toggleStampCard(tenantId: string, id: string) {
    const card = await this.prisma.stampCard.findFirst({
      where: { id, tenant_id: tenantId },
    });
    if (!card) throw new NotFoundException('Stamp card not found');
    return this.prisma.stampCard.update({
      where: { id },
      data: { is_active: !card.is_active },
    });
  }

  // ─── MOD-02: Award Stamps on Settlement ─────────────────────────────────
  async awardStamps(
    tenantId: string,
    customerPhone: string,
    orderItems: { item_id: string; quantity: number }[],
  ) {
    const activeCards = await this.prisma.stampCard.findMany({
      where: { tenant_id: tenantId, is_active: true },
    });

    const results: any[] = [];

    for (const card of activeCards) {
      let stampsEarned = 0;
      for (const oi of orderItems) {
        if (
          !card.trigger_menu_item_id ||
          card.trigger_menu_item_id === oi.item_id
        ) {
          stampsEarned += oi.quantity;
        }
      }

      if (stampsEarned > 0) {
        const progress = await this.prisma.stampProgress.upsert({
          where: {
            tenant_id_stamp_card_id_customer_phone: {
              tenant_id: tenantId,
              stamp_card_id: card.id,
              customer_phone: customerPhone,
            },
          },
          update: {
            count: { increment: stampsEarned },
          },
          create: {
            tenant_id: tenantId,
            stamp_card_id: card.id,
            customer_phone: customerPhone,
            count: stampsEarned,
          },
        });

        // Check completion
        if (progress.count >= card.goal_count && !progress.completed_at) {
          await this.prisma.stampProgress.update({
            where: { id: progress.id },
            data: { completed_at: new Date() },
          });
          results.push({ cardId: card.id, name: card.name, completed: true });
        } else {
          results.push({
            cardId: card.id,
            name: card.name,
            completed: false,
            count: progress.count,
          });
        }
      }
    }

    return results;
  }

  // ─── MOD-02: Sync Customer → LoyaltyAccount on Earn ──────────────────────
  async ensureAccount(tenantId: string, phone: string) {
    const existing = await this.prisma.loyaltyAccount.findUnique({
      where: {
        tenant_id_customer_phone: {
          tenant_id: tenantId,
          customer_phone: phone,
        },
      },
    });
    if (existing) return existing;
    return this.prisma.loyaltyAccount.create({
      data: {
        tenant_id: tenantId,
        customer_phone: phone,
      },
    });
  }
}
