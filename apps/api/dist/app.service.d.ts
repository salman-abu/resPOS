import { PrismaService } from './prisma/prisma.service';
export declare class AppService {
    private prisma;
    constructor(prisma: PrismaService);
    getHello(): Promise<{
        status: string;
        database: string;
    }>;
}
