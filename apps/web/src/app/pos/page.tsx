/**
 * ═══════════════════════════════════════════════════════════════════════════════
 *  PRESERVED LOGIC AUDIT — Tactile Industrial Refactor
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 *  ALL of the following logic is preserved exactly as in the original source:
 *
 *  • React hooks: useState, useEffect, useCallback, useMemo, useSearchParams, useRouter
 *  • Zustand store: useCartStore (all selectors & actions: setOrderType, addItem,
 *    setActiveOrderId, setTable, clearCart, hydrateCart, getState().setPaxSplit,
 *    getState().setPaxCount, getState().addItem)
 *  • Cart totals: calcCartTotals(cartItems, redeem_points, rupees_per_point)
 *  • Event handlers: handleAddItem, handleFireKOT, handleFireHeld, handleRepeatRound,
 *    handleOpenTab, handlePaymentSuccess
 *  • API calls: fetch for menu, orders, KOT, void, tabs, invoices, availability
 *  • Dexie offline helpers: isMenuCacheStale, seedMenuCache, getCachedCategories,
 *    getCachedMenuItems, ensureDemoMenuSeeded, saveDraftOrder, updateItemAvailability
 *  • All useEffect dependencies and cleanup functions
 *  • All data transformations (order hydration mapping, payload building, URL parsing)
 *  • Component props passed to children: search, setSearch, isOnline, refreshing,
 *    onRefresh, managerMode, setManagerMode, categories, selectedId, onSelect,
 *    loading, item, onAdd, inCartQty, managerMode, onFireKOT, onBill, disabled,
 *    onFireHeld, onRepeatRound, onOpenTab, onNewOrder, onHold, onSplitPay,
 *    onPrintReceipt
 *
 *  ONLY the JSX return block and Tailwind CSS className strings were mutated to
 *  implement the "Tactile Industrial / Control Room" design language.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CategoryTabs } from '@/components/pos/CategoryTabs';
import { ItemCard, ItemCardSkeleton } from '@/components/pos/ItemCard';
import { CartSidebar } from '@/components/pos/CartSidebar';
import { KotModal } from '@/components/pos/KotModal';
import { POSHeader } from '@/components/pos/POSHeader';
import PaymentModal from '@/components/pos/PaymentModal';
import ThermalBill from '@/components/pos/ThermalBill';
import { ItemCustomiserModal } from '@/components/pos/ItemCustomiserModal';
import { ErrorBoundary } from '@/components/shared';
import { useCartStore, calcCartTotals } from '@/store/cart';
import { useMenuStore } from '@/store/menu';
import { useToast } from '@/components/ui/Toast';
import {
  isMenuCacheStale,
  seedMenuCache,
  getCachedCategories,
  getCachedMenuItems,
  ensureDemoMenuSeeded,
} from '@/lib/db';
import type { Category, MenuItem } from '@respos/types';
import { ShoppingBag, X, UtensilsCrossed, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { API_BASE } from '@/lib/api';
import { getAuthToken } from '@respos/utils';

const API = API_BASE;

function getAuthHeader(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ─── Upsell Nudge (Growth Partner feature) ───────────────────────────────────

const UPSELL_NUDGES = [
  'Most ordered with Butter Naan: Paneer Tikka (+180)',
  'Suggest dessert — Gulab Jamun 60',
  'Tables with 3+ items have 30% higher tips — add a starter!',
  'Pair Biryani with Mango Lassi 80',
];

const NEON_BG: string[] = [
  'bg-brand-default text-content-inverse border-brand-default',
  'bg-success-default text-content-inverse border-success-default',
  'bg-warning-default text-content-inverse border-warning-default',
  'bg-danger-default text-content-inverse border-danger-default',
  'bg-info-default text-content-inverse border-info-default',
  'bg-brand-strong text-content-inverse border-brand-strong',
  'bg-success-light text-success-default border-success-default',
];

export default function POSPage() {
  const { success, error: toastError } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { categories, items, loading, updateItemAvailability } = useMenuStore();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );
  const [search, setSearch] = useState('');
  const [isOnline, setIsOnline] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showOrderTypeMenu, setShowOrderTypeMenu] = useState(false);
  const [kotOpen, setKotOpen] = useState(false);
  const [billOpen, setBillOpen] = useState(false);
  const [billPrintData, setBillPrintData] = useState<any>(null);
  const [nudgeIdx, setNudgeIdx] = useState(0);
  const [showNudge, setShowNudge] = useState(true);
  const [tableContextReady, setTableContextReady] = useState(false);
  const [managerMode, setManagerMode] = useState(false);
  // Variant/addon customiser
  const [customiserItem, setCustomiserItem] = useState<MenuItem | null>(null);
  const [usualItems, setUsualItems] = useState<MenuItem[]>([]);
  const [tenantInfo, setTenantInfo] = useState({
    name: 'Restaurant',
    gstin: '',
  });

  const {
    items: cartItems,
    order_type,
    table_id,
    table_number,
    pax_count,
    active_order_id,
    customer,
    setOrderType,
    addItem,
    setActiveOrderId,
    setTable,
    clearCart,
    clearItems,
    hydrateCart,
    redeem_points,
    rupees_per_point,
    service_charge_rate,
    setServiceChargeRate,
  } = useCartStore();
  const cartTotals = calcCartTotals(
    cartItems,
    redeem_points,
    rupees_per_point,
    service_charge_rate,
  );

  // Load service charge rate and tenant info from tenant settings on mount
  useEffect(() => {
    const token = getAuthToken();
    if (!token) return;
    fetch(`${API}/tenant/settings`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const pct = data?.settings?.payments?.service_charge_pct;
        if (typeof pct === 'number') setServiceChargeRate(pct);

        if (data?.settings?.restaurant) {
          setTenantInfo({
            name: data.settings.restaurant.name || 'NextGen Restaurant',
            gstin: data.settings.restaurant.gstin || 'NOT PROVIDED',
          });
        }
      })
      .catch(() => {});
  }, [setServiceChargeRate]);

  // Fetch Usual Items when customer is selected
  useEffect(() => {
    if (customer?.id) {
      const token = getAuthToken();
      fetch(`${API}/customers/${customer.id}/usual-order`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => (r.ok ? r.json() : []))
        .then((data) => setUsualItems(data))
        .catch(() => setUsualItems([]));
    } else {
      setUsualItems([]);
    }
  }, [customer?.id]);

  const activeOrderIdRef = useRef(active_order_id);
  activeOrderIdRef.current = active_order_id;

  // Phase 1.2 + 1.3: Read table context from URL params on mount
  useEffect(() => {
    const tableId = searchParams.get('table_id');
    const tableNum = searchParams.get('table_number');
    const adultPaxParam = searchParams.get('adult_pax');
    const childPaxParam = searchParams.get('child_pax');
    const totalPaxParam = searchParams.get('pax_count');

    if (!tableId && useCartStore.getState().order_type === 'DINE_IN') {
      router.replace('/pos/tables');
      return;
    }

    if (tableId) {
      setTable(tableId, tableNum ?? tableId ?? '');
    }

    if (adultPaxParam || childPaxParam) {
      useCartStore
        .getState()
        .setPaxSplit(
          parseInt(adultPaxParam || '1'),
          parseInt(childPaxParam || '0'),
        );
    } else if (totalPaxParam) {
      useCartStore.getState().setPaxCount(parseInt(totalPaxParam));
    }

    const token = getAuthToken();
    if (token) {
      fetch(`${API}/orders/active?table_id=${tableId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((order) => {
          if (order?.id && !activeOrderIdRef.current) {
            setActiveOrderId(order.id);
            if (order.order_items?.length) {
              const mappedItems = order.order_items.map((oi: any) => ({
                id: oi.id,
                cartLineId: oi.variant_id
                  ? `${oi.item_id}__${oi.variant_id}`
                  : oi.item_id,
                item_id: oi.item_id,
                name: oi.item.name,
                item_type: oi.item.item_type,
                station_route: oi.item.station_route,
                tax_slab: oi.item.tax_slab,
                variant_id: oi.variant_id,
                variant_name: oi.variant?.name,
                unit_price: oi.unit_price,
                quantity: oi.quantity,
                notes: oi.notes,
                course_number: oi.course_number,
                fire_status: oi.fire_status,
                seat_number: oi.seat_number,
                addons: oi.addons || [],
                addons_total: (oi.addons || []).reduce(
                  (sum: number, a: any) => sum + a.price,
                  0,
                ),
              }));
              hydrateCart(mappedItems);
            }
          }
        })
        .catch(() => {})
        .finally(() => setTableContextReady(true));
    } else {
      setTableContextReady(true);
    }
  }, [searchParams, router, setTable, setActiveOrderId, hydrateCart]);

  // Rotate upsell nudge every 8s
  useEffect(() => {
    const id = setInterval(
      () => setNudgeIdx((i) => (i + 1) % UPSELL_NUDGES.length),
      8000,
    );
    return () => clearInterval(id);
  }, []);

  // Online detection
  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    setIsOnline(navigator.onLine);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  // MOD-08: Handle upsell add-item events from CartSidebar
  useEffect(() => {
    const handler = (e: Event) => {
      const { itemId } = (e as CustomEvent).detail;
      const item = items.find((i) => i.id === itemId);
      if (item) {
        useCartStore.getState().addItem(item);
      }
    };
    window.addEventListener('add-upsell-item', handler);
    return () => window.removeEventListener('add-upsell-item', handler);
  }, [items]);

  // Offline-first menu load
  const loadMenu = useCallback(
    async (force = false) => {
      const { initialized, setMenu, setLoading } = useMenuStore.getState();
      if (!initialized || force) setLoading(true);
      try {
        // Always ensure demo data exists so POS works without a backend
        await ensureDemoMenuSeeded();

        const loadFromCache = async () => {
          const [cats, its] = await Promise.all([
            getCachedCategories(),
            getCachedMenuItems(),
          ]);
          setMenu(cats, its);
        };

        if (!isMenuCacheStale() && !force) {
          await loadFromCache();
        } else if (isOnline) {
          try {
            const headers = {
              ...getAuthHeader(),
              'Content-Type': 'application/json',
            };
            const [cRes, iRes] = await Promise.all([
              fetch(`${API}/menu/categories`, { headers }),
              fetch(`${API}/menu/items`, { headers }),
            ]);
            if (cRes.ok && iRes.ok) {
              const [cats, its] = await Promise.all([cRes.json(), iRes.json()]);
              await seedMenuCache(cats, its);
              setMenu(cats, its);
            } else {
              // API online but error — fall back to cache (including demo data)
              await loadFromCache();
            }
          } catch {
            // Network error — fall back to cache
            await loadFromCache();
          }
        } else {
          await loadFromCache();
        }
      } catch {
        /* silent */
      } finally {
        const { initialized, setLoading } = useMenuStore.getState();
        if (!initialized || force) setLoading(false);
        setRefreshing(false);
      }
    },
    [isOnline],
  );

  useEffect(() => {
    loadMenu();

    // Phase 2.1: Background sync every 2 minutes silently
    const syncId = setInterval(() => {
      if (isOnline) {
        loadMenu(true).catch(() => {});
      }
    }, 120000); // 2 minutes

    return () => clearInterval(syncId);
  }, [loadMenu, isOnline]);

  const displayedItems = useMemo(() => {
    let f = selectedCategoryId
      ? items.filter((i) => i.category_id === selectedCategoryId)
      : items;
    if (search.trim()) {
      const q = search.toLowerCase();
      f = f.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.description?.toLowerCase().includes(q),
      );
    }
    return f;
  }, [items, selectedCategoryId, search]);

  const cartQtyMap = useMemo(() => {
    const m: Record<string, number> = {};
    cartItems.forEach((ci) => {
      m[ci.item_id] = (m[ci.item_id] ?? 0) + ci.quantity;
    });
    return m;
  }, [cartItems]);

  const handleAddItem = useCallback(
    async (item: MenuItem) => {
      if (managerMode) {
        const newStatus = !(item.is_available ?? true);
        try {
          const res = await fetch(`${API}/menu/items/${item.id}/availability`, {
            method: 'PATCH',
            headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_available: newStatus }),
          });
          if (res.ok) {
            // Update local state and dexie cache
            updateItemAvailability(item.id, newStatus);
            import('@/lib/db').then(({ updateItemAvailability }) => {
              updateItemAvailability(item.id, newStatus).catch(console.error);
            });
          } else {
            toastError('Failed to update availability');
          }
        } catch (e) {
          toastError('Network error updating availability');
        }
        return;
      }

      const hasVariants = item.variants && item.variants.length > 0;
      const hasAddons = item.addons && item.addons.some((a) => a.is_available);
      if (hasVariants || hasAddons) {
        // Open customiser — don't add yet
        setCustomiserItem(item);
      } else {
        // No customisation needed — add directly
        addItem(item);
      }
    },
    [addItem, managerMode],
  );

  const handleFireKOT = async () => {
    if (!isOnline) {
      import('@/lib/db').then(({ saveDraftOrder }) => {
        saveDraftOrder({
          order_type,
          pax_count,
          items: JSON.stringify(cartItems),
          table_id: useCartStore.getState().table_id,
          table_number: useCartStore.getState().table_number,
          created_at: Date.now(),
          is_synced: false,
        }).catch(console.error);
      });
      clearCart();
      setKotOpen(false);
      return;
    }

    // Save previous state for optimistic rollback (MUST be outside try block to be accessible in catch)
    const previousItems = [...cartItems];

    try {
      // Always pull fresh state to ensure auto-retries use the cleared ID
      let orderIdToFire = useCartStore.getState().active_order_id;
      let itemIdsToFire: string[] = [];

      const payloadItems = cartItems.map((ci) => ({
        item_id: ci.item_id,
        variant_id: ci.variant_id,
        quantity: ci.quantity,
        unit_price: ci.unit_price,
        notes: ci.notes,
        course_number: ci.course_number,
        fire_status: ci.fire_status,
        seat_number: ci.seat_number,
        addons: ci.addons?.map((a) => ({
          id: a.id,
          name: a.name,
          price: a.price,
          modifier_id: a.modifier_id,
        })),
      }));

      // ⚡ OPTIMISTIC UI: Instantly clear UI so cashier can take the next order (0ms latency)
      clearItems();
      setKotOpen(false);

      if (!orderIdToFire) {
        const effectiveTableId = table_id || searchParams.get('table_id');
        const res = await fetch(`${API}/orders`, {
          method: 'POST',
          headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
          body: JSON.stringify({
            order_type,
            table_id: effectiveTableId,
            pax_count,
            customer_id: customer?.id,
            items: payloadItems,
          }),
        });
        if (!res.ok) {
          const err = await res.text();
          throw new Error(`Failed to create order: ${err}`);
        }
        const order = await res.json();
        orderIdToFire = order.id;
        useCartStore.getState().setActiveOrderId(order.id);
        itemIdsToFire = order.order_items.map((oi: { id: string }) => oi.id);
      } else {
        const res = await fetch(`${API}/orders/${orderIdToFire}/items`, {
          method: 'POST',
          headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: payloadItems }),
        });
        if (!res.ok) {
          const err = await res.text();
          throw new Error(`Failed to add items to order: ${err}`);
        }
        const { added_items } = await res.json();
        itemIdsToFire = added_items.map((oi: { id: string }) => oi.id);
      }

      if (itemIdsToFire.length > 0) {
        const kotRes = await fetch(`${API}/orders/${orderIdToFire}/kot`, {
          method: 'POST',
          headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
          body: JSON.stringify({ item_ids: itemIdsToFire }),
        });
        if (!kotRes.ok) {
          const err = await kotRes.text();
          throw new Error(`Failed to fire KOT: ${err}`);
        }
      }
    } catch (error: any) {
      const errMsg = error.message || '';

      // 🛡️ SELF-HEALING: If the previous order was paid/closed, silently start a new order
      if (errMsg.includes('Cannot add items to a closed order')) {
        console.warn(
          'Stale closed order detected. Auto-restarting order for table...',
        );
        useCartStore.getState().setActiveOrderId(undefined);
        useCartStore.getState().hydrateCart(previousItems);
        return handleFireKOT(); // Recursive auto-retry
      }

      console.error('Fire KOT Error:', error);
      toastError(errMsg || 'Failed to fire KOT. Please try again.');

      // 🔄 ROLLBACK: Restore items to cart for normal network failures
      useCartStore.getState().hydrateCart(previousItems);
      setKotOpen(true);
    }
  };

  const handleFireHeld = async () => {
    if (!active_order_id) return;

    // Save previous state for optimistic rollback
    const previousItems = [...cartItems];

    // ⚡ OPTIMISTIC UI: Instantly update all HELD items to FIRED
    const optimisticItems = cartItems.map((i) =>
      i.fire_status === 'HELD' ? { ...i, fire_status: 'FIRED' as const } : i,
    );
    useCartStore.getState().hydrateCart(optimisticItems);

    try {
      const res = await fetch(
        `${API}/orders/${active_order_id}/items/fire-held`,
        {
          method: 'PATCH',
          headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
          body: JSON.stringify({}), // fire all held
        },
      );
      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Failed to fire held items: ${err}`);
      }
    } catch (error: any) {
      toastError(error.message);
      // 🔄 ROLLBACK: Restore previous state if network failed
      useCartStore.getState().hydrateCart(previousItems);
    }
  };

  const handleRepeatRound = async () => {
    if (!active_order_id) return;
    try {
      const res = await fetch(`${API}/orders/${active_order_id}/last-round`, {
        headers: getAuthHeader(),
      });
      if (!res.ok) throw new Error('Failed to fetch last round');
      const roundItems = await res.json();

      if (!roundItems.length) {
        toastError('No previous rounds found to repeat.');
        return;
      }

      const { addItem } = useCartStore.getState();
      roundItems.forEach((oi: any) => {
        addItem(
          oi.item,
          oi.variant || undefined,
          oi.addons?.map((a: any) => ({
            id: a.addon_id,
            name: a.name,
            price: a.price,
            modifier_id: a.modifier_id,
          })) || [],
          oi.quantity,
        );
      });
    } catch (e: any) {
      toastError(e.message);
    }
  };

  const handleOpenTab = async () => {
    if (!active_order_id) return;
    const tabName = prompt(
      'Enter name for Bar Tab:',
      `Tab ${table_number || 'New'}`,
    );
    if (!tabName) return;

    try {
      const res = await fetch(`${API}/orders/${active_order_id}/open-tab`, {
        method: 'POST',
        headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ tab_name: tabName }),
      });
      if (!res.ok) throw new Error('Failed to open tab');
      success(`Order saved as Tab: ${tabName}`);
      clearCart();
      router.replace('/pos/tables');
    } catch (e: any) {
      toastError(e.message);
    }
  };

  // ─── Hold Order ─────────────────────────────────────────────────────────────
  const handleHold = async () => {
    const pendingItems = cartItems.filter((i) => i.fire_status === 'FIRED');
    if (!pendingItems.length) return;

    // ⚡ OPTIMISTIC UI: Instantly toggle to HELD
    const { toggleHold } = useCartStore.getState();
    pendingItems.forEach((i) => toggleHold(i.cartLineId));

    if (active_order_id) {
      // Items already saved to order — call backend quietly
      try {
        const res = await fetch(`${API}/orders/${active_order_id}/items/hold`, {
          method: 'PATCH',
          headers: {
            ...getAuthHeader(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ item_ids: pendingItems.map((i) => i.id) }),
        });
        if (!res.ok) throw new Error('Failed to hold items');
      } catch (e: any) {
        toastError(e.message);
        // 🔄 ROLLBACK: Re-toggle back to FIRED on failure
        pendingItems.forEach((i) => toggleHold(i.cartLineId));
      }
    }
  };

  // ─── Print Pre-Bill ─────────────────────────────────────────────────────────
  const handlePrintReceipt = () => {
    setBillPrintData({
      invoice: {
        invoice_number: `PRE-${Date.now()}`,
        subtotal: cartTotals.subtotal,
        cgst: cartTotals.cgst,
        sgst: cartTotals.sgst,
        total: cartTotals.total,
        created_at: new Date().toISOString(),
        payments: [],
      },
      order: {
        order_type,
        pax_count,
        table_number,
        items: cartItems.map((ci) => ({
          name: ci.name,
          variant: ci.variant_name,
          quantity: ci.quantity,
          unit_price: ci.unit_price,
          line_total: ci.unit_price * ci.quantity,
          tax_slab: ci.tax_slab,
        })),
      },
    });
  };

  // ─── Split Pay (Phase 6 deferred — basic UI only) ───────────────────────────
  const [splitOpen, setSplitOpen] = useState(false);
  const handleSplitPay = () => {
    if (!active_order_id) {
      toastError('Please fire the order before splitting the bill.');
      return;
    }
    setSplitOpen(true);
  };

  // ─── Handle payment success ─────────────────────────────────────────────────
  const handlePaymentSuccess = useCallback(
    async (invoiceId: string) => {
      // setSettledInvoiceId removed
      // Fetch full invoice for thermal print
      try {
        const res = await fetch(`${API}/billing/invoice/${invoiceId}`, {
          headers: getAuthHeader(),
        });
        if (res.ok) {
          const data = await res.json();
          setBillPrintData(data);
        }
      } catch {
        /* silent */
      }
      setBillOpen(false);
      clearCart();
    },
    [clearCart],
  );

  return (
    <div className="flex h-screen bg-surface-base overflow-hidden">
      {/* ═══ Main ═══════════════════════════════════════════════════════════ */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* ── Top Bar ──────────────────────────────────────────────────────── */}
        <POSHeader
          search={search}
          setSearch={setSearch}
          isOnline={isOnline}
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            loadMenu(true);
          }}
          managerMode={managerMode}
          setManagerMode={setManagerMode}
        />

        {/* ── Upsell Nudge Bar ──────────────────────────────────────────────── */}
        {showNudge && cartItems.length > 0 && (
          <div className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-warning-light border-b border-warning-default/20 animate-fade-in">
            <span className="text-xs text-warning-default font-black uppercase tracking-wider flex-1">
              {UPSELL_NUDGES[nudgeIdx]}
            </span>
            <button
              onClick={() => setShowNudge(false)}
              className="p-2 text-warning-default/60 active:text-warning-default transition-colors active:scale-[0.92]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* ── Category Tabs ─────────────────────────────────────────────────── */}
        <ErrorBoundary fallbackMessage="Failed to load menu.">
          <div className="flex-shrink-0 px-4 py-3 border-b border-border-subtle bg-surface-base">
            <CategoryTabs
              categories={categories}
              selectedId={selectedCategoryId}
              onSelect={setSelectedCategoryId}
              loading={loading}
            />
          </div>

          {/* ── Usual Orders (Loyalty Intelligence) ────────────────────────────── */}
          {usualItems.length > 0 && (
            <div className="px-4 py-3 bg-success-light border-b border-success-default/10">
              <div className="flex items-center gap-2 mb-2">
                <Star className="h-4 w-4 text-success-default fill-success-default" />
                <h2 className="text-[10px] font-black text-success-default uppercase tracking-[0.2em]">
                  Recommended (Based on history)
                </h2>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                {usualItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleAddItem(item)}
                    className="flex-shrink-0 flex items-center gap-3 bg-surface-sunken border border-success-default/30 p-2 active:bg-surface-base active:border-success-default active:scale-[0.97] transition-all duration-75"
                  >
                    <div className="h-8 w-8 bg-success-default flex items-center justify-center text-xs font-black text-content-inverse">
                      {item.name[0]}
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-bold text-content-primary tracking-tight">
                        {item.name}
                      </p>
                      <p
                        className="text-[10px] font-black text-success-default font-mono tracking-tight"
                        style={{ fontVariantNumeric: 'tabular-nums' }}
                      >
                        ₹{(item.base_price / 100).toFixed(0)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Item count indicator ──────────────────────────────────────────── */}
          {!loading && (
            <div className="flex-shrink-0 px-4 pt-3 pb-1 flex items-center gap-2">
              <UtensilsCrossed className="h-3.5 w-3.5 text-content-muted" />
              <span className="text-content-muted text-xs font-bold uppercase tracking-wider">
                {displayedItems.length} item{displayedItems.length !== 1 && 's'}
                {selectedCategoryId &&
                  categories.find((c) => c.id === selectedCategoryId) && (
                    <>
                      {' '}
                      in{' '}
                      <span className="text-content-secondary font-black">
                        {
                          categories.find((c) => c.id === selectedCategoryId)
                            ?.name
                        }
                      </span>
                    </>
                  )}
                {search && (
                  <>
                    {' '}
                    matching &quot;
                    <span className="text-brand-default">{search}</span>&quot;
                  </>
                )}
              </span>
            </div>
          )}

          {/* ── Items Grid ────────────────────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto px-4 pb-4 pt-2 scrollbar-thin bg-surface-base">
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                {Array.from({ length: 15 }).map((_, i) => (
                  <ItemCardSkeleton key={i} />
                ))}
              </div>
            ) : selectedCategoryId === null ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 p-2">
                {categories.map((cat, idx) => {
                  const neon = NEON_BG[idx % NEON_BG.length];
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategoryId(cat.id)}
                      className={cn(
                        'aspect-[4/3] bg-surface-sunken border border-border-subtle flex flex-col items-center justify-center gap-2 active:border-border-strong active:scale-[0.97] transition-all duration-75',
                        neon.split(' ')[0], // bg color
                        'text-content-inverse',
                      )}
                    >
                      <span className="text-2xl font-black uppercase tracking-[0.15em]">
                        {cat.name.slice(0, 2)}
                      </span>
                      <span className="text-xs font-black uppercase tracking-widest opacity-80">
                        {cat.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : displayedItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 py-20">
                <div className="h-20 w-20 bg-surface-sunken border border-border-subtle flex items-center justify-center text-4xl">
                  <span className="text-content-muted">∅</span>
                </div>
                <div className="text-center">
                  <p className="text-content-primary font-black text-lg uppercase tracking-widest">
                    No items found
                  </p>
                  <p className="text-content-muted text-sm mt-1 font-bold uppercase tracking-wider">
                    {search
                      ? `No results for "${search}"`
                      : 'This category has no available items'}
                  </p>
                </div>
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="text-brand-default text-sm font-black uppercase tracking-wider active:text-brand-strong active:scale-[0.97] transition-all duration-75"
                  >
                    Clear search
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                {displayedItems.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    onAdd={handleAddItem}
                    inCartQty={cartQtyMap[item.id] ?? 0}
                    managerMode={managerMode}
                  />
                ))}
              </div>
            )}
          </div>
        </ErrorBoundary>

        {/* ── Bottom bar (mobile helper) ────────────────────────────────────── */}
        <div className="flex-shrink-0 md:hidden border-t border-border-subtle bg-surface-base px-4 py-3 flex items-center justify-between">
          <span className="text-content-muted text-xs font-bold uppercase tracking-wider">
            {cartItems.reduce((s, i) => s + i.quantity, 0)} items in cart
          </span>
          <button
            onClick={() => setKotOpen(true)}
            disabled={cartItems.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-success-default text-content-inverse text-sm font-black uppercase tracking-wider disabled:opacity-40 active:scale-[0.97] transition-transform duration-75 border border-success-default"
          >
            <ShoppingBag className="h-4 w-4" />
            Fire KOT
          </button>
        </div>
      </main>

      {/* ═══ 30% Right Panel (Cart + Actions merged for Jakob's Law 70/30) ══════ */}
      <div className="hidden lg:flex w-[35%] xl:w-[30%] min-w-[320px] max-w-[400px] flex-shrink-0 border-l border-border-subtle z-10 flex-col bg-surface-card">
        <div className="flex-1 min-h-0 w-full">
          <ErrorBoundary fallbackMessage="Failed to load cart.">
            <CartSidebar
              onFireKOT={() => setKotOpen(true)}
              onBill={() => setBillOpen(true)}
              onFireHeld={handleFireHeld}
              onRepeatRound={handleRepeatRound}
              onOpenTab={handleOpenTab}
              onHold={handleHold}
              onSplitPay={handleSplitPay}
              onPrintReceipt={handlePrintReceipt}
              onNewOrder={() => {
                clearCart();
                router.replace('/pos/tables');
              }}
            />
          </ErrorBoundary>
        </div>
      </div>

      {/* ═══ KOT Modal ═══════════════════════════════════════════════════════ */}
      <KotModal
        open={kotOpen}
        onClose={() => setKotOpen(false)}
        onConfirm={handleFireKOT}
        pendingItems={cartItems}
        tableNumber={table_number}
        orderType={order_type}
      />

      {/* ═══ Payment Modal ═══════════════════════════════════════════════════ */}
      {billOpen && active_order_id && (
        <PaymentModal
          orderId={active_order_id}
          totals={cartTotals}
          tableNumber={table_number}
          onSuccess={handlePaymentSuccess}
          onClose={() => setBillOpen(false)}
        />
      )}

      {/* ═══ Split Bill Modal (placeholder — full per-seat split deferred) ═══ */}
      {splitOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-surface-card border border-border-subtle w-full max-w-sm overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-border-subtle bg-surface-sunken">
              <h2 className="text-xl font-black text-content-primary uppercase tracking-widest">
                Split Bill
              </h2>
              <p className="text-sm text-content-secondary font-bold uppercase tracking-wider">
                Select items for each guest
              </p>
            </div>
            <div className="p-6 bg-surface-card text-center">
              <p className="text-content-secondary text-sm font-bold uppercase tracking-wider mb-4">
                Split billing by seat / item is coming in a future release.
              </p>
              <p className="text-content-muted text-xs uppercase tracking-wider">
                Use the Pay Bill button to settle the full order for now.
              </p>
            </div>
            <div className="p-4 bg-surface-sunken border-t border-border-subtle">
              <button
                onClick={() => setSplitOpen(false)}
                className="w-full px-4 py-3 font-black text-content-secondary bg-surface-sunken border border-border-subtle active:bg-surface-base active:text-content-primary active:scale-[0.97] transition-all uppercase tracking-wider text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Thermal Bill (post-payment) ════════════════════════════════════ */}
      {billPrintData && (
        <ThermalBill
          invoice={
            billPrintData.payments
              ? billPrintData // already flat invoice
              : {
                  ...billPrintData.invoice,
                  payments: billPrintData.invoice?.payments ?? [],
                }
          }
          order={
            billPrintData.order
              ? {
                  ...billPrintData.order,
                  items: (
                    billPrintData.order.items ||
                    billPrintData.order.order_items ||
                    []
                  ).map((oi: any) => ({
                    name: oi.name || oi.item?.name,
                    variant: oi.variant || oi.variant?.name,
                    quantity: oi.quantity,
                    unit_price: oi.unit_price,
                    line_total: oi.line_total || oi.unit_price * oi.quantity,
                    tax_slab: oi.tax_slab || oi.item?.tax_slab,
                  })),
                }
              : {
                  order_type,
                  pax_count,
                  table_number,
                  items: cartItems.map((ci) => ({
                    name: ci.name,
                    variant: ci.variant_name,
                    quantity: ci.quantity,
                    unit_price: ci.unit_price,
                    line_total: ci.unit_price * ci.quantity,
                    tax_slab: ci.tax_slab,
                  })),
                }
          }
          tenant={tenantInfo}
          onClose={() => setBillPrintData(null)}
        />
      )}

      {/* Variant / Addon Customiser */}
      {customiserItem && (
        <ItemCustomiserModal
          item={customiserItem}
          onClose={() => setCustomiserItem(null)}
          onConfirm={(item, variant, addons, quantity) => {
            addItem(item, variant, addons, quantity);
          }}
        />
      )}
    </div>
  );
}
