import { Module } from '@nestjs/common';
import { DisplayService } from './display.service';
import { DisplayController } from './display.controller';

@Module({
  providers: [DisplayService],
  controllers: [DisplayController],
})
export class DisplayModule {}
