import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
  Res,
} from '@nestjs/common';
import { StaffService } from './staff.service';
import {
  CreateScheduleDto,
  ClockInOutDto,
  CreateStaffDto,
  UpdateStaffDto,
} from './dto/staff.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import type { Response } from 'express';

@Controller('staff')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.MANAGER)
  @Post('schedule')
  async createSchedule(@Req() req: any, @Body() dto: CreateScheduleDto) {
    return this.staffService.createSchedule(req.tenantId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.MANAGER)
  @Get('schedule')
  async getSchedules(
    @Req() req: any,
    @Query('outletId') outletId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.staffService.getSchedules(
      req.tenantId,
      outletId,
      startDate,
      endDate,
    );
  }

  // Uses TenantMiddleware for tenant isolation, but no JWT since it's a kiosk PIN screen
  @Post('attendance/clock-in-out')
  async handleClockInOut(@Req() req: any, @Body() dto: ClockInOutDto) {
    return this.staffService.handleClockInOut(req.tenantId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.MANAGER)
  @Get('report')
  async getReport(@Req() req: any, @Query('period') period: string) {
    return this.staffService.getReport(req.tenantId, period);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.MANAGER)
  @Get('payroll-export')
  async getPayrollExport(
    @Req() req: any,
    @Query('period') period: string,
    @Res() res: Response,
  ) {
    const csv = await this.staffService.getPayrollExport(req.tenantId, period);
    res.header('Content-Type', 'text/csv');
    res.attachment(`payroll_${period}.csv`);
    return res.send(csv);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.MANAGER)
  @Post('users')
  async createStaff(@Req() req: any, @Body() dto: CreateStaffDto) {
    return this.staffService.createStaff(req.tenantId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.MANAGER)
  @Get('users')
  async getStaffList(@Req() req: any) {
    return this.staffService.getStaffList(req.tenantId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.MANAGER)
  @Patch('users/:id')
  async updateStaff(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateStaffDto,
  ) {
    return this.staffService.updateStaff(req.tenantId, id, dto);
  }
}
