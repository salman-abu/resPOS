import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_BASE } from './api';

export type TableStatusPayload = {
  id: string;
  status: string;
  table_number: string;
};

export type TableSocketStatus =
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'error';

const API_URL = API_BASE.replace(/\/api\/v\d+$/, '');

const SOCKET_EVENTS = {
  TABLE_STATUS_CHANGED: 'table:status-changed',
} as const;

interface UseTableSocketOptions {
  tenantId: string;
  token?: string;
  onTableStatusChanged?: (payload: TableStatusPayload) => void;
}

export function useTableSocket({
  tenantId,
  token,
  onTableStatusChanged,
}: UseTableSocketOptions) {
  const socketRef = useRef<Socket | null>(null);
  const [status, setStatus] = useState<TableSocketStatus>('connecting');

  useEffect(() => {
    if (!tenantId) return;

    const socket = io(`${API_URL}/floor`, {
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
      socket.emit('subscribe_tenant', { tenantId });
    });

    socket.on('disconnect', () => setStatus('disconnected'));
    socket.on('connect_error', () => setStatus('error'));
    socket.on('reconnect', () => {
      setStatus('connected');
      socket.emit('subscribe_tenant', { tenantId });
    });

    socket.on(
      SOCKET_EVENTS.TABLE_STATUS_CHANGED,
      (payload: TableStatusPayload) => {
        onTableStatusChanged?.(payload);
      },
    );

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId, token]);

  const emit = useCallback((event: string, data: unknown) => {
    socketRef.current?.emit(event, data);
  }, []);

  return { status, emit };
}
