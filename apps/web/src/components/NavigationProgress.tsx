'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Thin top progress bar — shows instantly when pathname changes,
 * giving immediate visual feedback so the app never feels frozen.
 * No external dependencies needed.
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [width, setWidth] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevPathRef = useRef(pathname);

  useEffect(() => {
    if (pathname === prevPathRef.current) return;
    prevPathRef.current = pathname;

    // New route detected — start progress
    setWidth(0);
    setVisible(true);

    // Rapidly advance to 85%, then slow down to simulate loading
    let w = 0;
    timerRef.current = setInterval(() => {
      w += w < 60 ? 8 : w < 80 ? 3 : 0.5;
      if (w >= 85) {
        if (timerRef.current) clearInterval(timerRef.current);
      }
      setWidth(w);
    }, 60);

    // Complete and hide after a short delay
    const done = setTimeout(() => {
      if (timerRef.current) clearInterval(timerRef.current);
      setWidth(100);
      setTimeout(() => setVisible(false), 300);
    }, 600);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      clearTimeout(done);
    };
  }, [pathname]);

  if (!visible) return null;

  return (
    <div
      className="fixed top-0 left-0 z-[9999] h-[3px] transition-all duration-200 ease-out"
      style={{
        width: `${width}%`,
        background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #a855f7)',
        boxShadow: '0 0 8px rgba(99,102,241,0.6)',
        opacity: width === 100 ? 0 : 1,
      }}
    />
  );
}
