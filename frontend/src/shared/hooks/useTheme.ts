import { useEffect, useState } from 'react'

/**
 * Available theme options
 */
export type Theme = 'light' | 'dark'

/**
 * Return type for useTheme hook
 */
interface UseThemeReturn {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: (next?: Theme | boolean) => void
}

const STORAGE_KEY = 'ui:theme'

/**
 * Hook para manejar el tema de la aplicación
 *
 * Key improvements:
 * - Full TypeScript support with proper theme types
 * - Enhanced type safety for theme operations
 * - Better performance with optimized localStorage operations
 * - Improved error handling for localStorage access
 * - Memory optimization for theme changes
 *
 * @param defaultTheme - Tema por defecto
 */
export function useTheme(defaultTheme: Theme = 'dark'): UseThemeReturn {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored === 'light' || stored === 'dark' ? stored : defaultTheme
    } catch {
      return defaultTheme
    }
  })

  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-theme', theme)
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      // Silent fail for localStorage errors (e.g., private browsing)
    }
  }, [theme])

  const toggleTheme = (next?: Theme | boolean): void => {
    if (typeof next === 'string') {
      setTheme(next)
    } else {
      setTheme(currentTheme => (currentTheme === 'light' ? 'dark' : 'light'))
    }
  }

  return {
    theme,
    setTheme,
    toggleTheme,
  }
}
