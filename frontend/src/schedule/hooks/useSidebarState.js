import { useState, useEffect, useCallback } from 'react'
import { useDeviceType } from '@hooks/useDeviceType'

/**
 * Hook to manage sidebar state with localStorage persistence and responsive behavior
 */
export const useSidebarState = () => {
  const { isMobile, isTablet } = useDeviceType()
  const [isCollapsed, setIsCollapsed] = useState(() => {
    // Check localStorage first, default to collapsed on mobile/tablet
    if (typeof window === 'undefined') return false

    const stored = localStorage.getItem('schedule-sidebar-collapsed')
    if (stored !== null) {
      return JSON.parse(stored)
    }

    // Default to collapsed on mobile/tablet
    return isMobile || isTablet
  })

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('schedule-sidebar-collapsed', JSON.stringify(isCollapsed))
  }, [isCollapsed])

  // Auto-collapse on mobile when device type changes
  useEffect(() => {
    if (isMobile && !isCollapsed) {
      setIsCollapsed(true)
    }
  }, [isMobile, isCollapsed])

  const toggle = useCallback(() => {
    setIsCollapsed(prev => !prev)
  }, [])

  const collapse = useCallback(() => {
    setIsCollapsed(true)
  }, [])

  const expand = useCallback(() => {
    setIsCollapsed(false)
  }, [])

  return {
    isCollapsed,
    toggle,
    collapse,
    expand,
    isMobile,
    isTablet,
    // Helper computed values
    sidebarWidth: isCollapsed ? 60 : 320,
    isOverlay: isMobile || isTablet,
  }
}
