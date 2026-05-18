import { OrdersService } from './orders.service';
import { CreateOrderDto, AddItemsToOrderDto } from './dto/order.dto';
export declare class OrdersController {
    private readonly ordersService;
    constructor(ordersService: OrdersService);
    getCfdOrders(req: any): Promise<{
        status: import("@prisma/client").$Enums.OrderStatus;
        id: string;
        order_name: string | null;
        queue_token_number: number | null;
    }[]>;
    createOrder(req: any, dto: CreateOrderDto): Promise<{
        table: {
            table_number: string;
        } | null;
        order_items: ({
            item: {
                name: string;
                station_route: import("@prisma/client").$Enums.StationRoute;
            };
            variant: {
                id: string;
                name: string;
                item_id: string;
                additional_price: number;
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
        status: import("@prisma/client").$Enums.OrderStatus;
        id: string;
        created_at: Date;
        tenant_id: string;
        order_type: import("@prisma/client").$Enums.OrderType;
        table_id: string | null;
        pax_count: number | null;
        customer_id: string | null;
        order_name: string | null;
        brand_id: string | null;
        source: import("@prisma/client").$Enums.OrderSource;
        kot_number: string | null;
        training_session_id: string | null;
        aggregator_source: import("@prisma/client").$Enums.AggregatorSource | null;
        aggregator_order_id: string | null;
        external_ref: string | null;
        is_tab_open: boolean;
        tab_name: string | null;
        queue_token_number: number | null;
        kiosk_session_id: string | null;
        kiosk_terminal_id: string | null;
        customer_phone: string | null;
        delivery_address: string | null;
        estimated_time: Date | null;
        tracking_status: import("@prisma/client").$Enums.OnlineTrackingStatus | null;
        settled_at: Date | null;
        outlet_id: string;
        waiter_id: string | null;
        captain_id: string | null;
    }>;
    getActiveOrders(req: any, tableId?: string): Promise<({
        table: {
            table_number: string;
        } | null;
        order_items: ({
            item: {
                name: string;
                base_price: number;
                item_type: import("@prisma/client").$Enums.ItemType;
                tax_slab: import("@prisma/client").$Enums.TaxSlab;
                station_route: import("@prisma/client").$Enums.StationRoute;
            };
            variant: {
                id: string;
                name: string;
                item_id: string;
                additional_price: number;
            } | null;
            addons: {
                id: string;
                name: string;
                price: number;
                modifier_id: string | null;
                addon_id: string;
                order_item_id: string;
            }[];
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
        status: import("@prisma/client").$Enums.OrderStatus;
        id: string;
        created_at: Date;
        tenant_id: string;
        order_type: import("@prisma/client").$Enums.OrderType;
        table_id: string | null;
        pax_count: number | null;
        customer_id: string | null;
        order_name: string | null;
        brand_id: string | null;
        source: import("@prisma/client").$Enums.OrderSource;
        kot_number: string | null;
        training_session_id: string | null;
        aggregator_source: import("@prisma/client").$Enums.AggregatorSource | null;
        aggregator_order_id: string | null;
        external_ref: string | null;
        is_tab_open: boolean;
        tab_name: string | null;
        queue_token_number: number | null;
        kiosk_session_id: string | null;
        kiosk_terminal_id: string | null;
        customer_phone: string | null;
        delivery_address: string | null;
        estimated_time: Date | null;
        tracking_status: import("@prisma/client").$Enums.OnlineTrackingStatus | null;
        settled_at: Date | null;
        outlet_id: string;
        waiter_id: string | null;
        captain_id: string | null;
    }) | null> | Promise<({
        table: {
            table_number: string;
        } | null;
        order_items: {
            item: {
                name: string;
            };
            status: import("@prisma/client").$Enums.OrderItemStatus;
            id: string;
            quantity: number;
            unit_price: number;
        }[];
    } & {
        status: import("@prisma/client").$Enums.OrderStatus;
        id: string;
        created_at: Date;
        tenant_id: string;
        order_type: import("@prisma/client").$Enums.OrderType;
        table_id: string | null;
        pax_count: number | null;
        customer_id: string | null;
        order_name: string | null;
        brand_id: string | null;
        source: import("@prisma/client").$Enums.OrderSource;
        kot_number: string | null;
        training_session_id: string | null;
        aggregator_source: import("@prisma/client").$Enums.AggregatorSource | null;
        aggregator_order_id: string | null;
        external_ref: string | null;
        is_tab_open: boolean;
        tab_name: string | null;
        queue_token_number: number | null;
        kiosk_session_id: string | null;
        kiosk_terminal_id: string | null;
        customer_phone: string | null;
        delivery_address: string | null;
        estimated_time: Date | null;
        tracking_status: import("@prisma/client").$Enums.OnlineTrackingStatus | null;
        settled_at: Date | null;
        outlet_id: string;
        waiter_id: string | null;
        captain_id: string | null;
    })[]>;
    getOpenTabs(req: any): Promise<({
        table: {
            table_number: string;
        } | null;
        order_items: ({
            item: {
                id: string;
                tenant_id: string;
                name: string;
                description: string | null;
                sort_order: number;
                category_id: string;
                base_price: number;
                image_url: string | null;
                item_type: import("@prisma/client").$Enums.ItemType;
                hsn_code: string | null;
                tax_slab: import("@prisma/client").$Enums.TaxSlab;
                is_available: boolean;
                station_route: import("@prisma/client").$Enums.StationRoute;
            };
            variant: {
                id: string;
                name: string;
                item_id: string;
                additional_price: number;
            } | null;
            addons: {
                id: string;
                name: string;
                price: number;
                modifier_id: string | null;
                addon_id: string;
                order_item_id: string;
            }[];
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
        status: import("@prisma/client").$Enums.OrderStatus;
        id: string;
        created_at: Date;
        tenant_id: string;
        order_type: import("@prisma/client").$Enums.OrderType;
        table_id: string | null;
        pax_count: number | null;
        customer_id: string | null;
        order_name: string | null;
        brand_id: string | null;
        source: import("@prisma/client").$Enums.OrderSource;
        kot_number: string | null;
        training_session_id: string | null;
        aggregator_source: import("@prisma/client").$Enums.AggregatorSource | null;
        aggregator_order_id: string | null;
        external_ref: string | null;
        is_tab_open: boolean;
        tab_name: string | null;
        queue_token_number: number | null;
        kiosk_session_id: string | null;
        kiosk_terminal_id: string | null;
        customer_phone: string | null;
        delivery_address: string | null;
        estimated_time: Date | null;
        tracking_status: import("@prisma/client").$Enums.OnlineTrackingStatus | null;
        settled_at: Date | null;
        outlet_id: string;
        waiter_id: string | null;
        captain_id: string | null;
    })[]>;
    getOrder(req: any, id: string): Promise<{
        table: {
            status: import("@prisma/client").$Enums.TableStatus;
            id: string;
            tenant_id: string;
            zone_id: string;
            table_number: string;
            capacity: number;
            current_order_id: string | null;
        } | null;
        kots: ({
            items: {
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
            }[];
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
        })[];
        invoices: ({
            payments: {
                status: import("@prisma/client").$Enums.PaymentStatus;
                id: string;
                created_at: Date;
                invoice_id: string;
                amount: number;
                method: import("@prisma/client").$Enums.PaymentMethod;
                upi_ref: string | null;
                transaction_id: string | null;
            }[];
        } & {
            id: string;
            created_at: Date;
            tenant_id: string;
            total: number;
            order_id: string;
            printed_at: Date | null;
            training_session_id: string | null;
            invoice_number: string;
            subtotal: number;
            cgst: number;
            sgst: number;
            igst: number;
            service_charge: number;
            discount: number;
            discount_type: import("@prisma/client").$Enums.DiscountType | null;
            discount_approved_by: string | null;
            updated_at: Date;
        })[];
        order_items: ({
            item: {
                name: string;
                item_type: import("@prisma/client").$Enums.ItemType;
                tax_slab: import("@prisma/client").$Enums.TaxSlab;
                station_route: import("@prisma/client").$Enums.StationRoute;
            };
            variant: {
                id: string;
                name: string;
                item_id: string;
                additional_price: number;
            } | null;
            addons: {
                id: string;
                name: string;
                price: number;
                modifier_id: string | null;
                addon_id: string;
                order_item_id: string;
            }[];
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
        status: import("@prisma/client").$Enums.OrderStatus;
        id: string;
        created_at: Date;
        tenant_id: string;
        order_type: import("@prisma/client").$Enums.OrderType;
        table_id: string | null;
        pax_count: number | null;
        customer_id: string | null;
        order_name: string | null;
        brand_id: string | null;
        source: import("@prisma/client").$Enums.OrderSource;
        kot_number: string | null;
        training_session_id: string | null;
        aggregator_source: import("@prisma/client").$Enums.AggregatorSource | null;
        aggregator_order_id: string | null;
        external_ref: string | null;
        is_tab_open: boolean;
        tab_name: string | null;
        queue_token_number: number | null;
        kiosk_session_id: string | null;
        kiosk_terminal_id: string | null;
        customer_phone: string | null;
        delivery_address: string | null;
        estimated_time: Date | null;
        tracking_status: import("@prisma/client").$Enums.OnlineTrackingStatus | null;
        settled_at: Date | null;
        outlet_id: string;
        waiter_id: string | null;
        captain_id: string | null;
    }>;
    getLastRound(req: any, id: string): Promise<({
        item: {
            id: string;
            tenant_id: string;
            name: string;
            description: string | null;
            sort_order: number;
            category_id: string;
            base_price: number;
            image_url: string | null;
            item_type: import("@prisma/client").$Enums.ItemType;
            hsn_code: string | null;
            tax_slab: import("@prisma/client").$Enums.TaxSlab;
            is_available: boolean;
            station_route: import("@prisma/client").$Enums.StationRoute;
        };
        variant: {
            id: string;
            name: string;
            item_id: string;
            additional_price: number;
        } | null;
        addons: {
            id: string;
            name: string;
            price: number;
            modifier_id: string | null;
            addon_id: string;
            order_item_id: string;
        }[];
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
    })[]>;
    addItems(req: any, id: string, dto: AddItemsToOrderDto): Promise<{
        order_id: string;
        added_items: ({
            item: {
                name: string;
                station_route: import("@prisma/client").$Enums.StationRoute;
            };
            variant: {
                id: string;
                name: string;
                item_id: string;
                additional_price: number;
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
    }>;
    fireKot(req: any, id: string, body: {
        item_ids: string[];
    }): Promise<{
        order_id: string;
        table_number: string | undefined;
        kots: any[];
    }>;
    voidOrder(req: any, id: string, reason: string): Promise<{
        success: boolean;
    }>;
    holdItems(req: any, id: string, itemIds: string[]): Promise<{
        success: boolean;
    }>;
    fireHeldItems(req: any, id: string, courseNumber?: number): Promise<{
        order_id: string;
        table_number: string | undefined;
        kots: any[];
    }>;
    openTab(req: any, id: string, tabName: string): Promise<{
        status: import("@prisma/client").$Enums.OrderStatus;
        id: string;
        created_at: Date;
        tenant_id: string;
        order_type: import("@prisma/client").$Enums.OrderType;
        table_id: string | null;
        pax_count: number | null;
        customer_id: string | null;
        order_name: string | null;
        brand_id: string | null;
        source: import("@prisma/client").$Enums.OrderSource;
        kot_number: string | null;
        training_session_id: string | null;
        aggregator_source: import("@prisma/client").$Enums.AggregatorSource | null;
        aggregator_order_id: string | null;
        external_ref: string | null;
        is_tab_open: boolean;
        tab_name: string | null;
        queue_token_number: number | null;
        kiosk_session_id: string | null;
        kiosk_terminal_id: string | null;
        customer_phone: string | null;
        delivery_address: string | null;
        estimated_time: Date | null;
        tracking_status: import("@prisma/client").$Enums.OnlineTrackingStatus | null;
        settled_at: Date | null;
        outlet_id: string;
        waiter_id: string | null;
        captain_id: string | null;
    }>;
    attachCustomer(req: any, id: string, customerId: string): Promise<{
        status: import("@prisma/client").$Enums.OrderStatus;
        id: string;
        created_at: Date;
        tenant_id: string;
        order_type: import("@prisma/client").$Enums.OrderType;
        table_id: string | null;
        pax_count: number | null;
        customer_id: string | null;
        order_name: string | null;
        brand_id: string | null;
        source: import("@prisma/client").$Enums.OrderSource;
        kot_number: string | null;
        training_session_id: string | null;
        aggregator_source: import("@prisma/client").$Enums.AggregatorSource | null;
        aggregator_order_id: string | null;
        external_ref: string | null;
        is_tab_open: boolean;
        tab_name: string | null;
        queue_token_number: number | null;
        kiosk_session_id: string | null;
        kiosk_terminal_id: string | null;
        customer_phone: string | null;
        delivery_address: string | null;
        estimated_time: Date | null;
        tracking_status: import("@prisma/client").$Enums.OnlineTrackingStatus | null;
        settled_at: Date | null;
        outlet_id: string;
        waiter_id: string | null;
        captain_id: string | null;
    }>;
    transferOrder(req: any, id: string, newTableId: string): Promise<{
        success: boolean;
        order_id: string;
        new_table_id: string;
    }>;
    voidItem(req: any, id: string, itemId: string): Promise<{
        job_id: string;
        undo_window_ms: number;
    }>;
    loadTemplate(req: any, body: {
        history_id: string;
    }): Promise<{
        items: any[];
        skipped: string[];
        original_total: any;
    }>;
}
export declare class VoidJobController {
    cancelVoidJob(id: string): {
        cancelled: boolean;
    };
}
