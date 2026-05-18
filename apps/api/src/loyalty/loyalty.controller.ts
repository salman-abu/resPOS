import {
  Controller,
  Post,
  Get,
  Patch,
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

  // ─── MOD-02: Fetch balance + stamps by phone ───────────────────────────
  @Roles(Role.OWNER, Role.MANAGER, Role.CASHIER)
  @Get('loyalty/:phone')
  async getLoyaltyByPhone(@Req() req: any, @Param('phone') phone: string) {
    const tenantId = req.tenantId;
    return this.loyaltyService.getAccountByPhone(tenantId, phone);
  }

  // ─── MOD-02: Stamp Card CRUD ────────────────────────────────────────────
  @Roles(Role.OWNER)
  @Post('stamp-cards')
  async createStampCard(@Req() req: any, @Body() body: any) {
    return this.loyaltyService.createStampCard(req.tenantId, body);
  }

  @Roles(Role.OWNER, Role.MANAGER)
  @Get('stamp-cards')
  async listStampCards(@Req() req: any) {
    return this.loyaltyService.listStampCards(req.tenantId);
  }

  @Roles(Role.OWNER)
  @Patch('stamp-cards/:id/toggle')
  async toggleStampCard(@Req() req: any, @Param('id') id: string) {
    return this.loyaltyService.toggleStampCard(req.tenantId, id);
  }

  // ─── MOD-02: Get loyalty config (read-only for cashier) ─────────────────
  @Roles(Role.OWNER, Role.MANAGER, Role.CASHIER)
  @Get('loyalty/config')
  async getConfig(@Req() req: any) {
    return this.loyaltyService.getConfig(req.tenantId);
  }
}
