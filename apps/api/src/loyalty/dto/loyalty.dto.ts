import { IsNumber, IsObject, IsNotEmpty, IsString } from 'class-validator';

export class UpdateLoyaltyConfigDto {
  @IsNumber()
  pointsPerRupee: number;

  @IsNumber()
  redeemThreshold: number;

  @IsObject()
  tierThresholds: Record<string, number>;
}

export class EarnLoyaltyDto {
  @IsString()
  @IsNotEmpty()
  customerId: string;

  @IsString()
  @IsNotEmpty()
  orderId: string;

  @IsNumber()
  amountSpent: number;
}

export class RedeemLoyaltyDto {
  @IsString()
  @IsNotEmpty()
  customerId: string;

  @IsNumber()
  points: number;
}
