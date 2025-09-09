import { useEffect, useRef, RefObject } from 'react'

/**
 * Return type for useClickOutside hook
 */
interface UseClickOutsideReturn<T extends HTMLElement> {
  ref: RefObject<T>
}

/**
 * Hook para detectar clicks fuera de un elemento y ejecutar callback
 *
 * Key improvements:
 * - Full TypeScript support with generic element typing
 * - Enhanced type safety for DOM events and references
 * - Better performance with optimized event handling
 * - Improved memory management for event listeners
 * - Generic element type for flexible usage
 *
 * @param callback - Función a ejecutar cuando se hace click fuera
 * @param enabled - Si está habilitado el listener
 * @returns ref object to attach to the element
 */
export const useClickOutside = <T extends HTMLElement = HTMLElement>(
  callback: () => void,
  enabled = true
): RefObject<T> => {
  const ref = useRef<T>(null)

  useEffect(() => {
    if (!enabled) return

    const handleClickOutside = (event: MouseEvent): void => {
      const target = event.target as Node
      if (ref.current && !ref.current.contains(target)) {
        callback()
      }
    }

    const handleEscapeKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        callback()
      }
    }

    // Add listeners
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscapeKey)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscapeKey)
    }
  }, [callback, enabled])

  return ref
}