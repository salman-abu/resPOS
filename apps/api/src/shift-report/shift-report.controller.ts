import {
  Controller,
  Post,
  Get,
  Param,
  Req,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ShiftReportService } from './shift-report.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('shifts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ShiftReportController {
  constructor(private readonly shiftReportService: ShiftReportService) {}

  @Roles(Role.OWNER, Role.MANAGER)
  @Post(':id/close-and-report')
  async closeAndReport(@Req() req: any, @Param('id') shiftId: string) {
    const report = await this.shiftReportService.generateAndSave(
      req.tenantId,
      shiftId,
    );
    return report;
  }

  @Roles(Role.OWNER, Role.MANAGER)
  @Get('reports')
  async listReports(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.shiftReportService.listReports(
      req.tenantId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Roles(Role.OWNER, Role.MANAGER)
  @Get('reports/:id')
  async getReport(@Req() req: any, @Param('id') reportId: string) {
    return this.shiftReportService.getReport(req.tenantId, reportId);
  }
}
