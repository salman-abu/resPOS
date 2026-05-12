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
exports.KdsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const kds_gateway_1 = require("./kds.gateway");
let KdsService = class KdsService {
    prisma;
    kdsGateway;
    constructor(prisma, kdsGateway) {
        this.prisma = prisma;
        this.kdsGateway = kdsGateway;
    }
    async getActiveKots(tenantId, station) {
        return this.prisma.kOT.findMany({
            where: {
                tenant_id: tenantId,
                status: { in: ['PRINTED', 'PREPARING'] },
                ...(station && station !== 'ALL' ? { station: station } : {}),
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
    async markItemDone(tenantId, kotId, orderItemId, done) {
        const kot = await this.prisma.kOT.findFirst({
            where: { id: kotId, tenant_id: tenantId },
            include: {
                items: true,
            },
        });
        if (!kot)
            throw new common_1.NotFoundException('KOT not found');
        const itemBelongs = kot.items.some((i) => i.id === orderItemId);
        if (!itemBelongs)
            throw new common_1.BadRequestException('Item not in this KOT');
        await this.prisma.orderItem.update({
            where: { id: orderItemId },
            data: { status: done ? 'READY' : 'SENT_TO_KDS' },
        });
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
        }
        else if (done) {
            await this.prisma.kOT.update({
                where: { id: kotId },
                data: { status: 'PREPARING' },
            });
            this.kdsGateway.emitKotStatus(tenantId, kot.station, {
                kot_id: kotId,
                status: 'PREPARING',
            });
        }
        this.kdsGateway.emitItemDone(tenantId, kot.station, {
            kot_id: kotId,
            item_id: orderItemId,
            done,
        });
        return { success: true, all_done: allDone };
    }
    async bumpKot(tenantId, kotId) {
        const kot = await this.prisma.kOT.findFirst({
            where: { id: kotId, tenant_id: tenantId },
            include: { items: true },
        });
        if (!kot)
            throw new common_1.NotFoundException('KOT not found');
        await this.prisma.orderItem.updateMany({
            where: { kot_id: kotId },
            data: { status: 'SERVED' },
        });
        await this.prisma.kOT.update({
            where: { id: kotId },
            data: { status: 'READY' },
        });
        const order = await this.prisma.order.findFirst({
            where: { id: kot.order_id },
            include: {
                order_items: { select: { status: true } },
            },
        });
        if (order) {
            const allServed = order.order_items.every((oi) => ['SERVED', 'VOID'].includes(oi.status));
            if (allServed) {
                await this.prisma.order.update({
                    where: { id: order.id },
                    data: { status: 'SERVED' },
                });
            }
        }
        this.kdsGateway.emitKotBumped(tenantId, kot.station, kotId);
        return { success: true, kot_id: kotId };
    }
    async recallKot(tenantId, kotId) {
        const kot = await this.prisma.kOT.findFirst({
            where: { id: kotId, tenant_id: tenantId },
        });
        if (!kot)
            throw new common_1.NotFoundException('KOT not found');
        await this.prisma.kOT.update({
            where: { id: kotId },
            data: { status: 'PREPARING' },
        });
        await this.prisma.orderItem.updateMany({
            where: { kot_id: kotId },
            data: { status: 'SENT_TO_KDS' },
        });
        const recalled = await this.getKotById(tenantId, kotId);
        this.kdsGateway.emitNewKot(tenantId, kot.station, {
            ...recalled,
            recalled: true,
        });
        return { success: true };
    }
    async getKotById(tenantId, kotId) {
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
};
exports.KdsService = KdsService;
exports.KdsService = KdsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        kds_gateway_1.KdsGateway])
], KdsService);
//# sourceMappingURL=kds.service.js.map