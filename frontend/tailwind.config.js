/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Colores originales Rambla
        'rambla-bg': '#0d1117',
        'rambla-surface': '#161b22',
        'rambla-border': '#30363d',
        'rambla-text-primary': '#c9d1d9',
        'rambla-text-secondary': '#8b949e',
        'rambla-accent': '#58a6ff',

        // Legacy "Cyber Glow" - DEPRECATED, avoid using in new code
        'glow-cyan': '#00f6ff', // kept for backward compatibility
        'glow-bg-start': '#020024',
        'glow-bg-end': '#0d1117',
        'glow-card-bg': 'rgba(22, 27, 34, 0.5)',

        // Modern accent palette - subtle purple for professional UI
        accent: {
          400: '#a78bfa', // light purple for hover states
          500: '#8b5cf6', // main purple accent
          600: '#7c3aed', // darker purple for selected states
          700: '#6d28d9', // deep purple for emphasis
        },

        // Legacy primary - DEPRECATED, use accent instead
        primary: {
          50: '#e6fdff',
          100: '#ccfbff',
          200: '#99f6ff',
          300: '#66f0ff',
          400: '#33ebff',
          500: '#00f6ff', // legacy glow-cyan
          600: '#00c4cc',
          700: '#009399',
          800: '#006266',
          900: '#003133',
          950: '#001a1a',
        },
        // Grises neutros mejorados basados en rambla
        surface: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b', // similar a rambla-surface
          900: '#0f172a', // similar a rambla-bg
          950: '#020617',
        },
        // Estados con tema cyber
        success: '#00ff88',
        warning: '#ffaa00',
        error: '#ff3366',
        info: '#00aaff',
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
          '0%': { boxShadow: '0 0 5px rgb(0 246 255 / 0.5), 0 0 20px rgb(0 246 255 / 0.3)' },
          '100%': { boxShadow: '0 0 10px rgb(0 246 255 / 0.6), 0 0 30px rgb(0 246 255 / 0.4)' },
        },
        cyberPulse: {
          '0%, 100%': { 
            boxShadow: '0 0 5px rgb(0 246 255 / 0.3), 0 0 15px rgb(0 246 255 / 0.2), inset 0 0 15px rgb(0 246 255 / 0.1)' 
          },
          '50%': { 
            boxShadow: '0 0 10px rgb(0 246 255 / 0.5), 0 0 25px rgb(0 246 255 / 0.3), inset 0 0 25px rgb(0 246 255 / 0.2)' 
          },
        },
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.3), 0 10px 20px -2px rgba(0, 0, 0, 0.2)',
        'glow-cyan': '0 0 25px -5px rgba(0, 246, 255, 0.4)',
        'inner-glow': 'inset 0 0 20px -5px rgba(0, 246, 255, 0.2)',
        'cyber': '0 0 15px -3px rgba(0, 246, 255, 0.3), 0 0 30px -6px rgba(0, 246, 255, 0.2)',
      },
    },
  },
  plugins: [],
}
