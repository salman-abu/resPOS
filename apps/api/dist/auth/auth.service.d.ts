import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
export declare class AuthService {
    private prisma;
    private jwtService;
    private auditService;
    private redis;
    constructor(prisma: PrismaService, jwtService: JwtService, auditService: AuditService);
    getTerminalInfo(tenantId: string): Promise<{
        tenantName: string;
        staff: {
            id: string;
            name: string;
            role: import("@prisma/client").$Enums.Role;
        }[];
    }>;
    loginWithPin(tenantId: string, userId: string, pin: string, mode?: 'LIVE' | 'TRAINING'): Promise<{
        access_token: string;
        user: {
            id: string;
            name: string;
            role: import("@prisma/client").$Enums.Role;
            tenant_id: string;
            mode: "LIVE" | "TRAINING";
        };
    }>;
    loginOwner(email: string, pin: string, mode?: 'LIVE' | 'TRAINING'): Promise<{
        access_token: string;
        user: {
            id: string;
            name: string;
            role: "OWNER";
            tenant_id: string;
            mode: "LIVE" | "TRAINING";
        };
    }>;
    verifyManagerPin(tenantId: string, managerId: string, pin: string): Promise<{
        authorization_token: string;
        manager_name: string;
        expires_in: number;
    }>;
    validateManagerAuthToken(token: string): Promise<boolean>;
}
