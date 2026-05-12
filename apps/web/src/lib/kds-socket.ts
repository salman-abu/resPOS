import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface KdsItem {
  id: string;
  name: string;
  variant?: string;
  quantity: number;
  notes?: string;
  status: string; // PENDING | SENT_TO_KDS | READY | SERVED
}

export interface KdsTicket {
  id: string;
  kot_number: string;
  station: string;
  status: string; // PRINTED | PREPARING | READY
  order_id: string;
  order_type: string;
  table_number?: string;
  pax_count?: number;
  created_at: string;
  items: KdsItem[];
  recalled?: boolean;
  priority?: boolean;
}

export type ConnectionStatus =
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'error';

interface UseKdsSocketOptions {
  tenantId: string;
  station: string; // 'ALL' | 'HOT_KITCHEN' | 'COLD_KITCHEN' | 'BAR' | 'BAKERY'
  token?: string;
  onNewKot?: (kot: KdsTicket) => void;
  onKotBumped?: (kotId: string) => void;
  onItemDone?: (kotId: string, itemId: string, done: boolean) => void;
  onKotStatus?: (kotId: string, status: string) => void;
}

const API_URL =
  typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_URL
    ? process.env.NEXT_PUBLIC_API_URL
    : 'http://localhost:3001';

export function useKdsSocket({
  tenantId,
  station,
  token,
  onNewKot,
  onKotBumped,
  onItemDone,
  onKotStatus,
}: UseKdsSocketOptions) {
  const socketRef = useRef<Socket | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>('connecting');

  useEffect(() => {
    if (!tenantId) return;

    const socket = io(`${API_URL}/kds`, {
      transports: ['websocket', 'polling'],
      auth: token ? { token } : undefined,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setStatus('connected');
      // Subscribe to the station room
      socket.emit('subscribe_station', { tenantId, station });
    });

    socket.on('disconnect', () => setStatus('disconnected'));
    socket.on('connect_error', () => setStatus('error'));
    socket.on('reconnect', () => {
      setStatus('connected');
      socket.emit('subscribe_station', { tenantId, station });
    });

    // ── Domain events ──
    socket.on('kot:new', (kot: KdsTicket) => {
      onNewKot?.(kot);
    });

    socket.on('kot:bumped', ({ kot_id }: { kot_id: string }) => {
      onKotBumped?.(kot_id);
    });

    socket.on(
      'kot:item_done',
      ({
        kot_id,
        item_id,
        done,
      }: {
        kot_id: string;
        item_id: string;
        done: boolean;
      }) => {
        onItemDone?.(kot_id, item_id, done);
      },
    );

    socket.on(
      'kot:status',
      ({ kot_id, status: s }: { kot_id: string; status: string }) => {
        onKotStatus?.(kot_id, s);
      },
    );

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId, station, token]);

  // Re-subscribe when station changes (without reconnecting)
  useEffect(() => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('subscribe_station', { tenantId, station });
    }
  }, [station, tenantId]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const emit = useCallback((event: string, data: any) => {
    socketRef.current?.emit(event, data);
  }, []);

  return { status, emit };
}
