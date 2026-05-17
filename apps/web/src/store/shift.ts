import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ShiftState {
  shiftId: string | null;
  openingFloat: number;
  startedAt: string | null;
  totalSales: number;
  cashSales: number;
  cardSales: number;
  upiSales: number;
  orderCount: number;
}

interface ShiftActions {
  openShift: (shiftId: string, float: number) => void;
  closeShift: () => void;
  recordSale: (amount: number, method: 'CASH' | 'CARD' | 'UPI') => void;
}

export const useShiftStore = create<ShiftState & ShiftActions>()(
  persist(
    (set) => ({
      shiftId: null,
      openingFloat: 0,
      startedAt: null,
      totalSales: 0,
      cashSales: 0,
      cardSales: 0,
      upiSales: 0,
      orderCount: 0,

      openShift: (shiftId, float) =>
        set({
          shiftId,
          openingFloat: float,
          startedAt: new Date().toISOString(),
        }),

      closeShift: () =>
        set({
          shiftId: null,
          openingFloat: 0,
          startedAt: null,
          totalSales: 0,
          cashSales: 0,
          cardSales: 0,
          upiSales: 0,
          orderCount: 0,
        }),

      recordSale: (amount, method) =>
        set((state) => ({
          totalSales: state.totalSales + amount,
          cashSales:
            method === 'CASH' ? state.cashSales + amount : state.cashSales,
          cardSales:
            method === 'CARD' ? state.cardSales + amount : state.cardSales,
          upiSales: method === 'UPI' ? state.upiSales + amount : state.upiSales,
          orderCount: state.orderCount + 1,
        })),
    }),
    { name: 'rpos-shift' },
  ),
);
