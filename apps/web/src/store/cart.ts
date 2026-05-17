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
import { calculateCartGST } from '@respos/utils';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeCartLineId(
  item_id: string,
  variant_id?: string,
  addons?: CartAddon[],
): string {
  let id = variant_id ? `${item_id}__${variant_id}` : item_id;
  if (addons && addons.length > 0) {
    const addonStr = [...addons]
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((a) => a.id)
      .join('_');
    id += `__${addonStr}`;
  }
  return id;
}

// ─── Cart Derived Calculations ────────────────────────────────────────────────

export function calcCartTotals(
  items: CartItem[],
  redeemPoints = 0,
  rate = 0,
  serviceChargeRate = 0,
) {
  // Pass items to GST engine
  const gstResult = calculateCartGST(items, { is_igst: false });

  const subtotal = items.reduce(
    (sum, i) => sum + (i.unit_price + i.addons_total) * i.quantity,
    0,
  );

  const service_charge = Math.round(subtotal * (serviceChargeRate / 100)); // configurable per tenant
  const discountFromPoints = Math.round(redeemPoints * rate * 100);

  return {
    subtotal,
    cgst: gstResult.cgst,
    sgst: gstResult.sgst,
    igst: gstResult.igst,
    service_charge,
    discount: discountFromPoints,
    total: Math.max(
      0,
      gstResult.grand_total + service_charge - discountFromPoints,
    ),
    item_count: items.reduce((s, i) => s + i.quantity, 0),
  };
}

// ─── Store Types ──────────────────────────────────────────────────────────────

interface CartActions {
  setOrderType: (type: OrderType) => void;
  setTable: (id: string, number: string) => void;
  clearTable: () => void;
  setPaxCount: (count: number) => void;
  setPaxSplit: (adults: number, children: number) => void;
  addItem: (
    item: MenuItem,
    variant?: Variant,
    addons?: CartAddon[],
    quantity?: number,
  ) => void;
  updateQuantity: (cartLineId: string, delta: number) => void;
  removeItem: (cartLineId: string) => void;
  updateNotes: (cartLineId: string, notes: string) => void;
  updateCourse: (cartLineId: string, course: number) => void;
  clearCart: () => void;
  clearItems: () => void; // clears items only — preserves active_order_id and table context
  setActiveOrderId: (id: string | undefined) => void;
  setCustomer: (
    customer: {
      id: string;
      name: string;
      mobile: string;
      points: number;
    } | null,
  ) => void;
  setRedeemPoints: (points: number) => void;
  setRupeesPerPoint: (rate: number) => void;
  setServiceChargeRate: (rate: number) => void;
  hydrateCart: (orderItems: CartItem[]) => void;
  toggleHold: (cartLineId: string) => void;
  updateSeat: (cartLineId: string, seat?: number) => void;
}

type CartStore = CartState & CartActions;

// ─── Initial State ────────────────────────────────────────────────────────────

const initialState: CartState = {
  order_type: 'DINE_IN',
  pax_count: 1,
  adult_pax: 1,
  child_pax: 0,
  items: [],
  active_order_id: undefined,
  table_id: undefined,
  table_number: undefined,
  customer: null,
  redeem_points: 0,
  rupees_per_point: 0,
  service_charge_rate: 0,
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

      setPaxSplit: (adults, children) =>
        set({
          adult_pax: adults,
          child_pax: children,
          pax_count: adults + children,
        }),

      setServiceChargeRate: (rate) => set({ service_charge_rate: rate }),

      addItem: (item, variant, addons = [], quantity = 1) => {
        set((state) => {
          const cartLineId = makeCartLineId(item.id, variant?.id, addons);
          const existing = state.items.find((i) => i.cartLineId === cartLineId);

          const unit_price = item.base_price + (variant?.additional_price ?? 0);
          const addons_total = addons.reduce((sum, a) => sum + a.price, 0);

          if (existing) {
            return {
              items: state.items.map((i) =>
                i.cartLineId === cartLineId
                  ? { ...i, quantity: i.quantity + quantity }
                  : i,
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
            fire_status: 'FIRED',
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
                ? {
                    ...i,
                    quantity: parseFloat((i.quantity + delta).toFixed(3)),
                  }
                : i,
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
            i.cartLineId === cartLineId ? { ...i, notes } : i,
          ),
        }));
      },

      updateCourse: (cartLineId, course_number) => {
        set((state) => ({
          items: state.items.map((i) =>
            i.cartLineId === cartLineId ? { ...i, course_number } : i,
          ),
        }));
      },

      clearCart: () => set({ ...initialState }),

      clearItems: () =>
        set((state) => ({
          items: [],
          redeem_points: 0,
        })),

      setActiveOrderId: (id) => set({ active_order_id: id }),

      setCustomer: (customer) => set({ customer, redeem_points: 0 }),
      setRedeemPoints: (points) => set({ redeem_points: points }),
      setRupeesPerPoint: (rate) => set({ rupees_per_point: rate }),

      hydrateCart: (orderItems) => set({ items: orderItems }),

      toggleHold: (cartLineId) => {
        set((state) => ({
          items: state.items.map((i) =>
            i.cartLineId === cartLineId
              ? {
                  ...i,
                  fire_status: i.fire_status === 'FIRED' ? 'HELD' : 'FIRED',
                }
              : i,
          ),
        }));
      },

      updateSeat: (cartLineId, seat) => {
        set((state) => ({
          items: state.items.map((i) =>
            i.cartLineId === cartLineId ? { ...i, seat_number: seat } : i,
          ),
        }));
      },
    }),
    {
      name: 'rpos-cart',
      // Only persist non-sensitive UI state
      partialize: (state) => ({
        order_type: state.order_type,
        table_id: state.table_id,
        table_number: state.table_number,
        pax_count: state.pax_count,
        adult_pax: state.adult_pax,
        child_pax: state.child_pax,
        items: state.items,
        active_order_id: state.active_order_id,
      }),
    },
  ),
);
