import { SectionHeading } from '@/components/ui/SectionHeading';
import { FeatureGrid } from '@/components/features/FeatureGrid';
import { AnimatedSection } from '@/components/ui/AnimatedSection';
import { GradientButton } from '@/components/ui/GradientButton';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Features — G3 Sports',
  description: 'Live scoring, tournament brackets, multi-ground management, team branding, and analytics.',
};

export default function FeaturesPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="pt-20 pb-12 px-6 text-center">
        <AnimatedSection>
          <SectionHeading
            label="Platform Features"
            title="Everything you need to"
            highlight="run any tournament"
            subtitle="Built from the ground up for tournament organizers, academy owners, coaches, and players."
          />
        </AnimatedSection>
      </section>

      {/* Feature grid */}
      <section className="pb-24 px-6 max-w-6xl mx-auto">
        <FeatureGrid />
      </section>

      {/* CTA */}
      <section className="py-20 px-6 text-center bg-card border-t border-white/5">
        <AnimatedSection>
          <h2 className="text-4xl font-black text-white mb-4">
            Start your <span className="text-gradient-cyan">first tournament</span>
          </h2>
          <p className="text-muted mb-8 max-w-lg mx-auto">
            Download the app and have your tournament running in under 10 minutes.
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <GradientButton href="#" variant="cyan">🍎 App Store</GradientButton>
            <GradientButton href="#" variant="lime">🤖 Google Play</GradientButton>
          </div>
        </AnimatedSection>
      </section>
    </div>
  );
}
