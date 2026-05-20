# Phase 3B — Admin Panel: Role Requests Screen

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Role Requests" tab to the existing admin Vite SPA so the super admin can approve or deny organizer upgrade requests submitted from the mobile app.

**Architecture:** Follow the existing pattern in `apps/admin/src/` — new `api/roleRequests.ts` file, new `pages/RoleRequestsPage.tsx`, update `Sidebar.tsx` and `App.tsx`. Uses the same `api` Dio client already configured with JWT interceptor.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, React Query (or plain fetch — follow existing pattern), React Router v6.

**Prerequisite:** Plan A (backend extensions) must be deployed. The endpoints `GET /api/users/role-requests` and `PATCH /api/users/role-requests/:id` must be live.

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `apps/admin/src/api/roleRequests.ts` | Create | API calls for role requests |
| `apps/admin/src/pages/RoleRequestsPage.tsx` | Create | Full page UI |
| `apps/admin/src/components/layout/Sidebar.tsx` | Modify | Add nav link |
| `apps/admin/src/App.tsx` | Modify | Add route |

---

### Task 1: Create role requests API module

**Files:**
- Create: `apps/admin/src/api/roleRequests.ts`

- [ ] **Step 1: Create the API file**

Create `apps/admin/src/api/roleRequests.ts`:
```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add apps/admin/src/api/roleRequests.ts
git commit -m "feat(admin): add role requests API module"
```

---

### Task 2: Build the Role Requests page

**Files:**
- Create: `apps/admin/src/pages/RoleRequestsPage.tsx`

- [ ] **Step 1: Create RoleRequestsPage.tsx**

Create `apps/admin/src/pages/RoleRequestsPage.tsx`:
```tsx
import { useState, useEffect, useCallback } from 'react';
import { fetchRoleRequests, reviewRoleRequest, RoleRequest } from '@/api/roleRequests';

export default function RoleRequestsPage() {
  const [requests, setRequests] = useState<RoleRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await fetchRoleRequests();
      setRequests(data);
    } catch {
      setError('Failed to load role requests');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAction = async (id: string, action: 'approve' | 'deny') => {
    setActionLoading(id + action);
    try {
      const updated = await reviewRoleRequest(id, action);
      setRequests((prev) =>
        prev.map((r) => (r.id === updated.id ? updated : r))
      );
    } catch {
      setError('Action failed. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const statusBadge = (status: RoleRequest['status']) => {
    const map = {
      pending: 'bg-yellow-500/20 text-yellow-400',
      approved: 'bg-cyan/20 text-cyan',
      denied: 'bg-pink/20 text-pink',
    };
    return (
      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${map[status]}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white">Role Requests</h1>
        <p className="text-muted text-sm mt-1">Players requesting Organizer access</p>
      </div>

      {error && (
        <div className="mb-4 bg-pink/10 border border-pink/30 text-pink text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-muted text-sm">Loading…</div>
      ) : requests.length === 0 ? (
        <div className="text-muted text-sm">No role requests yet.</div>
      ) : (
        <div className="bg-card border border-white/5 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-muted text-xs uppercase tracking-widest">
                <th className="text-left px-6 py-4">Player</th>
                <th className="text-left px-6 py-4">Contact</th>
                <th className="text-left px-6 py-4">Reason</th>
                <th className="text-left px-6 py-4">Submitted</th>
                <th className="text-left px-6 py-4">Status</th>
                <th className="text-left px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr key={req.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                  <td className="px-6 py-4 text-white font-medium">
                    {req.user.fullName ?? 'Unnamed'}
                    <div className="text-muted text-xs">{req.user.role}</div>
                  </td>
                  <td className="px-6 py-4 text-muted">
                    {req.user.phone ?? req.user.email ?? '—'}
                  </td>
                  <td className="px-6 py-4 text-muted max-w-xs">
                    {req.reason ?? <span className="italic">No reason given</span>}
                  </td>
                  <td className="px-6 py-4 text-muted">
                    {new Date(req.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    {statusBadge(req.status)}
                  </td>
                  <td className="px-6 py-4">
                    {req.status === 'pending' ? (
                      <div className="flex gap-2">
                        <button
                          disabled={!!actionLoading}
                          onClick={() => handleAction(req.id, 'approve')}
                          className="text-xs bg-cyan/20 text-cyan border border-cyan/30 px-3 py-1.5 rounded-lg hover:bg-cyan/30 transition-colors disabled:opacity-50"
                        >
                          {actionLoading === req.id + 'approve' ? 'Approving…' : 'Approve'}
                        </button>
                        <button
                          disabled={!!actionLoading}
                          onClick={() => handleAction(req.id, 'deny')}
                          className="text-xs bg-pink/10 text-pink border border-pink/20 px-3 py-1.5 rounded-lg hover:bg-pink/20 transition-colors disabled:opacity-50"
                        >
                          {actionLoading === req.id + 'deny' ? 'Denying…' : 'Deny'}
                        </button>
                      </div>
                    ) : (
                      <span className="text-muted text-xs">
                        {req.reviewedAt ? new Date(req.reviewedAt).toLocaleDateString() : '—'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/admin/src/pages/RoleRequestsPage.tsx
git commit -m "feat(admin): add Role Requests page with approve/deny actions"
```

---

### Task 3: Wire up route and sidebar nav

**Files:**
- Modify: `apps/admin/src/App.tsx`
- Modify: `apps/admin/src/components/layout/Sidebar.tsx`

- [ ] **Step 1: Add route in App.tsx**

In `apps/admin/src/App.tsx`, add the import and route:

```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '@/components/ProtectedRoute';
import LoginPage from '@/pages/LoginPage';
import AdminLayout from '@/components/layout/AdminLayout';
import DashboardPage from '@/pages/DashboardPage';
import TournamentsPage from '@/pages/TournamentsPage';
import UsersPage from '@/pages/UsersPage';
import LiveMatchPage from '@/pages/LiveMatchPage';
import RoleRequestsPage from '@/pages/RoleRequestsPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin/login" element={<LoginPage />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="tournaments" element={<TournamentsPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="live" element={<LiveMatchPage />} />
          <Route path="role-requests" element={<RoleRequestsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/admin/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
```

- [ ] **Step 2: Add nav link in Sidebar.tsx**

In `apps/admin/src/components/layout/Sidebar.tsx`, add to the `links` array:

```typescript
const links = [
  { to: '/admin/dashboard', label: '📊 Dashboard' },
  { to: '/admin/tournaments', label: '🏆 Tournaments' },
  { to: '/admin/users', label: '👥 Users' },
  { to: '/admin/live', label: '🔴 Live Matches' },
  { to: '/admin/role-requests', label: '🔑 Role Requests' },
];
```

- [ ] **Step 3: Build and verify**

```bash
pnpm --filter @g3/admin build
```

Expected: Build succeeds. No TypeScript errors.

- [ ] **Step 4: Push to deploy**

```bash
git add apps/admin/src/App.tsx
git add apps/admin/src/components/layout/Sidebar.tsx
git commit -m "feat(admin): add Role Requests route and sidebar nav link"
git push origin main
git push origin main:master
```

Expected: Vercel auto-deploys `g3-sports-admin`. New "🔑 Role Requests" link appears in sidebar.

- [ ] **Step 5: Verify in browser**

1. Open `https://g3-sports-admin.vercel.app/admin/login`
2. Log in
3. Click "🔑 Role Requests" in sidebar
4. Should show empty state "No role requests yet."
