import { Module } from '@nestjs/common';
import { MenuService } from './menu.service';
import { MenuController } from './menu.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { MenuGateway } from './menu.gateway';

@Module({
  imports: [PrismaModule],
  controllers: [MenuController],
  providers: [MenuService, MenuGateway],
  exports: [MenuService, MenuGateway],
})
export class MenuModule {}
