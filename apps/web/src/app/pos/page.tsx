'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CategoryTabs } from '@/components/pos/CategoryTabs';
import { ItemCard, ItemCardSkeleton } from '@/components/pos/ItemCard';
import { CartSidebar } from '@/components/pos/CartSidebar';
import { KotModal } from '@/components/pos/KotModal';
import PaymentModal from '@/components/pos/PaymentModal';
import ThermalBill from '@/components/pos/ThermalBill';
import { useCartStore, calcCartTotals } from '@/store/cart';
import {
  isMenuCacheStale,
  seedMenuCache,
  getCachedCategories,
  getCachedMenuItems,
  ensureDemoMenuSeeded,
} from '@/lib/db';
import type { Category, MenuItem } from '@respos/types';
import {
  Search,
  WifiOff,
  Wifi,
  RefreshCw,
  LayoutGrid,
  TableProperties,
  ChevronDown,
  Zap,
  BarChart3,
  UtensilsCrossed,
  ShoppingBag,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

function getAuthHeader(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('pos_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ─── Upsell Nudge (Growth Partner feature) ───────────────────────────────────

const UPSELL_NUDGES = [
  '🔥 Most ordered with Butter Naan: Paneer Tikka (+₹180)',
  '💡 Suggest dessert to complete the meal — Gulab Jamun ₹60',
  '⭐ Tables with 3+ items have 30% higher tips — add a starter!',
  '🥤 Pair Biryani with a cold drink — Mango Lassi ₹80',
];

export default function POSPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showOrderTypeMenu, setShowOrderTypeMenu] = useState(false);
  const [kotOpen, setKotOpen] = useState(false);
  const [billOpen, setBillOpen] = useState(false);
  // settledInvoiceId removed
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [billPrintData, setBillPrintData] = useState<any>(null);
  const [nudgeIdx, setNudgeIdx] = useState(0);
  const [showNudge, setShowNudge] = useState(true);

  const {
    items: cartItems,
    order_type,
    table_number,
    pax_count,
    active_order_id,
    setOrderType,
    addItem,
    setActiveOrderId,
    clearCart,
  } = useCartStore();
  const cartTotals = calcCartTotals(cartItems);

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

  // Offline-first menu load
  const loadMenu = useCallback(
    async (force = false) => {
      setLoading(true);
      try {
        // Always ensure demo data exists so POS works without a backend
        await ensureDemoMenuSeeded();

        if (!isMenuCacheStale() && !force) {
          const [cats, its] = await Promise.all([
            getCachedCategories(),
            getCachedMenuItems(),
          ]);
          setCategories(cats);
          setItems(its);
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
              setCategories(cats);
              setItems(its);
            } else {
              // API online but error — fall back to cache (including demo data)
              const [cats, its] = await Promise.all([
                getCachedCategories(),
                getCachedMenuItems(),
              ]);
              setCategories(cats);
              setItems(its);
            }
          } catch {
            // Network error — fall back to cache
            const [cats, its] = await Promise.all([
              getCachedCategories(),
              getCachedMenuItems(),
            ]);
            setCategories(cats);
            setItems(its);
          }
        } else {
          const [cats, its] = await Promise.all([
            getCachedCategories(),
            getCachedMenuItems(),
          ]);
          setCategories(cats);
          setItems(its);
        }
      } catch {
        /* silent */
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [isOnline],
  );

  useEffect(() => {
    loadMenu();
  }, []); // eslint-disable-line

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
    (item: MenuItem) => {
      addItem(item);
    },
    [addItem],
  );

  const handleFireKOT = async () => {
    if (!active_order_id) {
      const res = await fetch(`${API}/orders`, {
        method: 'POST',
        headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_type,
          table_id: useCartStore.getState().table_id,
          pax_count,
          items: cartItems.map((ci) => ({
            item_id: ci.item_id,
            variant_id: ci.variant_id,
            quantity: ci.quantity,
            unit_price: ci.unit_price,
            notes: ci.notes,
            course_number: ci.course_number,
          })),
        }),
      });
      if (!res.ok) throw new Error('Failed to create order');
      const order = await res.json();
      setActiveOrderId(order.id);
      await fetch(`${API}/orders/${order.id}/kot`, {
        method: 'POST',
        headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_ids: order.order_items.map((oi: { id: string }) => oi.id),
        }),
      });
    }
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
    <div className="flex h-screen bg-background overflow-hidden">
      {/* ═══ Main ═══════════════════════════════════════════════════════════ */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* ── Top Bar ──────────────────────────────────────────────────────── */}
        <header className="flex-shrink-0 flex items-center gap-3 px-4 py-3 bg-background-card border-b border-border">
          {/* Brand */}
          <div className="flex items-center gap-2.5 mr-1">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-glow-blue">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="text-content-primary font-black text-sm hidden md:block tracking-tight">
              resPOS
            </span>
          </div>

          {/* Order type */}
          <div className="relative">
            <button
              onClick={() => setShowOrderTypeMenu((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-2 border border-border text-content-secondary text-sm font-medium hover:bg-surface-3 hover:text-content-primary transition-all"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              {order_type.replace('_', ' ')}
              <ChevronDown
                className={cn(
                  'h-3 w-3 transition-transform',
                  showOrderTypeMenu && 'rotate-180',
                )}
              />
            </button>
            {showOrderTypeMenu && (
              <div className="absolute top-full left-0 mt-1 w-36 bg-background-card border border-border rounded-xl shadow-elevated z-20 overflow-hidden animate-scale-in">
                {(['DINE_IN', 'TAKEAWAY', 'DELIVERY'] as const).map((ot) => (
                  <button
                    key={ot}
                    onClick={() => {
                      setOrderType(ot);
                      setShowOrderTypeMenu(false);
                    }}
                    className={cn(
                      'w-full text-left px-3 py-2.5 text-sm transition-colors',
                      order_type === ot
                        ? 'bg-brand-500/10 text-brand-400 font-semibold'
                        : 'text-content-secondary hover:bg-surface-2 hover:text-content-primary',
                    )}
                  >
                    {ot.replace('_', ' ')}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Table info */}
          {order_type === 'DINE_IN' && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-2 border border-border">
              <TableProperties className="h-3.5 w-3.5 text-content-muted" />
              <span className="text-content-secondary text-sm font-medium">
                {table_number ? (
                  `Table ${table_number}`
                ) : (
                  <span className="text-amber-400">No Table</span>
                )}
              </span>
              <span className="text-content-muted text-xs">
                · {pax_count} pax
              </span>
            </div>
          )}

          {/* Search */}
          <div className="flex-1 max-w-md relative ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-content-muted pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search menu items…"
              className="w-full bg-background border border-border rounded-xl pl-9 pr-3 py-2 text-sm text-content-primary placeholder:text-content-muted outline-none focus:border-brand-500/60 focus:bg-background-card transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-content-muted hover:text-content-secondary"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Status + actions */}
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg',
                isOnline
                  ? 'text-emerald-400 bg-emerald-500/10'
                  : 'text-amber-400 bg-amber-500/10',
              )}
            >
              {isOnline ? (
                <Wifi className="h-3.5 w-3.5" />
              ) : (
                <WifiOff className="h-3.5 w-3.5" />
              )}
              <span className="hidden sm:block">
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            <button
              onClick={() => {
                setRefreshing(true);
                loadMenu(true);
              }}
              disabled={refreshing || !isOnline}
              className="h-8 w-8 rounded-lg bg-surface-2 border border-border flex items-center justify-center text-content-muted hover:text-content-primary disabled:opacity-40 transition-colors"
            >
              <RefreshCw
                className={cn('h-3.5 w-3.5', refreshing && 'animate-spin')}
              />
            </button>
            <a
              href="/dashboard"
              className="h-8 w-8 rounded-lg bg-surface-2 border border-border flex items-center justify-center text-content-muted hover:text-content-primary transition-colors"
              title="Dashboard"
            >
              <BarChart3 className="h-3.5 w-3.5" />
            </a>
          </div>
        </header>

        {/* ── Upsell Nudge Bar ──────────────────────────────────────────────── */}
        {showNudge && cartItems.length > 0 && (
          <div className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-amber-500/8 border-b border-amber-500/15 animate-fade-in">
            <span className="text-xs text-amber-300 font-medium flex-1">
              {UPSELL_NUDGES[nudgeIdx]}
            </span>
            <button
              onClick={() => setShowNudge(false)}
              className="text-amber-400/60 hover:text-amber-400 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* ── Category Tabs ─────────────────────────────────────────────────── */}
        <div className="flex-shrink-0 px-4 py-3 border-b border-border/60 bg-background-card">
          <CategoryTabs
            categories={categories}
            selectedId={selectedCategoryId}
            onSelect={setSelectedCategoryId}
            loading={loading}
          />
        </div>

        {/* ── Item count indicator ──────────────────────────────────────────── */}
        {!loading && (
          <div className="flex-shrink-0 px-4 pt-3 pb-1 flex items-center gap-2">
            <UtensilsCrossed className="h-3.5 w-3.5 text-content-muted" />
            <span className="text-content-muted text-xs">
              {displayedItems.length} item{displayedItems.length !== 1 && 's'}
              {selectedCategoryId &&
                categories.find((c) => c.id === selectedCategoryId) && (
                  <>
                    {' '}
                    in{' '}
                    <span className="text-content-secondary font-medium">
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
                  <span className="text-brand-400">{search}</span>&quot;
                </>
              )}
            </span>
          </div>
        )}

        {/* ── Items Grid ────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 pt-2 scrollbar-thin">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {Array.from({ length: 15 }).map((_, i) => (
                <ItemCardSkeleton key={i} />
              ))}
            </div>
          ) : displayedItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 py-20">
              <div className="h-20 w-20 rounded-3xl bg-background-card border border-border flex items-center justify-center text-4xl">
                🍽️
              </div>
              <div className="text-center">
                <p className="text-content-primary font-semibold text-lg">
                  No items found
                </p>
                <p className="text-content-muted text-sm mt-1">
                  {search
                    ? `No results for "${search}"`
                    : 'This category has no available items'}
                </p>
              </div>
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="text-brand-400 text-sm font-medium hover:underline"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {displayedItems.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  onAdd={handleAddItem}
                  inCartQty={cartQtyMap[item.id] ?? 0}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Bottom bar (mobile helper) ────────────────────────────────────── */}
        <div className="flex-shrink-0 md:hidden border-t border-border bg-background-card px-4 py-3 flex items-center justify-between">
          <span className="text-content-muted text-xs">
            {cartItems.reduce((s, i) => s + i.quantity, 0)} items in cart
          </span>
          <button
            onClick={() => setKotOpen(true)}
            disabled={cartItems.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500 text-white text-sm font-semibold disabled:opacity-40"
          >
            <ShoppingBag className="h-4 w-4" />
            Fire KOT
          </button>
        </div>
      </main>

      {/* ═══ Cart Sidebar ════════════════════════════════════════════════════ */}
      <div className="hidden md:block w-72 xl:w-80 flex-shrink-0 border-l border-border">
        <CartSidebar
          onFireKOT={() => setKotOpen(true)}
          onBill={() => setBillOpen(true)}
        />
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
            billPrintData.order ?? {
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
          tenant={{ name: 'NextGen Restaurant', gstin: 'DEMO-GSTIN' }}
          onClose={() => setBillPrintData(null)}
        />
      )}
    </div>
  );
}
