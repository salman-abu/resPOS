'use client';

import { useState } from 'react';
import { Clock, CheckCircle2, User, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { API_BASE } from '@/lib/api';

export default function TimeclockPage() {
  const [pin, setPin] = useState('');
  const [status, setStatus] = useState<
    'IDLE' | 'LOADING' | 'SUCCESS' | 'ERROR'
  >('IDLE');
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleKeyPress = (num: string) => {
    if (pin.length < 4) setPin((prev) => prev + num);
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  const handleSubmit = async () => {
    if (pin.length !== 4) return;
    setStatus('LOADING');
    try {
      const tenantId = localStorage.getItem('tenant_id') || 'tenant-1';
      const outletId = localStorage.getItem('outlet_id') || 'outlet-1';

      const res = await fetch(`${API_BASE}/staff/attendance/clock-in-out`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tenantId, // Assumes tenant middleware can pick this up if no JWT
        },
        body: JSON.stringify({ pin, outletId }),
      });

      if (!res.ok) throw new Error('Invalid PIN');
      const data = await res.json();

      setStatus('SUCCESS');
      setMessage(
        `${data.user} has ${data.action === 'CLOCKED_IN' ? 'Clocked In' : 'Clocked Out'} successfully.`,
      );
      setTimeout(() => {
        setPin('');
        setStatus('IDLE');
      }, 3000);
    } catch (e: any) {
      setStatus('ERROR');
      setMessage(e.message || 'Error occurred');
      setTimeout(() => {
        setPin('');
        setStatus('IDLE');
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-surface-base flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl p-8 border border-border">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mb-4">
            <Clock className="w-8 h-8 text-brand-600" />
          </div>
          <h1 className="text-2xl font-black text-content-primary">
            Staff Timeclock
          </h1>
          <p className="text-sm text-content-muted mt-2">
            Enter your 4-digit PIN to clock in or out.
          </p>
        </div>

        {status === 'SUCCESS' ? (
          <div className="text-center py-8">
            <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-content-primary">
              {message}
            </h2>
          </div>
        ) : status === 'ERROR' ? (
          <div className="text-center py-8">
            <div className="text-red-500 text-lg font-bold">{message}</div>
          </div>
        ) : (
          <>
            <div className="flex justify-center gap-3 mb-8">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`w-4 h-4 rounded-full ${pin.length > i ? 'bg-brand-600' : 'bg-surface-3'}`}
                />
              ))}
            </div>

            <div className="grid grid-cols-3 gap-4 mb-8">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  onClick={() => handleKeyPress(num.toString())}
                  className="h-16 rounded-2xl bg-surface-2 hover:bg-surface-3 text-2xl font-bold transition-colors active:scale-95"
                >
                  {num}
                </button>
              ))}
              <button
                onClick={handleBackspace}
                className="h-16 rounded-2xl bg-red-50 hover:bg-red-100 text-red-600 font-bold transition-colors active:scale-95 flex items-center justify-center"
              >
                DEL
              </button>
              <button
                onClick={() => handleKeyPress('0')}
                className="h-16 rounded-2xl bg-surface-2 hover:bg-surface-3 text-2xl font-bold transition-colors active:scale-95"
              >
                0
              </button>
              <button
                onClick={handleSubmit}
                disabled={pin.length !== 4 || status === 'LOADING'}
                className="h-16 rounded-2xl bg-brand-600 disabled:opacity-50 hover:bg-brand-700 text-white font-bold transition-colors active:scale-95 flex items-center justify-center"
              >
                GO
              </button>
            </div>

            <button
              onClick={() => router.push('/')}
              className="w-full py-3 text-sm font-semibold text-content-muted hover:bg-surface-2 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" /> Exit to POS
            </button>
          </>
        )}
      </div>
    </div>
  );
}
