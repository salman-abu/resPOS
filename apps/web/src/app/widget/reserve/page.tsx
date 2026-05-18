'use client';

import { useState, useEffect } from 'react';
import { getReservationAvailability, createReservation } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Calendar,
  Clock,
  Users,
  Phone,
  User,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

export default function ReserveWidgetPage() {
  const { error: toastError, success: toastSuccess } = useToast();
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0],
  );
  const [partySize, setPartySize] = useState(2);
  const [availability, setAvailability] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const [formData, setFormData] = useState({
    guestName: '',
    guestPhone: '',
    notes: '',
  });

  useEffect(() => {
    if (!selectedDate) return;
    loadAvailability();
  }, [selectedDate, partySize]);

  async function loadAvailability() {
    setLoading(true);
    try {
      const data = await getReservationAvailability(selectedDate, partySize);
      setAvailability(data);
    } catch (err: any) {
      toastError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleBook() {
    if (!selectedSlot) {
      toastError('Please select a time slot');
      return;
    }
    if (!formData.guestName || !formData.guestPhone) {
      toastError('Name and phone required');
      return;
    }

    setBooking(true);
    try {
      const [hours, minutes] = selectedSlot.split(':').map(Number);
      const scheduledAt = new Date(selectedDate);
      scheduledAt.setHours(hours, minutes, 0, 0);

      await createReservation({
        guestName: formData.guestName,
        guestPhone: formData.guestPhone,
        partySize,
        scheduledAt: scheduledAt.toISOString(),
        notes: formData.notes,
        source: 'ONLINE',
      });

      setConfirmed(true);
      toastSuccess('Reservation confirmed!');
    } catch (err: any) {
      toastError(err.message);
    } finally {
      setBooking(false);
    }
  }

  if (confirmed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl border shadow-sm p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold mb-2">Reservation Confirmed</h2>
          <p className="text-gray-500 mb-6">
            Thank you, {formData.guestName}! Your table for {partySize} is
            reserved at {selectedSlot} on {selectedDate}.
          </p>
          <Button onClick={() => window.location.reload()}>Make Another</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <h1 className="text-xl font-bold mb-1">Book a Table</h1>
          <p className="text-gray-500 text-sm mb-6">
            Reserve your spot in seconds
          </p>

          {/* Date & Party */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div>
              <label className="text-sm font-medium mb-1 block">Date</label>
              <Input
                type="date"
                value={selectedDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Guests</label>
              <Input
                type="number"
                min={1}
                max={20}
                value={partySize}
                onChange={(e) => setPartySize(Number(e.target.value))}
              />
            </div>
          </div>

          {/* Time Slots */}
          <div className="mb-6">
            <label className="text-sm font-medium mb-2 block">
              Select Time
            </label>
            {loading ? (
              <div className="text-gray-400 text-sm py-4">
                Checking availability...
              </div>
            ) : !availability ? (
              <div className="text-gray-400 text-sm py-4">
                Select date to view slots
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {availability.slots.map((slot: any) => (
                  <button
                    key={slot.time}
                    disabled={!slot.available}
                    onClick={() => setSelectedSlot(slot.time)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      selectedSlot === slot.time
                        ? 'bg-blue-600 text-white border-blue-600'
                        : slot.available
                          ? 'bg-white text-gray-700 border-gray-200 hover:border-blue-300'
                          : 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed'
                    }`}
                  >
                    {slot.time}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Guest Details */}
          <div className="space-y-3 mb-6">
            <div>
              <label className="text-sm font-medium mb-1 block">Name</label>
              <Input
                value={formData.guestName}
                onChange={(e) =>
                  setFormData({ ...formData, guestName: e.target.value })
                }
                placeholder="Your full name"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Phone</label>
              <Input
                value={formData.guestPhone}
                onChange={(e) =>
                  setFormData({ ...formData, guestPhone: e.target.value })
                }
                placeholder="+91..."
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">
                Special Requests (optional)
              </label>
              <Input
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Birthday, window seat, high chair..."
              />
            </div>
          </div>

          <Button
            className="w-full"
            size="lg"
            onClick={handleBook}
            disabled={booking || !selectedSlot}
          >
            {booking ? 'Confirming...' : 'Confirm Reservation'}
          </Button>
        </div>
      </div>
    </div>
  );
}
