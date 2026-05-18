"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrdersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const kds_gateway_1 = require("../kds/kds.gateway");
const floor_plan_gateway_1 = require("../floor-plan/floor-plan.gateway");
const inventory_service_1 = require("../inventory/inventory.service");
const audit_service_1 = require("../audit/audit.service");
let OrdersService = class OrdersService {
    prisma;
    kdsGateway;
    floorPlanGateway;
    inventoryService;
    auditService;
    constructor(prisma, kdsGateway, floorPlanGateway, inventoryService, auditService) {
        this.prisma = prisma;
        this.kdsGateway = kdsGateway;
        this.floorPlanGateway = floorPlanGateway;
        this.inventoryService = inventoryService;
        this.auditService = auditService;
    }
    async getDefaultOutlet(tenantId) {
        const outlet = await this.prisma.outlet.findFirst({
            where: { tenant_id: tenantId },
            select: { id: true },
        });
        if (!outlet)
            throw new common_1.BadRequestException('No outlet configured for this tenant.');
        return outlet.id;
    }
    async createOrder(tenantId, userId, dto, trainingSessionId) {
        const outletId = await this.getDefaultOutlet(tenantId);
        let queue_token_number;
        if (dto.order_type === 'TAKEAWAY' || dto.order_type === 'AGGREGATOR') {
            queue_token_number = await this.getNextTokenNumber(tenantId);
        }
        if (dto.order_type === 'DINE_IN' && !dto.table_id) {
            throw new common_1.BadRequestException('table_id is required for DINE_IN orders.');
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
                training_session_id: trainingSessionId || null,
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
    async addItems(tenantId, orderId, dto) {
        const order = await this.prisma.order.findFirst({
            where: { id: orderId, tenant_id: tenantId },
        });
        if (!order)
            throw new common_1.NotFoundException('Order not found.');
        if (['SETTLED', 'VOID'].includes(order.status)) {
            throw new common_1.BadRequestException('Cannot add items to a closed order.');
        }
        const newItems = await this.prisma.$transaction(dto.items.map((i) => this.prisma.orderItem.create({
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
        })));
        return { order_id: orderId, added_items: newItems };
    }
    async fireKot(tenantId, orderId, userId, itemIds) {
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
        if (!order)
            throw new common_1.NotFoundException('Order not found.');
        if (!order.order_items.length)
            throw new common_1.BadRequestException('No pending items to fire.');
        const stationGroups = new Map();
        order.order_items.forEach((oi) => {
            const station = oi.item.station_route;
            if (!stationGroups.has(station))
                stationGroups.set(station, []);
            stationGroups.get(station).push(oi);
        });
        const kots = [];
        for (const [station, stationItems] of stationGroups) {
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
            await this.prisma.orderItem.updateMany({
                where: { id: { in: stationItems.map((i) => i.id) } },
                data: { status: 'SENT_TO_KDS', kot_id: kot.id },
            });
            this.inventoryService.deductForKot(tenantId, kot.id).catch((e) => {
                console.error(`Inventory deduction failed for KOT ${kot.id}`, e);
            });
        }
        if (order.status === 'DRAFT') {
            const updatedOrder = await this.prisma.order.update({
                where: { id: orderId },
                data: { status: 'PLACED' },
            });
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
    async attachCustomer(tenantId, orderId, customerId) {
        return this.prisma.order.update({
            where: { id: orderId, tenant_id: tenantId },
            data: { customer_id: customerId },
        });
    }
    async getOrder(tenantId, orderId) {
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
        if (!order)
            throw new common_1.NotFoundException('Order not found.');
        return order;
    }
    async getCfdOrders(tenantId) {
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
    async getDispatchOrders(tenantId) {
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
    async getActiveOrderByTable(tenantId, tableId, trainingSessionId) {
        return this.prisma.order.findFirst({
            where: {
                tenant_id: tenantId,
                table_id: tableId,
                status: { notIn: ['SETTLED', 'VOID'] },
                training_session_id: trainingSessionId ? trainingSessionId : null,
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
    async getActiveOrders(tenantId, trainingSessionId) {
        return this.prisma.order.findMany({
            where: {
                tenant_id: tenantId,
                status: { notIn: ['SETTLED', 'VOID'] },
                training_session_id: trainingSessionId ? trainingSessionId : null,
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
    async voidOrder(tenantId, orderId, reason, userId) {
        const order = await this.prisma.order.findFirst({
            where: { id: orderId, tenant_id: tenantId },
            select: { id: true, table_id: true, status: true },
        });
        if (!order)
            throw new common_1.NotFoundException('Order not found.');
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
    async voidItem(tenantId, orderId, itemId, userId) {
        const order = await this.prisma.order.findFirst({
            where: { id: orderId, tenant_id: tenantId },
            select: { id: true },
        });
        if (!order)
            throw new common_1.NotFoundException('Order not found.');
        const item = await this.prisma.orderItem.findFirst({
            where: { id: itemId, order_id: orderId },
            include: { item: { select: { name: true } } },
        });
        if (!item)
            throw new common_1.NotFoundException('Item not found.');
        await this.prisma.orderItem.update({
            where: { id: itemId },
            data: { status: 'VOID' },
        });
        return { job_id: `void-${itemId}`, undo_window_ms: 0 };
    }
    async holdItems(tenantId, orderId, itemIds) {
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
    async fireHeldItems(tenantId, orderId, userId, courseNumber) {
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
            throw new common_1.BadRequestException('No held items found for this order/course.');
        }
        const itemIds = heldItems.map((i) => i.id);
        await this.prisma.orderItem.updateMany({
            where: { id: { in: itemIds } },
            data: { fire_status: 'FIRED' },
        });
        return this.fireKot(tenantId, orderId, userId, itemIds);
    }
    async openTab(tenantId, orderId, tabName) {
        return this.prisma.order.update({
            where: { id: orderId, tenant_id: tenantId },
            data: { is_tab_open: true, tab_name: tabName },
        });
    }
    async getOpenTabs(tenantId) {
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
    async getLastRound(tenantId, orderId) {
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
    async getNextTokenNumber(tenantId) {
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
    async transferOrder(tenantId, orderId, newTableId) {
        const order = await this.prisma.order.findFirst({
            where: { id: orderId, tenant_id: tenantId },
            include: { table: true },
        });
        if (!order)
            throw new common_1.NotFoundException('Order not found.');
        if (['SETTLED', 'VOID'].includes(order.status)) {
            throw new common_1.BadRequestException('Cannot transfer a settled or voided order.');
        }
        if (order.table_id === newTableId) {
            throw new common_1.BadRequestException('Order is already assigned to this table.');
        }
        const newTable = await this.prisma.table.findFirst({
            where: { id: newTableId, tenant_id: tenantId },
        });
        if (!newTable)
            throw new common_1.NotFoundException('Target table not found.');
        if (newTable.status !== 'AVAILABLE') {
            throw new common_1.BadRequestException('Target table is not available.');
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
    async loadTemplate(tenantId, historyId) {
        const history = await this.prisma.customerOrderHistory.findFirst({
            where: { id: historyId, tenant_id: tenantId },
        });
        if (!history) {
            throw new common_1.NotFoundException('Order template not found');
        }
        const snapshot = history.order_snapshot;
        const validItems = [];
        const skippedItems = [];
        if (snapshot?.items && Array.isArray(snapshot.items)) {
            for (const item of snapshot.items) {
                const existingItem = await this.prisma.item.findUnique({
                    where: { id: item.item_id },
                    include: {
                        variants: true,
                        addons: true,
                        modifier_groups: { include: { modifiers: true } },
                    },
                });
                if (!existingItem || !existingItem.is_available) {
                    skippedItems.push(item.name || item.item_id);
                    continue;
                }
                let variant = undefined;
                if (item.variant_id) {
                    variant = existingItem.variants.find((v) => v.id === item.variant_id);
                }
                const validAddons = [];
                if (item.addons && Array.isArray(item.addons)) {
                    for (const addon of item.addons) {
                        const existingAddon = existingItem.addons.find((a) => a.id === addon.id);
                        if (existingAddon && existingAddon.is_available) {
                            validAddons.push({
                                id: existingAddon.id,
                                name: existingAddon.name,
                                price: existingAddon.price,
                            });
                        }
                    }
                }
                validItems.push({
                    item_id: existingItem.id,
                    name: existingItem.name,
                    unit_price: existingItem.base_price + (variant?.additional_price ?? 0),
                    quantity: item.quantity ?? 1,
                    variant_id: variant?.id ?? null,
                    variant_name: variant?.name ?? null,
                    notes: item.notes ?? '',
                    course_number: item.course_number ?? 1,
                    seat_number: item.seat_number ?? null,
                    addons: validAddons,
                    addons_total: validAddons.reduce((s, a) => s + a.price, 0),
                });
            }
        }
        return {
            items: validItems,
            skipped: skippedItems,
            original_total: snapshot?.total ?? 0,
        };
    }
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        kds_gateway_1.KdsGateway,
        floor_plan_gateway_1.FloorPlanGateway,
        inventory_service_1.InventoryService,
        audit_service_1.AuditService])
], OrdersService);
//# sourceMappingURL=orders.service.js.map