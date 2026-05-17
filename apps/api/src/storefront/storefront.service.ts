import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateOnlineOrderDto,
  UpdateStorefrontSettingsDto,
} from './dto/storefront.dto';
import { OrderType, OnlineTrackingStatus, OrderStatus } from '@prisma/client';
import { OrdersService } from '../orders/orders.service';

@Injectable()
export class StorefrontService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ordersService: OrdersService,
  ) {}

  // ─── Public: Get menu by slug ─────────────────────────────────────────────
  async getMenuBySlug(slug: string) {
    const storefront = await this.prisma.onlineMenu.findUnique({
      where: { slug },
    });

    if (!storefront || !storefront.is_published) {
      throw new NotFoundException('Storefront not found or offline');
    }

    const categories = await this.prisma.category.findMany({
      where: { tenant_id: storefront.tenant_id, is_active: true },
      orderBy: { sort_order: 'asc' },
      include: {
        items: {
          where: { is_available: true },
          orderBy: { sort_order: 'asc' },
          select: {
            id: true,
            name: true,
            description: true,
            base_price: true,
            image_url: true,
            item_type: true,
            tax_slab: true,
            is_available: true,
            addons: { where: { is_available: true } },
            variants: true,
          },
        },
      },
    });

    return {
      id: storefront.id,
      slug: storefront.slug,
      restaurantName: storefront.restaurant_name,
      logoUrl: storefront.logo_url,
      bannerUrl: storefront.banner_url,
      description: storefront.description,
      theme: storefront.theme,
      deliveryZones: storefront.delivery_zones,
      menu: categories,
    };
  }

  // ─── Public: Place an online order (COD) ─────────────────────────────────
  async createOrder(slug: string, dto: CreateOnlineOrderDto) {
    const storefront = await this.prisma.onlineMenu.findUnique({
      where: { slug },
    });
    if (!storefront || !storefront.is_published) {
      throw new NotFoundException('Storefront not found or offline');
    }

    const { tenant_id: tenantId, outlet_id: outletId } = storefront;

    // Create the order
    const order = await this.prisma.order.create({
      data: {
        tenant_id: tenantId,
        outlet_id: outletId,
        order_type: OrderType.ONLINE,
        status: OrderStatus.PLACED,
        customer_phone: dto.customerPhone,
        order_name: dto.customerName,
        delivery_address: dto.deliveryAddress,
        tracking_status: OnlineTrackingStatus.PLACED,
      },
    });

    // Attach order items
    const orderItemsData: any[] = [];
    for (const reqItem of dto.items) {
      const item = await this.prisma.item.findFirst({
        where: { id: reqItem.itemId, tenant_id: tenantId, is_available: true },
      });
      if (item) {
        orderItemsData.push({
          order_id: order.id,
          item_id: item.id,
          quantity: reqItem.quantity,
          unit_price: item.base_price,
          notes: reqItem.notes,
          status: 'PENDING',
        });
      }
    }

    if (orderItemsData.length === 0) {
      await this.prisma.order.delete({ where: { id: order.id } });
      throw new NotFoundException('No valid items found in order');
    }

    await this.prisma.orderItem.createMany({ data: orderItemsData });

    // Auto-fire KOT to notify the kitchen/POS
    const createdItems = await this.prisma.orderItem.findMany({
      where: { order_id: order.id },
    });

    try {
      await this.ordersService.fireKot(
        tenantId,
        order.id,
        'ONLINE_SYSTEM',
        createdItems.map((i) => i.id),
      );
    } catch {
      // KOT failure should not block order confirmation
    }

    return {
      success: true,
      orderId: order.id,
      message: 'Order placed successfully! Cash on delivery.',
      trackingUrl: `/order/${slug}/track/${order.id}`,
    };
  }

  // ─── Public: Track order by ID ────────────────────────────────────────────
  async trackOrder(slug: string, orderId: string) {
    const storefront = await this.prisma.onlineMenu.findUnique({
      where: { slug },
    });
    if (!storefront) throw new NotFoundException('Storefront not found');

    const order = await this.prisma.order.findFirst({
      where: { id: orderId, tenant_id: storefront.tenant_id },
      include: {
        order_items: {
          include: { item: { select: { name: true } } },
        },
      },
    });

    if (!order) throw new NotFoundException('Order not found');

    return {
      orderId: order.id,
      status: order.status,
      trackingStatus: order.tracking_status,
      customerName: order.order_name,
      deliveryAddress: order.delivery_address,
      placedAt: order.created_at,
      items: order.order_items.map((oi) => ({
        name: oi.item.name,
        quantity: oi.quantity,
        price: oi.unit_price,
      })),
    };
  }

  // ─── Admin: Get all online orders ─────────────────────────────────────────
  async getOrders(tenantId: string) {
    return this.prisma.order.findMany({
      where: { tenant_id: tenantId, order_type: OrderType.ONLINE },
      orderBy: { created_at: 'desc' },
      include: { order_items: { include: { item: true } } },
    });
  }

  // ─── Admin: Update tracking status ────────────────────────────────────────
  async updateTrackingStatus(
    tenantId: string,
    orderId: string,
    status: OnlineTrackingStatus,
  ) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, tenant_id: tenantId },
    });
    if (!order) throw new NotFoundException('Order not found');

    return this.prisma.order.update({
      where: { id: orderId },
      data: { tracking_status: status },
    });
  }

  // ─── Admin: Create/Update storefront settings ─────────────────────────────
  async upsertSettings(
    tenantId: string,
    outletId: string,
    slug: string,
    dto: UpdateStorefrontSettingsDto,
  ) {
    return this.prisma.onlineMenu.upsert({
      where: { slug },
      update: {
        is_published: dto.isPublished,
        theme: dto.theme,
        delivery_zones: dto.deliveryZones,
        restaurant_name: dto.restaurantName,
        logo_url: dto.logoUrl,
        description: dto.description,
      },
      create: {
        tenant_id: tenantId,
        outlet_id: outletId,
        slug,
        is_published: dto.isPublished ?? false,
        theme: dto.theme,
        delivery_zones: dto.deliveryZones,
        restaurant_name: dto.restaurantName,
        logo_url: dto.logoUrl,
        description: dto.description,
      },
    });
  }
}
