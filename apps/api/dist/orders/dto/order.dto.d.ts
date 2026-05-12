export declare class CreateOrderItemDto {
    item_id: string;
    variant_id?: string;
    quantity: number;
    unit_price: number;
    notes?: string;
    course_number: number;
}
export declare class CreateOrderDto {
    order_type: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY' | 'AGGREGATOR';
    table_id?: string;
    pax_count?: number;
    items: CreateOrderItemDto[];
}
export declare class FireKotDto {
    order_id: string;
    item_ids: string[];
}
export declare class AddItemsToOrderDto {
    items: CreateOrderItemDto[];
}
