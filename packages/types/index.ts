// ─── Menu Types ────────────────────────────────────────────────────────────

export type ItemType = 'VEG' | 'NON_VEG' | 'EGG' | 'VEGAN';
export type TaxSlab = 'EXEMPT' | 'GST_5' | 'GST_12' | 'GST_18' | 'GST_28';
export type StationRoute = 'HOT_KITCHEN' | 'COLD_KITCHEN' | 'BAR' | 'BAKERY';

export interface Category {
  id: string;
  name: string;
  sort_order: number;
  color?: string | null;
  icon_url?: string | null;
  is_active: boolean;
}

export interface Variant {
  id: string;
  name: string;
  additional_price: number;
}

export interface Addon {
  id: string;
  name: string;
  price: number;
  is_available: boolean;
}

export interface MenuItem {
  id: string;
  category_id: string;
  name: string;
  description?: string | null;
  base_price: number;
  image_url?: string | null;
  item_type: ItemType;
  tax_slab: TaxSlab;
  is_available: boolean;
  station_route: StationRoute;
  sort_order: number;
  variants: Variant[];
  addons: Addon[];
}

// ─── Cart Types ─────────────────────────────────────────────────────────────

export interface CartAddon {
  id: string;
  name: string;
  price: number;
}

export interface CartItem {
  /** Unique line ID in cart (item_id + variant_id combo) */
  cartLineId: string;
  item_id: string;
  name: string;
  item_type: ItemType;
  station_route: StationRoute;
  tax_slab: TaxSlab;
  variant_id?: string;
  variant_name?: string;
  unit_price: number;
  quantity: number;
  notes?: string;
  course_number: number;
  addons: CartAddon[];
  addons_total: number;
}

export type OrderType = 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY' | 'AGGREGATOR';

export interface CartState {
  order_type: OrderType;
  table_id?: string;
  table_number?: string;
  pax_count: number;
  items: CartItem[];
  active_order_id?: string;
}

// ─── Table Types ─────────────────────────────────────────────────────────────

export type TableStatus =
  | 'AVAILABLE'
  | 'OCCUPIED'
  | 'BILLED'
  | 'RESERVED'
  | 'DIRTY';

export interface TableRow {
  id: string;
  table_number: string;
  capacity: number;
  status: TableStatus;
  zone_id: string;
  zone_name: string;
  current_order_id?: string | null;
}

// ─── Order / KOT Types ───────────────────────────────────────────────────────

export type OrderStatus =
  | 'DRAFT'
  | 'PLACED'
  | 'PREPARING'
  | 'READY'
  | 'SERVED'
  | 'BILLED'
  | 'SETTLED'
  | 'VOID';
export type KotStatus = 'PRINTED' | 'PREPARING' | 'READY' | 'CANCELLED';
export type OrderItemStatus =
  | 'PENDING'
  | 'SENT_TO_KDS'
  | 'PREPARING'
  | 'READY'
  | 'SERVED'
  | 'VOID';

export interface KotItem {
  item_id: string;
  name: string;
  variant_name?: string;
  quantity: number;
  notes?: string;
  course_number: number;
}

export interface KotPayload {
  order_id: string;
  table_number?: string;
  order_type: OrderType;
  station: StationRoute;
  items: KotItem[];
}

// ─── Invoice / Payment Types ──────────────────────────────────────────────────

export type PaymentMethod =
  | 'CASH'
  | 'CARD'
  | 'UPI'
  | 'WALLET'
  | 'COMPLIMENTARY';
export type DiscountType = 'PERCENT' | 'FLAT';

export interface InvoiceSummary {
  subtotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  service_charge: number;
  discount: number;
  discount_type?: DiscountType;
  total: number;
}

// ─── Auth Types ──────────────────────────────────────────────────────────────

export type Role =
  | 'OWNER'
  | 'MANAGER'
  | 'CASHIER'
  | 'WAITER'
  | 'KITCHEN'
  | 'CAPTAIN';

export interface AuthUser {
  id: string;
  name: string;
  role: Role;
  tenant_id: string;
}
