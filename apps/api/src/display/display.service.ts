import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DisplayService {
  constructor(private readonly prisma: PrismaService) {}

  async getMenuForDisplay(tenantSlug: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: tenantSlug },
      select: { id: true, name: true },
    });
    if (!tenant) return null;

    const categories = await this.prisma.category.findMany({
      where: { tenant_id: tenant.id, is_active: true },
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
          },
        },
      },
    });

    return {
      restaurantName: tenant.name,
      categories: categories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        color: cat.color,
        items: cat.items.map((item) => ({
          ...item,
          price: item.base_price,
        })),
      })),
    };
  }

  private bannerStore: Record<
    string,
    { text: string; imageUrl?: string; updatedAt: Date }
  > = {};

  private async getSlugByTenantId(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { slug: true },
    });
    return tenant?.slug ?? tenantId;
  }

  async setBanner(tenantId: string, text: string, imageUrl?: string) {
    const slug = await this.getSlugByTenantId(tenantId);
    this.bannerStore[slug] = { text, imageUrl, updatedAt: new Date() };
    return { success: true };
  }

  async clearBanner(tenantId: string) {
    const slug = await this.getSlugByTenantId(tenantId);
    delete this.bannerStore[slug];
    return { success: true };
  }

  async getBanner(tenantSlug: string) {
    return this.bannerStore[tenantSlug] ?? null;
  }
}
