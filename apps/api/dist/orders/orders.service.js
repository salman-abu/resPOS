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
const inventory_service_1 = require("../inventory/inventory.service");
let OrdersService = class OrdersService {
    prisma;
    kdsGateway;
    inventoryService;
    constructor(prisma, kdsGateway, inventoryService) {
        this.prisma = prisma;
        this.kdsGateway = kdsGateway;
        this.inventoryService = inventoryService;
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
    async createOrder(tenantId, userId, dto) {
        const outletId = await this.getDefaultOutlet(tenantId);
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
                    include: { item: { select: { name: true, station_route: true } }, variant: true },
                },
                table: { select: { table_number: true } },
            },
        });
        if (dto.table_id) {
            await this.prisma.table.update({
                where: { id: dto.table_id },
                data: { status: 'OCCUPIED', current_order_id: order.id },
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
            },
            include: { item: { select: { name: true, station_route: true } }, variant: true },
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
            const kotCount = await this.prisma.kOT.count({ where: { tenant_id: tenantId } });
            const kotNumber = `KOT-${String(kotCount + 1).padStart(4, '0')}`;
            const kot = await this.prisma.kOT.create({
                data: {
                    tenant_id: tenantId,
                    order_id: orderId,
                    kot_number: kotNumber,
                    station,
                    status: 'PRINTED',
                    printed_at: new Date(),
                    fired_by_id: userId,
                    items: {
                        connect: stationItems.map((i) => ({ id: i.id })),
                    },
                },
                include: {
                    items: {
                        include: { item: { select: { name: true } }, variant: { select: { name: true } } },
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
                items: kot.items.map(i => ({
                    id: i.id,
                    name: i.item.name,
                    variant: i.variant?.name,
                    quantity: i.quantity,
                    notes: i.notes,
                    status: i.status,
                })),
            });
            await this.prisma.orderItem.updateMany({
                where: { id: { in: stationItems.map((i) => i.id) } },
                data: { status: 'SENT_TO_KDS', kot_id: kot.id },
            });
            this.inventoryService.deductForKot(tenantId, kot.id).catch(e => {
                console.error(`Inventory deduction failed for KOT ${kot.id}`, e);
            });
        }
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
    async getOrder(tenantId, orderId) {
        const order = await this.prisma.order.findFirst({
            where: { id: orderId, tenant_id: tenantId },
            include: {
                order_items: {
                    include: {
                        item: { select: { name: true, item_type: true, station_route: true } },
                        variant: true,
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
    async getActiveOrders(tenantId) {
        return this.prisma.order.findMany({
            where: {
                tenant_id: tenantId,
                status: { notIn: ['SETTLED', 'VOID'] },
            },
            include: {
                table: { select: { table_number: true } },
                order_items: { select: { id: true, quantity: true, status: true, unit_price: true } },
            },
            orderBy: { created_at: 'desc' },
        });
    }
    async voidOrder(tenantId, orderId, reason) {
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
        }
        return { success: true };
    }
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        kds_gateway_1.KdsGateway,
        inventory_service_1.InventoryService])
], OrdersService);
//# sourceMappingURL=orders.service.js.map