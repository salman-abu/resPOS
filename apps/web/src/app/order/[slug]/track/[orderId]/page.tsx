'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { CheckCircle2, Clock, ChefHat, Bike, Receipt } from 'lucide-react';
import { API_BASE } from '@/lib/api';

const STATUS_STEPS = [
  { status: 'PLACED', label: 'Order Placed', icon: Receipt },
  { status: 'PREPARING', label: 'Preparing', icon: ChefHat },
  { status: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', icon: Bike },
  { status: 'DELIVERED', label: 'Delivered', icon: CheckCircle2 },
];

export default function OrderTrackingPage({
  params,
}: {
  params: { slug: string; orderId: string };
}) {
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await fetch(
          `${API_BASE}/storefront/${params.slug}/track/${params.orderId}`,
        );
        if (res.ok) {
          const data = await res.json();
          setOrder(data);
        } else {
          setError(true);
        }
      } catch (e) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
    const interval = setInterval(fetchOrder, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, [params.slug, params.orderId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white">
        Loading Tracking Details...
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white">
        Order not found or tracking is unavailable.
      </div>
    );
  }

  const currentStatusIndex = STATUS_STEPS.findIndex(
    (s) => s.status === order.trackingStatus,
  );

  return (
    <div className="min-h-screen bg-zinc-950 p-6 text-white pb-24">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-black text-emerald-500 mb-2">
            Track Order
          </h1>
          <p className="text-zinc-400">
            Order #{order.orderId.split('-')[0].toUpperCase()}
          </p>
        </div>

        <Card className="bg-zinc-900 border-zinc-800 text-white">
          <CardHeader>
            <CardTitle>Delivery Status</CardTitle>
            <CardDescription className="text-zinc-400">
              Live updates on your order.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="relative border-l border-zinc-700 ml-4 space-y-8">
              {STATUS_STEPS.map((step, idx) => {
                const Icon = step.icon;
                const isCompleted = idx <= currentStatusIndex;
                const isCurrent = idx === currentStatusIndex;

                return (
                  <div
                    key={step.status}
                    className="relative flex items-center gap-4 pl-8"
                  >
                    <div
                      className={`absolute -left-[17px] w-8 h-8 rounded-full flex items-center justify-center border-4 border-zinc-900 ${
                        isCompleted
                          ? 'bg-emerald-500 text-white'
                          : 'bg-zinc-800 text-zinc-500'
                      } ${isCurrent ? 'ring-2 ring-emerald-500/50' : ''}`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p
                        className={`font-bold ${
                          isCompleted ? 'text-white' : 'text-zinc-500'
                        }`}
                      >
                        {step.label}
                      </p>
                      {isCurrent && (
                        <p className="text-sm text-emerald-500">
                          In Progress...
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 text-white">
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {order.items.map((item: any, i: number) => (
                <div
                  key={i}
                  className="flex justify-between border-b border-zinc-800 pb-2"
                >
                  <p>
                    {item.quantity}x {item.name}
                  </p>
                  <p>₹{((item.quantity * item.price) / 100).toFixed(2)}</p>
                </div>
              ))}
            </div>
            <div className="pt-2">
              <p className="text-sm text-zinc-400">Delivering to:</p>
              <p className="font-semibold">{order.customerName}</p>
              <p className="text-zinc-300 text-sm mt-1">
                {order.deliveryAddress}
              </p>
              <div className="mt-4 p-3 bg-zinc-800 rounded-lg flex gap-3 items-center">
                <Clock className="text-emerald-500 w-5 h-5" />
                <p className="text-sm">
                  Payment Mode:{' '}
                  <strong className="text-emerald-500">Cash on Delivery</strong>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
