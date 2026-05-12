import { $Enums } from '@prisma/client';
export declare class CreateIngredientDto {
    name: string;
    unit: $Enums.IngredientUnit;
    current_stock: number;
    reorder_level: number;
    cost_per_unit: number;
}
export declare class UpdateStockDto {
    stock_adjustment: number;
    reason?: string;
}
