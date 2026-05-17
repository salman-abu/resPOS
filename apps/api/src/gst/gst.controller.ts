import {
  Controller,
  Get,
  Post,
  Query,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { GstService } from './gst.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('gst')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GstController {
  constructor(private readonly gstService: GstService) {}

  @Roles(Role.OWNER, Role.MANAGER)
  @Get('gstr1')
  async getGstr1(@Req() req: any, @Query('period') period: string) {
    return this.gstService.getGstr1(req.tenantId, period);
  }

  @Roles(Role.OWNER, Role.MANAGER)
  @Get('gstr3b')
  async getGstr3b(@Req() req: any, @Query('period') period: string) {
    return this.gstService.getGstr3b(req.tenantId, period);
  }

  @Roles(Role.OWNER, Role.MANAGER)
  @Get('tcs-reconciliation')
  async getTcsReconciliation(@Req() req: any, @Query('period') period: string) {
    return this.gstService.getTcsReconciliation(req.tenantId, period);
  }

  @Roles(Role.OWNER, Role.MANAGER)
  @Get('hsn-summary')
  async getHsnSummary(@Req() req: any, @Query('period') period: string) {
    return this.gstService.getHsnSummary(req.tenantId, period);
  }
}
