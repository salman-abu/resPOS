import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Post,
  UseGuards,
} from '@nestjs/common';
import { SuperAdminService } from './superadmin.service';
import { SuperAdminLoginDto, UpdateSubscriptionDto } from './superadmin.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../auth/guards/super-admin.guard';

@Controller('super-admin')
@UseGuards(JwtAuthGuard, SuperAdminGuard)
export class SuperAdminController {
  constructor(private readonly superAdminService: SuperAdminService) {}

  @Post('auth/login')
  login(@Body() body: SuperAdminLoginDto) {
    return this.superAdminService.login(body.email, body.passwordString);
  }

  @Get('stats')
  getDashboardStats() {
    return this.superAdminService.getDashboardStats();
  }

  @Get('tenants')
  getAllTenants() {
    return this.superAdminService.getAllTenants();
  }

  @Patch('tenants/:id/status')
  toggleTenantStatus(
    @Param('id') id: string,
    @Body('is_active') is_active: boolean,
  ) {
    return this.superAdminService.toggleTenantStatus(id, is_active);
  }

  @Post('tenants/:id/impersonate')
  impersonateTenant(@Param('id') id: string) {
    return this.superAdminService.impersonateTenant(id);
  }

  @Patch('tenants/:id/subscription')
  updateTenantSubscription(
    @Param('id') id: string,
    @Body() body: UpdateSubscriptionDto,
  ) {
    return this.superAdminService.updateTenantSubscription(id, body);
  }
}
