import { PrismaService } from '../prisma/prisma.service';
import { CreateIngredientDto, UpdateStockDto } from './dto/inventory.dto';
export declare class InventoryService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    getIngredients(tenantId: string): Promise<{
        id: string;
        tenant_id: string;
        name: string;
        unit: import("@prisma/client").$Enums.IngredientUnit;
        current_stock: number;
        reorder_level: number;
        cost_per_unit: number;
    }[]>;
    createIngredient(tenantId: string, dto: CreateIngredientDto): Promise<{
        id: string;
        tenant_id: string;
        name: string;
        unit: import("@prisma/client").$Enums.IngredientUnit;
        current_stock: number;
        reorder_level: number;
        cost_per_unit: number;
    }>;
    updateStock(tenantId: string, ingredientId: string, dto: UpdateStockDto, userId: string): Promise<{
        id: string;
        tenant_id: string;
        name: string;
        unit: import("@prisma/client").$Enums.IngredientUnit;
        current_stock: number;
        reorder_level: number;
        cost_per_unit: number;
    }>;
    deductForKot(tenantId: string, kotId: string): Promise<void>;
}
