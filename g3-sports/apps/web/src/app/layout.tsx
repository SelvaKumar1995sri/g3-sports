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
