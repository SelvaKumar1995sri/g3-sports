import { useQuery } from '@tanstack/react-query';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import StatCard from '@/components/ui/StatCard';
import { fetchDashboardStats, fetchMatchesPerDay } from '@/api/analytics';

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: fetchDashboardStats,
    refetchInterval: 30_000,
  });

  const { data: chartData = [] } = useQuery({
    queryKey: ['matches-per-day'],
    queryFn: () => fetchMatchesPerDay(30),
  });

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-black text-white">Dashboard</h1>
        <p className="text-muted text-sm mt-1">Platform overview</p>
      </div>

      {statsLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-card border border-white/5 rounded-2xl p-6 animate-pulse h-28" />
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard label="Tournaments" value={stats.totalTournaments} accent="cyan" />
          <StatCard label="Active Now" value={stats.activeTournaments} accent="lime" sublabel="ongoing tournaments" />
          <StatCard label="Total Matches" value={stats.totalMatches} accent="cyan" />
          <StatCard label="Live Matches" value={stats.liveMatches} accent="pink" sublabel="in progress" />
          <StatCard label="Users" value={stats.totalUsers} accent="cyan" />
          <StatCard label="Teams" value={stats.totalTeams} accent="lime" />
        </div>
      ) : null}

      <div className="bg-card border border-white/5 rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-muted uppercase tracking-widest mb-6">
          Matches — Last 30 Days
        </h2>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="matchGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00E5FF" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#00E5FF" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
            <XAxis
              dataKey="date"
              tick={{ fill: '#8892A4', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fill: '#8892A4', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                background: '#111827',
                border: '1px solid #ffffff10',
                borderRadius: 12,
                color: '#fff',
              }}
              cursor={{ stroke: '#00E5FF20' }}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#00E5FF"
              strokeWidth={2}
              fill="url(#matchGrad)"
              name="Matches"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
