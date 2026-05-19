import { api } from './client';

export interface AdminUserRow {
  id: string;
  email: string;
  displayName: string;
  role: string;
  createdAt?: string;
  profile?: { avatarUrl?: string };
}

export const fetchUsers = async (): Promise<AdminUserRow[]> => {
  const { data } = await api.get<AdminUserRow[]>('/users');
  return data;
};

export const updateUserRole = async (userId: string, role: string): Promise<AdminUserRow> => {
  const { data } = await api.patch<AdminUserRow>(`/users/${userId}/role`, { role });
  return data;
};
