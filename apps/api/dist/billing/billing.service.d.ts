import { PrismaService } from '../prisma/prisma.service';
import { GenerateInvoiceDto, SettleInvoiceDto, OpenShiftDto, CloseShiftDto } from './dto/billing.dto';
import { $Enums } from '@prisma/client';
import { FloorPlanGateway } from '../floor-plan/floor-plan.gateway';
import { LoyaltyService } from '../loyalty/loyalty.service';
import { AuditService } from '../audit/audit.service';
export declare class BillingService {
    private prisma;
    private floorPlanGateway;
    private loyaltyService;
    private auditService;
    constructor(prisma: PrismaService, floorPlanGateway: FloorPlanGateway, loyaltyService: LoyaltyService, auditService: AuditService);
    private getDefaultOutlet;
    private generateInvoiceNumber;
    generateInvoice(tenantId: string, userId: string, dto: GenerateInvoiceDto): Promise<{
        invoice: {
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
        };
        order: {
            id: string;
            table_number: string | undefined;
            order_type: $Enums.OrderType;
            pax_count: number | null;
            items: {
                name: string;
                variant: string | undefined;
                quantity: number;
                unit_price: number;
                line_total: number;
                tax_slab: $Enums.TaxSlab;
            }[];
        };
    }>;
    getInvoice(tenantId: string, invoiceId: string): Promise<{
        order: {
            table: {
                table_number: string;
            } | null;
            order_items: ({
                item: {
                    name: string;
                    tax_slab: $Enums.TaxSlab;
                };
                variant: {
                    name: string;
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
        };
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
    }>;
    settleInvoice(tenantId: string, userId: string, invoiceId: string, dto: SettleInvoiceDto): Promise<{
        success: boolean;
        invoice_id: string;
        total_paid: number;
    }>;
    openShift(tenantId: string, cashierId: string, dto: OpenShiftDto): Promise<{
        status: $Enums.ShiftStatus;
        id: string;
        tenant_id: string;
        outlet_id: string;
        opening_float: number;
        closing_float: number | null;
        petty_cash: number | null;
        cashier_id: string;
        opened_at: Date;
        closed_at: Date | null;
        z_report_data: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    closeShift(tenantId: string, dto: CloseShiftDto): Promise<{
        shift: {
            status: $Enums.ShiftStatus;
            id: string;
            tenant_id: string;
            outlet_id: string;
            opening_float: number;
            closing_float: number | null;
            petty_cash: number | null;
            cashier_id: string;
            opened_at: Date;
            closed_at: Date | null;
            z_report_data: import("@prisma/client/runtime/library").JsonValue | null;
        };
        z_report: {
            shift_id: string;
            opened_at: Date;
            closed_at: Date;
            cashier_id: string;
            opening_float: number;
            closing_float: number;
            petty_cash: number;
            gross_sales: number;
            total_discount: number;
            total_tax: number;
            net_sales: number;
            total_orders: number;
            void_orders: number;
            payment_summary: Record<string, number>;
            source_summary: Record<string, number>;
            cash_expected: number;
            cash_variance: number;
        };
    }>;
    getZReport(tenantId: string): Promise<{
        status: $Enums.ShiftStatus;
        id: string;
        tenant_id: string;
        outlet_id: string;
        opening_float: number;
        closing_float: number | null;
        petty_cash: number | null;
        cashier_id: string;
        opened_at: Date;
        closed_at: Date | null;
        z_report_data: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    getTables(tenantId: string): Promise<({
        tables: ({
            orders: {
                status: $Enums.OrderStatus;
                id: string;
                created_at: Date;
                pax_count: number | null;
            }[];
        } & {
            status: $Enums.TableStatus;
            id: string;
            tenant_id: string;
            zone_id: string;
            table_number: string;
            capacity: number;
            current_order_id: string | null;
        })[];
    } & {
        id: string;
        tenant_id: string;
        name: string;
    })[]>;
    private checkAllItemsAccounted;
    splitInvoices(tenantId: string, userId: string, orderId: string, splits: {
        itemIds: string[];
    }[]): Promise<any[]>;
}
