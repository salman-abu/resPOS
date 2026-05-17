import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { FloorPlanService } from './floor-plan.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('floor-plan')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FloorPlanController {
  constructor(private readonly floorPlanService: FloorPlanService) {}

  @Roles(Role.OWNER, Role.MANAGER)
  @Get('zones')
  async getZones(@Req() req: any) {
    return this.floorPlanService.getZones(req.tenantId);
  }

  @Roles(Role.OWNER, Role.MANAGER)
  @Post('zones')
  async createZone(@Req() req: any, @Body() body: { name: string }) {
    return this.floorPlanService.createZone(req.tenantId, body.name);
  }

  @Roles(Role.OWNER, Role.MANAGER)
  @Put('zones/:id')
  async updateZone(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { name: string },
  ) {
    return this.floorPlanService.updateZone(req.tenantId, id, body.name);
  }

  @Roles(Role.OWNER, Role.MANAGER)
  @Delete('zones/:id')
  async deleteZone(@Req() req: any, @Param('id') id: string) {
    return this.floorPlanService.deleteZone(req.tenantId, id);
  }

  @Roles(Role.OWNER, Role.MANAGER)
  @Post('zones/:id/tables')
  async addTable(
    @Req() req: any,
    @Param('id') zoneId: string,
    @Body() body: { table_number: string; capacity: number },
  ) {
    return this.floorPlanService.addTable(req.tenantId, zoneId, body);
  }

  @Roles(Role.OWNER, Role.MANAGER)
  @Put('tables/:id')
  async updateTable(
    @Req() req: any,
    @Param('id') tableId: string,
    @Body() body: { table_number?: string; capacity?: number },
  ) {
    return this.floorPlanService.updateTable(req.tenantId, tableId, body);
  }

  @Roles(Role.OWNER, Role.MANAGER)
  @Delete('tables/:id')
  async deleteTable(@Req() req: any, @Param('id') tableId: string) {
    return this.floorPlanService.deleteTable(req.tenantId, tableId);
  }

  /** PATCH /floor-plan/tables/:id/status — Mark Clean / change status */
  @Patch('tables/:id/status')
  async updateTableStatus(
    @Req() req: any,
    @Param('id') tableId: string,
    @Body() body: { status: string },
  ) {
    return this.floorPlanService.updateTableStatus(
      req.tenantId,
      tableId,
      body.status,
    );
  }
}
