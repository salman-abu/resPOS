import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
  IsArray,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

// ─── Order DTOs ───────────────────────────────────────────────────────────────

export class CreateOrderItemDto {
  @IsUUID()
  item_id: string;

  @IsOptional()
  @IsUUID()
  variant_id?: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsInt()
  unit_price: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsInt()
  @Min(1)
  course_number: number = 1;
}

export class CreateOrderDto {
  @IsEnum(['DINE_IN', 'TAKEAWAY', 'DELIVERY', 'AGGREGATOR'])
  order_type: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY' | 'AGGREGATOR';

  @IsOptional()
  @IsUUID()
  table_id?: string;

  @IsOptional()
  @IsInt()
  pax_count?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}

// ─── KOT DTOs ─────────────────────────────────────────────────────────────────

export class FireKotDto {
  /** The order ID to fire KOT against */
  @IsUUID()
  order_id: string;

  /** Specific item cart line IDs that are being sent to kitchen */
  @IsArray()
  @IsString({ each: true })
  item_ids: string[];
}

// ─── Add Items to Existing Order ──────────────────────────────────────────────

export class AddItemsToOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}
