import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/api/client';

interface AdminUser {
  id: string;
  email: string;
  role: string;
  displayName: string;
}

interface AuthState {
  user: AdminUser | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      login: async (email, password) => {
        const { data } = await api.post<{ access_token: string; user: AdminUser }>('/auth/admin/login', { email, password });
        // Defensive: handle both unwrapped { access_token, user } and wrapped { data: { access_token, user }, timestamp }
        const payload = (data as any)?.data ?? data;
        const token = payload.access_token;
        const user = payload.user;
        if (!token) throw new Error('No access_token in response');
        localStorage.setItem('g3_admin_token', token);
        set({ token, user });
      },
      logout: () => {
        localStorage.removeItem('g3_admin_token');
        set({ token: null, user: null });
      },
    }),
    { name: 'g3-admin-auth', partialize: (s) => ({ token: s.token, user: s.user }) },
  ),
);
