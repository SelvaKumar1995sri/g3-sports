import { AnimatedSection } from '@/components/ui/AnimatedSection';
import { SectionHeading } from '@/components/ui/SectionHeading';

const sports = [
  {
    icon: '🏏',
    name: 'Cricket',
    color: 'cyan',
    border: 'rgba(0,229,255,0.2)',
    bg: 'rgba(0,229,255,0.04)',
    features: ['Ball-by-ball scoring', 'Over history tracking', 'Batting & bowling stats', 'Extras (wides, no-balls)'],
  },
  {
    icon: '🏸',
    name: 'Badminton',
    color: 'lime',
    border: 'rgba(204,255,0,0.2)',
    bg: 'rgba(204,255,0,0.03)',
    features: ['Set-by-set scoring', 'Server tracking', 'Rally counter', 'Match history'],
  },
  {
    icon: '🥒',
    name: 'Pickleball',
    color: 'pink',
    border: 'rgba(255,77,109,0.2)',
    bg: 'rgba(255,77,109,0.04)',
    features: ['Game-by-game points', 'Serve number tracking', 'Doubles support', 'Live scoreboard'],
  },
];

export function SportCards() {
  return (
    <section className="py-24 px-6 max-w-6xl mx-auto">
      <AnimatedSection>
        <SectionHeading
          label="Supported Sports"
          title="One app for"
          highlight="every sport"
          subtitle="Purpose-built scoring engines for each sport — not a generic template."
        />
      </AnimatedSection>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
        {sports.map((sport, i) => (
          <AnimatedSection key={sport.name} delay={i * 0.1}>
            <div
              className="rounded-2xl p-6 h-full transition-transform hover:-translate-y-1"
              style={{ background: sport.bg, border: `1px solid ${sport.border}` }}
            >
              <div className="text-4xl mb-4">{sport.icon}</div>
              <h3 className="text-xl font-black text-white mb-4">{sport.name}</h3>
              <ul className="space-y-2">
                {sport.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-muted">
                    <span className="w-1 h-1 rounded-full bg-current opacity-60" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </AnimatedSection>
        ))}
      </div>
    </section>
  );
}
