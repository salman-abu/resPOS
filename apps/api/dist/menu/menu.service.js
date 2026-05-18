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
exports.MenuService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const menu_gateway_1 = require("./menu.gateway");
let MenuService = class MenuService {
    prisma;
    menuGateway;
    constructor(prisma, menuGateway) {
        this.prisma = prisma;
        this.menuGateway = menuGateway;
    }
    async syncMenu(tenantId) {
        this.menuGateway.emitMenuUpdated(tenantId);
        return { success: true, timestamp: Date.now() };
    }
    async getCategories(tenantId) {
        return this.prisma.category.findMany({
            where: { tenant_id: tenantId, is_active: true },
            orderBy: { sort_order: 'asc' },
            select: {
                id: true,
                name: true,
                sort_order: true,
                color: true,
                icon_url: true,
                is_active: true,
            },
        });
    }
    async createCategory(tenantId, name) {
        const maxOrder = await this.prisma.category.count({
            where: { tenant_id: tenantId },
        });
        return this.prisma.category.create({
            data: {
                tenant_id: tenantId,
                name,
                sort_order: maxOrder + 1,
                is_active: true,
            },
        });
    }
    async updateCategory(tenantId, id, name) {
        return this.prisma.category.update({
            where: { id },
            data: { name },
        });
    }
    async deleteCategory(tenantId, id) {
        return this.prisma.category.update({
            where: { id },
            data: { is_active: false },
        });
    }
    async getItems(tenantId, categoryId) {
        return this.prisma.item.findMany({
            where: {
                tenant_id: tenantId,
                ...(categoryId ? { category_id: categoryId } : {}),
            },
            orderBy: { sort_order: 'asc' },
            include: {
                category: { select: { id: true, name: true } },
                variants: true,
                addons: { where: { is_available: true } },
                modifier_groups: {
                    include: { modifiers: { orderBy: { sort_order: 'asc' } } },
                    orderBy: { sort_order: 'asc' },
                },
            },
        });
    }
    async createItem(tenantId, data) {
        const maxOrder = await this.prisma.item.count({
            where: { tenant_id: tenantId },
        });
        return this.prisma.item.create({
            data: {
                tenant_id: tenantId,
                name: data.name,
                description: data.description,
                base_price: data.price,
                category_id: data.category_id,
                is_available: true,
                sort_order: maxOrder + 1,
                item_type: data.item_type || 'VEG',
                tax_slab: 'GST_5',
                station_route: 'HOT_KITCHEN',
                modifier_groups: data.modifier_groups
                    ? {
                        create: data.modifier_groups.map((mg, i) => ({
                            name: mg.name,
                            is_required: mg.is_required,
                            min_select: mg.min_select,
                            max_select: mg.max_select,
                            sort_order: i,
                            modifiers: {
                                create: mg.modifiers.map((m, j) => ({
                                    name: m.name,
                                    price_adjustment: m.price_adjustment,
                                    sort_order: j,
                                })),
                            },
                        })),
                    }
                    : undefined,
            },
        });
    }
    async updateItem(tenantId, id, data) {
        const updateData = { ...data };
        if (data.price !== undefined) {
            updateData.base_price = data.price;
            delete updateData.price;
        }
        delete updateData.is_veg;
        delete updateData.is_spicy;
        delete updateData.is_bestseller;
        delete updateData.modifier_groups;
        if (data.modifier_groups) {
            await this.prisma.modifierGroup.deleteMany({ where: { item_id: id } });
            updateData.modifier_groups = {
                create: data.modifier_groups.map((mg, i) => ({
                    name: mg.name,
                    is_required: mg.is_required,
                    min_select: mg.min_select,
                    max_select: mg.max_select,
                    sort_order: i,
                    modifiers: {
                        create: mg.modifiers.map((m, j) => ({
                            name: m.name,
                            price_adjustment: m.price_adjustment,
                            sort_order: j,
                        })),
                    },
                })),
            };
        }
        return this.prisma.item.update({
            where: { id },
            data: updateData,
        });
    }
    async toggleAvailability(tenantId, itemId, is_available) {
        return this.prisma.item.update({
            where: { id: itemId },
            data: { is_available },
        });
    }
    async deleteItem(tenantId, id) {
        return this.prisma.item.update({
            where: { id },
            data: { is_available: false },
        });
    }
};
exports.MenuService = MenuService;
exports.MenuService = MenuService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        menu_gateway_1.MenuGateway])
], MenuService);
//# sourceMappingURL=menu.service.js.map