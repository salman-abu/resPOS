import { create } from 'zustand';
import type { Category, MenuItem } from '@respos/types';

interface MenuState {
  categories: Category[];
  items: MenuItem[];
  loading: boolean;
  initialized: boolean;
}

interface MenuActions {
  setMenu: (categories: Category[], items: MenuItem[]) => void;
  setLoading: (loading: boolean) => void;
  updateItemAvailability: (itemId: string, isAvailable: boolean) => void;
}

export const useMenuStore = create<MenuState & MenuActions>((set) => ({
  categories: [],
  items: [],
  loading: false,
  initialized: false,

  setMenu: (categories, items) =>
    set({ categories, items, loading: false, initialized: true }),

  setLoading: (loading) => set({ loading }),

  updateItemAvailability: (itemId, isAvailable) =>
    set((state) => ({
      items: state.items.map((i) =>
        i.id === itemId ? { ...i, is_available: isAvailable } : i,
      ),
    })),
}));
