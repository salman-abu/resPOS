import { BillingService } from './billing.service';
import { GenerateInvoiceDto, SettleInvoiceDto, OpenShiftDto, CloseShiftDto } from './dto/billing.dto';
export declare class BillingController {
    private readonly billingService;
    constructor(billingService: BillingService);
    generateInvoice(req: any, dto: GenerateInvoiceDto): Promise<{
        invoice: {
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
        };
        order: {
            id: string;
            table_number: string | undefined;
            order_type: import("@prisma/client").$Enums.OrderType;
            pax_count: number | null;
            items: {
                name: string;
                variant: string | undefined;
                quantity: number;
                unit_price: number;
                line_total: number;
                tax_slab: import("@prisma/client").$Enums.TaxSlab;
            }[];
        };
    }>;
    getInvoice(req: any, id: string): Promise<{
        order: {
            table: {
                table_number: string;
            } | null;
            order_items: ({
                item: {
                    name: string;
                    tax_slab: import("@prisma/client").$Enums.TaxSlab;
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
        };
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
    }>;
    settleInvoice(req: any, id: string, dto: SettleInvoiceDto): Promise<{
        success: boolean;
        invoice_id: string;
        total_paid: number;
    }>;
    openShift(req: any, dto: OpenShiftDto): Promise<{
        id: string;
        tenant_id: string;
        status: import("@prisma/client").$Enums.ShiftStatus;
        outlet_id: string;
        opening_float: number;
        closing_float: number | null;
        petty_cash: number | null;
        cashier_id: string;
        opened_at: Date;
        closed_at: Date | null;
        z_report_data: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    closeShift(req: any, dto: CloseShiftDto): Promise<{
        shift: {
            id: string;
            tenant_id: string;
            status: import("@prisma/client").$Enums.ShiftStatus;
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
            cash_expected: number;
            cash_variance: number;
        };
    }>;
    getZReport(req: any): Promise<{
        id: string;
        tenant_id: string;
        status: import("@prisma/client").$Enums.ShiftStatus;
        outlet_id: string;
        opening_float: number;
        closing_float: number | null;
        petty_cash: number | null;
        cashier_id: string;
        opened_at: Date;
        closed_at: Date | null;
        z_report_data: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    getTables(req: any): Promise<({
        tables: ({
            orders: {
                id: string;
                created_at: Date;
                pax_count: number | null;
                status: import("@prisma/client").$Enums.OrderStatus;
            }[];
        } & {
            id: string;
            tenant_id: string;
            status: import("@prisma/client").$Enums.TableStatus;
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
}
