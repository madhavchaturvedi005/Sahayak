import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#1C1C1E',
        slate: '#6B7280',
        line: '#E2E4E8',
        wash: '#F7F8FA',
        indigo: {
          DEFAULT: '#1B2A4A',
          deep: '#121C33',
          soft: '#2A3D68',
        },
        amber: {
          DEFAULT: '#E8A33D',
          glow: '#F3C56B',
        },
        success: '#2E7D4F',
        attention: '#B3261E',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Noto Sans', 'ui-sans-serif', 'system-ui'],
      },
      maxWidth: {
        content: '100%',
      },
      borderRadius: {
        card: '16px',
        panel: '24px',
        btn: '12px',
      },
      boxShadow: {
        glass: 'inset 0 1px 0 rgba(255,255,255,0.4), 0 8px 32px rgba(27,42,74,0.08)',
        'glass-lg': 'inset 0 1px 0 rgba(255,255,255,0.5), 0 24px 60px rgba(27,42,74,0.12)',
        amber: '0 4px 14px rgba(232,163,61,0.35)',
      },
      transitionTimingFunction: {
        calm: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      keyframes: {
        'fade-scale': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'fade-scale': 'fade-scale 350ms cubic-bezier(0.4, 0, 0.2, 1)',
        shimmer: 'shimmer 1.8s linear infinite',
      },
    },
  },
  plugins: [],
}

export default config
