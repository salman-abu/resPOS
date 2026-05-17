import { PrismaService } from '../prisma/prisma.service';
import { MenuGateway } from './menu.gateway';
export declare class MenuService {
    private prisma;
    private menuGateway;
    constructor(prisma: PrismaService, menuGateway: MenuGateway);
    syncMenu(tenantId: string): Promise<{
        success: boolean;
        timestamp: number;
    }>;
    getCategories(tenantId: string): Promise<{
        id: string;
        name: string;
        is_active: boolean;
        sort_order: number;
        color: string | null;
        icon_url: string | null;
    }[]>;
    createCategory(tenantId: string, name: string): Promise<{
        id: string;
        tenant_id: string;
        name: string;
        is_active: boolean;
        sort_order: number;
        color: string | null;
        icon_url: string | null;
    }>;
    updateCategory(tenantId: string, id: string, name: string): Promise<{
        id: string;
        tenant_id: string;
        name: string;
        is_active: boolean;
        sort_order: number;
        color: string | null;
        icon_url: string | null;
    }>;
    deleteCategory(tenantId: string, id: string): Promise<{
        id: string;
        tenant_id: string;
        name: string;
        is_active: boolean;
        sort_order: number;
        color: string | null;
        icon_url: string | null;
    }>;
    getItems(tenantId: string, categoryId?: string): Promise<({
        category: {
            id: string;
            name: string;
        };
        variants: {
            id: string;
            name: string;
            item_id: string;
            additional_price: number;
        }[];
        addons: {
            id: string;
            name: string;
            is_available: boolean;
            item_id: string;
            price: number;
        }[];
        modifier_groups: ({
            modifiers: {
                id: string;
                name: string;
                sort_order: number;
                is_available: boolean;
                price_adjustment: number;
                group_id: string;
            }[];
        } & {
            id: string;
            name: string;
            sort_order: number;
            is_required: boolean;
            min_select: number;
            max_select: number;
            item_id: string;
        })[];
    } & {
        id: string;
        tenant_id: string;
        name: string;
        description: string | null;
        sort_order: number;
        category_id: string;
        base_price: number;
        image_url: string | null;
        item_type: import("@prisma/client").$Enums.ItemType;
        hsn_code: string | null;
        tax_slab: import("@prisma/client").$Enums.TaxSlab;
        is_available: boolean;
        station_route: import("@prisma/client").$Enums.StationRoute;
    })[]>;
    createItem(tenantId: string, data: {
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
            modifiers: {
                name: string;
                price_adjustment: number;
            }[];
        }[];
    }): Promise<{
        id: string;
        tenant_id: string;
        name: string;
        description: string | null;
        sort_order: number;
        category_id: string;
        base_price: number;
        image_url: string | null;
        item_type: import("@prisma/client").$Enums.ItemType;
        hsn_code: string | null;
        tax_slab: import("@prisma/client").$Enums.TaxSlab;
        is_available: boolean;
        station_route: import("@prisma/client").$Enums.StationRoute;
    }>;
    updateItem(tenantId: string, id: string, data: {
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
            modifiers: {
                id?: string;
                name: string;
                price_adjustment: number;
            }[];
        }[];
    }): Promise<{
        id: string;
        tenant_id: string;
        name: string;
        description: string | null;
        sort_order: number;
        category_id: string;
        base_price: number;
        image_url: string | null;
        item_type: import("@prisma/client").$Enums.ItemType;
        hsn_code: string | null;
        tax_slab: import("@prisma/client").$Enums.TaxSlab;
        is_available: boolean;
        station_route: import("@prisma/client").$Enums.StationRoute;
    }>;
    toggleAvailability(tenantId: string, itemId: string, is_available: boolean): Promise<{
        id: string;
        tenant_id: string;
        name: string;
        description: string | null;
        sort_order: number;
        category_id: string;
        base_price: number;
        image_url: string | null;
        item_type: import("@prisma/client").$Enums.ItemType;
        hsn_code: string | null;
        tax_slab: import("@prisma/client").$Enums.TaxSlab;
        is_available: boolean;
        station_route: import("@prisma/client").$Enums.StationRoute;
    }>;
    deleteItem(tenantId: string, id: string): Promise<{
        id: string;
        tenant_id: string;
        name: string;
        description: string | null;
        sort_order: number;
        category_id: string;
        base_price: number;
        image_url: string | null;
        item_type: import("@prisma/client").$Enums.ItemType;
        hsn_code: string | null;
        tax_slab: import("@prisma/client").$Enums.TaxSlab;
        is_available: boolean;
        station_route: import("@prisma/client").$Enums.StationRoute;
    }>;
}
