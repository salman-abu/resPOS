import { create } from 'zustand';

interface TableOrder {
  id: string;
  status: string;
  created_at: string;
  pax_count?: number;
}

export interface TableData {
  id: string;
  table_number: string;
  capacity: number;
  status: string;
  orders: TableOrder[];
}

export interface Zone {
  id: string;
  name: string;
  tables: TableData[];
}

interface TableState {
  zones: Zone[];
  loading: boolean;
}

interface TableActions {
  setZones: (zones: Zone[]) => void;
  setLoading: (loading: boolean) => void;
  updateTableStatus: (tableId: string, status: string) => void;
}

export const useTableStore = create<TableState & TableActions>()((set) => ({
  zones: [],
  loading: false,

  setZones: (zones) => set({ zones }),
  setLoading: (loading) => set({ loading }),

  updateTableStatus: (tableId, status) =>
    set((state) => ({
      zones: state.zones.map((z) => ({
        ...z,
        tables: z.tables.map((t) => (t.id === tableId ? { ...t, status } : t)),
      })),
    })),
}));
