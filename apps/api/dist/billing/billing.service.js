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
const floor_plan_gateway_1 = require("../floor-plan/floor-plan.gateway");
const loyalty_service_1 = require("../loyalty/loyalty.service");
const audit_service_1 = require("../audit/audit.service");
const TAX_RATES = {
    EXEMPT: 0,
    GST_5: 5,
    GST_12: 12,
    GST_18: 18,
    GST_28: 28,
};
function getFinancialYear(date = new Date()) {
    const year = date.getFullYear();
    const month = date.getMonth();
    if (month >= 3) {
        return `${String(year).slice(-2)}${String(year + 1).slice(-2)}`;
    }
    return `${String(year - 1).slice(-2)}${String(year).slice(-2)}`;
}
function getFinancialYearBounds(date = new Date()) {
    const year = date.getFullYear();
    const month = date.getMonth();
    if (month >= 3) {
        return {
            start: new Date(year, 3, 1),
            end: new Date(year + 1, 2, 31, 23, 59, 59),
        };
    }
    return {
        start: new Date(year - 1, 3, 1),
        end: new Date(year, 2, 31, 23, 59, 59),
    };
}
let BillingService = class BillingService {
    prisma;
    floorPlanGateway;
    loyaltyService;
    auditService;
    constructor(prisma, floorPlanGateway, loyaltyService, auditService) {
        this.prisma = prisma;
        this.floorPlanGateway = floorPlanGateway;
        this.loyaltyService = loyaltyService;
        this.auditService = auditService;
    }
    async getDefaultOutlet(tenantId) {
        const outlet = await this.prisma.outlet.findFirst({
            where: { tenant_id: tenantId },
            select: { id: true, state_code: true, outlet_code: true },
        });
        if (!outlet)
            throw new common_1.BadRequestException('No outlet configured.');
        return outlet;
    }
    async generateInvoiceNumber(tenantId, outletId, outletCode) {
        const fy = getFinancialYear();
        const fyBounds = getFinancialYearBounds();
        const prefix = outletCode || outletId.slice(0, 6).toUpperCase();
        const count = await this.prisma.invoice.count({
            where: {
                tenant_id: tenantId,
                order: { outlet_id: outletId },
                created_at: { gte: fyBounds.start, lte: fyBounds.end },
            },
        });
        return `${prefix}/${fy}/${String(count + 1).padStart(5, '0')}`;
    }
    async generateInvoice(tenantId, userId, dto) {
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
        const existingInvoices = await this.prisma.invoice.findMany({
            where: { order_id: dto.order_id },
        });
        if (existingInvoices.length > 0) {
            const allItemsAccounted = await this.checkAllItemsAccounted(order.id);
            if (allItemsAccounted) {
                throw new common_1.ConflictException('Full bill already generated/accounted for.');
            }
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
        const isInterState = outlet.state_code &&
            tenant?.state_code &&
            outlet.state_code !== tenant.state_code;
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
                const cgstHalf = Math.round(taxAmt / 2);
                cgst += cgstHalf;
                sgst += taxAmt - cgstHalf;
            }
        }
        let discount = dto.discount ?? 0;
        if (dto.discount_type === 'PERCENT' && discount > 0) {
            discount = Math.round(subtotal * (discount / 100));
        }
        const service_charge = dto.service_charge ?? 0;
        const total = subtotal + cgst + sgst + igst + service_charge - discount;
        const invoiceNumber = await this.generateInvoiceNumber(tenantId, outlet.id, outlet.outlet_code);
        const invoice = await this.prisma.invoice.create({
            data: {
                tenant_id: tenantId,
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
                order_items: {
                    connect: order.order_items
                        .filter((oi) => oi.status !== 'VOID')
                        .map((oi) => ({ id: oi.id })),
                },
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
            this.floorPlanGateway.emitTableStatusChanged(tenantId, {
                id: order.table_id,
                status: 'BILLED',
            });
        }
        if (discount > 0) {
            await this.auditService.log({
                tenantId,
                action: 'APPLY_DISCOUNT',
                entityType: 'INVOICE',
                entityId: invoice.id,
                performedBy: userId,
                authorizedBy: dto.discount_approved_by,
                reason: dto.discount_type,
                oldValue: {
                    subtotal,
                    total: subtotal + cgst + sgst + igst + service_charge,
                },
                newValue: { discount, total: invoice.total },
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
    async settleInvoice(tenantId, userId, invoiceId, dto) {
        const invoice = await this.prisma.invoice.findFirst({
            where: { id: invoiceId, order: { tenant_id: tenantId } },
            include: {
                payments: true,
                order: { select: { table_id: true, id: true, customer_id: true } },
            },
        });
        if (!invoice)
            throw new common_1.NotFoundException('Invoice not found.');
        const customerId = dto.customer_id || invoice.order.customer_id;
        let pointDeductionPaise = 0;
        if (dto.redeem_points && dto.redeem_points > 0 && customerId) {
            const config = await this.prisma.loyaltyConfig.findUnique({
                where: { tenant_id: tenantId },
            });
            if (config) {
                pointDeductionPaise = Math.round(dto.redeem_points * config.rupees_per_point * 100);
            }
            await this.loyaltyService.redeemPoints(tenantId, {
                customerId,
                points: dto.redeem_points,
            });
        }
        const alreadyPaid = invoice.payments
            .filter((p) => p.status === 'SUCCESS')
            .reduce((sum, p) => sum + p.amount, 0);
        const newTotal = dto.payments.reduce((s, p) => s + p.amount, 0);
        if (alreadyPaid + newTotal + pointDeductionPaise < invoice.total) {
            throw new common_1.BadRequestException(`Payment short by ₹${((invoice.total - alreadyPaid - newTotal - pointDeductionPaise) / 100).toFixed(2)}`);
        }
        await this.prisma.$transaction([
            ...dto.payments.map((p) => this.prisma.payment.create({
                data: {
                    invoice_id: invoiceId,
                    amount: p.amount,
                    method: p.method,
                    upi_ref: p.upi_ref,
                    transaction_id: p.transaction_id,
                    status: 'SUCCESS',
                },
            })),
            ...(pointDeductionPaise > 0
                ? [
                    this.prisma.payment.create({
                        data: {
                            invoice_id: invoiceId,
                            amount: pointDeductionPaise,
                            method: 'COMPLIMENTARY',
                            upi_ref: `Redeemed ${dto.redeem_points} points`,
                            status: 'SUCCESS',
                        },
                    }),
                ]
                : []),
        ]);
        const updatedOrder = await this.prisma.order.update({
            where: { id: invoice.order.id },
            data: { status: 'SETTLED', settled_at: new Date() },
            select: { id: true, customer_id: true },
        });
        if (updatedOrder.customer_id) {
            const customer = await this.prisma.customer.findUnique({
                where: { id: updatedOrder.customer_id },
                select: { mobile: true },
            });
            await this.loyaltyService.triggerEarnPoints(tenantId, {
                customerId: updatedOrder.customer_id,
                orderId: updatedOrder.id,
                amountSpent: invoice.total,
            });
            if (customer?.mobile) {
                const orderItems = await this.prisma.orderItem.findMany({
                    where: { order_id: updatedOrder.id, status: { not: 'VOID' } },
                    select: { item_id: true, quantity: true },
                });
                await this.loyaltyService.awardStamps(tenantId, customer.mobile, orderItems.map((oi) => ({
                    item_id: oi.item_id,
                    quantity: oi.quantity,
                })));
            }
        }
        if (invoice.order.table_id) {
            await this.prisma.table.update({
                where: { id: invoice.order.table_id },
                data: { status: 'AVAILABLE', current_order_id: null },
            });
            this.floorPlanGateway.emitTableStatusChanged(tenantId, {
                id: invoice.order.table_id,
                status: 'AVAILABLE',
            });
        }
        await this.auditService.log({
            tenantId,
            action: 'PAYMENT_SETTLED',
            entityType: 'INVOICE',
            entityId: invoiceId,
            performedBy: userId,
            newValue: {
                total: invoice.total,
                paid: alreadyPaid + newTotal + pointDeductionPaise,
                methods: [
                    ...dto.payments.map((p) => p.method),
                    ...(pointDeductionPaise > 0 ? ['LOYALTY_REDEEM'] : []),
                ],
            },
        });
        return {
            success: true,
            invoice_id: invoiceId,
            total_paid: alreadyPaid + newTotal + pointDeductionPaise,
        };
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
                order_items: {
                    where: { status: { not: 'VOID' } },
                    select: { unit_price: true, quantity: true },
                },
            },
        });
        const paymentSummary = {};
        const sourceSummary = {};
        let grossSales = 0;
        let totalDiscount = 0;
        let totalTax = 0;
        const totalOrders = orders.length;
        for (const order of orders) {
            const source = order.source || 'POS';
            for (const inv of order.invoices) {
                grossSales += inv.subtotal;
                totalDiscount += inv.discount;
                totalTax += inv.cgst + inv.sgst + inv.igst;
                sourceSummary[source] = (sourceSummary[source] ?? 0) + inv.total;
                for (const pmt of inv.payments) {
                    if (pmt.status === 'SUCCESS') {
                        paymentSummary[pmt.method] =
                            (paymentSummary[pmt.method] ?? 0) + pmt.amount;
                    }
                }
            }
        }
        const voidOrders = await this.prisma.order.count({
            where: {
                tenant_id: tenantId,
                status: 'VOID',
                created_at: { gte: shift.opened_at },
            },
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
            source_summary: sourceSummary,
            cash_expected: (paymentSummary['CASH'] ?? 0) +
                shift.opening_float -
                (dto.petty_cash ?? 0),
            cash_variance: dto.closing_float -
                ((paymentSummary['CASH'] ?? 0) +
                    shift.opening_float -
                    (dto.petty_cash ?? 0)),
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
                            select: {
                                id: true,
                                status: true,
                                created_at: true,
                                pax_count: true,
                            },
                            take: 1,
                            orderBy: { created_at: 'desc' },
                        },
                    },
                },
            },
            orderBy: { name: 'asc' },
        });
    }
    async checkAllItemsAccounted(orderId) {
        const orderItems = await this.prisma.orderItem.findMany({
            where: { order_id: orderId, status: { not: 'VOID' } },
        });
        return orderItems.every((oi) => oi.invoice_id !== null);
    }
    async splitInvoices(tenantId, userId, orderId, splits) {
        const order = await this.prisma.order.findFirst({
            where: { id: orderId, tenant_id: tenantId },
            include: {
                order_items: {
                    include: {
                        item: { select: { tax_slab: true, name: true } },
                    },
                },
            },
        });
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        const outlet = await this.getDefaultOutlet(tenantId);
        const createdInvoices = [];
        for (const split of splits) {
            const items = order.order_items.filter((oi) => split.itemIds.includes(oi.id));
            if (items.length === 0)
                continue;
            let subtotal = 0;
            let cgst = 0;
            let sgst = 0;
            const igst = 0;
            for (const oi of items) {
                const lineBase = oi.unit_price * oi.quantity;
                subtotal += lineBase;
                const rate = TAX_RATES[oi.item.tax_slab] ?? 0;
                const taxAmt = Math.round(lineBase * (rate / 100));
                const cgstHalf = Math.round(taxAmt / 2);
                cgst += cgstHalf;
                sgst += taxAmt - cgstHalf;
            }
            const total = subtotal + cgst + sgst + igst;
            const invoiceNumber = await this.generateInvoiceNumber(tenantId, outlet.id, outlet.outlet_code);
            const invoice = await this.prisma.invoice.create({
                data: {
                    tenant_id: tenantId,
                    order_id: order.id,
                    invoice_number: invoiceNumber,
                    subtotal,
                    cgst,
                    sgst,
                    igst,
                    service_charge: 0,
                    discount: 0,
                    total,
                    order_items: {
                        connect: items.map((oi) => ({ id: oi.id })),
                    },
                },
            });
            createdInvoices.push(invoice);
        }
        const allAccounted = await this.checkAllItemsAccounted(orderId);
        if (allAccounted) {
            await this.prisma.order.update({
                where: { id: orderId },
                data: { status: 'BILLED' },
            });
            if (order.table_id) {
                this.floorPlanGateway.emitTableStatusChanged(tenantId, {
                    id: order.table_id,
                    status: 'BILLED',
                });
            }
        }
        await this.auditService.log({
            tenantId,
            action: 'INVOICE_SPLIT',
            entityType: 'ORDER',
            entityId: orderId,
            performedBy: userId,
            newValue: {
                splitCount: createdInvoices.length,
                invoiceIds: createdInvoices.map((inv) => inv.id),
                invoiceNumbers: createdInvoices.map((inv) => inv.invoice_number),
            },
        });
        return createdInvoices;
    }
};
exports.BillingService = BillingService;
exports.BillingService = BillingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        floor_plan_gateway_1.FloorPlanGateway,
        loyalty_service_1.LoyaltyService,
        audit_service_1.AuditService])
], BillingService);
//# sourceMappingURL=billing.service.js.map