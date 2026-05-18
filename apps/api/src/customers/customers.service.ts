import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateCustomerDto) {
    return this.prisma.customer.create({
      data: {
        tenant_id: tenantId,
        ...dto,
        birthday: dto.birthday ? new Date(dto.birthday) : undefined,
      },
    });
  }

  async update(tenantId: string, id: string, dto: UpdateCustomerDto) {
    return this.prisma.customer.update({
      where: { id, tenant_id: tenantId },
      data: {
        ...dto,
        birthday: dto.birthday ? new Date(dto.birthday) : undefined,
      },
    });
  }

  async findOne(tenantId: string, id: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, tenant_id: tenantId },
      include: {
        orders: {
          orderBy: { created_at: 'desc' },
          take: 5,
          include: { order_items: { include: { item: true } } },
        },
        loyalty_txs: {
          orderBy: { created_at: 'desc' },
          take: 10,
        },
      },
    });
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  async getUsualOrder(tenantId: string, customerId: string) {
    const orders = await this.prisma.order.findMany({
      where: {
        customer_id: customerId,
        tenant_id: tenantId,
        status: 'SETTLED',
      },
      include: {
        order_items: {
          select: {
            item_id: true,
            item: {
              include: {
                category: true,
                variants: true,
                addons: true,
                modifier_groups: {
                  include: { modifiers: true },
                },
              },
            },
          },
        },
      },
    });

    const itemCounts: Record<string, { count: number; item: any }> = {};
    for (const order of orders) {
      for (const oi of order.order_items) {
        if (!itemCounts[oi.item_id]) {
          itemCounts[oi.item_id] = { count: 0, item: oi.item };
        }
        itemCounts[oi.item_id].count++;
      }
    }

    return Object.values(itemCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 4)
      .map((entry) => entry.item);
  }

  async getOrderHistoryByPhone(tenantId: string, phone: string) {
    const histories = await this.prisma.customerOrderHistory.findMany({
      where: { tenant_id: tenantId, customer_phone: phone },
      orderBy: { settled_at: 'desc' },
      take: 5,
    });

    return histories.map((h) => ({
      id: h.id,
      settledAt: h.settled_at,
      snapshot: h.order_snapshot,
    }));
  }

  async saveOrderSnapshot(
    tenantId: string,
    phone: string,
    snapshot: any,
    settledAt: Date,
  ) {
    // Cap at 10 entries per customer per tenant
    const existing = await this.prisma.customerOrderHistory.findMany({
      where: { tenant_id: tenantId, customer_phone: phone },
      orderBy: { settled_at: 'desc' },
    });

    if (existing.length >= 10) {
      const toDelete = existing.slice(10 - 1);
      await this.prisma.customerOrderHistory.deleteMany({
        where: {
          id: { in: toDelete.map((e) => e.id) },
        },
      });
    }

    return this.prisma.customerOrderHistory.create({
      data: {
        tenant_id: tenantId,
        customer_phone: phone,
        order_snapshot: snapshot,
        settled_at: settledAt,
      },
    });
  }
}
