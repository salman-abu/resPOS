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

export interface Modifier {
  id: string;
  group_id: string;
  name: string;
  price_adjustment: number;
  is_available: boolean;
  sort_order: number;
}

export interface ModifierGroup {
  id: string;
  item_id: string;
  name: string;
  is_required: boolean;
  min_select: number;
  max_select: number;
  sort_order: number;
  modifiers: Modifier[];
}

export interface CompositeItem {
  id: string;
  name: string;
  base_price: number;
  components: any;
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
  modifier_groups?: ModifierGroup[];
}

// ─── Cart Types ─────────────────────────────────────────────────────────────

export interface CartAddon {
  id: string;
  name: string;
  price: number;
  modifier_id?: string;
}

export interface CartItem {
  /** Database ID (if already saved) */
  id?: string;
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
  fire_status: FireStatus;
  seat_number?: number;
  addons: CartAddon[];
  addons_total: number;
}

export type OrderType = 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY' | 'AGGREGATOR';

export interface CartState {
  order_type: OrderType;
  table_id?: string;
  table_number?: string;
  pax_count: number;
  adult_pax?: number;
  child_pax?: number;
  items: CartItem[];
  active_order_id?: string;
  customer?: {
    id: string;
    name: string;
    mobile: string;
    points: number;
  } | null;
  redeem_points: number;
  rupees_per_point: number;
  service_charge_rate: number;
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
export type FireStatus = 'HELD' | 'FIRED';
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
  seat_number?: number;
}

export interface KotPayload {
  order_id: string;
  table_number?: string;
  order_type: OrderType;
  station: StationRoute;
  items: KotItem[];
}

// ─── Invoice / Payment Types ──────────────────────────────────────────────────

export interface Order {
  id: string;
  tenant_id: string;
  order_type: OrderType;
  status: OrderStatus;
  table_id?: string | null;
  customer_id?: string | null;
  pax_count: number;
  order_items: any[];
}

export interface Invoice {
  id: string;
  invoice_number: string;
  order_id: string;
  subtotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  service_charge: number;
  discount: number;
  total: number;
  status: string;
  payments: any[];
}

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

// ─── Offline Sync Types ───────────────────────────────────────────────────────

export type OrderEventType =
  | 'ITEM_ADDED'
  | 'ITEM_REMOVED'
  | 'ITEM_UPDATED'
  | 'DISCOUNT_APPLIED'
  | 'TABLE_CHANGED'
  | 'ORDER_PLACED'
  | 'COURSE_FIRED'
  | 'ORDER_SETTLED';

export interface OrderEvent {
  id: string;
  tenant_id: string;
  order_id: string;
  event_type: OrderEventType;
  payload: Record<string, unknown>;
  device_id: string;
  user_id: string;
  client_timestamp: number; // epoch ms
  server_timestamp?: number;
}

export interface SyncConflictResult {
  resolved: boolean;
  order_id: string;
  error_code?: 'CONFLICT_ORDER_CLOSED';
  invoice?: unknown;
}

export interface SyncResponse {
  processed: number;
  conflicts: SyncConflictResult[];
  canonical_state: Record<string, unknown>;
}
