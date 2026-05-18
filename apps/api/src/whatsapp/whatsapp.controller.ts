import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Req,
  UseGuards,
  Headers,
  UnauthorizedException,
  Query,
} from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import * as crypto from 'crypto';

@Controller('webhooks')
export class WhatsappWebhookController {
  constructor(private readonly whatsappService: WhatsappService) {}

  /** POST /api/webhooks/whatsapp — WABA inbound webhook */
  @Post('whatsapp')
  async handleWebhook(
    @Body() body: any,
    @Headers('x-hub-signature-256') signature256?: string,
    @Headers('x-hub-signature') signature?: string,
  ) {
    // Verify signature if configured with App Secret
    const appSecret = process.env.WABA_APP_SECRET;
    const activeSignature = signature256 || signature;

    if (appSecret && activeSignature) {
      try {
        const parts = activeSignature.split('=');
        const sigHash = parts[1] || parts[0];
        const algorithm = activeSignature.startsWith('sha256=')
          ? 'sha256'
          : 'sha1';
        const expectedHash = crypto
          .createHmac(algorithm, appSecret)
          .update(JSON.stringify(body))
          .digest('hex');

        if (sigHash !== expectedHash) {
          throw new UnauthorizedException('Invalid webhook signature');
        }
      } catch (err) {
        throw new UnauthorizedException('Signature verification failed');
      }
    }

    // WABA Cloud API payload structure
    const entry = body?.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const message = value?.messages?.[0];

    if (!message) {
      return { status: 'ignored' };
    }

    const phone = message.from;
    const text = message.text?.body || '';

    // Determine tenant from phone number mapping
    const phoneId = value?.metadata?.phone_number_id;
    const tenantId = phoneId
      ? await this.whatsappService.findTenantByPhoneId(phoneId)
      : 'default';

    const result = await this.whatsappService.handleInboundMessage(
      tenantId,
      phone,
      text,
    );

    return {
      status: 'processed',
      reply: result.reply,
      state: result.state || null,
    };
  }

  /** WhatsApp verification challenge for webhook setup */
  @Get('whatsapp')
  async verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
  ) {
    if (mode === 'subscribe' && token === process.env.WABA_VERIFY_TOKEN) {
      return challenge;
    }
    throw new UnauthorizedException('Invalid verify token');
  }
}

@Controller('tables')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TableQrController {
  constructor(private readonly whatsappService: WhatsappService) {}

  @Roles(Role.OWNER)
  @Post(':tableId/qr-token')
  async regenerateToken(@Req() req: any, @Param('tableId') tableId: string) {
    return this.whatsappService.regenerateQrToken(req.tenantId, tableId);
  }

  @Roles(Role.OWNER, Role.MANAGER, Role.CASHIER)
  @Get(':tableId/qr-token')
  async getToken(@Req() req: any, @Param('tableId') tableId: string) {
    return this.whatsappService.getQrToken(req.tenantId, tableId);
  }
}

@Controller('whatsapp')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WhatsappAdminController {
  constructor(private readonly whatsappService: WhatsappService) {}

  @Roles(Role.OWNER, Role.MANAGER)
  @Get('sessions')
  async listSessions(@Req() req: any) {
    return this.whatsappService.listActiveSessions(req.tenantId);
  }
}
