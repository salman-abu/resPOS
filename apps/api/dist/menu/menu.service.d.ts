import { PrismaService } from '../prisma/prisma.service';
export declare class MenuService {
    private prisma;
    constructor(prisma: PrismaService);
    getCategories(tenantId: string): Promise<{
        id: string;
        name: string;
        is_active: boolean;
        sort_order: number;
        color: string | null;
        icon_url: string | null;
    }[]>;
    getItems(tenantId: string, categoryId?: string): Promise<({
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
    } & {
        id: string;
        tenant_id: string;
        name: string;
        sort_order: number;
        category_id: string;
        description: string | null;
        base_price: number;
        image_url: string | null;
        item_type: import("@prisma/client").$Enums.ItemType;
        hsn_code: string | null;
        tax_slab: import("@prisma/client").$Enums.TaxSlab;
        is_available: boolean;
        station_route: import("@prisma/client").$Enums.StationRoute;
    })[]>;
    toggleAvailability(tenantId: string, itemId: string, is_available: boolean): Promise<{
        id: string;
        tenant_id: string;
        name: string;
        sort_order: number;
        category_id: string;
        description: string | null;
        base_price: number;
        image_url: string | null;
        item_type: import("@prisma/client").$Enums.ItemType;
        hsn_code: string | null;
        tax_slab: import("@prisma/client").$Enums.TaxSlab;
        is_available: boolean;
        station_route: import("@prisma/client").$Enums.StationRoute;
    }>;
}
