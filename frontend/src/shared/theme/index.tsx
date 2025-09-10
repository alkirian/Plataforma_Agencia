/**
 * CENTRALIZED THEME SYSTEM - MAIN EXPORTS
 * 
 * This file provides a single entry point for all theme-related
 * functionality, making imports clean and organized.
 */

import React from 'react'

// Color Palettes
export {
  type ColorPalette,
  type ColorPaletteName,
  orangeProfessionalPalette,
  blueCyberPalette,
  greenEmeraldPalette,
  purpleNeonPalette,
  monochromePalette,
  colorPalettes,
  getPalette,
  getPaletteNames,
  DEFAULT_PALETTE,
} from './colorPalettes'

// CSS Variable Management
export {
  generateCSSVariables,
  applyCSSVariables,
  applyColorPalette,
  getCSSVar,
  generateCSSStylesheet,
  generateCompleteCSSFile,
  batchApplyCSSProperties,
  clearThemeVariables,
  getCurrentCSSVarValue,
  isColorPaletteActive,
  setActiveColorPalette,
} from './cssVariableGenerator'

// Tailwind Integration
export {
  type TailwindColorConfig,
  generateTailwindColors,
  generateTailwindExtension,
  ThemeUtilities,
  createThemeUtilities,
  generateCSSInJSStyles,
  colorHelpers,
  migrationHelper,
} from './tailwindIntegration'

// Theme Context and Hooks
export {
  type ThemeMode,
  ThemeProvider,
  useTheme,
  useThemeColors,
  useThemeAnimation,
  ThemeContext,
} from '../contexts/ThemeContext'

// Theme Components
export {
  ThemeSwitcher,
  QuickThemeSwitcher,
} from '../components/theme/ThemeSwitcher'

/**
 * Quick start utilities for common use cases
 */
export const themeUtils = {
  /**
   * Initialize the theme system in your app
   */
  setup: {
    /**
     * Basic setup with default palette
     * @example
     * import { themeUtils } from '@/shared/theme'
     * 
     * function App() {
     *   return (
     *     <themeUtils.setup.Provider>
     *       <YourApp />
     *     </themeUtils.setup.Provider>
     *   )
     * }
     */
    Provider: ({ children, defaultPalette = 'orangeProfessional' }: { 
      children: React.ReactNode
      defaultPalette?: ColorPaletteName 
    }) => {
      const { ThemeProvider } = require('../contexts/ThemeContext')
      return <ThemeProvider defaultPalette={defaultPalette}>{children}</ThemeProvider>
    },
  },
  
  /**
   * Common Tailwind class patterns
   */
  classes: {
    // Card patterns
    card: {
      default: 'bg-theme-surface-default border border-theme-border-default rounded-xl p-6',
      elevated: 'bg-theme-surface-strong border border-theme-border-strong rounded-xl p-6 shadow-theme-medium',
      interactive: 'bg-theme-surface-default border border-theme-border-default hover:border-theme-border-interactive rounded-xl p-6 transition-all duration-300',
    },
    
    // Button patterns  
    button: {
      primary: 'bg-theme-interactive-primary hover:bg-theme-interactive-primary-hover text-theme-text-inverse px-6 py-3 rounded-lg font-medium transition-all duration-300',
      secondary: 'bg-theme-interactive-secondary hover:bg-theme-interactive-secondary-hover text-theme-text-primary px-6 py-3 rounded-lg font-medium transition-all duration-300',
      ghost: 'bg-transparent hover:bg-theme-surface-soft text-theme-text-primary border border-theme-border-subtle hover:border-theme-border-default px-6 py-3 rounded-lg font-medium transition-all duration-300',
    },
    
    // Input patterns
    input: {
      default: 'bg-theme-surface-soft text-theme-text-primary border border-theme-border-default focus:border-theme-border-interactive rounded-lg px-4 py-3 placeholder:text-theme-text-muted transition-all duration-300',
      error: 'bg-theme-surface-soft text-theme-text-primary border border-theme-status-error focus:border-theme-status-error rounded-lg px-4 py-3 placeholder:text-theme-text-muted transition-all duration-300',
    },
    
    // Text patterns
    text: {
      heading: 'text-theme-text-primary font-semibold',
      body: 'text-theme-text-secondary',
      muted: 'text-theme-text-muted',
      accent: 'text-theme-text-accent font-medium',
    },
    
    // Background patterns
    bg: {
      page: 'bg-theme-bg-primary',
      panel: 'bg-theme-bg-secondary',
      surface: 'bg-theme-surface-default',
      overlay: 'bg-theme-surface-overlay',
    },
  },
  
  /**
   * Animation utilities
   */
  animations: {
    /**
     * Get framer-motion props that respect user preferences
     */
    getMotionProps: (defaultProps: any) => {
      // This would be filled by the useThemeAnimation hook at runtime
      return defaultProps
    },
  },
}

/**
 * Type-safe color access helpers
 */
export type ThemeColorPath = 
  | 'background.primary' | 'background.secondary' | 'background.tertiary' | 'background.inverse'
  | 'surface.default' | 'surface.soft' | 'surface.strong' | 'surface.overlay'  
  | 'text.primary' | 'text.secondary' | 'text.muted' | 'text.inverse' | 'text.accent'
  | 'border.default' | 'border.subtle' | 'border.strong' | 'border.interactive'
  | 'interactive.primary' | 'interactive.primaryHover' | 'interactive.secondary' | 'interactive.secondaryHover' | 'interactive.tertiary' | 'interactive.tertiaryHover'
  | 'status.success' | 'status.warning' | 'status.error' | 'status.info'

/**
 * Utility for getting theme colors with TypeScript safety
 * @param path - Typed path to theme color
 * @returns CSS variable reference
 */
export function getThemeColor(path: ThemeColorPath): string {
  return getCSSVar(path)
}

// Re-export types for convenience
export type {
  ColorPalette,
  ColorPaletteName,
  ThemeMode,
  TailwindColorConfig,
} from './colorPalettes'