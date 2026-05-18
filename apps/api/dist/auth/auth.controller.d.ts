import { AuthService } from './auth.service';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    loginStaff(body: {
        tenantId: string;
        userId: string;
        pin: string;
        mode?: 'LIVE' | 'TRAINING';
    }): Promise<{
        access_token: string;
        user: {
            id: string;
            name: string;
            role: import("@prisma/client").$Enums.Role;
            tenant_id: string;
            mode: "LIVE" | "TRAINING";
        };
    }>;
    loginOwner(body: {
        email: string;
        pin: string;
        mode?: 'LIVE' | 'TRAINING';
    }): Promise<{
        access_token: string;
        user: {
            id: string;
            name: string;
            role: "OWNER";
            tenant_id: string;
            mode: "LIVE" | "TRAINING";
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
    verifyManagerPin(body: {
        tenantId: string;
        managerId: string;
        pin: string;
    }): Promise<{
        authorization_token: string;
        manager_name: string;
        expires_in: number;
    }>;
}
