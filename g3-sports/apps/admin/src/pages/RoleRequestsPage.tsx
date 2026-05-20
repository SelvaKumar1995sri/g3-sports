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
