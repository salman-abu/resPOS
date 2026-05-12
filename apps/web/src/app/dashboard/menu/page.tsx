'use client';

import { useState } from 'react';
import { UtensilsCrossed, Plus, Search, Edit2, Trash2, ToggleLeft, ToggleRight, ChevronDown, Flame, Leaf, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

type Category = 'all' | 'Starters' | 'Mains' | 'Biryani' | 'Breads' | 'Desserts' | 'Beverages';

interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  isVeg: boolean;
  isSpicy?: boolean;
  isBestseller?: boolean;
  isActive: boolean;
  description: string;
}

const MENU_ITEMS: MenuItem[] = [
  { id: '1', name: 'Paneer Tikka', category: 'Starters', price: 280, isVeg: true, isSpicy: true, isBestseller: true, isActive: true, description: 'Marinated cottage cheese grilled in tandoor' },
  { id: '2', name: 'Chicken Tikka', category: 'Starters', price: 320, isVeg: false, isSpicy: true, isBestseller: true, isActive: true, description: 'Tender chicken pieces marinated in yogurt and spices' },
  { id: '3', name: 'Veg Spring Rolls', category: 'Starters', price: 180, isVeg: true, isActive: true, description: 'Crispy rolls filled with mixed vegetables' },
  { id: '4', name: 'Butter Chicken', category: 'Mains', price: 380, isVeg: false, isBestseller: true, isActive: true, description: 'Tender chicken in rich tomato-butter gravy' },
  { id: '5', name: 'Palak Paneer', category: 'Mains', price: 280, isVeg: true, isActive: true, description: 'Cottage cheese in creamy spinach gravy' },
  { id: '6', name: 'Dal Makhani', category: 'Mains', price: 220, isVeg: true, isActive: true, description: 'Slow-cooked black lentils with cream and butter' },
  { id: '7', name: 'Chicken Biryani', category: 'Biryani', price: 350, isVeg: false, isBestseller: true, isActive: true, description: 'Aromatic basmati rice with spiced chicken' },
  { id: '8', name: 'Veg Biryani', category: 'Biryani', price: 260, isVeg: true, isActive: false, description: 'Fragrant rice with mixed vegetables and spices' },
  { id: '9', name: 'Butter Naan', category: 'Breads', price: 60, isVeg: true, isActive: true, description: 'Soft leavened bread baked in tandoor with butter' },
  { id: '10', name: 'Garlic Roti', category: 'Breads', price: 50, isVeg: true, isActive: true, description: 'Whole wheat bread with garlic seasoning' },
  { id: '11', name: 'Gulab Jamun', category: 'Desserts', price: 120, isVeg: true, isBestseller: true, isActive: true, description: 'Soft milk dumplings in sugar syrup' },
  { id: '12', name: 'Mango Lassi', category: 'Beverages', price: 90, isVeg: true, isActive: true, description: 'Chilled yogurt drink with fresh mango' },
];

const CATEGORIES: Category[] = ['all', 'Starters', 'Mains', 'Biryani', 'Breads', 'Desserts', 'Beverages'];

export default function MenuPage() {
  const [items, setItems] = useState<MenuItem[]>(MENU_ITEMS);
  const [category, setCategory] = useState<Category>('all');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<MenuItem | null>(null);

  const filtered = items.filter(i => {
    const matchCat = category === 'all' || i.category === category;
    const matchSearch = i.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const toggleActive = (id: string) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, isActive: !i.isActive } : i));
  };

  const deleteItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-orange-500 flex items-center justify-center">
            <UtensilsCrossed className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-content-primary">Menu Manager</h1>
            <p className="text-sm text-content-muted">{items.filter(i => i.isActive).length} active items across {CATEGORIES.length - 1} categories</p>
          </div>
        </div>
        <button onClick={() => { setEditItem(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-colors shadow-sm">
          <Plus className="h-4 w-4" /> Add Item
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Items', value: items.length, color: 'text-slate-700' },
          { label: 'Active', value: items.filter(i => i.isActive).length, color: 'text-emerald-600' },
          { label: 'Inactive', value: items.filter(i => !i.isActive).length, color: 'text-red-500' },
          { label: 'Bestsellers', value: items.filter(i => i.isBestseller).length, color: 'text-amber-500' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-border p-4 shadow-sm">
            <p className={cn('text-2xl font-black', s.color)}>{s.value}</p>
            <p className="text-xs text-content-muted mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search + Category Filter */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-content-muted" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search menu items..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCategory(c)}
              className={cn('px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all capitalize',
                category === c ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-content-secondary border-border hover:border-brand-300')}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Table */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 border-b border-border">
            <tr>
              <th className="text-left px-5 py-3 text-content-muted font-semibold text-xs uppercase tracking-wide">Item</th>
              <th className="text-left px-4 py-3 text-content-muted font-semibold text-xs uppercase tracking-wide">Category</th>
              <th className="text-left px-4 py-3 text-content-muted font-semibold text-xs uppercase tracking-wide">Price</th>
              <th className="text-left px-4 py-3 text-content-muted font-semibold text-xs uppercase tracking-wide">Tags</th>
              <th className="text-left px-4 py-3 text-content-muted font-semibold text-xs uppercase tracking-wide">Status</th>
              <th className="text-right px-5 py-3 text-content-muted font-semibold text-xs uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map(item => (
              <tr key={item.id} className="hover:bg-surface-2 transition-colors">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <div className={cn('h-2 w-2 rounded-full flex-shrink-0', item.isVeg ? 'bg-emerald-500' : 'bg-red-500')} />
                    <div>
                      <p className="font-semibold text-content-primary">{item.name}</p>
                      <p className="text-xs text-content-muted truncate max-w-[200px]">{item.description}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <span className="px-2 py-0.5 rounded-lg bg-surface-3 text-content-secondary text-xs font-medium">{item.category}</span>
                </td>
                <td className="px-4 py-3.5 font-bold text-content-primary">₹{item.price}</td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-1">
                    {item.isVeg && <span className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-600 border border-emerald-200 font-semibold"><Leaf className="h-2.5 w-2.5" />VEG</span>}
                    {item.isSpicy && <span className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-md bg-red-50 text-red-500 border border-red-200 font-semibold"><Flame className="h-2.5 w-2.5" />HOT</span>}
                    {item.isBestseller && <span className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-600 border border-amber-200 font-semibold"><Star className="h-2.5 w-2.5" />BEST</span>}
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <button onClick={() => toggleActive(item.id)} className="flex items-center gap-1.5 text-xs font-semibold">
                    {item.isActive
                      ? <><ToggleRight className="h-5 w-5 text-emerald-500" /><span className="text-emerald-600">Active</span></>
                      : <><ToggleLeft className="h-5 w-5 text-slate-400" /><span className="text-slate-400">Inactive</span></>}
                  </button>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => { setEditItem(item); setShowForm(true); }}
                      className="h-8 w-8 rounded-lg bg-surface-2 border border-border flex items-center justify-center text-content-muted hover:text-brand-600 hover:border-brand-300 transition-colors">
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => deleteItem(item.id)}
                      className="h-8 w-8 rounded-lg bg-surface-2 border border-border flex items-center justify-center text-content-muted hover:text-red-500 hover:border-red-200 transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-content-muted">
            <UtensilsCrossed className="h-10 w-10 mx-auto mb-2 opacity-30" />
            <p className="font-semibold">No items found</p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-lg font-bold text-content-primary">{editItem ? 'Edit Item' : 'Add New Item'}</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-content-secondary mb-1 block">Item Name</label>
                <input defaultValue={editItem?.name} placeholder="e.g. Paneer Butter Masala"
                  className="w-full px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-content-secondary mb-1 block">Price (₹)</label>
                  <input type="number" defaultValue={editItem?.price} placeholder="0"
                    className="w-full px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-content-secondary mb-1 block">Category</label>
                  <div className="relative">
                    <select defaultValue={editItem?.category}
                      className="w-full appearance-none px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 bg-white">
                      {CATEGORIES.filter(c => c !== 'all').map(c => <option key={c}>{c}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-content-muted pointer-events-none" />
                  </div>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-content-secondary mb-1 block">Description</label>
                <textarea defaultValue={editItem?.description} rows={2} placeholder="Short description..."
                  className="w-full px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 resize-none" />
              </div>
              <div className="flex items-center gap-4 text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" defaultChecked={editItem?.isVeg} className="rounded" />
                  <span className="text-content-secondary">Vegetarian</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" defaultChecked={editItem?.isSpicy} className="rounded" />
                  <span className="text-content-secondary">Spicy</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" defaultChecked={editItem?.isBestseller} className="rounded" />
                  <span className="text-content-secondary">Bestseller</span>
                </label>
              </div>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button onClick={() => setShowForm(false)}
                className="flex-1 py-2.5 rounded-xl border border-border text-content-secondary text-sm font-semibold hover:bg-surface-2 transition-colors">
                Cancel
              </button>
              <button onClick={() => setShowForm(false)}
                className="flex-1 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-colors">
                {editItem ? 'Save Changes' : 'Add Item'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
