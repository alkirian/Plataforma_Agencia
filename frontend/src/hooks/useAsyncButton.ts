import { useState, useCallback } from 'react'

/**
 * Hook para manejar botones con operaciones asíncronas
 * Proporciona estado de loading y manejo de errores
 */
export interface UseAsyncButtonOptions {
  onError?: (error: Error) => void
  onSuccess?: () => void
}

export interface UseAsyncButtonReturn {
  loading: boolean
  error: Error | null
  handleClick: () => Promise<void>
}

export function useAsyncButton(
  asyncFunction: () => Promise<void> | void,
  options: UseAsyncButtonOptions = {}
): UseAsyncButtonReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const handleClick = useCallback(async () => {
    if (loading) return

    setLoading(true)
    setError(null)

    try {
      await asyncFunction()
      options.onSuccess?.()
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An error occurred')
      setError(error)
      options.onError?.(error)
    } finally {
      setLoading(false)
    }
  }, [asyncFunction, loading, options])

  return {
    loading,
    error,
    handleClick,
  }
}
