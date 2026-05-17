'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { API_BASE } from '@/lib/api';
import { getAuthToken } from '@respos/utils';
import {
  getUnsyncedEvents,
  getUnsyncedEventCount,
  markEventsSynced,
  clearSyncedEvents,
  setLastSync,
  getLastSync,
} from '@/lib/db';
// LocalOrderEvent type is available in db.ts if needed

const SYNC_INTERVAL_MS = 30_000; // 30 seconds
const SOCKET_URL = API_BASE.replace('/api/v1', '');

interface UseSyncResult {
  isOnline: boolean;
  isSyncing: boolean;
  unsyncedCount: number;
  lastSyncAt: number;
  syncNow: () => Promise<void>;
}

export function useSync(tenantId?: string): UseSyncResult {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  );
  const [isSyncing, setIsSyncing] = useState(false);
  const [unsyncedCount, setUnsyncedCount] = useState(0);
  const [lastSyncAt, setLastSyncAt] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const socketRef = useRef<ReturnType<typeof io> | null>(null);

  // Monitor network state
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load last sync timestamp from Dexie
  useEffect(() => {
    getLastSync('events').then((ts) => setLastSyncAt(ts));
  }, []);

  // Count unsynced events
  const refreshCount = useCallback(async () => {
    const count = await getUnsyncedEventCount();
    setUnsyncedCount(count);
  }, []);

  useEffect(() => {
    refreshCount();
  }, [refreshCount]);

  // Flush events to server
  const flushEvents = useCallback(async () => {
    if (!isOnline) return;
    const events = await getUnsyncedEvents();
    if (events.length === 0) return;

    const token = getAuthToken();
    if (!token) return;

    setIsSyncing(true);
    try {
      const res = await fetch(`${API_BASE}/sync/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          events: events.map((e) => ({ ...e, is_synced: undefined })),
        }),
      });

      if (!res.ok) {
        throw new Error(`Sync failed: ${res.status}`);
      }

      const data = await res.json();

      // Mark successfully synced events
      const syncedIds = events.map((e) => e.id);
      await markEventsSynced(syncedIds);
      await clearSyncedEvents(); // cleanup old synced events

      const now = Date.now();
      await setLastSync('events', now);
      setLastSyncAt(now);
      setUnsyncedCount(0);

      // Handle conflicts if any
      if (data.conflicts?.length > 0) {
        console.warn('Sync conflicts:', data.conflicts);
      }
    } catch (err) {
      console.error('Sync error:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline]);

  // Periodic sync
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(flushEvents, SYNC_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [flushEvents]);

  // Also sync immediately when coming back online
  useEffect(() => {
    if (isOnline) {
      flushEvents();
    }
  }, [isOnline, flushEvents]);

  // Socket.io: subscribe to order state updates
  useEffect(() => {
    if (!tenantId) return;
    const token = getAuthToken();
    const socket = io(`${SOCKET_URL}/kds`, {
      transports: ['websocket'],
      auth: { token },
    });
    socketRef.current = socket;

    socket.emit('subscribe_station', { tenantId, station: 'ALL' });

    socket.on('order:state', (state: any) => {
      // Update local Dexie order state
      import('@/lib/db').then((db) => {
        db.upsertLocalOrder({
          id: state.id,
          tenant_id: tenantId,
          table_id: state.table_id,
          order_type: state.order_type,
          status: state.status,
          items: JSON.stringify(state.order_items || []),
          pax_count: state.pax_count || 1,
          updated_at: Date.now(),
          is_draft: state.status === 'DRAFT',
        }).catch(console.error);
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [tenantId]);

  const syncNow = useCallback(async () => {
    await flushEvents();
  }, [flushEvents]);

  return {
    isOnline,
    isSyncing,
    unsyncedCount,
    lastSyncAt,
    syncNow,
  };
}
