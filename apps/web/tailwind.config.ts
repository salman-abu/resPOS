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
        background: {
          DEFAULT: '#F8FAFC',
          card: '#FFFFFF',
          hover: '#F1F5F9',
          elevated: '#FFFFFF',
          muted: '#F8FAFC',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          1: '#FFFFFF',
          2: '#F8FAFC',
          3: '#F1F5F9',
          4: '#E2E8F0',
          base: 'var(--surface-base)',
          card: 'var(--surface-card)',
          sunken: 'var(--surface-sunken)',
        },
        border: {
          DEFAULT: '#E2E8F0',
          active: '#3B82F6',
          subtle: 'var(--border-subtle)',
          strong: 'var(--border-strong)',
        },
        // Full brand scale — fixes brand-50, brand-100 … brand-700 resolving to white
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
          // semantic aliases
          light: '#DBEAFE',
          DEFAULT: '#2563EB',
          default: '#2563EB',
          strong: '#1D4ED8',
        },
        success: {
          50: '#F0FDF4',
          100: '#DCFCE7',
          bg: '#F0FDF4',
          light: '#DCFCE7',
          DEFAULT: '#16A34A',
          default: '#16A34A',
        },
        warning: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          bg: '#FFFBEB',
          light: '#FEF3C7',
          DEFAULT: '#D97706',
          default: '#D97706',
        },
        danger: {
          50: '#FFF5F5',
          100: '#FEE2E2',
          bg: '#FFF5F5',
          light: '#FEE2E2',
          DEFAULT: '#DC2626',
          default: '#DC2626',
        },
        info: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          bg: '#EEF2FF',
          light: '#E0E7FF',
          DEFAULT: '#4F46E5',
          default: '#4F46E5',
        },
        content: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
          disabled: '#CBD5E1',
          inverse: 'var(--text-inverse)',
        },
        /* Shadcn UI required tokens */
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        full: 'var(--radius-full)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
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
