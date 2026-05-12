import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
export declare class SuperAdminService {
    private prisma;
    private jwtService;
    constructor(prisma: PrismaService, jwtService: JwtService);
    login(email: string, passwordString: string): Promise<{
        access_token: string;
        admin: {
            name: string;
            email: string;
            level: number;
        };
    }>;
    getDashboardStats(): Promise<{
        totalTenants: number;
        activeTenants: number;
        totalOrders: number;
        totalGmv: number;
    }>;
    getAllTenants(): Promise<({
        _count: {
            users: number;
            outlets: number;
            orders: number;
        };
    } & {
        id: string;
        name: string;
        is_active: boolean;
        slug: string;
        gstin: string | null;
        state_code: string | null;
        address: string | null;
        subscription_plan: import("@prisma/client").$Enums.SubscriptionPlan;
        settings: import("@prisma/client/runtime/library").JsonValue | null;
        created_at: Date;
    })[]>;
    toggleTenantStatus(id: string, is_active: boolean): Promise<{
        id: string;
        name: string;
        is_active: boolean;
        slug: string;
        gstin: string | null;
        state_code: string | null;
        address: string | null;
        subscription_plan: import("@prisma/client").$Enums.SubscriptionPlan;
        settings: import("@prisma/client/runtime/library").JsonValue | null;
        created_at: Date;
    }>;
    impersonateTenant(tenantId: string): Promise<{
        access_token: string;
        tenant_name: string;
    }>;
}
