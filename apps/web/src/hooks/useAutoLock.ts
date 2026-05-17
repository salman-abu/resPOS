'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { API_BASE } from '@/lib/api';
import { getAuthToken } from '@respos/utils';

const DEFAULT_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

interface AutoLockOptions {
  timeoutMs?: number;
  enabled?: boolean;
  tenantId?: string;
  userId?: string;
}

export function useAutoLock(options: AutoLockOptions = {}) {
  const {
    timeoutMs = DEFAULT_TIMEOUT_MS,
    enabled = true,
    tenantId,
    userId,
  } = options;
  const [isLocked, setIsLocked] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logRef = useRef<AbortController | null>(null);

  const logAction = useCallback(
    async (action: 'SCREEN_LOCKED' | 'SCREEN_UNLOCKED') => {
      if (!tenantId || !userId) return;
      try {
        if (logRef.current) logRef.current.abort();
        logRef.current = new AbortController();
        const token = getAuthToken();
        if (!token) return;
        await fetch(`${API_BASE}/audit/log`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            action,
            entity_type: 'SESSION',
            entity_id: userId,
            performed_by: userId,
          }),
          signal: logRef.current.signal,
        });
      } catch {
        // Non-critical — don't block UI
      }
    },
    [tenantId, userId],
  );

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const resetTimer = useCallback(() => {
    if (!enabled) return;
    clearTimer();
    if (!isLocked) {
      timerRef.current = setTimeout(() => {
        setIsLocked(true);
        logAction('SCREEN_LOCKED');
      }, timeoutMs);
    }
  }, [enabled, timeoutMs, isLocked, clearTimer, logAction]);

  const lock = useCallback(() => {
    clearTimer();
    setIsLocked(true);
    logAction('SCREEN_LOCKED');
  }, [clearTimer, logAction]);

  const unlock = useCallback(() => {
    setIsLocked(false);
    logAction('SCREEN_UNLOCKED');
    resetTimer();
  }, [resetTimer, logAction]);

  useEffect(() => {
    if (!enabled) return;
    const events = [
      'mousedown',
      'keydown',
      'touchstart',
      'scroll',
      'mousemove',
    ];
    const handlers = events.map((e) => {
      const handler = () => resetTimer();
      window.addEventListener(e, handler, { passive: true });
      return { event: e, handler };
    });

    resetTimer();

    return () => {
      clearTimer();
      handlers.forEach(({ event, handler }) =>
        window.removeEventListener(event, handler),
      );
    };
  }, [enabled, resetTimer, clearTimer]);

  return { isLocked, lock, unlock, resetTimer };
}
