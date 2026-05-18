import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TenantService {
  constructor(private readonly prisma: PrismaService) {}

  async getSettings(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        name: true,
        address: true,
        gstin: true,
        state_code: true,
        settings: true,
      },
    });

    if (!tenant) throw new NotFoundException('Tenant not found');

    // Default settings if empty
    const defaultSettings = {
      restaurant: {
        name: tenant.name,
        gstin: tenant.gstin || '',
        address: tenant.address || '',
        phone: '',
      },
      notifications: {
        email_daily_report: false,
        sms_on_void: true,
      },
      payments: {
        accept_card: true,
        accept_upi: true,
        service_charge_pct: 0,
      },
    };

    return {
      ...tenant,
      settings: tenant.settings || defaultSettings,
    };
  }

  async updateSettings(tenantId: string, data: any) {
    // If the restaurant name/gstin/address are in settings, pull them out to update the top-level columns too
    const updateData: any = { settings: data };

    if (data.restaurant) {
      if (data.restaurant.name) updateData.name = data.restaurant.name;
      if (data.restaurant.gstin) updateData.gstin = data.restaurant.gstin;
      if (data.restaurant.address) updateData.address = data.restaurant.address;
    }

    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: updateData,
      select: {
        name: true,
        address: true,
        gstin: true,
        settings: true,
      },
    });
  }

  async getFssaiSettings(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        fssai_licence_number: true,
        fssai_expiry_date: true,
        fssai_alert_sent_at_60: true,
        fssai_alert_sent_at_30: true,
        fssai_alert_sent_at_7: true,
      },
    });
    if (!tenant) throw new NotFoundException('Tenant not found');

    const now = new Date();
    const daysUntilExpiry = tenant.fssai_expiry_date
      ? Math.ceil(
          (tenant.fssai_expiry_date.getTime() - now.getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : null;

    return {
      licenceNumber: tenant.fssai_licence_number,
      expiryDate: tenant.fssai_expiry_date?.toISOString() ?? null,
      daysUntilExpiry,
      alertSentAt60: tenant.fssai_alert_sent_at_60?.toISOString() ?? null,
      alertSentAt30: tenant.fssai_alert_sent_at_30?.toISOString() ?? null,
      alertSentAt7: tenant.fssai_alert_sent_at_7?.toISOString() ?? null,
    };
  }

  async updateFssaiSettings(
    tenantId: string,
    licenceNumber: string,
    expiryDate: string,
  ) {
    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        fssai_licence_number: licenceNumber,
        fssai_expiry_date: new Date(expiryDate),
        fssai_alert_sent_at_60: null,
        fssai_alert_sent_at_30: null,
        fssai_alert_sent_at_7: null,
      },
      select: {
        fssai_licence_number: true,
        fssai_expiry_date: true,
      },
    });
  }
}
