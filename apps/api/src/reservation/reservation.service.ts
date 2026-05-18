import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  ReservationStatus,
  ReservationSource,
  WaitlistStatus,
} from '@prisma/client';

@Injectable()
export class ReservationService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Settings ─────────────────────────────────────────────────────────────
  async getSettings(tenantId: string) {
    const settings = await this.prisma.reservationSettings.findUnique({
      where: { tenant_id: tenantId },
    });
    if (!settings) {
      return this.prisma.reservationSettings.create({
        data: { tenant_id: tenantId },
      });
    }
    return settings;
  }

  async updateSettings(tenantId: string, data: any) {
    return this.prisma.reservationSettings.upsert({
      where: { tenant_id: tenantId },
      update: {
        avg_turn_minutes: data.avgTurnMinutes,
        max_advance_days: data.maxAdvanceDays,
        opening_time: data.openingTime,
        closing_time: data.closingTime,
        slot_interval_minutes: data.slotIntervalMinutes,
        reminder_hours_before: data.reminderHoursBefore,
      },
      create: {
        tenant_id: tenantId,
        avg_turn_minutes: data.avgTurnMinutes,
        max_advance_days: data.maxAdvanceDays,
        opening_time: data.openingTime,
        closing_time: data.closingTime,
        slot_interval_minutes: data.slotIntervalMinutes,
        reminder_hours_before: data.reminderHoursBefore,
      },
    });
  }

  // ─── Availability ─────────────────────────────────────────────────────────
  async getAvailability(tenantId: string, date: Date, partySize: number) {
    const settings = await this.getSettings(tenantId);

    // Find tables matching party size
    const tables = await this.prisma.table.findMany({
      where: { tenant_id: tenantId, capacity: { gte: partySize } },
      orderBy: { capacity: 'asc' },
    });

    // Get existing reservations for the date
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const existingReservations = await this.prisma.reservation.findMany({
      where: {
        tenant_id: tenantId,
        scheduled_at: { gte: dayStart, lte: dayEnd },
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
    });

    // Build slot map
    const slots: string[] = [];
    const [openHour, openMin] = settings.opening_time.split(':').map(Number);
    const [closeHour, closeMin] = settings.closing_time.split(':').map(Number);
    const openMinutes = openHour * 60 + openMin;
    const closeMinutes = closeHour * 60 + closeMin;

    for (
      let m = openMinutes;
      m + settings.avg_turn_minutes <= closeMinutes;
      m += settings.slot_interval_minutes
    ) {
      const h = Math.floor(m / 60);
      const min = m % 60;
      slots.push(
        `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`,
      );
    }

    // Check each slot
    const availableSlots = slots.map((slot) => {
      const [h, min] = slot.split(':').map(Number);
      const slotStart = new Date(date);
      slotStart.setHours(h, min, 0, 0);
      const slotEnd = new Date(slotStart);
      slotEnd.setMinutes(slotEnd.getMinutes() + settings.avg_turn_minutes);

      // Count tables blocked by existing reservations
      const blockedTables = new Set<string>();
      for (const res of existingReservations) {
        const resStart = new Date(res.scheduled_at);
        const resEnd = new Date(resStart);
        resEnd.setMinutes(resEnd.getMinutes() + settings.avg_turn_minutes);

        // Overlap check
        if (resStart < slotEnd && resEnd > slotStart && res.table_id) {
          blockedTables.add(res.table_id);
        }
      }

      const availableCount = tables.filter(
        (t) => !blockedTables.has(t.id),
      ).length;

      return {
        time: slot,
        available: availableCount > 0,
        tablesAvailable: availableCount,
      };
    });

    return { slots: availableSlots, totalTables: tables.length };
  }

  // ─── Create Reservation ───────────────────────────────────────────────────
  async createReservation(tenantId: string, dto: any) {
    const settings = await this.getSettings(tenantId);

    // Validate max advance days
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + settings.max_advance_days);
    if (new Date(dto.scheduledAt) > maxDate) {
      throw new BadRequestException(
        `Reservations can only be made ${settings.max_advance_days} days in advance`,
      );
    }

    // Auto-assign table
    const assignedTable = await this.autoAssignTable(
      tenantId,
      new Date(dto.scheduledAt),
      dto.partySize,
    );

    return this.prisma.reservation.create({
      data: {
        tenant_id: tenantId,
        guest_name: dto.guestName,
        guest_phone: dto.guestPhone,
        party_size: dto.partySize,
        scheduled_at: new Date(dto.scheduledAt),
        table_id: assignedTable?.id,
        status: 'CONFIRMED',
        notes: dto.notes,
        source: dto.source || 'STAFF',
      },
      include: { table: true },
    });
  }

  private async autoAssignTable(
    tenantId: string,
    scheduledAt: Date,
    partySize: number,
  ) {
    const settings = await this.getSettings(tenantId);

    // Find smallest fitting table
    const tables = await this.prisma.table.findMany({
      where: { tenant_id: tenantId, capacity: { gte: partySize } },
      orderBy: { capacity: 'asc' },
    });

    const slotStart = new Date(scheduledAt);
    const slotEnd = new Date(slotStart);
    slotEnd.setMinutes(slotEnd.getMinutes() + settings.avg_turn_minutes);

    // Get conflicting reservations
    const dayStart = new Date(slotStart);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(slotStart);
    dayEnd.setHours(23, 59, 59, 999);

    const existing = await this.prisma.reservation.findMany({
      where: {
        tenant_id: tenantId,
        scheduled_at: { gte: dayStart, lte: dayEnd },
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
    });

    for (const table of tables) {
      const hasConflict = existing.some((res) => {
        if (res.table_id !== table.id) return false;
        const resStart = new Date(res.scheduled_at);
        const resEnd = new Date(resStart);
        resEnd.setMinutes(resEnd.getMinutes() + settings.avg_turn_minutes);
        return resStart < slotEnd && resEnd > slotStart;
      });
      if (!hasConflict) return table;
    }

    return null; // No table available
  }

  // ─── List Reservations ────────────────────────────────────────────────────
  async listReservations(tenantId: string, date?: Date) {
    const where: any = { tenant_id: tenantId };
    if (date) {
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      where.scheduled_at = { gte: dayStart, lte: dayEnd };
    }

    return this.prisma.reservation.findMany({
      where,
      include: { table: true },
      orderBy: { scheduled_at: 'asc' },
    });
  }

  // ─── Update Status ────────────────────────────────────────────────────────
  async updateStatus(
    tenantId: string,
    reservationId: string,
    status: ReservationStatus,
  ) {
    const reservation = await this.prisma.reservation.findFirst({
      where: { id: reservationId, tenant_id: tenantId },
    });
    if (!reservation) throw new NotFoundException('Reservation not found');

    const result = await this.prisma.reservation.update({
      where: { id: reservationId },
      data: { status },
      include: { table: true },
    });

    // If seated, create an order linked to the table
    if (status === 'SEATED' && result.table_id) {
      // Table status will be updated when order is created
      // Or we can mark table as RESERVED/OCCUPIED
    }

    return result;
  }

  // ─── Waitlist ───────────────────────────────────────────────────────────────
  async getWaitlist(tenantId: string) {
    return this.prisma.waitlistEntry.findMany({
      where: { tenant_id: tenantId, status: 'WAITING' },
      orderBy: { joined_at: 'asc' },
    });
  }

  async addToWaitlist(tenantId: string, dto: any) {
    const settings = await this.getSettings(tenantId);

    // Estimate wait based on occupied tables
    const occupiedTables = await this.prisma.table.count({
      where: { tenant_id: tenantId, status: { in: ['OCCUPIED', 'BILLED'] } },
    });
    const totalTables = await this.prisma.table.count({
      where: { tenant_id: tenantId },
    });

    const estimatedWait =
      occupiedTables > 0 && totalTables > 0
        ? Math.round((occupiedTables / totalTables) * settings.avg_turn_minutes)
        : settings.avg_turn_minutes;

    return this.prisma.waitlistEntry.create({
      data: {
        tenant_id: tenantId,
        guest_name: dto.guestName,
        guest_phone: dto.guestPhone,
        party_size: dto.partySize,
        quoted_wait_minutes: estimatedWait,
      },
    });
  }

  async seatWaitlistEntry(tenantId: string, entryId: string) {
    const entry = await this.prisma.waitlistEntry.findFirst({
      where: { id: entryId, tenant_id: tenantId },
    });
    if (!entry) throw new NotFoundException('Waitlist entry not found');

    return this.prisma.waitlistEntry.update({
      where: { id: entryId },
      data: { status: 'SEATED', seated_at: new Date() },
    });
  }
}
