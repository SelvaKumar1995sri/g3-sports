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
