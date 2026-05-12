import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { MenuModule } from './menu/menu.module';
import { OrdersModule } from './orders/orders.module';
import { BillingModule } from './billing/billing.module';
import { KdsModule } from './kds/kds.module';
import { AggregatorsModule } from './aggregators/aggregators.module';
import { InventoryModule } from './inventory/inventory.module';
import { TenantMiddleware } from './tenant/tenant.middleware';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    MenuModule,
    OrdersModule,
    BillingModule,
    KdsModule,
    AggregatorsModule,
    InventoryModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes('*');
  }
}
