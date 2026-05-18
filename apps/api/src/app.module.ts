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
import { TenantModule } from './tenant/tenant.module';
import { SuperAdminModule } from './superadmin/superadmin.module';
import { LoyaltyModule } from './loyalty/loyalty.module';
import { GstModule } from './gst/gst.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { StaffModule } from './staff/staff.module';
import { StorefrontModule } from './storefront/storefront.module';
import { FinanceModule } from './finance/finance.module';
import { FloorPlanModule } from './floor-plan/floor-plan.module';
import { CustomersModule } from './customers/customers.module';
import { AuditModule } from './audit/audit.module';
import { BookingsModule } from './bookings/bookings.module';
import { SyncModule } from './sync/sync.module';
import { TrainingModule } from './training/training.module';
import { TrainingInterceptor } from './training/training.interceptor';
import { CronModule } from './cron/cron.module';
import { ShiftReportModule } from './shift-report/shift-report.module';
import { DisplayModule } from './display/display.module';
import { UpsellModule } from './upsell/upsell.module';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { ReservationModule } from './reservation/reservation.module';
import { KioskModule } from './kiosk/kiosk.module';

import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 3 },
      { name: 'medium', ttl: 10000, limit: 20 },
      { name: 'long', ttl: 60000, limit: 100 },
    ]),
    PrismaModule,
    AuditModule,
    AuthModule,
    MenuModule,
    OrdersModule,
    BillingModule,
    KdsModule,
    AggregatorsModule,
    InventoryModule,
    TenantModule,
    SuperAdminModule,
    LoyaltyModule,
    GstModule,
    AnalyticsModule,
    StaffModule,
    StorefrontModule,
    FinanceModule,
    FloorPlanModule,
    CustomersModule,
    BookingsModule,
    SyncModule,
    TrainingModule,
    CronModule,
    ShiftReportModule,
    DisplayModule,
    UpsellModule,
    WhatsappModule,
    ReservationModule,
    KioskModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_INTERCEPTOR, useClass: TrainingInterceptor },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes('*');
  }
}
