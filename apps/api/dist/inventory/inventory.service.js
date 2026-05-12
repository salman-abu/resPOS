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
var InventoryService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let InventoryService = InventoryService_1 = class InventoryService {
    prisma;
    logger = new common_1.Logger(InventoryService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getIngredients(tenantId) {
        return this.prisma.ingredient.findMany({
            where: { tenant_id: tenantId },
            orderBy: { name: 'asc' }
        });
    }
    async createIngredient(tenantId, dto) {
        return this.prisma.ingredient.create({
            data: {
                tenant_id: tenantId,
                name: dto.name,
                unit: dto.unit,
                current_stock: dto.current_stock,
                reorder_level: dto.reorder_level,
                cost_per_unit: dto.cost_per_unit,
            }
        });
    }
    async updateStock(tenantId, ingredientId, dto, userId) {
        const ingredient = await this.prisma.ingredient.findFirst({
            where: { id: ingredientId, tenant_id: tenantId }
        });
        if (!ingredient)
            throw new common_1.NotFoundException('Ingredient not found');
        const newStock = Math.max(0, ingredient.current_stock + dto.stock_adjustment);
        return this.prisma.$transaction(async (tx) => {
            const updated = await tx.ingredient.update({
                where: { id: ingredientId },
                data: { current_stock: newStock }
            });
            if (dto.reason) {
                this.logger.log(`Stock adjusted manually. Reason: ${dto.reason}`);
            }
            return updated;
        });
    }
    async deductForKot(tenantId, kotId) {
        const kot = await this.prisma.kOT.findFirst({
            where: { id: kotId, tenant_id: tenantId },
            include: {
                items: {
                    include: {
                        item: {
                            include: { recipes: true }
                        }
                    }
                }
            }
        });
        if (!kot) {
            this.logger.error(`KOT not found for deduction: ${kotId}`);
            return;
        }
        const deductions = new Map();
        for (const orderItem of kot.items) {
            const qty = orderItem.quantity;
            const recipes = orderItem.item.recipes;
            for (const recipe of recipes) {
                const totalUsed = recipe.quantity_used * qty;
                const current = deductions.get(recipe.ingredient_id) || 0;
                deductions.set(recipe.ingredient_id, current + totalUsed);
            }
        }
        if (deductions.size === 0)
            return;
        try {
            await this.prisma.$transaction(async (tx) => {
                for (const [ingredientId, amountToDeduct] of deductions.entries()) {
                    await tx.ingredient.update({
                        where: { id: ingredientId },
                        data: {
                            current_stock: { decrement: amountToDeduct }
                        }
                    });
                }
            });
            this.logger.log(`Inventory deducted for KOT ${kot.kot_number}`);
        }
        catch (e) {
            this.logger.error(`Failed to deduct inventory for KOT ${kot.kot_number}`, e);
        }
    }
};
exports.InventoryService = InventoryService;
exports.InventoryService = InventoryService = InventoryService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], InventoryService);
//# sourceMappingURL=inventory.service.js.map