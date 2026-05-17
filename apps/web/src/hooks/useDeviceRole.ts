'use client';

import { useEffect, useState } from 'react';

export type DeviceType = 'mobile' | 'tablet' | 'desktop';
export type UserRole =
  | 'CASHIER'
  | 'KITCHEN'
  | 'OWNER'
  | 'MANAGER'
  | 'WAITER'
  | 'CAPTAIN'
  | 'SUPER_ADMIN';

const MOBILE_BREAKPOINT = 768;
const TABLET_BREAKPOINT = 1200;

function getDeviceType(width: number): DeviceType {
  if (width < MOBILE_BREAKPOINT) return 'mobile';
  if (width < TABLET_BREAKPOINT) return 'tablet';
  return 'desktop';
}

function getUserRole(): UserRole {
  if (typeof window === 'undefined') return 'CASHIER';
  try {
    const info = localStorage.getItem('user_info');
    if (!info) return 'CASHIER';
    const parsed = JSON.parse(info);
    return (parsed.role as UserRole) ?? 'CASHIER';
  } catch {
    return 'CASHIER';
  }
}

export function useDeviceRole() {
  const [device, setDevice] = useState<DeviceType>('desktop');
  const [role, setRole] = useState<UserRole>('CASHIER');

  useEffect(() => {
    setDevice(getDeviceType(window.innerWidth));
    setRole(getUserRole());

    const onResize = () => setDevice(getDeviceType(window.innerWidth));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const isMobile = device === 'mobile';
  const isTablet = device === 'tablet';
  const isDesktop = device === 'desktop';
  const isKitchen = role === 'KITCHEN';
  const isCashier =
    role === 'CASHIER' || role === 'WAITER' || role === 'CAPTAIN';
  const isOwner =
    role === 'OWNER' || role === 'MANAGER' || role === 'SUPER_ADMIN';

  return {
    device,
    role,
    isMobile,
    isTablet,
    isDesktop,
    isKitchen,
    isCashier,
    isOwner,
  };
}
