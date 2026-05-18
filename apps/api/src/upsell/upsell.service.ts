import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UpsellService {
  constructor(private readonly prisma: PrismaService) {}

  async getSuggestions(tenantId: string, cartItemIds: string[]) {
    if (!cartItemIds.length) return [];

    // Find co-occurring items from settled orders in last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Get orders that contain any of the cart items
    const ordersWithCartItems = await this.prisma.order.findMany({
      where: {
        tenant_id: tenantId,
        status: 'SETTLED',
        settled_at: { gte: thirtyDaysAgo },
        order_items: { some: { item_id: { in: cartItemIds } } },
      },
      select: { id: true },
    });

    const orderIds = ordersWithCartItems.map((o) => o.id);
    if (!orderIds.length) return [];

    // Find other items that appear in those orders, excluding cart items
    const otherItems = await this.prisma.orderItem.groupBy({
      by: ['item_id'],
      where: {
        order_id: { in: orderIds },
        item_id: { notIn: cartItemIds },
        status: { not: 'VOID' },
      },
      _count: { item_id: true },
      orderBy: { _count: { item_id: 'desc' } },
      take: 3,
    });

    const itemIds = otherItems.map((i) => i.item_id);
    if (!itemIds.length) return [];

    const items = await this.prisma.item.findMany({
      where: {
        id: { in: itemIds },
        is_available: true,
        tenant_id: tenantId,
      },
      select: { id: true, name: true, base_price: true },
    });

    return items.map((item) => ({
      id: item.id,
      name: item.name,
      price: item.base_price,
      coCount:
        otherItems.find((oi) => oi.item_id === item.id)?._count.item_id ?? 0,
    }));
  }

  async trackAcceptance(
    tenantId: string,
    itemId: string,
    cartItemIds: string[],
  ) {
    // For now, just return success. In production, write to an analytics table.
    return { success: true, tracked: { tenantId, itemId, cartItemIds } };
  }
}
