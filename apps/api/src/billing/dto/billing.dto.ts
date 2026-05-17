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

// ─── Generate Invoice DTO ─────────────────────────────────────────────────────

export class GenerateInvoiceDto {
  @IsUUID()
  order_id: string;

  /** Discount amount in paise */
  @IsOptional()
  @IsInt()
  @Min(0)
  discount?: number;

  @IsOptional()
  @IsEnum(['PERCENT', 'FLAT'])
  discount_type?: 'PERCENT' | 'FLAT';

  /** Manager/Owner ID who approved the discount */
  @IsOptional()
  @IsString()
  discount_approved_by?: string;

  /** Service charge override in paise (0 = no charge) */
  @IsOptional()
  @IsInt()
  @Min(0)
  service_charge?: number;
}

// ─── Record Payment DTO ───────────────────────────────────────────────────────

export class RecordPaymentDto {
  @IsInt()
  @Min(1)
  amount: number;

  @IsEnum(['CASH', 'CARD', 'UPI', 'WALLET', 'COMPLIMENTARY'])
  method: 'CASH' | 'CARD' | 'UPI' | 'WALLET' | 'COMPLIMENTARY';

  @IsOptional()
  @IsString()
  upi_ref?: string;

  @IsOptional()
  @IsString()
  transaction_id?: string;
}

// ─── Settle Invoice DTO ───────────────────────────────────────────────────────

export class SettleInvoiceDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecordPaymentDto)
  payments: RecordPaymentDto[];

  @IsOptional()
  @IsString()
  customer_id?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  redeem_points?: number;
}

// ─── Open Shift DTO ───────────────────────────────────────────────────────────

export class OpenShiftDto {
  @IsInt()
  @Min(0)
  opening_float: number;
}

// ─── Close Shift DTO ──────────────────────────────────────────────────────────

export class CloseShiftDto {
  @IsInt()
  @Min(0)
  closing_float: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  petty_cash?: number;
}
