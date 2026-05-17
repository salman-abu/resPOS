import Dexie, { type Table } from 'dexie';
import type { Category, MenuItem, OrderEvent } from '@respos/types';

// ─── Offline Draft Order ──────────────────────────────────────────────────────

export interface DraftOrder {
  id?: number; // auto-increment
  order_id?: string; // server order ID once synced
  table_id?: string;
  table_number?: string;
  order_type: string;
  pax_count: number;
  items: string; // JSON serialized CartItem[]
  created_at: number;
  is_synced: boolean;
}

// ─── Event Sourcing ─────────────────────────────────────────────────────────────

export interface LocalOrderEvent extends OrderEvent {
  is_synced: boolean; // extra Dexie field
}

export interface LocalOrder {
  id: string;
  tenant_id: string;
  table_id?: string;
  order_type: string;
  status: string;
  items: string; // JSON CartItem[]
  pax_count: number;
  updated_at: number;
  is_draft: boolean;
}

export interface TableStatusCache {
  id: string; // table_id
  tenant_id: string;
  table_number: string;
  status: string;
  current_order_id?: string;
  updated_at: number;
}

export interface SyncMetadata {
  id?: number;
  entity_type: 'orders' | 'menu' | 'tables' | 'events';
  last_sync_at: number; // epoch ms
}

// ─── Database Definition ──────────────────────────────────────────────────────

export class RestaurantPOSDatabase extends Dexie {
  categories!: Table<Category, string>;
  menu_items!: Table<MenuItem, string>;
  draft_orders!: Table<DraftOrder, number>;
  order_events!: Table<LocalOrderEvent, string>;
  orders!: Table<LocalOrder, string>;
  table_status_cache!: Table<TableStatusCache, string>;
  sync_metadata!: Table<SyncMetadata, number>;

  constructor() {
    super('RestaurantPOS');

    this.version(1).stores({
      categories: 'id, tenant_id, is_active, sort_order',
      menu_items:
        'id, category_id, tenant_id, is_available, station_route, sort_order',
      draft_orders: '++id, order_id, table_id, is_synced, created_at',
    });

    this.version(2).stores({
      order_events: 'id, order_id, event_type, is_synced, client_timestamp',
      orders: 'id, tenant_id, table_id, status, updated_at',
      table_status_cache: 'id, tenant_id, status, updated_at',
      sync_metadata: '++id, entity_type, last_sync_at',
    });
  }
}

export const db = new RestaurantPOSDatabase();

// ─── Menu Cache Helpers ───────────────────────────────────────────────────────

const CACHE_KEY = 'menu_cache_ts';
const CACHE_TTL_MS = 1000 * 60 * 2; // 2 minutes

export function isMenuCacheStale(): boolean {
  const ts = localStorage.getItem(CACHE_KEY);
  if (!ts) return true;
  return Date.now() - parseInt(ts, 10) > CACHE_TTL_MS;
}

export async function seedMenuCache(categories: Category[], items: MenuItem[]) {
  await db.transaction('rw', db.categories, db.menu_items, async () => {
    await db.categories.clear();
    await db.menu_items.clear();
    await db.categories.bulkPut(categories);
    await db.menu_items.bulkPut(items);
  });
  localStorage.setItem(CACHE_KEY, Date.now().toString());
}

export async function getCachedCategories(): Promise<Category[]> {
  return db.categories.orderBy('sort_order').toArray();
}

export async function getCachedMenuItems(
  categoryId?: string,
): Promise<MenuItem[]> {
  const query = categoryId
    ? db.menu_items.where('category_id').equals(categoryId)
    : db.menu_items.toCollection();

  const items = await query.toArray();
  return items.sort((a, b) => a.sort_order - b.sort_order);
}

export async function saveDraftOrder(
  draft: Omit<DraftOrder, 'id'>,
): Promise<number> {
  return db.draft_orders.add(draft);
}

export async function getUnsyncedDrafts(): Promise<DraftOrder[]> {
  return db.draft_orders.where('is_synced').equals(0).toArray();
}

export async function markDraftSynced(
  id: number,
  order_id: string,
): Promise<void> {
  await db.draft_orders.update(id, { is_synced: true, order_id });
}

export async function updateItemAvailability(
  itemId: string,
  isAvailable: boolean,
): Promise<void> {
  await db.menu_items.update(itemId, { is_available: isAvailable });
}

// ─── Order Events (Event Sourcing) ────────────────────────────────────────────

export async function queueOrderEvent(
  event: Omit<LocalOrderEvent, 'is_synced'>,
): Promise<void> {
  await db.order_events.put({ ...event, is_synced: false });
}

export async function getUnsyncedEvents(): Promise<LocalOrderEvent[]> {
  return db.order_events
    .where('is_synced')
    .equals(0)
    .sortBy('client_timestamp');
}

export async function getUnsyncedEventCount(): Promise<number> {
  return db.order_events.where('is_synced').equals(0).count();
}

export async function markEventsSynced(eventIds: string[]): Promise<void> {
  await db.order_events.bulkUpdate(
    eventIds.map((id) => ({ key: id, changes: { is_synced: true } })),
  );
}

export async function clearSyncedEvents(): Promise<void> {
  await db.order_events.where('is_synced').equals(1).delete();
}

// ─── Local Orders (Canonical State) ───────────────────────────────────────────

export async function upsertLocalOrder(order: LocalOrder): Promise<void> {
  await db.orders.put(order);
}

export async function getLocalOrder(
  orderId: string,
): Promise<LocalOrder | undefined> {
  return db.orders.get(orderId);
}

export async function getLocalOrdersByTable(
  tableId: string,
): Promise<LocalOrder[]> {
  return db.orders.where('table_id').equals(tableId).toArray();
}

// ─── Table Status Cache ────────────────────────────────────────────────────────

export async function upsertTableStatus(
  status: TableStatusCache,
): Promise<void> {
  await db.table_status_cache.put(status);
}

export async function getCachedTableStatus(
  tableId: string,
): Promise<TableStatusCache | undefined> {
  return db.table_status_cache.get(tableId);
}

// ─── Sync Metadata ──────────────────────────────────────────────────────────────

export async function getLastSync(entityType: string): Promise<number> {
  const meta = await db.sync_metadata
    .where('entity_type')
    .equals(entityType)
    .first();
  return meta?.last_sync_at ?? 0;
}

export async function setLastSync(
  entityType: string,
  timestamp: number,
): Promise<void> {
  const existing = await db.sync_metadata
    .where('entity_type')
    .equals(entityType)
    .first();
  if (existing?.id) {
    await db.sync_metadata.update(existing.id, { last_sync_at: timestamp });
  } else {
    await db.sync_metadata.add({
      entity_type: entityType as any,
      last_sync_at: timestamp,
    });
  }
}

// ─── Demo Seed Data (used when API is offline) ────────────────────────────────

const DEMO_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Starters', is_active: true, sort_order: 1 },
  { id: 'cat-2', name: 'Main Course', is_active: true, sort_order: 2 },
  { id: 'cat-3', name: 'Breads', is_active: true, sort_order: 3 },
  { id: 'cat-4', name: 'Rice & Biryani', is_active: true, sort_order: 4 },
  { id: 'cat-5', name: 'Beverages', is_active: true, sort_order: 5 },
  { id: 'cat-6', name: 'Desserts', is_active: true, sort_order: 6 },
];

const V = 'VEG' as const,
  NV = 'NON_VEG' as const;
const G5 = 'GST_5' as const,
  G12 = 'GST_12' as const;
const HK = 'HOT_KITCHEN' as const,
  CK = 'COLD_KITCHEN' as const,
  BAR = 'BAR' as const,
  BK = 'BAKERY' as const;

const DEMO_ITEMS: MenuItem[] = [
  // Starters
  {
    id: 'item-01',
    category_id: 'cat-1',
    name: 'Paneer Tikka',
    description: 'Smoky cottage cheese cubes in spiced yogurt',
    base_price: 28000,
    item_type: V,
    tax_slab: G5,
    station_route: HK,
    is_available: true,
    sort_order: 1,
    variants: [],
    addons: [],
  },
  {
    id: 'item-02',
    category_id: 'cat-1',
    name: 'Chicken 65',
    description: 'Crispy South Indian fried chicken with curry leaves',
    base_price: 34000,
    item_type: NV,
    tax_slab: G5,
    station_route: HK,
    is_available: true,
    sort_order: 2,
    variants: [],
    addons: [],
  },
  {
    id: 'item-03',
    category_id: 'cat-1',
    name: 'Veg Spring Rolls',
    description: 'Crispy rolls stuffed with seasoned vegetables',
    base_price: 19000,
    item_type: V,
    tax_slab: G5,
    station_route: HK,
    is_available: true,
    sort_order: 3,
    variants: [],
    addons: [],
  },
  {
    id: 'item-04',
    category_id: 'cat-1',
    name: 'Seekh Kebab',
    description: 'Minced lamb skewers with aromatic spices',
    base_price: 38000,
    item_type: NV,
    tax_slab: G5,
    station_route: HK,
    is_available: true,
    sort_order: 4,
    variants: [],
    addons: [],
  },
  {
    id: 'item-05',
    category_id: 'cat-1',
    name: 'Samosa (2 pcs)',
    description: 'Crisp pastry filled with spiced potato and peas',
    base_price: 8000,
    item_type: V,
    tax_slab: G5,
    station_route: HK,
    is_available: true,
    sort_order: 5,
    variants: [],
    addons: [],
  },
  // Main Course
  {
    id: 'item-06',
    category_id: 'cat-2',
    name: 'Butter Chicken',
    description: 'Tender chicken in a rich tomato-cream sauce',
    base_price: 38000,
    item_type: NV,
    tax_slab: G12,
    station_route: HK,
    is_available: true,
    sort_order: 1,
    variants: [],
    addons: [],
  },
  {
    id: 'item-07',
    category_id: 'cat-2',
    name: 'Paneer Butter Masala',
    description: 'Fresh paneer in a velvety tomato-cashew gravy',
    base_price: 32000,
    item_type: V,
    tax_slab: G12,
    station_route: HK,
    is_available: true,
    sort_order: 2,
    variants: [],
    addons: [],
  },
  {
    id: 'item-08',
    category_id: 'cat-2',
    name: 'Dal Makhani',
    description: 'Slow-cooked black lentils with butter and cream',
    base_price: 24000,
    item_type: V,
    tax_slab: G12,
    station_route: HK,
    is_available: true,
    sort_order: 3,
    variants: [],
    addons: [],
  },
  {
    id: 'item-09',
    category_id: 'cat-2',
    name: 'Mutton Rogan Josh',
    description: 'Aromatic Kashmiri lamb curry',
    base_price: 48000,
    item_type: NV,
    tax_slab: G12,
    station_route: HK,
    is_available: true,
    sort_order: 4,
    variants: [],
    addons: [],
  },
  {
    id: 'item-10',
    category_id: 'cat-2',
    name: 'Palak Paneer',
    description: 'Cottage cheese in spiced spinach gravy',
    base_price: 28000,
    item_type: V,
    tax_slab: G12,
    station_route: HK,
    is_available: true,
    sort_order: 5,
    variants: [],
    addons: [],
  },
  {
    id: 'item-11',
    category_id: 'cat-2',
    name: 'Fish Curry',
    description: 'Fresh fish in coconut-based South Indian curry',
    base_price: 44000,
    item_type: NV,
    tax_slab: G12,
    station_route: HK,
    is_available: true,
    sort_order: 6,
    variants: [],
    addons: [],
  },
  // Breads
  {
    id: 'item-12',
    category_id: 'cat-3',
    name: 'Garlic Naan',
    description: 'Tandoor-baked flatbread with garlic and butter',
    base_price: 5000,
    item_type: V,
    tax_slab: G5,
    station_route: HK,
    is_available: true,
    sort_order: 1,
    variants: [],
    addons: [],
  },
  {
    id: 'item-13',
    category_id: 'cat-3',
    name: 'Butter Naan',
    description: 'Soft tandoor flatbread with butter',
    base_price: 4000,
    item_type: V,
    tax_slab: G5,
    station_route: HK,
    is_available: true,
    sort_order: 2,
    variants: [],
    addons: [],
  },
  {
    id: 'item-14',
    category_id: 'cat-3',
    name: 'Lachha Paratha',
    description: 'Layered whole-wheat flatbread',
    base_price: 6000,
    item_type: V,
    tax_slab: G5,
    station_route: HK,
    is_available: true,
    sort_order: 3,
    variants: [],
    addons: [],
  },
  {
    id: 'item-15',
    category_id: 'cat-3',
    name: 'Tandoori Roti',
    description: 'Whole-wheat flatbread from the clay oven',
    base_price: 3500,
    item_type: V,
    tax_slab: G5,
    station_route: HK,
    is_available: true,
    sort_order: 4,
    variants: [],
    addons: [],
  },
  // Rice & Biryani
  {
    id: 'item-16',
    category_id: 'cat-4',
    name: 'Paneer Biryani',
    description: 'Fragrant basmati rice with spiced paneer and saffron',
    base_price: 36000,
    item_type: V,
    tax_slab: G12,
    station_route: HK,
    is_available: true,
    sort_order: 1,
    variants: [],
    addons: [],
  },
  {
    id: 'item-17',
    category_id: 'cat-4',
    name: 'Chicken Biryani',
    description: 'Hyderabadi dum biryani with tender chicken',
    base_price: 42000,
    item_type: NV,
    tax_slab: G12,
    station_route: HK,
    is_available: true,
    sort_order: 2,
    variants: [],
    addons: [],
  },
  {
    id: 'item-18',
    category_id: 'cat-4',
    name: 'Jeera Rice',
    description: 'Steamed basmati rice tempered with cumin',
    base_price: 14000,
    item_type: V,
    tax_slab: G5,
    station_route: HK,
    is_available: true,
    sort_order: 3,
    variants: [],
    addons: [],
  },
  // Beverages
  {
    id: 'item-19',
    category_id: 'cat-5',
    name: 'Masala Chai',
    description: 'Spiced Indian tea with ginger and cardamom',
    base_price: 4000,
    item_type: V,
    tax_slab: G5,
    station_route: BAR,
    is_available: true,
    sort_order: 1,
    variants: [],
    addons: [],
  },
  {
    id: 'item-20',
    category_id: 'cat-5',
    name: 'Mango Lassi',
    description: 'Chilled yogurt drink blended with Alphonso mango',
    base_price: 9000,
    item_type: V,
    tax_slab: G5,
    station_route: BAR,
    is_available: true,
    sort_order: 2,
    variants: [],
    addons: [],
  },
  {
    id: 'item-21',
    category_id: 'cat-5',
    name: 'Fresh Lime Soda',
    description: 'Sparkling lime water with mint, sweet or salted',
    base_price: 7000,
    item_type: V,
    tax_slab: G5,
    station_route: BAR,
    is_available: true,
    sort_order: 3,
    variants: [],
    addons: [],
  },
  {
    id: 'item-22',
    category_id: 'cat-5',
    name: 'Virgin Mojito',
    description: 'Fresh mint, lime and soda — refreshing mocktail',
    base_price: 12000,
    item_type: V,
    tax_slab: G5,
    station_route: BAR,
    is_available: true,
    sort_order: 4,
    variants: [],
    addons: [],
  },
  // Desserts
  {
    id: 'item-23',
    category_id: 'cat-6',
    name: 'Gulab Jamun',
    description: 'Soft milk-solid dumplings in rose sugar syrup',
    base_price: 8000,
    item_type: V,
    tax_slab: G5,
    station_route: CK,
    is_available: true,
    sort_order: 1,
    variants: [],
    addons: [],
  },
  {
    id: 'item-24',
    category_id: 'cat-6',
    name: 'Rasmalai',
    description: 'Cottage cheese patties in sweet saffron milk',
    base_price: 10000,
    item_type: V,
    tax_slab: G5,
    station_route: CK,
    is_available: true,
    sort_order: 2,
    variants: [],
    addons: [],
  },
  {
    id: 'item-25',
    category_id: 'cat-6',
    name: 'Chocolate Brownie',
    description: 'Warm Belgian brownie with vanilla ice cream',
    base_price: 15000,
    item_type: V,
    tax_slab: G12,
    station_route: BK,
    is_available: true,
    sort_order: 3,
    variants: [],
    addons: [],
  },
];

export async function ensureDemoMenuSeeded(): Promise<void> {
  const count = await db.categories.count();
  if (count === 0) {
    await seedMenuCache(DEMO_CATEGORIES, DEMO_ITEMS);
  }
}
