import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { KdsGateway } from './kds.gateway';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class KdsService {
  constructor(
    private prisma: PrismaService,
    private kdsGateway: KdsGateway,
    private auditService: AuditService,
  ) {}

  // ─── Get Active KOTs for a tenant (initial load) ──────────────────────────
  async getActiveKots(tenantId: string, station?: string) {
    return this.prisma.kOT.findMany({
      where: {
        tenant_id: tenantId,
        status: { in: ['PRINTED', 'PREPARING'] },
        ...(station && station !== 'ALL' ? { station: station as any } : {}),
      },
      include: {
        order: {
          select: {
            order_type: true,
            pax_count: true,
            table: { select: { table_number: true } },
          },
        },
        items: {
          include: {
            item: { select: { name: true } },
            variant: { select: { name: true } },
          },
        },
      },
      orderBy: { printed_at: 'asc' },
    });
  }

  // ─── Mark individual order item as done ───────────────────────────────────
  async markItemDone(
    tenantId: string,
    kotId: string,
    orderItemId: string,
    done: boolean,
  ) {
    // Verify KOT belongs to tenant
    const kot = await this.prisma.kOT.findFirst({
      where: { id: kotId, tenant_id: tenantId },
      include: {
        items: true,
      },
    });
    if (!kot) throw new NotFoundException('KOT not found');

    const itemBelongs = kot.items.some((i) => i.id === orderItemId);
    if (!itemBelongs) throw new BadRequestException('Item not in this KOT');

    // Update order item status
    await this.prisma.orderItem.update({
      where: { id: orderItemId },
      data: { status: done ? 'READY' : 'SENT_TO_KDS' },
    });

    // Check if all items in KOT are done → update KOT status
    const allDone = kot.items
      .map((i) => (i.id === orderItemId ? done : i.status === 'READY'))
      .every(Boolean);

    if (allDone) {
      await this.prisma.kOT.update({
        where: { id: kotId },
        data: { status: 'READY' },
      });
      this.kdsGateway.emitKotStatus(tenantId, kot.station, {
        kot_id: kotId,
        status: 'READY',
      });
    } else if (done) {
      await this.prisma.kOT.update({
        where: { id: kotId },
        data: { status: 'PREPARING' },
      });
      this.kdsGateway.emitKotStatus(tenantId, kot.station, {
        kot_id: kotId,
        status: 'PREPARING',
      });
    }

    // Emit item done event
    this.kdsGateway.emitItemDone(tenantId, kot.station, {
      kot_id: kotId,
      item_id: orderItemId,
      done,
    });

    // CFD Logic: Check if all items in the ENTIRE order are READY
    const order = await this.prisma.order.findUnique({
      where: { id: kot.order_id },
      include: { order_items: { select: { status: true } } },
    });

    if (order) {
      const allReady = order.order_items.every((oi) =>
        ['READY', 'SERVED', 'VOID'].includes(oi.status),
      );
      if (allReady) {
        await this.prisma.order.update({
          where: { id: order.id },
          data: { status: 'READY' },
        });

        // Fetch full order for CFD (with token/name)
        const fullOrder = await this.prisma.order.findUnique({
          where: { id: order.id },
        });
        this.kdsGateway.emitOrderUpdate(tenantId, {
          id: order.id,
          status: 'READY',
          token: fullOrder?.queue_token_number,
          name: fullOrder?.order_name,
        });
      } else if (done) {
        // Just PREPARING
        const fullOrder = await this.prisma.order.findUnique({
          where: { id: order.id },
        });
        this.kdsGateway.emitOrderUpdate(tenantId, {
          id: order.id,
          status: 'PREPARING',
          token: fullOrder?.queue_token_number,
          name: fullOrder?.order_name,
        });
      }
    }

    return { success: true, all_done: allDone };
  }

  // ─── Bump KOT (mark served, remove from display) ─────────────────────────
  async bumpKot(tenantId: string, kotId: string) {
    const kot = await this.prisma.kOT.findFirst({
      where: { id: kotId, tenant_id: tenantId },
      include: { items: true },
    });
    if (!kot) throw new NotFoundException('KOT not found');

    // Mark all items SERVED
    await this.prisma.orderItem.updateMany({
      where: { kot_id: kotId },
      data: { status: 'SERVED' },
    });

    // Mark KOT as READY (bumped off screen)
    await this.prisma.kOT.update({
      where: { id: kotId },
      data: { status: 'READY' },
    });

    // Check if all KOTs in the order are served → update order status
    const order = await this.prisma.order.findFirst({
      where: { id: kot.order_id },
      include: {
        order_items: { select: { status: true } },
      },
    });

    if (order) {
      const allServed = order.order_items.every((oi) =>
        ['SERVED', 'VOID'].includes(oi.status),
      );
      if (allServed) {
        await this.prisma.order.update({
          where: { id: order.id },
          data: { status: 'SERVED' },
        });

        // Notify CFD that it's served (remove from screen)
        this.kdsGateway.emitOrderUpdate(tenantId, {
          id: order.id,
          status: 'SERVED',
        });
      }
    }

    // Emit bump event
    this.kdsGateway.emitKotBumped(tenantId, kot.station, kotId);

    return { success: true, kot_id: kotId };
  }

  // ─── Recall bumped KOT (undo bump) ───────────────────────────────────────
  async recallKot(tenantId: string, userId: string, kotId: string) {
    const kot = await this.prisma.kOT.findFirst({
      where: { id: kotId, tenant_id: tenantId },
    });
    if (!kot) throw new NotFoundException('KOT not found');

    await this.prisma.kOT.update({
      where: { id: kotId },
      data: { status: 'PREPARING' },
    });

    await this.prisma.orderItem.updateMany({
      where: { kot_id: kotId },
      data: { status: 'SENT_TO_KDS' },
    });

    // Re-emit as new KOT
    const recalled = await this.getKotById(tenantId, kotId);
    this.kdsGateway.emitNewKot(tenantId, kot.station, {
      ...recalled,
      recalled: true,
    });

    await this.auditService
      .log({
        tenantId,
        action: 'DELETE_KOT',
        entityType: 'KOT',
        entityId: kotId,
        performedBy: userId,
        reason: 'KOT recalled to PREPARING',
        oldValue: { status: kot.status },
        newValue: { status: 'PREPARING' },
      })
      .catch(() => {});

    return { success: true };
  }

  private async getKotById(tenantId: string, kotId: string) {
    return this.prisma.kOT.findFirst({
      where: { id: kotId, tenant_id: tenantId },
      include: {
        order: {
          select: {
            order_type: true,
            pax_count: true,
            table: { select: { table_number: true } },
          },
        },
        items: {
          include: {
            item: { select: { name: true } },
            variant: { select: { name: true } },
          },
        },
      },
    });
  }
}
