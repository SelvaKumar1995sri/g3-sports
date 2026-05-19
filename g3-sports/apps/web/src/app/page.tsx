import { HeroSection } from '@/components/home/HeroSection';
import { SportCards } from '@/components/home/SportCards';
import { StatsBar } from '@/components/home/StatsBar';
import { TestimonialsSection } from '@/components/home/TestimonialsSection';
import { GradientButton } from '@/components/ui/GradientButton';

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <StatsBar />
      <SportCards />
      <TestimonialsSection />

      {/* Download CTA */}
      <section className="py-24 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-5xl font-black text-white mb-4">
            Ready to <span className="text-gradient-cyan">dominate?</span>
          </h2>
          <p className="text-muted text-lg mb-8">
            Download G3 Sports and run your first tournament in minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <GradientButton href="#" variant="cyan">🍎 App Store</GradientButton>
            <GradientButton href="#" variant="lime">🤖 Google Play</GradientButton>
          </div>
        </div>
      </section>
    </>
  );
}
