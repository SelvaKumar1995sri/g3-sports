import { AnimatedSection } from '@/components/ui/AnimatedSection';

const features = [
  {
    icon: '🏟️',
    title: 'Multi-Ground Management',
    desc: 'Manage multiple grounds and courts simultaneously. Assign individual scorers per ground. Run different sports at the same time.',
    color: 'rgba(0,229,255,0.12)',
    border: 'rgba(0,229,255,0.2)',
  },
  {
    icon: '⚡',
    title: 'Live Real-Time Scoring',
    desc: 'Socket.IO powered live updates. Every ball, every point delivered instantly to all spectators across web, TV, and mobile.',
    color: 'rgba(204,255,0,0.08)',
    border: 'rgba(204,255,0,0.2)',
  },
  {
    icon: '🏆',
    title: 'Tournament Brackets',
    desc: 'Auto-generate knockout brackets, league tables, and group stages. Winner automatically advances in the bracket tree.',
    color: 'rgba(255,77,109,0.08)',
    border: 'rgba(255,77,109,0.2)',
  },
  {
    icon: '👥',
    title: 'Team Branding',
    desc: 'Custom logos, banners, and theme colors per team. Full team roster management with roles and jersey numbers.',
    color: 'rgba(0,229,255,0.06)',
    border: 'rgba(0,229,255,0.15)',
  },
  {
    icon: '📊',
    title: 'Analytics & Stats',
    desc: 'Per-player career stats across all sports. Batting averages, bowling economy, badminton win rates, leaderboards.',
    color: 'rgba(204,255,0,0.06)',
    border: 'rgba(204,255,0,0.15)',
  },
  {
    icon: '📱',
    title: 'Mobile + Web + TV',
    desc: 'Flutter app for iOS and Android. Public scoreboard mode for TV/projector. Admin dashboard for full control.',
    color: 'rgba(255,77,109,0.06)',
    border: 'rgba(255,77,109,0.15)',
  },
];

export function FeatureGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {features.map((f, i) => (
        <AnimatedSection key={f.title} delay={i * 0.08}>
          <div
            className="rounded-2xl p-6 h-full hover:-translate-y-1 transition-transform"
            style={{ background: f.color, border: `1px solid ${f.border}` }}
          >
            <div className="text-3xl mb-4">{f.icon}</div>
            <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
            <p className="text-sm text-muted leading-relaxed">{f.desc}</p>
          </div>
        </AnimatedSection>
      ))}
    </div>
  );
}
