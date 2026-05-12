import { SuperAdminService } from './superadmin.service';
export declare class SuperAdminController {
    private readonly superAdminService;
    constructor(superAdminService: SuperAdminService);
    login(body: {
        email: string;
        passwordString: string;
    }): Promise<{
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
    impersonateTenant(id: string): Promise<{
        access_token: string;
        tenant_name: string;
    }>;
}
