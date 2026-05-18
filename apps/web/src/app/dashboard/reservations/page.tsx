'use client';

import { useState, useEffect } from 'react';
import {
  getReservations,
  createReservation,
  updateReservationStatus,
  getReservationAvailability,
  getWaitlist,
  addToWaitlist,
  seatWaitlistEntry,
  getReservationSettings,
} from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/Toast';
import {
  Calendar,
  Clock,
  Users,
  Phone,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  Armchair,
  List,
  Settings,
} from 'lucide-react';

const statusConfig: Record<
  string,
  { label: string; color: string; icon: any }
> = {
  PENDING: {
    label: 'Pending',
    color: 'text-warning-default bg-warning-light',
    icon: AlertCircle,
  },
  CONFIRMED: {
    label: 'Confirmed',
    color: 'text-info-default bg-info-light',
    icon: CheckCircle,
  },
  SEATED: {
    label: 'Seated',
    color: 'text-success-default bg-success-light',
    icon: Armchair,
  },
  CANCELLED: {
    label: 'Cancelled',
    color: 'text-danger-default bg-danger-light',
    icon: XCircle,
  },
  NOSHOW: {
    label: 'No Show',
    color: 'text-content-secondary bg-surface-sunken',
    icon: AlertCircle,
  },
  COMPLETED: {
    label: 'Completed',
    color: 'text-success-strong bg-success-light',
    icon: CheckCircle,
  },
};

export default function ReservationsPage() {
  const { error: toastError, success: toastSuccess } = useToast();
  const [reservations, setReservations] = useState<any[]>([]);
  const [waitlist, setWaitlist] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0],
  );
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [tab, setTab] = useState<'reservations' | 'waitlist'>('reservations');
  const [settings, setSettings] = useState<any>(null);

  // Form state
  const [formData, setFormData] = useState({
    guestName: '',
    guestPhone: '',
    partySize: 2,
    scheduledAt: `${new Date().toISOString().split('T')[0]}T19:00`,
    notes: '',
    source: 'STAFF',
  });

  const [waitlistForm, setWaitlistForm] = useState({
    guestName: '',
    guestPhone: '',
    partySize: 2,
  });

  useEffect(() => {
    loadAll();
    getReservationSettings()
      .then(setSettings)
      .catch(() => {});
  }, [selectedDate]);

  async function loadAll() {
    setLoading(true);
    try {
      const [res, wl] = await Promise.all([
        getReservations(selectedDate),
        getWaitlist(),
      ]);
      setReservations(res);
      setWaitlist(wl);
    } catch (err: any) {
      toastError('Failed to load: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!formData.guestName || !formData.guestPhone) {
      toastError('Guest name and phone required');
      return;
    }
    try {
      await createReservation({
        guestName: formData.guestName,
        guestPhone: formData.guestPhone,
        partySize: Number(formData.partySize),
        scheduledAt: new Date(formData.scheduledAt).toISOString(),
        notes: formData.notes,
        source: formData.source,
      });
      toastSuccess('Reservation created');
      setShowForm(false);
      loadAll();
      setFormData({
        guestName: '',
        guestPhone: '',
        partySize: 2,
        scheduledAt: `${new Date().toISOString().split('T')[0]}T19:00`,
        notes: '',
        source: 'STAFF',
      });
    } catch (err: any) {
      toastError(err.message);
    }
  }

  async function handleStatusChange(id: string, status: string) {
    try {
      await updateReservationStatus(id, status);
      toastSuccess(`Status updated to ${status}`);
      loadAll();
    } catch (err: any) {
      toastError(err.message);
    }
  }

  async function handleAddWaitlist() {
    try {
      await addToWaitlist({
        guestName: waitlistForm.guestName,
        guestPhone: waitlistForm.guestPhone,
        partySize: Number(waitlistForm.partySize),
      });
      toastSuccess('Added to waitlist');
      loadAll();
      setWaitlistForm({ guestName: '', guestPhone: '', partySize: 2 });
    } catch (err: any) {
      toastError(err.message);
    }
  }

  async function handleSeatWaitlist(id: string) {
    try {
      await seatWaitlistEntry(id);
      toastSuccess('Guest seated from waitlist');
      loadAll();
    } catch (err: any) {
      toastError(err.message);
    }
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
          <h1 className="text-2xl font-bold">Reservations</h1>
          <div className="flex items-center gap-3">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border rounded-md px-3 py-2 text-sm"
            />
            <Button onClick={() => setShowForm(!showForm)}>
              {showForm ? 'Cancel' : '+ New Reservation'}
            </Button>
          </div>
        </div>

        {showForm && (
          <div className="bg-surface-card rounded-2xl border border-border p-5 mb-6 shadow-sm">
            <h2 className="font-semibold mb-4">New Reservation</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Guest Name</label>
                <Input
                  value={formData.guestName}
                  onChange={(e) =>
                    setFormData({ ...formData, guestName: e.target.value })
                  }
                  placeholder="Guest name"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Phone</label>
                <Input
                  value={formData.guestPhone}
                  onChange={(e) =>
                    setFormData({ ...formData, guestPhone: e.target.value })
                  }
                  placeholder="+91..."
                />
              </div>
              <div>
                <label className="text-sm font-medium">Party Size</label>
                <Input
                  type="number"
                  min={1}
                  value={formData.partySize}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      partySize: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">Date & Time</label>
                <Input
                  type="datetime-local"
                  value={formData.scheduledAt}
                  onChange={(e) =>
                    setFormData({ ...formData, scheduledAt: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">Source</label>
                <select
                  value={formData.source}
                  onChange={(e) =>
                    setFormData({ ...formData, source: e.target.value })
                  }
                  className="w-full border rounded-md px-3 py-2 text-sm"
                >
                  <option value="STAFF">Staff</option>
                  <option value="ONLINE">Online Widget</option>
                  <option value="WALKIN">Walk-in</option>
                </select>
              </div>
              <div className="md:col-span-2 lg:col-span-3">
                <label className="text-sm font-medium">Notes</label>
                <Input
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Special requests, allergies, occasion..."
                />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button onClick={handleCreate}>Create Reservation</Button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-surface-sunken p-1 rounded-lg mb-4 w-fit">
          <button
            onClick={() => setTab('reservations')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === 'reservations'
                ? 'bg-surface-card text-content-primary shadow-sm'
                : 'text-content-secondary hover:text-content-primary'
            }`}
          >
            <List className="w-4 h-4 inline mr-1.5" />
            Reservations ({reservations.length})
          </button>
          <button
            onClick={() => setTab('waitlist')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === 'waitlist'
                ? 'bg-surface-card text-content-primary shadow-sm'
                : 'text-content-secondary hover:text-content-primary'
            }`}
          >
            <Clock className="w-4 h-4 inline mr-1.5" />
            Waitlist ({waitlist.length})
          </button>
        </div>

        {/* Reservations List */}
        {tab === 'reservations' && (
          <div className="bg-surface-card rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface-sunken border-b border-border">
                    <th className="px-4 py-3 text-left font-medium text-content-secondary">
                      Time
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-content-secondary">
                      Guest
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-content-secondary">
                      Party
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-content-secondary">
                      Table
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-content-secondary">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-content-secondary">
                      Notes
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-content-secondary">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {loading ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-8 text-center text-content-muted"
                      >
                        Loading...
                      </td>
                    </tr>
                  ) : reservations.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-8 text-center text-content-muted"
                      >
                        No reservations for this date
                      </td>
                    </tr>
                  ) : (
                    reservations.map((r) => {
                      const cfg =
                        statusConfig[r.status] || statusConfig.PENDING;
                      const Icon = cfg.icon;
                      return (
                        <tr key={r.id} className="hover:bg-surface-sunken">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-content-muted" />
                              {new Date(r.scheduled_at).toLocaleTimeString(
                                'en-IN',
                                {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                },
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium">{r.guest_name}</div>
                            <div className="text-content-muted text-xs flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {r.guest_phone}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="flex items-center gap-1">
                              <Users className="w-3.5 h-3.5 text-content-muted" />
                              {r.party_size}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {r.table ? (
                              <span className="text-blue-600 font-medium">
                                {r.table.table_number}
                              </span>
                            ) : (
                              <span className="text-content-muted">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}
                            >
                              <Icon className="w-3 h-3" />
                              {cfg.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-content-secondary max-w-[200px] truncate">
                            {r.notes || '—'}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1">
                              {r.status === 'CONFIRMED' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    handleStatusChange(r.id, 'SEATED')
                                  }
                                >
                                  Seat
                                </Button>
                              )}
                              {['PENDING', 'CONFIRMED'].includes(r.status) && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 border-red-200 hover:bg-red-50"
                                  onClick={() =>
                                    handleStatusChange(r.id, 'CANCELLED')
                                  }
                                >
                                  Cancel
                                </Button>
                              )}
                              {r.status === 'SEATED' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    handleStatusChange(r.id, 'COMPLETED')
                                  }
                                >
                                  Complete
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Waitlist Tab */}
        {tab === 'waitlist' && (
          <div className="space-y-6">
            {/* Add to waitlist form */}
            <div className="bg-surface-card rounded-2xl border border-border p-5 shadow-sm">
              <h2 className="font-semibold mb-3">Add to Waitlist</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Input
                  placeholder="Guest name"
                  value={waitlistForm.guestName}
                  onChange={(e) =>
                    setWaitlistForm({
                      ...waitlistForm,
                      guestName: e.target.value,
                    })
                  }
                />
                <Input
                  placeholder="Phone number"
                  value={waitlistForm.guestPhone}
                  onChange={(e) =>
                    setWaitlistForm({
                      ...waitlistForm,
                      guestPhone: e.target.value,
                    })
                  }
                />
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min={1}
                    placeholder="Party size"
                    value={waitlistForm.partySize}
                    onChange={(e) =>
                      setWaitlistForm({
                        ...waitlistForm,
                        partySize: Number(e.target.value),
                      })
                    }
                  />
                  <Button onClick={handleAddWaitlist}>Add</Button>
                </div>
              </div>
            </div>

            <div className="bg-surface-card rounded-2xl border border-border shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-surface-sunken border-b border-border">
                      <th className="px-4 py-3 text-left font-medium text-content-secondary">
                        #
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-content-secondary">
                        Guest
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-content-secondary">
                        Party
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-content-secondary">
                        Joined
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-content-secondary">
                        Est. Wait
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-content-secondary">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {waitlist.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-4 py-8 text-center text-content-muted"
                        >
                          Waitlist is empty
                        </td>
                      </tr>
                    ) : (
                      waitlist.map((entry, idx) => (
                        <tr key={entry.id} className="hover:bg-surface-sunken">
                          <td className="px-4 py-3 text-content-muted">
                            {idx + 1}
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium">
                              {entry.guest_name}
                            </div>
                            <div className="text-content-muted text-xs">
                              {entry.guest_phone}
                            </div>
                          </td>
                          <td className="px-4 py-3">{entry.party_size}</td>
                          <td className="px-4 py-3 text-content-secondary">
                            {new Date(entry.joined_at).toLocaleTimeString(
                              'en-IN',
                              {
                                hour: '2-digit',
                                minute: '2-digit',
                              },
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-orange-600 font-medium">
                              {entry.quoted_wait_minutes} min
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSeatWaitlist(entry.id)}
                            >
                              Seat
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
