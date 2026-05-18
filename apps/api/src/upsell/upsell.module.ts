import { Module } from '@nestjs/common';
import { UpsellService } from './upsell.service';
import { UpsellController } from './upsell.controller';

@Module({
  providers: [UpsellService],
  controllers: [UpsellController],
})
export class UpsellModule {}
