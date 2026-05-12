import { Module } from '@nestjs/common';
import { KdsGateway } from './kds.gateway';
import { KdsService } from './kds.service';
import { KdsController } from './kds.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [KdsGateway, KdsService],
  controllers: [KdsController],
  exports: [KdsGateway], // exported so OrdersService can inject it
})
export class KdsModule {}
