import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto, AddItemsToOrderDto } from './dto/order.dto';
import { $Enums } from '@prisma/client';
import { KdsGateway } from '../kds/kds.gateway';
import { FloorPlanGateway } from '../floor-plan/floor-plan.gateway';
import { InventoryService } from '../inventory/inventory.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private kdsGateway: KdsGateway,
    private floorPlanGateway: FloorPlanGateway,
    private inventoryService: InventoryService,
    private auditService: AuditService,
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

    // Generate queue token for QSR flows
    let queue_token_number: number | undefined;
    if (dto.order_type === 'TAKEAWAY' || dto.order_type === 'AGGREGATOR') {
      queue_token_number = await this.getNextTokenNumber(tenantId);
    }

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
        customer_id: dto.customer_id,
        order_name: dto.order_name,
        brand_id: dto.brand_id,
        source: dto.source,
        queue_token_number,
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
            fire_status: i.fire_status ?? 'FIRED',
            seat_number: i.seat_number,
            addons: i.addons?.length
              ? {
                  create: i.addons.map((a) => ({
                    addon_id: a.id,
                    name: a.name,
                    price: a.price,
                    modifier_id: a.modifier_id,
                  })),
                }
              : undefined,
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
      this.floorPlanGateway.emitTableStatusChanged(tenantId, {
        id: dto.table_id,
        status: 'OCCUPIED',
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
            fire_status: i.fire_status ?? 'FIRED',
            seat_number: i.seat_number,
            addons: i.addons?.length
              ? {
                  create: i.addons.map((a) => ({
                    addon_id: a.id,
                    name: a.name,
                    price: a.price,
                    modifier_id: a.modifier_id,
                  })),
                }
              : undefined,
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
            fire_status: 'FIRED',
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
          seat_number: i.seat_number,
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

    // Update order status if it was DRAFT
    if (order.status === 'DRAFT') {
      const updatedOrder = await this.prisma.order.update({
        where: { id: orderId },
        data: { status: 'PLACED' },
      });

      // Emit to CFD
      this.kdsGateway.emitOrderUpdate(tenantId, {
        id: orderId,
        status: 'PLACED',
        token: updatedOrder.queue_token_number,
        name: updatedOrder.order_name,
      });
    }

    return {
      order_id: orderId,
      table_number: order.table?.table_number,
      kots,
    };
  }

  // ─── Attach Customer ──────────────────────────────────────────────────────
  async attachCustomer(tenantId: string, orderId: string, customerId: string) {
    return this.prisma.order.update({
      where: { id: orderId, tenant_id: tenantId },
      data: { customer_id: customerId },
    });
  }

  // ─── Get Order ─────────────────────────────────────────────────────────────
  async getOrder(tenantId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, tenant_id: tenantId },
      include: {
        order_items: {
          include: {
            item: {
              select: {
                name: true,
                item_type: true,
                station_route: true,
                tax_slab: true,
              },
            },
            variant: true,
            addons: true,
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

  async getCfdOrders(tenantId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.prisma.order.findMany({
      where: {
        tenant_id: tenantId,
        created_at: { gte: today },
        status: { in: ['PLACED', 'PREPARING', 'READY'] },
        queue_token_number: { not: null },
      },
      select: {
        id: true,
        status: true,
        queue_token_number: true,
        order_name: true,
      },
      orderBy: { created_at: 'asc' },
    });
  }

  async getDispatchOrders(tenantId: string) {
    return this.prisma.order.findMany({
      where: {
        tenant_id: tenantId,
        status: { in: ['PLACED', 'PREPARING', 'READY'] },
        order_type: { in: ['TAKEAWAY', 'AGGREGATOR', 'DELIVERY', 'ONLINE'] },
      },
      include: {
        order_items: {
          include: {
            item: {
              select: { name: true, category: { select: { name: true } } },
            },
            variant: true,
            addons: true,
          },
        },
        customer: true,
      },
      orderBy: { created_at: 'desc' },
    });
  }

  // ─── Get Active Order By Table ──────────────────────────────────────────────
  async getActiveOrderByTable(tenantId: string, tableId: string) {
    return this.prisma.order.findFirst({
      where: {
        tenant_id: tenantId,
        table_id: tableId,
        status: { notIn: ['SETTLED', 'VOID'] },
      },
      include: {
        order_items: {
          include: {
            item: {
              select: {
                name: true,
                item_type: true,
                station_route: true,
                base_price: true,
                tax_slab: true,
              },
            },
            variant: true,
            addons: true,
          },
        },
        table: { select: { table_number: true } },
      },
      orderBy: { created_at: 'desc' },
    });
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
          select: {
            id: true,
            quantity: true,
            status: true,
            unit_price: true,
            item: { select: { name: true } },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  // ─── Void Order ─────────────────────────────────────────────────────────────
  async voidOrder(
    tenantId: string,
    orderId: string,
    reason: string,
    userId: string,
  ) {
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
      this.floorPlanGateway.emitTableStatusChanged(tenantId, {
        id: order.table_id,
        status: 'DIRTY',
      });
    }

    // Audit Log
    await this.auditService.log({
      tenantId,
      action: 'VOID_BILL',
      entityType: 'ORDER',
      entityId: orderId,
      performedBy: userId,
      reason,
      oldValue: { status: order.status },
      newValue: { status: 'VOID' },
    });

    return { success: true };
  }

  // ─── Void Item ──────────────────────────────────────────────────────────────
  async voidItem(
    tenantId: string,
    orderId: string,
    itemId: string,
    userId: string,
  ) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, tenant_id: tenantId },
      select: { id: true },
    });
    if (!order) throw new NotFoundException('Order not found.');

    const item = await this.prisma.orderItem.findFirst({
      where: { id: itemId, order_id: orderId },
      include: { item: { select: { name: true } } },
    });
    if (!item) throw new NotFoundException('Item not found.');

    await this.prisma.orderItem.update({
      where: { id: itemId },
      data: { status: 'VOID' },
    });

    // Currently synchronous, return dummy job_id
    return { job_id: `void-${itemId}`, undo_window_ms: 0 };
  }

  // ─── Phase 3: Course Management ──────────────────────────────────────────
  async holdItems(tenantId: string, orderId: string, itemIds: string[]) {
    await this.prisma.orderItem.updateMany({
      where: {
        order_id: orderId,
        id: { in: itemIds },
        status: 'PENDING',
      },
      data: { fire_status: 'HELD' },
    });
    return { success: true };
  }

  async fireHeldItems(
    tenantId: string,
    orderId: string,
    userId: string,
    courseNumber?: number,
  ) {
    const heldItems = await this.prisma.orderItem.findMany({
      where: {
        order_id: orderId,
        fire_status: 'HELD',
        status: 'PENDING',
        ...(courseNumber ? { course_number: courseNumber } : {}),
      },
      select: { id: true },
    });

    if (heldItems.length === 0) {
      throw new BadRequestException(
        'No held items found for this order/course.',
      );
    }

    const itemIds = heldItems.map((i) => i.id);

    // 1. Mark as FIRED
    await this.prisma.orderItem.updateMany({
      where: { id: { in: itemIds } },
      data: { fire_status: 'FIRED' },
    });

    // 2. Trigger fireKot
    return this.fireKot(tenantId, orderId, userId, itemIds);
  }

  // ─── Phase 4: Bar Tabs ──────────────────────────────────────────────────
  async openTab(tenantId: string, orderId: string, tabName: string) {
    return this.prisma.order.update({
      where: { id: orderId, tenant_id: tenantId },
      data: { is_tab_open: true, tab_name: tabName },
    });
  }

  async getOpenTabs(tenantId: string) {
    return this.prisma.order.findMany({
      where: {
        tenant_id: tenantId,
        is_tab_open: true,
        status: { notIn: ['SETTLED', 'VOID'] },
      },
      include: {
        table: { select: { table_number: true } },
        order_items: {
          include: {
            item: true,
            variant: true,
            addons: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async getLastRound(tenantId: string, orderId: string) {
    const lastKot = await this.prisma.kOT.findFirst({
      where: { order_id: orderId, tenant_id: tenantId },
      orderBy: { printed_at: 'desc' },
      include: {
        items: {
          include: {
            item: true,
            variant: true,
            addons: true,
          },
        },
      },
    });
    return lastKot?.items || [];
  }

  async getNextTokenNumber(tenantId: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const count = await this.prisma.order.count({
      where: {
        tenant_id: tenantId,
        created_at: { gte: today },
      },
    });
    return count + 1;
  }

  // ─── Transfer Order ────────────────────────────────────────────────────────
  async transferOrder(tenantId: string, orderId: string, newTableId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, tenant_id: tenantId },
      include: { table: true },
    });
    if (!order) throw new NotFoundException('Order not found.');
    if (['SETTLED', 'VOID'].includes(order.status)) {
      throw new BadRequestException(
        'Cannot transfer a settled or voided order.',
      );
    }

    if (order.table_id === newTableId) {
      throw new BadRequestException('Order is already assigned to this table.');
    }

    const newTable = await this.prisma.table.findFirst({
      where: { id: newTableId, tenant_id: tenantId },
    });
    if (!newTable) throw new NotFoundException('Target table not found.');
    if (newTable.status !== 'AVAILABLE') {
      throw new BadRequestException('Target table is not available.');
    }

    const oldTableId = order.table_id;

    await this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: { table_id: newTableId },
      });

      await tx.table.update({
        where: { id: newTableId },
        data: { status: 'OCCUPIED', current_order_id: orderId },
      });

      if (oldTableId) {
        const otherActiveOrders = await tx.order.count({
          where: {
            tenant_id: tenantId,
            table_id: oldTableId,
            status: { notIn: ['SETTLED', 'VOID'] },
            id: { not: orderId },
          },
        });

        if (otherActiveOrders === 0) {
          await tx.table.update({
            where: { id: oldTableId },
            data: { status: 'AVAILABLE', current_order_id: null },
          });
        }
      }
    });

    if (oldTableId) {
      this.floorPlanGateway.emitTableStatusChanged(tenantId, {
        id: oldTableId,
        status: 'AVAILABLE',
      });
    }
    this.floorPlanGateway.emitTableStatusChanged(tenantId, {
      id: newTableId,
      status: 'OCCUPIED',
    });

    return { success: true, order_id: orderId, new_table_id: newTableId };
  }
}
