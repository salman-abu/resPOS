import {
  Controller,
  Get,
  UseGuards,
  Req,
  Query,
  Res,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Roles(Role.OWNER, Role.MANAGER)
  async getLogs(
    @Req() req: any,
    @Query('action') action?: string,
    @Query('performedBy') performedBy?: string,
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit = 50,
  ) {
    return this.auditService.getLogs(
      req.user.tenantId,
      {
        ...(action ? { action: action as any } : {}),
        ...(performedBy ? { performedBy } : {}),
        ...(entityType ? { entityType } : {}),
        ...(entityId ? { entityId } : {}),
        ...(from ? { from: new Date(from) } : {}),
        ...(to ? { to: new Date(to) } : {}),
      },
      page,
      limit,
    );
  }

  @Get('export')
  @Roles(Role.OWNER, Role.MANAGER)
  async exportCsv(
    @Req() req: any,
    @Res() res: Response,
    @Query('action') action?: string,
    @Query('performedBy') performedBy?: string,
    @Query('entityType') entityType?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const csv = await this.auditService.exportToCsv(req.user.tenantId, {
      ...(action ? { action: action as any } : {}),
      ...(performedBy ? { performedBy } : {}),
      ...(entityType ? { entityType } : {}),
      ...(from ? { from: new Date(from) } : {}),
      ...(to ? { to: new Date(to) } : {}),
    });

    const filename = `audit-logs-${req.user.tenantId}-${new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csv);
  }
}
