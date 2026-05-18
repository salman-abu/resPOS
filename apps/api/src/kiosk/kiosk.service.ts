import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  KioskStatus,
  KioskSessionStatus,
  KioskPaymentMode,
  OrderSource,
} from '@prisma/client';
import { createHash } from 'crypto';
import { OrdersService } from '../orders/orders.service';

function hashPin(pin: string): string {
  return createHash('sha256').update(pin).digest('hex');
}

function comparePin(pin: string, hash: string): boolean {
  return hashPin(pin) === hash;
}

@Injectable()
export class KioskService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ordersService: OrdersService,
  ) {}

  // ─── Public Kiosk Terminal ──────────────────────────────────────────────────
  async getTerminalConfig(kioskId: string) {
    const terminal = await this.prisma.kioskTerminal.findUnique({
      where: { id: kioskId, is_deleted: false },
      include: {
        zone: true,
        tenant: {
          select: { id: true, name: true, slug: true, settings: true },
        },
      },
    });
    if (!terminal) throw new NotFoundException('Kiosk terminal not found');
    if (terminal.status === KioskStatus.PAUSED) {
      return { terminal: { ...terminal, menu: null }, paused: true };
    }

    // Fetch full menu
    const categories = await this.prisma.category.findMany({
      where: { tenant_id: terminal.tenant_id },
      orderBy: { sort_order: 'asc' },
      include: {
        items: {
          where: { is_available: true },
          include: {
            variants: true,
            addons: true,
            modifier_groups: { include: { modifiers: true } },
            recipes: { include: { ingredient: true } },
          },
        },
      },
    });

    const tenantSettings = (terminal.tenant.settings as any) || {};
    return {
      terminal: {
        id: terminal.id,
        name: terminal.name,
        status: terminal.status,
        displayLanguages: terminal.display_languages,
        defaultLanguage: terminal.default_language,
        idleTimeoutSeconds: terminal.idle_timeout_seconds,
        attractLoopEnabled: terminal.attract_loop_enabled,
        showCalorieInfo: terminal.show_calorie_info,
        allowTakeaway: terminal.allow_takeaway,
        allowDineIn: terminal.allow_dine_in,
        paymentModes: terminal.payment_modes,
        upsellEnabled: terminal.upsell_enabled,
        loyaltyLookupEnabled: terminal.loyalty_lookup_enabled,
        whatsappReceiptEnabled: terminal.whatsapp_receipt_enabled,
      },
      menu: categories,
      tenant: {
        name: terminal.tenant.name,
        slug: terminal.tenant.slug,
        primaryColor: tenantSettings.primaryColor || '#4f46e5',
        logo: tenantSettings.logo || null,
      },
      paused: false,
    };
  }

  async heartbeat(kioskId: string) {
    await this.prisma.kioskTerminal.update({
      where: { id: kioskId },
      data: { last_heartbeat_at: new Date() },
    });
    return { status: 'ok' };
  }

  // ─── Kiosk Session Management ───────────────────────────────────────────────
  async startSession(
    kioskId: string,
    dto: { serviceType: string; language: string },
  ) {
    const terminal = await this.prisma.kioskTerminal.findUnique({
      where: { id: kioskId, is_deleted: false },
    });
    if (!terminal) throw new NotFoundException('Kiosk terminal not found');
    if (terminal.status === KioskStatus.PAUSED) {
      throw new ForbiddenException('Kiosk is currently paused');
    }

    const session = await this.prisma.kioskSession.create({
      data: {
        tenant_id: terminal.tenant_id,
        kiosk_terminal_id: kioskId,
        service_type: dto.serviceType,
        language: dto.language,
        status: KioskSessionStatus.BROWSING,
      },
    });

    return { sessionId: session.id, status: session.status };
  }

  async updateCart(sessionId: string, dto: { cartSnapshot: any }) {
    const session = await this.prisma.kioskSession.findUnique({
      where: { id: sessionId },
    });
    if (!session) throw new NotFoundException('Session not found');

    await this.prisma.kioskSession.update({
      where: { id: sessionId },
      data: {
        cart_snapshot: dto.cartSnapshot,
        status: KioskSessionStatus.CART,
      },
    });

    return { status: 'updated' };
  }

  async getUpsellSuggestions(sessionId: string, cartItemIds: string[]) {
    const session = await this.prisma.kioskSession.findUnique({
      where: { id: sessionId },
      include: { kiosk_terminal: true },
    });
    if (!session || !session.kiosk_terminal.upsell_enabled) {
      return { suggestions: [] };
    }

    // Reuse MOD-08 upsell logic: find items frequently ordered together
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const coOccurrence = await this.prisma.orderItem.groupBy({
      by: ['item_id'],
      where: {
        order: {
          tenant_id: session.tenant_id,
          created_at: { gte: thirtyDaysAgo },
          status: {
            in: ['PLACED', 'PREPARING', 'READY', 'SERVED', 'BILLED', 'SETTLED'],
          },
          order_items: { some: { item_id: { in: cartItemIds } } },
        },
        item_id: { notIn: cartItemIds },
      },
      _count: { item_id: true },
      orderBy: { _count: { item_id: 'desc' } },
      take: 3,
    });

    const itemIds = coOccurrence.map((c) => c.item_id);
    const items = await this.prisma.item.findMany({
      where: { id: { in: itemIds }, is_available: true },
      include: { variants: true },
    });

    return { suggestions: items };
  }

  async initiatePayment(
    sessionId: string,
    dto: { paymentMethod: KioskPaymentMode; customerPhone?: string },
  ) {
    const session = await this.prisma.kioskSession.findUnique({
      where: { id: sessionId },
      include: { kiosk_terminal: true },
    });
    if (!session) throw new NotFoundException('Session not found');
    if (!session.kiosk_terminal.payment_modes.includes(dto.paymentMethod)) {
      throw new BadRequestException('Payment method not enabled on this kiosk');
    }

    // Generate daily sequence KOT number per tenant to prevent terminal-level sequence collisions
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const globalCount = await this.prisma.order.count({
      where: {
        tenant_id: session.tenant_id,
        created_at: { gte: today },
      },
    });
    const kotNumber = `KOT-${String(globalCount + 1).padStart(4, '0')}`;

    await this.prisma.kioskSession.update({
      where: { id: sessionId },
      data: {
        status: KioskSessionStatus.PAYMENT,
        payment_method: dto.paymentMethod,
        customer_phone: dto.customerPhone || null,
        kot_number: kotNumber,
      },
    });

    if (dto.paymentMethod === KioskPaymentMode.UPI_QR) {
      // Mock Razorpay order creation (replace with actual Razorpay SDK)
      const razorpayOrderId = `order_${Math.random().toString(36).substring(2, 15)}`;
      const qrString = `upi://pay?pa=merchant@upi&pn=resPOS&am=${(session.cart_snapshot as any)?.totalPaise || 0}&cu=INR&tr=${razorpayOrderId}`;
      return {
        razorpayOrderId,
        qrCode: qrString,
        kotNumber,
        estimatedWaitMinutes: 15,
      };
    }

    if (dto.paymentMethod === KioskPaymentMode.CARD_TAP) {
      return {
        instruction: 'Tap your card on the reader below',
        kotNumber,
        estimatedWaitMinutes: 15,
      };
    }

    // PAY_AT_COUNTER
    return {
      kotNumber,
      estimatedWaitMinutes: 15,
      payAtCounter: true,
    };
  }

  async confirmPayment(
    sessionId: string,
    dto: {
      razorpayPaymentId?: string;
      confirmedByCashierId?: string;
      cartSnapshot?: any;
    },
  ) {
    const session = await this.prisma.kioskSession.findUnique({
      where: { id: sessionId },
      include: { kiosk_terminal: true },
    });
    if (!session) throw new NotFoundException('Session not found');

    const cart = dto.cartSnapshot || (session.cart_snapshot as any);
    if (!cart || !cart.items || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    // Query default outlet for the tenant to avoid constraint violation crashes
    const outlet = await this.prisma.outlet.findFirst({
      where: { tenant_id: session.tenant_id },
      select: { id: true },
    });
    const outletId =
      outlet?.id || session.kiosk_terminal.zone_id || session.tenant_id;

    // Create Order
    const order = await this.prisma.order.create({
      data: {
        tenant_id: session.tenant_id,
        outlet_id: outletId,
        order_type: session.service_type as any,
        status: 'PLACED',
        source: OrderSource.KIOSK,
        kiosk_session_id: sessionId,
        kiosk_terminal_id: session.kiosk_terminal_id,
        kot_number: session.kot_number,
        customer_phone: session.customer_phone || undefined,
        pax_count: cart.paxCount || 1,
        order_items: {
          create: cart.items.map((i: any) => ({
            item_id: i.itemId,
            variant_id: i.variantId || null,
            quantity: i.quantity,
            unit_price: i.unitPrice,
            notes: i.notes || null,
            fire_status: 'FIRED',
          })),
        },
      },
      include: { order_items: true },
    });

    // Update session
    await this.prisma.kioskSession.update({
      where: { id: sessionId },
      data: {
        status: KioskSessionStatus.CONFIRMED,
        order_id: order.id,
        payment_ref: dto.razorpayPaymentId || 'PAY_AT_COUNTER',
        completed_at: new Date(),
      },
    });

    // Fire KOT dynamically to real-time KDS Gateway
    try {
      const itemIds = order.order_items.map((i) => i.id);
      await this.ordersService.fireKot(
        session.tenant_id,
        order.id,
        'user-owner', // Default system owner context for kiosk orders
        itemIds,
      );
    } catch (err) {
      console.error('Failed to automatically fire KOT for Kiosk order:', err);
    }

    return {
      orderId: order.id,
      kotNumber: session.kot_number,
      status: 'CONFIRMED',
    };
  }

  async abandonSession(sessionId: string, reason: 'TIMEOUT' | 'USER_EXIT') {
    const session = await this.prisma.kioskSession.findUnique({
      where: { id: sessionId },
    });
    if (!session) throw new NotFoundException('Session not found');
    if (session.status === KioskSessionStatus.CONFIRMED) {
      throw new BadRequestException('Cannot abandon confirmed session');
    }

    await this.prisma.kioskSession.update({
      where: { id: sessionId },
      data: {
        status:
          reason === 'TIMEOUT'
            ? KioskSessionStatus.TIMEOUT
            : KioskSessionStatus.ABANDONED,
        abandoned_at: new Date(),
      },
    });

    return { status: 'abandoned', reason };
  }

  // ─── Owner Management ───────────────────────────────────────────────────────
  async listKiosks(tenantId: string) {
    const kiosks = await this.prisma.kioskTerminal.findMany({
      where: { tenant_id: tenantId, is_deleted: false },
      include: {
        zone: true,
        _count: {
          select: {
            sessions: {
              where: {
                started_at: {
                  gte: new Date(new Date().setHours(0, 0, 0, 0)),
                },
                status: 'CONFIRMED',
              },
            },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return kiosks.map((k) => ({
      ...k,
      isOnline: k.last_heartbeat_at
        ? Date.now() - new Date(k.last_heartbeat_at).getTime() < 60000
        : false,
      todayOrderCount: k._count.sessions,
    }));
  }

  async createKiosk(tenantId: string, dto: any) {
    const pinHash = hashPin(dto.adminPin || '0000');
    return this.prisma.kioskTerminal.create({
      data: {
        tenant_id: tenantId,
        name: dto.name,
        zone_id: dto.zoneId || null,
        status: KioskStatus.ACTIVE,
        display_languages: dto.displayLanguages || ['en'],
        default_language: dto.defaultLanguage || 'en',
        idle_timeout_seconds: dto.idleTimeoutSeconds || 90,
        attract_loop_enabled: dto.attractLoopEnabled ?? true,
        show_calorie_info: dto.showCalorieInfo ?? false,
        allow_takeaway: dto.allowTakeaway ?? true,
        allow_dine_in: dto.allowDineIn ?? true,
        payment_modes: dto.paymentModes || [
          KioskPaymentMode.UPI_QR,
          KioskPaymentMode.PAY_AT_COUNTER,
        ],
        admin_pin_hash: pinHash,
        upsell_enabled: dto.upsellEnabled ?? true,
        loyalty_lookup_enabled: dto.loyaltyLookupEnabled ?? true,
        whatsapp_receipt_enabled: dto.whatsappReceiptEnabled ?? true,
      },
    });
  }

  async updateKiosk(tenantId: string, kioskId: string, dto: any) {
    const kiosk = await this.prisma.kioskTerminal.findFirst({
      where: { id: kioskId, tenant_id: tenantId },
    });
    if (!kiosk) throw new NotFoundException('Kiosk not found');

    const data: any = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.zoneId !== undefined) data.zone_id = dto.zoneId || null;
    if (dto.displayLanguages !== undefined)
      data.display_languages = dto.displayLanguages;
    if (dto.defaultLanguage !== undefined)
      data.default_language = dto.defaultLanguage;
    if (dto.idleTimeoutSeconds !== undefined)
      data.idle_timeout_seconds = dto.idleTimeoutSeconds;
    if (dto.attractLoopEnabled !== undefined)
      data.attract_loop_enabled = dto.attractLoopEnabled;
    if (dto.showCalorieInfo !== undefined)
      data.show_calorie_info = dto.showCalorieInfo;
    if (dto.allowTakeaway !== undefined)
      data.allow_takeaway = dto.allowTakeaway;
    if (dto.allowDineIn !== undefined) data.allow_dine_in = dto.allowDineIn;
    if (dto.paymentModes !== undefined) data.payment_modes = dto.paymentModes;
    if (dto.upsellEnabled !== undefined)
      data.upsell_enabled = dto.upsellEnabled;
    if (dto.loyaltyLookupEnabled !== undefined)
      data.loyalty_lookup_enabled = dto.loyaltyLookupEnabled;
    if (dto.whatsappReceiptEnabled !== undefined)
      data.whatsapp_receipt_enabled = dto.whatsappReceiptEnabled;
    if (dto.adminPin) data.admin_pin_hash = hashPin(dto.adminPin);

    return this.prisma.kioskTerminal.update({
      where: { id: kioskId },
      data,
    });
  }

  async updateKioskStatus(
    tenantId: string,
    kioskId: string,
    status: KioskStatus,
  ) {
    const kiosk = await this.prisma.kioskTerminal.findFirst({
      where: { id: kioskId, tenant_id: tenantId },
    });
    if (!kiosk) throw new NotFoundException('Kiosk not found');

    return this.prisma.kioskTerminal.update({
      where: { id: kioskId },
      data: { status },
    });
  }

  async verifyPin(kioskId: string, pin: string) {
    const kiosk = await this.prisma.kioskTerminal.findUnique({
      where: { id: kioskId, is_deleted: false },
    });
    if (!kiosk) throw new NotFoundException('Kiosk not found');

    const valid = comparePin(pin, kiosk.admin_pin_hash);
    if (!valid) return { valid: false };

    // Generate short-lived exit token (60s TTL)
    const exitToken = `exit_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;
    return { valid: true, exitToken };
  }

  async getAnalytics(tenantId: string, kioskId: string, from: Date, to: Date) {
    const analytics = await this.prisma.kioskAnalytics.findMany({
      where: {
        tenant_id: tenantId,
        kiosk_terminal_id: kioskId,
        date: { gte: from, lte: to },
      },
      orderBy: { date: 'asc' },
    });

    // Also compute live summary from sessions
    const sessions = await this.prisma.kioskSession.findMany({
      where: {
        tenant_id: tenantId,
        kiosk_terminal_id: kioskId,
        started_at: { gte: from, lte: to },
      },
    });

    const totalSessions = sessions.length;
    const completed = sessions.filter((s) => s.status === 'CONFIRMED').length;
    const abandoned = sessions.filter(
      (s) => s.status === 'ABANDONED' || s.status === 'TIMEOUT',
    ).length;
    const completionRate =
      totalSessions > 0 ? (completed / totalSessions) * 100 : 0;

    return {
      daily: analytics,
      summary: {
        totalSessions,
        completedOrders: completed,
        abandonedSessions: abandoned,
        completionRate: Math.round(completionRate * 100) / 100,
      },
    };
  }
}
