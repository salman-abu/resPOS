import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { SyncService } from './sync.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { OrderEvent } from '@respos/types';

@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @UseGuards(JwtAuthGuard)
  @Post('events')
  async syncEvents(@Req() req: any, @Body() body: { events: OrderEvent[] }) {
    const tenantId = req.user.tenantId;
    if (!tenantId) {
      return { error: 'Tenant ID required' };
    }

    const result = await this.syncService.syncEvents(tenantId, body.events);

    // Broadcast canonical state via Socket.io (handled by OrdersService or KdsGateway)
    // The KdsGateway will emit order updates in a follow-up step

    return result;
  }
}
