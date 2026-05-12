import { AggregatorsService } from './aggregators.service';
export declare class AggregatorsController {
    private readonly aggregatorsService;
    constructor(aggregatorsService: AggregatorsService);
    handleWebhook(aggregatorStr: string, tenantId: string, signature: string, payload: any): Promise<{
        success: boolean;
        order_id: string;
        external_ref: any;
        message: string;
    }>;
    syncMenu(aggregatorStr: string, tenantId: string): Promise<{
        success: boolean;
        count: number;
        aggregator: import("@prisma/client").$Enums.AggregatorSource;
    }>;
}
