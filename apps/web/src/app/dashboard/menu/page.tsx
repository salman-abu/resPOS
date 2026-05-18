'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  UtensilsCrossed,
  Plus,
  Search,
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  ChevronDown,
  Flame,
  Leaf,
  Star,
  Tags,
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { API_BASE } from '@/lib/api';
import { getAuthToken } from '@respos/utils';

interface MenuItem {
  id: string;
  name: string;
  description?: string;
  base_price: number;
  is_available: boolean;
  item_type?: 'VEG' | 'NON_VEG' | 'EGG' | 'VEGAN';
  is_spicy?: boolean;
  is_bestseller?: boolean;
  category_id: string;
  category?: { id: string; name: string };
}

interface Category {
  id: string;
  name: string;
}

function getToken() {
  if (typeof window === 'undefined') return '';
  return getAuthToken();
}

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getToken()}`,
  };
}

const EMPTY_FORM = {
  name: '',
  description: '',
  price: '',
  category_id: '',
  item_type: 'VEG',
};

export default function MenuPage() {
  const [activeTab, setActiveTab] = useState<'items' | 'categories'>('items');
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Item form
  const [showItemForm, setShowItemForm] = useState(false);
  const [editItem, setEditItem] = useState<MenuItem | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Category form
  const [showCatForm, setShowCatForm] = useState(false);
  const [editCat, setEditCat] = useState<Category | null>(null);
  const [catInput, setCatInput] = useState('');
  const [catSaving, setCatSaving] = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [cRes, iRes] = await Promise.all([
        fetch(`${API_BASE}/menu/categories`, { headers: authHeaders() }),
        fetch(`${API_BASE}/menu/items`, { headers: authHeaders() }),
      ]);
      if (!cRes.ok || !iRes.ok) throw new Error('Failed to load menu data');
      const [cats, its] = await Promise.all([cRes.json(), iRes.json()]);
      setCategories(cats);
      setItems(its);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load menu');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Item handlers ──────────────────────────────────────────────────────────
  const openAddItem = () => {
    setEditItem(null);
    setForm({ ...EMPTY_FORM, category_id: categories[0]?.id ?? '' });
    setFormError('');
    setShowItemForm(true);
  };

  const openEditItem = (item: MenuItem) => {
    setEditItem(item);
    setForm({
      name: item.name,
      description: item.description ?? '',
      price: String(item.base_price / 100),
      category_id: item.category_id,
      item_type: item.item_type ?? 'VEG',
    });
    setFormError('');
    setShowItemForm(true);
  };

  const saveItem = async () => {
    if (!form.name.trim() || !form.price || !form.category_id) {
      setFormError('Name, price and category are required.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      const body = {
        name: form.name.trim(),
        description: form.description.trim(),
        price: Math.round(parseFloat(form.price) * 100),
        category_id: form.category_id,
        item_type: form.item_type,
      };
      const url = editItem
        ? `${API_BASE}/menu/items/${editItem.id}`
        : `${API_BASE}/menu/items`;
      const method = editItem ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: authHeaders(),
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? 'Save failed');
      }
      setShowItemForm(false);
      fetchData();
    } catch (e: any) {
      setFormError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleAvailable = async (item: MenuItem) => {
    // Optimistic UI
    setItems((prev) =>
      prev.map((i) =>
        i.id === item.id ? { ...i, is_available: !i.is_available } : i,
      ),
    );
    try {
      await fetch(`${API_BASE}/menu/items/${item.id}/availability`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ is_available: !item.is_available }),
      });
    } catch {
      // revert on failure
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, is_available: item.is_available } : i,
        ),
      );
    }
  };

  const deleteItem = async (id: string) => {
    if (!confirm('Delete this item?')) return;
    setItems((prev) => prev.filter((i) => i.id !== id));
    try {
      await fetch(`${API_BASE}/menu/items/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
    } catch {
      fetchData(); // re-sync on error
    }
  };

  // ── Category handlers ──────────────────────────────────────────────────────
  const saveCat = async () => {
    if (!catInput.trim()) return;
    setCatSaving(true);
    try {
      const url = editCat
        ? `${API_BASE}/menu/categories/${editCat.id}`
        : `${API_BASE}/menu/categories`;
      const method = editCat ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: authHeaders(),
        body: JSON.stringify({ name: catInput.trim() }),
      });
      if (!res.ok) throw new Error('Save failed');
      setShowCatForm(false);
      setCatInput('');
      setEditCat(null);
      fetchData();
    } catch {
      /* silent */
    } finally {
      setCatSaving(false);
    }
  };

  const deleteCat = async (cat: Category) => {
    if (!confirm(`Delete category "${cat.name}"? Items won't be deleted.`))
      return;
    setCategories((prev) => prev.filter((c) => c.id !== cat.id));
    try {
      await fetch(`${API_BASE}/menu/categories/${cat.id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
    } catch {
      fetchData();
    }
  };

  // ── Derived ────────────────────────────────────────────────────────────────
  const filteredItems = items.filter((i) => {
    const matchCat =
      categoryFilter === 'all' ||
      i.category_id === categoryFilter ||
      i.category?.id === categoryFilter;
    const matchSearch = i.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );

  if (error)
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <AlertCircle className="h-10 w-10 text-red-400" />
        <p className="text-content-secondary font-semibold">{error}</p>
        <button
          onClick={fetchData}
          className="px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-semibold"
        >
          Retry
        </button>
      </div>
    );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-orange-500 flex items-center justify-center">
            <UtensilsCrossed className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-content-primary">
              Menu Manager
            </h1>
            <p className="text-sm text-content-muted">
              {items.filter((i) => i.is_available).length} active items ·{' '}
              {categories.length} categories
            </p>
          </div>
        </div>
        {activeTab === 'items' ? (
          <button
            onClick={openAddItem}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" /> Add Item
          </button>
        ) : (
          <button
            onClick={() => {
              setEditCat(null);
              setCatInput('');
              setShowCatForm(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" /> Add Category
          </button>
        )}
        <button
          onClick={async () => {
            const res = await fetch(`${API_BASE}/menu/sync`, {
              method: 'POST',
              headers: authHeaders(),
            });
            if (res.ok) alert('Menu sync command sent to all outlets!');
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-sm font-bold hover:bg-slate-200 transition-colors border border-slate-200"
        >
          <RefreshCw className="h-4 w-4" />
          Sync All Outlets
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          {
            label: 'Total Items',
            value: items.length,
            color: 'text-slate-700',
          },
          {
            label: 'Categories',
            value: categories.length,
            color: 'text-blue-600',
          },
          {
            label: 'Active Items',
            value: items.filter((i) => i.is_available).length,
            color: 'text-emerald-600',
          },
          {
            label: 'Bestsellers',
            value: items.filter((i) => i.is_bestseller).length,
            color: 'text-amber-500',
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-2xl border border-border p-4 shadow-sm"
          >
            <p className={cn('text-2xl font-black', s.color)}>{s.value}</p>
            <p className="text-xs text-content-muted mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        {(['items', 'categories'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-6 py-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2',
              activeTab === tab
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-content-secondary hover:text-content-primary',
            )}
          >
            {tab === 'items' ? (
              <UtensilsCrossed className="h-4 w-4" />
            ) : (
              <Tags className="h-4 w-4" />
            )}
            {tab === 'items' ? 'Menu Items' : 'Categories'}
          </button>
        ))}
      </div>

      {/* ITEMS VIEW */}
      {activeTab === 'items' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-content-muted" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search menu items..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
              />
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => setCategoryFilter('all')}
                className={cn(
                  'px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all',
                  categoryFilter === 'all'
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'bg-white text-content-secondary border-border hover:border-brand-300',
                )}
              >
                All
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCategoryFilter(c.id)}
                  className={cn(
                    'px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all',
                    categoryFilter === c.id
                      ? 'bg-brand-600 text-white border-brand-600'
                      : 'bg-white text-content-secondary border-border hover:border-brand-300',
                  )}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-surface-2 border-b border-border">
                <tr>
                  {[
                    'Item',
                    'Category',
                    'Price',
                    'Tags',
                    'Status',
                    'Actions',
                  ].map((h, i) => (
                    <th
                      key={h}
                      className={cn(
                        'px-5 py-3 text-content-muted font-semibold text-xs uppercase tracking-wide',
                        i === 5 ? 'text-right' : 'text-left',
                      )}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredItems.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-surface-2 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            'h-2 w-2 rounded-full flex-shrink-0',
                            item.item_type === 'VEG'
                              ? 'bg-emerald-500'
                              : 'bg-red-500',
                          )}
                        />
                        <div>
                          <p className="font-semibold text-content-primary">
                            {item.name}
                          </p>
                          <p className="text-xs text-content-muted truncate max-w-[200px]">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="px-2 py-0.5 rounded-lg bg-surface-3 text-content-secondary text-xs font-medium">
                        {item.category?.name ??
                          categories.find((c) => c.id === item.category_id)
                            ?.name ??
                          '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-bold text-content-primary">
                      ₹{(item.base_price / 100).toFixed(0)}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1">
                        {item.item_type === 'VEG' && (
                          <span className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-600 border border-emerald-200 font-semibold">
                            <Leaf className="h-2.5 w-2.5" />
                            VEG
                          </span>
                        )}
                        {item.item_type !== 'VEG' && (
                          <span className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-md bg-red-50 text-red-500 border border-red-200 font-semibold">
                            <Flame className="h-2.5 w-2.5" />
                            NON-VEG
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <button
                        onClick={() => toggleAvailable(item)}
                        className="flex items-center gap-1.5 text-xs font-semibold"
                      >
                        {item.is_available ? (
                          <>
                            <ToggleRight className="h-5 w-5 text-emerald-500" />
                            <span className="text-emerald-600">Active</span>
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="h-5 w-5 text-slate-400" />
                            <span className="text-slate-400">Inactive</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditItem(item)}
                          className="h-8 w-8 rounded-lg bg-surface-2 border border-border flex items-center justify-center text-content-muted hover:text-brand-600 hover:border-brand-300 transition-colors"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => deleteItem(item.id)}
                          className="h-8 w-8 rounded-lg bg-surface-2 border border-border flex items-center justify-center text-content-muted hover:text-red-500 hover:border-red-200 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredItems.length === 0 && (
              <div className="text-center py-12 text-content-muted">
                <UtensilsCrossed className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="font-semibold">No items found</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CATEGORIES VIEW */}
      {activeTab === 'categories' && (
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-2 border-b border-border">
              <tr>
                {['Category Name', 'Items Count', 'Actions'].map((h, i) => (
                  <th
                    key={h}
                    className={cn(
                      'px-5 py-3 text-content-muted font-semibold text-xs uppercase tracking-wide',
                      i === 2 ? 'text-right' : 'text-left',
                    )}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {categories.map((cat) => (
                <tr
                  key={cat.id}
                  className="hover:bg-surface-2 transition-colors"
                >
                  <td className="px-5 py-3.5 font-semibold text-content-primary">
                    {cat.name}
                  </td>
                  <td className="px-4 py-3.5 text-content-secondary">
                    {items.filter((i) => i.category_id === cat.id).length} items
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setEditCat(cat);
                          setCatInput(cat.name);
                          setShowCatForm(true);
                        }}
                        className="h-8 w-8 rounded-lg bg-surface-2 border border-border flex items-center justify-center text-content-muted hover:text-brand-600 hover:border-brand-300 transition-colors"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => deleteCat(cat)}
                        className="h-8 w-8 rounded-lg bg-surface-2 border border-border flex items-center justify-center text-content-muted hover:text-red-500 hover:border-red-200 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {categories.length === 0 && (
            <div className="text-center py-12 text-content-muted">
              <Tags className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="font-semibold">No categories yet</p>
            </div>
          )}
        </div>
      )}

      {/* ITEM MODAL */}
      {showItemForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-lg font-bold text-content-primary">
              {editItem ? 'Edit Item' : 'Add New Item'}
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-content-secondary mb-1 block">
                  Item Name *
                </label>
                <input
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="e.g. Paneer Butter Masala"
                  className="w-full px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-content-secondary mb-1 block">
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, price: e.target.value }))
                    }
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-content-secondary mb-1 block">
                    Category *
                  </label>
                  <div className="relative">
                    <select
                      value={form.category_id}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, category_id: e.target.value }))
                      }
                      className="w-full appearance-none px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 bg-white"
                    >
                      <option value="">Select...</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-content-muted pointer-events-none" />
                  </div>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-content-secondary mb-1 block">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  rows={2}
                  placeholder="Short description..."
                  className="w-full px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 resize-none"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-content-secondary block">
                  Dietary Preference
                </label>
                <div className="flex items-center gap-4 text-sm">
                  {(
                    [
                      ['VEG', 'Vegetarian'],
                      ['NON_VEG', 'Non-Vegetarian'],
                      ['EGG', 'Egg'],
                      ['VEGAN', 'Vegan'],
                    ] as const
                  ).map(([value, label]) => (
                    <label
                      key={value}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="item_type"
                        value={value}
                        checked={form.item_type === value}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, item_type: e.target.value }))
                        }
                        className="rounded-full text-brand-600 focus:ring-brand-500"
                      />
                      <span className="text-content-secondary">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
              {formError && (
                <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">
                  {formError}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setShowItemForm(false)}
                className="flex-1 py-2.5 rounded-xl border border-border text-content-secondary text-sm font-semibold hover:bg-surface-2 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveItem}
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editItem ? 'Save Changes' : 'Add Item'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CATEGORY MODAL */}
      {showCatForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <h2 className="text-lg font-bold text-content-primary">
              {editCat ? 'Edit Category' : 'Add New Category'}
            </h2>
            <div>
              <label className="text-xs font-semibold text-content-secondary mb-1 block">
                Category Name
              </label>
              <input
                value={catInput}
                onChange={(e) => setCatInput(e.target.value)}
                placeholder="e.g. Soups"
                autoFocus
                className="w-full px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowCatForm(false)}
                className="flex-1 py-2.5 rounded-xl border border-border text-content-secondary text-sm font-semibold hover:bg-surface-2 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveCat}
                disabled={!catInput.trim() || catSaving}
                className="flex-1 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {catSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editCat ? 'Save Changes' : 'Add Category'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
