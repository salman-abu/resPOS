import { PrismaService } from '../prisma/prisma.service';
import { KdsGateway } from './kds.gateway';
import { AuditService } from '../audit/audit.service';
export declare class KdsService {
    private prisma;
    private kdsGateway;
    private auditService;
    constructor(prisma: PrismaService, kdsGateway: KdsGateway, auditService: AuditService);
    getActiveKots(tenantId: string, station?: string): Promise<({
        order: {
            table: {
                table_number: string;
            } | null;
            order_type: import("@prisma/client").$Enums.OrderType;
            pax_count: number | null;
        };
        items: ({
            item: {
                name: string;
            };
            variant: {
                name: string;
            } | null;
        } & {
            status: import("@prisma/client").$Enums.OrderItemStatus;
            id: string;
            item_id: string;
            variant_id: string | null;
            quantity: number;
            unit_price: number;
            notes: string | null;
            course_number: number;
            fire_status: import("@prisma/client").$Enums.FireStatus;
            seat_number: number | null;
            order_id: string;
            kot_id: string | null;
            invoice_id: string | null;
        })[];
    } & {
        status: import("@prisma/client").$Enums.KotStatus;
        id: string;
        tenant_id: string;
        order_id: string;
        station: import("@prisma/client").$Enums.StationRoute;
        kot_number: string;
        printed_at: Date | null;
        fired_by_id: string;
        training_session_id: string | null;
    })[]>;
    markItemDone(tenantId: string, kotId: string, orderItemId: string, done: boolean): Promise<{
        success: boolean;
        all_done: boolean;
    }>;
    bumpKot(tenantId: string, kotId: string): Promise<{
        success: boolean;
        kot_id: string;
    }>;
    recallKot(tenantId: string, userId: string, kotId: string): Promise<{
        success: boolean;
    }>;
    private getKotById;
}
