import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { DisplayService } from './display.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('display')
export class DisplayController {
  constructor(private readonly displayService: DisplayService) {}

  @Get(':tenantSlug/menu')
  async getMenu(@Param('tenantSlug') tenantSlug: string) {
    return this.displayService.getMenuForDisplay(tenantSlug);
  }

  @Get(':tenantSlug/banner')
  async getBanner(@Param('tenantSlug') tenantSlug: string) {
    return this.displayService.getBanner(tenantSlug);
  }

  @Roles(Role.OWNER, Role.MANAGER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('special-banner')
  async setBanner(
    @Req() req: any,
    @Body() body: { text: string; imageUrl?: string },
  ) {
    return this.displayService.setBanner(
      req.tenantId,
      body.text,
      body.imageUrl,
    );
  }

  @Roles(Role.OWNER, Role.MANAGER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete('special-banner')
  async clearBanner(@Req() req: any) {
    return this.displayService.clearBanner(req.tenantId);
  }
}
