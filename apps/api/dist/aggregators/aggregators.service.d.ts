import { PrismaService } from '../prisma/prisma.service';
import { OrdersService } from '../orders/orders.service';
import { $Enums } from '@prisma/client';
export declare class AggregatorsService {
    private prisma;
    private ordersService;
    private readonly logger;
    constructor(prisma: PrismaService, ordersService: OrdersService);
    handleWebhook(tenantId: string, aggregator: $Enums.AggregatorSource, payload: any): Promise<{
        success: boolean;
        order_id: string;
        external_ref: any;
        message: string;
    }>;
    syncMenu(tenantId: string, aggregator: $Enums.AggregatorSource): Promise<{
        success: boolean;
        count: number;
        aggregator: $Enums.AggregatorSource;
    }>;
}
