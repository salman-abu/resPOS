import type { Config } from 'tailwindcss';

const config: Config = {
  // No darkMode class — we're light-only
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'JetBrains Mono', 'monospace'],
      },
      colors: {
        // ── Light theme backgrounds ──
        background: {
          DEFAULT: '#F8FAFC', // page base — very light blue-gray
          card: '#FFFFFF', // white cards
          hover: '#F1F5F9', // hover state
          elevated: '#FFFFFF', // modals / dropdowns
          muted: '#F8FAFC', // subtle section bg
        },
        // ── Borders ──
        border: {
          DEFAULT: '#E2E8F0', // slate-200
          active: '#3B82F6', // brand blue
          subtle: '#F1F5F9', // very faint
          strong: '#CBD5E1', // heavier divider
        },
        // ── Brand blue ──
        brand: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
        },
        // ── Surface layers ──
        surface: {
          DEFAULT: '#FFFFFF',
          2: '#F8FAFC',
          3: '#F1F5F9',
          4: '#E2E8F0',
        },
        // ── Status ──
        success: {
          DEFAULT: '#059669',
          light: '#D1FAE5',
          bg: '#F0FDF4',
        },
        warning: {
          DEFAULT: '#D97706',
          light: '#FEF3C7',
          bg: '#FFFBEB',
        },
        danger: {
          DEFAULT: '#DC2626',
          light: '#FEE2E2',
          bg: '#FFF5F5',
        },
        info: {
          DEFAULT: '#7C3AED',
          bg: '#F5F3FF',
        },
        // ── Text hierarchy ──
        content: {
          primary: '#0F172A', // slate-900 — main text
          secondary: '#475569', // slate-600 — secondary
          muted: '#94A3B8', // slate-400 — placeholder/muted
          disabled: '#CBD5E1', // slate-300 — disabled
          inverse: '#FFFFFF', // white on colored bg
        },
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        card: '0 1px 3px rgba(15,23,42,0.08), 0 1px 2px rgba(15,23,42,0.04)',
        'card-hover':
          '0 4px 12px rgba(15,23,42,0.10), 0 2px 4px rgba(15,23,42,0.06)',
        elevated:
          '0 10px 40px rgba(15,23,42,0.12), 0 4px 8px rgba(15,23,42,0.08)',
        modal: '0 20px 60px rgba(15,23,42,0.20)',
        'glow-blue':
          '0 0 0 3px rgba(59,130,246,0.15), 0 2px 8px rgba(59,130,246,0.20)',
        'glow-green': '0 0 0 3px rgba(5,150,105,0.15)',
        'glow-amber': '0 0 0 3px rgba(217,119,6,0.15)',
        'inner-top': 'inset 0 1px 0 rgba(255,255,255,0.8)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          from: { opacity: '0', transform: 'translateX(12px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'bounce-in': {
          '0%': { transform: 'scale(0.85)', opacity: '0' },
          '60%': { transform: 'scale(1.04)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'count-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%, 60%': { transform: 'translateX(-4px)' },
          '40%, 80%': { transform: 'translateX(4px)' },
        },
        shimmer: {
          from: { backgroundPosition: '-200% 0' },
          to: { backgroundPosition: '200% 0' },
        },
        'slide-down': {
          from: { opacity: '0', transform: 'translateY(-8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.25s ease-out both',
        'slide-in-right': 'slide-in-right 0.25s ease-out both',
        'scale-in': 'scale-in 0.2s ease-out both',
        'bounce-in': 'bounce-in 0.35s cubic-bezier(0.34,1.56,0.64,1) both',
        'count-up': 'count-up 0.35s ease-out both',
        shake: 'shake 0.4s ease-in-out',
        shimmer: 'shimmer 1.8s linear infinite',
        'slide-down': 'slide-down 0.2s ease-out both',
      },
    },
  },
  plugins: [],
};

export default config;
