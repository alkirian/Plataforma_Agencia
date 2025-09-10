/**
 * ENHANCED THEME CONTEXT
 * 
 * Provides comprehensive theme management including:
 * - Dynamic color palette switching
 * - Theme mode (light/dark) management
 * - Persistent theme preferences
 * - Real-time CSS variable updates
 */

import React, { 
  createContext, 
  useContext, 
  useEffect, 
  useState, 
  useCallback,
  ReactNode,
  useMemo
} from 'react'
import { 
  ColorPalette, 
  ColorPaletteName, 
  colorPalettes, 
  DEFAULT_PALETTE,
  getPalette 
} from '../theme/colorPalettes'
import { 
  applyColorPalette, 
  setActiveColorPalette,
  clearThemeVariables,
  isColorPaletteActive 
} from '../theme/cssVariableGenerator'

/**
 * Theme mode options
 */
export type ThemeMode = 'light' | 'dark' | 'system'

/**
 * Theme preferences interface
 */
interface ThemePreferences {
  colorPalette: ColorPaletteName
  mode: ThemeMode
  animations: boolean
  reducedMotion: boolean
}

/**
 * Theme context interface
 */
interface ThemeContextType {
  // Current theme state
  currentPalette: ColorPalette
  currentPaletteName: ColorPaletteName
  mode: ThemeMode
  preferences: ThemePreferences
  
  // Theme switching functions
  setColorPalette: (palette: ColorPaletteName) => void
  setMode: (mode: ThemeMode) => void
  toggleMode: () => void
  
  // Preference management
  updatePreferences: (preferences: Partial<ThemePreferences>) => void
  resetToDefaults: () => void
  
  // Utility functions
  isDarkMode: boolean
  isSystemMode: boolean
  availablePalettes: ColorPaletteName[]
  
  // CSS helpers
  getCSSVariable: (path: string) => string
  applyCustomPalette: (palette: ColorPalette) => void
}

/**
 * Default theme preferences
 */
const DEFAULT_PREFERENCES: ThemePreferences = {
  colorPalette: DEFAULT_PALETTE,
  mode: 'dark',
  animations: true,
  reducedMotion: false,
}

/**
 * Storage keys for theme persistence
 */
const STORAGE_KEYS = {
  PREFERENCES: 'ui:theme:preferences',
  COLOR_PALETTE: 'ui:theme:color-palette',
  MODE: 'ui:theme:mode',
} as const

/**
 * Create theme context
 */
const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

/**
 * Theme provider props
 */
interface ThemeProviderProps {
  children: ReactNode
  defaultPalette?: ColorPaletteName
  defaultMode?: ThemeMode
  persistPreferences?: boolean
}

/**
 * Enhanced Theme Provider Component
 */
export function ThemeProvider({
  children,
  defaultPalette = DEFAULT_PALETTE,
  defaultMode = 'dark',
  persistPreferences = true,
}: ThemeProviderProps): JSX.Element {
  // Initialize preferences from storage or defaults
  const [preferences, setPreferences] = useState<ThemePreferences>(() => {
    if (!persistPreferences || typeof window === 'undefined') {
      return { ...DEFAULT_PREFERENCES, colorPalette: defaultPalette, mode: defaultMode }
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PREFERENCES)
      if (stored) {
        const parsed = JSON.parse(stored)
        return { ...DEFAULT_PREFERENCES, ...parsed }
      }
    } catch (error) {
      console.warn('Failed to load theme preferences:', error)
    }

    return { ...DEFAULT_PREFERENCES, colorPalette: defaultPalette, mode: defaultMode }
  })

  // Detect system theme preference
  const [systemIsDark, setSystemIsDark] = useState(() => {
    if (typeof window === 'undefined') return true
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  // Calculate effective dark mode state
  const isDarkMode = useMemo(() => {
    if (preferences.mode === 'system') return systemIsDark
    return preferences.mode === 'dark'
  }, [preferences.mode, systemIsDark])

  // Get current palette
  const currentPalette = useMemo(() => {
    return getPalette(preferences.colorPalette)
  }, [preferences.colorPalette])

  // Listen for system theme changes
  useEffect(() => {
    if (typeof window === 'undefined') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e: MediaQueryListEvent) => setSystemIsDark(e.matches)

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  // Listen for reduced motion preference
  useEffect(() => {
    if (typeof window === 'undefined') return

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handleChange = (e: MediaQueryListEvent) => {
      setPreferences(prev => ({ ...prev, reducedMotion: e.matches }))
    }

    // Set initial value
    handleChange({ matches: mediaQuery.matches } as MediaQueryListEvent)

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  // Apply theme to DOM
  useEffect(() => {
    // Apply color palette
    applyColorPalette(currentPalette)
    setActiveColorPalette(preferences.colorPalette)
    
    // Apply theme mode
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light')
    
    // Apply reduced motion preference
    document.documentElement.setAttribute(
      'data-reduced-motion', 
      preferences.reducedMotion ? 'reduce' : 'no-preference'
    )
    
    // Apply animations preference
    document.documentElement.setAttribute(
      'data-animations', 
      preferences.animations ? 'enabled' : 'disabled'
    )
  }, [currentPalette, preferences, isDarkMode])

  // Persist preferences
  useEffect(() => {
    if (!persistPreferences || typeof window === 'undefined') return

    try {
      localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(preferences))
    } catch (error) {
      console.warn('Failed to save theme preferences:', error)
    }
  }, [preferences, persistPreferences])

  // Theme manipulation functions
  const setColorPalette = useCallback((palette: ColorPaletteName) => {
    setPreferences(prev => ({ ...prev, colorPalette: palette }))
  }, [])

  const setMode = useCallback((mode: ThemeMode) => {
    setPreferences(prev => ({ ...prev, mode }))
  }, [])

  const toggleMode = useCallback(() => {
    setPreferences(prev => ({
      ...prev,
      mode: prev.mode === 'dark' ? 'light' : prev.mode === 'light' ? 'system' : 'dark'
    }))
  }, [])

  const updatePreferences = useCallback((updates: Partial<ThemePreferences>) => {
    setPreferences(prev => ({ ...prev, ...updates }))
  }, [])

  const resetToDefaults = useCallback(() => {
    setPreferences(DEFAULT_PREFERENCES)
    clearThemeVariables()
  }, [])

  const getCSSVariable = useCallback((path: string) => {
    const cssVarName = `--theme-${path.replace(/\./g, '-')}`
    return `var(${cssVarName})`
  }, [])

  const applyCustomPalette = useCallback((palette: ColorPalette) => {
    applyColorPalette(palette)
  }, [])

  // Context value
  const contextValue: ThemeContextType = useMemo(() => ({
    currentPalette,
    currentPaletteName: preferences.colorPalette,
    mode: preferences.mode,
    preferences,
    
    setColorPalette,
    setMode,
    toggleMode,
    
    updatePreferences,
    resetToDefaults,
    
    isDarkMode,
    isSystemMode: preferences.mode === 'system',
    availablePalettes: Object.keys(colorPalettes) as ColorPaletteName[],
    
    getCSSVariable,
    applyCustomPalette,
  }), [
    currentPalette,
    preferences,
    setColorPalette,
    setMode,
    toggleMode,
    updatePreferences,
    resetToDefaults,
    isDarkMode,
    getCSSVariable,
    applyCustomPalette,
  ])

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  )
}

/**
 * Enhanced useTheme hook
 */
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext)
  
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  
  return context
}

/**
 * Hook for accessing specific color values with type safety
 */
export function useThemeColors() {
  const { currentPalette, getCSSVariable } = useTheme()
  
  return {
    colors: currentPalette,
    css: {
      // Background colors
      bgPrimary: getCSSVariable('background.primary'),
      bgSecondary: getCSSVariable('background.secondary'),
      bgTertiary: getCSSVariable('background.tertiary'),
      
      // Surface colors
      surfaceDefault: getCSSVariable('surface.default'),
      surfaceSoft: getCSSVariable('surface.soft'),
      surfaceStrong: getCSSVariable('surface.strong'),
      
      // Text colors
      textPrimary: getCSSVariable('text.primary'),
      textSecondary: getCSSVariable('text.secondary'),
      textMuted: getCSSVariable('text.muted'),
      textAccent: getCSSVariable('text.accent'),
      
      // Interactive colors
      interactivePrimary: getCSSVariable('interactive.primary'),
      interactivePrimaryHover: getCSSVariable('interactive.primaryHover'),
      interactiveSecondary: getCSSVariable('interactive.secondary'),
      
      // Border colors
      borderDefault: getCSSVariable('border.default'),
      borderSubtle: getCSSVariable('border.subtle'),
      borderStrong: getCSSVariable('border.strong'),
      borderInteractive: getCSSVariable('border.interactive'),
      
      // Status colors
      statusSuccess: getCSSVariable('status.success'),
      statusWarning: getCSSVariable('status.warning'),
      statusError: getCSSVariable('status.error'),
      statusInfo: getCSSVariable('status.info'),
    }
  }
}

/**
 * Hook for theme-aware animations
 */
export function useThemeAnimation() {
  const { preferences } = useTheme()
  
  const getAnimationProps = useCallback((defaultAnimation: any) => {
    if (!preferences.animations || preferences.reducedMotion) {
      return { animate: false, transition: { duration: 0 } }
    }
    return defaultAnimation
  }, [preferences.animations, preferences.reducedMotion])
  
  return {
    animationsEnabled: preferences.animations && !preferences.reducedMotion,
    getAnimationProps,
  }
}

/**
 * Export context for advanced usage
 */
export { ThemeContext }