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
