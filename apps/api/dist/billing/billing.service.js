"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const TAX_RATES = {
    EXEMPT: 0,
    GST_5: 5,
    GST_12: 12,
    GST_18: 18,
    GST_28: 28,
};
let BillingService = class BillingService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getDefaultOutlet(tenantId) {
        const outlet = await this.prisma.outlet.findFirst({
            where: { tenant_id: tenantId },
            select: { id: true, state_code: true },
        });
        if (!outlet)
            throw new common_1.BadRequestException('No outlet configured.');
        return outlet;
    }
    async generateInvoice(tenantId, dto) {
        const order = await this.prisma.order.findFirst({
            where: { id: dto.order_id, tenant_id: tenantId },
            include: {
                order_items: {
                    include: {
                        item: { select: { tax_slab: true, name: true } },
                        variant: { select: { name: true } },
                    },
                },
                invoices: { select: { id: true } },
                table: { select: { table_number: true } },
            },
        });
        if (!order)
            throw new common_1.NotFoundException('Order not found.');
        if (order.status === 'VOID')
            throw new common_1.BadRequestException('Cannot bill a voided order.');
        if (order.invoices.length > 0) {
            throw new common_1.ConflictException('Invoice already generated for this order.');
        }
        const outlet = await this.getDefaultOutlet(tenantId);
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { state_code: true, gstin: true },
        });
        let subtotal = 0;
        let cgst = 0;
        let sgst = 0;
        let igst = 0;
        const isInterState = outlet.state_code && tenant?.state_code && outlet.state_code !== tenant.state_code;
        for (const oi of order.order_items) {
            if (oi.status === 'VOID')
                continue;
            const lineBase = oi.unit_price * oi.quantity;
            subtotal += lineBase;
            const rate = TAX_RATES[oi.item.tax_slab] ?? 0;
            const taxAmt = Math.round(lineBase * (rate / 100));
            if (isInterState) {
                igst += taxAmt;
            }
            else {
                cgst += Math.round(taxAmt / 2);
                sgst += Math.round(taxAmt / 2);
            }
        }
        let discount = dto.discount ?? 0;
        if (dto.discount_type === 'PERCENT' && discount > 0) {
            discount = Math.round(subtotal * (discount / 100));
        }
        const service_charge = dto.service_charge ?? 0;
        const total = subtotal + cgst + sgst + igst + service_charge - discount;
        const invCount = await this.prisma.invoice.count();
        const invoiceNumber = `INV-${new Date().getFullYear()}-${String(invCount + 1).padStart(5, '0')}`;
        const invoice = await this.prisma.invoice.create({
            data: {
                order_id: order.id,
                invoice_number: invoiceNumber,
                subtotal,
                cgst,
                sgst,
                igst,
                service_charge,
                discount,
                discount_type: dto.discount_type,
                discount_approved_by: dto.discount_approved_by,
                total,
                printed_at: new Date(),
            },
            include: { payments: true },
        });
        await this.prisma.order.update({
            where: { id: order.id },
            data: { status: 'BILLED' },
        });
        if (order.table_id) {
            await this.prisma.table.update({
                where: { id: order.table_id },
                data: { status: 'BILLED' },
            });
        }
        return {
            invoice,
            order: {
                id: order.id,
                table_number: order.table?.table_number,
                order_type: order.order_type,
                pax_count: order.pax_count,
                items: order.order_items
                    .filter((oi) => oi.status !== 'VOID')
                    .map((oi) => ({
                    name: oi.item.name,
                    variant: oi.variant?.name,
                    quantity: oi.quantity,
                    unit_price: oi.unit_price,
                    line_total: oi.unit_price * oi.quantity,
                    tax_slab: oi.item.tax_slab,
                })),
            },
        };
    }
    async getInvoice(tenantId, invoiceId) {
        const invoice = await this.prisma.invoice.findFirst({
            where: { id: invoiceId, order: { tenant_id: tenantId } },
            include: {
                payments: true,
                order: {
                    include: {
                        order_items: {
                            where: { status: { not: 'VOID' } },
                            include: {
                                item: { select: { name: true, tax_slab: true } },
                                variant: { select: { name: true } },
                            },
                        },
                        table: { select: { table_number: true } },
                    },
                },
            },
        });
        if (!invoice)
            throw new common_1.NotFoundException('Invoice not found.');
        return invoice;
    }
    async settleInvoice(tenantId, invoiceId, dto) {
        const invoice = await this.prisma.invoice.findFirst({
            where: { id: invoiceId, order: { tenant_id: tenantId } },
            include: { payments: true, order: { select: { table_id: true, id: true } } },
        });
        if (!invoice)
            throw new common_1.NotFoundException('Invoice not found.');
        const alreadyPaid = invoice.payments
            .filter((p) => p.status === 'SUCCESS')
            .reduce((sum, p) => sum + p.amount, 0);
        const newTotal = dto.payments.reduce((s, p) => s + p.amount, 0);
        if (alreadyPaid + newTotal < invoice.total) {
            throw new common_1.BadRequestException(`Payment short by ₹${((invoice.total - alreadyPaid - newTotal) / 100).toFixed(2)}`);
        }
        await this.prisma.$transaction(dto.payments.map((p) => this.prisma.payment.create({
            data: {
                invoice_id: invoiceId,
                amount: p.amount,
                method: p.method,
                upi_ref: p.upi_ref,
                transaction_id: p.transaction_id,
                status: 'SUCCESS',
            },
        })));
        await this.prisma.order.update({
            where: { id: invoice.order.id },
            data: { status: 'SETTLED', settled_at: new Date() },
        });
        if (invoice.order.table_id) {
            await this.prisma.table.update({
                where: { id: invoice.order.table_id },
                data: { status: 'DIRTY', current_order_id: null },
            });
        }
        return { success: true, invoice_id: invoiceId, total_paid: alreadyPaid + newTotal };
    }
    async openShift(tenantId, cashierId, dto) {
        const outlet = await this.getDefaultOutlet(tenantId);
        const existingOpen = await this.prisma.shift.findFirst({
            where: { tenant_id: tenantId, status: 'OPEN' },
        });
        if (existingOpen)
            throw new common_1.ConflictException('A shift is already open.');
        return this.prisma.shift.create({
            data: {
                tenant_id: tenantId,
                outlet_id: outlet.id,
                cashier_id: cashierId,
                opening_float: dto.opening_float,
                status: 'OPEN',
            },
        });
    }
    async closeShift(tenantId, dto) {
        const shift = await this.prisma.shift.findFirst({
            where: { tenant_id: tenantId, status: 'OPEN' },
        });
        if (!shift)
            throw new common_1.NotFoundException('No open shift found.');
        const orders = await this.prisma.order.findMany({
            where: {
                tenant_id: tenantId,
                status: 'SETTLED',
                settled_at: { gte: shift.opened_at },
            },
            include: {
                invoices: { include: { payments: true } },
                order_items: { where: { status: { not: 'VOID' } }, select: { unit_price: true, quantity: true } },
            },
        });
        const paymentSummary = {};
        let grossSales = 0;
        let totalDiscount = 0;
        let totalTax = 0;
        let totalOrders = orders.length;
        let voidCount = 0;
        for (const order of orders) {
            for (const inv of order.invoices) {
                grossSales += inv.subtotal;
                totalDiscount += inv.discount;
                totalTax += inv.cgst + inv.sgst + inv.igst;
                for (const pmt of inv.payments) {
                    if (pmt.status === 'SUCCESS') {
                        paymentSummary[pmt.method] = (paymentSummary[pmt.method] ?? 0) + pmt.amount;
                    }
                }
            }
        }
        const voidOrders = await this.prisma.order.count({
            where: { tenant_id: tenantId, status: 'VOID', created_at: { gte: shift.opened_at } },
        });
        const zReportData = {
            shift_id: shift.id,
            opened_at: shift.opened_at,
            closed_at: new Date(),
            cashier_id: shift.cashier_id,
            opening_float: shift.opening_float,
            closing_float: dto.closing_float,
            petty_cash: dto.petty_cash ?? 0,
            gross_sales: grossSales,
            total_discount: totalDiscount,
            total_tax: totalTax,
            net_sales: grossSales - totalDiscount,
            total_orders: totalOrders,
            void_orders: voidOrders,
            payment_summary: paymentSummary,
            cash_expected: (paymentSummary['CASH'] ?? 0) + shift.opening_float - (dto.petty_cash ?? 0),
            cash_variance: dto.closing_float - ((paymentSummary['CASH'] ?? 0) + shift.opening_float - (dto.petty_cash ?? 0)),
        };
        const closed = await this.prisma.shift.update({
            where: { id: shift.id },
            data: {
                status: 'CLOSED',
                closed_at: new Date(),
                closing_float: dto.closing_float,
                petty_cash: dto.petty_cash,
                z_report_data: zReportData,
            },
        });
        return { shift: closed, z_report: zReportData };
    }
    async getZReport(tenantId) {
        const shift = await this.prisma.shift.findFirst({
            where: { tenant_id: tenantId },
            orderBy: { opened_at: 'desc' },
        });
        if (!shift)
            throw new common_1.NotFoundException('No shift found.');
        return shift;
    }
    async getTables(tenantId) {
        return this.prisma.zone.findMany({
            where: { tenant_id: tenantId },
            include: {
                tables: {
                    orderBy: { table_number: 'asc' },
                    include: {
                        orders: {
                            where: { status: { notIn: ['SETTLED', 'VOID'] } },
                            select: { id: true, status: true, created_at: true, pax_count: true },
                            take: 1,
                            orderBy: { created_at: 'desc' },
                        },
                    },
                },
            },
            orderBy: { name: 'asc' },
        });
    }
};
exports.BillingService = BillingService;
exports.BillingService = BillingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BillingService);
//# sourceMappingURL=billing.service.js.map