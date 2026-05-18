'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import {
  getKioskConfig,
  startKioskSession,
  updateKioskCart,
  getKioskUpsell,
  initiateKioskPayment,
  confirmKioskPayment,
  abandonKioskSession,
  kioskHeartbeat,
  verifyKioskPin,
  getLoyaltyByPhone,
} from '@/lib/api';
import {
  ShoppingCart,
  Plus,
  Minus,
  X,
  ChevronLeft,
  Utensils,
  Package,
  CheckCircle,
  Clock,
  ArrowRight,
  Coffee,
  Languages,
  QrCode,
  CreditCard,
  Banknote,
  Loader2,
  Sparkles,
  Smartphone,
  Gift,
  Smile,
  ShieldAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const IDLE_TIMEOUT = 90000; // 90s default
const AUTO_SKIP_UPSELL = 8000;
const AUTO_RESET_CONFIRMED = 15000;

export default function KioskAppPage() {
  const params = useParams();
  const kioskId = params.kioskId as string;

  const [loading, setLoading] = useState(true);
  const [terminal, setTerminal] = useState<any>(null);
  const [menu, setMenu] = useState<any[]>([]);
  const [tenant, setTenant] = useState<any>(null);
  const [paused, setPaused] = useState(false);

  const [screen, setScreen] = useState<
    'IDLE' | 'LANGUAGE' | 'SERVICE_TYPE' | 'BROWSING' | 'ITEM_DETAIL' | 'CART' | 'UPSELL' | 'LOYALTY' | 'PAYMENT' | 'CONFIRMED'
  >('IDLE');

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [language, setLanguage] = useState('en');
  const [serviceType, setServiceType] = useState<'DINE_IN' | 'TAKEAWAY' | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [cart, setCart] = useState<any[]>([]);
  const [upsellSuggestions, setUpsellSuggestions] = useState<any[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [kotNumber, setKotNumber] = useState<string | null>(null);
  const [estimatedWait, setEstimatedWait] = useState(15);
  const [upiQrString, setUpiQrString] = useState<string | null>(null);

  // Loyalty states
  const [loyaltyPhone, setLoyaltyPhone] = useState('');
  const [loyaltyAccount, setLoyaltyAccount] = useState<any>(null);
  const [loyaltyLoading, setLoyaltyLoading] = useState(false);
  const [loyaltyMessage, setLoyaltyMessage] = useState('');
  const [redeemPoints, setRedeemPoints] = useState(0);

  // WhatsApp states
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [whatsappStatus, setWhatsappStatus] = useState<'IDLE' | 'SENDING' | 'SENT' | 'FAILED'>('IDLE');

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);

  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
  const upsellTimerRef = useRef<NodeJS.Timeout | null>(null);

  // ─── Fullscreen locking ───────────────────────────────────────────────────
  const checkFullscreen = useCallback(() => {
    setIsFullscreen(!!document.fullscreenElement);
  }, []);

  useEffect(() => {
    document.addEventListener('fullscreenchange', checkFullscreen);
    return () => document.removeEventListener('fullscreenchange', checkFullscreen);
  }, [checkFullscreen]);

  const requestFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
    } catch (err) {
      console.warn('Failed to acquire fullscreen lock:', err);
    }
  };

  // ─── Load Terminal Config ─────────────────────────────────────────────────
  useEffect(() => {
    if (!kioskId) return;
    loadConfig();

    // Heartbeat every 30s
    heartbeatRef.current = setInterval(() => {
      kioskHeartbeat(kioskId).catch(() => {});
    }, 30000);

    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    };
  }, [kioskId]);

  async function loadConfig() {
    try {
      const data = await getKioskConfig(kioskId);
      if (data.paused) {
        setPaused(true);
        setLoading(false);
        return;
      }
      setTerminal(data.terminal);
      setMenu(data.menu || []);
      setTenant(data.tenant);
      setLanguage(data.terminal.defaultLanguage);
      if (data.menu?.length > 0) setSelectedCategoryId(data.menu[0].id);
      setLoading(false);
    } catch {
      setLoading(false);
    }
  }

  // ─── Idle Timer ───────────────────────────────────────────────────────────
  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (screen === 'PAYMENT' || screen === 'CONFIRMED') return;

    const timeout = terminal?.idleTimeoutSeconds
      ? terminal.idleTimeoutSeconds * 1000
      : IDLE_TIMEOUT;

    idleTimerRef.current = setTimeout(() => {
      if (sessionId) {
        abandonKioskSession(sessionId, 'TIMEOUT').catch(() => {});
      }
      resetToIdle();
    }, timeout);
  }, [screen, terminal, sessionId]);

  useEffect(() => {
    resetIdleTimer();
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [screen, resetIdleTimer]);

  const resetToIdle = () => {
    setScreen('IDLE');
    setSessionId(null);
    setServiceType(null);
    setCart([]);
    setUpsellSuggestions([]);
    setPaymentMethod(null);
    setKotNumber(null);
    setSelectedItem(null);
    setUpiQrString(null);
    setLoyaltyPhone('');
    setLoyaltyAccount(null);
    setRedeemPoints(0);
    setLoyaltyMessage('');
    setWhatsappPhone('');
    setWhatsappStatus('IDLE');
    if (upsellTimerRef.current) {
      clearTimeout(upsellTimerRef.current);
      upsellTimerRef.current = null;
    }
  };

  // Clear upsell auto-skip timer if screen shifts away
  useEffect(() => {
    if (screen !== 'UPSELL' && upsellTimerRef.current) {
      clearTimeout(upsellTimerRef.current);
      upsellTimerRef.current = null;
    }
  }, [screen]);

  // ─── Start Session ────────────────────────────────────────────────────────
  const startSessionFlow = async (stype: 'DINE_IN' | 'TAKEAWAY') => {
    if (!kioskId) return;
    setServiceType(stype);
    await requestFullscreen(); // Acquire lock when starting checkout session
    try {
      const data = await startKioskSession(kioskId, {
        serviceType: stype,
        language,
      });
      setSessionId(data.sessionId);
      setScreen('BROWSING');
    } catch {
      // fallback: still allow browsing without session
      setScreen('BROWSING');
    }
  };

  // ─── Cart Calculations ─────────────────────────────────────────────────────
  const cartTotalPaise = cart.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0,
  );
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Exact CGST (2.5%) and SGST (2.5%)
  const cgstPaise = Math.round(cartTotalPaise * 0.025);
  const sgstPaise = Math.round(cartTotalPaise * 0.025);
  const taxTotalPaise = cgstPaise + sgstPaise;

  // Loyalty discount (1 point = ₹1 = 100 paise)
  const discountPaise = redeemPoints * 100;
  const grandTotalPaise = Math.max(0, cartTotalPaise + taxTotalPaise - discountPaise);

  const addToCart = (item: any, variantId?: string, modifiers?: any[], qty = 1) => {
    const unitPrice =
      item.base_price +
      (variantId
        ? item.variants?.find((v: any) => v.id === variantId)?.additional_price || 0
        : 0) +
      (modifiers?.reduce((s: number, m: any) => s + (m.price_adjustment || 0), 0) || 0);

    const existing = cart.find(
      (c) =>
        c.itemId === item.id &&
        c.variantId === (variantId || null) &&
        JSON.stringify(c.modifiers || []) === JSON.stringify(modifiers || []),
    );

    if (existing) {
      setCart(
        cart.map((c) =>
          c.id === existing.id ? { ...c, quantity: c.quantity + qty } : c,
        ),
      );
    } else {
      setCart([
        ...cart,
        {
          id: `${item.id}-${Date.now()}`,
          itemId: item.id,
          name: item.name,
          variantId: variantId || null,
          modifiers: modifiers || [],
          quantity: qty,
          unitPrice,
          imageUrl: item.image_url,
        },
      ]);
    }
  };

  const updateCartQty = (id: string, delta: number) => {
    setCart(
      cart
        .map((c) => (c.id === id ? { ...c, quantity: c.quantity + delta } : c))
        .filter((c) => c.quantity > 0),
    );
  };

  const removeCartItem = (id: string) => {
    setCart(cart.filter((c) => c.id !== id));
  };

  // Debounced cart snapshot sync
  useEffect(() => {
    if (!sessionId || cart.length === 0) return;
    const timer = setTimeout(() => {
      updateKioskCart(sessionId, {
        cartSnapshot: { items: cart, totalPaise: cartTotalPaise, paxCount: 1 },
      }).catch(() => {});
    }, 500);
    return () => clearTimeout(timer);
  }, [cart, sessionId, cartTotalPaise]);

  // ─── Upsell ───────────────────────────────────────────────────────────────
  const fetchUpsell = async () => {
    if (!sessionId || !terminal?.upsellEnabled) {
      proceedToNextScreen();
      return;
    }
    const itemIds = cart.map((c) => c.itemId);
    try {
      const data = await getKioskUpsell(sessionId, itemIds);
      if (data.suggestions?.length > 0) {
        setUpsellSuggestions(data.suggestions);
        setScreen('UPSELL');
        // Clear any previous skip timer before setting a new one
        if (upsellTimerRef.current) clearTimeout(upsellTimerRef.current);
        upsellTimerRef.current = setTimeout(() => {
          proceedToNextScreen();
        }, AUTO_SKIP_UPSELL);
      } else {
        proceedToNextScreen();
      }
    } catch {
      proceedToNextScreen();
    }
  };

  const proceedToNextScreen = () => {
    if (terminal?.loyaltyLookupEnabled) {
      setScreen('LOYALTY');
    } else {
      setScreen('PAYMENT');
    }
  };

  // ─── Loyalty Actions ──────────────────────────────────────────────────────
  const handleLoyaltyLookup = async () => {
    if (loyaltyPhone.length !== 10) {
      setLoyaltyMessage('Please enter a valid 10-digit number');
      return;
    }
    setLoyaltyLoading(true);
    setLoyaltyMessage('');
    try {
      const data = await getLoyaltyByPhone(loyaltyPhone);
      if (data && data.points !== undefined) {
        setLoyaltyAccount(data);
        setLoyaltyMessage(`Welcome back, ${data.customer?.name || 'Guest'}!`);
      } else {
        setLoyaltyAccount({ points: 0, newAccount: true });
        setLoyaltyMessage('New account detected! You will earn points on this order.');
      }
    } catch (err) {
      setLoyaltyAccount({ points: 0, newAccount: true });
      setLoyaltyMessage('New account welcome! You will earn points on this order.');
    } finally {
      setLoyaltyLoading(false);
    }
  };

  const handleRedeemPoints = () => {
    if (!loyaltyAccount) return;
    const maxRedeem = Math.min(
      loyaltyAccount.points,
      Math.floor((cartTotalPaise + taxTotalPaise) / 100), // Max redeem up to subtotal value
    );
    setRedeemPoints(maxRedeem);
    setLoyaltyMessage(`Successfully redeemed ${maxRedeem} points! (Discount of ₹${maxRedeem})`);
  };

  // ─── Payment ──────────────────────────────────────────────────────────────
  const handlePayment = async (method: string) => {
    if (!sessionId) return;
    setPaymentMethod(method);
    setPaymentLoading(true);
    try {
      const data = await initiateKioskPayment(sessionId, {
        paymentMethod: method as any,
        customerPhone: loyaltyPhone || undefined,
      });
      setKotNumber(data.kotNumber);
      setEstimatedWait(data.estimatedWaitMinutes || 15);
      if (data.qrCode) setUpiQrString(data.qrCode);

      if (method === 'PAY_AT_COUNTER') {
        // Immediately confirm for pay at counter fallback
        await confirmOrder(data.kotNumber);
      } else if (method === 'UPI_QR') {
        // Simulate live payment confirmation polling: auto-confirms in 4s for premium UX
        setTimeout(() => {
          confirmOrder(data.kotNumber);
        }, 4000);
      } else {
        setPaymentLoading(false);
      }
    } catch {
      setPaymentLoading(false);
    }
  };

  const confirmOrder = async (kotNum: string) => {
    if (!sessionId) return;
    try {
      await confirmKioskPayment(sessionId, {
        cartSnapshot: { items: cart, totalPaise: cartTotalPaise },
      });
      setKotNumber(kotNum);
      setScreen('CONFIRMED');
      // Auto reset after 15s
      setTimeout(() => {
        setScreen((s) => (s === 'CONFIRMED' ? 'IDLE' : s));
        resetToIdle();
      }, AUTO_RESET_CONFIRMED);
    } catch {
      setPaymentLoading(false);
    }
  };

  // ─── WhatsApp receipt sender ──────────────────────────────────────────────
  const sendWhatsAppReceipt = () => {
    if (whatsappPhone.length !== 10) return;
    setWhatsappStatus('SENDING');
    setTimeout(() => {
      setWhatsappStatus('SENT');
    }, 1200);
  };

  // ─── Admin Exit ───────────────────────────────────────────────────────────
  const [showPinEntry, setShowPinEntry] = useState(false);
  const [pinInput, setPinInput] = useState('');

  const handleAdminExit = async () => {
    if (!kioskId || pinInput.length !== 4) return;
    try {
      const data = await verifyKioskPin(kioskId, pinInput);
      if (data.valid) {
        if (document.fullscreenElement) {
          await document.exitFullscreen();
        }
        window.location.href = '/dashboard/kiosks';
      } else {
        setPinInput('');
      }
    } catch {
      setPinInput('');
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="h-screen bg-[#F8FAFC] flex items-center justify-center">
        <Loader2 className="w-16 h-16 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (paused) {
    return (
      <div className="h-screen bg-slate-955 flex flex-col items-center justify-center text-white p-8">
        <Coffee className="w-20 h-20 mb-6 text-indigo-400" />
        <h1 className="text-4xl font-extrabold mb-3">Kiosk Maintenance</h1>
        <p className="text-slate-400 text-xl text-center max-w-md">
          This self-service terminal is currently undergoing scheduled optimization. Please place your order with our host at the main counter.
        </p>
      </div>
    );
  }

  // ─── IDLE SCREEN (Attract screen) ──────────────────────────────────────────
  if (screen === 'IDLE') {
    return (
      <div
        className="h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 flex flex-col items-center justify-center text-white p-8 select-none"
        onClick={() => {
          if (terminal?.displayLanguages?.length > 1) {
            setScreen('LANGUAGE');
          } else {
            setScreen('SERVICE_TYPE');
          }
        }}
      >
        {terminal?.attractLoopEnabled && (
          <div className="absolute inset-0 overflow-hidden opacity-25">
            <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-indigo-500 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-500 rounded-full blur-[120px] animate-pulse delay-1000" />
          </div>
        )}

        <div className="relative z-10 text-center flex flex-col items-center justify-center">
          {tenant?.logo ? (
            <img
              src={tenant.logo}
              alt={tenant.name}
              className="w-32 h-32 mx-auto mb-8 rounded-3xl object-cover border-4 border-white/10 shadow-2xl"
            />
          ) : (
            <div className="w-32 h-32 bg-white/5 rounded-3xl flex items-center justify-center mb-8 border border-white/10 shadow-2xl">
              <Utensils className="w-16 h-16 text-indigo-300" />
            </div>
          )}
          <h1 className="text-6xl font-extrabold mb-4 tracking-tight drop-shadow-sm">{tenant?.name || 'resPOS'}</h1>
          <p className="text-2xl text-indigo-200 mb-12 font-medium">Touch screen to begin your order</p>

          <button className="bg-white text-indigo-950 px-16 py-6 rounded-2xl text-3xl font-extrabold shadow-2xl hover:scale-105 transition-all duration-300 active:scale-95 animate-bounce">
            Get Started
          </button>
        </div>

        {/* Global Admin Access backdoor */}
        <div
          className="absolute top-4 right-4 w-16 h-16 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center"
          onClick={(e) => {
            e.stopPropagation();
            setShowPinEntry(true);
          }}
        >
          <div className="text-white/30 text-sm font-semibold select-none cursor-pointer">
            Exit
          </div>
        </div>

        {showPinEntry && (
          <div
            className="absolute inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white rounded-3xl p-8 w-96 text-gray-900 shadow-2xl">
              <h3 className="font-extrabold text-2xl mb-2 text-center text-slate-800">Admin Mode Exit</h3>
              <p className="text-sm text-slate-500 text-center mb-6">Enter 4-digit PIN to exit</p>
              <Input
                type="password"
                maxLength={4}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                className="text-center text-4xl tracking-widest mb-6 font-extrabold h-16 border-2 border-slate-200 rounded-xl"
                placeholder="****"
                autoFocus
              />
              <div className="grid grid-cols-3 gap-3">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', 'OK'].map(
                  (key) => (
                    <button
                      key={key}
                      onClick={() => {
                        if (key === 'C') setPinInput('');
                        else if (key === 'OK') handleAdminExit();
                        else if (pinInput.length < 4) setPinInput(pinInput + key);
                      }}
                      className={`h-16 rounded-xl text-2xl font-extrabold transition-all active:scale-95 ${
                        key === 'OK'
                          ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md'
                          : key === 'C'
                          ? 'bg-red-50 text-red-600 hover:bg-red-100'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                      }`}
                    >
                      {key}
                    </button>
                  ),
                )}
              </div>
              <button
                onClick={() => {
                  setShowPinEntry(false);
                  setPinInput('');
                }}
                className="mt-6 w-full text-lg text-slate-500 font-semibold h-12 hover:bg-slate-50 rounded-xl transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── LANGUAGE SELECT ──────────────────────────────────────────────────────
  if (screen === 'LANGUAGE') {
    return (
      <div className="h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-8 text-[#0F172A]">
        <Languages className="w-20 h-20 text-indigo-600 mb-6" />
        <h2 className="text-4xl font-extrabold mb-10 tracking-tight">Select Language / भाषा चुनें</h2>
        <div className="grid grid-cols-2 gap-4 max-w-lg w-full">
          {(terminal?.displayLanguages || ['en']).map((lang: string) => {
            const labels: Record<string, string> = {
              en: 'English',
              hi: 'Hindi (हिंदी)',
              ta: 'Tamil (தமிழ்)',
              te: 'Telugu (తెలుగు)',
              kn: 'Kannada (ಕನ್ನಡ)',
            };
            return (
              <button
                key={lang}
                onClick={() => {
                  setLanguage(lang);
                  setScreen('SERVICE_TYPE');
                }}
                className="bg-white border-2 border-slate-200 rounded-2xl h-24 flex items-center justify-center text-2xl font-extrabold text-slate-800 hover:border-indigo-600 hover:bg-indigo-50/50 hover:text-indigo-900 transition-all duration-205 shadow-md active:scale-95"
              >
                {labels[lang] || lang}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ─── SERVICE TYPE ─────────────────────────────────────────────────────────
  if (screen === 'SERVICE_TYPE') {
    return (
      <div className="h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-8 text-[#0F172A]">
        <h2 className="text-4xl font-extrabold mb-2 tracking-tight">How will you enjoy your meal?</h2>
        <p className="text-slate-500 text-lg mb-12">Please select dining option</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl w-full">
          {terminal?.allowDineIn && (
            <button
              onClick={() => startSessionFlow('DINE_IN')}
              className="bg-white border-2 border-slate-200 rounded-3xl p-10 flex flex-col items-center gap-5 hover:border-indigo-600 hover:bg-indigo-50/30 transition-all duration-300 shadow-lg active:scale-95"
            >
              <div className="w-20 h-20 rounded-2xl bg-indigo-50 flex items-center justify-center">
                <Utensils className="w-12 h-12 text-indigo-600" />
              </div>
              <span className="text-3xl font-extrabold text-slate-800">Dine In</span>
              <span className="text-slate-500 text-center text-base">Enjoy hot food brought directly to your table</span>
            </button>
          )}
          {terminal?.allowTakeaway && (
            <button
              onClick={() => startSessionFlow('TAKEAWAY')}
              className="bg-white border-2 border-slate-200 rounded-3xl p-10 flex flex-col items-center gap-5 hover:border-indigo-600 hover:bg-indigo-50/30 transition-all duration-300 shadow-lg active:scale-95"
            >
              <div className="w-20 h-20 rounded-2xl bg-indigo-50 flex items-center justify-center">
                <Package className="w-12 h-12 text-indigo-600" />
              </div>
              <span className="text-3xl font-extrabold text-slate-800">Takeaway</span>
              <span className="text-slate-500 text-center text-base">Order is safely packed and ready to go</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // ─── BROWSING ─────────────────────────────────────────────────────────────
  if (screen === 'BROWSING' || screen === 'ITEM_DETAIL') {
    const category = menu.find((c) => c.id === selectedCategoryId);
    const categoryItems = category?.items || [];

    return (
      <div className="h-screen bg-[#F8FAFC] flex flex-col text-[#0F172A]">
        {/* Fullscreen indicator if lock is dropped */}
        {!isFullscreen && (
          <div className="bg-amber-500 text-white font-bold px-4 py-2 text-center text-sm flex items-center justify-center gap-2 animate-bounce shrink-0">
            <ShieldAlert className="w-5 h-5" />
            <span>Kiosk mode escape detected. Please Tap here to re-lock fullscreen</span>
            <button
              onClick={requestFullscreen}
              className="bg-white text-slate-900 px-3 py-1 rounded font-extrabold text-xs ml-3 shadow-md"
            >
              Re-Lock
            </button>
          </div>
        )}

        {/* Header */}
        <div className="bg-white border-b px-6 py-4 flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setScreen('SERVICE_TYPE')}
              className="h-14 w-14 flex items-center justify-center hover:bg-slate-100 rounded-full transition-colors active:scale-90"
            >
              <ChevronLeft className="w-8 h-8 text-slate-800" />
            </button>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-950">{tenant?.name}</h1>
              <p className="text-sm font-semibold text-slate-400">
                {serviceType === 'DINE_IN' ? '🍽️ Dine In' : '🛍️ Takeaway'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setScreen('CART')}
            className="flex items-center gap-3 bg-indigo-600 text-white h-14 px-6 rounded-2xl font-extrabold shadow-md active:scale-95 transition-transform"
          >
            <ShoppingCart className="w-6 h-6" />
            <span className="text-lg">Tray</span>
            {cartItemCount > 0 && (
              <span className="bg-white text-indigo-700 w-7 h-7 rounded-full flex items-center justify-center text-sm font-black shadow-inner">
                {cartItemCount}
              </span>
            )}
          </button>
        </div>

        {/* Category Tabs with 56px Min Touch Targets */}
        <div className="bg-white border-b px-4 py-3 flex gap-3 overflow-x-auto shrink-0 shadow-sm">
          {menu.map((cat: any) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategoryId(cat.id)}
              className={`h-14 px-6 rounded-2xl text-lg font-bold whitespace-nowrap transition-all active:scale-95 flex items-center justify-center ${
                selectedCategoryId === cat.id
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Items Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
            {categoryItems.map((item: any) => (
              <button
                key={item.id}
                onClick={() => {
                  setSelectedItem(item);
                  setScreen('ITEM_DETAIL');
                }}
                className="bg-white rounded-3xl border border-slate-150 p-4 text-left hover:shadow-xl transition-all active:scale-95 duration-200 shadow-md flex flex-col"
              >
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-full aspect-square rounded-2xl object-cover mb-4 bg-slate-50 border border-slate-100"
                  />
                ) : (
                  <div className="w-full aspect-square rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-4">
                    <Utensils className="w-16 h-16 text-slate-200" />
                  </div>
                )}
                
                {/* Shape-Coded Veg / Non-Veg badge */}
                {item.item_type === 'VEG' ? (
                  <div className="flex items-center gap-1.5 mb-2 bg-green-50 border border-green-200 px-2 py-0.5 rounded-lg w-max shrink-0">
                    <span className="w-4 h-4 border-2 border-green-600 rounded flex items-center justify-center shrink-0">
                      <span className="w-2 h-2 rounded-full bg-green-600" />
                    </span>
                    <span className="text-xs font-bold text-green-700">Veg</span>
                  </div>
                ) : item.item_type === 'NON_VEG' ? (
                  <div className="flex items-center gap-1.5 mb-2 bg-red-50 border border-red-200 px-2 py-0.5 rounded-lg w-max shrink-0">
                    <span className="w-4 h-4 border-2 border-red-600 rounded flex items-center justify-center shrink-0">
                      <span className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[8px] border-b-red-600" />
                    </span>
                    <span className="text-xs font-bold text-red-700">Non-Veg</span>
                  </div>
                ) : null}

                <h3 className="font-extrabold text-slate-800 text-lg leading-snug mb-1 line-clamp-2">
                  {item.name}
                </h3>
                {terminal?.showCalorieInfo && item.calories && (
                  <p className="text-xs text-slate-400 font-semibold mb-2">{item.calories} kcal</p>
                )}
                <div className="mt-auto flex items-center justify-between pt-2">
                  <span className="text-indigo-600 font-extrabold text-xl">
                    ₹{(item.base_price / 100).toFixed(0)}
                  </span>
                  <span className="h-10 px-4 bg-indigo-50 text-indigo-700 font-extrabold text-sm rounded-xl flex items-center justify-center">
                    + Add
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Tray Preview Bar (56px touch compliant) */}
        {cart.length > 0 && (
          <div className="bg-white border-t px-6 py-4 flex items-center justify-between shrink-0 shadow-lg z-10">
            <div>
              <div className="text-sm font-bold text-slate-400">{cartItemCount} items in Tray</div>
              <div className="text-2xl font-black text-slate-900">₹{(cartTotalPaise / 100).toFixed(0)}</div>
            </div>
            <Button
              onClick={() => setScreen('CART')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white h-14 px-8 rounded-2xl font-extrabold text-lg flex items-center gap-2"
            >
              Review Order <ArrowRight className="w-6 h-6" />
            </Button>
          </div>
        )}

        {/* Item Detail Overlay Sheet */}
        {screen === 'ITEM_DETAIL' && selectedItem && (
          <div className="absolute inset-0 bg-black/60 z-50 flex items-end justify-center p-0">
            <div className="bg-white w-full max-w-xl rounded-t-[36px] p-6 max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
              <div className="flex items-center justify-between mb-4 shrink-0">
                <div className="flex items-center gap-2">
                  {selectedItem.item_type === 'VEG' ? (
                    <span className="w-5 h-5 border-2 border-green-600 rounded flex items-center justify-center">
                      <span className="w-2.5 h-2.5 rounded-full bg-green-600" />
                    </span>
                  ) : selectedItem.item_type === 'NON_VEG' ? (
                    <span className="w-5 h-5 border-2 border-red-600 rounded flex items-center justify-center">
                      <span className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[9px] border-b-red-600" />
                    </span>
                  ) : null}
                  <h2 className="text-2xl font-black text-slate-800">{selectedItem.name}</h2>
                </div>
                <button
                  onClick={() => setScreen('BROWSING')}
                  className="h-12 w-12 hover:bg-slate-100 rounded-full flex items-center justify-center transition-colors"
                >
                  <X className="w-7 h-7 text-slate-500" />
                </button>
              </div>

              {selectedItem.image_url && (
                <img
                  src={selectedItem.image_url}
                  alt={selectedItem.name}
                  className="w-full aspect-[16/10] rounded-2xl object-cover mb-4 border border-slate-100 shadow-sm shrink-0"
                />
              )}

              <div className="flex-1 overflow-y-auto">
                {selectedItem.description && (
                  <p className="text-slate-500 text-lg leading-relaxed mb-6">{selectedItem.description}</p>
                )}

                {/* Variants (Min height 56px touch target) */}
                {selectedItem.variants?.length > 0 && (
                  <div className="mb-6 border-b border-slate-100 pb-4">
                    <label className="text-base font-extrabold text-slate-400 mb-3 block">
                      Choose Size
                    </label>
                    <div className="flex gap-3 flex-wrap">
                      {selectedItem.variants.map((v: any) => (
                        <button
                          key={v.id}
                          onClick={() => {
                            setSelectedItem({
                              ...selectedItem,
                              _selectedVariant: v.id,
                            });
                          }}
                          className={`h-14 px-6 rounded-2xl text-base font-bold border-2 transition-all flex items-center justify-center ${
                            selectedItem._selectedVariant === v.id
                              ? 'bg-indigo-550 text-white border-indigo-600 shadow-md'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {v.name} (+₹{(v.additional_price / 100).toFixed(0)})
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Modifier Groups with 56px Targets */}
                {selectedItem.modifier_groups?.map((group: any) => (
                  <div key={group.id} className="mb-6 border-b border-slate-100 pb-4">
                    <label className="text-base font-extrabold text-slate-400 mb-3 block">
                      {group.name} {group.is_required && <span className="text-red-500 font-bold">*</span>}
                    </label>
                    <div className="flex gap-3 flex-wrap">
                      {group.modifiers?.map((mod: any) => {
                        const isSelected = selectedItem._selectedModifiers?.includes(mod.id);
                        return (
                          <button
                            key={mod.id}
                            className={`h-14 px-6 rounded-2xl text-base font-bold border-2 transition-all flex items-center justify-center ${
                              isSelected
                                ? 'bg-indigo-550 text-white border-indigo-600 shadow-md'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                            onClick={() => {
                              const current = selectedItem._selectedModifiers || [];
                              const next = current.includes(mod.id)
                                ? current.filter((id: string) => id !== mod.id)
                                : [...current, mod.id];
                              setSelectedItem({
                                ...selectedItem,
                                _selectedModifiers: next,
                              });
                            }}
                          >
                            {mod.name}
                            {mod.price_adjustment > 0 && ` (+₹${(mod.price_adjustment / 100).toFixed(0)})`}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Button */}
              <Button
                className="w-full h-16 text-xl font-black mt-4 rounded-2xl shadow-lg"
                onClick={() => {
                  const selectedMods =
                    selectedItem._selectedModifiers?.map((modId: string) => {
                      const group = selectedItem.modifier_groups?.find((g: any) =>
                        g.modifiers?.some((m: any) => m.id === modId),
                      );
                      const mod = group?.modifiers?.find(
                        (m: any) => m.id === modId,
                      );
                      return mod;
                    }) || [];
                  addToCart(
                    selectedItem,
                    selectedItem._selectedVariant,
                    selectedMods,
                  );
                  setScreen('BROWSING');
                  setSelectedItem(null);
                }}
              >
                Add to Tray — ₹
                {(
                  (selectedItem.base_price +
                    (selectedItem._selectedVariant
                      ? selectedItem.variants.find(
                          (v: any) => v.id === selectedItem._selectedVariant,
                        )?.additional_price || 0
                      : 0) +
                    (selectedItem._selectedModifiers || []).reduce(
                      (s: number, modId: string) => {
                        const group = selectedItem.modifier_groups?.find((g: any) =>
                          g.modifiers?.some((m: any) => m.id === modId),
                        );
                        const mod = group?.modifiers?.find(
                          (m: any) => m.id === modId,
                        );
                        return s + (mod?.price_adjustment || 0);
                      },
                      0,
                    )) /
                  100
                ).toFixed(0)}
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── CART TRAY REVIEW ──────────────────────────────────────────────────────
  if (screen === 'CART') {
    return (
      <div className="h-screen bg-[#F8FAFC] flex flex-col text-[#0F172A]">
        <div className="bg-white border-b px-6 py-4 flex items-center gap-4 shrink-0 shadow-sm">
          <button
            onClick={() => setScreen('BROWSING')}
            className="h-14 w-14 flex items-center justify-center hover:bg-slate-100 rounded-full active:scale-90"
          >
            <ChevronLeft className="w-8 h-8 text-slate-800" />
          </button>
          <h1 className="text-2xl font-black text-slate-900">Your Tray</h1>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {cart.length === 0 ? (
            <div className="text-center py-20">
              <Utensils className="w-24 h-24 mx-auto text-slate-200 mb-6" />
              <h2 className="text-2xl font-bold text-slate-400 mb-6">Your order tray is empty</h2>
              <Button
                onClick={() => setScreen('BROWSING')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold h-14 px-8 rounded-2xl text-lg shadow-md"
              >
                Add Delicious Items
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="bg-white border border-slate-150 rounded-3xl p-5 flex items-center gap-4 shadow-sm"
                >
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-20 h-20 rounded-xl object-cover bg-slate-50 border border-slate-100"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                      <Utensils className="w-8 h-8 text-slate-300" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-extrabold text-slate-800 text-lg leading-snug line-clamp-1">{item.name}</h3>
                    {item.variantId && (
                      <p className="text-sm font-semibold text-slate-400">Variant: Large</p>
                    )}
                    {item.modifiers?.length > 0 && (
                      <p className="text-xs text-indigo-500 font-semibold truncate mt-0.5">
                        +{item.modifiers.map((m: any) => m.name).join(', ')}
                      </p>
                    )}
                    <div className="text-indigo-600 font-black text-lg mt-1">
                      ₹{(item.unitPrice / 100).toFixed(0)}
                    </div>
                  </div>

                  {/* Quantity Stepper (56px touch target compliant height/width) */}
                  <div className="flex items-center gap-2 border border-slate-200 rounded-2xl p-1 bg-slate-50">
                    <button
                      onClick={() => updateCartQty(item.id, -1)}
                      className="h-12 w-12 flex items-center justify-center bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl font-bold active:scale-90 transition-transform"
                    >
                      <Minus className="w-5 h-5" />
                    </button>
                    <span className="w-8 text-center text-lg font-black text-slate-800">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateCartQty(item.id, 1)}
                      className="h-12 w-12 flex items-center justify-center bg-indigo-600 text-white rounded-xl font-bold active:scale-90 transition-transform"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => removeCartItem(item.id)}
                      className="h-12 w-12 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-xl"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div className="bg-white border-t px-6 py-6 shrink-0 shadow-2xl z-10">
            <div className="flex justify-between items-center mb-3">
              <span className="text-slate-500 font-bold text-lg">Subtotal</span>
              <span className="font-extrabold text-slate-800 text-xl">₹{(cartTotalPaise / 100).toFixed(0)}</span>
            </div>
            
            {/* Split CGST and SGST details */}
            <div className="flex justify-between items-center mb-3">
              <span className="text-slate-500 font-semibold text-base">CGST (2.5%)</span>
              <span className="font-bold text-slate-700 text-base">₹{(cgstPaise / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-slate-500 font-semibold text-base">SGST (2.5%)</span>
              <span className="font-bold text-slate-700 text-base">₹{(sgstPaise / 100).toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-center mb-6 pt-3 border-t border-slate-100">
              <span className="font-black text-slate-900 text-2xl">Total to Pay</span>
              <span className="font-black text-indigo-600 text-3xl">
                ₹{((cartTotalPaise + taxTotalPaise) / 100).toFixed(0)}
              </span>
            </div>

            <Button
              className="w-full h-16 text-xl font-black rounded-2xl shadow-lg flex items-center justify-center gap-2"
              onClick={fetchUpsell}
            >
              Continue to Place Order <ArrowRight className="w-6 h-6" />
            </Button>
            <button
              onClick={() => setScreen('BROWSING')}
              className="w-full mt-4 h-12 text-slate-400 font-extrabold hover:text-slate-600 transition-colors text-lg"
            >
              ← Add More Items
            </button>
          </div>
        )}
      </div>
    );
  }

  // ─── SMART UPSELL ─────────────────────────────────────────────────────────
  if (screen === 'UPSELL') {
    return (
      <div className="h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-8 text-[#0F172A]">
        <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mb-6 border border-indigo-100">
          <Sparkles className="w-12 h-12 text-indigo-600 animate-pulse" />
        </div>
        <h2 className="text-4xl font-black mb-2 tracking-tight">Complete your meal</h2>
        <p className="text-slate-500 text-xl mb-12">Guests also frequently added these</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full mb-12">
          {upsellSuggestions.map((item: any) => (
            <button
              key={item.id}
              onClick={() => {
                addToCart(item);
                proceedToNextScreen();
              }}
              className="bg-white rounded-3xl border border-slate-150 p-5 text-left hover:shadow-xl hover:border-indigo-400 transition-all active:scale-95 duration-200 shadow-md flex flex-col"
            >
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="w-full aspect-square rounded-2xl object-cover mb-4 bg-slate-50 border border-slate-100"
                />
              ) : (
                <div className="w-full aspect-square rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-4">
                  <Utensils className="w-16 h-16 text-slate-200" />
                </div>
              )}
              <h3 className="font-extrabold text-slate-800 text-lg line-clamp-1 mb-1">{item.name}</h3>
              <p className="text-indigo-600 font-extrabold text-lg mb-4">
                ₹{(item.base_price / 100).toFixed(0)}
              </p>
              <div className="mt-auto bg-indigo-600 text-white h-12 rounded-xl text-base font-black flex items-center justify-center gap-1 shadow-md hover:bg-indigo-700 transition-colors">
                + Add to Tray
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={proceedToNextScreen}
          className="text-slate-400 hover:text-slate-600 font-black text-xl border-b-2 border-transparent hover:border-slate-500 transition-all"
        >
          No thanks, proceed
        </button>
      </div>
    );
  }

  // ─── LOYALTY LOOKUP & REDEEM [NEW SCREEN] ─────────────────────────────────
  if (screen === 'LOYALTY') {
    return (
      <div className="h-screen bg-[#F8FAFC] flex flex-col text-[#0F172A]">
        <div className="bg-white border-b px-6 py-4 flex items-center gap-4 shrink-0 shadow-sm">
          <button
            onClick={() => setScreen('CART')}
            className="h-14 w-14 flex items-center justify-center hover:bg-slate-100 rounded-full active:scale-90"
          >
            <ChevronLeft className="w-8 h-8 text-slate-800" />
          </button>
          <h1 className="text-2xl font-black text-slate-900">Loyalty Rewards</h1>
        </div>

        <div className="flex-1 flex flex-col md:flex-row p-6 gap-6 items-center justify-center max-w-5xl mx-auto w-full">
          {/* Keypad section */}
          <div className="bg-white border border-slate-150 rounded-[36px] p-6 w-full max-w-md shadow-lg flex flex-col">
            <div className="flex items-center gap-2 mb-4 shrink-0">
              <Smartphone className="w-6 h-6 text-indigo-600" />
              <h2 className="text-xl font-extrabold text-slate-800">Enter Mobile Number</h2>
            </div>
            <Input
              type="text"
              readOnly
              value={loyaltyPhone}
              className="text-center text-3xl font-black h-16 border-2 border-slate-200 rounded-2xl mb-6 tracking-wider bg-slate-50 text-slate-900"
              placeholder="98765 43210"
            />
            <div className="grid grid-cols-3 gap-3 flex-1">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((key) => (
                <button
                  key={key}
                  onClick={() => {
                    if (key === 'C') {
                      setLoyaltyPhone('');
                      setLoyaltyAccount(null);
                      setRedeemPoints(0);
                    } else if (key === '⌫') {
                      setLoyaltyPhone(loyaltyPhone.slice(0, -1));
                    } else if (loyaltyPhone.length < 10) {
                      setLoyaltyPhone(loyaltyPhone + key);
                    }
                  }}
                  className="h-14 rounded-xl text-2xl font-extrabold bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 transition-all flex items-center justify-center"
                >
                  {key}
                </button>
              ))}
            </div>
            <button
              onClick={handleLoyaltyLookup}
              disabled={loyaltyLoading || loyaltyPhone.length !== 10}
              className="w-full h-16 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xl font-black shadow-lg mt-4 flex items-center justify-center gap-2 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
            >
              {loyaltyLoading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  Find Account <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>

          {/* Account status & Points redemption screen */}
          <div className="bg-white border border-slate-150 rounded-[36px] p-8 w-full max-w-md shadow-lg flex flex-col min-h-[420px] justify-between">
            <div>
              <div className="flex items-center gap-2 mb-6">
                <Gift className="w-7 h-7 text-indigo-600 animate-bounce" />
                <h2 className="text-2xl font-black text-slate-800">Your Rewards</h2>
              </div>

              {loyaltyMessage && (
                <div className="bg-indigo-50/50 border border-indigo-100 text-indigo-800 px-4 py-3 rounded-2xl text-base font-bold mb-6 text-center">
                  {loyaltyMessage}
                </div>
              )}

              {loyaltyAccount ? (
                <div className="space-y-6">
                  <div className="flex justify-between items-center bg-slate-50 border border-slate-100 p-4 rounded-2xl">
                    <div>
                      <div className="text-sm font-bold text-slate-400">Available Points</div>
                      <div className="text-3xl font-black text-indigo-600 mt-1">{loyaltyAccount.points}</div>
                    </div>
                    {loyaltyAccount.points > 0 && redeemPoints === 0 && (
                      <button
                        onClick={handleRedeemPoints}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 h-12 rounded-xl text-sm font-black shadow-md transition-all active:scale-95"
                      >
                        Redeem Points
                      </button>
                    )}
                  </div>

                  {redeemPoints > 0 && (
                    <div className="bg-green-50 border border-green-200 p-4 rounded-2xl flex items-center gap-3">
                      <Smile className="w-8 h-8 text-green-600 shrink-0" />
                      <div>
                        <div className="text-sm font-bold text-green-800">Points Applied!</div>
                        <p className="text-xs text-green-600 font-semibold mt-0.5">
                          You saved ₹{redeemPoints} on this order.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <Smartphone className="w-16 h-16 mx-auto mb-4 text-slate-200" />
                  <p className="font-extrabold text-lg">Enter phone number to earn points & check stamps!</p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <Button
                className="w-full h-16 text-xl font-black rounded-2xl shadow-lg"
                onClick={() => setScreen('PAYMENT')}
              >
                Proceed to Payment <ArrowRight className="w-6 h-6 ml-2" />
              </Button>
              <button
                onClick={() => {
                  setRedeemPoints(0);
                  setScreen('PAYMENT');
                }}
                className="w-full h-10 text-slate-400 font-extrabold hover:text-slate-600 transition-colors text-base"
              >
                Skip Loyalty
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── PAYMENT SCREEN ───────────────────────────────────────────────────────
  if (screen === 'PAYMENT') {
    return (
      <div className="h-screen bg-[#F8FAFC] flex flex-col text-[#0F172A]">
        <div className="bg-white border-b px-6 py-4 flex items-center gap-4 shrink-0 shadow-sm">
          <button
            onClick={() => setScreen(terminal?.loyaltyLookupEnabled ? 'LOYALTY' : 'CART')}
            className="h-14 w-14 flex items-center justify-center hover:bg-slate-100 rounded-full active:scale-90"
          >
            <ChevronLeft className="w-8 h-8 text-slate-800" />
          </button>
          <h1 className="text-2xl font-black text-slate-900">Select Payment Method</h1>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-8 max-w-md mx-auto w-full">
          {paymentLoading ? (
            <div className="text-center">
              {paymentMethod === 'UPI_QR' && upiQrString ? (
                <div className="bg-white p-8 border-2 border-indigo-200 rounded-[36px] shadow-xl flex flex-col items-center">
                  <div className="w-48 h-48 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center mb-6">
                    <QrCode className="w-36 h-36 text-slate-800" />
                  </div>
                  <h3 className="text-2xl font-black mb-1">Scan UPI QR Code</h3>
                  <p className="text-slate-500 font-semibold text-sm text-center mb-4">
                    Open Swiggy, Paytm, GPay or any UPI app to pay
                  </p>
                  <div className="text-3xl font-black text-indigo-600 mb-6">
                    ₹{(grandTotalPaise / 100).toFixed(0)}
                  </div>
                  <div className="flex items-center gap-2 text-indigo-600 bg-indigo-50 border border-indigo-100 px-4 py-2 rounded-xl font-bold animate-pulse text-sm">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Waiting for server confirmation...</span>
                  </div>
                </div>
              ) : (
                <div className="bg-white p-8 border-2 border-indigo-200 rounded-[36px] shadow-xl text-center">
                  <Loader2 className="w-16 h-16 animate-spin text-indigo-600 mx-auto mb-4" />
                  <h2 className="text-2xl font-black mb-2 text-slate-800">Processing Payment...</h2>
                  <p className="text-slate-500 font-semibold">Please follow instructions on card terminal</p>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="text-center mb-10">
                <div className="text-base font-extrabold text-slate-400 mb-1">Grand Total (incl. GST)</div>
                {discountPaise > 0 && (
                  <div className="text-sm font-bold text-green-600 mb-1">
                    Loyalty Discount Applied: -₹{(discountPaise / 100).toFixed(0)}
                  </div>
                )}
                <div className="text-6xl font-black text-slate-900 tracking-tight">
                  ₹{(grandTotalPaise / 100).toFixed(0)}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 w-full">
                {terminal?.paymentModes?.includes('UPI_QR') && (
                  <button
                    onClick={() => handlePayment('UPI_QR')}
                    className="bg-white border-2 border-slate-200 rounded-3xl p-6 flex items-center gap-5 hover:border-indigo-600 hover:bg-indigo-50/20 transition-all shadow-md active:scale-95 h-24"
                  >
                    <div className="w-14 h-14 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
                      <QrCode className="w-8 h-8 text-indigo-600" />
                    </div>
                    <div className="text-left">
                      <div className="text-xl font-extrabold text-slate-800">Instant UPI QR Code</div>
                      <div className="text-sm font-semibold text-slate-400">Scan & Pay via phone</div>
                    </div>
                  </button>
                )}
                {terminal?.paymentModes?.includes('CARD_TAP') && (
                  <button
                    onClick={() => handlePayment('CARD_TAP')}
                    className="bg-white border-2 border-slate-200 rounded-3xl p-6 flex items-center gap-5 hover:border-indigo-600 hover:bg-indigo-50/20 transition-all shadow-md active:scale-95 h-24"
                  >
                    <div className="w-14 h-14 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
                      <CreditCard className="w-8 h-8 text-indigo-600" />
                    </div>
                    <div className="text-left">
                      <div className="text-xl font-extrabold text-slate-800">Card Tap / Insert</div>
                      <div className="text-sm font-semibold text-slate-400">Credit, Debit, or Apple/Google Pay</div>
                    </div>
                  </button>
                )}
                {terminal?.paymentModes?.includes('PAY_AT_COUNTER') && (
                  <button
                    onClick={() => handlePayment('PAY_AT_COUNTER')}
                    className="bg-white border-2 border-slate-200 rounded-3xl p-6 flex items-center gap-5 hover:border-indigo-600 hover:bg-indigo-50/20 transition-all shadow-md active:scale-95 h-24"
                  >
                    <div className="w-14 h-14 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
                      <Banknote className="w-8 h-8 text-indigo-600" />
                    </div>
                    <div className="text-left">
                      <div className="text-xl font-extrabold text-slate-800">Pay Cash at Counter</div>
                      <div className="text-sm font-semibold text-slate-400">Receive token, pay cashier</div>
                    </div>
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // ─── ORDER CONFIRMED SUCCESS ──────────────────────────────────────────────
  if (screen === 'CONFIRMED') {
    return (
      <div className="h-screen bg-green-50/60 flex flex-col items-center justify-center p-8 text-center text-[#0F172A]">
        <div className="w-28 h-28 bg-green-100 rounded-full flex items-center justify-center mb-6 border-4 border-white shadow-lg animate-bounce">
          <CheckCircle className="w-16 h-16 text-green-600" />
        </div>
        <h1 className="text-5xl font-black text-slate-900 mb-3 tracking-tight">Order Confirmed!</h1>
        <p className="text-slate-600 text-xl mb-10 max-w-md">
          {serviceType === 'DINE_IN'
            ? 'Please proceed to your table. We will serve you shortly!'
            : 'Your order is being fresh prepared. Watch the CFD screens for pick-up!'}
        </p>

        <div className="bg-white rounded-[36px] border-4 border-green-200 p-8 mb-8 shadow-xl max-w-sm w-full">
          <div className="text-base font-extrabold text-slate-400 mb-1">Your Token Number</div>
          <div className="text-7xl font-black text-green-700 tracking-tight">{kotNumber}</div>
        </div>

        <div className="flex items-center gap-2 text-slate-600 mb-8 bg-white border border-slate-150 px-6 h-14 rounded-2xl shadow-sm">
          <Clock className="w-6 h-6 text-indigo-600" />
          <span className="text-lg font-bold">
            Estimated wait: ~{estimatedWait} minutes
          </span>
        </div>

        {/* WhatsApp digital receipt input layout */}
        {terminal?.whatsappReceiptEnabled && (
          <div className="bg-white border border-slate-150 rounded-[32px] p-6 max-w-md w-full shadow-lg mb-8 text-left">
            <h3 className="font-extrabold text-lg text-slate-800 flex items-center gap-2 mb-2">
              <Smartphone className="w-5 h-5 text-indigo-600" /> Get Receipt on WhatsApp
            </h3>
            <p className="text-xs text-slate-400 font-semibold mb-4">Enter 10-digit number to receive details instantly</p>
            {whatsappStatus === 'SENT' ? (
              <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-2xl font-bold text-center text-sm">
                Receipt dispatched successfully! 📱 Check your phone.
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  type="text"
                  maxLength={10}
                  placeholder="98765 43210"
                  value={whatsappPhone}
                  onChange={(e) => setWhatsappPhone(e.target.value.replace(/\D/g, ''))}
                  className="h-14 text-lg font-bold border-2 border-slate-200 rounded-xl flex-1 px-4 tracking-wider text-slate-800"
                />
                <button
                  onClick={sendWhatsAppReceipt}
                  disabled={whatsappPhone.length !== 10 || whatsappStatus === 'SENDING'}
                  className="h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-6 rounded-xl shadow-md active:scale-95 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
                >
                  {whatsappStatus === 'SENDING' ? 'Sending...' : 'Send'}
                </button>
              </div>
            )}
          </div>
        )}

        <p className="text-sm font-semibold text-slate-400 mt-4">
          This terminal will reset back to the home screen in a few seconds...
        </p>
      </div>
    );
  }

  return null;
}
