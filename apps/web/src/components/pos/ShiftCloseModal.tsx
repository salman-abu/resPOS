import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useShiftStore } from '@/store/shift';
import { useAuthStore } from '@/store/auth';
import { useRouter } from 'next/navigation';
import {
  Calculator,
  Printer,
  X,
  AlertCircle,
  Wine,
  ArrowRight,
  FileText,
  Send,
} from 'lucide-react';
import { API_BASE } from '@/lib/api';
import { getAuthToken } from '@respos/utils';

const API = API_BASE;

interface ShiftCloseModalProps {
  open: boolean;
  onClose: () => void;
}

export function ShiftCloseModal({ open, onClose }: ShiftCloseModalProps) {
  const router = useRouter();
  const { logout } = useAuthStore();
  const shift = useShiftStore();
  const [countedCash, setCountedCash] = useState('');
  const [isPrinting, setIsPrinting] = useState(false);
  const [openTabs, setOpenTabs] = useState<any[]>([]);
  const [fetchingTabs, setFetchingTabs] = useState(false);
  const [reportPreview, setReportPreview] = useState<any>(null);

  useEffect(() => {
    if (open) {
      setFetchingTabs(true);
      fetch(`${API}/orders/tabs`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      })
        .then((res) => res.json())
        .then((data) => setOpenTabs(data || []))
        .catch(console.error)
        .finally(() => setFetchingTabs(false));
    }
  }, [open]);

  if (!open) return null;

  const expectedCash = shift.openingFloat + shift.cashSales;
  const counted = Number(countedCash) || 0;
  const discrepancy = counted - expectedCash;
  const hasOpenTabs = openTabs.length > 0;

  const handlePrintAndClose = async () => {
    if (hasOpenTabs) return;
    setIsPrinting(true);
    try {
      // Generate shift report (MOD-09)
      const shiftId = shift.shiftId;
      if (shiftId) {
        const reportRes = await fetch(
          `${API}/shifts/${shiftId}/close-and-report`,
          {
            method: 'POST',
            headers: { Authorization: `Bearer ${getAuthToken()}` },
          },
        );
        if (reportRes.ok) {
          const report = await reportRes.json();
          setReportPreview(report);
        }
      }
      await new Promise((r) => setTimeout(r, 800));
      shift.closeShift();
      logout();
      router.replace('/login');
    } catch (err) {
      console.error('Failed to close shift:', err);
    } finally {
      setIsPrinting(false);
    }
  };

  const handleTransferTabs = async () => {
    if (confirm(`Transfer ${openTabs.length} open tabs to the next shift?`)) {
      setOpenTabs([]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-slate-900 border-2 border-slate-700 w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b-2 border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Calculator className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-100 uppercase tracking-widest">
                Close Shift (Z-Report)
              </h2>
              <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">
                Tally drawer and print final report
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-10 w-10 flex items-center justify-center bg-slate-800 border-2 border-slate-700 text-slate-400 active:bg-slate-700 active:text-slate-100 active:scale-[0.92] transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-900">
          {hasOpenTabs && !fetchingTabs && (
            <div className="bg-amber-500/10 border-2 border-amber-500/30 p-4">
              <div className="flex items-start gap-3">
                <Wine className="h-5 w-5 text-amber-400 mt-0.5" />
                <div>
                  <h3 className="font-black text-amber-400 uppercase tracking-wider">
                    You have {openTabs.length} open bar tabs
                  </h3>
                  <p className="text-sm text-amber-400/70 mt-1 mb-3 font-bold uppercase tracking-wider">
                    Shift close is blocked. You must either settle these tabs or
                    transfer them to the next staff member before you can close
                    your shift.
                  </p>
                  <button
                    onClick={handleTransferTabs}
                    className="flex items-center gap-2 bg-slate-800 border-2 border-amber-500/40 text-amber-400 px-4 py-2 text-sm font-black uppercase tracking-wider active:bg-amber-500/20 active:scale-[0.97] transition-all duration-75"
                  >
                    Transfer Tabs & Handover <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Sales Summary */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-slate-800 p-4 border-2 border-slate-700">
              <p className="text-xs text-slate-500 font-black uppercase tracking-wider mb-1">
                Total Orders
              </p>
              <p
                className="text-2xl font-black text-slate-100 font-mono tracking-tight"
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {shift.orderCount}
              </p>
            </div>
            <div className="bg-slate-800 p-4 border-2 border-slate-700">
              <p className="text-xs text-slate-500 font-black uppercase tracking-wider mb-1">
                Total Sales
              </p>
              <p
                className="text-2xl font-black text-cyan-400 font-mono tracking-tight"
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                ₹{shift.totalSales.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Cash Drawer Tally */}
          <div className="bg-slate-800 border-2 border-slate-700 overflow-hidden">
            <div className="px-4 py-3 bg-slate-950 border-b-2 border-slate-800 font-black text-sm text-slate-300 uppercase tracking-wider">
              Cash Drawer Tally
            </div>
            <div className="p-4 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400 text-xs font-black uppercase tracking-wider">
                  Opening Float
                </span>
                <span
                  className="font-bold text-slate-100 font-mono tracking-tight"
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                >
                  ₹{shift.openingFloat.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400 text-xs font-black uppercase tracking-wider">
                  Expected Cash
                </span>
                <span
                  className="font-black text-slate-100 font-mono tracking-tight"
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                >
                  ₹{expectedCash.toFixed(2)}
                </span>
              </div>

              <div className="pt-2 border-t-2 border-dashed border-slate-700">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">
                  Actual Counted Cash
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-black">
                    ₹
                  </span>
                  <input
                    type="number"
                    autoFocus
                    value={countedCash}
                    onChange={(e) => setCountedCash(e.target.value)}
                    placeholder="0.00"
                    disabled={hasOpenTabs}
                    className="w-full pl-8 pr-4 py-3 bg-slate-950 border-2 border-slate-700 text-lg font-black text-slate-100 outline-none focus:border-cyan-500 transition-all disabled:opacity-40 font-mono tracking-tight"
                    style={{ fontVariantNumeric: 'tabular-nums' }}
                  />
                </div>
              </div>

              {countedCash !== '' && !hasOpenTabs && (
                <div
                  className={cn(
                    'p-3 flex items-center gap-2 text-sm font-black border-2 uppercase tracking-wider',
                    discrepancy === 0
                      ? 'bg-lime-500/10 text-lime-400 border-lime-500/30'
                      : discrepancy > 0
                        ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/30',
                  )}
                >
                  <AlertCircle className="h-4 w-4" />
                  {discrepancy === 0
                    ? 'Drawer is perfectly balanced.'
                    : discrepancy > 0
                      ? `Drawer is over by ₹${Math.abs(discrepancy).toFixed(2)}`
                      : `Drawer is short by ₹${Math.abs(discrepancy).toFixed(2)}`}
                </div>
              )}
            </div>
          </div>

          {/* MOD-09: Report Preview */}
          {reportPreview && (
            <div className="bg-slate-800 border-2 border-slate-700 overflow-hidden">
              <div className="px-4 py-3 bg-slate-950 border-b-2 border-slate-800 font-black text-sm text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Shift Report Preview
              </div>
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-slate-500 text-xs font-bold uppercase">
                      Total Sales
                    </span>
                    <p className="font-bold text-slate-100">
                      ₹{(reportPreview.total_sales_paise / 100).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500 text-xs font-bold uppercase">
                      Orders
                    </span>
                    <p className="font-bold text-slate-100">
                      {reportPreview.total_orders}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500 text-xs font-bold uppercase">
                      Void Count
                    </span>
                    <p className="font-bold text-rose-400">
                      {reportPreview.void_count}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500 text-xs font-bold uppercase">
                      Cash / UPI / Card
                    </span>
                    <p className="font-bold text-slate-100">
                      ₹{(reportPreview.cash_paise / 100).toFixed(0)} / ₹
                      {(reportPreview.upi_paise / 100).toFixed(0)} / ₹
                      {(reportPreview.card_paise / 100).toFixed(0)}
                    </p>
                  </div>
                </div>
                {reportPreview.top_items &&
                  reportPreview.top_items.length > 0 && (
                    <div>
                      <span className="text-slate-500 text-xs font-bold uppercase block mb-1">
                        Top Items
                      </span>
                      <div className="space-y-1">
                        {reportPreview.top_items.map((item: any, i: number) => (
                          <div key={i} className="flex justify-between text-sm">
                            <span className="text-slate-300">{item.name}</span>
                            <span className="font-mono text-slate-400">
                              {item.count}x · ₹
                              {(item.revenuePaise / 100).toFixed(0)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-2 rounded">
                  <Send className="h-3 w-3" />
                  WhatsApp summary will be sent to owner
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-950 border-t-2 border-slate-800 grid grid-cols-2 gap-3">
          <button
            onClick={onClose}
            className="px-4 py-3 font-black text-slate-300 bg-slate-800 border-2 border-slate-700 active:bg-slate-700 active:text-slate-100 active:scale-[0.97] transition-all uppercase tracking-wider text-xs"
          >
            Cancel
          </button>
          <button
            onClick={handlePrintAndClose}
            disabled={isPrinting || countedCash === '' || hasOpenTabs}
            className="flex items-center justify-center gap-2 px-4 py-3 font-black text-slate-900 bg-cyan-500 border-2 border-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed active:bg-cyan-400 active:scale-[0.97] transition-all uppercase tracking-wider text-xs"
          >
            {isPrinting ? (
              <span className="animate-pulse">Printing...</span>
            ) : (
              <>
                <Printer className="h-4 w-4" />
                Print & Logout
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
