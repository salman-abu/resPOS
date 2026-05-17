export declare class GenerateInvoiceDto {
    order_id: string;
    discount?: number;
    discount_type?: 'PERCENT' | 'FLAT';
    discount_approved_by?: string;
    service_charge?: number;
}
export declare class RecordPaymentDto {
    amount: number;
    method: 'CASH' | 'CARD' | 'UPI' | 'WALLET' | 'COMPLIMENTARY';
    upi_ref?: string;
    transaction_id?: string;
}
export declare class SettleInvoiceDto {
    payments: RecordPaymentDto[];
    customer_id?: string;
    redeem_points?: number;
}
export declare class OpenShiftDto {
    opening_float: number;
}
export declare class CloseShiftDto {
    closing_float: number;
    petty_cash?: number;
}
