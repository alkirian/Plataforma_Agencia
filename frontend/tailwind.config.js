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
        // Updated for Deep Orange Modern Dark Theme
        app: {
          bg: 'var(--color-app-bg)', // #1D1E22 Dark Slate
          gradientStart: 'var(--color-app-gradient-start)',
          gradientMid: 'var(--color-app-gradient-mid)', 
          gradientEnd: 'var(--color-app-gradient-end)'
        },
        surface: {
          DEFAULT: 'var(--color-surface)', // rgba(57,63,77,0.65) Deep Matte Grey
          soft: 'var(--color-surface-soft)', // rgba(57,63,77,0.5)
          strong: 'var(--color-surface-strong)' // rgba(57,63,77,0.9)
        },
        border: {
          subtle: 'var(--color-border-subtle)', // rgba(212,212,220,0.12)
          strong: 'var(--color-border-strong)'  // rgba(212,212,220,0.24)
        },
        text: {
          primary: 'var(--color-text-primary)', // #D4D4DC Silver Fox
          muted: 'var(--color-text-muted)',     // rgba(212,212,220,0.7)
          secondary: 'var(--color-text-secondary)' // rgba(212,212,220,0.85)
        },
        // New palette-specific colors
        palette: {
          'primary-bg': 'var(--palette-primary-bg)',        // #1D1E22
          'secondary-bg': 'var(--palette-secondary-bg)',    // #393F4D  
          'primary-text': 'var(--palette-primary-text)',    // #D4D4DC
          'primary-accent': 'var(--palette-primary-accent)', // #FF5A09
          'secondary-accent': 'var(--palette-secondary-accent)', // #BE4F0C
          'hover-state': 'var(--palette-hover-state)',      // #EC7F37
          'cold-alt': 'var(--palette-cold-alt)',           // #00303F
          'soft-alt': 'var(--palette-soft-alt)'            // #7A9D96
        },
        // Updated accent colors using new palette
        accent: {
          primary: 'var(--color-accent-primary-new)',    // #FF5A09 Deep Orange
          secondary: 'var(--color-accent-secondary-new)', // #BE4F0C Orange Yellow
          hover: 'var(--color-accent-hover-new)',         // #EC7F37 Light Orange
          cold: 'var(--color-accent-cold-new)',           // #00303F Cerulean
          soft: 'var(--color-accent-soft-new)',           // #7A9D96 Mist
          // Legacy compatibility
          cyan: 'var(--color-accent-cyan)', 
          blue: 'var(--color-accent-blue)', 
          violet: 'var(--color-accent-violet)'
        },
        // Orange-themed variants
        orange: {
          50: '#FFF7ED',
          100: '#FFEDD5', 
          200: '#FED7AA',
          300: '#FDBA74',
          400: '#FB923C',
          500: 'var(--palette-primary-accent)',    // #FF5A09
          600: 'var(--palette-secondary-accent)',  // #BE4F0C
          700: '#C2410C',
          800: '#9A3412',
          900: '#7C2D12',
          950: '#431407'
        },
        // Updated brand colors to match orange theme
        brand: {
          50: '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA', 
          300: '#FDBA74',
          400: '#FB923C',
          500: 'var(--palette-primary-accent)',    // #FF5A09 Primary brand
          600: 'var(--palette-secondary-accent)',  // #BE4F0C Secondary brand
          700: 'var(--palette-hover-state)',      // #EC7F37 Hover states
          800: '#9A3412',
          900: '#7C2D12', 
          950: '#431407'
        },
        // Status colors integrated with new palette
        success: 'var(--palette-soft-alt)',     // #7A9D96 Mist for success
        warning: 'var(--palette-secondary-accent)', // #BE4F0C Orange Yellow for warning  
        error: '#DC2626',   // Keep red for error
        info: 'var(--palette-cold-alt)',        // #00303F Cerulean for info
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
