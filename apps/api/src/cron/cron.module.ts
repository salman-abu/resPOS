import { Module } from '@nestjs/common';
import { CronService } from './cron.service';
import { TrainingModule } from '../training/training.module';
import { TenantModule } from '../tenant/tenant.module';
import { PrismaModule } from '../prisma/prisma.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [TrainingModule, TenantModule, PrismaModule, WhatsappModule],
  providers: [CronService],
})
export class CronModule {}
