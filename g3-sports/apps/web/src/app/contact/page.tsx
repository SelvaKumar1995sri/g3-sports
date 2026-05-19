import { SectionHeading } from '@/components/ui/SectionHeading';
import { ContactForm } from '@/components/contact/ContactForm';
import { AnimatedSection } from '@/components/ui/AnimatedSection';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact — G3 Sports',
  description: 'Get in touch with the G3 Sports team for tournament inquiries and business partnerships.',
};

export default function ContactPage() {
  return (
    <div className="min-h-screen">
      <section className="pt-20 pb-16 px-6">
        <AnimatedSection className="text-center mb-12">
          <SectionHeading
            label="Get in touch"
            title="We'd love to"
            highlight="hear from you"
            subtitle="Tournament organizers, academy owners, and coaches — reach out anytime."
          />
        </AnimatedSection>

        {/* Contact info + form */}
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          <AnimatedSection direction="left">
            <div className="space-y-8">
              {[
                { icon: '📧', label: 'Email', value: 'hello@g3sports.app' },
                { icon: '🌐', label: 'Website', value: 'g3sports.app' },
                { icon: '📱', label: 'Social', value: '@G3SportsApp' },
              ].map((c) => (
                <div key={c.label} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-cyan/10 border border-cyan/20 flex items-center justify-center text-xl flex-shrink-0">
                    {c.icon}
                  </div>
                  <div>
                    <p className="text-xs text-muted uppercase tracking-widest mb-1">{c.label}</p>
                    <p className="text-white font-semibold">{c.value}</p>
                  </div>
                </div>
              ))}

              <div className="pt-4 border-t border-white/5">
                <p className="text-sm text-muted leading-relaxed">
                  For business partnerships, white-label inquiries, or API access,
                  use the contact form and mention your use case.
                </p>
              </div>
            </div>
          </AnimatedSection>

          <AnimatedSection direction="right">
            <ContactForm />
          </AnimatedSection>
        </div>
      </section>
    </div>
  );
}
