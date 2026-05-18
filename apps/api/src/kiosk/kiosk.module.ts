import { Module } from '@nestjs/common';
import { KioskService } from './kiosk.service';
import {
  KioskPublicController,
  KioskOwnerController,
} from './kiosk.controller';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [OrdersModule],
  providers: [KioskService],
  controllers: [KioskPublicController, KioskOwnerController],
})
export class KioskModule {}
