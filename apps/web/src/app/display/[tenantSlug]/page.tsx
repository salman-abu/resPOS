'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getDisplayMenu, getDisplayBanner } from '@/lib/api';

export default function DisplayPage() {
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;

  const [menu, setMenu] = useState<any>(null);
  const [banner, setBanner] = useState<any>(null);
  const [activeCategory, setActiveCategory] = useState(0);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!tenantSlug) return;

    let cancelled = false;

    async function load() {
      try {
        const [menuData, bannerData] = await Promise.all([
          getDisplayMenu(tenantSlug),
          getDisplayBanner(tenantSlug),
        ]);
        if (!cancelled) {
          setMenu(menuData);
          setBanner(bannerData);
        }
      } catch (e) {
        if (!cancelled) setError(true);
      }
    }

    load();

    // Auto-rotate categories every 8 seconds
    const interval = setInterval(() => {
      setActiveCategory((prev) => {
        if (!menu?.categories?.length) return prev;
        return (prev + 1) % menu.categories.length;
      });
    }, 8000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [tenantSlug, menu?.categories?.length]);

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center text-2xl font-bold">
        Unable to load menu
      </div>
    );
  }

  if (!menu) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center text-2xl font-bold">
        Loading menu...
      </div>
    );
  }

  const category = menu.categories[activeCategory];

  return (
    <div className="min-h-screen bg-black text-white flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-12 py-6 flex items-center justify-between border-b border-white/10">
        <h1 className="text-4xl font-black tracking-tight">
          {menu.restaurantName}
        </h1>
        <div className="text-xl font-bold text-white/60">
          {new Date().toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>

      {/* Banner */}
      {banner && (
        <div className="bg-amber-500 text-black px-12 py-3 text-xl font-bold text-center">
          {banner.text}
        </div>
      )}

      {/* Category Tabs */}
      <div className="flex gap-2 px-12 py-4 border-b border-white/10">
        {menu.categories.map((cat: any, i: number) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(i)}
            className={`px-6 py-2 rounded-full text-lg font-bold transition-all ${
              i === activeCategory
                ? 'bg-white text-black'
                : 'bg-white/10 text-white/60 hover:bg-white/20'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Items Grid */}
      <div className="flex-1 px-12 py-8 overflow-y-auto">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
          {category?.items?.map((item: any) => (
            <div
              key={item.id}
              className={`rounded-2xl border-2 p-6 transition-all ${
                item.is_available
                  ? 'border-white/10 bg-white/5'
                  : 'border-white/5 bg-white/[0.02] opacity-40'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-2xl font-bold">{item.name}</h3>
                    {item.item_type && (
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-bold ${
                          item.item_type === 'VEG'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : item.item_type === 'NON_VEG'
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-blue-500/20 text-blue-400'
                        }`}
                      >
                        {item.item_type}
                      </span>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-white/50 text-sm mb-3 line-clamp-2">
                      {item.description}
                    </p>
                  )}
                  {!item.is_available && (
                    <span className="text-red-400 text-sm font-bold">
                      Currently Unavailable
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-3xl font-black">
                    ₹{Math.round(item.price / 100)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="px-12 py-4 border-t border-white/10 text-white/40 text-sm font-bold text-center">
        All prices inclusive of taxes · Images are for representation only
      </div>
    </div>
  );
}
