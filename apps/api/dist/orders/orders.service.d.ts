import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto, AddItemsToOrderDto } from './dto/order.dto';
import { $Enums } from '@prisma/client';
import { KdsGateway } from '../kds/kds.gateway';
import { FloorPlanGateway } from '../floor-plan/floor-plan.gateway';
import { InventoryService } from '../inventory/inventory.service';
import { AuditService } from '../audit/audit.service';
export declare class OrdersService {
    private prisma;
    private kdsGateway;
    private floorPlanGateway;
    private inventoryService;
    private auditService;
    constructor(prisma: PrismaService, kdsGateway: KdsGateway, floorPlanGateway: FloorPlanGateway, inventoryService: InventoryService, auditService: AuditService);
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
            fire_status: $Enums.FireStatus;
            seat_number: number | null;
            order_id: string;
            kot_id: string | null;
            invoice_id: string | null;
        })[];
    } & {
        status: $Enums.OrderStatus;
        id: string;
        created_at: Date;
        tenant_id: string;
        order_type: $Enums.OrderType;
        table_id: string | null;
        pax_count: number | null;
        customer_id: string | null;
        order_name: string | null;
        brand_id: string | null;
        source: string | null;
        aggregator_source: $Enums.AggregatorSource | null;
        aggregator_order_id: string | null;
        external_ref: string | null;
        is_tab_open: boolean;
        tab_name: string | null;
        queue_token_number: number | null;
        customer_phone: string | null;
        delivery_address: string | null;
        estimated_time: Date | null;
        tracking_status: $Enums.OnlineTrackingStatus | null;
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
            fire_status: $Enums.FireStatus;
            seat_number: number | null;
            order_id: string;
            kot_id: string | null;
            invoice_id: string | null;
        })[];
    }>;
    fireKot(tenantId: string, orderId: string, userId: string, itemIds: string[]): Promise<{
        order_id: string;
        table_number: string | undefined;
        kots: any[];
    }>;
    attachCustomer(tenantId: string, orderId: string, customerId: string): Promise<{
        status: $Enums.OrderStatus;
        id: string;
        created_at: Date;
        tenant_id: string;
        order_type: $Enums.OrderType;
        table_id: string | null;
        pax_count: number | null;
        customer_id: string | null;
        order_name: string | null;
        brand_id: string | null;
        source: string | null;
        aggregator_source: $Enums.AggregatorSource | null;
        aggregator_order_id: string | null;
        external_ref: string | null;
        is_tab_open: boolean;
        tab_name: string | null;
        queue_token_number: number | null;
        customer_phone: string | null;
        delivery_address: string | null;
        estimated_time: Date | null;
        tracking_status: $Enums.OnlineTrackingStatus | null;
        settled_at: Date | null;
        outlet_id: string;
        waiter_id: string | null;
        captain_id: string | null;
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
                fire_status: $Enums.FireStatus;
                seat_number: number | null;
                order_id: string;
                kot_id: string | null;
                invoice_id: string | null;
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
            created_at: Date;
            tenant_id: string;
            total: number;
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
            updated_at: Date;
        })[];
        order_items: ({
            item: {
                name: string;
                item_type: $Enums.ItemType;
                tax_slab: $Enums.TaxSlab;
                station_route: $Enums.StationRoute;
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
            status: $Enums.OrderItemStatus;
            id: string;
            item_id: string;
            variant_id: string | null;
            quantity: number;
            unit_price: number;
            notes: string | null;
            course_number: number;
            fire_status: $Enums.FireStatus;
            seat_number: number | null;
            order_id: string;
            kot_id: string | null;
            invoice_id: string | null;
        })[];
    } & {
        status: $Enums.OrderStatus;
        id: string;
        created_at: Date;
        tenant_id: string;
        order_type: $Enums.OrderType;
        table_id: string | null;
        pax_count: number | null;
        customer_id: string | null;
        order_name: string | null;
        brand_id: string | null;
        source: string | null;
        aggregator_source: $Enums.AggregatorSource | null;
        aggregator_order_id: string | null;
        external_ref: string | null;
        is_tab_open: boolean;
        tab_name: string | null;
        queue_token_number: number | null;
        customer_phone: string | null;
        delivery_address: string | null;
        estimated_time: Date | null;
        tracking_status: $Enums.OnlineTrackingStatus | null;
        settled_at: Date | null;
        outlet_id: string;
        waiter_id: string | null;
        captain_id: string | null;
    }>;
    getCfdOrders(tenantId: string): Promise<{
        status: $Enums.OrderStatus;
        id: string;
        order_name: string | null;
        queue_token_number: number | null;
    }[]>;
    getDispatchOrders(tenantId: string): Promise<({
        customer: {
            id: string;
            tenant_id: string;
            name: string;
            mobile: string;
            email: string | null;
            total_visits: number;
            total_spent: number;
            loyalty_points: number;
            tier: $Enums.LoyaltyTier;
            birthday: Date | null;
            last_visit_at: Date | null;
        } | null;
        order_items: ({
            item: {
                category: {
                    name: string;
                };
                name: string;
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
            status: $Enums.OrderItemStatus;
            id: string;
            item_id: string;
            variant_id: string | null;
            quantity: number;
            unit_price: number;
            notes: string | null;
            course_number: number;
            fire_status: $Enums.FireStatus;
            seat_number: number | null;
            order_id: string;
            kot_id: string | null;
            invoice_id: string | null;
        })[];
    } & {
        status: $Enums.OrderStatus;
        id: string;
        created_at: Date;
        tenant_id: string;
        order_type: $Enums.OrderType;
        table_id: string | null;
        pax_count: number | null;
        customer_id: string | null;
        order_name: string | null;
        brand_id: string | null;
        source: string | null;
        aggregator_source: $Enums.AggregatorSource | null;
        aggregator_order_id: string | null;
        external_ref: string | null;
        is_tab_open: boolean;
        tab_name: string | null;
        queue_token_number: number | null;
        customer_phone: string | null;
        delivery_address: string | null;
        estimated_time: Date | null;
        tracking_status: $Enums.OnlineTrackingStatus | null;
        settled_at: Date | null;
        outlet_id: string;
        waiter_id: string | null;
        captain_id: string | null;
    })[]>;
    getActiveOrderByTable(tenantId: string, tableId: string): Promise<({
        table: {
            table_number: string;
        } | null;
        order_items: ({
            item: {
                name: string;
                base_price: number;
                item_type: $Enums.ItemType;
                tax_slab: $Enums.TaxSlab;
                station_route: $Enums.StationRoute;
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
            status: $Enums.OrderItemStatus;
            id: string;
            item_id: string;
            variant_id: string | null;
            quantity: number;
            unit_price: number;
            notes: string | null;
            course_number: number;
            fire_status: $Enums.FireStatus;
            seat_number: number | null;
            order_id: string;
            kot_id: string | null;
            invoice_id: string | null;
        })[];
    } & {
        status: $Enums.OrderStatus;
        id: string;
        created_at: Date;
        tenant_id: string;
        order_type: $Enums.OrderType;
        table_id: string | null;
        pax_count: number | null;
        customer_id: string | null;
        order_name: string | null;
        brand_id: string | null;
        source: string | null;
        aggregator_source: $Enums.AggregatorSource | null;
        aggregator_order_id: string | null;
        external_ref: string | null;
        is_tab_open: boolean;
        tab_name: string | null;
        queue_token_number: number | null;
        customer_phone: string | null;
        delivery_address: string | null;
        estimated_time: Date | null;
        tracking_status: $Enums.OnlineTrackingStatus | null;
        settled_at: Date | null;
        outlet_id: string;
        waiter_id: string | null;
        captain_id: string | null;
    }) | null>;
    getActiveOrders(tenantId: string): Promise<({
        table: {
            table_number: string;
        } | null;
        order_items: {
            item: {
                name: string;
            };
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
        customer_id: string | null;
        order_name: string | null;
        brand_id: string | null;
        source: string | null;
        aggregator_source: $Enums.AggregatorSource | null;
        aggregator_order_id: string | null;
        external_ref: string | null;
        is_tab_open: boolean;
        tab_name: string | null;
        queue_token_number: number | null;
        customer_phone: string | null;
        delivery_address: string | null;
        estimated_time: Date | null;
        tracking_status: $Enums.OnlineTrackingStatus | null;
        settled_at: Date | null;
        outlet_id: string;
        waiter_id: string | null;
        captain_id: string | null;
    })[]>;
    voidOrder(tenantId: string, orderId: string, reason: string, userId: string): Promise<{
        success: boolean;
    }>;
    voidItem(tenantId: string, orderId: string, itemId: string, userId: string): Promise<{
        job_id: string;
        undo_window_ms: number;
    }>;
    holdItems(tenantId: string, orderId: string, itemIds: string[]): Promise<{
        success: boolean;
    }>;
    fireHeldItems(tenantId: string, orderId: string, userId: string, courseNumber?: number): Promise<{
        order_id: string;
        table_number: string | undefined;
        kots: any[];
    }>;
    openTab(tenantId: string, orderId: string, tabName: string): Promise<{
        status: $Enums.OrderStatus;
        id: string;
        created_at: Date;
        tenant_id: string;
        order_type: $Enums.OrderType;
        table_id: string | null;
        pax_count: number | null;
        customer_id: string | null;
        order_name: string | null;
        brand_id: string | null;
        source: string | null;
        aggregator_source: $Enums.AggregatorSource | null;
        aggregator_order_id: string | null;
        external_ref: string | null;
        is_tab_open: boolean;
        tab_name: string | null;
        queue_token_number: number | null;
        customer_phone: string | null;
        delivery_address: string | null;
        estimated_time: Date | null;
        tracking_status: $Enums.OnlineTrackingStatus | null;
        settled_at: Date | null;
        outlet_id: string;
        waiter_id: string | null;
        captain_id: string | null;
    }>;
    getOpenTabs(tenantId: string): Promise<({
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
                item_type: $Enums.ItemType;
                hsn_code: string | null;
                tax_slab: $Enums.TaxSlab;
                is_available: boolean;
                station_route: $Enums.StationRoute;
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
            status: $Enums.OrderItemStatus;
            id: string;
            item_id: string;
            variant_id: string | null;
            quantity: number;
            unit_price: number;
            notes: string | null;
            course_number: number;
            fire_status: $Enums.FireStatus;
            seat_number: number | null;
            order_id: string;
            kot_id: string | null;
            invoice_id: string | null;
        })[];
    } & {
        status: $Enums.OrderStatus;
        id: string;
        created_at: Date;
        tenant_id: string;
        order_type: $Enums.OrderType;
        table_id: string | null;
        pax_count: number | null;
        customer_id: string | null;
        order_name: string | null;
        brand_id: string | null;
        source: string | null;
        aggregator_source: $Enums.AggregatorSource | null;
        aggregator_order_id: string | null;
        external_ref: string | null;
        is_tab_open: boolean;
        tab_name: string | null;
        queue_token_number: number | null;
        customer_phone: string | null;
        delivery_address: string | null;
        estimated_time: Date | null;
        tracking_status: $Enums.OnlineTrackingStatus | null;
        settled_at: Date | null;
        outlet_id: string;
        waiter_id: string | null;
        captain_id: string | null;
    })[]>;
    getLastRound(tenantId: string, orderId: string): Promise<({
        item: {
            id: string;
            tenant_id: string;
            name: string;
            description: string | null;
            sort_order: number;
            category_id: string;
            base_price: number;
            image_url: string | null;
            item_type: $Enums.ItemType;
            hsn_code: string | null;
            tax_slab: $Enums.TaxSlab;
            is_available: boolean;
            station_route: $Enums.StationRoute;
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
        status: $Enums.OrderItemStatus;
        id: string;
        item_id: string;
        variant_id: string | null;
        quantity: number;
        unit_price: number;
        notes: string | null;
        course_number: number;
        fire_status: $Enums.FireStatus;
        seat_number: number | null;
        order_id: string;
        kot_id: string | null;
        invoice_id: string | null;
    })[]>;
    getNextTokenNumber(tenantId: string): Promise<number>;
    transferOrder(tenantId: string, orderId: string, newTableId: string): Promise<{
        success: boolean;
        order_id: string;
        new_table_id: string;
    }>;
}
