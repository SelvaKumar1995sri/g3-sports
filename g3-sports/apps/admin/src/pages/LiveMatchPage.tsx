import { useQuery } from '@tanstack/react-query';
import { fetchLiveMatches, LiveMatch } from '@/api/matches';
import { useLiveScore } from '@/hooks/useLiveScore';

function MatchMonitor({ match }: { match: LiveMatch }) {
  const liveScore = useLiveScore(match.id);

  return (
    <div className="bg-card border border-white/5 rounded-2xl p-5 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-lime uppercase tracking-widest">
          ● LIVE
        </span>
        <span className="text-xs text-muted">
          {match.sport} · Round {match.round}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="font-bold text-white">{match.teamA.name}</span>
        <span className="text-muted text-sm">vs</span>
        <span className="font-bold text-white">{match.teamB.name}</span>
      </div>
      <p className="text-xs text-muted">
        {match.tournament.name}
        {match.ground ? ` · ${match.ground.name}` : ''}
      </p>
      {liveScore ? (
        <pre className="bg-bg rounded-xl p-3 text-xs text-cyan overflow-auto max-h-32">
          {JSON.stringify(liveScore.score, null, 2)}
        </pre>
      ) : (
        <p className="text-muted text-xs italic">Waiting for score updates…</p>
      )}
    </div>
  );
}

export default function LiveMatchPage() {
  const { data: matches = [], isLoading } = useQuery({
    queryKey: ['live-matches'],
    queryFn: fetchLiveMatches,
    refetchInterval: 15_000,
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">Live Matches</h1>
        <p className="text-muted text-sm mt-1">
          Real-time score monitoring via Socket.IO
        </p>
      </div>

      {isLoading ? (
        <p className="text-muted text-sm">Loading…</p>
      ) : matches.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {matches.map((m) => (
            <MatchMonitor key={m.id} match={m} />
          ))}
        </div>
      ) : (
        <div className="bg-card border border-white/5 rounded-2xl p-10 text-center">
          <p className="text-4xl mb-4">🏏</p>
          <p className="text-muted">No matches currently live.</p>
        </div>
      )}
    </div>
  );
}
