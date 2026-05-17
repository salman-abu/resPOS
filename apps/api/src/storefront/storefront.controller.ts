import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Req,
  UseGuards,
  Query,
} from '@nestjs/common';
import { StorefrontService } from './storefront.service';
import {
  CreateOnlineOrderDto,
  UpdateStorefrontSettingsDto,
} from './dto/storefront.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role, OnlineTrackingStatus } from '@prisma/client';

@Controller()
export class StorefrontController {
  constructor(private readonly storefrontService: StorefrontService) {}

  // ─── PUBLIC ENDPOINTS (no auth) ──────────────────────────────────────────

  /** GET /storefront/:slug/menu — Customer views menu */
  @Get('storefront/:slug/menu')
  async getMenu(@Param('slug') slug: string) {
    return this.storefrontService.getMenuBySlug(slug);
  }

  /** POST /storefront/:slug/order — Customer places order (COD) */
  @Post('storefront/:slug/order')
  async createOrder(
    @Param('slug') slug: string,
    @Body() dto: CreateOnlineOrderDto,
  ) {
    return this.storefrontService.createOrder(slug, dto);
  }

  /** GET /storefront/:slug/track/:orderId — Customer tracks their order */
  @Get('storefront/:slug/track/:orderId')
  async trackOrder(
    @Param('slug') slug: string,
    @Param('orderId') orderId: string,
  ) {
    return this.storefrontService.trackOrder(slug, orderId);
  }

  // ─── ADMIN ENDPOINTS (JWT required) ─────────────────────────────────────

  /** GET /online/orders — Owner sees all online orders */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.MANAGER)
  @Get('online/orders')
  async getOnlineOrders(@Req() req: any) {
    return this.storefrontService.getOrders(req.tenantId);
  }

  /** PATCH /online/orders/:id/tracking — Update order tracking status */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.MANAGER, Role.CASHIER)
  @Patch('online/orders/:id/tracking')
  async updateTracking(
    @Req() req: any,
    @Param('id') orderId: string,
    @Body('status') status: OnlineTrackingStatus,
  ) {
    return this.storefrontService.updateTrackingStatus(
      req.tenantId,
      orderId,
      status,
    );
  }

  /** PATCH /online/settings/:slug — Manage storefront settings */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.MANAGER)
  @Patch('online/settings/:slug')
  async updateSettings(
    @Req() req: any,
    @Param('slug') slug: string,
    @Query('outletId') outletId: string,
    @Body() dto: UpdateStorefrontSettingsDto,
  ) {
    return this.storefrontService.upsertSettings(
      req.tenantId,
      outletId,
      slug,
      dto,
    );
  }
}
