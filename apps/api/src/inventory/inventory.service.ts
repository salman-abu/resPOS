import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateIngredientDto, UpdateStockDto } from './dto/inventory.dto';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(private prisma: PrismaService) {}

  // ─── Ingredient CRUD ────────────────────────────────────────────────────────

  async getIngredients(tenantId: string) {
    return this.prisma.ingredient.findMany({
      where: { tenant_id: tenantId },
      orderBy: { name: 'asc' },
    });
  }

  async createIngredient(tenantId: string, dto: CreateIngredientDto) {
    return this.prisma.ingredient.create({
      data: {
        tenant_id: tenantId,
        name: dto.name,
        unit: dto.unit,
        current_stock: dto.current_stock,
        reorder_level: dto.reorder_level,
        cost_per_unit: dto.cost_per_unit,
      },
    });
  }

  async updateStock(
    tenantId: string,
    ingredientId: string,
    dto: UpdateStockDto,
    userId: string,
  ) {
    const ingredient = await this.prisma.ingredient.findFirst({
      where: { id: ingredientId, tenant_id: tenantId },
    });
    if (!ingredient) throw new NotFoundException('Ingredient not found');

    const newStock = Math.max(
      0,
      ingredient.current_stock + dto.stock_adjustment,
    );

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.ingredient.update({
        where: { id: ingredientId },
        data: { current_stock: newStock },
      });

      // Optional: log to audit logs if manual adjustment
      if (dto.reason) {
        this.logger.log(`Stock adjusted manually. Reason: ${dto.reason}`);
      }

      return updated;
    });
  }

  // ─── Deduct Inventory automatically on KOT fire ──────────────────────────

  async deductForKot(tenantId: string, kotId: string) {
    // 1. Fetch the KOT and its items
    const kot = await this.prisma.kOT.findFirst({
      where: { id: kotId, tenant_id: tenantId },
      include: {
        items: {
          include: {
            item: {
              include: { recipes: true },
            },
          },
        },
      },
    });

    if (!kot) {
      this.logger.error(`KOT not found for deduction: ${kotId}`);
      return;
    }

    // 2. Aggregate deductions across all items in the KOT
    const deductions = new Map<string, number>();

    for (const orderItem of kot.items) {
      const qty = orderItem.quantity;
      const recipes = orderItem.item.recipes;

      for (const recipe of recipes) {
        const totalUsed = recipe.quantity_used * qty;
        const current = deductions.get(recipe.ingredient_id) || 0;
        deductions.set(recipe.ingredient_id, current + totalUsed);
      }
    }

    if (deductions.size === 0) return;

    // 3. Deduct stock using a transaction to avoid race conditions
    try {
      await this.prisma.$transaction(async (tx) => {
        for (const [ingredientId, amountToDeduct] of deductions.entries()) {
          // Decrement atomic operation
          await tx.ingredient.update({
            where: { id: ingredientId },
            data: {
              current_stock: { decrement: amountToDeduct },
            },
          });
        }
      });
      this.logger.log(`Inventory deducted for KOT ${kot.kot_number}`);
    } catch (e) {
      this.logger.error(
        `Failed to deduct inventory for KOT ${kot.kot_number}`,
        e,
      );
    }
  }
}
