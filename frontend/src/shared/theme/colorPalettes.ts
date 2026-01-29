/**
 * CENTRALIZED COLOR PALETTE SYSTEM
 *
 * This module provides a comprehensive, type-safe color management system
 * that allows for single-point color updates and dynamic theme switching.
 *
 * Key Features:
 * - Single-file palette management
 * - Dynamic theme switching
 * - Type-safe color definitions
 * - Automatic CSS custom property generation
 * - Semantic color naming
 */

export type ColorPaletteName =
  | 'orangeProfessional'
  | 'blueCyber'
  | 'greenEmerald'
  | 'purpleNeon'
  | 'monochrome'

/**
 * Base color structure - defines all semantic color roles
 */
export interface ColorPalette {
  // Background colors
  background: {
    primary: string // Main app background
    secondary: string // Card/surface backgrounds
    tertiary: string // Elevated surfaces
    inverse: string // Contrasting background
  }

  // Surface colors for components
  surface: {
    default: string // Standard surface
    soft: string // Subtle surface
    strong: string // Emphasized surface
    overlay: string // Modal/dropdown overlays
  }

  // Text colors
  text: {
    primary: string // Main text color
    secondary: string // Less emphasized text
    muted: string // Subtle text
    inverse: string // Text on dark backgrounds
    accent: string // Accent text color
  }

  // Border colors
  border: {
    default: string // Standard borders
    subtle: string // Subtle borders
    strong: string // Emphasized borders
    interactive: string // Interactive element borders
  }

  // Interactive colors
  interactive: {
    primary: string // Primary action color
    primaryHover: string // Primary hover state
    secondary: string // Secondary action color
    secondaryHover: string // Secondary hover state
    tertiary: string // Tertiary actions
    tertiaryHover: string // Tertiary hover state
  }

  // Status colors
  status: {
    success: string // Success states
    warning: string // Warning states
    error: string // Error states
    info: string // Informational states
  }

  // Gradient definitions
  gradients: {
    primary: string // Main brand gradient
    secondary: string // Secondary gradient
    accent: string // Accent gradient
    surface: string // Surface gradient
  }

  // Shadow colors
  shadows: {
    subtle: string // Light shadows
    medium: string // Medium shadows
    strong: string // Strong shadows
    glow: string // Glow effects
  }
}

/**
 * DEEP ORANGE PROFESSIONAL PALETTE
 * Modern dark theme with warm orange accents
 */
export const orangeProfessionalPalette: ColorPalette = {
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
 * BLUE CYBER PALETTE
 * Classic cyber theme with blue accents
 */
export const blueCyberPalette: ColorPalette = {
  background: {
    primary: '#0F1419',
    secondary: '#1A1F2E',
    tertiary: '#252A3A',
    inverse: '#F7FAFC',
  },

  surface: {
    default: 'rgba(26, 31, 46, 0.65)',
    soft: 'rgba(26, 31, 46, 0.5)',
    strong: 'rgba(26, 31, 46, 0.9)',
    overlay: 'rgba(15, 20, 25, 0.95)',
  },

  text: {
    primary: '#E2E8F0',
    secondary: 'rgba(226, 232, 240, 0.85)',
    muted: 'rgba(226, 232, 240, 0.7)',
    inverse: '#1A202C',
    accent: '#3B82F6',
  },

  border: {
    default: 'rgba(226, 232, 240, 0.16)',
    subtle: 'rgba(226, 232, 240, 0.12)',
    strong: 'rgba(226, 232, 240, 0.24)',
    interactive: 'rgba(59, 130, 246, 0.4)',
  },

  interactive: {
    primary: '#3B82F6',
    primaryHover: '#60A5FA',
    secondary: '#1E40AF',
    secondaryHover: '#2563EB',
    tertiary: '#64748B',
    tertiaryHover: '#94A3B8',
  },

  status: {
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },

  gradients: {
    primary: 'linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%)',
    secondary: 'linear-gradient(135deg, #1A1F2E 0%, #0F1419 100%)',
    accent: 'linear-gradient(90deg, #3B82F6 0%, #60A5FA 100%)',
    surface: 'linear-gradient(135deg, rgba(26, 31, 46, 0.9) 0%, rgba(26, 31, 46, 0.6) 100%)',
  },

  shadows: {
    subtle: 'rgba(59, 130, 246, 0.08)',
    medium: 'rgba(59, 130, 246, 0.14)',
    strong: 'rgba(59, 130, 246, 0.18)',
    glow: 'rgba(59, 130, 246, 0.25)',
  },
}

/**
 * GREEN EMERALD PALETTE
 * Nature-inspired theme with emerald greens
 */
export const greenEmeraldPalette: ColorPalette = {
  background: {
    primary: '#064E3B',
    secondary: '#065F46',
    tertiary: '#047857',
    inverse: '#F0FDF4',
  },

  surface: {
    default: 'rgba(6, 95, 70, 0.65)',
    soft: 'rgba(6, 95, 70, 0.5)',
    strong: 'rgba(6, 95, 70, 0.9)',
    overlay: 'rgba(6, 78, 59, 0.95)',
  },

  text: {
    primary: '#D1FAE5',
    secondary: 'rgba(209, 250, 229, 0.85)',
    muted: 'rgba(209, 250, 229, 0.7)',
    inverse: '#1F2937',
    accent: '#10B981',
  },

  border: {
    default: 'rgba(209, 250, 229, 0.16)',
    subtle: 'rgba(209, 250, 229, 0.12)',
    strong: 'rgba(209, 250, 229, 0.24)',
    interactive: 'rgba(16, 185, 129, 0.4)',
  },

  interactive: {
    primary: '#10B981',
    primaryHover: '#34D399',
    secondary: '#059669',
    secondaryHover: '#047857',
    tertiary: '#6B7280',
    tertiaryHover: '#9CA3AF',
  },

  status: {
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },

  gradients: {
    primary: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    secondary: 'linear-gradient(135deg, #065F46 0%, #064E3B 100%)',
    accent: 'linear-gradient(90deg, #10B981 0%, #34D399 100%)',
    surface: 'linear-gradient(135deg, rgba(6, 95, 70, 0.9) 0%, rgba(6, 95, 70, 0.6) 100%)',
  },

  shadows: {
    subtle: 'rgba(16, 185, 129, 0.08)',
    medium: 'rgba(16, 185, 129, 0.14)',
    strong: 'rgba(16, 185, 129, 0.18)',
    glow: 'rgba(16, 185, 129, 0.25)',
  },
}

/**
 * PURPLE NEON PALETTE
 * Futuristic theme with purple/pink accents
 */
export const purpleNeonPalette: ColorPalette = {
  background: {
    primary: '#1A0B2E',
    secondary: '#2D1B4E',
    tertiary: '#3F2A5C',
    inverse: '#FAF5FF',
  },

  surface: {
    default: 'rgba(45, 27, 78, 0.65)',
    soft: 'rgba(45, 27, 78, 0.5)',
    strong: 'rgba(45, 27, 78, 0.9)',
    overlay: 'rgba(26, 11, 46, 0.95)',
  },

  text: {
    primary: '#F3E8FF',
    secondary: 'rgba(243, 232, 255, 0.85)',
    muted: 'rgba(243, 232, 255, 0.7)',
    inverse: '#1F2937',
    accent: '#A855F7',
  },

  border: {
    default: 'rgba(243, 232, 255, 0.16)',
    subtle: 'rgba(243, 232, 255, 0.12)',
    strong: 'rgba(243, 232, 255, 0.24)',
    interactive: 'rgba(168, 85, 247, 0.4)',
  },

  interactive: {
    primary: '#A855F7',
    primaryHover: '#C084FC',
    secondary: '#7C3AED',
    secondaryHover: '#8B5CF6',
    tertiary: '#64748B',
    tertiaryHover: '#94A3B8',
  },

  status: {
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#A855F7',
  },

  gradients: {
    primary: 'linear-gradient(135deg, #A855F7 0%, #7C3AED 100%)',
    secondary: 'linear-gradient(135deg, #2D1B4E 0%, #1A0B2E 100%)',
    accent: 'linear-gradient(90deg, #A855F7 0%, #C084FC 100%)',
    surface: 'linear-gradient(135deg, rgba(45, 27, 78, 0.9) 0%, rgba(45, 27, 78, 0.6) 100%)',
  },

  shadows: {
    subtle: 'rgba(168, 85, 247, 0.08)',
    medium: 'rgba(168, 85, 247, 0.14)',
    strong: 'rgba(168, 85, 247, 0.18)',
    glow: 'rgba(168, 85, 247, 0.25)',
  },
}

/**
 * MONOCHROME PALETTE
 * Clean black and white theme
 */
export const monochromePalette: ColorPalette = {
  background: {
    primary: '#000000',
    secondary: '#1A1A1A',
    tertiary: '#2A2A2A',
    inverse: '#FFFFFF',
  },

  surface: {
    default: 'rgba(26, 26, 26, 0.65)',
    soft: 'rgba(26, 26, 26, 0.5)',
    strong: 'rgba(26, 26, 26, 0.9)',
    overlay: 'rgba(0, 0, 0, 0.95)',
  },

  text: {
    primary: '#FFFFFF',
    secondary: 'rgba(255, 255, 255, 0.85)',
    muted: 'rgba(255, 255, 255, 0.7)',
    inverse: '#000000',
    accent: '#FFFFFF',
  },

  border: {
    default: 'rgba(255, 255, 255, 0.16)',
    subtle: 'rgba(255, 255, 255, 0.12)',
    strong: 'rgba(255, 255, 255, 0.24)',
    interactive: 'rgba(255, 255, 255, 0.4)',
  },

  interactive: {
    primary: '#FFFFFF',
    primaryHover: '#E5E5E5',
    secondary: '#A3A3A3',
    secondaryHover: '#BABABA',
    tertiary: '#737373',
    tertiaryHover: '#8A8A8A',
  },

  status: {
    success: '#22C55E',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },

  gradients: {
    primary: 'linear-gradient(135deg, #FFFFFF 0%, #A3A3A3 100%)',
    secondary: 'linear-gradient(135deg, #1A1A1A 0%, #000000 100%)',
    accent: 'linear-gradient(90deg, #FFFFFF 0%, #E5E5E5 100%)',
    surface: 'linear-gradient(135deg, rgba(26, 26, 26, 0.9) 0%, rgba(26, 26, 26, 0.6) 100%)',
  },

  shadows: {
    subtle: 'rgba(255, 255, 255, 0.08)',
    medium: 'rgba(255, 255, 255, 0.14)',
    strong: 'rgba(255, 255, 255, 0.18)',
    glow: 'rgba(255, 255, 255, 0.25)',
  },
}

/**
 * Palette registry - easy access to all available palettes
 */
export const colorPalettes: Record<ColorPaletteName, ColorPalette> = {
  orangeProfessional: orangeProfessionalPalette,
  blueCyber: blueCyberPalette,
  greenEmerald: greenEmeraldPalette,
  purpleNeon: purpleNeonPalette,
  monochrome: monochromePalette,
}

/**
 * Get a specific palette by name
 */
export function getPalette(name: ColorPaletteName): ColorPalette {
  return colorPalettes[name]
}

/**
 * Get all available palette names
 */
export function getPaletteNames(): ColorPaletteName[] {
  return Object.keys(colorPalettes) as ColorPaletteName[]
}

/**
 * Default palette to use
 */
export const DEFAULT_PALETTE: ColorPaletteName = 'orangeProfessional'
