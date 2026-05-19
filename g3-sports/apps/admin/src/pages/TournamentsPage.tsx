import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchTournaments,
  fetchBracket,
  generateBracket,
  Tournament,
} from '@/api/tournaments';
import BracketTree from '@/components/bracket/BracketTree';

const statusColor: Record<string, string> = {
  draft: 'text-muted',
  DRAFT: 'text-muted',
  registration: 'text-cyan',
  REGISTRATION: 'text-cyan',
  active: 'text-lime',
  ACTIVE: 'text-lime',
  ongoing: 'text-lime',
  ONGOING: 'text-lime',
  completed: 'text-pink',
  COMPLETED: 'text-pink',
};

export default function TournamentsPage() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<Tournament | null>(null);

  const { data: tournaments = [], isLoading } = useQuery({
    queryKey: ['tournaments'],
    queryFn: fetchTournaments,
  });

  const { data: bracket = [] } = useQuery({
    queryKey: ['bracket', selected?.id],
    queryFn: () => fetchBracket(selected!.id),
    enabled: !!selected,
  });

  const genBracket = useMutation({
    mutationFn: () => generateBracket(selected!.id, selected!.sport),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bracket', selected?.id] }),
  });

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-black text-white">Tournaments</h1>

      {isLoading ? (
        <p className="text-muted text-sm">Loading…</p>
      ) : (
        <div className="grid gap-3">
          {tournaments.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelected(t)}
              className={`text-left bg-card border rounded-2xl p-5 transition-colors ${
                selected?.id === t.id
                  ? 'border-cyan/40'
                  : 'border-white/5 hover:border-white/10'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-white">{t.name}</p>
                  <p className="text-muted text-sm mt-0.5">
                    {t.sport} · {t.format}
                  </p>
                </div>
                <span
                  className={`text-xs font-semibold uppercase tracking-widest ${
                    statusColor[t.status] ?? 'text-muted'
                  }`}
                >
                  {t.status}
                </span>
              </div>
            </button>
          ))}
          {!tournaments.length && (
            <p className="text-muted text-sm">No tournaments yet.</p>
          )}
        </div>
      )}

      {selected && (
        <div className="bg-card border border-white/5 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-white">{selected.name} — Bracket</h2>
            {!bracket.length && (
              <button
                onClick={() => genBracket.mutate()}
                disabled={genBracket.isPending}
                className="bg-gradient-to-r from-cyan to-lime text-bg text-xs font-bold px-4 py-2 rounded-full disabled:opacity-50"
              >
                {genBracket.isPending ? 'Generating…' : 'Generate Bracket'}
              </button>
            )}
          </div>
          <BracketTree matches={bracket} />
        </div>
      )}
    </div>
  );
}
