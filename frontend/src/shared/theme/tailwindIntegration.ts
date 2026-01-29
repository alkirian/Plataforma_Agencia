/**
 * TAILWIND CSS INTEGRATION UTILITIES
 *
 * This module provides utilities for seamlessly integrating the centralized
 * color system with Tailwind CSS classes and the existing design system.
 */

import { type ColorPalette, ColorPaletteName } from './colorPalettes'
import { getCSSVar } from './cssVariableGenerator'

/**
 * Tailwind color mapping configuration
 * Maps semantic color names to Tailwind-compatible color objects
 */
export interface TailwindColorConfig {
  [key: string]: string | { [key: string]: string }
}

/**
 * Generate Tailwind color configuration from a color palette
 * @param palette - Color palette to convert
 * @returns Tailwind-compatible color configuration
 */
export function generateTailwindColors(palette: ColorPalette): TailwindColorConfig {
  return {
    // Background colors
    'theme-bg': {
      primary: getCSSVar('background.primary'),
      secondary: getCSSVar('background.secondary'),
      tertiary: getCSSVar('background.tertiary'),
      inverse: getCSSVar('background.inverse'),
    },

    // Surface colors
    'theme-surface': {
      DEFAULT: getCSSVar('surface.default'),
      soft: getCSSVar('surface.soft'),
      strong: getCSSVar('surface.strong'),
      overlay: getCSSVar('surface.overlay'),
    },

    // Text colors
    'theme-text': {
      primary: getCSSVar('text.primary'),
      secondary: getCSSVar('text.secondary'),
      muted: getCSSVar('text.muted'),
      inverse: getCSSVar('text.inverse'),
      accent: getCSSVar('text.accent'),
    },

    // Border colors
    'theme-border': {
      DEFAULT: getCSSVar('border.default'),
      subtle: getCSSVar('border.subtle'),
      strong: getCSSVar('border.strong'),
      interactive: getCSSVar('border.interactive'),
    },

    // Interactive colors
    'theme-interactive': {
      primary: getCSSVar('interactive.primary'),
      'primary-hover': getCSSVar('interactive.primaryHover'),
      secondary: getCSSVar('interactive.secondary'),
      'secondary-hover': getCSSVar('interactive.secondaryHover'),
      tertiary: getCSSVar('interactive.tertiary'),
      'tertiary-hover': getCSSVar('interactive.tertiaryHover'),
    },

    // Status colors
    'theme-status': {
      success: getCSSVar('status.success'),
      warning: getCSSVar('status.warning'),
      error: getCSSVar('status.error'),
      info: getCSSVar('status.info'),
    },
  }
}

/**
 * Generate complete Tailwind config extension
 * @param palette - Color palette to use
 * @returns Tailwind config extension object
 */
export function generateTailwindExtension(palette: ColorPalette) {
  const colors = generateTailwindColors(palette)

  return {
    colors,
    backgroundImage: {
      'theme-gradient-primary': getCSSVar('gradients.primary'),
      'theme-gradient-secondary': getCSSVar('gradients.secondary'),
      'theme-gradient-accent': getCSSVar('gradients.accent'),
      'theme-gradient-surface': getCSSVar('gradients.surface'),
    },
    boxShadow: {
      'theme-subtle': `0 2px 4px ${getCSSVar('shadows.subtle')}`,
      'theme-medium': `0 4px 12px ${getCSSVar('shadows.medium')}`,
      'theme-strong': `0 8px 24px ${getCSSVar('shadows.strong')}`,
      'theme-glow': `0 0 20px ${getCSSVar('shadows.glow')}`,
    },
    dropShadow: {
      'theme-subtle': `0 2px 4px ${getCSSVar('shadows.subtle')}`,
      'theme-medium': `0 4px 12px ${getCSSVar('shadows.medium')}`,
      'theme-strong': `0 8px 24px ${getCSSVar('shadows.strong')}`,
      'theme-glow': `0 0 20px ${getCSSVar('shadows.glow')}`,
    },
  }
}

/**
 * Utility class generator for common theme patterns
 */
export class ThemeUtilities {
  private readonly palette: ColorPalette

  constructor(palette: ColorPalette) {
    this.palette = palette
  }

  /**
   * Get background utility classes
   */
  get backgrounds() {
    return {
      primary: `bg-[${getCSSVar('background.primary')}]`,
      secondary: `bg-[${getCSSVar('background.secondary')}]`,
      tertiary: `bg-[${getCSSVar('background.tertiary')}]`,
      surface: `bg-[${getCSSVar('surface.default')}]`,
      surfaceSoft: `bg-[${getCSSVar('surface.soft')}]`,
      surfaceStrong: `bg-[${getCSSVar('surface.strong')}]`,
    }
  }

  /**
   * Get text utility classes
   */
  get text() {
    return {
      primary: `text-[${getCSSVar('text.primary')}]`,
      secondary: `text-[${getCSSVar('text.secondary')}]`,
      muted: `text-[${getCSSVar('text.muted')}]`,
      accent: `text-[${getCSSVar('text.accent')}]`,
      inverse: `text-[${getCSSVar('text.inverse')}]`,
    }
  }

  /**
   * Get border utility classes
   */
  get borders() {
    return {
      default: `border-[${getCSSVar('border.default')}]`,
      subtle: `border-[${getCSSVar('border.subtle')}]`,
      strong: `border-[${getCSSVar('border.strong')}]`,
      interactive: `border-[${getCSSVar('border.interactive')}]`,
    }
  }

  /**
   * Get interactive element utility classes
   */
  get interactive() {
    return {
      primary: `bg-[${getCSSVar('interactive.primary')}] hover:bg-[${getCSSVar('interactive.primaryHover')}]`,
      secondary: `bg-[${getCSSVar('interactive.secondary')}] hover:bg-[${getCSSVar('interactive.secondaryHover')}]`,
      tertiary: `bg-[${getCSSVar('interactive.tertiary')}] hover:bg-[${getCSSVar('interactive.tertiaryHover')}]`,

      // Button variants
      primaryButton: `bg-[${getCSSVar('interactive.primary')}] text-[${getCSSVar('text.inverse')}] border-[${getCSSVar('border.interactive')}] hover:bg-[${getCSSVar('interactive.primaryHover')}]`,
      secondaryButton: `bg-[${getCSSVar('interactive.secondary')}] text-[${getCSSVar('text.primary')}] border-[${getCSSVar('border.default')}] hover:bg-[${getCSSVar('interactive.secondaryHover')}]`,
      ghostButton: `bg-transparent text-[${getCSSVar('text.primary')}] border-[${getCSSVar('border.subtle')}] hover:bg-[${getCSSVar('surface.soft')}]`,
    }
  }

  /**
   * Get status utility classes
   */
  get status() {
    return {
      success: `text-[${getCSSVar('status.success')}] bg-[${getCSSVar('status.success')}]/10 border-[${getCSSVar('status.success')}]/30`,
      warning: `text-[${getCSSVar('status.warning')}] bg-[${getCSSVar('status.warning')}]/10 border-[${getCSSVar('status.warning')}]/30`,
      error: `text-[${getCSSVar('status.error')}] bg-[${getCSSVar('status.error')}]/10 border-[${getCSSVar('status.error')}]/30`,
      info: `text-[${getCSSVar('status.info')}] bg-[${getCSSVar('status.info')}]/10 border-[${getCSSVar('status.info')}]/30`,
    }
  }

  /**
   * Get card utility classes
   */
  get cards() {
    return {
      default: `bg-[${getCSSVar('surface.default')}] border-[${getCSSVar('border.default')}] shadow-[0_4px_12px_${getCSSVar('shadows.subtle')}]`,
      elevated: `bg-[${getCSSVar('surface.strong')}] border-[${getCSSVar('border.strong')}] shadow-[0_8px_24px_${getCSSVar('shadows.medium')}]`,
      interactive: `bg-[${getCSSVar('surface.default')}] border-[${getCSSVar('border.default')}] hover:border-[${getCSSVar('border.interactive')}] hover:shadow-[0_8px_24px_${getCSSVar('shadows.glow')}]`,
    }
  }

  /**
   * Get input utility classes
   */
  get inputs() {
    return {
      default: `bg-[${getCSSVar('surface.soft')}] text-[${getCSSVar('text.primary')}] border-[${getCSSVar('border.default')}] focus:border-[${getCSSVar('border.interactive')}] placeholder:text-[${getCSSVar('text.muted')}]`,
      error: `bg-[${getCSSVar('surface.soft')}] text-[${getCSSVar('text.primary')}] border-[${getCSSVar('status.error')}] focus:border-[${getCSSVar('status.error')}]`,
      success: `bg-[${getCSSVar('surface.soft')}] text-[${getCSSVar('text.primary')}] border-[${getCSSVar('status.success')}] focus:border-[${getCSSVar('status.success')}]`,
    }
  }
}

/**
 * Create theme utilities instance
 * @param palette - Color palette to use
 * @returns ThemeUtilities instance
 */
export function createThemeUtilities(palette: ColorPalette): ThemeUtilities {
  return new ThemeUtilities(palette)
}

/**
 * CSS-in-JS style object generator
 * Useful for styled-components or emotion
 */
export function generateCSSInJSStyles(palette: ColorPalette) {
  return {
    colors: {
      background: {
        primary: getCSSVar('background.primary'),
        secondary: getCSSVar('background.secondary'),
        tertiary: getCSSVar('background.tertiary'),
        inverse: getCSSVar('background.inverse'),
      },
      surface: {
        default: getCSSVar('surface.default'),
        soft: getCSSVar('surface.soft'),
        strong: getCSSVar('surface.strong'),
        overlay: getCSSVar('surface.overlay'),
      },
      text: {
        primary: getCSSVar('text.primary'),
        secondary: getCSSVar('text.secondary'),
        muted: getCSSVar('text.muted'),
        inverse: getCSSVar('text.inverse'),
        accent: getCSSVar('text.accent'),
      },
      border: {
        default: getCSSVar('border.default'),
        subtle: getCSSVar('border.subtle'),
        strong: getCSSVar('border.strong'),
        interactive: getCSSVar('border.interactive'),
      },
      interactive: {
        primary: getCSSVar('interactive.primary'),
        primaryHover: getCSSVar('interactive.primaryHover'),
        secondary: getCSSVar('interactive.secondary'),
        secondaryHover: getCSSVar('interactive.secondaryHover'),
        tertiary: getCSSVar('interactive.tertiary'),
        tertiaryHover: getCSSVar('interactive.tertiaryHover'),
      },
      status: {
        success: getCSSVar('status.success'),
        warning: getCSSVar('status.warning'),
        error: getCSSVar('status.error'),
        info: getCSSVar('status.info'),
      },
    },
    gradients: {
      primary: getCSSVar('gradients.primary'),
      secondary: getCSSVar('gradients.secondary'),
      accent: getCSSVar('gradients.accent'),
      surface: getCSSVar('gradients.surface'),
    },
    shadows: {
      subtle: `0 2px 4px ${getCSSVar('shadows.subtle')}`,
      medium: `0 4px 12px ${getCSSVar('shadows.medium')}`,
      strong: `0 8px 24px ${getCSSVar('shadows.strong')}`,
      glow: `0 0 20px ${getCSSVar('shadows.glow')}`,
    },
  }
}

/**
 * Helper functions for common color operations
 */
export const colorHelpers = {
  /**
   * Get a theme-aware color value
   * @param path - Dot notation path to the color
   * @returns CSS variable reference
   */
  getColor: (path: keyof ColorPalette | string) => {
    return getCSSVar(path)
  },

  /**
   * Create a Tailwind class with theme color
   * @param prefix - Tailwind prefix (bg-, text-, border-, etc.)
   * @param path - Color path
   * @returns Tailwind class string
   */
  createTailwindClass: (prefix: string, path: string) => {
    return `${prefix}[${getCSSVar(path)}]`
  },

  /**
   * Create opacity variants for a color
   * @param path - Color path
   * @param opacities - Array of opacity values
   * @returns Object with opacity variants
   */
  createOpacityVariants: (path: string, opacities: number[]) => {
    const baseVar = getCSSVar(path)
    return opacities.reduce(
      (acc, opacity) => {
        acc[opacity] = `${baseVar}/${Math.round(opacity * 100)}`
        return acc
      },
      {} as Record<number, string>
    )
  },

  /**
   * Create hover state classes
   * @param basePath - Base color path
   * @param hoverPath - Hover color path
   * @returns Combined class string
   */
  createHoverState: (basePath: string, hoverPath: string) => {
    return `bg-[${getCSSVar(basePath)}] hover:bg-[${getCSSVar(hoverPath)}]`
  },
}

/**
 * Export types for TypeScript support
 */
export type { TailwindColorConfig }

/**
 * Migration helper for existing color usage
 */
export const migrationHelper = {
  /**
   * Map old color references to new theme variables
   */
  colorMappings: {
    // Old Tailwind colors -> Theme variables
    'bg-gray-900': getCSSVar('background.primary'),
    'bg-gray-800': getCSSVar('background.secondary'),
    'bg-gray-700': getCSSVar('surface.default'),
    'text-white': getCSSVar('text.primary'),
    'text-gray-300': getCSSVar('text.secondary'),
    'text-gray-400': getCSSVar('text.muted'),
    'border-gray-600': getCSSVar('border.default'),
    'border-gray-500': getCSSVar('border.strong'),

    // Brand colors
    'bg-blue-600': getCSSVar('interactive.primary'),
    'bg-blue-500': getCSSVar('interactive.primaryHover'),
    'text-blue-400': getCSSVar('text.accent'),
    'border-blue-500': getCSSVar('border.interactive'),
  },

  /**
   * Get migration suggestion for a color class
   * @param oldClass - Old Tailwind class
   * @returns Suggested new class or null
   */
  getSuggestion: (oldClass: string): string | null => {
    return migrationHelper.colorMappings[oldClass] || null
  },
}
