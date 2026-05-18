import { Injectable, OnModuleInit } from '@nestjs/common';
import { TrainingService } from '../training/training.service';
import { TenantService } from '../tenant/tenant.service';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';

@Injectable()
export class CronService implements OnModuleInit {
  constructor(
    private readonly trainingService: TrainingService,
    private readonly tenantService: TenantService,
    private readonly prisma: PrismaService,
    private readonly whatsappService: WhatsappService,
  ) {}

  onModuleInit() {
    // Purge training data every 24 hours
    setInterval(
      () => {
        this.trainingService.purgeOldTrainingData().catch((err) => {
          console.error('Failed to purge training data:', err);
        });
      },
      24 * 60 * 60 * 1000,
    );

    // FSSAI expiry check daily at 09:00 IST
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istNow = new Date(now.getTime() + istOffset);
    const target = new Date(istNow);
    target.setHours(9, 0, 0, 0);
    if (target <= istNow) {
      target.setDate(target.getDate() + 1);
    }
    const msUntil9am = target.getTime() - istNow.getTime();

    setTimeout(() => {
      this.checkFssaiExpiry();
      setInterval(() => this.checkFssaiExpiry(), 24 * 60 * 60 * 1000);
    }, msUntil9am);
  }

  private async checkFssaiExpiry() {
    const tenants = await this.prisma.tenant.findMany({
      where: {
        fssai_expiry_date: { not: null },
        is_active: true,
      },
      select: {
        id: true,
        fssai_expiry_date: true,
        fssai_licence_number: true,
        fssai_alert_sent_at_60: true,
        fssai_alert_sent_at_30: true,
        fssai_alert_sent_at_7: true,
      },
    });

    const now = new Date();

    for (const tenant of tenants) {
      const expiry = tenant.fssai_expiry_date!;
      const days = Math.ceil(
        (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );

      const updates: any = {};
      let alertMessage = '';

      if (days <= 60 && days > 30 && !tenant.fssai_alert_sent_at_60) {
        alertMessage = `⚠️ *FSSAI Licence Expiry Warning (60 Days)*
-----------------------------------
📍 *Tenant ID:* ${tenant.id}
📝 *Licence Number:* ${tenant.fssai_licence_number || 'N/A'}
📅 *Expiry Date:* ${expiry.toLocaleDateString('en-IN')}
⏳ *Time Left:* ${days} days remaining. Please prepare documentation for renewal.
-----------------------------------`;
        updates.fssai_alert_sent_at_60 = new Date();
      }
      if (days <= 30 && days > 7 && !tenant.fssai_alert_sent_at_30) {
        alertMessage = `⚠️ *URGENT: FSSAI Licence Expiry Warning (30 Days)*
-----------------------------------
📍 *Tenant ID:* ${tenant.id}
📝 *Licence Number:* ${tenant.fssai_licence_number || 'N/A'}
📅 *Expiry Date:* ${expiry.toLocaleDateString('en-IN')}
⏳ *Time Left:* ${days} days remaining. Start the renewal process immediately to avoid POS lockouts!
-----------------------------------`;
        updates.fssai_alert_sent_at_30 = new Date();
      }
      if (days <= 7 && !tenant.fssai_alert_sent_at_7) {
        alertMessage = `🚨 *CRITICAL FSSAI LICENCE EXPIRY LOCKOUT ALERT*
-----------------------------------
📍 *Tenant ID:* ${tenant.id}
📝 *Licence Number:* ${tenant.fssai_licence_number || 'N/A'}
📅 *Expiry Date:* ${expiry.toLocaleDateString('en-IN')}
⏳ *Time Left:* ${days} days remaining.
⚠️ *Notice:* Your resPOS terminal login will be BLOCKED if the licence expires! Renew now.
-----------------------------------`;
        updates.fssai_alert_sent_at_7 = new Date();
      }

      if (alertMessage) {
        try {
          const owners = await this.prisma.user.findMany({
            where: {
              tenant_id: tenant.id,
              role: { in: ['OWNER', 'MANAGER'] },
              is_active: true,
            },
            select: { mobile: true },
          });

          for (const owner of owners) {
            if (owner.mobile) {
              await this.whatsappService.sendTextMessage(
                owner.mobile,
                alertMessage,
              );
            }
          }
        } catch (err) {
          console.error('Failed to send FSSAI alert:', err);
        }
      }

      if (Object.keys(updates).length > 0) {
        await this.prisma.tenant.update({
          where: { id: tenant.id },
          data: updates,
        });
      }
    }
  }
}
