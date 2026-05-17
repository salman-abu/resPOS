import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateScheduleDto,
  ClockInOutDto,
  CreateStaffDto,
  UpdateStaffDto,
} from './dto/staff.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class StaffService {
  constructor(private readonly prisma: PrismaService) {}

  async createSchedule(tenantId: string, dto: CreateScheduleDto) {
    return this.prisma.staffSchedule.create({
      data: {
        user_id: dto.userId,
        outlet_id: dto.outletId,
        date: new Date(dto.date),
        start_time: dto.startTime,
        end_time: dto.endTime,
        role: dto.role,
      },
    });
  }

  async getSchedules(
    tenantId: string,
    outletId: string,
    startDate: string,
    endDate: string,
  ) {
    return this.prisma.staffSchedule.findMany({
      where: {
        outlet_id: outletId,
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
        user: { tenant_id: tenantId },
      },
      include: { user: { select: { id: true, name: true, role: true } } },
    });
  }

  async handleClockInOut(tenantId: string, dto: ClockInOutDto) {
    // 1. Find user by PIN (mocked findFirst since pin_hash requires decryption/compare in real app, but assuming plain search or we do a full pass)
    // Actually we should get all users in tenant and check bcrypt, but for performance, PIN is usually hashed.
    // Let's assume we find by tenantId and then check bcrypt.
    const users = await this.prisma.user.findMany({
      where: { tenant_id: tenantId, is_active: true },
    });
    let matchedUser: any = null;
    for (const user of users) {
      if (await bcrypt.compare(dto.pin, user.pin_hash)) {
        matchedUser = user;
        break;
      }
    }
    if (!matchedUser) throw new BadRequestException('Invalid PIN');

    // 2. Check if already clocked in
    const activeAttendance = await this.prisma.attendance.findFirst({
      where: {
        user_id: matchedUser.id,
        outlet_id: dto.outletId,
        clock_out: null,
      },
    });

    if (activeAttendance) {
      // Clock out
      const updated = await this.prisma.attendance.update({
        where: { id: activeAttendance.id },
        data: { clock_out: new Date() },
      });
      return {
        action: 'CLOCKED_OUT',
        user: matchedUser.name,
        time: updated.clock_out,
      };
    } else {
      // Clock in
      // Link to open shift if exists
      const openShift = await this.prisma.shift.findFirst({
        where: {
          outlet_id: dto.outletId,
          status: 'OPEN',
          cashier_id: matchedUser.id,
        },
      });

      const attendance = await this.prisma.attendance.create({
        data: {
          user_id: matchedUser.id,
          outlet_id: dto.outletId,
          shift_id: openShift ? openShift.id : null,
        },
      });
      return {
        action: 'CLOCKED_IN',
        user: matchedUser.name,
        time: attendance.clock_in,
      };
    }
  }

  async getReport(tenantId: string, period: string) {
    // Period: YYYY-MM
    const [year, month] = period.split('-');
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);

    // 1. Fetch all active staff members in the tenant
    const users = await this.prisma.user.findMany({
      where: { tenant_id: tenantId, is_active: true },
      select: { id: true, name: true, role: true },
    });

    const reportMap = new Map();
    users.forEach((user) => {
      reportMap.set(user.id, {
        userId: user.id,
        name: user.name,
        role: user.role,
        totalHours: 0,
        presentDays: new Set(),
      });
    });

    // 2. Fetch attendance records in this period
    const attendances = await this.prisma.attendance.findMany({
      where: {
        clock_in: { gte: startDate, lte: endDate },
        user: { tenant_id: tenantId },
      },
    });

    // 3. Accumulate clock hours and days present
    attendances.forEach((att) => {
      const stat = reportMap.get(att.user_id);
      if (stat) {
        stat.presentDays.add(att.clock_in.toISOString().split('T')[0]);

        if (att.clock_out) {
          const diffMs = att.clock_out.getTime() - att.clock_in.getTime();
          stat.totalHours += diffMs / (1000 * 60 * 60);
        }
      }
    });

    return Array.from(reportMap.values()).map((s) => ({
      ...s,
      presentDays: s.presentDays.size,
      totalHours: Math.round(s.totalHours * 100) / 100,
    }));
  }

  async getPayrollExport(tenantId: string, period: string) {
    const report = await this.getReport(tenantId, period);
    const csvHeader = 'Name,Role,PresentDays,TotalHours\n';
    const csvRows = report
      .map((r) => `${r.name},${r.role},${r.presentDays},${r.totalHours}`)
      .join('\n');
    return csvHeader + csvRows;
  }

  async createStaff(tenantId: string, dto: CreateStaffDto) {
    const pin_hash = await bcrypt.hash(dto.pin, 10);
    return this.prisma.user.create({
      data: {
        tenant_id: tenantId,
        name: dto.name,
        mobile: dto.mobile,
        email: dto.email,
        role: dto.role,
        pin_hash,
      },
      select: {
        id: true,
        name: true,
        mobile: true,
        email: true,
        role: true,
        is_active: true,
      },
    });
  }

  async getStaffList(tenantId: string) {
    return this.prisma.user.findMany({
      where: { tenant_id: tenantId },
      select: {
        id: true,
        name: true,
        mobile: true,
        email: true,
        role: true,
        is_active: true,
      },
    });
  }

  async updateStaff(tenantId: string, id: string, dto: UpdateStaffDto) {
    const updateData: any = { ...dto };
    if (dto.pin) {
      updateData.pin_hash = await bcrypt.hash(dto.pin, 10);
      delete updateData.pin;
    }
    if (dto.isActive !== undefined) {
      updateData.is_active = dto.isActive;
      delete updateData.isActive;
    }
    return this.prisma.user.update({
      where: { id, tenant_id: tenantId },
      data: updateData,
      select: {
        id: true,
        name: true,
        mobile: true,
        email: true,
        role: true,
        is_active: true,
      },
    });
  }
}
