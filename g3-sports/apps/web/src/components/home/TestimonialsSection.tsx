import { AnimatedSection } from '@/components/ui/AnimatedSection';
import { SectionHeading } from '@/components/ui/SectionHeading';

const testimonials = [
  {
    quote: 'We ran 6 cricket matches simultaneously at our tournament. The live scoreboard on TV was flawless.',
    name: 'Ravi Kumar',
    role: 'Tournament Organizer, Chennai',
    avatar: '🏆',
  },
  {
    quote: "Our badminton academy tracks every student's progress. The stats make coaching decisions so much easier.",
    name: 'Priya Nair',
    role: 'Academy Owner, Bangalore',
    avatar: '🏸',
  },
  {
    quote: 'Finally an app that understands pickleball scoring properly. The serve tracking is spot on.',
    name: 'Arjun Shah',
    role: 'Pickleball Coach, Mumbai',
    avatar: '🥒',
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-24 px-6 max-w-6xl mx-auto">
      <AnimatedSection>
        <SectionHeading
          label="What coaches say"
          title="Built for"
          highlight="real organizers"
          subtitle="From school tournaments to professional leagues — G3 Sports handles it all."
        />
      </AnimatedSection>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
        {testimonials.map((t, i) => (
          <AnimatedSection key={t.name} delay={i * 0.1}>
            <div className="bg-card border border-white/5 rounded-2xl p-6 h-full">
              <p className="text-muted text-sm leading-relaxed mb-6">&quot;{t.quote}&quot;</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-xl">
                  {t.avatar}
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">{t.name}</p>
                  <p className="text-muted text-xs">{t.role}</p>
                </div>
              </div>
            </div>
          </AnimatedSection>
        ))}
      </div>
    </section>
  );
}
