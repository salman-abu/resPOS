import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Req,
  Query,
  UseGuards,
} from '@nestjs/common';
import { KioskService } from './kiosk.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

// ─── Public Kiosk Routes ──────────────────────────────────────────────────────

@Controller('kiosk')
export class KioskPublicController {
  constructor(private readonly kioskService: KioskService) {}

  @Get(':kioskId/init')
  async init(@Param('kioskId') kioskId: string) {
    return this.kioskService.getTerminalConfig(kioskId);
  }

  @Post(':kioskId/heartbeat')
  async heartbeat(@Param('kioskId') kioskId: string) {
    return this.kioskService.heartbeat(kioskId);
  }

  @Post(':kioskId/session/start')
  async startSession(
    @Param('kioskId') kioskId: string,
    @Body() body: { serviceType: string; language: string },
  ) {
    return this.kioskService.startSession(kioskId, body);
  }

  @Patch('session/:sessionId/cart')
  async updateCart(
    @Param('sessionId') sessionId: string,
    @Body() body: { cartSnapshot: any },
  ) {
    return this.kioskService.updateCart(sessionId, body);
  }

  @Get('session/:sessionId/upsell')
  async getUpsell(
    @Param('sessionId') sessionId: string,
    @Query('cartItemIds') cartItemIds: string,
  ) {
    const ids = cartItemIds ? cartItemIds.split(',') : [];
    return this.kioskService.getUpsellSuggestions(sessionId, ids);
  }

  @Post('session/:sessionId/payment/initiate')
  async initiatePayment(
    @Param('sessionId') sessionId: string,
    @Body() body: { paymentMethod: any; customerPhone?: string },
  ) {
    return this.kioskService.initiatePayment(sessionId, body);
  }

  @Post('session/:sessionId/payment/confirm')
  async confirmPayment(
    @Param('sessionId') sessionId: string,
    @Body()
    body: {
      razorpayPaymentId?: string;
      confirmedByCashierId?: string;
      cartSnapshot?: any;
    },
  ) {
    return this.kioskService.confirmPayment(sessionId, body);
  }

  @Post('session/:sessionId/abandon')
  async abandonSession(
    @Param('sessionId') sessionId: string,
    @Body() body: { reason: 'TIMEOUT' | 'USER_EXIT' },
  ) {
    return this.kioskService.abandonSession(sessionId, body.reason);
  }

  @Post(':kioskId/verify-pin')
  async verifyPin(
    @Param('kioskId') kioskId: string,
    @Body() body: { pin: string },
  ) {
    return this.kioskService.verifyPin(kioskId, body.pin);
  }
}

// ─── Owner Management Routes ──────────────────────────────────────────────────

@Controller('owner/kiosks')
@UseGuards(JwtAuthGuard, RolesGuard)
export class KioskOwnerController {
  constructor(private readonly kioskService: KioskService) {}

  @Roles(Role.OWNER, Role.MANAGER)
  @Get()
  async list(@Req() req: any) {
    return this.kioskService.listKiosks(req.tenantId);
  }

  @Roles(Role.OWNER, Role.MANAGER)
  @Post()
  async create(@Req() req: any, @Body() body: any) {
    return this.kioskService.createKiosk(req.tenantId, body);
  }

  @Roles(Role.OWNER, Role.MANAGER)
  @Patch(':kioskId')
  async update(
    @Req() req: any,
    @Param('kioskId') kioskId: string,
    @Body() body: any,
  ) {
    return this.kioskService.updateKiosk(req.tenantId, kioskId, body);
  }

  @Roles(Role.OWNER, Role.MANAGER)
  @Patch(':kioskId/status')
  async updateStatus(
    @Req() req: any,
    @Param('kioskId') kioskId: string,
    @Body('status') status: any,
  ) {
    return this.kioskService.updateKioskStatus(req.tenantId, kioskId, status);
  }

  @Roles(Role.OWNER, Role.MANAGER)
  @Get(':kioskId/analytics')
  async getAnalytics(
    @Req() req: any,
    @Param('kioskId') kioskId: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.kioskService.getAnalytics(
      req.tenantId,
      kioskId,
      new Date(from),
      new Date(to),
    );
  }
}
