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
        const { data } = await api.post<{ access_token: string; user: AdminUser }>('/auth/login', { email, password });
        localStorage.setItem('g3_admin_token', data.access_token);
        set({ token: data.access_token, user: data.user });
      },
      logout: () => {
        localStorage.removeItem('g3_admin_token');
        set({ token: null, user: null });
      },
    }),
    { name: 'g3-admin-auth', partialize: (s) => ({ token: s.token, user: s.user }) },
  ),
);
