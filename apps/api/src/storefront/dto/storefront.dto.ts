import {
  IsString,
  IsArray,
  IsOptional,
  IsInt,
  Min,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

export class OnlineOrderItemDto {
  @IsString()
  itemId: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class CreateOnlineOrderDto {
  @IsString()
  customerName: string;

  @IsString()
  customerPhone: string;

  @IsString()
  deliveryAddress: string;

  @IsArray()
  @Type(() => OnlineOrderItemDto)
  items: OnlineOrderItemDto[];
}

export class UpdateStorefrontSettingsDto {
  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;

  @IsOptional()
  theme?: Record<string, any>;

  @IsOptional()
  deliveryZones?: Array<{ label: string; fee: number; minOrder: number }>;

  @IsString()
  @IsOptional()
  restaurantName?: string;

  @IsString()
  @IsOptional()
  logoUrl?: string;

  @IsString()
  @IsOptional()
  description?: string;
}
