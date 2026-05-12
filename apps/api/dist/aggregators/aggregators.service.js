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
var AggregatorsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AggregatorsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const orders_service_1 = require("../orders/orders.service");
let AggregatorsService = AggregatorsService_1 = class AggregatorsService {
    prisma;
    ordersService;
    logger = new common_1.Logger(AggregatorsService_1.name);
    constructor(prisma, ordersService) {
        this.prisma = prisma;
        this.ordersService = ordersService;
    }
    async handleWebhook(tenantId, aggregator, payload) {
        this.logger.log(`Received ${aggregator} webhook for tenant ${tenantId}. Ref: ${payload.external_order_id}`);
        const outlet = await this.prisma.outlet.findFirst({ where: { tenant_id: tenantId } });
        if (!outlet)
            throw new common_1.BadRequestException('No outlet found for this tenant.');
        const systemUser = await this.prisma.user.findFirst({
            where: { tenant_id: tenantId, role: { in: ['OWNER', 'MANAGER'] } }
        });
        const orderItems = [];
        for (const item of payload.items) {
            const mapping = await this.prisma.aggregatorMenu.findFirst({
                where: { tenant_id: tenantId, aggregator, aggregator_item_id: item.aggregator_item_id },
            });
            if (!mapping) {
                this.logger.warn(`Unmapped aggregator item ID: ${item.aggregator_item_id}. Skipping.`);
                continue;
            }
            const internalItem = await this.prisma.item.findUnique({ where: { id: mapping.pos_item_id } });
            if (!internalItem)
                continue;
            orderItems.push({
                item_id: internalItem.id,
                quantity: item.quantity,
                unit_price: mapping.aggregator_price > 0 ? mapping.aggregator_price : internalItem.base_price,
            });
        }
        if (orderItems.length === 0) {
            throw new common_1.BadRequestException('Order rejected: No valid mapped items found.');
        }
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
            include: { order_items: true }
        });
        if (systemUser && order.order_items.length > 0) {
            try {
                const itemIds = order.order_items.map(i => i.id);
                await this.ordersService.fireKot(tenantId, order.id, systemUser.id, itemIds);
                this.logger.log(`Fired KOT for aggregator order ${order.id}`);
            }
            catch (err) {
                this.logger.error(`Failed to fire KOT for aggregator order ${order.id}`, err);
            }
        }
        return {
            success: true,
            order_id: order.id,
            external_ref: payload.external_order_id,
            message: 'Order ingested and KOT fired successfully'
        };
    }
    async syncMenu(tenantId, aggregator) {
        const mappings = await this.prisma.aggregatorMenu.findMany({
            where: { tenant_id: tenantId, aggregator },
            include: {
                tenant: { select: { items: { select: { id: true, name: true, base_price: true, is_available: true } } } }
            }
        });
        return { success: true, count: mappings.length, aggregator };
    }
};
exports.AggregatorsService = AggregatorsService;
exports.AggregatorsService = AggregatorsService = AggregatorsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        orders_service_1.OrdersService])
], AggregatorsService);
//# sourceMappingURL=aggregators.service.js.map