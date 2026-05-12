import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  CartItem,
  CartState,
  MenuItem,
  Variant,
  CartAddon,
  OrderType,
} from '@respos/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeCartLineId(item_id: string, variant_id?: string): string {
  return variant_id ? `${item_id}__${variant_id}` : item_id;
}

// ─── Tax Rate Map ─────────────────────────────────────────────────────────────

const TAX_RATES: Record<string, number> = {
  EXEMPT: 0,
  GST_5: 5,
  GST_12: 12,
  GST_18: 18,
  GST_28: 28,
};

// ─── Cart Derived Calculations ────────────────────────────────────────────────

export function calcCartTotals(items: CartItem[]) {
  const subtotal = items.reduce(
    (sum, i) => sum + (i.unit_price + i.addons_total) * i.quantity,
    0
  );

  // Per-item tax breakdown
  let cgst = 0;
  let sgst = 0;

  items.forEach((i) => {
    const rate = TAX_RATES[i.tax_slab] ?? 0;
    const lineTotal = (i.unit_price + i.addons_total) * i.quantity;
    const taxAmount = Math.round(lineTotal * (rate / 100));
    cgst += taxAmount / 2;
    sgst += taxAmount / 2;
  });

  const service_charge = 0; // configurable per tenant
  const discount = 0;
  const total = subtotal + Math.round(cgst) + Math.round(sgst) + service_charge - discount;

  return {
    subtotal,
    cgst: Math.round(cgst),
    sgst: Math.round(sgst),
    igst: 0,
    service_charge,
    discount,
    total,
    item_count: items.reduce((s, i) => s + i.quantity, 0),
  };
}

// ─── Store Types ──────────────────────────────────────────────────────────────

interface CartActions {
  setOrderType: (type: OrderType) => void;
  setTable: (id: string, number: string) => void;
  clearTable: () => void;
  setPaxCount: (count: number) => void;
  addItem: (item: MenuItem, variant?: Variant, addons?: CartAddon[], quantity?: number) => void;
  updateQuantity: (cartLineId: string, delta: number) => void;
  removeItem: (cartLineId: string) => void;
  updateNotes: (cartLineId: string, notes: string) => void;
  updateCourse: (cartLineId: string, course: number) => void;
  clearCart: () => void;
  setActiveOrderId: (id: string) => void;
}

type CartStore = CartState & CartActions;

// ─── Initial State ────────────────────────────────────────────────────────────

const initialState: CartState = {
  order_type: 'DINE_IN',
  pax_count: 1,
  items: [],
  active_order_id: undefined,
  table_id: undefined,
  table_number: undefined,
};

// ─── Zustand Store ────────────────────────────────────────────────────────────

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      ...initialState,

      setOrderType: (type) => set({ order_type: type }),

      setTable: (id, number) => set({ table_id: id, table_number: number }),

      clearTable: () => set({ table_id: undefined, table_number: undefined }),

      setPaxCount: (count) => set({ pax_count: count }),

      addItem: (item, variant, addons = [], quantity = 1) => {
        set((state) => {
          const cartLineId = makeCartLineId(item.id, variant?.id);
          const existing = state.items.find((i) => i.cartLineId === cartLineId);

          const unit_price = item.base_price + (variant?.additional_price ?? 0);
          const addons_total = addons.reduce((sum, a) => sum + a.price, 0);

          if (existing) {
            return {
              items: state.items.map((i) =>
                i.cartLineId === cartLineId
                  ? { ...i, quantity: i.quantity + quantity }
                  : i
              ),
            };
          }

          const newItem: CartItem = {
            cartLineId,
            item_id: item.id,
            name: item.name,
            item_type: item.item_type,
            station_route: item.station_route,
            tax_slab: item.tax_slab,
            variant_id: variant?.id,
            variant_name: variant?.name,
            unit_price,
            quantity,
            course_number: 1,
            addons,
            addons_total,
          };

          return { items: [...state.items, newItem] };
        });
      },

      updateQuantity: (cartLineId, delta) => {
        set((state) => {
          const items = state.items
            .map((i) =>
              i.cartLineId === cartLineId
                ? { ...i, quantity: i.quantity + delta }
                : i
            )
            .filter((i) => i.quantity > 0);
          return { items };
        });
      },

      removeItem: (cartLineId) => {
        set((state) => ({
          items: state.items.filter((i) => i.cartLineId !== cartLineId),
        }));
      },

      updateNotes: (cartLineId, notes) => {
        set((state) => ({
          items: state.items.map((i) =>
            i.cartLineId === cartLineId ? { ...i, notes } : i
          ),
        }));
      },

      updateCourse: (cartLineId, course_number) => {
        set((state) => ({
          items: state.items.map((i) =>
            i.cartLineId === cartLineId ? { ...i, course_number } : i
          ),
        }));
      },

      clearCart: () => set({ ...initialState }),

      setActiveOrderId: (id) => set({ active_order_id: id }),
    }),
    {
      name: 'rpos-cart',
      // Only persist non-sensitive UI state
      partialize: (state) => ({
        order_type: state.order_type,
        table_id: state.table_id,
        table_number: state.table_number,
        pax_count: state.pax_count,
        items: state.items,
        active_order_id: state.active_order_id,
      }),
    }
  )
);
