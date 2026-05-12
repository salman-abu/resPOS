import { AggregatorsService } from './aggregators.service';
import { $Enums } from '@prisma/client';
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
        aggregator: $Enums.AggregatorSource;
    }>;
}
