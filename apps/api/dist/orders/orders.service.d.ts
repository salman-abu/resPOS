import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto, AddItemsToOrderDto } from './dto/order.dto';
import { $Enums } from '@prisma/client';
import { KdsGateway } from '../kds/kds.gateway';
import { InventoryService } from '../inventory/inventory.service';
export declare class OrdersService {
    private prisma;
    private kdsGateway;
    private inventoryService;
    constructor(prisma: PrismaService, kdsGateway: KdsGateway, inventoryService: InventoryService);
    private getDefaultOutlet;
    createOrder(tenantId: string, userId: string, dto: CreateOrderDto): Promise<{
        table: {
            table_number: string;
        } | null;
        order_items: ({
            item: {
                name: string;
                station_route: $Enums.StationRoute;
            };
            variant: {
                id: string;
                name: string;
                item_id: string;
                additional_price: number;
            } | null;
        } & {
            status: $Enums.OrderItemStatus;
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
        status: $Enums.OrderStatus;
        id: string;
        created_at: Date;
        tenant_id: string;
        order_type: $Enums.OrderType;
        table_id: string | null;
        pax_count: number | null;
        aggregator_source: $Enums.AggregatorSource | null;
        aggregator_order_id: string | null;
        external_ref: string | null;
        settled_at: Date | null;
        outlet_id: string;
        waiter_id: string | null;
        captain_id: string | null;
    }>;
    addItems(tenantId: string, orderId: string, dto: AddItemsToOrderDto): Promise<{
        order_id: string;
        added_items: ({
            item: {
                name: string;
                station_route: $Enums.StationRoute;
            };
            variant: {
                id: string;
                name: string;
                item_id: string;
                additional_price: number;
            } | null;
        } & {
            status: $Enums.OrderItemStatus;
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
    }>;
    fireKot(tenantId: string, orderId: string, userId: string, itemIds: string[]): Promise<{
        order_id: string;
        table_number: string | undefined;
        kots: any[];
    }>;
    getOrder(tenantId: string, orderId: string): Promise<{
        table: {
            status: $Enums.TableStatus;
            id: string;
            tenant_id: string;
            zone_id: string;
            table_number: string;
            capacity: number;
            current_order_id: string | null;
        } | null;
        kots: ({
            items: {
                status: $Enums.OrderItemStatus;
                id: string;
                item_id: string;
                variant_id: string | null;
                quantity: number;
                unit_price: number;
                notes: string | null;
                course_number: number;
                order_id: string;
                kot_id: string | null;
            }[];
        } & {
            status: $Enums.KotStatus;
            id: string;
            tenant_id: string;
            order_id: string;
            station: $Enums.StationRoute;
            kot_number: string;
            printed_at: Date | null;
            fired_by_id: string;
        })[];
        order_items: ({
            item: {
                name: string;
                item_type: $Enums.ItemType;
                station_route: $Enums.StationRoute;
            };
            variant: {
                id: string;
                name: string;
                item_id: string;
                additional_price: number;
            } | null;
        } & {
            status: $Enums.OrderItemStatus;
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
        invoices: ({
            payments: {
                status: $Enums.PaymentStatus;
                id: string;
                created_at: Date;
                invoice_id: string;
                amount: number;
                method: $Enums.PaymentMethod;
                upi_ref: string | null;
                transaction_id: string | null;
            }[];
        } & {
            id: string;
            order_id: string;
            printed_at: Date | null;
            invoice_number: string;
            subtotal: number;
            cgst: number;
            sgst: number;
            igst: number;
            service_charge: number;
            discount: number;
            discount_type: $Enums.DiscountType | null;
            discount_approved_by: string | null;
            total: number;
        })[];
    } & {
        status: $Enums.OrderStatus;
        id: string;
        created_at: Date;
        tenant_id: string;
        order_type: $Enums.OrderType;
        table_id: string | null;
        pax_count: number | null;
        aggregator_source: $Enums.AggregatorSource | null;
        aggregator_order_id: string | null;
        external_ref: string | null;
        settled_at: Date | null;
        outlet_id: string;
        waiter_id: string | null;
        captain_id: string | null;
    }>;
    getActiveOrders(tenantId: string): Promise<({
        table: {
            table_number: string;
        } | null;
        order_items: {
            status: $Enums.OrderItemStatus;
            id: string;
            quantity: number;
            unit_price: number;
        }[];
    } & {
        status: $Enums.OrderStatus;
        id: string;
        created_at: Date;
        tenant_id: string;
        order_type: $Enums.OrderType;
        table_id: string | null;
        pax_count: number | null;
        aggregator_source: $Enums.AggregatorSource | null;
        aggregator_order_id: string | null;
        external_ref: string | null;
        settled_at: Date | null;
        outlet_id: string;
        waiter_id: string | null;
        captain_id: string | null;
    })[]>;
    voidOrder(tenantId: string, orderId: string, reason: string): Promise<{
        success: boolean;
    }>;
}
