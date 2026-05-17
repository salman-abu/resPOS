'use client';

import { useState, useEffect, useRef } from 'react';
import {
  UtensilsCrossed,
  ShoppingBasket,
  ArrowRight,
  X,
  Plus,
  Minus,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  User,
} from 'lucide-react';
import { API_BASE } from '@/lib/api';
import { getAuthToken } from '@respos/utils';
import { useCartStore, calcCartTotals } from '@/store/cart';
import { ItemCustomiserModal } from '@/components/pos/ItemCustomiserModal';
import type { MenuItem, Category, Variant, CartAddon } from '@respos/types';

const KIOSK_IDLE_TIMEOUT = 120000; // 2 minutes

export default function KioskPage() {
  const [step, setStep] = useState<'splash' | 'menu' | 'checkout' | 'success'>(
    'splash',
  );
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);
  const [orderName, setOrderName] = useState('');
  const [orderType, setOrderType] = useState<'DINE_IN' | 'TAKEAWAY'>(
    'TAKEAWAY',
  );
  const [successOrder, setSuccessOrder] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    items: cartItems,
    addItem,
    updateQuantity: updateQty,
    removeItem,
    clearCart,
    redeem_points,
    rupees_per_point,
    service_charge_rate,
  } = useCartStore();
  const totals = calcCartTotals(cartItems, redeem_points, rupees_per_point, service_charge_rate);
  const idleTimer = useRef<NodeJS.Timeout | null>(null);

  const resetIdleTimer = () => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    if (step !== 'splash' && step !== 'success') {
      idleTimer.current = setTimeout(() => {
        clearCart();
        setStep('splash');
      }, KIOSK_IDLE_TIMEOUT);
    }
  };

  useEffect(() => {
    const tenantId = localStorage.getItem('device_tenant_id');
    const token = getAuthToken();

    if (!tenantId || !token) return;

    const fetchData = async () => {
      try {
        const [catRes, itemRes] = await Promise.all([
          fetch(`${API_BASE}/menu/categories`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE}/menu/items`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (catRes.ok && itemRes.ok) {
          const cats = await catRes.json();
          const itms = await itemRes.json();
          setCategories(cats);
          setItems(itms);
          if (cats.length > 0) setSelectedCategoryId(cats[0].id);
        }
      } catch (e) {
        console.error('Kiosk Data Fetch Error:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    window.addEventListener('mousedown', resetIdleTimer);
    window.addEventListener('touchstart', resetIdleTimer);

    return () => {
      window.removeEventListener('mousedown', resetIdleTimer);
      window.removeEventListener('touchstart', resetIdleTimer);
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, [step]);

  const handleStart = () => {
    clearCart();
    setStep('menu');
  };

  const filteredItems = selectedCategoryId
    ? items.filter(
        (i) => i.category_id === selectedCategoryId && i.is_available,
      )
    : items.filter((i) => i.is_available);

  const handlePlaceOrder = async () => {
    setSubmitting(true);
    const token = getAuthToken();
    try {
      const res = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          order_type: orderType,
          order_name: orderName,
          items: cartItems.map((i) => ({
            item_id: i.item_id,
            variant_id: i.variant_id,
            quantity: i.quantity,
            unit_price: i.unit_price,
            addons: i.addons?.map((a) => ({
              id: a.id,
              name: a.name,
              price: a.price,
            })),
          })),
        }),
      });

      if (res.ok) {
        const order = await res.json();
        // Automatically fire KOT for Kiosk
        await fetch(`${API_BASE}/orders/${order.id}/kot`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            item_ids: order.order_items.map((oi: any) => oi.id),
          }),
        });

        setSuccessOrder(order);
        setStep('success');
        clearCart();
        setTimeout(() => setStep('splash'), 15000); // Back to splash after 15s
      }
    } catch (e) {
      console.error('Kiosk Order Error:', e);
    } finally {
      setSubmitting(false);
    }
  };

  if (step === 'splash') {
    return (
      <div
        className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center p-10 relative overflow-hidden"
        onClick={handleStart}
      >
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-600/10 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-lime-600/10 blur-[120px] animate-pulse delay-700" />

        <div className="z-10 flex flex-col items-center text-center gap-12">
          <div className="h-32 w-32 bg-cyan-500 flex items-center justify-center border-2 border-cyan-400 shadow-2xl animate-bounce-subtle">
            <UtensilsCrossed className="h-16 w-16 text-slate-900" />
          </div>

          <div className="space-y-4">
            <h1 className="text-7xl font-black text-white tracking-tighter uppercase">
              Welcome
            </h1>
            <p className="text-2xl font-bold text-slate-400 tracking-wide uppercase">
              Tap anywhere to start ordering
            </p>
          </div>

          <div className="flex items-center gap-4 bg-slate-900 border-2 border-slate-700 px-8 py-4 animate-pulse">
            <div className="h-3 w-3 bg-lime-500 shadow-[0_0_10px_rgba(132,204,22,0.5)]" />
            <span className="text-lg font-black text-slate-300 uppercase tracking-widest">
              System Ready • Fresh Food Awaiting
            </span>
          </div>
        </div>

        <div className="absolute bottom-12 left-0 right-0 flex justify-center gap-10 opacity-30">
          <span className="text-xs font-black tracking-[0.4em] text-white uppercase">
            Dine In
          </span>
          <span className="text-xs font-black tracking-[0.4em] text-white uppercase">
            Takeaway
          </span>
          <span className="text-xs font-black tracking-[0.4em] text-white uppercase">
            Self Service
          </span>
        </div>

        <style jsx>{`
          @keyframes bounce-subtle {
            0%,
            100% {
              transform: translateY(0);
            }
            50% {
              transform: translateY(-20px);
            }
          }
          .animate-bounce-subtle {
            animation: bounce-subtle 3s ease-in-out infinite;
          }
        `}</style>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center p-10 text-center">
        <div className="bg-lime-500 h-32 w-32 flex items-center justify-center border-2 border-lime-400 mb-10 animate-in zoom-in duration-500">
          <CheckCircle2 className="h-16 w-16 text-slate-900" />
        </div>
        <h1 className="text-6xl font-black text-white mb-4 uppercase tracking-widest">
          Thank You!
        </h1>
        <p className="text-2xl text-slate-400 mb-12 font-bold uppercase tracking-wider">
          Your order has been placed and is being prepared.
        </p>

        <div className="bg-slate-900 border-2 border-slate-700 p-12 w-full max-w-md shadow-2xl">
          <p className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] mb-4">
            Your Token Number
          </p>
          <span
            className="text-9xl font-black text-lime-400 font-mono"
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {successOrder?.queue_token_number}
          </span>
          <div className="mt-8 pt-8 border-t-2 border-dashed border-slate-700">
            <p className="text-lg font-bold text-slate-300 italic uppercase tracking-wider">
              &quot;Please wait for your number on the display&quot;
            </p>
          </div>
        </div>

        <button
          onClick={() => setStep('splash')}
          className="mt-16 text-slate-500 font-black uppercase tracking-wider active:text-slate-300 active:scale-[0.97] transition-all flex items-center gap-2"
        >
          Done <ArrowRight size={18} />
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-slate-950 text-white overflow-hidden flex flex-col">
      {/* Kiosk Header */}
      <div className="h-24 bg-slate-900/50 border-b-2 border-slate-800 flex items-center px-10 justify-between backdrop-blur-xl">
        <div className="flex items-center gap-5">
          <button
            onClick={() => setStep('splash')}
            className="h-12 w-12 bg-slate-800 border-2 border-slate-700 flex items-center justify-center active:bg-slate-700 active:scale-[0.92] transition-all"
          >
            <X className="h-6 w-6 text-slate-400" />
          </button>
          <div>
            <h2 className="text-xl font-black tracking-tight uppercase">
              Kiosk Terminal
            </h2>
            <p className="text-[10px] text-slate-500 font-black tracking-[0.2em] uppercase">
              Order ID: #{Math.random().toString(36).substring(7).toUpperCase()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="flex flex-col items-end">
            <span className="text-sm font-bold text-slate-400 uppercase">
              Step 01
            </span>
            <span className="text-lg font-black text-white uppercase">
              Choose Your Meal
            </span>
          </div>
          <div className="h-12 w-px bg-slate-700" />
          <div className="h-14 w-14 bg-cyan-500/20 border-2 border-cyan-500/30 flex items-center justify-center">
            <UtensilsCrossed className="text-cyan-400" />
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Categories Sidebar */}
        <div className="w-40 border-r-2 border-slate-800 bg-slate-950 flex flex-col py-6">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategoryId(cat.id)}
              className={`flex flex-col items-center gap-3 py-8 px-2 transition-all relative ${selectedCategoryId === cat.id ? 'text-white' : 'text-slate-500 active:text-slate-300'}`}
            >
              {selectedCategoryId === cat.id && (
                <div className="absolute left-0 top-4 bottom-4 w-1.5 bg-cyan-500" />
              )}
              <div
                className={`h-16 w-16 flex items-center justify-center transition-all text-2xl font-black ${selectedCategoryId === cat.id ? 'bg-cyan-500 text-slate-900 border-2 border-cyan-400' : 'bg-slate-800 border-2 border-slate-700'}`}
              >
                {cat.name[0]}
              </div>
              <span className="text-xs font-black uppercase tracking-widest text-center">
                {cat.name}
              </span>
            </button>
          ))}
        </div>

        {/* Items Grid */}
        <div className="flex-1 overflow-y-auto p-10 bg-slate-950/50 scrollbar-none">
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                onClick={() => setCustomizingItem(item)}
                className="group bg-slate-800 border-2 border-slate-700 overflow-hidden flex flex-col active:border-slate-500 active:scale-[0.98] cursor-pointer transition-all"
              >
                <div className="h-56 bg-slate-700 relative">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      className="w-full h-full object-cover"
                      alt={item.name}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <UtensilsCrossed className="h-12 w-12 text-slate-600" />
                    </div>
                  )}
                  <div
                    className="absolute bottom-4 right-4 bg-cyan-500 text-slate-900 px-4 py-2 font-black text-lg border-2 border-cyan-400 shadow-2xl font-mono"
                    style={{ fontVariantNumeric: 'tabular-nums' }}
                  >
                    ₹{item.base_price / 100}
                  </div>
                </div>
                <div className="p-4 space-y-2">
                  <h3 className="text-xl font-black leading-tight tracking-tight uppercase">
                    {item.name}
                  </h3>
                  <p className="text-sm text-slate-500 font-medium line-clamp-2">
                    {item.description ||
                      'Freshly prepared with quality ingredients.'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cart Panel (Simplified) */}
        <div className="w-[450px] border-l-2 border-slate-800 bg-slate-900/30 flex flex-col backdrop-blur-2xl">
          <div className="p-6 border-b-2 border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShoppingBasket className="text-cyan-400" />
              <h3 className="text-2xl font-black uppercase tracking-widest">
                Your Tray
              </h3>
            </div>
            <span className="bg-cyan-500 text-slate-900 px-3 py-1 text-xs font-black uppercase tracking-wider">
              {cartItems.length} Items
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-none">
            {cartItems.map((item) => (
              <div
                key={item.cartLineId}
                className="bg-slate-800/50 border-2 border-slate-700 p-4 space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h4 className="font-black text-lg tracking-tight">
                      {item.name}
                    </h4>
                    {item.addons && item.addons.length > 0 && (
                      <p className="text-xs text-slate-500 font-medium">
                        + {item.addons.map((a) => a.name).join(', ')}
                      </p>
                    )}
                  </div>
                  <span
                    className="font-black text-cyan-400 font-mono tracking-tight"
                    style={{ fontVariantNumeric: 'tabular-nums' }}
                  >
                    ₹
                    {((item.unit_price + (item.addons_total || 0)) *
                      item.quantity) /
                      100}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center bg-slate-950 p-1 border-2 border-slate-700">
                    <button
                      onClick={() =>
                        updateQty(item.cartLineId, item.quantity - 1)
                      }
                      className="h-10 w-10 flex items-center justify-center text-slate-400 active:text-white active:bg-slate-800 transition-all"
                    >
                      <Minus size={18} />
                    </button>
                    <span
                      className="w-12 text-center font-black text-lg font-mono"
                      style={{ fontVariantNumeric: 'tabular-nums' }}
                    >
                      {item.quantity}
                    </span>
                    <button
                      onClick={() =>
                        updateQty(item.cartLineId, item.quantity + 1)
                      }
                      className="h-10 w-10 flex items-center justify-center text-slate-400 active:text-white active:bg-slate-800 transition-all"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                  <button
                    onClick={() => removeItem(item.cartLineId)}
                    className="text-xs font-black text-rose-500/50 active:text-rose-400 uppercase tracking-widest active:scale-[0.97] transition-all"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
            {cartItems.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center py-20 text-center opacity-20">
                <ShoppingBasket size={60} className="mb-4" />
                <p className="text-xl font-black uppercase tracking-widest">
                  Your tray is empty
                </p>
              </div>
            )}
          </div>

          <div className="p-8 space-y-6 bg-slate-900 border-t-2 border-slate-800">
            <div className="space-y-4">
              <div className="flex justify-between text-slate-500 font-bold uppercase tracking-widest text-xs">
                <span>Subtotal</span>
                <span
                  className="font-mono tracking-tight"
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                >
                  ₹{totals.subtotal / 100}
                </span>
              </div>
              <div className="flex justify-between text-slate-500 font-bold uppercase tracking-widest text-xs">
                <span>Taxes</span>
                <span
                  className="font-mono tracking-tight"
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                >
                  ₹{(totals.cgst + totals.sgst) / 100}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t-2 border-dashed border-slate-700">
                <span className="text-2xl font-black uppercase tracking-widest">
                  Total
                </span>
                <span
                  className="text-4xl font-black text-cyan-400 tracking-tight font-mono"
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                >
                  ₹{totals.total / 100}
                </span>
              </div>
            </div>

            <button
              onClick={() => setStep('checkout')}
              disabled={cartItems.length === 0}
              className="w-full bg-cyan-500 text-slate-900 h-20 font-black text-xl flex items-center justify-center gap-3 border-2 border-cyan-400 active:bg-cyan-400 active:scale-[0.97] transition-all disabled:opacity-20 disabled:grayscale uppercase tracking-widest"
            >
              Checkout <ArrowRight size={24} />
            </button>
          </div>
        </div>
      </div>

      {/* Checkout Overlay */}
      {step === 'checkout' && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex items-center justify-center p-10">
          <div className="w-full max-w-4xl grid md:grid-cols-2 gap-12 animate-in fade-in zoom-in duration-500">
            <div className="space-y-10">
              <button
                onClick={() => setStep('menu')}
                className="flex items-center gap-2 text-slate-500 font-black uppercase tracking-wider active:text-slate-300 active:scale-[0.97] transition-all"
              >
                <ArrowRight className="rotate-180" size={18} /> Back to Menu
              </button>
              <div className="space-y-4">
                <h2 className="text-7xl font-black tracking-tighter uppercase">
                  Final Details
                </h2>
                <p className="text-xl text-slate-400 font-bold uppercase tracking-wider">
                  Tell us where you want to eat and your name.
                </p>
              </div>

              <div className="space-y-8">
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setOrderType('DINE_IN')}
                    className={`h-32 border-2 flex flex-col items-center justify-center gap-3 transition-all active:scale-[0.97] ${orderType === 'DINE_IN' ? 'bg-cyan-500 text-slate-900 border-cyan-400' : 'border-slate-700 text-slate-500 active:border-slate-600'}`}
                  >
                    <UtensilsCrossed size={32} />
                    <span className="font-black uppercase tracking-widest text-xs">
                      Dine In
                    </span>
                  </button>
                  <button
                    onClick={() => setOrderType('TAKEAWAY')}
                    className={`h-32 border-2 flex flex-col items-center justify-center gap-3 transition-all active:scale-[0.97] ${orderType === 'TAKEAWAY' ? 'bg-cyan-500 text-slate-900 border-cyan-400' : 'border-slate-700 text-slate-500 active:border-slate-600'}`}
                  >
                    <ShoppingBasket size={32} />
                    <span className="font-black uppercase tracking-widest text-xs">
                      Takeaway
                    </span>
                  </button>
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2">
                    <User size={14} /> Your Name
                  </label>
                  <input
                    type="text"
                    value={orderName}
                    onChange={(e) => setOrderName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full h-20 bg-slate-900 border-2 border-slate-700 px-8 text-2xl font-black focus:border-cyan-500 outline-none transition-all placeholder:text-slate-700 tracking-tight"
                  />
                </div>
              </div>
            </div>

            <div className="bg-slate-900 p-12 border-2 border-slate-700 flex flex-col gap-10">
              <div className="flex-1 space-y-6">
                <h3 className="text-xl font-black uppercase tracking-widest border-b-2 border-dashed border-slate-700 pb-6 text-slate-500">
                  Order Summary
                </h3>
                <div className="space-y-4 max-h-[30vh] overflow-y-auto pr-4 scrollbar-none">
                  {cartItems.map((i) => (
                    <div
                      key={i.cartLineId}
                      className="flex justify-between items-center"
                    >
                      <div>
                        <p className="font-black tracking-tight">
                          {i.name}{' '}
                          <span className="text-cyan-400">x{i.quantity}</span>
                        </p>
                        <p
                          className="text-xs text-slate-600 font-bold uppercase tracking-widest font-mono"
                          style={{ fontVariantNumeric: 'tabular-nums' }}
                        >
                          ₹{(i.unit_price + (i.addons_total || 0)) / 100} each
                        </p>
                      </div>
                      <span
                        className="font-black font-mono tracking-tight"
                        style={{ fontVariantNumeric: 'tabular-nums' }}
                      >
                        ₹
                        {((i.unit_price + (i.addons_total || 0)) * i.quantity) /
                          100}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-6 pt-10 border-t-2 border-dashed border-slate-700">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-bold uppercase tracking-widest text-sm">
                    Amount Payable
                  </span>
                  <span
                    className="text-5xl font-black text-white font-mono tracking-tight"
                    style={{ fontVariantNumeric: 'tabular-nums' }}
                  >
                    ₹{totals.total / 100}
                  </span>
                </div>
                <button
                  onClick={handlePlaceOrder}
                  disabled={!orderName || submitting}
                  className="w-full bg-cyan-500 text-slate-900 h-24 font-black text-2xl flex items-center justify-center gap-4 active:bg-cyan-400 active:scale-[0.97] transition-all disabled:opacity-20 border-2 border-cyan-400 uppercase tracking-widest"
                >
                  {submitting ? (
                    'Processing...'
                  ) : (
                    <>
                      <CreditCard size={28} /> Pay & Place Order
                    </>
                  )}
                </button>
                <p className="text-[10px] text-center text-slate-600 font-bold uppercase tracking-widest">
                  By clicking above, you agree to our terms of service.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Item Customiser */}
      {customizingItem && (
        <ItemCustomiserModal
          item={customizingItem}
          onClose={() => setCustomizingItem(null)}
          onConfirm={(item, variant, addons, qty) => {
            addItem(item, variant, addons, qty);
            setCustomizingItem(null);
          }}
        />
      )}
    </div>
  );
}
