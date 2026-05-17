'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ShoppingCart,
  Phone,
  MapPin,
  Plus,
  Minus,
  CheckCircle2,
  ArrowLeft,
} from 'lucide-react';
import { API_BASE } from '@/lib/api';

export default function StorefrontPage({
  params,
}: {
  params: { slug: string };
}) {
  const [storefront, setStorefront] = useState<any>(null);
  const [menu, setMenu] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [cart, setCart] = useState<
    { id: string; name: string; qty: number; price: number }[]
  >([]);
  const [checkoutMode, setCheckoutMode] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [ordered, setOrdered] = useState(false);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const res = await fetch(`${API_BASE}/storefront/${params.slug}/menu`);
        if (res.ok) {
          const data = await res.json();
          setStorefront(data);
          setMenu(data.menu);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchMenu();
  }, [params.slug]);

  const addToCart = (item: any) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, qty: i.qty + 1 } : i,
        );
      }
      return [
        ...prev,
        { id: item.id, name: item.name, price: item.base_price, qty: 1 },
      ];
    });
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === id);
      if (existing && existing.qty > 1) {
        return prev.map((i) => (i.id === id ? { ...i, qty: i.qty - 1 } : i));
      }
      return prev.filter((i) => i.id !== id);
    });
  };

  const subtotal = cart.reduce((acc, item) => acc + item.qty * item.price, 0);

  const handleCheckout = async () => {
    if (name.length < 2 || phone.length < 10 || address.length < 5) return;

    try {
      const payload = {
        customerName: name,
        customerPhone: phone,
        deliveryAddress: address,
        items: cart.map((i) => ({ itemId: i.id, quantity: i.qty })),
      };

      const res = await fetch(`${API_BASE}/storefront/${params.slug}/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        // Redirect to tracking page
        if (data.trackingUrl) {
          window.location.href = data.trackingUrl.replace('/storefront', '/order');
        } else {
          setOrdered(true);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white">
        Loading Menu...
      </div>
    );
  }

  if (!storefront) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white">
        Store is currently offline.
      </div>
    );
  }

  if (ordered) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-6">
        <Card className="max-w-md w-full text-center py-10 bg-zinc-900 border-zinc-800 text-white">
          <CardHeader>
            <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
            <CardTitle className="text-2xl text-emerald-500">
              Order Placed!
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Your food is being prepared.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-6 text-zinc-300">
              You will receive an SMS with tracking details shortly.
            </p>
            <Button
              variant="outline"
              className="text-black"
              onClick={() => {
                setOrdered(false);
                setCart([]);
                setCheckoutMode(false);
              }}
            >
              Place Another Order
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (checkoutMode) {
    return (
      <div className="min-h-screen bg-zinc-950 p-6">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => setCheckoutMode(false)}
            className="text-zinc-400 hover:text-white flex items-center gap-2 mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Menu
          </button>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h1 className="text-3xl font-bold tracking-tight text-white">
                Checkout
              </h1>
              <Card className="bg-zinc-900 border-zinc-800 text-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" /> Your Order
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-center border-b border-zinc-800 pb-2"
                    >
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-zinc-400">Qty: {item.qty}</p>
                      </div>
                      <p className="font-medium">
                        ₹{((item.qty * item.price) / 100).toFixed(2)}
                      </p>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-4 text-lg font-bold">
                    <p>Total to Pay</p>
                    <p className="text-emerald-500">
                      ₹{(subtotal / 100).toFixed(2)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="bg-zinc-900 border-zinc-800 text-white">
                <CardHeader>
                  <CardTitle>Delivery Details</CardTitle>
                  <CardDescription className="text-zinc-400">
                    Enter your phone and address for delivery.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      Your Name
                    </label>
                    <Input
                      placeholder="e.g. John Doe"
                      value={name}
                      className="bg-zinc-800 border-zinc-700 text-white"
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Phone className="h-4 w-4" /> Phone Number
                    </label>
                    <Input
                      placeholder="10-digit mobile number"
                      type="tel"
                      value={phone}
                      className="bg-zinc-800 border-zinc-700 text-white"
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <MapPin className="h-4 w-4" /> Delivery Address
                    </label>
                    <Input
                      placeholder="Complete flat/house no. and landmark"
                      value={address}
                      className="bg-zinc-800 border-zinc-700 text-white"
                      onChange={(e) => setAddress(e.target.value)}
                    />
                  </div>
                  <Button
                    className="w-full h-12 text-lg mt-4 bg-emerald-600 hover:bg-emerald-700 text-white"
                    disabled={name.length < 2 || phone.length < 10 || address.length < 5}
                    onClick={handleCheckout}
                  >
                    Place Order (₹{(subtotal / 100).toFixed(2)})
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 pb-24 text-white">
      {/* Header */}
      <div className="bg-zinc-900 border-b border-zinc-800 py-8 px-6 text-center sticky top-0 z-10">
        <h1 className="text-3xl font-black text-emerald-500 capitalize">
          {storefront.restaurantName || params.slug.replace('-', ' ')}
        </h1>
        <p className="text-zinc-400 mt-2">
          {storefront.description || 'Order online for quick delivery'}
        </p>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-12">
        {menu.map((category: any) => (
          <div key={category.id} className="space-y-4">
            <h2 className="text-2xl font-bold border-b border-zinc-800 pb-2">
              {category.name}
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {category.items.map((item: any) => {
                const cartItem = cart.find((i) => i.id === item.id);
                return (
                  <div
                    key={item.id}
                    className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex justify-between gap-4"
                  >
                    <div>
                      <h3 className="font-bold">{item.name}</h3>
                      <p className="text-emerald-500 font-semibold mt-1">
                        ₹{(item.base_price / 100).toFixed(2)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {cartItem ? (
                        <div className="flex items-center gap-3 bg-zinc-800 rounded-lg p-1">
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="w-8 h-8 flex items-center justify-center rounded bg-zinc-700 hover:bg-zinc-600"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="font-bold w-4 text-center">
                            {cartItem.qty}
                          </span>
                          <button
                            onClick={() => addToCart(item)}
                            className="w-8 h-8 flex items-center justify-center rounded bg-emerald-600 hover:bg-emerald-500 text-white"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => addToCart(item)}
                          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg font-semibold text-sm transition-colors border border-zinc-700"
                        >
                          ADD
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Floating Cart Bar */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-zinc-900 border-t border-zinc-800">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <div>
              <p className="text-zinc-400 text-sm">
                {cart.reduce((a, b) => a + b.qty, 0)} items
              </p>
              <p className="text-xl font-bold text-emerald-500">
                ₹{(subtotal / 100).toFixed(2)}
              </p>
            </div>
            <Button
              onClick={() => setCheckoutMode(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 py-6 rounded-xl"
            >
              Proceed to Checkout
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
