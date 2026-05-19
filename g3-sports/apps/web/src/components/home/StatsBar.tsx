'use client';

import { useInView } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';
import { AnimatedSection } from '@/components/ui/AnimatedSection';

function Counter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = target / 40;
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setValue(target); clearInterval(timer); }
      else setValue(Math.floor(start));
    }, 30);
    return () => clearInterval(timer);
  }, [inView, target]);

  return <span ref={ref}>{value}{suffix}</span>;
}

const stats = [
  { label: 'Platforms', value: 4, suffix: '' },
  { label: 'User Roles', value: 5, suffix: '' },
  { label: 'Real-time Events/sec', value: 1000, suffix: '+' },
  { label: 'Simultaneous Grounds', value: 99, suffix: '+' },
];

export function StatsBar() {
  return (
    <section className="py-16 border-y border-white/5 bg-card">
      <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
        {stats.map((s, i) => (
          <AnimatedSection key={s.label} delay={i * 0.1} className="text-center">
            <p className="text-4xl md:text-5xl font-black text-gradient-cyan">
              <Counter target={s.value} suffix={s.suffix} />
            </p>
            <p className="text-xs text-muted mt-2 uppercase tracking-widest">{s.label}</p>
          </AnimatedSection>
        ))}
      </div>
    </section>
  );
}
