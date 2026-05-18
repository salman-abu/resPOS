import { Controller, Post, Get, Body, Req, UseGuards } from '@nestjs/common';
import { TrainingService } from './training.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('training')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TrainingController {
  constructor(private readonly trainingService: TrainingService) {}

  @Roles(Role.OWNER, Role.MANAGER)
  @Post('start')
  async start(@Req() req: any, @Body('terminal_id') terminalId: string) {
    const tenantId = req.tenantId;
    const startedBy = req.user.sub;
    return this.trainingService.startTraining(tenantId, terminalId, startedBy);
  }

  @Roles(Role.OWNER, Role.MANAGER)
  @Post('end')
  async end(@Req() req: any, @Body('terminal_id') terminalId: string) {
    const tenantId = req.tenantId;
    return this.trainingService.endTraining(tenantId, terminalId);
  }

  @Roles(Role.OWNER, Role.MANAGER, Role.CASHIER)
  @Get('status')
  async status(@Req() req: any, @Body('terminal_id') terminalId?: string) {
    const tenantId = req.tenantId;
    // Use a header or body for terminal identification
    const tid = terminalId || (req.headers['x-terminal-id'] as string);
    if (!tid) {
      return { isTraining: false, sessionId: null, startedAt: null };
    }
    return this.trainingService.getStatus(tenantId, tid);
  }
}
