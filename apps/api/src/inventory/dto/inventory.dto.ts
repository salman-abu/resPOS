import { IsString, IsNumber, IsEnum, Min, IsOptional } from 'class-validator';
import { IngredientUnit } from '@prisma/client';

export class CreateIngredientDto {
  @IsString()
  name: string;

  @IsEnum(IngredientUnit)
  unit: IngredientUnit;

  @IsNumber()
  @Min(0)
  current_stock: number;

  @IsNumber()
  @Min(0)
  reorder_level: number;

  @IsNumber()
  @Min(0)
  cost_per_unit: number;
}

export class UpdateStockDto {
  @IsNumber()
  stock_adjustment: number;

  @IsOptional()
  @IsString()
  reason?: string;
}
