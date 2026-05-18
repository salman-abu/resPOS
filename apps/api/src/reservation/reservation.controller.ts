import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Body,
  Param,
  Req,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ReservationService } from './reservation.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('reservations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReservationController {
  constructor(private readonly reservationService: ReservationService) {}

  @Roles(Role.OWNER, Role.MANAGER, Role.CASHIER)
  @Get()
  async list(@Req() req: any, @Query('date') date?: string) {
    return this.reservationService.listReservations(
      req.tenantId,
      date ? new Date(date) : undefined,
    );
  }

  @Post()
  async create(@Req() req: any, @Body() body: any) {
    return this.reservationService.createReservation(req.tenantId, body);
  }

  @Roles(Role.OWNER, Role.MANAGER, Role.CASHIER)
  @Patch(':id/status')
  async updateStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body('status') status: any,
  ) {
    return this.reservationService.updateStatus(req.tenantId, id, status);
  }

  @Get('availability')
  async availability(
    @Req() req: any,
    @Query('date') date: string,
    @Query('partySize') partySize: string,
  ) {
    return this.reservationService.getAvailability(
      req.tenantId,
      new Date(date),
      parseInt(partySize, 10),
    );
  }

  @Roles(Role.OWNER, Role.MANAGER)
  @Get('settings')
  async getSettings(@Req() req: any) {
    return this.reservationService.getSettings(req.tenantId);
  }

  @Roles(Role.OWNER, Role.MANAGER)
  @Put('settings')
  async updateSettings(@Req() req: any, @Body() body: any) {
    return this.reservationService.updateSettings(req.tenantId, body);
  }
}

@Controller('waitlist')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WaitlistController {
  constructor(private readonly reservationService: ReservationService) {}

  @Roles(Role.OWNER, Role.MANAGER, Role.CASHIER)
  @Get()
  async list(@Req() req: any) {
    return this.reservationService.getWaitlist(req.tenantId);
  }

  @Roles(Role.OWNER, Role.MANAGER, Role.CASHIER)
  @Post()
  async add(@Req() req: any, @Body() body: any) {
    return this.reservationService.addToWaitlist(req.tenantId, body);
  }

  @Roles(Role.OWNER, Role.MANAGER, Role.CASHIER)
  @Patch(':id/seat')
  async seat(@Req() req: any, @Param('id') id: string) {
    return this.reservationService.seatWaitlistEntry(req.tenantId, id);
  }
}
