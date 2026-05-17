'use client';

import { useState, useEffect, useCallback } from 'react';
import { API_BASE } from '@/lib/api';
import { getAuthToken } from '@respos/utils';
import {
  TableProperties,
  Plus,
  Trash2,
  Layers,
  Users,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Table {
  id: string;
  table_number: string;
  capacity: number;
  status: string;
}

interface Zone {
  id: string;
  name: string;
  tables: Table[];
}

export default function FloorPlanManagerPage() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [newZoneName, setNewZoneName] = useState('');
  const [addingTableTo, setAddingTableTo] = useState<string | null>(null);
  const [newTableNo, setNewTableNo] = useState('');
  const [newTableCap, setNewTableCap] = useState('4');

  const token = getAuthToken();

  const fetchZones = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/floor-plan/zones`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setZones(await res.json());
      }
    } catch (err) {
      setError('Failed to fetch floor plan');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchZones();
  }, [fetchZones]);

  const handleCreateZone = async () => {
    if (!newZoneName.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/floor-plan/zones`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newZoneName }),
      });
      if (res.ok) {
        setNewZoneName('');
        fetchZones();
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to create zone');
      }
    } catch (e) {
      setError('Network error');
    }
  };

  const handleDeleteZone = async (id: string) => {
    if (!confirm('Are you sure you want to delete this zone? Must be empty.'))
      return;
    try {
      const res = await fetch(`${API_BASE}/floor-plan/zones/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchZones();
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to delete zone');
      }
    } catch (e) {
      alert('Network error');
    }
  };

  const handleAddTable = async (zoneId: string) => {
    if (!newTableNo.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/floor-plan/zones/${zoneId}/tables`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          table_number: newTableNo,
          capacity: parseInt(newTableCap) || 4,
        }),
      });
      if (res.ok) {
        setAddingTableTo(null);
        setNewTableNo('');
        fetchZones();
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to add table');
      }
    } catch (e) {
      alert('Network error');
    }
  };

  const handleDeleteTable = async (id: string) => {
    if (!confirm('Are you sure you want to delete this table?')) return;
    try {
      const res = await fetch(`${API_BASE}/floor-plan/tables/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchZones();
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to delete table');
      }
    } catch (e) {
      alert('Network error');
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-content-primary">
            Floor Plan Manager
          </h1>
          <p className="text-sm text-content-muted">
            Configure zones and tables for your restaurant
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm border border-red-100">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      )}

      {/* Add Zone */}
      <div className="bg-white p-4 rounded-2xl border border-border flex items-end gap-4 shadow-sm">
        <div className="flex-1">
          <label className="text-xs font-semibold text-content-secondary mb-1 block">
            New Zone Name
          </label>
          <input
            value={newZoneName}
            onChange={(e) => setNewZoneName(e.target.value)}
            placeholder="e.g. Ground Floor, Rooftop, Patio"
            className="w-full px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
            onKeyDown={(e) => e.key === 'Enter' && handleCreateZone()}
          />
        </div>
        <button
          onClick={handleCreateZone}
          disabled={!newZoneName.trim()}
          className="px-6 py-2 rounded-xl bg-brand-600 text-white font-semibold text-sm hover:bg-brand-700 disabled:opacity-50 transition-colors flex items-center gap-2"
        >
          <Plus className="h-4 w-4" /> Add Zone
        </button>
      </div>

      {/* Zones List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
        </div>
      ) : (
        <div className="space-y-6">
          {zones.map((zone) => (
            <div
              key={zone.id}
              className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm"
            >
              {/* Zone Header */}
              <div className="bg-surface-1 px-5 py-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center border border-indigo-100">
                    <Layers className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-content-primary text-lg">
                      {zone.name}
                    </h3>
                    <p className="text-xs text-content-muted font-medium">
                      {zone.tables.length} tables configured
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setAddingTableTo(
                        addingTableTo === zone.id ? null : zone.id,
                      )
                    }
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm font-semibold hover:bg-surface-2 transition-colors text-content-primary"
                  >
                    <Plus className="h-4 w-4" /> Add Table
                  </button>
                  <button
                    onClick={() => handleDeleteZone(zone.id)}
                    className="h-8 w-8 rounded-lg flex items-center justify-center text-content-muted hover:text-danger hover:bg-danger/10 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Add Table Form Inline */}
              {addingTableTo === zone.id && (
                <div className="bg-indigo-50/50 px-5 py-4 border-b border-border flex items-end gap-4">
                  <div>
                    <label className="text-xs font-semibold text-content-secondary mb-1 block">
                      Table Number/Name
                    </label>
                    <input
                      value={newTableNo}
                      onChange={(e) => setNewTableNo(e.target.value)}
                      placeholder="e.g. T1, Balcony-1"
                      autoFocus
                      className="w-40 px-3 py-1.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-content-secondary mb-1 block">
                      Pax Capacity
                    </label>
                    <input
                      type="number"
                      value={newTableCap}
                      onChange={(e) => setNewTableCap(e.target.value)}
                      min="1"
                      className="w-24 px-3 py-1.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
                    />
                  </div>
                  <button
                    onClick={() => handleAddTable(zone.id)}
                    disabled={!newTableNo.trim()}
                    className="px-4 py-1.5 rounded-xl bg-brand-600 text-white font-semibold text-sm hover:bg-brand-700 disabled:opacity-50"
                  >
                    Save Table
                  </button>
                  <button
                    onClick={() => setAddingTableTo(null)}
                    className="px-4 py-1.5 rounded-xl border border-border text-content-secondary font-semibold text-sm hover:bg-surface-2"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {/* Tables Grid */}
              <div className="p-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {zone.tables.length === 0 ? (
                  <p className="text-sm text-content-muted col-span-full italic py-4">
                    No tables in this zone.
                  </p>
                ) : (
                  zone.tables.map((table) => (
                    <div
                      key={table.id}
                      className="relative group border border-border rounded-xl p-4 flex flex-col items-center justify-center gap-2 hover:border-brand-300 transition-colors bg-white"
                    >
                      <div className="h-10 w-10 rounded-full bg-surface-2 flex items-center justify-center">
                        <TableProperties className="h-5 w-5 text-content-secondary" />
                      </div>
                      <span className="font-bold text-content-primary">
                        {table.table_number}
                      </span>
                      <div className="flex items-center gap-1 text-[10px] font-bold text-content-muted bg-surface-2 px-2 py-0.5 rounded-full">
                        <Users className="h-3 w-3" /> {table.capacity}
                      </div>

                      {/* Delete Overlay */}
                      <button
                        onClick={() => handleDeleteTable(table.id)}
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-danger text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}

          {zones.length === 0 && (
            <div className="py-12 text-center bg-white rounded-2xl border border-dashed border-border flex flex-col items-center">
              <Layers className="h-12 w-12 text-content-disabled mb-4" />
              <p className="text-content-primary font-bold text-lg">
                No zones configured
              </p>
              <p className="text-sm text-content-muted mt-1 max-w-md">
                Create your first zone (like &quot;Main Dining Room&quot; or
                &quot;Patio&quot;) to start adding tables to your floor plan.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
