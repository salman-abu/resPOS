import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BookingStatus } from '@prisma/client';

@Controller('bookings')
@UseGuards(JwtAuthGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  async create(@Req() req: any, @Body() body: any) {
    return this.bookingsService.createBooking(req.user.tenantId, body);
  }

  @Get()
  async findAll(@Req() req: any) {
    return this.bookingsService.getBookings(req.user.tenantId);
  }

  @Patch(':id/status')
  async updateStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body('status') status: BookingStatus,
  ) {
    return this.bookingsService.updateBookingStatus(
      req.user.tenantId,
      id,
      status,
    );
  }

  @Get(':id/briefing')
  async getBriefing(@Req() req: any, @Param('id') id: string) {
    return this.bookingsService.getEventBriefing(req.user.tenantId, id);
  }
}
