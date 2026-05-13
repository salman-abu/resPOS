import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
export declare class AuthService {
    private prisma;
    private jwtService;
    constructor(prisma: PrismaService, jwtService: JwtService);
    getTerminalInfo(tenantId: string): Promise<{
        tenantName: string;
        staff: {
            id: string;
            name: string;
            role: import("@prisma/client").$Enums.Role;
        }[];
    }>;
    loginWithPin(tenantId: string, userId: string, pin: string): Promise<{
        access_token: string;
        user: {
            id: string;
            name: string;
            role: import("@prisma/client").$Enums.Role;
            tenant_id: string;
        };
    }>;
    loginOwner(email: string, pin: string): Promise<{
        access_token: string;
        user: {
            id: string;
            name: string;
            role: "OWNER";
            tenant_id: string;
        };
    }>;
}
