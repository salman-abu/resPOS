'use client';

import { useState } from 'react';
import { Package, Plus, Search, AlertTriangle, TrendingDown, Edit2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Ingredient {
  id: string;
  name: string;
  unit: string;
  currentStock: number;
  minStock: number;
  costPerUnit: number;
  category: string;
  lastUpdated: string;
}

const ITEMS: Ingredient[] = [
  { id: '1', name: 'Chicken (Boneless)', unit: 'kg', currentStock: 12, minStock: 5, costPerUnit: 280, category: 'Proteins', lastUpdated: '2 hrs ago' },
  { id: '2', name: 'Tomato Purée', unit: 'litre', currentStock: 1.5, minStock: 3, costPerUnit: 60, category: 'Sauces', lastUpdated: '5 hrs ago' },
  { id: '3', name: 'Fresh Cream', unit: 'litre', currentStock: 0.8, minStock: 2, costPerUnit: 120, category: 'Dairy', lastUpdated: '5 hrs ago' },
  { id: '4', name: 'Paneer', unit: 'kg', currentStock: 4, minStock: 3, costPerUnit: 320, category: 'Dairy', lastUpdated: '1 day ago' },
  { id: '5', name: 'Basmati Rice', unit: 'kg', currentStock: 25, minStock: 10, costPerUnit: 95, category: 'Grains', lastUpdated: '2 days ago' },
  { id: '6', name: 'Butter', unit: 'kg', currentStock: 3, minStock: 2, costPerUnit: 480, category: 'Dairy', lastUpdated: '1 day ago' },
  { id: '7', name: 'Kasuri Methi', unit: 'grams', currentStock: 80, minStock: 200, costPerUnit: 0.8, category: 'Spices', lastUpdated: '3 days ago' },
  { id: '8', name: 'Onions', unit: 'kg', currentStock: 18, minStock: 8, costPerUnit: 30, category: 'Vegetables', lastUpdated: '1 day ago' },
  { id: '9', name: 'Maida (Flour)', unit: 'kg', currentStock: 15, minStock: 5, costPerUnit: 45, category: 'Grains', lastUpdated: '2 days ago' },
  { id: '10', name: 'Yogurt', unit: 'kg', currentStock: 6, minStock: 4, costPerUnit: 80, category: 'Dairy', lastUpdated: '6 hrs ago' },
];

const STATUS = (item: Ingredient) => {
  const ratio = item.currentStock / item.minStock;
  if (ratio <= 0.5) return { label: 'Critical', color: 'text-red-600 bg-red-50 border-red-200', dot: 'bg-red-500' };
  if (ratio <= 1) return { label: 'Low', color: 'text-amber-600 bg-amber-50 border-amber-200', dot: 'bg-amber-500' };
  return { label: 'OK', color: 'text-emerald-600 bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500' };
};

export default function InventoryPage() {
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const lowStock = ITEMS.filter(i => i.currentStock <= i.minStock);
  const filtered = ITEMS.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-emerald-600 flex items-center justify-center">
            <Package className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-content-primary">Inventory</h1>
            <p className="text-sm text-content-muted">{ITEMS.length} ingredients tracked · {lowStock.length} low stock</p>
          </div>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-colors shadow-sm">
          <Plus className="h-4 w-4" /> Add Ingredient
        </button>
      </div>

      {/* Alert Banner */}
      {lowStock.length > 0 && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-50 border border-red-200">
          <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-red-700 text-sm">Stock Alert: {lowStock.length} items need restocking</p>
            <p className="text-red-600 text-xs mt-0.5">{lowStock.map(i => i.name).join(', ')}</p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Items', value: ITEMS.length, color: 'text-slate-700' },
          { label: 'OK', value: ITEMS.filter(i => i.currentStock > i.minStock).length, color: 'text-emerald-600' },
          { label: 'Low Stock', value: ITEMS.filter(i => i.currentStock > i.minStock * 0.5 && i.currentStock <= i.minStock).length, color: 'text-amber-500' },
          { label: 'Critical', value: ITEMS.filter(i => i.currentStock <= i.minStock * 0.5).length, color: 'text-red-500' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-border p-4 shadow-sm">
            <p className={cn('text-2xl font-black', s.color)}>{s.value}</p>
            <p className="text-xs text-content-muted mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-content-muted" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search ingredients..."
          className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 border-b border-border">
            <tr>
              <th className="text-left px-5 py-3 text-content-muted font-semibold text-xs uppercase tracking-wide">Ingredient</th>
              <th className="text-left px-4 py-3 text-content-muted font-semibold text-xs uppercase tracking-wide">Category</th>
              <th className="text-left px-4 py-3 text-content-muted font-semibold text-xs uppercase tracking-wide">Stock</th>
              <th className="text-left px-4 py-3 text-content-muted font-semibold text-xs uppercase tracking-wide">Min Level</th>
              <th className="text-left px-4 py-3 text-content-muted font-semibold text-xs uppercase tracking-wide">Cost/Unit</th>
              <th className="text-left px-4 py-3 text-content-muted font-semibold text-xs uppercase tracking-wide">Status</th>
              <th className="text-right px-5 py-3 text-content-muted font-semibold text-xs uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map(item => {
              const st = STATUS(item);
              return (
                <tr key={item.id} className={cn('transition-colors hover:bg-surface-2', item.currentStock <= item.minStock && 'bg-red-50/30')}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      {item.currentStock <= item.minStock && <TrendingDown className="h-3.5 w-3.5 text-red-400 flex-shrink-0" />}
                      <div>
                        <p className="font-semibold text-content-primary">{item.name}</p>
                        <p className="text-xs text-content-muted">Updated {item.lastUpdated}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="px-2 py-0.5 rounded-lg bg-surface-3 text-content-secondary text-xs font-medium">{item.category}</span>
                  </td>
                  <td className="px-4 py-3.5 font-bold text-content-primary">{item.currentStock} {item.unit}</td>
                  <td className="px-4 py-3.5 text-content-muted">{item.minStock} {item.unit}</td>
                  <td className="px-4 py-3.5 text-content-primary">₹{item.costPerUnit}</td>
                  <td className="px-4 py-3.5">
                    <span className={cn('flex items-center gap-1.5 text-xs font-bold px-2 py-0.5 rounded-full border w-fit', st.color)}>
                      <span className={cn('h-1.5 w-1.5 rounded-full', st.dot)} />
                      {st.label}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-2">
                      <button className="h-8 w-8 rounded-lg bg-surface-2 border border-border flex items-center justify-center text-content-muted hover:text-brand-600 hover:border-brand-300 transition-colors">
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button className="h-8 w-8 rounded-lg bg-surface-2 border border-border flex items-center justify-center text-content-muted hover:text-red-500 hover:border-red-200 transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-lg font-bold text-content-primary">Add Ingredient</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-content-secondary mb-1 block">Name</label>
                <input placeholder="e.g. Fresh Tomatoes" className="w-full px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-content-secondary mb-1 block">Unit</label>
                  <input placeholder="kg / litre / grams" className="w-full px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-content-secondary mb-1 block">Category</label>
                  <input placeholder="e.g. Vegetables" className="w-full px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-content-secondary mb-1 block">Current Stock</label>
                  <input type="number" placeholder="0" className="w-full px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-content-secondary mb-1 block">Min Stock Level</label>
                  <input type="number" placeholder="0" className="w-full px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-content-secondary mb-1 block">Cost per Unit (₹)</label>
                <input type="number" placeholder="0" className="w-full px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
              </div>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl border border-border text-content-secondary text-sm font-semibold hover:bg-surface-2 transition-colors">Cancel</button>
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-colors">Add Ingredient</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
