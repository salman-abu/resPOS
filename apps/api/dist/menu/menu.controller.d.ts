import { MenuService } from './menu.service';
export declare class MenuController {
    private readonly menuService;
    constructor(menuService: MenuService);
    getCategories(req: any): Promise<{
        id: string;
        name: string;
        is_active: boolean;
        sort_order: number;
        color: string | null;
        icon_url: string | null;
    }[]>;
    createCategory(req: any, name: string): Promise<{
        id: string;
        tenant_id: string;
        name: string;
        is_active: boolean;
        sort_order: number;
        color: string | null;
        icon_url: string | null;
    }>;
    updateCategory(req: any, id: string, name: string): Promise<{
        id: string;
        tenant_id: string;
        name: string;
        is_active: boolean;
        sort_order: number;
        color: string | null;
        icon_url: string | null;
    }>;
    deleteCategory(req: any, id: string): Promise<{
        id: string;
        tenant_id: string;
        name: string;
        is_active: boolean;
        sort_order: number;
        color: string | null;
        icon_url: string | null;
    }>;
    getItems(req: any, categoryId?: string): Promise<({
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
    createItem(req: any, body: any): Promise<{
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
    updateItem(req: any, id: string, body: any): Promise<{
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
    toggleAvailability(req: any, id: string, is_available: boolean): Promise<{
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
    deleteItem(req: any, id: string): Promise<{
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
    syncMenu(req: any): Promise<{
        success: boolean;
        timestamp: number;
    }>;
}
