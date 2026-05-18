/**
 * Single source of truth for the API base URL and all HTTP calls.
 * All components must use these named functions — never raw fetch/axios.
 */

import { getAuthToken } from '@respos/utils';

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

function getToken(): string {
  if (typeof window === 'undefined') return '';
  return getAuthToken();
}

function authHeaders(
  extra: Record<string, string> = {},
): Record<string, string> {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  retries = 2,
): Promise<T> {
  const url = `${API_BASE}${path}`;
  let lastError: Error = new Error('Request failed');

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        ...options,
        headers: {
          ...authHeaders(),
          ...((options.headers as Record<string, string>) ?? {}),
        },
      });

      // Do not retry 4xx — only network errors get retried
      if (!res.ok && res.status >= 400 && res.status < 500) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message ?? `HTTP ${res.status}`);
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      if (res.status === 204) return undefined as unknown as T;
      return res.json() as Promise<T>;
    } catch (err) {
      lastError = err as Error;
      if (attempt < retries)
        await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
    }
  }
  throw lastError;
}

import type {
  Category,
  MenuItem,
  Order,
  Invoice,
  TableRow,
  AuthUser,
} from '@respos/types';

// ─── Menu ─────────────────────────────────────────────────────────────────────
export const getMenuCategories = () => request<Category[]>('/menu/categories');
export const getMenuItems = () => request<MenuItem[]>('/menu/items');

// ─── Orders ───────────────────────────────────────────────────────────────────
export const getActiveOrder = (tableId: string) =>
  request<Order>(`/orders/active?table_id=${tableId}`);
export const createOrder = (body: any) =>
  request<Order>('/orders', { method: 'POST', body: JSON.stringify(body) });
export const fireKot = (orderId: string, body: { item_ids: string[] }) =>
  request<any>(`/orders/${orderId}/kot`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
export const scheduleVoidItem = (orderId: string, itemId: string) =>
  request<{ job_id: string; undo_window_ms: number }>(
    `/orders/${orderId}/void-item`,
    {
      method: 'POST',
      body: JSON.stringify({ item_id: itemId }),
    },
  );
export const cancelVoidJob = (jobId: string) =>
  request<{ cancelled: boolean }>(`/void-job/${jobId}`, { method: 'DELETE' });

// ─── Tables ───────────────────────────────────────────────────────────────────
export const getTablesWithZones = () => request<any[]>('/billing/tables');
export const patchTableStatus = (tableId: string, status: string) =>
  request<TableRow>(`/floor-plan/tables/${tableId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });

// ─── Billing ──────────────────────────────────────────────────────────────────
export const getInvoice = (invoiceId: string) =>
  request<Invoice>(`/billing/invoice/${invoiceId}`);

// ─── Staff ────────────────────────────────────────────────────────────────────
export const getStaffUsers = () => request<AuthUser[]>('/staff/users');
export const createStaffUser = (body: any) =>
  request<AuthUser>('/staff/users', {
    method: 'POST',
    body: JSON.stringify(body),
  });
export const updateStaffUser = (id: string, body: any) =>
  request<AuthUser>(`/staff/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });

// ─── KDS ──────────────────────────────────────────────────────────────────────
export const getKotTickets = (station: string) =>
  request<any[]>(`/kds/tickets?station=${station}`);
export const bumpKot = (kotId: string) =>
  request<any>(`/kds/tickets/${kotId}/bump`, { method: 'PATCH' });
export const markKotItemDone = (kotId: string, itemId: string, done: boolean) =>
  request<any>(`/kds/tickets/${kotId}/items/${itemId}`, {
    method: 'PATCH',
    body: JSON.stringify({ done }),
  });

// ─── Shift / Z-Report ─────────────────────────────────────────────────────────
export const getZReport = (shiftId: string) =>
  request<any>(`/shifts/${shiftId}/z-report`);
export const closeShift = (shiftId: string) =>
  request<any>(`/shifts/${shiftId}/close`, { method: 'POST' });

// ─── Floor Plan (admin) ────────────────────────────────────────────────────────
export const getFloorPlanZones = () => request<any[]>('/floor-plan/zones');
export const createZone = (body: any) =>
  request<any>('/floor-plan/zones', {
    method: 'POST',
    body: JSON.stringify(body),
  });
export const deleteZone = (zoneId: string) =>
  request<any>(`/floor-plan/zones/${zoneId}`, { method: 'DELETE' });
export const createTable = (zoneId: string, body: any) =>
  request<TableRow>(`/floor-plan/zones/${zoneId}/tables`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
export const deleteTable = (tableId: string) =>
  request<any>(`/floor-plan/tables/${tableId}`, { method: 'DELETE' });

// ─── MOD-06: Training Mode ──────────────────────────────────────────────────
export const startTraining = (terminalId: string) =>
  request<any>('/training/start', {
    method: 'POST',
    body: JSON.stringify({ terminal_id: terminalId }),
  });
export const endTraining = (terminalId: string) =>
  request<any>('/training/end', {
    method: 'POST',
    body: JSON.stringify({ terminal_id: terminalId }),
  });
export const getTrainingStatus = (terminalId: string) =>
  request<any>('/training/status', {
    method: 'GET',
    headers: {
      'x-terminal-id': terminalId,
    },
  });

// ─── MOD-07: One-Tap Re-Order ─────────────────────────────────────────────────
export const getCustomerOrderHistory = (phone: string) =>
  request<any[]>(`/customers/${encodeURIComponent(phone)}/order-history`);
export const loadOrderTemplate = (historyId: string) =>
  request<any>('/orders/load-template', {
    method: 'POST',
    body: JSON.stringify({ history_id: historyId }),
  });

// ─── MOD-10: FSSAI Compliance ───────────────────────────────────────────────
export const getFssaiSettings = () => request<any>('/tenant/settings/fssai');
export const updateFssaiSettings = (body: {
  licence_number: string;
  expiry_date: string;
}) =>
  request<any>('/tenant/settings/fssai', {
    method: 'PATCH',
    body: JSON.stringify(body),
  });

// ─── MOD-09: Shift Reports ──────────────────────────────────────────────────
export const closeShiftAndReport = (shiftId: string) =>
  request<any>(`/shifts/${shiftId}/close-and-report`, { method: 'POST' });
export const getShiftReports = (page = 1, limit = 20) =>
  request<any>(`/shifts/reports?page=${page}&limit=${limit}`);

// ─── MOD-05: Menu Engineering ───────────────────────────────────────────────
export const getMenuEngineering = (from?: string, to?: string) => {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const qs = params.toString();
  return request<any>(`/analytics/menu-engineering${qs ? '?' + qs : ''}`);
};

// ─── MOD-11: Digital Menu Board ─────────────────────────────────────────────
export const getDisplayMenu = (tenantSlug: string) =>
  request<any>(`/display/${tenantSlug}/menu`);
export const getDisplayBanner = (tenantSlug: string) =>
  request<any>(`/display/${tenantSlug}/banner`);
export const setDisplayBanner = (body: { text: string; imageUrl?: string }) =>
  request<any>('/display/special-banner', {
    method: 'POST',
    body: JSON.stringify(body),
  });
export const clearDisplayBanner = () =>
  request<any>('/display/special-banner', { method: 'DELETE' });

// ─── MOD-02: Loyalty + Digital Stamps ───────────────────────────────────────
export const getLoyaltyByPhone = (phone: string) =>
  request<any>(`/loyalty/${encodeURIComponent(phone)}`);
export const createStampCard = (body: any) =>
  request<any>('/stamp-cards', { method: 'POST', body: JSON.stringify(body) });
export const getStampCards = () => request<any[]>('/stamp-cards');
export const toggleStampCard = (id: string) =>
  request<any>(`/stamp-cards/${id}/toggle`, { method: 'PATCH' });

// ─── MOD-08: Smart Upsell ───────────────────────────────────────────────────
export const getUpsellSuggestions = (cartItemIds: string[]) =>
  request<any>(`/upsell/suggestions?cartItems=${cartItemIds.join(',')}`);
export const acceptUpsell = (body: { itemId: string; cartItemIds: string[] }) =>
  request<any>('/upsell/accepted', {
    method: 'POST',
    body: JSON.stringify(body),
  });

// ─── MOD-01: WhatsApp Ordering ─────────────────────────────────────────────
export const getTableQrToken = (tableId: string) =>
  request<any>(`/tables/${tableId}/qr-token`);
export const regenerateTableQrToken = (tableId: string) =>
  request<any>(`/tables/${tableId}/qr-token`, { method: 'POST' });

// ─── MOD-03: Reservations ───────────────────────────────────────────────────
export const getReservations = (date?: string) =>
  request<any[]>(`/reservations${date ? `?date=${date}` : ''}`);
export const createReservation = (body: any) =>
  request<any>('/reservations', { method: 'POST', body: JSON.stringify(body) });
export const updateReservationStatus = (id: string, status: string) =>
  request<any>(`/reservations/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
export const getReservationAvailability = (date: string, partySize: number) =>
  request<any>(
    `/reservations/availability?date=${date}&partySize=${partySize}`,
  );
export const getWaitlist = () => request<any[]>('/waitlist');
export const addToWaitlist = (body: any) =>
  request<any>('/waitlist', { method: 'POST', body: JSON.stringify(body) });
export const seatWaitlistEntry = (id: string) =>
  request<any>(`/waitlist/${id}/seat`, { method: 'PATCH' });
export const getReservationSettings = () =>
  request<any>('/reservations/settings');
export const updateReservationSettings = (body: any) =>
  request<any>('/reservations/settings', {
    method: 'PUT',
    body: JSON.stringify(body),
  });

// ─── MOD-12: Kiosk Ordering ────────────────────────────────────────────────
export const getKioskConfig = (kioskId: string) =>
  request<any>(`/kiosk/${kioskId}/init`);
export const startKioskSession = (kioskId: string, body: any) =>
  request<any>(`/kiosk/${kioskId}/session/start`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
export const updateKioskCart = (sessionId: string, body: any) =>
  request<any>(`/kiosk/session/${sessionId}/cart`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
export const getKioskUpsell = (sessionId: string, cartItemIds: string[]) =>
  request<any>(
    `/kiosk/session/${sessionId}/upsell?cartItemIds=${cartItemIds.join(',')}`,
  );
export const initiateKioskPayment = (sessionId: string, body: any) =>
  request<any>(`/kiosk/session/${sessionId}/payment/initiate`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
export const confirmKioskPayment = (sessionId: string, body: any) =>
  request<any>(`/kiosk/session/${sessionId}/payment/confirm`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
export const abandonKioskSession = (sessionId: string, reason: string) =>
  request<any>(`/kiosk/session/${sessionId}/abandon`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
export const kioskHeartbeat = (kioskId: string) =>
  request<any>(`/kiosk/${kioskId}/heartbeat`, { method: 'POST' });
export const verifyKioskPin = (kioskId: string, pin: string) =>
  request<any>(`/kiosk/${kioskId}/verify-pin`, {
    method: 'POST',
    body: JSON.stringify({ pin }),
  });

// Owner kiosk management
export const getOwnerKiosks = () => request<any[]>('/owner/kiosks');
export const createKiosk = (body: any) =>
  request<any>('/owner/kiosks', { method: 'POST', body: JSON.stringify(body) });
export const updateKiosk = (kioskId: string, body: any) =>
  request<any>(`/owner/kiosks/${kioskId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
export const updateKioskStatus = (kioskId: string, status: string) =>
  request<any>(`/owner/kiosks/${kioskId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
export const getKioskAnalytics = (kioskId: string, from: string, to: string) =>
  request<any>(`/owner/kiosks/${kioskId}/analytics?from=${from}&to=${to}`);
