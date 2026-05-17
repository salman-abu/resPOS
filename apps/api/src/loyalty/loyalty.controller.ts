import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Req,
  UseGuards,
  Query,
} from '@nestjs/common';
import { LoyaltyService } from './loyalty.service';
import {
  UpdateLoyaltyConfigDto,
  EarnLoyaltyDto,
  RedeemLoyaltyDto,
} from './dto/loyalty.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class LoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  @Roles(Role.OWNER, Role.MANAGER)
  @Post('loyalty/config')
  async updateConfig(@Req() req: any, @Body() dto: UpdateLoyaltyConfigDto) {
    const tenantId = req.tenantId;
    return this.loyaltyService.updateConfig(tenantId, dto);
  }

  @Roles(Role.OWNER, Role.MANAGER, Role.CASHIER)
  @Post('loyalty/earn')
  async earnPoints(@Req() req: any, @Body() dto: EarnLoyaltyDto) {
    const tenantId = req.tenantId;
    return this.loyaltyService.triggerEarnPoints(tenantId, dto);
  }

  @Roles(Role.OWNER, Role.MANAGER, Role.CASHIER)
  @Post('loyalty/redeem')
  async redeemPoints(@Req() req: any, @Body() dto: RedeemLoyaltyDto) {
    const tenantId = req.tenantId;
    return this.loyaltyService.redeemPoints(tenantId, dto);
  }

  @Roles(Role.OWNER, Role.MANAGER, Role.CASHIER)
  @Get('customers/search')
  async searchCustomers(@Req() req: any, @Query('q') query: string) {
    const tenantId = req.tenantId;
    return this.loyaltyService.searchCustomers(tenantId, query);
  }

  @Roles(Role.OWNER, Role.MANAGER, Role.CASHIER)
  @Get('customers/:id/loyalty')
  async getCustomerLoyalty(@Req() req: any, @Param('id') customerId: string) {
    const tenantId = req.tenantId;
    return this.loyaltyService.getCustomerLoyalty(tenantId, customerId);
  }
}
