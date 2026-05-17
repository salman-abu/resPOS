import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('finance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Roles(Role.OWNER, Role.MANAGER)
  @Get('pnl')
  async getPnl(@Req() req: any, @Query('period') period: string) {
    return this.financeService.getPnl(
      req.tenantId,
      period || new Date().toISOString().slice(0, 7),
    );
  }

  @Roles(Role.OWNER, Role.MANAGER)
  @Get('cashflow')
  async getCashflow(@Req() req: any, @Query('period') period: string) {
    return this.financeService.getCashflow(
      req.tenantId,
      period || new Date().toISOString().slice(0, 7),
    );
  }

  @Roles(Role.OWNER, Role.MANAGER)
  @Get('vendor-aging')
  async getVendorAging(@Req() req: any) {
    return this.financeService.getVendorAging(req.tenantId);
  }
}
