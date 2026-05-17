export declare class CreateOrderItemAddonDto {
    id: string;
    name: string;
    price: number;
    modifier_id?: string;
}
export declare class CreateOrderItemDto {
    item_id: string;
    variant_id?: string;
    quantity: number;
    unit_price: number;
    notes?: string;
    course_number: number;
    addons?: CreateOrderItemAddonDto[];
    fire_status?: 'HELD' | 'FIRED';
    seat_number?: number;
}
export declare class CreateOrderDto {
    order_type: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY' | 'AGGREGATOR';
    table_id?: string;
    pax_count?: number;
    customer_id?: string;
    order_name?: string;
    brand_id?: string;
    source?: string;
    items: CreateOrderItemDto[];
}
export declare class FireKotDto {
    order_id: string;
    item_ids: string[];
}
export declare class AddItemsToOrderDto {
    items: CreateOrderItemDto[];
}
