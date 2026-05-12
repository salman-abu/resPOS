import { KdsService } from './kds.service';
export declare class KdsController {
    private readonly kdsService;
    constructor(kdsService: KdsService);
    getActiveKots(req: any, station?: string): Promise<({
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
            order_id: string;
            kot_id: string | null;
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
    })[]>;
    markItemDone(req: any, kotId: string, itemId: string, done: boolean): Promise<{
        success: boolean;
        all_done: boolean;
    }>;
    bumpKot(req: any, kotId: string): Promise<{
        success: boolean;
        kot_id: string;
    }>;
    recallKot(req: any, kotId: string): Promise<{
        success: boolean;
    }>;
}
