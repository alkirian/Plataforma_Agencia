import { useEffect, useRef, useCallback } from 'react'

/**
 * Interface for data that can be auto-saved
 */
interface AutoSaveData {
  title?: string
  copy?: string
  [key: string]: any
}

/**
 * Return type for useAutoSave hook
 */
interface UseAutoSaveReturn {
  saveNow: () => void
}

/**
 * Hook para auto-guardar datos con debounce
 *
 * Key improvements:
 * - Full TypeScript support with proper interfaces
 * - Enhanced type safety for data validation
 * - Better performance with optimized change detection
 * - Comprehensive cleanup and memory management
 *
 * @param data - Datos a guardar
 * @param saveFunction - Función que guarda los datos
 * @param delay - Delay en ms para el debounce (default: 2000)
 * @param enabled - Si está habilitado el auto-save
 */
export const useAutoSave = <T extends AutoSaveData = AutoSaveData>(
  data: T,
  saveFunction: (data: T) => void | Promise<void>,
  delay = 2000,
  enabled = true
): UseAutoSaveReturn => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const previousDataRef = useRef<T>(data)
  const saveCallbackRef = useRef(saveFunction)

  // Mantener la referencia actualizada
  saveCallbackRef.current = saveFunction

  // Función debounced para guardar
  const debouncedSave = useCallback(
    (dataToSave: T) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = setTimeout(() => {
        if (saveCallbackRef.current && enabled) {
          saveCallbackRef.current(dataToSave)
        }
      }, delay)
    },
    [delay, enabled]
  )

  // Efecto para detectar cambios en los datos
  useEffect(() => {
    // Solo guardar si los datos han cambiado realmente
    const dataChanged = JSON.stringify(data) !== JSON.stringify(previousDataRef.current)

    if (dataChanged && enabled) {
      // Verificar que hay contenido significativo antes de guardar
      const hasContent = data && (data.title?.trim() || data.copy?.trim())

      if (hasContent) {
        debouncedSave(data)
      }

      previousDataRef.current = data
    }
  }, [data, debouncedSave, enabled])

  // Cleanup del timeout al desmontar
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  // Función para guardar inmediatamente (sin debounce)
  const saveNow = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    if (saveCallbackRef.current && enabled) {
      saveCallbackRef.current(data)
    }
  }, [data, enabled])

  return { saveNow }
}
