import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BookingStatus } from '@prisma/client';

@Injectable()
export class BookingsService {
  constructor(private prisma: PrismaService) {}

  async createBooking(tenantId: string, data: any) {
    return this.prisma.booking.create({
      data: {
        tenant_id: tenantId,
        customer_id: data.customer_id,
        event_name: data.event_name,
        event_date: new Date(data.event_date),
        guest_count: data.guest_count,
        deposit_amount: data.deposit_amount,
        notes: data.notes,
        status: 'CONFIRMED',
      },
    });
  }

  async getBookings(tenantId: string) {
    return this.prisma.booking.findMany({
      where: { tenant_id: tenantId },
      include: { customer: true, order: true },
      orderBy: { event_date: 'asc' },
    });
  }

  async updateBookingStatus(
    tenantId: string,
    bookingId: string,
    status: BookingStatus,
  ) {
    const booking = await this.prisma.booking.findFirst({
      where: { id: bookingId, tenant_id: tenantId },
    });
    if (!booking) throw new NotFoundException('Booking not found');

    return this.prisma.booking.update({
      where: { id: bookingId },
      data: { status },
    });
  }

  async getEventBriefing(tenantId: string, bookingId: string) {
    const booking = await this.prisma.booking.findFirst({
      where: { id: bookingId, tenant_id: tenantId },
      include: { customer: true },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    return booking;
  }
}
