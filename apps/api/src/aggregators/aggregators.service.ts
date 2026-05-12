import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrdersService } from '../orders/orders.service';
import { $Enums } from '@prisma/client';

@Injectable()
export class AggregatorsService {
  private readonly logger = new Logger(AggregatorsService.name);

  constructor(
    private prisma: PrismaService,
    private ordersService: OrdersService,
  ) {}

  /**
   * Generic webhook handler for Swiggy/Zomato etc.
   * Expects payload: { external_order_id: string, items: [{ aggregator_item_id: string, quantity: number }] }
   */
  async handleWebhook(
    tenantId: string,
    aggregator: $Enums.AggregatorSource,
    payload: any,
  ) {
    this.logger.log(
      `Received ${aggregator} webhook for tenant ${tenantId}. Ref: ${payload.external_order_id}`,
    );

    // Get the primary outlet
    const outlet = await this.prisma.outlet.findFirst({
      where: { tenant_id: tenantId },
    });
    if (!outlet)
      throw new BadRequestException('No outlet found for this tenant.');

    // Find an owner/manager to act as the "system user" for firing KOTs
    const systemUser = await this.prisma.user.findFirst({
      where: { tenant_id: tenantId, role: { in: ['OWNER', 'MANAGER'] } },
    });

    // 1. Map aggregator items to internal POS items
    const orderItems: {
      item_id: string;
      quantity: number;
      unit_price: number;
    }[] = [];
    for (const item of payload.items) {
      const mapping = await this.prisma.aggregatorMenu.findFirst({
        where: {
          tenant_id: tenantId,
          aggregator,
          aggregator_item_id: item.aggregator_item_id,
        },
      });

      if (!mapping) {
        this.logger.warn(
          `Unmapped aggregator item ID: ${item.aggregator_item_id}. Skipping.`,
        );
        continue;
      }

      const internalItem = await this.prisma.item.findUnique({
        where: { id: mapping.pos_item_id },
      });
      if (!internalItem) continue;

      orderItems.push({
        item_id: internalItem.id,
        quantity: item.quantity,
        unit_price:
          mapping.aggregator_price > 0
            ? mapping.aggregator_price
            : internalItem.base_price,
      });
    }

    if (orderItems.length === 0) {
      throw new BadRequestException(
        'Order rejected: No valid mapped items found.',
      );
    }

    // 2. Create the Order
    const order = await this.prisma.order.create({
      data: {
        tenant_id: tenantId,
        outlet_id: outlet.id,
        order_type: 'AGGREGATOR',
        status: 'PLACED',
        aggregator_source: aggregator,
        external_ref: payload.external_order_id,
        order_items: {
          create: orderItems.map((i) => ({
            item_id: i.item_id,
            quantity: i.quantity,
            unit_price: i.unit_price,
            status: 'PENDING',
          })),
        },
      },
      include: { order_items: true },
    });

    // 3. Automatically Fire KOT
    if (systemUser && order.order_items.length > 0) {
      try {
        const itemIds = order.order_items.map((i) => i.id);
        await this.ordersService.fireKot(
          tenantId,
          order.id,
          systemUser.id,
          itemIds,
        );
        this.logger.log(`Fired KOT for aggregator order ${order.id}`);
      } catch (err) {
        this.logger.error(
          `Failed to fire KOT for aggregator order ${order.id}`,
          err,
        );
      }
    }

    return {
      success: true,
      order_id: order.id,
      external_ref: payload.external_order_id,
      message: 'Order ingested and KOT fired successfully',
    };
  }

  // ─── Menu Sync Helpers ───────────────────────────────────────────────────

  async syncMenu(tenantId: string, aggregator: $Enums.AggregatorSource) {
    // In a real system, we'd push the internal menu to the aggregator via API.
    // For now, we'll just return the mapped menu.
    const mappings = await this.prisma.aggregatorMenu.findMany({
      where: { tenant_id: tenantId, aggregator },
      include: {
        tenant: {
          select: {
            items: {
              select: {
                id: true,
                name: true,
                base_price: true,
                is_available: true,
              },
            },
          },
        },
      },
    });

    return { success: true, count: mappings.length, aggregator };
  }
}
