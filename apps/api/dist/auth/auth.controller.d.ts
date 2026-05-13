import { AuthService } from './auth.service';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    loginStaff(body: {
        tenantId: string;
        userId: string;
        pin: string;
    }): Promise<{
        access_token: string;
        user: {
            id: string;
            name: string;
            role: import("@prisma/client").$Enums.Role;
            tenant_id: string;
        };
    }>;
    loginOwner(body: {
        email: string;
        pin: string;
    }): Promise<{
        access_token: string;
        user: {
            id: string;
            name: string;
            role: "OWNER";
            tenant_id: string;
        };
    }>;
    getTerminalInfo(tenantId: string): Promise<{
        tenantName: string;
        staff: {
            id: string;
            name: string;
            role: import("@prisma/client").$Enums.Role;
        }[];
    } | {
        error: string;
    }>;
}
