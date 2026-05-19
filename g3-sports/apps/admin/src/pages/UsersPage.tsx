import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchUsers, updateUserRole, AdminUserRow } from '@/api/users';

const ROLES = ['player', 'organizer', 'scorer', 'super_admin'];

export default function UsersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  });

  const changeRole = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      updateUserRole(userId, role),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });

  const filtered = users.filter(
    (u) =>
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.displayName.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-white">Users</h1>
        <input
          type="search"
          placeholder="Search users…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-card border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder-muted/50 focus:outline-none focus:border-cyan/40 w-56"
        />
      </div>

      {isLoading ? (
        <p className="text-muted text-sm">Loading…</p>
      ) : (
        <div className="bg-card border border-white/5 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted uppercase tracking-widest">
                  User
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted uppercase tracking-widest">
                  Email
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted uppercase tracking-widest">
                  Role
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted uppercase tracking-widest">
                  Joined
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user: AdminUserRow) => (
                <tr
                  key={user.id}
                  className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-5 py-3 font-medium text-white">{user.displayName}</td>
                  <td className="px-5 py-3 text-muted">{user.email}</td>
                  <td className="px-5 py-3">
                    <select
                      value={user.role}
                      onChange={(e) =>
                        changeRole.mutate({ userId: user.id, role: e.target.value })
                      }
                      className="bg-bg border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-cyan/40"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-5 py-3 text-muted text-xs">
                    {user.createdAt
                      ? new Date(user.createdAt).toLocaleDateString()
                      : '—'}
                  </td>
                </tr>
              ))}
              {!filtered.length && (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-muted">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
