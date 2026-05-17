import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MenuGateway } from './menu.gateway';

@Injectable()
export class MenuService {
  constructor(
    private prisma: PrismaService,
    private menuGateway: MenuGateway,
  ) {}

  // ... (rest of the methods)

  async syncMenu(tenantId: string) {
    this.menuGateway.emitMenuUpdated(tenantId);
    return { success: true, timestamp: Date.now() };
  }

  // ── Categories ─────────────────────────────────────────────────────────────

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

  async createCategory(tenantId: string, name: string) {
    const maxOrder = await this.prisma.category.count({
      where: { tenant_id: tenantId },
    });
    return this.prisma.category.create({
      data: {
        tenant_id: tenantId,
        name,
        sort_order: maxOrder + 1,
        is_active: true,
      },
    });
  }

  async updateCategory(tenantId: string, id: string, name: string) {
    return this.prisma.category.update({
      where: { id },
      data: { name },
    });
  }

  async deleteCategory(tenantId: string, id: string) {
    // Soft delete — keeps existing items intact
    return this.prisma.category.update({
      where: { id },
      data: { is_active: false },
    });
  }

  // ── Items ──────────────────────────────────────────────────────────────────

  async getItems(tenantId: string, categoryId?: string) {
    return this.prisma.item.findMany({
      where: {
        tenant_id: tenantId,
        // Admin view: return all items regardless of availability
        ...(categoryId ? { category_id: categoryId } : {}),
      },
      orderBy: { sort_order: 'asc' },
      include: {
        category: { select: { id: true, name: true } },
        variants: true,
        addons: { where: { is_available: true } },
        modifier_groups: {
          include: { modifiers: { orderBy: { sort_order: 'asc' } } },
          orderBy: { sort_order: 'asc' },
        },
      },
    });
  }

  async createItem(
    tenantId: string,
    data: {
      name: string;
      description?: string;
      price: number;
      category_id: string;
      is_veg?: boolean;
      is_spicy?: boolean;
      is_bestseller?: boolean;
      modifier_groups?: {
        name: string;
        is_required: boolean;
        min_select: number;
        max_select: number;
        modifiers: { name: string; price_adjustment: number }[];
      }[];
    },
  ) {
    const maxOrder = await this.prisma.item.count({
      where: { tenant_id: tenantId },
    });
    return this.prisma.item.create({
      data: {
        tenant_id: tenantId,
        name: data.name,
        description: data.description,
        base_price: data.price,
        category_id: data.category_id,
        is_available: true,
        sort_order: maxOrder + 1,
        item_type: 'VEG',
        tax_slab: 'GST_5',
        station_route: 'HOT_KITCHEN',
        modifier_groups: data.modifier_groups
          ? {
              create: data.modifier_groups.map((mg, i) => ({
                name: mg.name,
                is_required: mg.is_required,
                min_select: mg.min_select,
                max_select: mg.max_select,
                sort_order: i,
                modifiers: {
                  create: mg.modifiers.map((m, j) => ({
                    name: m.name,
                    price_adjustment: m.price_adjustment,
                    sort_order: j,
                  })),
                },
              })),
            }
          : undefined,
      },
    });
  }

  async updateItem(
    tenantId: string,
    id: string,
    data: {
      name?: string;
      description?: string;
      price?: number;
      category_id?: string;
      is_veg?: boolean;
      is_spicy?: boolean;
      is_bestseller?: boolean;
      modifier_groups?: {
        id?: string;
        name: string;
        is_required: boolean;
        min_select: number;
        max_select: number;
        modifiers: { id?: string; name: string; price_adjustment: number }[];
      }[];
    },
  ) {
    const updateData: any = { ...data };
    if (data.price !== undefined) {
      updateData.base_price = data.price;
      delete updateData.price;
    }
    delete updateData.is_veg;
    delete updateData.is_spicy;
    delete updateData.is_bestseller;
    delete updateData.modifier_groups; // handled separately

    if (data.modifier_groups) {
      // Very basic implementation: delete existing and recreate
      // For production, you'd want a more nuanced diff
      await this.prisma.modifierGroup.deleteMany({ where: { item_id: id } });
      updateData.modifier_groups = {
        create: data.modifier_groups.map((mg, i) => ({
          name: mg.name,
          is_required: mg.is_required,
          min_select: mg.min_select,
          max_select: mg.max_select,
          sort_order: i,
          modifiers: {
            create: mg.modifiers.map((m, j) => ({
              name: m.name,
              price_adjustment: m.price_adjustment,
              sort_order: j,
            })),
          },
        })),
      };
    }

    return this.prisma.item.update({
      where: { id },
      data: updateData,
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

  async deleteItem(tenantId: string, id: string) {
    // Soft delete
    return this.prisma.item.update({
      where: { id },
      data: { is_available: false },
    });
  }
}
