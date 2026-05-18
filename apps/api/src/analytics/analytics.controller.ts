import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Roles(Role.OWNER, Role.MANAGER)
  @Get('dashboard-stats')
  async getDashboardStats(@Req() req: any) {
    return this.analyticsService.getDashboardStats(req.tenantId);
  }

  @Roles(Role.OWNER, Role.MANAGER)
  @Get('table-statuses')
  async getTableStatuses(@Req() req: any) {
    return this.analyticsService.getTableStatuses(req.tenantId);
  }

  @Roles(Role.OWNER, Role.MANAGER)
  @Get('forecast')
  async getForecast(@Req() req: any, @Query('days') days: string) {
    return this.analyticsService.getForecast(
      req.tenantId,
      days ? parseInt(days) : 7,
    );
  }

  @Roles(Role.OWNER, Role.MANAGER)
  @Get('top-sellers')
  async getTopSellers(
    @Req() req: any,
    @Query('period') period: 'week' | 'month',
  ) {
    return this.analyticsService.getTopSellers(req.tenantId, period);
  }

  @Roles(Role.OWNER, Role.MANAGER)
  @Get('slow-movers')
  async getSlowMovers(@Req() req: any) {
    return this.analyticsService.getSlowMovers(req.tenantId);
  }

  @Roles(Role.OWNER, Role.MANAGER)
  @Get('food-cost-alert')
  async getFoodCostAlerts(@Req() req: any) {
    return this.analyticsService.getFoodCostAlerts(req.tenantId);
  }

  @Roles(Role.OWNER, Role.MANAGER)
  @Get('table-turn')
  async getTableTurn(@Req() req: any) {
    return this.analyticsService.getTableTurn(req.tenantId);
  }

  @Roles(Role.OWNER, Role.MANAGER)
  @Get('staff-performance')
  async getStaffPerformance(@Req() req: any) {
    return this.analyticsService.getStaffPerformance(req.tenantId);
  }

  @Roles(Role.OWNER, Role.MANAGER)
  @Get('revenue-trend')
  async getRevenueTrend(@Req() req: any, @Query('days') days: string) {
    return this.analyticsService.getRevenueTrend(
      req.tenantId,
      days ? parseInt(days) : 7,
    );
  }

  @Roles(Role.OWNER, Role.MANAGER)
  @Get('payment-mix')
  async getPaymentMix(@Req() req: any, @Query('days') days: string) {
    return this.analyticsService.getPaymentMix(
      req.tenantId,
      days ? parseInt(days) : 1,
    );
  }

  @Roles(Role.OWNER, Role.MANAGER)
  @Get('menu-engineering')
  async getMenuEngineering(
    @Req() req: any,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.analyticsService.getMenuEngineering(
      req.tenantId,
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined,
    );
  }
}
