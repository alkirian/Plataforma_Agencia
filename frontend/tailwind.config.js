/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Design tokens (mapped to CSS variables for fine-grain tuning)
        app: {
          bg: 'var(--color-app-bg)', // #0B1020 base
          gradientStart: 'var(--color-app-gradient-start)',
          gradientEnd: 'var(--color-app-gradient-end)'
        },
        surface: {
          DEFAULT: 'var(--color-surface)', // rgba(15,23,42,0.65)
          soft: 'var(--color-surface-soft)', // rgba(15,23,42,0.5)
          strong: 'var(--color-surface-strong)' // rgba(15,23,42,0.8)
        },
        border: {
          subtle: 'var(--color-border-subtle)',
          strong: 'var(--color-border-strong)'
        },
        text: {
          primary: 'var(--color-text-primary)', // #E5E7EB
          muted: 'var(--color-text-muted)', // #94A3B8
        },
        accent: {
          cyan: 'var(--color-accent-cyan)', // #67E8F9
          blue: 'var(--color-accent-blue)', // #60A5FA
          violet: 'var(--color-accent-violet)', // #A78BFA
        },
        brand: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
          800: '#3730A3',
          900: '#312E81',
          950: '#1E1B4B'
        },
        success: '#16A34A',
        warning: '#D97706',
        error: '#DC2626',
        info: '#0EA5E9',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-soft': 'pulseSoft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'cyber-pulse': 'cyberPulse 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgb(168 85 247 / 0.4), 0 0 20px rgb(168 85 247 / 0.2)' },
          '100%': { boxShadow: '0 0 10px rgb(168 85 247 / 0.5), 0 0 30px rgb(168 85 247 / 0.3)' },
        },
        'cyber-pulse': {
          '0%, 100%': { 
            boxShadow: '0 0 5px rgb(168 85 247 / 0.3), 0 0 15px rgb(168 85 247 / 0.15), inset 0 0 15px rgb(168 85 247 / 0.1)' 
          },
          '50%': { 
            boxShadow: '0 0 10px rgb(168 85 247 / 0.4), 0 0 25px rgb(168 85 247 / 0.2), inset 0 0 25px rgb(168 85 247 / 0.15)' 
          },
        },
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.25rem',
        '3xl': '1.75rem',
        pill: '2.25rem'
      },
      boxShadow: {
        soft: '0 8px 24px rgba(0,0,0,0.35)',
        glass: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 8px 24px rgba(0,0,0,0.35)',
        halo: '0 0 0 1px var(--color-border-subtle), 0 0 20px rgba(96,165,250,0.15), 0 0 40px rgba(167,139,250,0.15)',
        'halo-strong': '0 0 0 1px var(--color-border-strong), 0 0 30px rgba(96,165,250,0.25), 0 0 60px rgba(167,139,250,0.25)'
      },
      ringOffsetWidth: {
        3: '3px'
      }
    },
  },
  plugins: [],
}
