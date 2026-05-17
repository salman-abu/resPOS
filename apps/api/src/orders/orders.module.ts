import { Module } from '@nestjs/common';

import { OrdersService } from './orders.service';
import { OrdersController, VoidJobController } from './orders.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { KdsModule } from '../kds/kds.module';
import { InventoryModule } from '../inventory/inventory.module';
import { FloorPlanModule } from '../floor-plan/floor-plan.module';

@Module({
  imports: [PrismaModule, KdsModule, InventoryModule, FloorPlanModule],
  controllers: [OrdersController, VoidJobController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
