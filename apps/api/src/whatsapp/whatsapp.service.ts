import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrdersService } from '../orders/orders.service';
import { KdsGateway } from '../kds/kds.gateway';

@Injectable()
export class WhatsappService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ordersService: OrdersService,
    private readonly kdsGateway: KdsGateway,
  ) {}

  // ─── Bot State Machine ────────────────────────────────────────────────────
  async handleInboundMessage(tenantId: string, phone: string, message: string) {
    // Find or create session
    let session = await this.prisma.whatsappSession.findFirst({
      where: {
        tenant_id: tenantId,
        phone_number: phone,
        state: { not: 'COMPLETED' },
        expires_at: { gt: new Date() },
      },
    });

    if (!session) {
      // Try to match phone to a table via recent QR scan (last 10min grace)
      const recentToken = await this.prisma.tableQrToken.findFirst({
        where: {
          tenant_id: tenantId,
          created_at: { gte: new Date(Date.now() - 10 * 60 * 1000) },
        },
        orderBy: { created_at: 'desc' },
      });
      const tableId = recentToken?.table_id;

      session = await this.prisma.whatsappSession.create({
        data: {
          tenant_id: tenantId,
          table_id: tableId || '',
          phone_number: phone,
          state: 'GREETING',
          expires_at: new Date(Date.now() + 60 * 60 * 1000),
        },
      });
    }

    const text = message.trim().toUpperCase();
    let result;

    switch (session.state) {
      case 'GREETING':
        result = await this.handleGreeting(tenantId, session);
        break;
      case 'BROWSING':
        result = await this.handleBrowsing(tenantId, session, text);
        break;
      case 'CART':
        result = await this.handleCart(tenantId, session, text);
        break;
      case 'CONFIRMED':
        result = await this.handleConfirmed(tenantId, session, text);
        break;
      default:
        result = { reply: 'Type START to begin ordering.', state: 'GREETING' };
    }

    // Deliver reply directly to WhatsApp in production
    await this.sendTextMessage(phone, result.reply);

    return result;
  }

  private async handleGreeting(tenantId: string, session: any) {
    const categories = await this.prisma.category.findMany({
      where: { tenant_id: tenantId, is_active: true },
      orderBy: { sort_order: 'asc' },
      select: { id: true, name: true },
      take: 10,
    });

    await this.prisma.whatsappSession.update({
      where: { id: session.id },
      data: { state: 'BROWSING' },
    });

    const catList = categories.map((c, i) => `${i + 1}. ${c.name}`).join('\n');

    return {
      reply: `Welcome! Browse our menu:\n${catList}\n\nReply with a number to see items.`,
      state: 'BROWSING',
    };
  }

  private async handleBrowsing(tenantId: string, session: any, text: string) {
    const categories = await this.prisma.category.findMany({
      where: { tenant_id: tenantId, is_active: true },
      orderBy: { sort_order: 'asc' },
      select: { id: true, name: true },
      take: 10,
    });

    const idx = parseInt(text) - 1;
    if (idx >= 0 && idx < categories.length) {
      const category = categories[idx];
      const items = await this.prisma.item.findMany({
        where: {
          tenant_id: tenantId,
          category_id: category.id,
          is_available: true,
        },
        orderBy: { sort_order: 'asc' },
        select: { id: true, name: true, base_price: true },
        take: 10,
      });

      const itemList = items
        .map(
          (it, i) =>
            `${i + 1}. ${it.name} - ₹${Math.round(it.base_price / 100)}`,
        )
        .join('\n');

      return {
        reply: `${category.name}:\n${itemList}\n\nReply with item number + qty (e.g. 1x2). Reply CART to review.`,
        state: 'BROWSING',
      };
    }

    // Try to parse item selection like "1x2" or "1"
    const match = text.match(/^(\d+)\s*(?:X\s*(\d+))?$/i);
    if (match) {
      return this.addToCartFromBrowse(
        tenantId,
        session,
        match[1],
        match[2] || '1',
      );
    }

    if (text === 'CART') {
      await this.prisma.whatsappSession.update({
        where: { id: session.id },
        data: { state: 'CART' },
      });
      return this.showCart(session);
    }

    return {
      reply:
        'Reply with a category number, or item number (e.g. 1x2), or CART.',
      state: 'BROWSING',
    };
  }

  private async addToCartFromBrowse(
    tenantId: string,
    session: any,
    itemNum: string,
    qtyStr: string,
  ) {
    const cart = session.cart_snapshot || { items: [] };
    // This is simplified: we'd need to track which category was last viewed.
    // For MVP, we'll search across all available items.
    const items = await this.prisma.item.findMany({
      where: { tenant_id: tenantId, is_available: true },
      select: { id: true, name: true, base_price: true },
      take: 50,
    });

    const idx = parseInt(itemNum) - 1;
    if (idx < 0 || idx >= items.length) {
      return { reply: 'Invalid item number. Try again.', state: 'BROWSING' };
    }

    const item = items[idx];
    const qty = parseInt(qtyStr) || 1;

    cart.items.push({
      item_id: item.id,
      name: item.name,
      unit_price: item.base_price,
      quantity: qty,
    });

    await this.prisma.whatsappSession.update({
      where: { id: session.id },
      data: { cart_snapshot: cart },
    });

    const total = cart.items.reduce(
      (s: number, i: any) => s + i.unit_price * i.quantity,
      0,
    );

    return {
      reply: `Added ${item.name} x${qty}. Cart total: ₹${Math.round(total / 100)}.\nReply with more items or CART to checkout.`,
      state: 'BROWSING',
    };
  }

  private async showCart(session: any) {
    const cart = session.cart_snapshot || { items: [] };
    if (!cart.items.length) {
      return { reply: 'Cart is empty. Type START to browse.', state: 'CART' };
    }

    const lines = cart.items.map(
      (i: any, idx: number) => `${idx + 1}. ${i.name} x${i.quantity}`,
    );
    const total = cart.items.reduce(
      (s: number, i: any) => s + i.unit_price * i.quantity,
      0,
    );

    return {
      reply: `Your cart:\n${lines.join('\n')}\n\nTotal: ₹${Math.round(total / 100)}\n\nReply CONFIRM to place order, or item number to remove.`,
      state: 'CART',
    };
  }

  private async handleCart(tenantId: string, session: any, text: string) {
    if (text === 'CONFIRM') {
      await this.prisma.whatsappSession.update({
        where: { id: session.id },
        data: { state: 'CONFIRMED' },
      });
      return this.placeOrder(tenantId, session);
    }

    const idx = parseInt(text) - 1;
    const cart = session.cart_snapshot || { items: [] };
    if (idx >= 0 && idx < cart.items.length) {
      cart.items.splice(idx, 1);
      await this.prisma.whatsappSession.update({
        where: { id: session.id },
        data: { cart_snapshot: cart },
      });
      return this.showCart({ ...session, cart_snapshot: cart });
    }

    return {
      reply: 'Reply CONFIRM to place order, or item number to remove.',
      state: 'CART',
    };
  }

  private async placeOrder(tenantId: string, session: any) {
    const cart = session.cart_snapshot || { items: [] };
    if (!cart.items.length) {
      return { reply: 'Cart is empty.', state: 'COMPLETED' };
    }

    // Find table from session
    const table = session.table_id
      ? await this.prisma.table.findFirst({
          where: { id: session.table_id, tenant_id: tenantId },
        })
      : null;

    try {
      const order = await this.ordersService.createOrder(
        tenantId,
        'whatsapp-bot', // system user
        {
          order_type: 'DINE_IN',
          table_id: table?.id,
          pax_count: 1,
          items: cart.items.map((i: any) => ({
            item_id: i.item_id,
            quantity: i.quantity,
            unit_price: i.unit_price,
            notes: 'Ordered via WhatsApp',
          })),
        },
      );

      // Refetch order with items to auto-fire KOT
      const orderWithItems = await this.prisma.order.findUnique({
        where: { id: order.id },
        include: { order_items: true },
      });

      if (orderWithItems && orderWithItems.order_items.length > 0) {
        await this.ordersService.fireKot(
          tenantId,
          order.id,
          'whatsapp-bot',
          orderWithItems.order_items.map((oi) => oi.id),
        );
      }

      await this.prisma.whatsappSession.update({
        where: { id: session.id },
        data: { state: 'COMPLETED' },
      });

      await this.prisma.order.update({
        where: { id: order.id },
        data: { source: 'WHATSAPP' },
      });

      return {
        reply: `Order placed! Order #${order.queue_token_number || order.id.slice(-4)}. Your KOT has been sent to the kitchen. Sit back and relax!`,
        state: 'COMPLETED',
        orderId: order.id,
      };
    } catch (e: any) {
      return {
        reply: `Sorry, we couldn't place your order right now. Please order at the counter.`,
        state: 'COMPLETED',
      };
    }
  }

  private async handleConfirmed(tenantId: string, session: any, text: string) {
    return {
      reply: 'Your order is being prepared. Type START to order more.',
      state: 'COMPLETED',
    };
  }

  // ─── QR Token ─────────────────────────────────────────────────────────────
  async regenerateQrToken(tenantId: string, tableId: string) {
    const table = await this.prisma.table.findFirst({
      where: { id: tableId, tenant_id: tenantId },
    });
    if (!table) throw new NotFoundException('Table not found');

    const token = crypto.randomUUID();
    const waNumber = process.env.WABA_PHONE_NUMBER || '1234567890';
    const waUrl = `https://wa.me/${waNumber}?text=ORDER-${token}`;

    return this.prisma.tableQrToken.upsert({
      where: { table_id: tableId },
      update: {
        token,
        rotates_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        wa_url: waUrl,
      },
      create: {
        tenant_id: tenantId,
        table_id: tableId,
        token,
        rotates_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        wa_url: waUrl,
      },
    });
  }

  async getQrToken(tenantId: string, tableId: string) {
    const token = await this.prisma.tableQrToken.findUnique({
      where: { table_id: tableId },
    });
    if (!token) {
      // Auto-generate if missing
      return this.regenerateQrToken(tenantId, tableId);
    }
    // Check rotation
    if (new Date() > token.rotates_at) {
      return this.regenerateQrToken(tenantId, tableId);
    }
    return token;
  }

  async listActiveSessions(tenantId: string) {
    return this.prisma.whatsappSession.findMany({
      where: {
        tenant_id: tenantId,
        state: { not: 'COMPLETED' },
        expires_at: { gt: new Date() },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  // ─── Shared WhatsApp Business API Sending Helpers ───────────────────────────
  async findTenantByPhoneId(phoneNumberId: string): Promise<string> {
    const tenants = await this.prisma.tenant.findMany({
      where: { is_active: true },
      select: { id: true, settings: true },
    });

    for (const tenant of tenants) {
      const settings = tenant.settings as any;
      if (
        settings &&
        (settings.wabaPhoneNumberId === phoneNumberId ||
          settings.waba_phone_number_id === phoneNumberId)
      ) {
        return tenant.id;
      }
    }

    if (tenants.length > 0) {
      return tenants[0].id;
    }
    return 'default';
  }

  async sendTextMessage(to: string, text: string): Promise<boolean> {
    const token = process.env.WABA_TOKEN;
    const phoneId = process.env.WABA_PHONE_NUMBER_ID;
    if (!token || !phoneId) {
      console.warn(
        'WABA credentials not set. Simulating WhatsApp delivery to:',
        to,
        'Message:',
        text,
      );
      return true;
    }

    try {
      const response = await fetch(
        `https://graph.facebook.com/v17.0/${phoneId}/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to,
            type: 'text',
            text: { preview_url: false, body: text },
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('WABA Cloud API error:', errorData);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to send text message via WABA:', error);
      return false;
    }
  }

  async sendTemplateMessage(
    to: string,
    templateName: string,
    languageCode: string = 'en_US',
    components: any[] = [],
  ): Promise<boolean> {
    const token = process.env.WABA_TOKEN;
    const phoneId = process.env.WABA_PHONE_NUMBER_ID;
    if (!token || !phoneId) {
      console.warn(
        'WABA credentials not set. Simulating WhatsApp Template delivery to:',
        to,
        'Template:',
        templateName,
      );
      return true;
    }

    try {
      const response = await fetch(
        `https://graph.facebook.com/v17.0/${phoneId}/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to,
            type: 'template',
            template: {
              name: templateName,
              language: { code: languageCode },
              components,
            },
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('WABA Cloud API Template error:', errorData);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to send template message via WABA:', error);
      return false;
    }
  }

  async sendInteractiveMessage(
    to: string,
    interactivePayload: any,
  ): Promise<boolean> {
    const token = process.env.WABA_TOKEN;
    const phoneId = process.env.WABA_PHONE_NUMBER_ID;
    if (!token || !phoneId) {
      console.warn(
        'WABA credentials not set. Simulating WhatsApp Interactive delivery to:',
        to,
        'Payload:',
        interactivePayload,
      );
      return true;
    }

    try {
      const response = await fetch(
        `https://graph.facebook.com/v17.0/${phoneId}/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to,
            type: 'interactive',
            interactive: interactivePayload,
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('WABA Cloud API Interactive error:', errorData);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to send interactive message via WABA:', error);
      return false;
    }
  }
}
