import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { KdsGateway } from '../kds/kds.gateway';
import type { OrderEvent } from '@respos/types';

@Injectable()
export class SyncService {
  constructor(
    private prisma: PrismaService,
    private kdsGateway: KdsGateway,
  ) {}

  async syncEvents(tenantId: string, events: OrderEvent[]) {
    // Sort by client_timestamp ascending (causal order)
    const sorted = [...events].sort(
      (a, b) => a.client_timestamp - b.client_timestamp,
    );

    const results: {
      order_id: string;
      applied: boolean;
      error_code?: string;
      invoice?: unknown;
    }[] = [];

    // Group by order_id
    const byOrder = new Map<string, OrderEvent[]>();
    for (const ev of sorted) {
      if (!byOrder.has(ev.order_id)) byOrder.set(ev.order_id, []);
      byOrder.get(ev.order_id)!.push(ev);
    }

    for (const [orderId, orderEvents] of byOrder) {
      const result = await this.applyOrderEvents(
        tenantId,
        orderId,
        orderEvents,
      );
      results.push(result);
    }

    // Return canonical states for all affected orders
    const canonicalStates: Record<string, unknown> = {};
    for (const r of results) {
      if (r.applied) {
        const order = await this.prisma.order.findUnique({
          where: { id: r.order_id },
          include: { order_items: true },
        });
        if (order) {
          canonicalStates[r.order_id] = order;
          // Broadcast canonical state to all devices subscribed to this order
          this.kdsGateway.emitOrderState(tenantId, r.order_id, order);
        }
      }
    }

    return {
      processed: results.filter((r) => r.applied).length,
      conflicts: results.filter((r) => !r.applied),
      canonical_state: canonicalStates,
    };
  }

  private async applyOrderEvents(
    tenantId: string,
    orderId: string,
    events: OrderEvent[],
  ) {
    // Fetch current order state
    let order = await this.prisma.order.findFirst({
      where: { id: orderId, tenant_id: tenantId },
      include: { order_items: true },
    });

    // If order doesn't exist, create a DRAFT order (only if first event is ITEM_ADDED or ORDER_PLACED)
    if (!order) {
      const firstEvent = events[0];
      if (
        firstEvent.event_type === 'ITEM_ADDED' ||
        firstEvent.event_type === 'ORDER_PLACED'
      ) {
        const orderType =
          (firstEvent.payload.order_type as string) || 'DINE_IN';
        order = await this.prisma.order.create({
          data: {
            tenant_id: tenantId,
            outlet_id: await this.getDefaultOutlet(tenantId),
            order_type: orderType as any,
            status: 'DRAFT',
            pax_count: (firstEvent.payload.pax_count as number) || 1,
            table_id: (firstEvent.payload.table_id as string) || null,
            order_items: { create: [] },
          },
          include: { order_items: true },
        });
      } else {
        return {
          order_id: orderId,
          applied: false,
          error_code: 'ORDER_NOT_FOUND',
        };
      }
    }

    // order is now guaranteed non-null
    const existingOrder = order;

    // Check if order is already closed (SETTLED or VOID)
    const isClosed =
      existingOrder.status === 'SETTLED' || existingOrder.status === 'VOID';

    for (const ev of events) {
      // Conflict: any modification on a closed order (except no-ops)
      if (
        isClosed &&
        [
          'ITEM_ADDED',
          'ITEM_UPDATED',
          'DISCOUNT_APPLIED',
          'TABLE_CHANGED',
          'COURSE_FIRED',
        ].includes(ev.event_type)
      ) {
        const invoice = await this.prisma.invoice.findFirst({
          where: { order_id: orderId },
        });
        return {
          order_id: orderId,
          applied: false,
          error_code: 'CONFLICT_ORDER_CLOSED',
          invoice,
        };
      }

      try {
        await this.applySingleEvent(existingOrder, ev);
      } catch (err: any) {
        console.error(`Failed to apply event ${ev.id}:`, err);
        // Continue applying remaining events — partial application
      }
    }

    return { order_id: orderId, applied: true };
  }

  private async applySingleEvent(order: any, event: OrderEvent) {
    const p = event.payload;

    switch (event.event_type) {
      case 'ITEM_ADDED':
        await this.prisma.orderItem.create({
          data: {
            order_id: order.id,
            item_id: p.item_id as string,
            variant_id: (p.variant_id as string) || null,
            quantity: (p.quantity as number) || 1,
            unit_price: (p.unit_price as number) || 0,
            notes: (p.notes as string) || null,
            course_number: (p.course_number as number) || 1,
            status: 'PENDING',
          },
        });
        break;

      case 'ITEM_REMOVED': {
        // LWW: if multiple devices fire ITEM_REMOVED, last one wins by timestamp
        // We already sorted by client_timestamp, so this application order is canonical
        const itemId = p.item_id as string;
        await this.prisma.orderItem.updateMany({
          where: {
            order_id: order.id,
            item_id: itemId,
            status: { not: 'VOID' },
          },
          data: { status: 'VOID' },
        });
        break;
      }

      case 'ITEM_UPDATED': {
        const itemId = p.item_id as string;
        const data: any = {};
        if (p.quantity !== undefined) data.quantity = p.quantity as number;
        if (p.notes !== undefined) data.notes = p.notes as string;
        if (p.course_number !== undefined)
          data.course_number = p.course_number as number;
        if (Object.keys(data).length > 0) {
          await this.prisma.orderItem.updateMany({
            where: {
              order_id: order.id,
              item_id: itemId,
              status: { not: 'VOID' },
            },
            data,
          });
        }
        break;
      }

      case 'DISCOUNT_APPLIED':
        await this.prisma.order.update({
          where: { id: order.id },
          data: {
            // Discount is applied at invoice generation time; store in order metadata if needed
          },
        });
        break;

      case 'TABLE_CHANGED':
        await this.prisma.order.update({
          where: { id: order.id },
          data: { table_id: (p.table_id as string) || null },
        });
        break;

      case 'ORDER_PLACED':
        await this.prisma.order.update({
          where: { id: order.id },
          data: { status: 'PLACED' },
        });
        break;

      case 'COURSE_FIRED': {
        const courseNumber = (p.course_number as number) || 2;
        await this.prisma.orderItem.updateMany({
          where: {
            order_id: order.id,
            course_number: courseNumber,
            status: 'PENDING',
          },
          data: { status: 'SENT_TO_KDS' },
        });
        break;
      }

      case 'ORDER_SETTLED':
        await this.prisma.order.update({
          where: { id: order.id },
          data: { status: 'SETTLED', settled_at: new Date() },
        });
        break;

      default:
        break;
    }
  }

  private async getDefaultOutlet(tenantId: string): Promise<string> {
    const outlet = await this.prisma.outlet.findFirst({
      where: { tenant_id: tenantId },
      select: { id: true },
    });
    if (!outlet) throw new BadRequestException('No outlet found for tenant');
    return outlet.id;
  }
}
