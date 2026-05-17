'use client';

import { useState } from 'react';
import { Fingerprint, CheckCircle } from 'lucide-react';

export function ClockInOut() {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const handleNumpad = (num: string) => {
    if (pin.length < 4) setPin((p) => p + num);
  };

  const handleDelete = () => {
    setPin((p) => p.slice(0, -1));
  };

  const handleSubmit = async () => {
    if (pin.length !== 4) return;
    setLoading(true);
    try {
      setTimeout(() => {
        setSuccess(
          `Welcome back, Salman! You have successfully CLOCKED IN at ${new Date().toLocaleTimeString()}`,
        );
        setLoading(false);
        setTimeout(() => {
          setPin('');
          setSuccess(null);
        }, 5000);
      }, 800);
    } catch (error) {
      console.error(error);
      setLoading(false);
      setPin('');
    }
  };

  if (success) {
    return (
      <div className="w-[400px] border-2 border-lime-500/30 bg-lime-500/5 p-12 text-center space-y-4">
        <div className="h-16 w-16 bg-lime-500/10 border-2 border-lime-500/30 flex items-center justify-center text-lime-400 mx-auto">
          <CheckCircle className="h-10 w-10" />
        </div>
        <h2 className="text-xl font-black text-slate-100 uppercase tracking-widest">
          Success!
        </h2>
        <p className="text-slate-400 font-bold uppercase tracking-wider text-xs">
          {success}
        </p>
      </div>
    );
  }

  return (
    <div className="w-[400px] bg-slate-900 border-2 border-slate-700">
      <div className="text-center px-6 pt-6 pb-4 border-b-2 border-slate-800">
        <div className="mx-auto bg-slate-800 border-2 border-slate-700 p-3 w-fit mb-2">
          <Fingerprint className="h-8 w-8 text-slate-400" />
        </div>
        <h2 className="text-lg font-black text-slate-100 uppercase tracking-widest">
          Staff Timeclock
        </h2>
        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">
          Enter your 4-digit PIN to clock in or out.
        </p>
      </div>
      <div className="p-6 space-y-6">
        <div className="flex justify-center gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-4 w-4 border-2 ${i < pin.length ? 'bg-cyan-500 border-cyan-400' : 'border-slate-600'}`}
            />
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              className="h-16 text-xl font-black bg-slate-800 border-2 border-slate-700 text-slate-100 active:bg-slate-700 active:border-slate-600 active:scale-[0.97] transition-all duration-75"
              onClick={() => handleNumpad(num.toString())}
            >
              {num}
            </button>
          ))}
          <div className="h-16" />
          <button
            className="h-16 text-xl font-black bg-slate-800 border-2 border-slate-700 text-slate-100 active:bg-slate-700 active:border-slate-600 active:scale-[0.97] transition-all duration-75"
            onClick={() => handleNumpad('0')}
          >
            0
          </button>
          <button
            className="h-16 font-black bg-rose-500/10 border-2 border-rose-500/30 text-rose-400 active:bg-rose-500/20 active:scale-[0.97] transition-all duration-75 uppercase tracking-wider text-xs"
            onClick={handleDelete}
          >
            DEL
          </button>
        </div>

        <button
          className="w-full h-14 text-lg font-black uppercase tracking-widest bg-cyan-500 text-slate-900 border-2 border-cyan-400 active:bg-cyan-400 active:scale-[0.97] transition-all duration-75 disabled:opacity-40"
          disabled={pin.length !== 4 || loading}
          onClick={handleSubmit}
        >
          {loading ? 'Processing...' : 'Submit PIN'}
        </button>
      </div>
    </div>
  );
}
