import { Module } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import {
  WhatsappWebhookController,
  TableQrController,
  WhatsappAdminController,
} from './whatsapp.controller';
import { OrdersModule } from '../orders/orders.module';
import { KdsModule } from '../kds/kds.module';

@Module({
  imports: [OrdersModule, KdsModule],
  providers: [WhatsappService],
  controllers: [
    WhatsappWebhookController,
    TableQrController,
    WhatsappAdminController,
  ],
  exports: [WhatsappService],
})
export class WhatsappModule {}
