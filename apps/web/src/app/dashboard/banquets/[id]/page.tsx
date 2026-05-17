'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { API_BASE } from '@/lib/api';
import { getAuthToken } from '@respos/utils';
import {
  Users,
  Clock,
  Calendar,
  ChevronLeft,
  FileText,
  CheckCircle2,
  AlertCircle,
  UtensilsCrossed,
  GlassWater,
  PartyPopper,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Booking {
  id: string;
  event_name: string;
  event_date: string;
  guest_count: number;
  notes?: string;
  status: string;
  customer?: {
    name: string;
    mobile: string;
  };
}

export default function EventBriefingPage() {
  const { id } = useParams();
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBriefing = async () => {
      try {
        const token = getAuthToken();
        const res = await fetch(`${API_BASE}/bookings/${id}/briefing`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          setBooking(await res.json());
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchBriefing();
  }, [id]);

  if (loading)
    return (
      <div className="p-20 text-center font-black animate-pulse">
        LOADING BRIEFING...
      </div>
    );
  if (!booking)
    return (
      <div className="p-20 text-center font-bold text-danger">
        Event not found
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-5xl mx-auto space-y-10">
        {/* Nav */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors font-bold text-sm"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Bookings
        </button>

        {/* Hero Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/10 pb-10">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <PartyPopper className="h-8 w-8 text-amber-400" />
              <h1 className="text-5xl font-black tracking-tighter uppercase">
                {booking.event_name}
              </h1>
            </div>
            <div className="flex flex-wrap gap-6 text-slate-300 font-bold uppercase text-xs tracking-widest">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-brand-400" />
                {new Date(booking.event_date).toLocaleDateString('en-IN', {
                  weekday: 'long',
                  day: '2-digit',
                  month: 'long',
                })}
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-brand-400" />
                {new Date(booking.event_date).toLocaleTimeString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-brand-400" />
                {booking.guest_count} GUESTS
              </div>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-xl">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
              Host Contact
            </p>
            <p className="text-lg font-bold">{booking.customer?.name}</p>
            <p className="text-sm font-medium text-slate-400">
              {booking.customer?.mobile}
            </p>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Briefing Text */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem]">
              <div className="flex items-center gap-2 mb-6">
                <FileText className="h-5 w-5 text-amber-400" />
                <h2 className="text-xl font-black uppercase tracking-tight">
                  OPERATIONAL NOTES
                </h2>
              </div>
              <div className="prose prose-invert max-w-none">
                <p className="text-lg text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {booking.notes ||
                    'No specific operational notes provided for this event. Follow standard banquet protocol.'}
                </p>
              </div>
            </div>

            {/* Checklist */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: 'Table Setup (Linen/Decor)', icon: UtensilsCrossed },
                { label: 'Beverage Station Ready', icon: GlassWater },
                { label: 'Menu Briefing with Chef', icon: CheckCircle2 },
                { label: 'AV Equipment Check', icon: AlertCircle },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5"
                >
                  <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <span className="font-bold text-sm text-slate-300">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar: Menu/Quick Actions */}
          <div className="space-y-6">
            <div className="bg-brand-600 p-8 rounded-[2.5rem] shadow-2xl shadow-brand-500/20">
              <h3 className="text-lg font-black uppercase mb-4">
                Event Status
              </h3>
              <div className="flex items-center gap-2 text-3xl font-black mb-6">
                <div className="h-3 w-3 rounded-full bg-white animate-pulse" />
                {booking.status}
              </div>
              <button className="w-full bg-white text-brand-700 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-100 transition-colors shadow-lg active:scale-95">
                Start Service
              </button>
            </div>

            <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem]">
              <h3 className="text-sm font-black uppercase text-slate-400 mb-4">
                Timeline
              </h3>
              <div className="space-y-4">
                {[
                  { time: 'T-60m', label: 'Setup & Cleaning' },
                  { time: 'T-15m', label: 'Briefing Session' },
                  { time: 'Event', label: 'Guest Arrival' },
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-12 text-[10px] font-black text-brand-400">
                      {step.time}
                    </div>
                    <div className="h-1 w-1 rounded-full bg-slate-600" />
                    <div className="text-xs font-bold text-slate-300">
                      {step.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
