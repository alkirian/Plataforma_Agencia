import { useEffect, useRef, type RefObject } from 'react'

// Touch position interface
interface TouchPosition {
  x: number
  y: number
}

// Swipe delta information
export interface SwipeDelta {
  deltaX: number
  deltaY: number
}

// Swipe direction type
export type SwipeDirection = 'left' | 'right' | 'up' | 'down'

// Event handler types
export type SwipeHandler = (event: TouchEvent, delta: SwipeDelta) => void
export type TouchHandler = (event: TouchEvent) => void

// Swipe gesture options
export interface UseSwipeGesturesOptions {
  onSwipeLeft?: SwipeHandler
  onSwipeRight?: SwipeHandler
  onSwipeUp?: SwipeHandler
  onSwipeDown?: SwipeHandler
  threshold?: number
  preventDefaultTouchmoveEvent?: boolean
  onTouchStart?: TouchHandler
  onTouchMove?: TouchHandler
  onTouchEnd?: TouchHandler
  disabled?: boolean
}

// Hook return type
interface UseSwipeGesturesReturn<T = HTMLElement> {
  ref: RefObject<T>
}

/**
 * Enhanced hook for handling swipe gestures on touch devices with TypeScript support
 *
 * Features:
 * - TypeScript support with comprehensive typing
 * - Configurable swipe threshold
 * - Optional preventDefault handling
 * - Custom touch event handlers
 * - Direction-specific swipe handlers
 * - Passive event listeners for better performance
 * - Disabled state support
 * - Generic ref typing for different element types
 */
export function useSwipeGestures<T extends HTMLElement = HTMLElement>(
  options: UseSwipeGesturesOptions = {}
): UseSwipeGesturesReturn<T> {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    threshold = 50,
    preventDefaultTouchmoveEvent = false,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    disabled = false,
  } = options

  const elementRef = useRef<T>(null)
  const startPos = useRef<TouchPosition>({ x: 0, y: 0 })
  const isTracking = useRef<boolean>(false)

  useEffect(() => {
    const element = elementRef.current
    if (!element || disabled) return

    const handleTouchStart = (e: TouchEvent): void => {
      const touch = e.touches[0]
      if (!touch) return

      startPos.current = { x: touch.clientX, y: touch.clientY }
      isTracking.current = true

      onTouchStart?.(e)
    }

    const handleTouchMove = (e: TouchEvent): void => {
      if (preventDefaultTouchmoveEvent) {
        e.preventDefault()
      }

      if (!isTracking.current) return

      onTouchMove?.(e)
    }

    const handleTouchEnd = (e: TouchEvent): void => {
      if (!isTracking.current) return

      isTracking.current = false
      const touch = e.changedTouches[0]
      if (!touch) return

      const endPos: TouchPosition = { x: touch.clientX, y: touch.clientY }
      const deltaX = endPos.x - startPos.current.x
      const deltaY = endPos.y - startPos.current.y
      const delta: SwipeDelta = { deltaX, deltaY }

      const absDeltaX = Math.abs(deltaX)
      const absDeltaY = Math.abs(deltaY)

      // Determine swipe direction based on the larger delta
      if (Math.max(absDeltaX, absDeltaY) > threshold) {
        if (absDeltaX > absDeltaY) {
          // Horizontal swipe
          if (deltaX > 0) {
            onSwipeRight?.(e, delta)
          } else {
            onSwipeLeft?.(e, delta)
          }
        } else {
          // Vertical swipe
          if (deltaY > 0) {
            onSwipeDown?.(e, delta)
          } else {
            onSwipeUp?.(e, delta)
          }
        }
      }

      onTouchEnd?.(e)
    }

    // Add event listeners with proper options
    const touchStartOptions: AddEventListenerOptions = { passive: true }
    const touchMoveOptions: AddEventListenerOptions = {
      passive: !preventDefaultTouchmoveEvent,
    }
    const touchEndOptions: AddEventListenerOptions = { passive: true }

    element.addEventListener('touchstart', handleTouchStart, touchStartOptions)
    element.addEventListener('touchmove', handleTouchMove, touchMoveOptions)
    element.addEventListener('touchend', handleTouchEnd, touchEndOptions)

    // Cleanup function
    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)
    }
  }, [
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    threshold,
    preventDefaultTouchmoveEvent,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    disabled,
  ])

  return {
    ref: elementRef,
  }
}

// Calendar navigation options
interface UseCalendarSwipeOptions {
  onPrevious?: () => void
  onNext?: () => void
  threshold?: number
  disabled?: boolean
}

/**
 * Specialized hook for calendar navigation with swipe gestures
 */
export function useCalendarSwipe<T extends HTMLElement = HTMLElement>(
  options: UseCalendarSwipeOptions
): UseSwipeGesturesReturn<T> {
  const { onPrevious, onNext, threshold = 75, disabled = false } = options

  return useSwipeGestures<T>({
    onSwipeLeft: () => {
      onNext?.()
    },
    onSwipeRight: () => {
      onPrevious?.()
    },
    threshold, // Higher threshold to avoid accidental swipes
    disabled,
  })
}

// Pull-to-refresh options
interface UsePullToRefreshOptions {
  onRefresh?: () => Promise<void> | void
  threshold?: number
  disabled?: boolean
  refreshIndicatorColor?: string
}

/**
 * Hook for implementing pull-to-refresh functionality
 */
export function usePullToRefresh<T extends HTMLElement = HTMLElement>(
  options: UsePullToRefreshOptions
): UseSwipeGesturesReturn<T> {
  const { onRefresh, threshold = 80, disabled = false } = options

  const isRefreshing = useRef<boolean>(false)
  const startY = useRef<number>(0)
  const currentY = useRef<number>(0)

  return useSwipeGestures<T>({
    onTouchStart: (e: TouchEvent) => {
      const touch = e.touches[0]
      if (!touch) return

      startY.current = touch.clientY
      currentY.current = touch.clientY
    },
    onTouchMove: (e: TouchEvent) => {
      const touch = e.touches[0]
      if (!touch) return

      currentY.current = touch.clientY
      const deltaY = currentY.current - startY.current

      // Only allow pull-to-refresh if we're at the top of the page
      if (window.scrollY === 0 && deltaY > 0) {
        const element = e.currentTarget as HTMLElement
        const pullDistance = Math.min(deltaY, threshold * 1.5)

        // Apply visual transformation
        element.style.transform = `translateY(${pullDistance * 0.3}px)`
        element.style.transition = 'none'

        // Change opacity based on pull distance
        const opacity = Math.min(pullDistance / threshold, 1)
        element.style.opacity = String(0.7 + 0.3 * opacity)
      }
    },
    onTouchEnd: (e: TouchEvent) => {
      const element = e.currentTarget as HTMLElement
      const deltaY = currentY.current - startY.current

      // Reset styles
      element.style.transform = ''
      element.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out'
      element.style.opacity = ''

      // Trigger refresh if threshold reached
      if (deltaY > threshold && window.scrollY === 0 && !isRefreshing.current) {
        isRefreshing.current = true

        const refreshPromise = onRefresh?.()
        if (refreshPromise && typeof refreshPromise.finally === 'function') {
          refreshPromise.finally(() => {
            isRefreshing.current = false
          })
        } else {
          // Handle synchronous refresh
          setTimeout(() => {
            isRefreshing.current = false
          }, 1000)
        }
      }
    },
    preventDefaultTouchmoveEvent: false,
    disabled,
  })
}

// Slide gesture options
interface UseSlideGesturesOptions {
  onSlideNext?: () => void
  onSlidePrev?: () => void
  sensitivity?: number
  minDistance?: number
  disabled?: boolean
}

/**
 * Hook for slide gestures in lists/carousels
 */
export function useSlideGestures<T extends HTMLElement = HTMLElement>(
  options: UseSlideGesturesOptions
): UseSwipeGesturesReturn<T> {
  const {
    onSlideNext,
    onSlidePrev,
    sensitivity = 0.3,
    minDistance = 50,
    disabled = false,
  } = options

  return useSwipeGestures<T>({
    onSwipeLeft: (_e: TouchEvent, { deltaX }: SwipeDelta) => {
      if (Math.abs(deltaX) > minDistance) {
        onSlideNext?.()
      }
    },
    onSwipeRight: (_e: TouchEvent, { deltaX }: SwipeDelta) => {
      if (Math.abs(deltaX) > minDistance) {
        onSlidePrev?.()
      }
    },
    threshold: 30,
    disabled,
  })
}

// Multi-directional swipe options
interface UseMultiDirectionalSwipeOptions {
  onSwipe?: (direction: SwipeDirection, delta: SwipeDelta) => void
  threshold?: number
  disabled?: boolean
}

/**
 * Hook for handling all swipe directions with a single callback
 */
export function useMultiDirectionalSwipe<T extends HTMLElement = HTMLElement>(
  options: UseMultiDirectionalSwipeOptions
): UseSwipeGesturesReturn<T> {
  const { onSwipe, threshold = 50, disabled = false } = options

  const createDirectionHandler = (direction: SwipeDirection): SwipeHandler => {
    return (_e: TouchEvent, delta: SwipeDelta) => {
      onSwipe?.(direction, delta)
    }
  }

  return useSwipeGestures<T>({
    onSwipeLeft: createDirectionHandler('left'),
    onSwipeRight: createDirectionHandler('right'),
    onSwipeUp: createDirectionHandler('up'),
    onSwipeDown: createDirectionHandler('down'),
    threshold,
    disabled,
  })
}

// Export the main hook as default
export default useSwipeGestures
