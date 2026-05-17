import { Module } from '@nestjs/common';
import { FloorPlanController } from './floor-plan.controller';
import { FloorPlanService } from './floor-plan.service';
import { FloorPlanGateway } from './floor-plan.gateway';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [FloorPlanController],
  providers: [FloorPlanService, FloorPlanGateway],
  exports: [FloorPlanGateway],
})
export class FloorPlanModule {}
