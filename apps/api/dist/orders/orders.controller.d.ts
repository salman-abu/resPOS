import { OrdersService } from './orders.service';
import { CreateOrderDto, AddItemsToOrderDto } from './dto/order.dto';
export declare class OrdersController {
    private readonly ordersService;
    constructor(ordersService: OrdersService);
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
            id: string;
            item_id: string;
            variant_id: string | null;
            quantity: number;
            unit_price: number;
            notes: string | null;
            course_number: number;
            order_id: string;
            status: import("@prisma/client").$Enums.OrderItemStatus;
            kot_id: string | null;
        })[];
    } & {
        id: string;
        tenant_id: string;
        created_at: Date;
        order_type: import("@prisma/client").$Enums.OrderType;
        table_id: string | null;
        pax_count: number | null;
        status: import("@prisma/client").$Enums.OrderStatus;
        aggregator_source: import("@prisma/client").$Enums.AggregatorSource | null;
        aggregator_order_id: string | null;
        external_ref: string | null;
        settled_at: Date | null;
        outlet_id: string;
        waiter_id: string | null;
        captain_id: string | null;
    }>;
    getActiveOrders(req: any): Promise<({
        table: {
            table_number: string;
        } | null;
        order_items: {
            id: string;
            quantity: number;
            unit_price: number;
            status: import("@prisma/client").$Enums.OrderItemStatus;
        }[];
    } & {
        id: string;
        tenant_id: string;
        created_at: Date;
        order_type: import("@prisma/client").$Enums.OrderType;
        table_id: string | null;
        pax_count: number | null;
        status: import("@prisma/client").$Enums.OrderStatus;
        aggregator_source: import("@prisma/client").$Enums.AggregatorSource | null;
        aggregator_order_id: string | null;
        external_ref: string | null;
        settled_at: Date | null;
        outlet_id: string;
        waiter_id: string | null;
        captain_id: string | null;
    })[]>;
    getOrder(req: any, id: string): Promise<{
        table: {
            id: string;
            tenant_id: string;
            status: import("@prisma/client").$Enums.TableStatus;
            zone_id: string;
            table_number: string;
            capacity: number;
            current_order_id: string | null;
        } | null;
        kots: ({
            items: {
                id: string;
                item_id: string;
                variant_id: string | null;
                quantity: number;
                unit_price: number;
                notes: string | null;
                course_number: number;
                order_id: string;
                status: import("@prisma/client").$Enums.OrderItemStatus;
                kot_id: string | null;
            }[];
        } & {
            id: string;
            tenant_id: string;
            order_id: string;
            station: import("@prisma/client").$Enums.StationRoute;
            kot_number: string;
            status: import("@prisma/client").$Enums.KotStatus;
            printed_at: Date | null;
            fired_by_id: string;
        })[];
        order_items: ({
            item: {
                name: string;
                item_type: import("@prisma/client").$Enums.ItemType;
                station_route: import("@prisma/client").$Enums.StationRoute;
            };
            variant: {
                id: string;
                name: string;
                item_id: string;
                additional_price: number;
            } | null;
        } & {
            id: string;
            item_id: string;
            variant_id: string | null;
            quantity: number;
            unit_price: number;
            notes: string | null;
            course_number: number;
            order_id: string;
            status: import("@prisma/client").$Enums.OrderItemStatus;
            kot_id: string | null;
        })[];
        invoices: ({
            payments: {
                id: string;
                created_at: Date;
                status: import("@prisma/client").$Enums.PaymentStatus;
                amount: number;
                method: import("@prisma/client").$Enums.PaymentMethod;
                upi_ref: string | null;
                transaction_id: string | null;
                invoice_id: string;
            }[];
        } & {
            id: string;
            order_id: string;
            printed_at: Date | null;
            discount: number;
            discount_type: import("@prisma/client").$Enums.DiscountType | null;
            discount_approved_by: string | null;
            service_charge: number;
            invoice_number: string;
            subtotal: number;
            cgst: number;
            sgst: number;
            igst: number;
            total: number;
        })[];
    } & {
        id: string;
        tenant_id: string;
        created_at: Date;
        order_type: import("@prisma/client").$Enums.OrderType;
        table_id: string | null;
        pax_count: number | null;
        status: import("@prisma/client").$Enums.OrderStatus;
        aggregator_source: import("@prisma/client").$Enums.AggregatorSource | null;
        aggregator_order_id: string | null;
        external_ref: string | null;
        settled_at: Date | null;
        outlet_id: string;
        waiter_id: string | null;
        captain_id: string | null;
    }>;
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
            id: string;
            item_id: string;
            variant_id: string | null;
            quantity: number;
            unit_price: number;
            notes: string | null;
            course_number: number;
            order_id: string;
            status: import("@prisma/client").$Enums.OrderItemStatus;
            kot_id: string | null;
        })[];
    }>;
    fireKot(req: any, id: string, body: {
        item_ids: string[];
    }): Promise<{
        order_id: string;
        table_number: string | undefined;
        kots: ({
            items: ({
                item: {
                    name: string;
                };
                variant: {
                    name: string;
                } | null;
            } & {
                id: string;
                item_id: string;
                variant_id: string | null;
                quantity: number;
                unit_price: number;
                notes: string | null;
                course_number: number;
                order_id: string;
                status: import("@prisma/client").$Enums.OrderItemStatus;
                kot_id: string | null;
            })[];
        } & {
            id: string;
            tenant_id: string;
            order_id: string;
            station: import("@prisma/client").$Enums.StationRoute;
            kot_number: string;
            status: import("@prisma/client").$Enums.KotStatus;
            printed_at: Date | null;
            fired_by_id: string;
        })[];
    }>;
    voidOrder(req: any, id: string, reason: string): Promise<{
        success: boolean;
    }>;
}
