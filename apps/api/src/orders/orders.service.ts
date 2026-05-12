import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto, AddItemsToOrderDto } from './dto/order.dto';
import { $Enums } from '@prisma/client';
import { KdsGateway } from '../kds/kds.gateway';
import { InventoryService } from '../inventory/inventory.service';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private kdsGateway: KdsGateway,
    private inventoryService: InventoryService,
  ) {}

  // ─── Outlet Helper ─────────────────────────────────────────────────────────
  private async getDefaultOutlet(tenantId: string): Promise<string> {
    const outlet = await this.prisma.outlet.findFirst({
      where: { tenant_id: tenantId },
      select: { id: true },
    });
    if (!outlet)
      throw new BadRequestException('No outlet configured for this tenant.');
    return outlet.id;
  }

  // ─── Create Order ──────────────────────────────────────────────────────────
  async createOrder(tenantId: string, userId: string, dto: CreateOrderDto) {
    const outletId = await this.getDefaultOutlet(tenantId);

    // Validate table if dine-in
    if (dto.order_type === 'DINE_IN' && !dto.table_id) {
      throw new BadRequestException('table_id is required for DINE_IN orders.');
    }

    const order = await this.prisma.order.create({
      data: {
        tenant_id: tenantId,
        outlet_id: outletId,
        order_type: dto.order_type,
        table_id: dto.table_id,
        pax_count: dto.pax_count,
        waiter_id: userId,
        status: 'DRAFT',
        order_items: {
          create: dto.items.map((i) => ({
            item_id: i.item_id,
            variant_id: i.variant_id,
            quantity: i.quantity,
            unit_price: i.unit_price,
            notes: i.notes,
            course_number: i.course_number ?? 1,
            status: 'PENDING',
          })),
        },
      },
      include: {
        order_items: {
          include: {
            item: { select: { name: true, station_route: true } },
            variant: true,
          },
        },
        table: { select: { table_number: true } },
      },
    });

    // Update table status to OCCUPIED
    if (dto.table_id) {
      await this.prisma.table.update({
        where: { id: dto.table_id },
        data: { status: 'OCCUPIED', current_order_id: order.id },
      });
    }

    return order;
  }

  // ─── Add Items to Existing Order ──────────────────────────────────────────
  async addItems(tenantId: string, orderId: string, dto: AddItemsToOrderDto) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, tenant_id: tenantId },
    });
    if (!order) throw new NotFoundException('Order not found.');
    if (['SETTLED', 'VOID'].includes(order.status)) {
      throw new BadRequestException('Cannot add items to a closed order.');
    }

    const newItems = await this.prisma.$transaction(
      dto.items.map((i) =>
        this.prisma.orderItem.create({
          data: {
            order_id: orderId,
            item_id: i.item_id,
            variant_id: i.variant_id,
            quantity: i.quantity,
            unit_price: i.unit_price,
            notes: i.notes,
            course_number: i.course_number ?? 1,
            status: 'PENDING',
          },
          include: {
            item: { select: { name: true, station_route: true } },
            variant: true,
          },
        }),
      ),
    );

    return { order_id: orderId, added_items: newItems };
  }

  // ─── Fire KOT ─────────────────────────────────────────────────────────────
  async fireKot(
    tenantId: string,
    orderId: string,
    userId: string,
    itemIds: string[],
  ) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, tenant_id: tenantId },
      include: {
        order_items: {
          where: {
            id: { in: itemIds },
            status: 'PENDING',
          },
          include: {
            item: { select: { name: true, station_route: true } },
            variant: { select: { name: true } },
          },
        },
        table: { select: { table_number: true } },
      },
    });

    if (!order) throw new NotFoundException('Order not found.');
    if (!order.order_items.length)
      throw new BadRequestException('No pending items to fire.');

    // Group items by station_route
    const stationGroups = new Map<
      $Enums.StationRoute,
      typeof order.order_items
    >();
    order.order_items.forEach((oi) => {
      const station = oi.item.station_route;
      if (!stationGroups.has(station)) stationGroups.set(station, []);
      stationGroups.get(station)!.push(oi);
    });

    const kots: any[] = [];

    for (const [station, stationItems] of stationGroups) {
      // Generate KOT number (date + sequence)
      const kotCount = await this.prisma.kOT.count({
        where: { tenant_id: tenantId },
      });
      const kotNumber = `KOT-${String(kotCount + 1).padStart(4, '0')}`;

      const kot = await this.prisma.kOT.create({
        data: {
          tenant_id: tenantId,
          order_id: orderId,
          kot_number: kotNumber,
          station: station,
          status: 'PRINTED',
          printed_at: new Date(),
          fired_by_id: userId,
          items: {
            connect: stationItems.map((i) => ({ id: i.id })),
          },
        },
        include: {
          items: {
            include: {
              item: { select: { name: true } },
              variant: { select: { name: true } },
            },
          },
        },
      });

      kots.push(kot);

      // ── Emit to KDS via WebSocket ──
      this.kdsGateway.emitNewKot(tenantId, station, {
        id: kot.id,
        kot_number: kot.kot_number,
        station: kot.station,
        status: 'PRINTED',
        order_id: orderId,
        order_type: order.order_type,
        table_number: order.table?.table_number,
        pax_count: order.pax_count,
        created_at: new Date().toISOString(),
        items: kot.items.map((i) => ({
          id: i.id,
          name: i.item.name,
          variant: i.variant?.name,
          quantity: i.quantity,
          notes: i.notes,
          status: i.status,
        })),
      });

      // Update order item statuses to SENT_TO_KDS
      await this.prisma.orderItem.updateMany({
        where: { id: { in: stationItems.map((i) => i.id) } },
        data: { status: 'SENT_TO_KDS', kot_id: kot.id },
      });

      // ── Deduct Inventory ──
      // This runs asynchronously so it doesn't block the critical path
      this.inventoryService.deductForKot(tenantId, kot.id).catch((e) => {
        console.error(`Inventory deduction failed for KOT ${kot.id}`, e);
      });
    }

    // Update order status to PLACED (first KOT fire)
    if (order.status === 'DRAFT') {
      await this.prisma.order.update({
        where: { id: orderId },
        data: { status: 'PLACED' },
      });
    }

    return {
      order_id: orderId,
      table_number: order.table?.table_number,
      kots,
    };
  }

  // ─── Get Order ─────────────────────────────────────────────────────────────
  async getOrder(tenantId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, tenant_id: tenantId },
      include: {
        order_items: {
          include: {
            item: {
              select: { name: true, item_type: true, station_route: true },
            },
            variant: true,
          },
        },
        kots: { include: { items: true } },
        table: true,
        invoices: { include: { payments: true } },
      },
    });
    if (!order) throw new NotFoundException('Order not found.');
    return order;
  }

  // ─── Get Active Orders ──────────────────────────────────────────────────────
  async getActiveOrders(tenantId: string) {
    return this.prisma.order.findMany({
      where: {
        tenant_id: tenantId,
        status: { notIn: ['SETTLED', 'VOID'] },
      },
      include: {
        table: { select: { table_number: true } },
        order_items: {
          select: { id: true, quantity: true, status: true, unit_price: true },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  // ─── Void Order ─────────────────────────────────────────────────────────────
  async voidOrder(tenantId: string, orderId: string, reason: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, tenant_id: tenantId },
      select: { id: true, table_id: true, status: true },
    });
    if (!order) throw new NotFoundException('Order not found.');

    await this.prisma.order.update({
      where: { id: orderId },
      data: { status: 'VOID' },
    });

    if (order.table_id) {
      await this.prisma.table.update({
        where: { id: order.table_id },
        data: { status: 'DIRTY', current_order_id: null },
      });
    }

    return { success: true };
  }
}
