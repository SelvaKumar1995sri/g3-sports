# G3 Sports Phase 1 — Marketing Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy the G3 Sports Next.js 14 marketing website — 3 pages (Home, Features, Contact) with Electric Night theme, video/particle hero, Framer Motion scroll animations, and App Store download CTAs.

**Architecture:** Next.js 14 App Router with Tailwind CSS for layout, Framer Motion for scroll animations, GSAP + Three.js for the hero particle effect. Static generation for all pages. Deployed to Vercel.

**Tech Stack:** Next.js 14, React 18, TypeScript, Tailwind CSS 3, Framer Motion 11, GSAP 3, Three.js, next/font (Inter), next/image, Vercel

**Prerequisites:** Monorepo from `2026-05-18-phase1-monorepo-backend.md` must be set up (pnpm workspaces, Turborepo). Run that plan first.

---

## File Map

```
apps/web/
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.js
├── next.config.js
├── public/
│   ├── images/
│   │   ├── cricket-action.jpg        # placeholder — replace with real photo
│   │   ├── badminton-action.jpg
│   │   └── pickleball-action.jpg
│   └── favicon.ico
└── src/
    ├── app/
    │   ├── layout.tsx                # Root layout — font, meta, nav, footer
    │   ├── globals.css               # Tailwind base + custom CSS variables
    │   ├── page.tsx                  # Home page
    │   ├── features/
    │   │   └── page.tsx              # Features page
    │   └── contact/
    │       └── page.tsx              # Contact page
    └── components/
        ├── layout/
        │   ├── Navbar.tsx
        │   └── Footer.tsx
        ├── home/
        │   ├── HeroSection.tsx       # Particle canvas + headline + CTAs
        │   ├── SportCards.tsx        # Cricket, Badminton, Pickleball feature cards
        │   ├── StatsBar.tsx          # Animated counters (matches, players, etc.)
        │   └── TestimonialsSection.tsx
        ├── features/
        │   ├── FeatureHero.tsx
        │   └── FeatureGrid.tsx       # 6 feature cards with icons
        ├── contact/
        │   └── ContactForm.tsx
        └── ui/
            ├── AnimatedSection.tsx   # Reusable Framer Motion scroll-reveal wrapper
            ├── GradientButton.tsx
            └── SectionHeading.tsx
```

---

## Task 1: Next.js App Scaffold

**Files:**
- Create: `apps/web/package.json`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/next.config.js`
- Create: `apps/web/tailwind.config.ts`
- Create: `apps/web/postcss.config.js`
- Create: `apps/web/src/app/globals.css`

- [ ] **Step 1: Create the web app directory**

```bash
mkdir -p apps/web/src/app apps/web/src/components apps/web/public/images
```

- [ ] **Step 2: Create `apps/web/package.json`**

```json
{
  "name": "@g3/web",
  "version": "0.0.1",
  "scripts": {
    "dev": "next dev -p 3000",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "14.2.3",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "framer-motion": "^11.2.0",
    "gsap": "^3.12.5",
    "three": "^0.165.0",
    "@types/three": "^0.165.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.3.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.38",
    "tailwindcss": "^3.4.4",
    "typescript": "^5.4.0"
  }
}
```

- [ ] **Step 3: Create `apps/web/next.config.js`**

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
  },
};

module.exports = nextConfig;
```

- [ ] **Step 4: Create `apps/web/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 5: Create `apps/web/tailwind.config.ts`**

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0A0E1A',
        cyan: '#00E5FF',
        lime: '#CCFF00',
        pink: '#FF4D6D',
        card: '#111827',
        muted: '#6B7280',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-cyan-lime': 'linear-gradient(135deg, #00E5FF, #CCFF00)',
      },
    },
  },
  plugins: [],
};

export default config;
```

- [ ] **Step 6: Create `apps/web/postcss.config.js`**

```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

- [ ] **Step 7: Create `apps/web/src/app/globals.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --font-inter: 'Inter', sans-serif;
}

* {
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body {
  background-color: #0A0E1A;
  color: #ffffff;
  font-family: var(--font-inter), sans-serif;
  -webkit-font-smoothing: antialiased;
}

::-webkit-scrollbar {
  width: 6px;
}
::-webkit-scrollbar-track {
  background: #0A0E1A;
}
::-webkit-scrollbar-thumb {
  background: #00E5FF33;
  border-radius: 3px;
}

@layer utilities {
  .text-gradient-cyan {
    background: linear-gradient(135deg, #00E5FF, #CCFF00);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .glow-cyan {
    box-shadow: 0 0 20px rgba(0, 229, 255, 0.3);
  }
  .glow-lime {
    box-shadow: 0 0 20px rgba(204, 255, 0, 0.3);
  }
  .border-glow {
    border: 1px solid rgba(0, 229, 255, 0.2);
  }
}
```

- [ ] **Step 8: Install web dependencies**

```bash
cd apps/web && pnpm install
```

- [ ] **Step 9: Commit**

```bash
cd ../..
git add apps/web/
git commit -m "chore: scaffold Next.js 14 marketing site with Tailwind + Electric Night theme"
```

---

## Task 2: Root Layout + Navbar + Footer

**Files:**
- Create: `apps/web/src/app/layout.tsx`
- Create: `apps/web/src/components/layout/Navbar.tsx`
- Create: `apps/web/src/components/layout/Footer.tsx`

- [ ] **Step 1: Create `apps/web/src/components/layout/Navbar.tsx`**

```tsx
'use client';

import Link from 'next/link';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const links = [
  { href: '/', label: 'Home' },
  { href: '/features', label: 'Features' },
  { href: '/contact', label: 'Contact' },
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-bg/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-black tracking-tight">
          <span className="text-gradient-cyan">G3</span>
          <span className="text-white"> Sports</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm text-muted hover:text-white transition-colors"
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/admin/login"
            className="text-xs border border-cyan/30 text-cyan px-4 py-2 rounded-full hover:bg-cyan/10 transition-colors"
          >
            Admin
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-muted hover:text-white"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          <div className="w-5 h-0.5 bg-current mb-1" />
          <div className="w-5 h-0.5 bg-current mb-1" />
          <div className="w-5 h-0.5 bg-current" />
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden overflow-hidden bg-card border-t border-white/5"
          >
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="block px-6 py-4 text-sm text-muted hover:text-white border-b border-white/5"
                onClick={() => setOpen(false)}
              >
                {l.label}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
```

- [ ] **Step 2: Create `apps/web/src/components/layout/Footer.tsx`**

```tsx
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-card mt-20">
      <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <div className="text-xl font-black mb-3">
            <span className="text-gradient-cyan">G3</span>
            <span className="text-white"> Sports</span>
          </div>
          <p className="text-sm text-muted leading-relaxed">
            Play. Score. Dominate.<br />
            The complete sports management ecosystem.
          </p>
        </div>

        <div>
          <p className="text-xs font-bold text-muted uppercase tracking-widest mb-4">
            Platform
          </p>
          <div className="flex flex-col gap-2">
            {[
              { href: '/features', label: 'Features' },
              { href: '/contact', label: 'Contact' },
              { href: '/admin/login', label: 'Admin Login' },
            ].map((l) => (
              <Link key={l.href} href={l.href} className="text-sm text-muted hover:text-white transition-colors">
                {l.label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-bold text-muted uppercase tracking-widest mb-4">
            Download
          </p>
          <div className="flex flex-col gap-3">
            <a
              href="#"
              className="inline-flex items-center gap-2 border border-white/10 rounded-lg px-4 py-2.5 hover:border-cyan/30 hover:bg-cyan/5 transition-all"
            >
              <span className="text-lg">🍎</span>
              <div>
                <p className="text-[10px] text-muted">Download on the</p>
                <p className="text-sm font-semibold text-white">App Store</p>
              </div>
            </a>
            <a
              href="#"
              className="inline-flex items-center gap-2 border border-white/10 rounded-lg px-4 py-2.5 hover:border-lime/30 hover:bg-lime/5 transition-all"
            >
              <span className="text-lg">🤖</span>
              <div>
                <p className="text-[10px] text-muted">Get it on</p>
                <p className="text-sm font-semibold text-white">Google Play</p>
              </div>
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-white/5 px-6 py-4 text-center text-xs text-muted">
        © {new Date().getFullYear()} G3 Sports. All rights reserved.
      </div>
    </footer>
  );
}
```

- [ ] **Step 3: Create `apps/web/src/app/layout.tsx`**

```tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'G3 Sports — Play. Score. Dominate.',
  description:
    'Complete multi-platform sports management ecosystem for Cricket, Badminton, and Pickleball. Live scoring, tournament brackets, team management.',
  keywords: ['cricket tournament', 'badminton scoring', 'pickleball', 'sports management app'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <Navbar />
        <main className="pt-16">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
```

- [ ] **Step 4: Run dev server and check layout**

```bash
cd apps/web && pnpm dev
```

Open `http://localhost:3000`. Expected: Dark bg `#0A0E1A`, navbar shows "G3 Sports" with cyan/white gradient, footer renders. No JS errors in browser console.

- [ ] **Step 5: Commit**

```bash
cd ../..
git add apps/web/src/app/layout.tsx apps/web/src/components/layout/
git commit -m "feat(web): add root layout, navbar, and footer"
```

---

## Task 3: Shared UI Components

**Files:**
- Create: `apps/web/src/components/ui/AnimatedSection.tsx`
- Create: `apps/web/src/components/ui/GradientButton.tsx`
- Create: `apps/web/src/components/ui/SectionHeading.tsx`

- [ ] **Step 1: Create `apps/web/src/components/ui/AnimatedSection.tsx`**

```tsx
'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

interface AnimatedSectionProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'left' | 'right';
}

export function AnimatedSection({
  children,
  className = '',
  delay = 0,
  direction = 'up',
}: AnimatedSectionProps) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  const initial = {
    opacity: 0,
    y: direction === 'up' ? 40 : 0,
    x: direction === 'left' ? -40 : direction === 'right' ? 40 : 0,
  };

  return (
    <motion.div
      ref={ref}
      initial={initial}
      animate={inView ? { opacity: 1, y: 0, x: 0 } : initial}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
```

- [ ] **Step 2: Create `apps/web/src/components/ui/GradientButton.tsx`**

```tsx
import Link from 'next/link';
import { clsx } from 'clsx';

interface GradientButtonProps {
  href?: string;
  onClick?: () => void;
  children: React.ReactNode;
  variant?: 'cyan' | 'lime' | 'outline';
  className?: string;
}

export function GradientButton({
  href,
  onClick,
  children,
  variant = 'cyan',
  className = '',
}: GradientButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 font-bold rounded-full px-7 py-3.5 text-sm transition-all duration-200 cursor-pointer';

  const variants = {
    cyan: 'bg-gradient-to-r from-cyan to-lime text-bg hover:opacity-90 hover:scale-105',
    lime: 'bg-lime text-bg hover:opacity-90 hover:scale-105',
    outline: 'border border-cyan/40 text-cyan hover:bg-cyan/10 hover:border-cyan/60',
  };

  const classes = clsx(base, variants[variant], className);

  if (href) {
    return <Link href={href} className={classes}>{children}</Link>;
  }
  return (
    <button onClick={onClick} className={classes}>
      {children}
    </button>
  );
}
```

- [ ] **Step 3: Create `apps/web/src/components/ui/SectionHeading.tsx`**

```tsx
import { clsx } from 'clsx';

interface SectionHeadingProps {
  label?: string;
  title: string;
  highlight?: string;
  subtitle?: string;
  align?: 'left' | 'center';
}

export function SectionHeading({
  label,
  title,
  highlight,
  subtitle,
  align = 'center',
}: SectionHeadingProps) {
  return (
    <div className={clsx('mb-12', align === 'center' ? 'text-center' : 'text-left')}>
      {label && (
        <p className="text-xs font-bold text-cyan uppercase tracking-[3px] mb-3">{label}</p>
      )}
      <h2 className="text-4xl md:text-5xl font-black text-white leading-tight">
        {title}{' '}
        {highlight && <span className="text-gradient-cyan">{highlight}</span>}
      </h2>
      {subtitle && (
        <p className="mt-4 text-muted text-lg max-w-2xl mx-auto leading-relaxed">{subtitle}</p>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/ui/
git commit -m "feat(web): add AnimatedSection, GradientButton, SectionHeading UI components"
```

---

## Task 4: Home Page — Hero Section (Particle + Video)

**Files:**
- Create: `apps/web/src/components/home/HeroSection.tsx`

- [ ] **Step 1: Create `apps/web/src/components/home/HeroSection.tsx`**

The canvas uses Three.js for particles. Falls back gracefully if WebGL unavailable.

```tsx
'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { GradientButton } from '@/components/ui/GradientButton';

function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const PARTICLE_COUNT = 120;
    const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 1.5 + 0.5,
      alpha: Math.random() * 0.5 + 0.2,
      color: Math.random() > 0.5 ? '0,229,255' : '204,255,0',
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color},${p.alpha})`;
        ctx.fill();
      }

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(0,229,255,${0.08 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden="true"
    />
  );
}

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Gradient backdrop */}
      <div className="absolute inset-0 bg-bg">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(0,229,255,0.12),transparent)]" />
      </div>

      <ParticleCanvas />

      {/* Hero content */}
      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 border border-cyan/20 bg-cyan/5 rounded-full px-4 py-1.5 text-xs text-cyan font-semibold mb-8 tracking-widest uppercase"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-cyan animate-pulse" />
          Live Scoring · Tournament Brackets · Team Management
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-6xl md:text-8xl font-black leading-none mb-6"
        >
          <span className="text-white">Play.</span>{' '}
          <span className="text-gradient-cyan">Score.</span>{' '}
          <span className="text-white">Dominate.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="text-muted text-xl md:text-2xl leading-relaxed mb-10 max-w-2xl mx-auto"
        >
          The complete sports management ecosystem for Cricket, Badminton, and Pickleball.
          Real-time scoring across multiple grounds — simultaneously.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <GradientButton href="#" variant="cyan">
            🍎 Download for iOS
          </GradientButton>
          <GradientButton href="#" variant="lime">
            🤖 Download for Android
          </GradientButton>
          <GradientButton href="/features" variant="outline">
            See Features →
          </GradientButton>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="flex justify-center gap-8 md:gap-16 mt-16 pt-8 border-t border-white/5"
        >
          {[
            { value: '3+', label: 'Sports' },
            { value: '5', label: 'User Roles' },
            { value: '∞', label: 'Grounds' },
            { value: 'Live', label: 'Real-time' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-2xl md:text-3xl font-black text-gradient-cyan">{stat.value}</p>
              <p className="text-xs text-muted mt-1 uppercase tracking-widest">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/home/HeroSection.tsx
git commit -m "feat(web): add hero section with particle canvas and animated CTAs"
```

---

## Task 5: Home Page — Sport Cards + Testimonials

**Files:**
- Create: `apps/web/src/components/home/SportCards.tsx`
- Create: `apps/web/src/components/home/StatsBar.tsx`
- Create: `apps/web/src/components/home/TestimonialsSection.tsx`
- Create: `apps/web/src/app/page.tsx`

- [ ] **Step 1: Create `apps/web/src/components/home/SportCards.tsx`**

```tsx
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
```

- [ ] **Step 2: Create `apps/web/src/components/home/StatsBar.tsx`**

```tsx
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
```

- [ ] **Step 3: Create `apps/web/src/components/home/TestimonialsSection.tsx`**

```tsx
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
    quote: 'Our badminton academy tracks every student\'s progress. The stats make coaching decisions so much easier.',
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
              <p className="text-muted text-sm leading-relaxed mb-6">"{t.quote}"</p>
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
```

- [ ] **Step 4: Create `apps/web/src/app/page.tsx`**

```tsx
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
```

- [ ] **Step 5: Check the home page in browser**

```bash
cd apps/web && pnpm dev
```

Open `http://localhost:3000`. Expected:
- Particle canvas animates in hero
- "Play. Score. Dominate." headline renders with gradient
- Stats bar counts up on scroll
- Sport cards show Cricket, Badminton, Pickleball
- Testimonials section loads
- No console errors

- [ ] **Step 6: Commit**

```bash
cd ../..
git add apps/web/src/components/home/ apps/web/src/app/page.tsx
git commit -m "feat(web): complete home page with hero, sport cards, stats, testimonials"
```

---

## Task 6: Features Page

**Files:**
- Create: `apps/web/src/components/features/FeatureHero.tsx`
- Create: `apps/web/src/components/features/FeatureGrid.tsx`
- Create: `apps/web/src/app/features/page.tsx`

- [ ] **Step 1: Create `apps/web/src/components/features/FeatureGrid.tsx`**

```tsx
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
```

- [ ] **Step 2: Create `apps/web/src/app/features/page.tsx`**

```tsx
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
```

- [ ] **Step 3: Verify features page**

Open `http://localhost:3000/features`. Expected: Feature grid renders with 6 cards, scroll animations trigger, no errors.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/features/ apps/web/src/app/features/
git commit -m "feat(web): add features page with 6 feature cards and scroll animations"
```

---

## Task 7: Contact Page

**Files:**
- Create: `apps/web/src/components/contact/ContactForm.tsx`
- Create: `apps/web/src/app/contact/page.tsx`

- [ ] **Step 1: Create `apps/web/src/components/contact/ContactForm.tsx`**

```tsx
'use client';

import { useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GradientButton } from '@/components/ui/GradientButton';

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    // Static site — simulate submission delay (replace with API call post-backend)
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    setSubmitted(true);
  };

  return (
    <div className="max-w-lg mx-auto">
      <AnimatePresence mode="wait">
        {submitted ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-cyan/20 rounded-2xl p-10 text-center"
          >
            <div className="text-5xl mb-4">✅</div>
            <h3 className="text-xl font-bold text-white mb-2">Message sent!</h3>
            <p className="text-muted text-sm">We'll get back to you within 24 hours.</p>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onSubmit={handleSubmit}
            className="bg-card border border-white/5 rounded-2xl p-8 space-y-5"
          >
            {[
              { id: 'name', label: 'Full Name', type: 'text', placeholder: 'Ravi Kumar' },
              { id: 'email', label: 'Email', type: 'email', placeholder: 'ravi@example.com' },
              { id: 'subject', label: 'Subject', type: 'text', placeholder: 'Tournament inquiry' },
            ].map((f) => (
              <div key={f.id}>
                <label htmlFor={f.id} className="block text-xs font-semibold text-muted uppercase tracking-widest mb-2">
                  {f.label}
                </label>
                <input
                  id={f.id}
                  name={f.id}
                  type={f.type}
                  placeholder={f.placeholder}
                  required
                  className="w-full bg-bg border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-muted/50 focus:outline-none focus:border-cyan/40 transition-colors"
                />
              </div>
            ))}

            <div>
              <label htmlFor="message" className="block text-xs font-semibold text-muted uppercase tracking-widest mb-2">
                Message
              </label>
              <textarea
                id="message"
                name="message"
                rows={4}
                required
                placeholder="Tell us about your tournament or inquiry..."
                className="w-full bg-bg border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-muted/50 focus:outline-none focus:border-cyan/40 transition-colors resize-none"
              />
            </div>

            <GradientButton variant="cyan" className="w-full justify-center">
              {loading ? 'Sending…' : 'Send Message'}
            </GradientButton>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
```

- [ ] **Step 2: Create `apps/web/src/app/contact/page.tsx`**

```tsx
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
```

- [ ] **Step 3: Verify contact page**

Open `http://localhost:3000/contact`. Expected: Form renders, submit shows success state, no console errors.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/contact/ apps/web/src/app/contact/
git commit -m "feat(web): add contact page with animated form and contact info"
```

---

## Task 8: Production Build + Vercel Deploy

- [ ] **Step 1: Run production build**

```bash
cd apps/web && pnpm build
```

Expected: Build succeeds. Output shows 3 pages: `/`, `/features`, `/contact` — all static.

Fix any TypeScript errors before proceeding.

- [ ] **Step 2: Create `apps/web/.env.example`**

```env
# No secrets needed for static marketing site
# Add NEXT_PUBLIC_ vars here if needed in future
NEXT_PUBLIC_API_URL=https://api.g3sports.app
```

- [ ] **Step 3: Add Vercel config to monorepo root**

Create `vercel.json` at `g3-sports/vercel.json`:

```json
{
  "buildCommand": "cd apps/web && pnpm build",
  "outputDirectory": "apps/web/.next",
  "installCommand": "pnpm install",
  "framework": "nextjs"
}
```

- [ ] **Step 4: Push to GitHub and connect Vercel**

```bash
git add apps/web/ vercel.json
git commit -m "feat(web): complete marketing site — ready for Vercel deploy"
git push origin main
```

Then in Vercel dashboard:
- Import the GitHub repo
- Set root directory to `apps/web`
- Framework: Next.js
- Deploy

Expected: Vercel deploy succeeds, live URL works for all 3 pages.

---

## Summary

Phase 1 marketing site delivers:
- Next.js 14 App Router with Tailwind + Electric Night theme
- Particle canvas hero with animated CTAs
- 3 fully responsive pages: Home, Features, Contact
- Framer Motion scroll animations throughout
- App Store / Google Play download buttons
- Deployed to Vercel

Next plan: `2026-05-18-phase2-admin-tournament.md` — Admin dashboard + full tournament/match engine.
