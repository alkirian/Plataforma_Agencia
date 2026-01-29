/**
 * THEME CSS GENERATOR SCRIPT
 *
 * This script generates CSS custom properties from our color palette system
 * and appends them to the globals.css file for seamless integration.
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const globalsPath = path.join(__dirname, 'src', 'styles', 'globals.css')

/**
 * Orange Professional Color Palette
 */
const orangeProfessionalPalette = {
  background: {
    primary: '#1D1E22', // Dark Slate
    secondary: '#393F4D', // Deep Matte Grey
    tertiary: '#2A2B30', // Elevated surface
    inverse: '#F8F9FA', // Light inverse
  },

  surface: {
    default: 'rgba(57, 63, 77, 0.65)',
    soft: 'rgba(57, 63, 77, 0.5)',
    strong: 'rgba(57, 63, 77, 0.9)',
    overlay: 'rgba(29, 30, 34, 0.95)',
  },

  text: {
    primary: '#D4D4DC', // Silver Fox
    secondary: 'rgba(212, 212, 220, 0.85)',
    muted: 'rgba(212, 212, 220, 0.7)',
    inverse: '#2D3748',
    accent: '#FF5A09', // Deep Orange
  },

  border: {
    default: 'rgba(212, 212, 220, 0.16)',
    subtle: 'rgba(212, 212, 220, 0.12)',
    strong: 'rgba(212, 212, 220, 0.24)',
    interactive: 'rgba(255, 90, 9, 0.4)',
  },

  interactive: {
    primary: '#FF5A09', // Deep Orange
    primaryHover: '#EC7F37', // Light Orange
    secondary: '#BE4F0C', // Orange Yellow
    secondaryHover: '#D4641A',
    tertiary: '#7A9D96', // Mist
    tertiaryHover: '#8AB0A8',
  },

  status: {
    success: '#7A9D96', // Mist
    warning: '#BE4F0C', // Orange Yellow
    error: '#DC2626', // Red
    info: '#00303F', // Cerulean
  },

  gradients: {
    primary: 'linear-gradient(135deg, #FF5A09 0%, #BE4F0C 100%)',
    secondary: 'linear-gradient(135deg, #393F4D 0%, #1D1E22 100%)',
    accent: 'linear-gradient(90deg, #FF5A09 0%, #EC7F37 100%)',
    surface: 'linear-gradient(135deg, rgba(57, 63, 77, 0.9) 0%, rgba(57, 63, 77, 0.6) 100%)',
  },

  shadows: {
    subtle: 'rgba(255, 90, 9, 0.08)',
    medium: 'rgba(255, 90, 9, 0.14)',
    strong: 'rgba(255, 90, 9, 0.18)',
    glow: 'rgba(255, 90, 9, 0.25)',
  },
}

/**
 * Generate CSS variables from palette
 */
function flattenPalette(obj, prefix = '--theme') {
  const result = {}

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'object' && value !== null) {
      Object.assign(result, flattenPalette(value, `${prefix}-${key}`))
    } else {
      result[`${prefix}-${key}`] = value
    }
  }

  return result
}

/**
 * Generate CSS custom properties for all palettes
 */
function generateThemeCSS() {
  const cssVars = flattenPalette(orangeProfessionalPalette)

  const cssProperties = Object.entries(cssVars)
    .map(([property, value]) => `  ${property}: ${value};`)
    .join('\n')

  const cssContent = `
:root[data-color-palette="orangeProfessional"],
:root {
${cssProperties}
}
`

  return `
/* ================================================================= 
   GENERATED THEME CSS VARIABLES - AUTO-GENERATED
   
   This section is automatically generated from the color palette system.
   Do not edit manually - regenerate using: node generate-theme-css.js
   ================================================================= */

${cssContent}

/* Theme-aware utility classes */
@layer utilities {
  /* Background utilities using theme variables */
  .bg-theme-primary { background-color: var(--theme-background-primary) !important; }
  .bg-theme-secondary { background-color: var(--theme-background-secondary) !important; }
  .bg-theme-tertiary { background-color: var(--theme-background-tertiary) !important; }
  .bg-theme-surface { background-color: var(--theme-surface-default) !important; }
  .bg-theme-surface-soft { background-color: var(--theme-surface-soft) !important; }
  .bg-theme-surface-strong { background-color: var(--theme-surface-strong) !important; }

  /* Text utilities using theme variables */
  .text-theme-primary { color: var(--theme-text-primary) !important; }
  .text-theme-secondary { color: var(--theme-text-secondary) !important; }
  .text-theme-muted { color: var(--theme-text-muted) !important; }
  .text-theme-accent { color: var(--theme-text-accent) !important; }
  .text-theme-inverse { color: var(--theme-text-inverse) !important; }

  /* Border utilities using theme variables */
  .border-theme-default { border-color: var(--theme-border-default) !important; }
  .border-theme-subtle { border-color: var(--theme-border-subtle) !important; }
  .border-theme-strong { border-color: var(--theme-border-strong) !important; }
  .border-theme-interactive { border-color: var(--theme-border-interactive) !important; }

  /* Interactive utilities using theme variables */
  .bg-theme-interactive-primary { background-color: var(--theme-interactive-primary) !important; }
  .bg-theme-interactive-secondary { background-color: var(--theme-interactive-secondary) !important; }
  .hover\\:bg-theme-interactive-primary:hover { background-color: var(--theme-interactive-primary-hover) !important; }
  .hover\\:bg-theme-interactive-secondary:hover { background-color: var(--theme-interactive-secondary-hover) !important; }

  /* Status utilities using theme variables */
  .text-theme-success { color: var(--theme-status-success) !important; }
  .text-theme-warning { color: var(--theme-status-warning) !important; }
  .text-theme-error { color: var(--theme-status-error) !important; }
  .text-theme-info { color: var(--theme-status-info) !important; }

  .bg-theme-success { background-color: var(--theme-status-success) !important; }
  .bg-theme-warning { background-color: var(--theme-status-warning) !important; }
  .bg-theme-error { background-color: var(--theme-status-error) !important; }
  .bg-theme-info { background-color: var(--theme-status-info) !important; }

  /* Shadow utilities using theme variables */
  .shadow-theme-subtle { box-shadow: 0 2px 4px var(--theme-shadows-subtle) !important; }
  .shadow-theme-medium { box-shadow: 0 4px 12px var(--theme-shadows-medium) !important; }
  .shadow-theme-strong { box-shadow: 0 8px 24px var(--theme-shadows-strong) !important; }
  .shadow-theme-glow { box-shadow: 0 0 20px var(--theme-shadows-glow) !important; }

  /* Gradient backgrounds using theme variables */
  .bg-theme-gradient-primary { background-image: var(--theme-gradients-primary) !important; }
  .bg-theme-gradient-secondary { background-image: var(--theme-gradients-secondary) !important; }
  .bg-theme-gradient-accent { background-image: var(--theme-gradients-accent) !important; }
  .bg-theme-gradient-surface { background-image: var(--theme-gradients-surface) !important; }

  /* Component-specific patterns */
  .theme-card {
    background-color: var(--theme-surface-default);
    border-color: var(--theme-border-default);
    color: var(--theme-text-primary);
    box-shadow: 0 4px 12px var(--theme-shadows-subtle);
  }

  .theme-button-primary {
    background-color: var(--theme-interactive-primary);
    color: var(--theme-text-inverse);
    border-color: var(--theme-border-interactive);
    transition: all 0.3s ease;
  }

  .theme-button-primary:hover {
    background-color: var(--theme-interactive-primary-hover);
    box-shadow: 0 8px 24px var(--theme-shadows-glow);
  }

  .theme-button-secondary {
    background-color: var(--theme-interactive-secondary);
    color: var(--theme-text-primary);
    border-color: var(--theme-border-default);
    transition: all 0.3s ease;
  }

  .theme-button-secondary:hover {
    background-color: var(--theme-interactive-secondary-hover);
    border-color: var(--theme-border-strong);
  }

  .theme-input {
    background-color: var(--theme-surface-soft);
    color: var(--theme-text-primary);
    border-color: var(--theme-border-default);
  }

  .theme-input:focus {
    border-color: var(--theme-border-interactive);
    box-shadow: 0 0 0 2px var(--theme-shadows-glow);
  }

  .theme-input::placeholder {
    color: var(--theme-text-muted);
  }
}

/* Component migration helpers */
@layer components {
  /* Legacy color class overrides - gradually migrate these */
  .migrate-bg-primary { background-color: var(--theme-background-primary) !important; }
  .migrate-bg-secondary { background-color: var(--theme-background-secondary) !important; }
  .migrate-text-primary { color: var(--theme-text-primary) !important; }
  .migrate-text-secondary { color: var(--theme-text-secondary) !important; }
  .migrate-border-primary { border-color: var(--theme-border-default) !important; }
}
`
}

/**
 * Update globals.css with generated theme CSS
 */
function updateGlobalsCSS() {
  try {
    // Read current globals.css
    const currentCSS = fs.readFileSync(globalsPath, 'utf8')

    // Check if auto-generated section already exists
    const autoGenStart = '/* ================================================================='
    const autoGenEnd = '/* Component migration helpers */'

    let updatedCSS = currentCSS

    // Remove existing auto-generated section if it exists
    const startIndex = currentCSS.indexOf(autoGenStart)
    if (startIndex !== -1) {
      const endIndex = currentCSS.indexOf(autoGenEnd) + autoGenEnd.length
      const afterEnd = currentCSS.indexOf('}', endIndex) + 1
      updatedCSS = currentCSS.substring(0, startIndex) + currentCSS.substring(afterEnd)
    }

    // Append new theme CSS
    const themeCSS = generateThemeCSS()
    updatedCSS = updatedCSS + '\n' + themeCSS

    // Write updated CSS back to file
    fs.writeFileSync(globalsPath, updatedCSS)

    console.log('✅ Theme CSS generated and added to globals.css')
    console.log(`📍 Location: ${globalsPath}`)
    console.log(`📊 Generated variables for ${Object.keys(colorPalettes).length} color palettes`)
  } catch (error) {
    console.error('❌ Error updating globals.css:', error)
    process.exit(1)
  }
}

// Run the generator
console.log('🎨 Generating theme CSS from color palette system...')
updateGlobalsCSS()
