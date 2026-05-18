import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UpsellService } from './upsell.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('upsell')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UpsellController {
  constructor(private readonly upsellService: UpsellService) {}

  @Roles(Role.OWNER, Role.MANAGER, Role.CASHIER)
  @Get('suggestions')
  async getSuggestions(@Req() req: any, @Query('cartItems') cartItems: string) {
    const ids = cartItems ? cartItems.split(',').filter(Boolean) : [];
    return this.upsellService.getSuggestions(req.tenantId, ids);
  }

  @Roles(Role.OWNER, Role.MANAGER, Role.CASHIER)
  @Post('accepted')
  async trackAcceptance(
    @Req() req: any,
    @Body() body: { itemId: string; cartItemIds: string[] },
  ) {
    return this.upsellService.trackAcceptance(
      req.tenantId,
      body.itemId,
      body.cartItemIds,
    );
  }
}
