'use client';

import { useEffect, useState, useCallback } from 'react';
import { API_BASE } from '@/lib/api';
import { getAuthToken } from '@respos/utils';
import {
  ShieldAlert,
  ChevronRight,
  ChevronDown,
  FileText,
  Search,
  Download,
  Calendar,
  Filter,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  ArrowRightLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AuditLog {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  performed_by: string;
  authorized_by?: string;
  reason?: string;
  old_value?: any;
  new_value?: any;
  ip_address?: string;
  created_at: string;
}

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const ACTION_COLORS: Record<string, string> = {
  VOID_BILL: 'bg-red-100 text-red-700 border-red-200',
  DELETE_KOT: 'bg-rose-100 text-rose-700 border-rose-200',
  APPLY_DISCOUNT: 'bg-amber-100 text-amber-700 border-amber-200',
  REFUND: 'bg-orange-100 text-orange-700 border-orange-200',
  SHIFT_CLOSE: 'bg-blue-100 text-blue-700 border-blue-200',
  ITEM_86: 'bg-purple-100 text-purple-700 border-purple-200',
  PRICE_CHANGE: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  CASH_DRAWER_OPEN: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  TABLE_TRANSFER: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  SCREEN_LOCKED: 'bg-slate-100 text-slate-700 border-slate-200',
  SCREEN_UNLOCKED: 'bg-slate-100 text-slate-700 border-slate-200',
  PAYMENT_SETTLED: 'bg-green-100 text-green-700 border-green-200',
  INVOICE_SPLIT: 'bg-teal-100 text-teal-700 border-teal-200',
};

const ACTION_OPTIONS = [
  { value: '', label: 'All Actions' },
  { value: 'VOID_BILL', label: 'Void Bill' },
  { value: 'DELETE_KOT', label: 'Delete KOT' },
  { value: 'APPLY_DISCOUNT', label: 'Apply Discount' },
  { value: 'REFUND', label: 'Refund' },
  { value: 'PAYMENT_SETTLED', label: 'Payment Settled' },
  { value: 'INVOICE_SPLIT', label: 'Invoice Split' },
  { value: 'ITEM_86', label: 'Item 86' },
  { value: 'PRICE_CHANGE', label: 'Price Change' },
  { value: 'CASH_DRAWER_OPEN', label: 'Cash Drawer Open' },
  { value: 'TABLE_TRANSFER', label: 'Table Transfer' },
  { value: 'SCREEN_LOCKED', label: 'Screen Locked' },
  { value: 'SCREEN_UNLOCKED', label: 'Screen Unlocked' },
];

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 25,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      const params = new URLSearchParams();
      params.set('page', String(meta.page));
      params.set('limit', String(meta.limit));
      if (actionFilter) params.set('action', actionFilter);
      if (fromDate) params.set('from', new Date(fromDate).toISOString());
      if (toDate) params.set('to', new Date(toDate).toISOString());

      const res = await fetch(`${API_BASE}/audit?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setLogs(json.data || []);
        setMeta(json.meta || meta);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [meta.page, meta.limit, actionFilter, fromDate, toDate]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleExport = async () => {
    try {
      const token = getAuthToken();
      const params = new URLSearchParams();
      if (actionFilter) params.set('action', actionFilter);
      if (fromDate) params.set('from', new Date(fromDate).toISOString());
      if (toDate) params.set('to', new Date(toDate).toISOString());

      const res = await fetch(`${API_BASE}/audit/export?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredLogs = logs.filter(
    (log) =>
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entity_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.performed_by.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const goToPage = (page: number) => {
    if (page < 1 || page > meta.totalPages) return;
    setMeta((m) => ({ ...m, page }));
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-2xl bg-red-500/10 flex items-center justify-center">
              <ShieldAlert className="h-6 w-6 text-red-600" />
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
              Security Audit
            </h1>
          </div>
          <p className="text-sm text-slate-500 font-medium">
            Track sensitive actions, manager overrides, and accountability
            across all terminals.
          </p>
        </div>

        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 transition-colors"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
            Total Logs
          </p>
          <p className="text-2xl font-black text-slate-900">{meta.total}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-1">
            Critical Actions
          </p>
          <p className="text-2xl font-black text-red-600">
            {
              logs.filter((l) =>
                ['VOID_BILL', 'DELETE_KOT', 'REFUND'].includes(l.action),
              ).length
            }
          </p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
            Discounts Applied
          </p>
          <p className="text-2xl font-black text-amber-600">
            {logs.filter((l) => l.action === 'APPLY_DISCOUNT').length}
          </p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
            Active Users Tracked
          </p>
          <p className="text-2xl font-black text-slate-900">
            {new Set(logs.map((l) => l.performed_by)).size}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search action, entity, reason, or user ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all text-sm font-medium"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none"
          >
            {ACTION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-slate-400" />
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none"
          />
          <span className="text-slate-400 text-sm">to</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none"
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-10"></th>
                <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Action
                </th>
                <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Entity
                </th>
                <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Performed By
                </th>
                <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Reason / Notes
                </th>
                <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Timestamp
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-5 py-5">
                      <div className="h-8 bg-slate-100 rounded-lg animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <FileText className="h-10 w-10 text-slate-300" />
                      <p className="text-slate-500 font-bold text-lg">
                        No audit records found
                      </p>
                      <p className="text-slate-400 text-sm">
                        Try adjusting filters or search terms.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <>
                    <tr
                      key={log.id}
                      className="hover:bg-slate-50 transition-colors group cursor-pointer"
                      onClick={() =>
                        setExpandedId(expandedId === log.id ? null : log.id)
                      }
                    >
                      <td className="px-5 py-4">
                        <button className="p-1 rounded-md hover:bg-slate-200 transition-colors">
                          {expandedId === log.id ? (
                            <ChevronDown className="h-4 w-4 text-slate-500" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-slate-400" />
                          )}
                        </button>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={cn(
                            'px-2.5 py-1 rounded-full text-[10px] font-black border',
                            ACTION_COLORS[log.action] ||
                              'bg-slate-100 text-slate-700 border-slate-200',
                          )}
                        >
                          {log.action.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-900">
                            {log.entity_type}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {log.entity_id.slice(-8).toUpperCase()}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-black text-slate-600">
                            {log.performed_by.slice(0, 2).toUpperCase()}
                          </div>
                          <span className="text-sm font-medium text-slate-700">
                            {log.performed_by.slice(-8)}
                          </span>
                        </div>
                        {log.authorized_by && (
                          <span className="text-[10px] text-amber-600 font-bold mt-0.5 block">
                            Auth: {log.authorized_by.slice(-8)}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 max-w-xs">
                        <p className="text-xs text-slate-600 font-medium">
                          {log.reason || '—'}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-900">
                            {new Date(log.created_at).toLocaleDateString(
                              'en-IN',
                              {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              },
                            )}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(log.created_at).toLocaleTimeString(
                              'en-IN',
                              {
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                              },
                            )}
                          </span>
                        </div>
                      </td>
                    </tr>
                    {expandedId === log.id && (
                      <tr className="bg-slate-50/70">
                        <td colSpan={6} className="px-5 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {log.old_value && (
                              <div className="bg-white p-4 rounded-xl border border-slate-200">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                                  Old Value
                                </p>
                                <pre className="text-xs text-slate-600 font-mono overflow-auto max-h-40">
                                  {JSON.stringify(log.old_value, null, 2)}
                                </pre>
                              </div>
                            )}
                            {log.new_value && (
                              <div className="bg-white p-4 rounded-xl border border-slate-200">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                                  New Value
                                </p>
                                <pre className="text-xs text-slate-600 font-mono overflow-auto max-h-40">
                                  {JSON.stringify(log.new_value, null, 2)}
                                </pre>
                              </div>
                            )}
                            {log.ip_address && (
                              <div className="md:col-span-2 text-[10px] text-slate-400 font-mono">
                                IP: {log.ip_address}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta.totalPages > 0 && (
          <div className="px-5 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-slate-500 font-medium">
              Showing {(meta.page - 1) * meta.limit + 1}–
              {Math.min(meta.page * meta.limit, meta.total)} of {meta.total}{' '}
              records
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => goToPage(1)}
                disabled={meta.page === 1}
                className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              >
                <ChevronsLeft className="h-4 w-4 text-slate-600" />
              </button>
              <button
                onClick={() => goToPage(meta.page - 1)}
                disabled={meta.page === 1}
                className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              >
                <ChevronLeft className="h-4 w-4 text-slate-600" />
              </button>
              <span className="px-3 py-1.5 rounded-lg bg-slate-100 text-sm font-bold text-slate-700 min-w-[3rem] text-center">
                {meta.page}
              </span>
              <button
                onClick={() => goToPage(meta.page + 1)}
                disabled={meta.page === meta.totalPages}
                className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              >
                <ChevronRight className="h-4 w-4 text-slate-600" />
              </button>
              <button
                onClick={() => goToPage(meta.totalPages)}
                disabled={meta.page === meta.totalPages}
                className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              >
                <ChevronsRight className="h-4 w-4 text-slate-600" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
