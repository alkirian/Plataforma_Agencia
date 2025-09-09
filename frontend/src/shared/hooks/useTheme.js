import { useEffect, useState } from 'react'

const STORAGE_KEY = 'ui:theme'

export function useTheme(defaultTheme = 'dark') {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || defaultTheme
    } catch {
      return defaultTheme
    }
  })

  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-theme', theme)
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {}
  }, [theme])

  const toggleTheme = next => {
    if (typeof next === 'string') {
      setTheme(next)
    } else {
      setTheme(t => (t === 'light' ? 'dark' : 'light'))
    }
  }

  return { theme, setTheme, toggleTheme }
}
