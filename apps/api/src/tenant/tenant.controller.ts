import { Controller, Get, Patch, Body, Req, UseGuards } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('tenant')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Roles(Role.OWNER, Role.MANAGER)
  @Get('settings')
  async getSettings(@Req() req: any) {
    return this.tenantService.getSettings(req.tenantId);
  }

  @Roles(Role.OWNER) // Only owners should change global settings
  @Patch('settings')
  async updateSettings(@Req() req: any, @Body() body: any) {
    return this.tenantService.updateSettings(req.tenantId, body);
  }

  @Roles(Role.OWNER, Role.MANAGER, Role.CASHIER)
  @Get('settings/fssai')
  async getFssaiSettings(@Req() req: any) {
    return this.tenantService.getFssaiSettings(req.tenantId);
  }

  @Roles(Role.OWNER)
  @Patch('settings/fssai')
  async updateFssaiSettings(
    @Req() req: any,
    @Body() body: { licence_number: string; expiry_date: string },
  ) {
    return this.tenantService.updateFssaiSettings(
      req.tenantId,
      body.licence_number,
      body.expiry_date,
    );
  }
}
