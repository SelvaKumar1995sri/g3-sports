import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0A0E1A',
        card: '#111827',
        cyan: '#00E5FF',
        lime: '#CCFF00',
        pink: '#FF4D6D',
        muted: '#8892A4',
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
} satisfies Config;
