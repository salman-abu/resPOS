import { InventoryService } from './inventory.service';
import { CreateIngredientDto, UpdateStockDto } from './dto/inventory.dto';
export declare class InventoryController {
    private readonly inventoryService;
    constructor(inventoryService: InventoryService);
    getIngredients(req: any): Promise<{
        id: string;
        tenant_id: string;
        name: string;
        unit: import("@prisma/client").$Enums.IngredientUnit;
        current_stock: number;
        reorder_level: number;
        cost_per_unit: number;
    }[]>;
    createIngredient(req: any, dto: CreateIngredientDto): Promise<{
        id: string;
        tenant_id: string;
        name: string;
        unit: import("@prisma/client").$Enums.IngredientUnit;
        current_stock: number;
        reorder_level: number;
        cost_per_unit: number;
    }>;
    updateStock(req: any, id: string, dto: UpdateStockDto): Promise<{
        id: string;
        tenant_id: string;
        name: string;
        unit: import("@prisma/client").$Enums.IngredientUnit;
        current_stock: number;
        reorder_level: number;
        cost_per_unit: number;
    }>;
}
