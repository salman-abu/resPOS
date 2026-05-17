'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthToken } from '@respos/utils';
import {
  Users,
  Plus,
  ArrowLeft,
  Search,
  Edit2,
  ToggleLeft,
  ToggleRight,
  X,
  Loader2,
  Eye,
  EyeOff,
  ShieldCheck,
  ChefHat,
  Star,
  UserCheck,
  Briefcase,
  UtensilsCrossed,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

const ROLES = [
  'OWNER',
  'MANAGER',
  'CASHIER',
  'WAITER',
  'KITCHEN',
  'CAPTAIN',
] as const;
type Role = (typeof ROLES)[number];

interface StaffUser {
  id: string;
  name: string;
  mobile: string;
  email?: string;
  role: Role;
  is_active: boolean;
}

const ROLE_META: Record<
  Role,
  { label: string; color: string; bg: string; icon: React.ReactNode }
> = {
  OWNER: {
    label: 'Owner',
    color: 'text-violet-700',
    bg: 'bg-violet-50 border-violet-200',
    icon: <ShieldCheck className="h-3.5 w-3.5" />,
  },
  MANAGER: {
    label: 'Manager',
    color: 'text-blue-700',
    bg: 'bg-blue-50 border-blue-200',
    icon: <Briefcase className="h-3.5 w-3.5" />,
  },
  CASHIER: {
    label: 'Cashier',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50 border-emerald-200',
    icon: <Star className="h-3.5 w-3.5" />,
  },
  WAITER: {
    label: 'Waiter',
    color: 'text-amber-700',
    bg: 'bg-amber-50 border-amber-200',
    icon: <UtensilsCrossed className="h-3.5 w-3.5" />,
  },
  KITCHEN: {
    label: 'Kitchen',
    color: 'text-orange-700',
    bg: 'bg-orange-50 border-orange-200',
    icon: <ChefHat className="h-3.5 w-3.5" />,
  },
  CAPTAIN: {
    label: 'Captain',
    color: 'text-rose-700',
    bg: 'bg-rose-50 border-rose-200',
    icon: <UserCheck className="h-3.5 w-3.5" />,
  },
};

function RoleBadge({ role }: { role: Role }) {
  const m = ROLE_META[role] ?? ROLE_META.CASHIER;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${m.bg} ${m.color}`}
    >
      {m.icon}
      {m.label}
    </span>
  );
}

function Avatar({ name, role }: { name: string; role: Role }) {
  const colors: Record<Role, string> = {
    OWNER: 'from-violet-500 to-purple-600',
    MANAGER: 'from-blue-500 to-indigo-600',
    CASHIER: 'from-emerald-500 to-teal-600',
    WAITER: 'from-amber-500 to-orange-500',
    KITCHEN: 'from-orange-500 to-red-500',
    CAPTAIN: 'from-rose-500 to-pink-600',
  };
  return (
    <div
      className={`h-10 w-10 rounded-xl bg-gradient-to-br ${colors[role] ?? colors.CASHIER} flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm`}
    >
      {name
        .split(' ')
        .map((p) => p[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)}
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({
  msg,
  type,
  onClose,
}: {
  msg: string;
  type: 'success' | 'error';
  onClose: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-xl border text-sm font-medium transition-all animate-fade-in ${type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}
    >
      {type === 'success' ? (
        <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
      ) : (
        <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
      )}
      {msg}
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

interface ModalProps {
  editing: StaffUser | null;
  onClose: () => void;
  onSaved: () => void;
  token: string;
}

function StaffModal({ editing, onClose, onSaved, token }: ModalProps) {
  const isNew = !editing;
  const [form, setForm] = useState({
    name: editing?.name ?? '',
    mobile: editing?.mobile ?? '',
    email: editing?.email ?? '',
    role: (editing?.role ?? 'CASHIER') as Role,
    pin: '',
  });
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    if (isNew && form.pin.length < 4) {
      setErr('PIN must be at least 4 digits');
      return;
    }
    if (form.name.trim().length < 2) {
      setErr('Name too short');
      return;
    }
    setLoading(true);
    try {
      const API =
        process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';
      const body: Record<string, string> = {
        name: form.name,
        mobile: form.mobile,
        role: form.role,
      };
      if (form.email) body.email = form.email;
      if (form.pin) body.pin = form.pin;
      const res = await fetch(
        isNew ? `${API}/staff/users` : `${API}/staff/users/${editing!.id}`,
        {
          method: isNew ? 'POST' : 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        },
      );
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message ?? 'Failed');
      }
      onSaved();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 z-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-content-primary font-black text-lg">
              {isNew ? 'Add Staff Member' : 'Edit Staff'}
            </h2>
            <p className="text-content-muted text-sm">
              {isNew
                ? 'Create a new team member account'
                : `Editing ${editing!.name}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-semibold text-content-secondary uppercase tracking-wide mb-1.5 block">
                Full Name *
              </label>
              <input
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface-2 text-content-primary text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
                placeholder="e.g. Priya Sharma"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-content-secondary uppercase tracking-wide mb-1.5 block">
                Mobile *
              </label>
              <input
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface-2 text-content-primary text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
                placeholder="+91 98765 43210"
                value={form.mobile}
                onChange={(e) => set('mobile', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-content-secondary uppercase tracking-wide mb-1.5 block">
                Email
              </label>
              <input
                type="email"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface-2 text-content-primary text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
                placeholder="optional"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-content-secondary uppercase tracking-wide mb-1.5 block">
              Role *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {ROLES.filter((r) => r !== 'OWNER').map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => set('role', r)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    form.role === r
                      ? `${ROLE_META[r].bg} ${ROLE_META[r].color} border-current shadow-sm`
                      : 'bg-slate-100 border-slate-300 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {ROLE_META[r].icon}
                  {ROLE_META[r].label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-content-secondary uppercase tracking-wide mb-1.5 block">
              PIN {isNew ? '*' : '(leave blank to keep current)'}
            </label>
            <div className="relative">
              <input
                type={showPin ? 'text' : 'password'}
                inputMode="numeric"
                maxLength={8}
                className="w-full px-4 py-2.5 pr-10 rounded-xl border border-border bg-surface-2 text-content-primary text-sm font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
                placeholder={isNew ? 'Min 4 digits' : '••••'}
                value={form.pin}
                onChange={(e) => set('pin', e.target.value.replace(/\D/g, ''))}
              />
              <button
                type="button"
                onClick={() => setShowPin((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-content-muted hover:text-content-primary transition-colors"
              >
                {showPin ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {err && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {err}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-100 border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-bold hover:bg-brand-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isNew ? 'Create Member' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function StaffDirectoryPage() {
  const router = useRouter();
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<Role | 'ALL'>('ALL');
  const [modal, setModal] = useState<'add' | StaffUser | null>(null);
  const [toast, setToast] = useState<{
    msg: string;
    type: 'success' | 'error';
  } | null>(null);
  const [token, setToken] = useState('');

  useEffect(() => {
    const t = getAuthToken();
    setToken(t);
    if (!t) {
      router.push('/login');
      return;
    }
    fetchStaff(t);
  }, []);

  const fetchStaff = useCallback(
    async (tk?: string) => {
      setLoading(true);
      try {
        const API =
          process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';
        const res = await fetch(`${API}/staff/users`, {
          headers: { Authorization: `Bearer ${tk ?? token}` },
        });
        if (!res.ok) throw new Error('Failed to load staff');
        setStaff(await res.json());
      } catch {
        showToast('Could not load staff list', 'error');
      } finally {
        setLoading(false);
      }
    },
    [token],
  );

  const toggleActive = async (member: StaffUser) => {
    try {
      const API =
        process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';
      await fetch(`${API}/staff/users/${member.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: !member.is_active }),
      });
      setStaff((prev) =>
        prev.map((s) =>
          s.id === member.id ? { ...s, is_active: !s.is_active } : s,
        ),
      );
      showToast(
        `${member.name} ${member.is_active ? 'deactivated' : 'activated'}`,
        'success',
      );
    } catch {
      showToast('Failed to update status', 'error');
    }
  };

  const showToast = (msg: string, type: 'success' | 'error') =>
    setToast({ msg, type });

  const filtered = staff.filter((s) => {
    const q = search.toLowerCase();
    const matchQ =
      !q ||
      s.name.toLowerCase().includes(q) ||
      s.mobile.includes(q) ||
      (s.email ?? '').toLowerCase().includes(q);
    const matchR = filterRole === 'ALL' || s.role === filterRole;
    return matchQ && matchR;
  });

  const counts = ROLES.reduce<Record<string, number>>((acc, r) => {
    acc[r] = staff.filter((s) => s.role === r).length;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-sm border-b border-border px-6 py-3.5 flex items-center gap-4 shadow-sm">
        <button
          onClick={() => router.push('/dashboard/staff')}
          className="flex items-center gap-2 text-content-secondary hover:text-content-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm font-medium hidden sm:block">Staff Hub</span>
        </button>
        <div className="h-4 w-px bg-border" />
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-brand-600 flex items-center justify-center">
            <Users className="h-4 w-4 text-white" />
          </div>
          <div>
            <h1 className="text-content-primary font-black text-sm">
              Staff Directory
            </h1>
            <p className="text-content-muted text-xs">
              {staff.filter((s) => s.is_active).length} active · {staff.length}{' '}
              total
            </p>
          </div>
        </div>
        <div className="ml-auto">
          <button
            onClick={() => setModal('add')}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold rounded-xl transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:block">Add Member</span>
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
        {/* Role summary pills */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterRole('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              filterRole === 'ALL'
                ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All ({staff.length})
          </button>
          {ROLES.map(
            (r) =>
              counts[r] > 0 && (
                <button
                  key={r}
                  onClick={() => setFilterRole(r === filterRole ? 'ALL' : r)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    filterRole === r
                      ? `${ROLE_META[r].bg} ${ROLE_META[r].color} border-current shadow-sm`
                      : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {ROLE_META[r].icon}
                  {ROLE_META[r].label} ({counts[r]})
                </button>
              ),
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-content-muted" />
          <input
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-white text-content-primary text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent shadow-sm"
            placeholder="Search by name, mobile or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* List */}
        {loading ? (
          <div className="flex flex-col items-center py-20 gap-3 text-content-muted">
            <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
            <p className="text-sm">Loading staff…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-20 gap-3">
            <div className="h-16 w-16 rounded-2xl bg-surface-3 flex items-center justify-center">
              <Users className="h-8 w-8 text-content-muted" />
            </div>
            <p className="text-content-primary font-bold">No staff found</p>
            <p className="text-content-muted text-sm text-center max-w-sm">
              {search
                ? 'Try a different search term.'
                : 'Add your first team member to get started.'}
            </p>
            {!search && (
              <button
                onClick={() => setModal('add')}
                className="mt-2 flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white text-sm font-bold rounded-xl hover:bg-brand-700 transition-colors"
              >
                <Plus className="h-4 w-4" /> Add First Member
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-3">
            {filtered.map((member) => (
              <div
                key={member.id}
                className={`bg-white rounded-2xl border shadow-sm p-4 flex items-center gap-4 transition-all duration-200 ${member.is_active ? 'border-border' : 'border-dashed border-border opacity-60'}`}
              >
                <Avatar name={member.name} role={member.role} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-content-primary font-bold text-sm">
                      {member.name}
                    </p>
                    <RoleBadge role={member.role} />
                    {!member.is_active && (
                      <span className="text-[10px] font-bold text-content-muted bg-surface-3 border border-border px-2 py-0.5 rounded-full">
                        INACTIVE
                      </span>
                    )}
                  </div>
                  <p className="text-content-muted text-xs mt-0.5">
                    {member.mobile}
                    {member.email ? ` · ${member.email}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => setModal(member)}
                    title="Edit member"
                    className="h-8 w-8 rounded-xl bg-slate-100 border border-slate-300 hover:bg-brand-50 hover:border-brand-300 hover:text-brand-600 flex items-center justify-center text-slate-600 transition-colors"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => toggleActive(member)}
                    title={member.is_active ? 'Deactivate' : 'Activate'}
                    className={`h-8 w-8 rounded-xl border flex items-center justify-center transition-colors font-medium ${
                      member.is_active
                        ? 'bg-emerald-100 border-emerald-300 text-emerald-700 hover:bg-emerald-200'
                        : 'bg-slate-100 border-slate-300 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    {member.is_active ? (
                      <ToggleRight className="h-4 w-4" />
                    ) : (
                      <ToggleLeft className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <StaffModal
          editing={modal === 'add' ? null : modal}
          token={token}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            fetchStaff();
            showToast(
              modal === 'add' ? 'Staff member created!' : 'Changes saved!',
              'success',
            );
          }}
        />
      )}

      {/* Toast */}
      {toast && (
        <Toast
          msg={toast.msg}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
