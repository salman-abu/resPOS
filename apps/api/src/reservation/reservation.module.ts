import { Module } from '@nestjs/common';
import { ReservationService } from './reservation.service';
import {
  ReservationController,
  WaitlistController,
} from './reservation.controller';

@Module({
  providers: [ReservationService],
  controllers: [ReservationController, WaitlistController],
})
export class ReservationModule {}
