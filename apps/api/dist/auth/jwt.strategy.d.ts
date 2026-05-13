import { Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';
declare const JwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
    private prisma;
    constructor(prisma: PrismaService);
    validate(payload: any): Promise<{
        userId: any;
        tenantId: any;
        role: any;
        user: {
            tenant: {
                id: string;
                slug: string;
                name: string;
                gstin: string | null;
                state_code: string | null;
                address: string | null;
                subscription_plan: import("@prisma/client").$Enums.SubscriptionPlan;
                subscription_status: import("@prisma/client").$Enums.SubscriptionStatus;
                subscription_start_at: Date | null;
                subscription_ends_at: Date | null;
                settings: import("@prisma/client/runtime/library").JsonValue | null;
                is_active: boolean;
                created_at: Date;
            };
        } & {
            id: string;
            name: string;
            is_active: boolean;
            tenant_id: string;
            mobile: string;
            email: string | null;
            role: import("@prisma/client").$Enums.Role;
            pin_hash: string;
        };
    }>;
}
export {};
