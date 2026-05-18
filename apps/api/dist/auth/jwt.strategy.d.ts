import { Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';
declare const JwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
    private prisma;
    constructor(prisma: PrismaService);
    validate(payload: any): Promise<{
        sub: any;
        email: any;
        is_super_admin: boolean;
        level: any;
        tenantId?: undefined;
        role?: undefined;
        mode?: undefined;
        user?: undefined;
    } | {
        sub: any;
        tenantId: any;
        role: any;
        mode: any;
        user: {
            tenant: {
                id: string;
                created_at: Date;
                name: string;
                slug: string;
                gstin: string | null;
                state_code: string | null;
                address: string | null;
                subscription_plan: import("@prisma/client").$Enums.SubscriptionPlan;
                subscription_status: import("@prisma/client").$Enums.SubscriptionStatus;
                subscription_start_at: Date | null;
                subscription_ends_at: Date | null;
                settings: import("@prisma/client/runtime/library").JsonValue | null;
                is_active: boolean;
                fssai_licence_number: string | null;
                fssai_expiry_date: Date | null;
                fssai_alert_sent_at_60: Date | null;
                fssai_alert_sent_at_30: Date | null;
                fssai_alert_sent_at_7: Date | null;
            };
        } & {
            id: string;
            tenant_id: string;
            name: string;
            is_active: boolean;
            mobile: string;
            email: string | null;
            role: import("@prisma/client").$Enums.Role;
            pin_hash: string;
        };
        email?: undefined;
        is_super_admin?: undefined;
        level?: undefined;
    }>;
}
export {};
