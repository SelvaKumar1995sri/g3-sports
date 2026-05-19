import { BracketMatchApi } from '@/api/tournaments';

interface BracketTreeProps {
  matches: BracketMatchApi[];
}

function MatchSlot({ bm }: { bm: BracketMatchApi }) {
  const m = bm.match;
  return (
    <div className="bg-bg border border-white/10 rounded-xl p-3 w-48 text-xs">
      <div
        className={`py-1.5 px-2 rounded-lg mb-1 font-medium ${
          m?.winner?.id === m?.teamA?.id ? 'text-lime' : 'text-white'
        }`}
      >
        {m?.teamA?.name ?? 'TBD'}
      </div>
      <div className="h-px bg-white/5 my-1" />
      <div
        className={`py-1.5 px-2 rounded-lg font-medium ${
          m?.winner?.id === m?.teamB?.id ? 'text-lime' : 'text-white'
        }`}
      >
        {m?.teamB?.name ?? 'TBD'}
      </div>
      {!m && <p className="text-muted text-center mt-2 text-xs italic">BYE</p>}
    </div>
  );
}

export default function BracketTree({ matches }: BracketTreeProps) {
  if (!matches.length) {
    return <p className="text-muted text-sm">No bracket generated yet.</p>;
  }

  const maxRound = Math.max(...matches.map((m) => Number(m.round)));
  const rounds: BracketMatchApi[][] = [];
  for (let r = 1; r <= maxRound; r++) {
    rounds.push(
      matches
        .filter((m) => Number(m.round) === r)
        .sort((a, b) => a.position - b.position),
    );
  }

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-8 items-start min-w-max">
        {rounds.map((round, ri) => (
          <div key={ri} className="flex flex-col gap-6">
            <p className="text-xs font-semibold text-muted uppercase tracking-widest text-center mb-2">
              {ri === rounds.length - 1
                ? 'Final'
                : ri === rounds.length - 2
                ? 'Semi-Final'
                : `Round ${ri + 1}`}
            </p>
            {round.map((bm) => (
              <MatchSlot key={bm.id} bm={bm} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
