import { Module } from '@nestjs/common';
import { AggregatorsService } from './aggregators.service';
import { AggregatorsController } from './aggregators.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [PrismaModule, OrdersModule],
  controllers: [AggregatorsController],
  providers: [AggregatorsService],
})
export class AggregatorsModule {}
