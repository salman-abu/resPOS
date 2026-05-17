import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { removeAuthToken } from '@respos/utils';

interface UserInfo {
  id: string;
  name: string;
  email?: string;
  role: string;
  tenant_id?: string;
}

interface AuthState {
  token: string | null;
  user: UserInfo | null;
  tenantId: string | null;
}

interface AuthActions {
  setAuth: (token: string, user: UserInfo) => void;
  setTenantId: (id: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      tenantId: null,

      setAuth: (token, user) => set({ token, user }),
      setTenantId: (tenantId) => set({ tenantId }),
      logout: () => {
        if (typeof window !== 'undefined') {
          removeAuthToken();
          localStorage.removeItem('user_info');
        }
        set({ token: null, user: null });
      },
    }),
    {
      name: 'rpos-auth',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        tenantId: state.tenantId,
      }),
    },
  ),
);
