import { api } from './client';

export type RoleRequestStatus = 'pending' | 'approved' | 'denied';

export interface RoleRequest {
  id: string;
  status: RoleRequestStatus;
  reason: string | null;
  createdAt: string;
  reviewedAt: string | null;
  user: {
    id: string;
    fullName: string | null;
    phone: string | null;
    email: string | null;
    role: string;
  };
}

export const fetchRoleRequests = async (): Promise<RoleRequest[]> => {
  const { data } = await api.get<RoleRequest[]>('/users/role-requests');
  return data;
};

export const reviewRoleRequest = async (
  id: string,
  action: 'approve' | 'deny',
): Promise<RoleRequest> => {
  const { data } = await api.patch<RoleRequest>(`/users/role-requests/${id}`, { action });
  return data;
};
