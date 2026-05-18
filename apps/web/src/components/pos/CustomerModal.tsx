'use client';

import { useState, useEffect } from 'react';
import {
  X,
  Search,
  UserPlus,
  Phone,
  User,
  Star,
  History,
  Loader2,
  Check,
  ShoppingBag,
  Ticket,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCartStore } from '@/store/cart';
import { API_BASE } from '@/lib/api';
import { getAuthToken } from '@respos/utils';

interface CustomerModalProps {
  open: boolean;
  onClose: () => void;
}

const API = API_BASE;

function getAuthHeader(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function CustomerModal({ open, onClose }: CustomerModalProps) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    mobile: '',
    email: '',
  });
  const [orderHistory, setOrderHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [loyaltyDetails, setLoyaltyDetails] = useState<any>(null);
  const [loyaltyLoading, setLoyaltyLoading] = useState(false);

  const {
    customer: selectedCustomer,
    setCustomer,
    setRupeesPerPoint,
    hydrateCart,
  } = useCartStore();

  const fetchLoyaltyConfig = async () => {
    try {
      const res = await fetch(`${API}/loyalty/config`, {
        headers: getAuthHeader(),
      });
      if (res.ok) {
        const config = await res.json();
        setRupeesPerPoint(config.rupees_per_point || 0);
      }
    } catch (e) {
      console.error('Failed to fetch loyalty config', e);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search.length >= 3) {
        handleSearch();
      } else {
        setResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/customers/search?q=${search}`, {
        headers: getAuthHeader(),
      });
      if (res.ok) {
        const data = await res.json();
        setResults(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderHistory = async (phone: string) => {
    setHistoryLoading(true);
    try {
      const res = await fetch(
        `${API}/customers/${encodeURIComponent(phone)}/order-history`,
        { headers: getAuthHeader() },
      );
      if (res.ok) {
        const data = await res.json();
        setOrderHistory(data.slice(0, 3));
      }
    } catch (e) {
      console.error('Failed to fetch order history', e);
    } finally {
      setHistoryLoading(false);
    }
  };

  const fetchLoyaltyDetails = async (phone: string) => {
    setLoyaltyLoading(true);
    try {
      const res = await fetch(
        `${API}/loyalty/${encodeURIComponent(phone)}`,
        { headers: getAuthHeader() },
      );
      if (res.ok) {
        const data = await res.json();
        setLoyaltyDetails(data);
      }
    } catch (e) {
      console.error('Failed to fetch loyalty details', e);
    } finally {
      setLoyaltyLoading(false);
    }
  };

  const syncCustomerWithOrder = async (customerId: string) => {
    const activeOrderId = useCartStore.getState().active_order_id;
    if (!activeOrderId) return;

    try {
      await fetch(`${API}/orders/${activeOrderId}/customer`, {
        method: 'PATCH',
        headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer_id: customerId }),
      });
    } catch (e) {
      console.error('Failed to sync customer with order', e);
    }
  };

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API}/customers`, {
        method: 'POST',
        headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(newCustomer),
      });
      if (res.ok) {
        const data = await res.json();
        setCustomer({
          id: data.id,
          name: data.name,
          mobile: data.mobile,
          points: data.loyalty_points,
        });
        await fetchLoyaltyConfig();
        await syncCustomerWithOrder(data.id);
        onClose();
      }
    } catch (e) {
      alert('Failed to add customer');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 w-full max-w-lg border-2 border-slate-700 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b-2 border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
              <User className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-100 tracking-tight uppercase">
                Customer Lookup
              </h2>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                Attach guest for loyalty points
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-10 w-10 bg-slate-800 border-2 border-slate-700 flex items-center justify-center active:bg-slate-700 active:text-slate-100 active:scale-[0.92] transition-all text-slate-400"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {!isAdding ? (
            <div className="space-y-6">
              {/* Search Box */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search by phone or name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  autoFocus
                  className="w-full bg-slate-950 border-2 border-slate-700 pl-12 pr-10 py-4 text-base font-bold outline-none focus:border-cyan-500 transition-all text-slate-100 placeholder:text-slate-600 font-mono uppercase tracking-wider"
                />
                {loading && (
                  <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-cyan-400" />
                )}
              </div>

              {/* Results */}
              <div className="space-y-2 max-h-[300px] overflow-y-auto scrollbar-thin">
                {results.length > 0 ? (
                  results.map((c) => (
                    <button
                      key={c.id}
                      onClick={async () => {
                        setCustomer({
                          id: c.id,
                          name: c.name,
                          mobile: c.mobile,
                          points: c.loyalty_points,
                        });
                        await fetchLoyaltyConfig();
                        await syncCustomerWithOrder(c.id);
                        await fetchOrderHistory(c.mobile);
                        await fetchLoyaltyDetails(c.mobile);
                      }}
                      className={cn(
                        'w-full flex items-center justify-between p-4 border-2 active:scale-[0.98] transition-transform duration-75',
                        selectedCustomer?.id === c.id
                          ? 'bg-cyan-500/10 border-cyan-500/40'
                          : 'bg-slate-800 border-slate-700 active:border-slate-600 active:bg-slate-700',
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-slate-700 flex items-center justify-center font-black text-cyan-400 border-2 border-slate-600">
                          {c.name[0]}
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-slate-100 tracking-tight uppercase">
                            {c.name}
                          </p>
                          <p className="text-xs text-slate-500 flex items-center gap-1 font-mono tracking-tight">
                            <Phone className="h-3 w-3" /> {c.mobile}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-xs font-black text-cyan-400 uppercase tracking-[0.2em]">
                            {c.tier}
                          </p>
                          <p
                            className="text-xs font-bold text-slate-400 flex items-center justify-end gap-1 font-mono tracking-tight"
                            style={{ fontVariantNumeric: 'tabular-nums' }}
                          >
                            <Star className="h-3 w-3 text-amber-400 fill-amber-400" />{' '}
                            {c.loyalty_points}
                          </p>
                        </div>
                        {selectedCustomer?.id === c.id && (
                          <Check className="h-5 w-5 text-cyan-400" />
                        )}
                      </div>
                    </button>
                  ))
                ) : search.length >= 3 && !loading ? (
                  <div className="py-8 text-center bg-slate-800 border-2 border-dashed border-slate-700">
                    <p className="text-slate-500 text-sm font-bold uppercase tracking-wider">
                      No customer found with &quot;{search}&quot;
                    </p>
                    <button
                      onClick={() => {
                        setNewCustomer({
                          ...newCustomer,
                          mobile: search.match(/^\d+$/) ? search : '',
                        });
                        setIsAdding(true);
                      }}
                      className="mt-3 text-cyan-400 font-black text-sm active:text-cyan-300 flex items-center gap-2 mx-auto uppercase tracking-wider active:scale-[0.97] transition-all"
                    >
                      <UserPlus className="h-4 w-4" /> Add as new customer
                    </button>
                  </div>
                ) : (
                  <div className="py-12 text-center text-slate-500 flex flex-col items-center gap-3">
                    <UserPlus className="h-10 w-10 text-slate-600" />
                    <p className="text-sm font-bold uppercase tracking-wider">
                      Type 3+ digits to search guests
                    </p>
                  </div>
                )}
              </div>

              {/* MOD-07: One-Tap Re-Order */}
              {selectedCustomer && (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase tracking-[0.2em]">
                    <History className="h-4 w-4" />
                    Re-order
                  </div>
                  {historyLoading ? (
                    <div className="flex items-center gap-2 text-slate-500 text-sm">
                      <Loader2 className="h-4 w-4 animate-spin" /> Loading history...
                    </div>
                  ) : orderHistory.length > 0 ? (
                    <div className="grid grid-cols-1 gap-2">
                      {orderHistory.map((h) => (
                        <button
                          key={h.id}
                          onClick={async () => {
                            try {
                              const res = await fetch(`${API}/orders/load-template`, {
                                method: 'POST',
                                headers: {
                                  ...getAuthHeader(),
                                  'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({ history_id: h.id }),
                              });
                              if (res.ok) {
                                const data = await res.json();
                                if (data.items && data.items.length > 0) {
                                  hydrateCart(data.items);
                                  onClose();
                                }
                                if (data.skipped && data.skipped.length > 0) {
                                  alert(
                                    `Skipped unavailable items: ${data.skipped.join(', ')}`
                                  );
                                }
                              }
                            } catch (e) {
                              console.error('Failed to load template', e);
                            }
                          }}
                          className="flex items-center justify-between p-3 border-2 border-slate-700 bg-slate-800 active:border-cyan-500 active:bg-slate-700 transition-all text-left"
                        >
                          <div className="flex items-center gap-3">
                            <ShoppingBag className="h-4 w-4 text-cyan-400" />
                            <div>
                              <p className="text-sm font-bold text-slate-100">
                                {h.snapshot?.items?.length || 0} items
                              </p>
                              <p className="text-xs text-slate-500">
                                {new Date(h.settledAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-cyan-400">
                              ₹{Math.round((h.snapshot?.total || 0) / 100)}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">
                      No recent settled orders found.
                    </p>
                  )}
                </div>
              )}

              {/* MOD-02: Digital Stamp Cards */}
              {selectedCustomer && (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase tracking-[0.2em]">
                    <Ticket className="h-4 w-4" />
                    Stamp Cards
                  </div>
                  {loyaltyLoading ? (
                    <div className="flex items-center gap-2 text-slate-500 text-sm">
                      <Loader2 className="h-4 w-4 animate-spin" /> Loading stamps...
                    </div>
                  ) : loyaltyDetails?.stampCards?.length > 0 ? (
                    <div className="space-y-3">
                      {loyaltyDetails.stampCards.map((sc: any) => (
                        <div
                          key={sc.id}
                          className="p-3 border-2 border-slate-700 bg-slate-800"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-bold text-slate-100">
                              {sc.name}
                            </span>
                            <span className="text-xs font-bold text-cyan-400">
                              {sc.count}/{sc.goal}
                            </span>
                          </div>
                          <div className="flex gap-1.5 flex-wrap">
                            {Array.from({ length: sc.goal }).map((_, i) => (
                              <div
                                key={i}
                                className={`h-6 w-6 rounded-full border-2 flex items-center justify-center ${
                                  i < sc.count
                                    ? 'bg-cyan-500 border-cyan-400'
                                    : 'border-slate-600 bg-slate-900'
                                }`}
                              >
                                {i < sc.count && (
                                  <Check className="h-3 w-3 text-slate-900" />
                                )}
                              </div>
                            ))}
                          </div>
                          {sc.completed && (
                            <div className="mt-2 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-1.5 rounded text-center">
                              Reward unlocked: {sc.rewardDescription}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">
                      No active stamp cards.
                    </p>
                  )}
                </div>
              )}

              {selectedCustomer && (
                <div className="pt-4 flex gap-3">
                  <button
                    onClick={() => onClose()}
                    className="flex-1 px-4 py-3 border-2 border-cyan-400 bg-cyan-500 text-slate-900 font-black active:bg-cyan-400 active:scale-[0.97] transition-all uppercase tracking-wider text-xs"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Add New Form */
            <form onSubmit={handleAddCustomer} className="space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] ml-1">
                    Guest Name *
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="Full Name"
                    value={newCustomer.name}
                    onChange={(e) =>
                      setNewCustomer({ ...newCustomer, name: e.target.value })
                    }
                    className="w-full mt-1.5 bg-slate-950 border-2 border-slate-700 px-4 py-3 outline-none focus:border-cyan-500 transition-all text-slate-100 font-bold tracking-tight"
                  />
                </div>
                <div>
                  <label className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] ml-1">
                    Mobile Number *
                  </label>
                  <input
                    required
                    type="tel"
                    placeholder="10-digit mobile"
                    value={newCustomer.mobile}
                    onChange={(e) =>
                      setNewCustomer({ ...newCustomer, mobile: e.target.value })
                    }
                    className="w-full mt-1.5 bg-slate-950 border-2 border-slate-700 px-4 py-3 outline-none focus:border-cyan-500 transition-all text-slate-100 font-mono tracking-tight"
                  />
                </div>
                <div>
                  <label className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] ml-1">
                    Email (Optional)
                  </label>
                  <input
                    type="email"
                    placeholder="email@example.com"
                    value={newCustomer.email}
                    onChange={(e) =>
                      setNewCustomer({ ...newCustomer, email: e.target.value })
                    }
                    className="w-full mt-1.5 bg-slate-950 border-2 border-slate-700 px-4 py-3 outline-none focus:border-cyan-500 transition-all text-slate-100 font-mono tracking-tight placeholder:text-slate-600"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="flex-1 px-4 py-3 border-2 border-slate-700 font-black text-slate-300 active:bg-slate-800 active:text-slate-100 transition-all uppercase tracking-wider text-xs"
                >
                  Back to Search
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-3 border-2 border-cyan-400 bg-cyan-500 text-slate-900 font-black active:bg-cyan-400 active:scale-[0.97] transition-all flex items-center justify-center gap-2 uppercase tracking-wider text-xs"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Check className="h-5 w-5" />
                  )}
                  Register Guest
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
