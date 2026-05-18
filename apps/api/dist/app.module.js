"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const prisma_module_1 = require("./prisma/prisma.module");
const auth_module_1 = require("./auth/auth.module");
const menu_module_1 = require("./menu/menu.module");
const orders_module_1 = require("./orders/orders.module");
const billing_module_1 = require("./billing/billing.module");
const kds_module_1 = require("./kds/kds.module");
const aggregators_module_1 = require("./aggregators/aggregators.module");
const inventory_module_1 = require("./inventory/inventory.module");
const tenant_middleware_1 = require("./tenant/tenant.middleware");
const tenant_module_1 = require("./tenant/tenant.module");
const superadmin_module_1 = require("./superadmin/superadmin.module");
const loyalty_module_1 = require("./loyalty/loyalty.module");
const gst_module_1 = require("./gst/gst.module");
const analytics_module_1 = require("./analytics/analytics.module");
const staff_module_1 = require("./staff/staff.module");
const storefront_module_1 = require("./storefront/storefront.module");
const finance_module_1 = require("./finance/finance.module");
const floor_plan_module_1 = require("./floor-plan/floor-plan.module");
const customers_module_1 = require("./customers/customers.module");
const audit_module_1 = require("./audit/audit.module");
const bookings_module_1 = require("./bookings/bookings.module");
const sync_module_1 = require("./sync/sync.module");
const training_module_1 = require("./training/training.module");
const training_interceptor_1 = require("./training/training.interceptor");
const cron_module_1 = require("./cron/cron.module");
const shift_report_module_1 = require("./shift-report/shift-report.module");
const display_module_1 = require("./display/display.module");
const upsell_module_1 = require("./upsell/upsell.module");
const whatsapp_module_1 = require("./whatsapp/whatsapp.module");
const reservation_module_1 = require("./reservation/reservation.module");
const kiosk_module_1 = require("./kiosk/kiosk.module");
const throttler_1 = require("@nestjs/throttler");
const core_1 = require("@nestjs/core");
let AppModule = class AppModule {
    configure(consumer) {
        consumer.apply(tenant_middleware_1.TenantMiddleware).forRoutes('*');
    }
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            throttler_1.ThrottlerModule.forRoot([
                { name: 'short', ttl: 1000, limit: 3 },
                { name: 'medium', ttl: 10000, limit: 20 },
                { name: 'long', ttl: 60000, limit: 100 },
            ]),
            prisma_module_1.PrismaModule,
            audit_module_1.AuditModule,
            auth_module_1.AuthModule,
            menu_module_1.MenuModule,
            orders_module_1.OrdersModule,
            billing_module_1.BillingModule,
            kds_module_1.KdsModule,
            aggregators_module_1.AggregatorsModule,
            inventory_module_1.InventoryModule,
            tenant_module_1.TenantModule,
            superadmin_module_1.SuperAdminModule,
            loyalty_module_1.LoyaltyModule,
            gst_module_1.GstModule,
            analytics_module_1.AnalyticsModule,
            staff_module_1.StaffModule,
            storefront_module_1.StorefrontModule,
            finance_module_1.FinanceModule,
            floor_plan_module_1.FloorPlanModule,
            customers_module_1.CustomersModule,
            bookings_module_1.BookingsModule,
            sync_module_1.SyncModule,
            training_module_1.TrainingModule,
            cron_module_1.CronModule,
            shift_report_module_1.ShiftReportModule,
            display_module_1.DisplayModule,
            upsell_module_1.UpsellModule,
            whatsapp_module_1.WhatsappModule,
            reservation_module_1.ReservationModule,
            kiosk_module_1.KioskModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [
            app_service_1.AppService,
            { provide: core_1.APP_GUARD, useClass: throttler_1.ThrottlerGuard },
            { provide: core_1.APP_INTERCEPTOR, useClass: training_interceptor_1.TrainingInterceptor },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map