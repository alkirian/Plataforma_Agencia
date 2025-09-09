import { useState, useEffect, useCallback } from 'react'

// Device type constants
export type DeviceType = 'mobile' | 'tablet' | 'desktop'

// Breakpoint configuration
interface DeviceBreakpoints {
  mobile: number
  tablet: number
}

const DEFAULT_BREAKPOINTS: DeviceBreakpoints = {
  mobile: 640,
  tablet: 1024,
}

// Hook configuration options
interface UseDeviceTypeOptions {
  breakpoints?: Partial<DeviceBreakpoints>
  debounceMs?: number
  serverSideDefault?: DeviceType
}

// Hook return type
interface UseDeviceTypeReturn {
  deviceType: DeviceType
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  screenWidth: number
  orientation: 'portrait' | 'landscape'
  refresh: () => void
}

/**
 * Enhanced hook for detecting device type based on screen width with TypeScript support
 *
 * Features:
 * - TypeScript support with proper typing
 * - Configurable breakpoints
 * - Debounced resize handling for performance
 * - Orientation detection
 * - Server-side rendering support
 * - Additional utility properties
 * - Manual refresh capability
 */
export const useDeviceType = (options: UseDeviceTypeOptions = {}): UseDeviceTypeReturn => {
  const { breakpoints = {}, debounceMs = 100, serverSideDefault = 'desktop' } = options

  const finalBreakpoints: DeviceBreakpoints = {
    ...DEFAULT_BREAKPOINTS,
    ...breakpoints,
  }

  // Helper function to determine device type from width
  const getDeviceType = useCallback(
    (width: number): DeviceType => {
      if (width <= finalBreakpoints.mobile) return 'mobile'
      if (width <= finalBreakpoints.tablet) return 'tablet'
      return 'desktop'
    },
    [finalBreakpoints]
  )

  // Helper function to get orientation
  const getOrientation = useCallback((width: number, height: number): 'portrait' | 'landscape' => {
    return width > height ? 'landscape' : 'portrait'
  }, [])

  // Initialize state with proper SSR handling
  const [deviceState, setDeviceState] = useState<{
    deviceType: DeviceType
    screenWidth: number
    orientation: 'portrait' | 'landscape'
  }>(() => {
    if (typeof window === 'undefined') {
      return {
        deviceType: serverSideDefault,
        screenWidth: 1024,
        orientation: 'landscape',
      }
    }

    const width = window.innerWidth
    const height = window.innerHeight

    return {
      deviceType: getDeviceType(width),
      screenWidth: width,
      orientation: getOrientation(width, height),
    }
  })

  // Manual refresh function
  const refresh = useCallback(() => {
    if (typeof window === 'undefined') return

    const width = window.innerWidth
    const height = window.innerHeight
    const newDeviceType = getDeviceType(width)
    const newOrientation = getOrientation(width, height)

    setDeviceState(prev => {
      // Only update if something actually changed to prevent unnecessary re-renders
      if (
        prev.deviceType === newDeviceType &&
        prev.screenWidth === width &&
        prev.orientation === newOrientation
      ) {
        return prev
      }

      return {
        deviceType: newDeviceType,
        screenWidth: width,
        orientation: newOrientation,
      }
    })
  }, [getDeviceType, getOrientation])

  // Debounced resize handler for better performance
  useEffect(() => {
    if (typeof window === 'undefined') return

    let timeoutId: NodeJS.Timeout

    const handleResize = () => {
      // Clear previous timeout
      if (timeoutId) {
        clearTimeout(timeoutId)
      }

      // Debounce the resize handling
      timeoutId = setTimeout(() => {
        refresh()
      }, debounceMs)
    }

    // Set up event listener
    window.addEventListener('resize', handleResize, { passive: true })

    // Initial check in case window size changed before effect ran
    refresh()

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [refresh, debounceMs])

  // Additional utility properties
  const isMobile = deviceState.deviceType === 'mobile'
  const isTablet = deviceState.deviceType === 'tablet'
  const isDesktop = deviceState.deviceType === 'desktop'

  return {
    deviceType: deviceState.deviceType,
    isMobile,
    isTablet,
    isDesktop,
    screenWidth: deviceState.screenWidth,
    orientation: deviceState.orientation,
    refresh,
  }
}

/**
 * Simplified hook that only returns the device type string
 */
export const useSimpleDeviceType = (options: UseDeviceTypeOptions = {}): DeviceType => {
  const { deviceType } = useDeviceType(options)
  return deviceType
}

/**
 * Hook that returns boolean flags for each device type
 */
export const useDeviceFlags = (options: UseDeviceTypeOptions = {}) => {
  const { isMobile, isTablet, isDesktop } = useDeviceType(options)
  return { isMobile, isTablet, isDesktop }
}

/**
 * Custom hook for responsive design patterns
 */
export const useResponsive = (options: UseDeviceTypeOptions = {}) => {
  const deviceData = useDeviceType(options)

  return {
    ...deviceData,
    // Convenience methods for responsive design
    showOnMobile: deviceData.isMobile,
    showOnTabletUp: deviceData.isTablet || deviceData.isDesktop,
    showOnDesktop: deviceData.isDesktop,
    hideOnMobile: !deviceData.isMobile,
    hideOnDesktop: !deviceData.isDesktop,
  }
}

export default useDeviceType
