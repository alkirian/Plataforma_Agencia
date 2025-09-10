/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ================================
        // CENTRALIZED THEME COLOR SYSTEM
        // ================================
        
        // Theme-aware colors (dynamically updated via CSS variables)
        'theme-bg': {
          primary: 'var(--theme-background-primary)',
          secondary: 'var(--theme-background-secondary)',
          tertiary: 'var(--theme-background-tertiary)',
          inverse: 'var(--theme-background-inverse)',
        },
        
        'theme-surface': {
          DEFAULT: 'var(--theme-surface-default)',
          soft: 'var(--theme-surface-soft)',
          strong: 'var(--theme-surface-strong)',
          overlay: 'var(--theme-surface-overlay)',
        },
        
        'theme-text': {
          primary: 'var(--theme-text-primary)',
          secondary: 'var(--theme-text-secondary)',
          muted: 'var(--theme-text-muted)',
          inverse: 'var(--theme-text-inverse)',
          accent: 'var(--theme-text-accent)',
        },
        
        'theme-border': {
          DEFAULT: 'var(--theme-border-default)',
          subtle: 'var(--theme-border-subtle)',
          strong: 'var(--theme-border-strong)',
          interactive: 'var(--theme-border-interactive)',
        },
        
        'theme-interactive': {
          primary: 'var(--theme-interactive-primary)',
          'primary-hover': 'var(--theme-interactive-primaryHover)',
          secondary: 'var(--theme-interactive-secondary)',
          'secondary-hover': 'var(--theme-interactive-secondaryHover)',
          tertiary: 'var(--theme-interactive-tertiary)',
          'tertiary-hover': 'var(--theme-interactive-tertiaryHover)',
        },
        
        'theme-status': {
          success: 'var(--theme-status-success)',
          warning: 'var(--theme-status-warning)',
          error: 'var(--theme-status-error)',
          info: 'var(--theme-status-info)',
        },

        // ================================
        // LEGACY COLORS (Backward Compatibility)
        // ================================
        
        // Legacy app colors (mapped to new theme system for compatibility)
        app: {
          bg: 'var(--theme-background-primary)',
          gradientStart: 'var(--color-app-gradient-start)',
          gradientMid: 'var(--color-app-gradient-mid)', 
          gradientEnd: 'var(--color-app-gradient-end)'
        },
        
        surface: {
          DEFAULT: 'var(--theme-surface-default)',
          soft: 'var(--theme-surface-soft)',
          strong: 'var(--theme-surface-strong)'
        },
        
        border: {
          subtle: 'var(--theme-border-subtle)',
          strong: 'var(--theme-border-strong)'
        },
        
        text: {
          primary: 'var(--theme-text-primary)',
          muted: 'var(--theme-text-muted)',
          secondary: 'var(--theme-text-secondary)'
        },

        // Legacy palette colors (for existing components)
        palette: {
          'primary-bg': 'var(--theme-background-primary)',
          'secondary-bg': 'var(--theme-background-secondary)',
          'primary-text': 'var(--theme-text-primary)',
          'primary-accent': 'var(--theme-interactive-primary)',
          'secondary-accent': 'var(--theme-interactive-secondary)',
          'hover-state': 'var(--theme-interactive-primary-hover)',
          'cold-alt': 'var(--theme-status-info)',
          'soft-alt': 'var(--theme-status-success)'
        },

        // Legacy accent colors
        accent: {
          primary: 'var(--theme-interactive-primary)',
          secondary: 'var(--theme-interactive-secondary)',
          hover: 'var(--theme-interactive-primary-hover)',
          cold: 'var(--theme-status-info)',
          soft: 'var(--theme-status-success)',
          // Keep legacy compatibility
          cyan: 'var(--color-accent-cyan)', 
          blue: 'var(--color-accent-blue)', 
          violet: 'var(--color-accent-violet)'
        },

        // Brand colors (mapped to interactive colors)
        brand: {
          50: '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA', 
          300: '#FDBA74',
          400: '#FB923C',
          500: 'var(--theme-interactive-primary)',
          600: 'var(--theme-interactive-secondary)',
          700: 'var(--theme-interactive-primary-hover)',
          800: '#9A3412',
          900: '#7C2D12', 
          950: '#431407'
        },

        // Orange scale (for existing orange components)
        orange: {
          50: '#FFF7ED',
          100: '#FFEDD5', 
          200: '#FED7AA',
          300: '#FDBA74',
          400: '#FB923C',
          500: 'var(--theme-interactive-primary)',
          600: 'var(--theme-interactive-secondary)',
          700: '#C2410C',
          800: '#9A3412',
          900: '#7C2D12',
          950: '#431407'
        },

        // Status colors (mapped to theme system)
        success: 'var(--theme-status-success)',
        warning: 'var(--theme-status-warning)',
        error: 'var(--theme-status-error)',
        info: 'var(--theme-status-info)',
      },
      
      // Theme-aware background images and gradients
      backgroundImage: {
        'theme-gradient-primary': 'var(--theme-gradients-primary)',
        'theme-gradient-secondary': 'var(--theme-gradients-secondary)',
        'theme-gradient-accent': 'var(--theme-gradients-accent)',
        'theme-gradient-surface': 'var(--theme-gradients-surface)',
        // Legacy gradients
        'gradient-cyber': 'var(--gradient-cyber)',
        'gradient-glow': 'var(--gradient-glow)',
      },
      
      // Theme-aware shadows
      boxShadow: {
        'theme-subtle': '0 2px 4px var(--theme-shadows-subtle)',
        'theme-medium': '0 4px 12px var(--theme-shadows-medium)',
        'theme-strong': '0 8px 24px var(--theme-shadows-strong)',
        'theme-glow': '0 0 20px var(--theme-shadows-glow)',
        // Legacy shadows
        soft: '0 8px 24px rgba(0,0,0,0.35)',
        glass: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 8px 24px rgba(0,0,0,0.35)',
        halo: '0 0 0 1px var(--color-border-subtle), 0 0 20px rgba(96,165,250,0.15), 0 0 40px rgba(167,139,250,0.15)',
        'halo-strong': '0 0 0 1px var(--color-border-strong), 0 0 30px rgba(96,165,250,0.25), 0 0 60px rgba(167,139,250,0.25)'
      },
      
      // Theme-aware drop shadows
      dropShadow: {
        'theme-subtle': '0 2px 4px var(--theme-shadows-subtle)',
        'theme-medium': '0 4px 12px var(--theme-shadows-medium)',
        'theme-strong': '0 8px 24px var(--theme-shadows-strong)',
        'theme-glow': '0 0 20px var(--theme-shadows-glow)',
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
