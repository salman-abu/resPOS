'use client';

import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { API_BASE } from '@/lib/api';
import { getAuthToken } from '@respos/utils';
import { Clock, UtensilsCrossed, CheckCircle2 } from 'lucide-react';

interface CFDOrder {
  id: string;
  status: string;
  queue_token_number: number;
  order_name?: string;
}

export default function CFDPage() {
  const [preparing, setPreparing] = useState<CFDOrder[]>([]);
  const [ready, setReady] = useState<CFDOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const tenantId = localStorage.getItem('device_tenant_id');
    const token = getAuthToken();

    if (!tenantId || !token) {
      setLoading(false);
      return;
    }

    const fetchOrders = async () => {
      try {
        const res = await fetch(`${API_BASE}/orders/cfd`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data: CFDOrder[] = await res.json();
          setPreparing(
            data.filter((o) => ['PLACED', 'PREPARING'].includes(o.status)),
          );
          setReady(data.filter((o) => o.status === 'READY'));
        }
      } catch (e) {
        console.error('CFD Fetch Error:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();

    const socket = io(`${API_BASE.replace('/api', '')}/kds`, {
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      socket.emit('subscribe_cfd', { tenantId });
    });

    socket.on(
      'order:update',
      (payload: {
        id: string;
        status: string;
        token?: number;
        name?: string;
      }) => {
        if (payload.status === 'SERVED' || payload.status === 'VOID') {
          setPreparing((prev) => prev.filter((o) => o.id !== payload.id));
          setReady((prev) => prev.filter((o) => o.id !== payload.id));
        } else if (payload.status === 'READY') {
          setPreparing((prev) => prev.filter((o) => o.id !== payload.id));
          setReady((prev) => {
            if (prev.find((o) => o.id === payload.id)) return prev;
            return [
              ...prev,
              {
                id: payload.id,
                status: payload.status,
                queue_token_number: payload.token!,
                order_name: payload.name,
              },
            ];
          });
        } else {
          setPreparing((prev) => {
            if (prev.find((o) => o.id === payload.id)) {
              return prev.map((o) =>
                o.id === payload.id ? { ...o, status: payload.status } : o,
              );
            }
            if (!payload.token) return prev;
            return [
              ...prev,
              {
                id: payload.id,
                status: payload.status,
                queue_token_number: payload.token,
                order_name: payload.name,
              },
            ];
          });
        }
      },
    );

    return () => {
      socket.disconnect();
    };
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-b-2 border-cyan-400"></div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-slate-950 text-white overflow-hidden flex flex-col font-sans">
      {/* Header */}
      <div className="h-24 bg-slate-950 border-b-2 border-slate-800 flex items-center px-12 justify-between">
        <div className="flex items-center gap-6">
          <div className="h-14 w-14 bg-cyan-500 flex items-center justify-center border-2 border-cyan-400">
            <UtensilsCrossed className="h-8 w-8 text-slate-900" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight uppercase">
              Order Status
            </h1>
            <p className="text-xs text-slate-500 font-bold tracking-[0.2em] uppercase mt-1">
              Live Updates • Cafe Mode
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-3 text-slate-400">
            <Clock className="h-6 w-6" />
            <span className="text-3xl font-black tabular-nums font-mono tracking-tight">
              {new Date().toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="flex-1 flex overflow-hidden">
        {/* Preparing Column */}
        <div className="flex-[4] flex flex-col border-r-2 border-slate-800 bg-slate-950/50">
          <div className="h-20 flex items-center px-10 gap-4 bg-amber-500/10 border-b-2 border-amber-500/20">
            <div className="h-3 w-3 bg-amber-500 animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
            <h2 className="text-2xl font-black text-amber-500 uppercase tracking-[0.15em]">
              Preparing
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-10 grid grid-cols-2 xl:grid-cols-3 gap-4 content-start scrollbar-none">
            {preparing.map((order) => (
              <div
                key={order.id}
                className="bg-slate-900/40 border-2 border-slate-800/50 p-8 flex flex-col items-center justify-center gap-2 transition-all active:bg-slate-900/60 active:scale-[0.98] group"
              >
                <span
                  className="text-6xl font-black text-slate-400 group-hover:text-slate-200 transition-colors font-mono"
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                >
                  {order.queue_token_number}
                </span>
                {order.order_name && (
                  <span className="text-sm font-black text-slate-600 uppercase tracking-widest truncate w-full text-center mt-2 group-hover:text-slate-500">
                    {order.order_name}
                  </span>
                )}
                <div className="mt-4 w-full h-1 bg-slate-800 overflow-hidden">
                  <div className="h-full bg-amber-500/30 w-1/3 animate-progress" />
                </div>
              </div>
            ))}
            {preparing.length === 0 && (
              <div className="col-span-full h-full flex flex-col items-center justify-center opacity-10 py-32">
                <UtensilsCrossed className="h-32 w-32 mb-6" />
                <p className="text-3xl font-black uppercase tracking-widest">
                  No orders in prep
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Ready Column */}
        <div className="flex-[6] flex flex-col bg-lime-500/5">
          <div className="h-20 flex items-center px-10 gap-4 bg-lime-500/10 border-b-2 border-lime-500/20">
            <div className="h-3 w-3 bg-lime-500 shadow-[0_0_15px_rgba(132,204,22,0.6)]" />
            <h2 className="text-2xl font-black text-lime-500 uppercase tracking-[0.15em]">
              Ready to Collect
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-10 grid grid-cols-2 gap-6 content-start scrollbar-none">
            {ready.map((order) => (
              <div
                key={order.id}
                className="relative bg-lime-500 border-2 border-lime-400 p-12 flex flex-col items-center justify-center gap-4 shadow-[0_30px_60px_rgba(132,204,22,0.15)] animate-bounce-subtle overflow-hidden active:scale-[0.98] transition-transform"
              >
                {/* Decorative glow */}
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-white/20 blur-[60px]" />

                <span
                  className="text-8xl font-black text-slate-900 drop-shadow-2xl font-mono"
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                >
                  {order.queue_token_number}
                </span>
                {order.order_name && (
                  <span className="text-xl font-black text-lime-950 uppercase tracking-widest truncate w-full text-center mt-2">
                    {order.order_name}
                  </span>
                )}
                <div className="mt-6 bg-lime-950/20 px-8 py-3 flex items-center gap-3 backdrop-blur-md">
                  <CheckCircle2 className="h-6 w-6 text-lime-900" />
                  <span className="text-lg font-black text-lime-900 uppercase tracking-tight">
                    Collect Now
                  </span>
                </div>
              </div>
            ))}
            {ready.length === 0 && (
              <div className="col-span-full h-full flex flex-col items-center justify-center opacity-10 py-32">
                <CheckCircle2 className="h-32 w-32 mb-6" />
                <p className="text-3xl font-black uppercase tracking-widest">
                  Awaiting readiness
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer / Marquee */}
      <div className="h-16 bg-slate-950 border-t-2 border-slate-800 flex items-center px-12 overflow-hidden relative">
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-slate-950 to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-slate-950 to-transparent z-10" />

        <div className="flex items-center gap-16 animate-marquee whitespace-nowrap">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-16">
              <span className="text-sm font-black text-slate-500 uppercase tracking-[0.3em]">
                Freshly prepared for you
              </span>
              <span className="h-1.5 w-1.5 bg-slate-700" />
              <span className="text-sm font-black text-slate-500 uppercase tracking-[0.3em]">
                Listen for your token number
              </span>
              <span className="h-1.5 w-1.5 bg-slate-700" />
              <span className="text-sm font-black text-slate-500 uppercase tracking-[0.3em]">
                Quality service guaranteed
              </span>
              <span className="h-1.5 w-1.5 bg-slate-700" />
              <span className="text-sm font-black text-slate-500 uppercase tracking-[0.3em]">
                Thank you for dining with us
              </span>
              <span className="h-1.5 w-1.5 bg-slate-700" />
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes bounce-subtle {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-15px);
          }
        }
        .animate-bounce-subtle {
          animation: bounce-subtle 4s ease-in-out infinite;
        }
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-33.33%);
          }
        }
        .animate-marquee {
          animation: marquee 40s linear infinite;
        }
        @keyframes progress {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(300%);
          }
        }
        .animate-progress {
          animation: progress 2s linear infinite;
        }
      `}</style>
    </div>
  );
}
