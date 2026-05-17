'use client';

import { useEffect, useState } from 'react';
import { API_BASE } from '@/lib/api';
import { getAuthToken } from '@respos/utils';
import {
  Calendar as CalendarIcon,
  Plus,
  Users,
  IndianRupee,
  ChevronRight,
  Clock,
  Search,
  CheckCircle2,
  XCircle,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface Booking {
  id: string;
  event_name: string;
  event_date: string;
  guest_count: number;
  deposit_amount: number;
  status: 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  customer?: {
    name: string;
    mobile: string;
  };
}

export default function BanquetsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchBookings = async () => {
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_BASE}/bookings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setBookings(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-2xl bg-brand-100 flex items-center justify-center">
              <CalendarIcon className="h-6 w-6 text-brand-600" />
            </div>
            <h1 className="text-3xl font-black text-content-primary tracking-tight">
              BANQUET & EVENTS
            </h1>
          </div>
          <p className="text-sm text-content-muted font-medium">
            Manage bookings, deposits, and event briefings
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-6 py-3 rounded-2xl text-sm font-bold shadow-lg shadow-brand-500/20 transition-all active:scale-95"
        >
          <Plus className="h-4 w-4" />
          New Booking
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-48 rounded-[2.5rem] bg-white border border-border animate-pulse"
            />
          ))
        ) : bookings.length === 0 ? (
          <div className="col-span-full py-20 bg-white rounded-[2.5rem] border border-dashed border-border flex flex-col items-center justify-center text-center">
            <CalendarIcon className="h-12 w-12 text-content-disabled mb-4" />
            <h2 className="text-xl font-bold text-content-secondary">
              No upcoming events
            </h2>
            <p className="text-sm text-content-muted">
              Bookings for parties and banquets will appear here.
            </p>
          </div>
        ) : (
          bookings.map((booking) => (
            <Link
              href={`/dashboard/banquets/${booking.id}`}
              key={booking.id}
              className="group bg-white rounded-[2rem] border border-border p-6 hover:shadow-xl hover:border-brand-200 transition-all flex flex-col"
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className={cn(
                    'px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest',
                    booking.status === 'CONFIRMED'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-100 text-slate-700',
                  )}
                >
                  {booking.status}
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-content-muted">
                    {new Date(booking.event_date).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                    })}
                  </p>
                  <p className="text-[10px] font-black text-brand-600">
                    {new Date(booking.event_date).toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>

              <h3 className="text-lg font-black text-content-primary mb-1 group-hover:text-brand-700 transition-colors">
                {booking.event_name}
              </h3>
              <p className="text-sm font-medium text-content-secondary mb-6">
                {booking.customer?.name || 'Walk-in Booking'}
              </p>

              <div className="mt-auto pt-6 border-t border-border/50 grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-content-muted uppercase tracking-tighter">
                    Guests
                  </p>
                  <div className="flex items-center gap-1.5 font-bold text-sm text-content-primary">
                    <Users className="h-3.5 w-3.5 text-brand-500" />
                    {booking.guest_count}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-content-muted uppercase tracking-tighter">
                    Deposit
                  </p>
                  <div className="flex items-center gap-1 font-bold text-sm text-emerald-600">
                    <IndianRupee className="h-3.5 w-3.5" />
                    {(booking.deposit_amount / 100).toLocaleString()}
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      {/* New Booking Modal (Placeholder) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="w-full max-w-xl bg-white rounded-[2.5rem] shadow-2xl p-8 animate-in fade-in zoom-in duration-200">
            <h2 className="text-2xl font-black text-content-primary mb-6">
              New Banquet Booking
            </h2>
            <p className="text-content-muted mb-8 italic">
              Banquet setup requires date, guest count, and deposit tracking.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-3 rounded-2xl border border-border font-bold text-content-secondary"
              >
                Cancel
              </button>
              <button className="px-6 py-3 rounded-2xl bg-brand-600 text-white font-bold">
                Create Booking
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
