import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MenuService {
  constructor(private prisma: PrismaService) {}

  async getCategories(tenantId: string) {
    return this.prisma.category.findMany({
      where: { tenant_id: tenantId, is_active: true },
      orderBy: { sort_order: 'asc' },
      select: {
        id: true,
        name: true,
        sort_order: true,
        color: true,
        icon_url: true,
        is_active: true,
      },
    });
  }

  async getItems(tenantId: string, categoryId?: string) {
    return this.prisma.item.findMany({
      where: {
        tenant_id: tenantId,
        is_available: true,
        ...(categoryId ? { category_id: categoryId } : {}),
      },
      orderBy: { sort_order: 'asc' },
      include: {
        variants: true,
        addons: { where: { is_available: true } },
      },
    });
  }

  async toggleAvailability(
    tenantId: string,
    itemId: string,
    is_available: boolean,
  ) {
    return this.prisma.item.update({
      where: { id: itemId },
      data: { is_available },
    });
  }
}
