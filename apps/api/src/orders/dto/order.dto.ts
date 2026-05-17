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

export class CreateOrderItemAddonDto {
  @IsString()
  id: string;

  @IsString()
  name: string;

  @IsInt()
  price: number;

  @IsOptional()
  @IsString()
  modifier_id?: string;
}

export class CreateOrderItemDto {
  @IsString()
  item_id: string;

  @IsOptional()
  @IsString()
  variant_id?: string;

  @IsNumber()
  @Min(0.1)
  quantity: number;

  @IsInt()
  unit_price: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  course_number: number = 1;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemAddonDto)
  addons?: CreateOrderItemAddonDto[];

  @IsOptional()
  @IsEnum(['HELD', 'FIRED'])
  fire_status?: 'HELD' | 'FIRED';

  @IsOptional()
  @IsInt()
  @Min(1)
  seat_number?: number;
}

export class CreateOrderDto {
  @IsEnum(['DINE_IN', 'TAKEAWAY', 'DELIVERY', 'AGGREGATOR'])
  order_type: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY' | 'AGGREGATOR';

  @IsOptional()
  @IsString()
  table_id?: string;

  @IsOptional()
  @IsInt()
  pax_count?: number;

  @IsOptional()
  @IsString()
  customer_id?: string;

  @IsOptional()
  @IsString()
  order_name?: string;

  @IsOptional()
  @IsString()
  brand_id?: string;

  @IsOptional()
  @IsString()
  source?: string;

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
