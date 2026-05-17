'use client';

import { useState, useEffect, useCallback } from 'react';
import { API_BASE } from '@/lib/api';
import { getAuthToken } from '@respos/utils';
import {
  ShieldCheck,
  X,
  Delete,
  ChevronLeft,
  Loader2,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ManagerInfo {
  id: string;
  name: string;
  role: string;
}

interface ManagerPinModalProps {
  open: boolean;
  onClose: () => void;
  onAuthorized: (token: string, managerName: string) => void;
  tenantId: string;
  reason?: string;
}

const KEYPAD = ['1', '2', '3', '4', '5', '6', '7', '8', '9'] as const;

export function ManagerPinModal({
  open,
  onClose,
  onAuthorized,
  tenantId,
  reason,
}: ManagerPinModalProps) {
  const [managers, setManagers] = useState<ManagerInfo[]>([]);
  const [selectedManager, setSelectedManager] = useState<ManagerInfo | null>(
    null,
  );
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const [fetching, setFetching] = useState(false);

  // Fetch available managers when modal opens
  useEffect(() => {
    if (!open) return;
    const fetchManagers = async () => {
      setFetching(true);
      try {
        const token = getAuthToken();
        const res = await fetch(`${API_BASE}/staff/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const activeManagers = (data as ManagerInfo[]).filter(
            (u) => u.role === 'MANAGER' || u.role === 'OWNER',
          );
          setManagers(activeManagers);
        }
      } catch {
        setError('Failed to load managers');
      } finally {
        setFetching(false);
      }
    };
    fetchManagers();
  }, [open]);

  const reset = useCallback(() => {
    setSelectedManager(null);
    setPin('');
    setError('');
    setShake(false);
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  const handleManagerSelect = (manager: ManagerInfo) => {
    setSelectedManager(manager);
    setPin('');
    setError('');
  };

  const handleKey = (digit: string) => {
    if (pin.length >= 4) return;
    const next = pin + digit;
    setPin(next);
    setError('');
    if (next.length === 4) submitPin(next);
  };

  const handleDelete = () => setPin((p) => p.slice(0, -1));

  const submitPin = async (pinValue: string) => {
    setLoading(true);
    setError('');
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_BASE}/auth/verify-manager-pin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          tenantId,
          managerId: selectedManager!.id,
          pin: pinValue,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Invalid PIN');
      }

      const data = await res.json();
      reset();
      onAuthorized(data.authorization_token, selectedManager!.name);
    } catch (err: any) {
      setError(err.message || 'Authorization failed');
      setShake(true);
      setPin('');
      setTimeout(() => setShake(false), 500);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className={cn(
          'relative z-10 w-full max-w-sm bg-white rounded-3xl border border-border shadow-elevated p-8 animate-scale-in',
          shake && 'animate-shake',
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-content-primary">
                Manager Authorization
              </h2>
              <p className="text-xs text-content-muted">
                {reason || 'Sensitive action requires approval'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="h-8 w-8 rounded-lg hover:bg-surface-2 flex items-center justify-center text-content-muted hover:text-content-primary transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {fetching ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 text-brand-600 animate-spin" />
          </div>
        ) : !selectedManager ? (
          /* Step 1: Select Manager */
          <div className="space-y-3">
            <p className="text-sm font-semibold text-content-secondary">
              Select authorizing manager
            </p>
            {managers.length === 0 ? (
              <p className="text-sm text-content-muted text-center py-6">
                No active managers found. Contact the restaurant owner.
              </p>
            ) : (
              managers.map((m) => (
                <button
                  key={m.id}
                  onClick={() => handleManagerSelect(m)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-border hover:border-brand-300 hover:bg-brand-50 transition-all text-left"
                >
                  <div className="h-9 w-9 rounded-full bg-surface-3 flex items-center justify-center">
                    <User className="h-4 w-4 text-content-secondary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-content-primary">
                      {m.name}
                    </p>
                    <p className="text-xs text-content-muted">{m.role}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        ) : (
          /* Step 2: Enter PIN */
          <div className="flex flex-col items-center gap-5">
            <button
              onClick={() => {
                setSelectedManager(null);
                setPin('');
                setError('');
              }}
              className="self-start flex items-center gap-1 text-content-muted hover:text-content-primary text-sm transition-colors"
            >
              <ChevronLeft className="h-4 w-4" /> Back
            </button>

            <div className="text-center">
              <div className="h-12 w-12 rounded-full bg-brand-100 mx-auto mb-2 flex items-center justify-center">
                <User className="h-6 w-6 text-brand-600" />
              </div>
              <p className="font-bold text-content-primary">
                {selectedManager.name}
              </p>
              <p className="text-sm text-content-muted">
                Enter your 4-digit PIN
              </p>
            </div>

            {/* PIN dots */}
            <div className="flex gap-3">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={cn(
                    'h-4 w-4 rounded-full border-2 transition-all duration-200',
                    i < pin.length
                      ? error
                        ? 'bg-danger border-danger'
                        : 'bg-brand-600 border-brand-600 scale-110'
                      : 'bg-transparent border-border-strong',
                  )}
                />
              ))}
            </div>

            {error && (
              <p className="text-danger text-sm font-medium animate-fade-in">
                {error}
              </p>
            )}

            {/* Keypad */}
            <div className="grid grid-cols-3 gap-2.5 w-full">
              {KEYPAD.map((num) => (
                <button
                  key={num}
                  onClick={() => handleKey(num)}
                  disabled={loading}
                  className={cn(
                    'h-14 rounded-2xl text-2xl font-bold text-content-primary',
                    'bg-surface-3 border border-border hover:bg-surface-4 hover:border-border-strong',
                    'active:scale-95 transition-all duration-150 shadow-sm',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                  )}
                >
                  {num}
                </button>
              ))}

              <button
                onClick={handleClose}
                disabled={loading}
                className="h-14 rounded-2xl text-sm font-semibold text-content-secondary hover:bg-surface-3 border border-border transition-all duration-150 active:scale-95 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                onClick={() => handleKey('0')}
                disabled={loading}
                className={cn(
                  'h-14 rounded-2xl text-2xl font-bold text-content-primary',
                  'bg-surface-3 border border-border hover:bg-surface-4 hover:border-border-strong',
                  'active:scale-95 transition-all duration-150 shadow-sm disabled:opacity-50',
                )}
              >
                0
              </button>

              <button
                onClick={handleDelete}
                disabled={loading || pin.length === 0}
                className="h-14 rounded-2xl flex items-center justify-center text-content-muted hover:text-danger hover:bg-danger/10 border border-border transition-all duration-150 active:scale-95 disabled:opacity-30"
              >
                <Delete className="h-5 w-5" />
              </button>
            </div>

            {loading && (
              <div className="flex items-center gap-2 text-brand-600 animate-fade-in">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm font-medium">Verifying...</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
