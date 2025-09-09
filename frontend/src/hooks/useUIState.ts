import { useState, useCallback } from 'react'

// Generic error type that can hold detailed error information
export interface UIError {
  message: string
  details?: any
  code?: string | number
  statusCode?: number
  timestamp?: Date
}

// Generic async operation type
export type AsyncOperation<T = any> = () => Promise<T>

// Hook options for useUIState
export interface UseUIStateOptions<T = any> {
  initialLoading?: boolean
  initialError?: UIError | null
  initialData?: T | null
  resetOnExecute?: boolean
}

// Return type for useUIState
export interface UseUIStateReturn<T = any> {
  // State properties
  isLoading: boolean
  error: UIError | null
  data: T | null
  hasError: boolean
  hasData: boolean

  // State setters
  setLoading: (loading: boolean) => void
  setSuccess: (result: T) => void
  setFailure: (errorMessage: string, errorDetails?: any) => void
  reset: () => void
  execute: (asyncOperation: AsyncOperation<T>) => Promise<T>

  // Computed properties
  isIdle: boolean
  isSuccess: boolean
}

/**
 * Enhanced hook for managing common UI states with TypeScript support
 *
 * Features:
 * - TypeScript support with generic typing
 * - Comprehensive error handling with detailed error information
 * - Automatic state management for async operations
 * - Configurable initial states
 * - Multiple utility properties and methods
 * - Proper error typing and handling
 */
export function useUIState<T = any>(options: UseUIStateOptions<T> = {}): UseUIStateReturn<T> {
  const {
    initialLoading = false,
    initialError = null,
    initialData = null,
    resetOnExecute = true,
  } = options

  const [isLoading, setIsLoading] = useState<boolean>(initialLoading)
  const [error, setError] = useState<UIError | null>(initialError)
  const [data, setData] = useState<T | null>(initialData)

  const setLoading = useCallback(
    (loading: boolean) => {
      setIsLoading(loading)
      if (loading && resetOnExecute) {
        setError(null) // Clear errors when starting a new operation
      }
    },
    [resetOnExecute]
  )

  const setSuccess = useCallback((result: T) => {
    setData(result)
    setIsLoading(false)
    setError(null)
  }, [])

  const setFailure = useCallback((errorMessage: string, errorDetails?: any) => {
    const uiError: UIError = {
      message: errorMessage,
      details: errorDetails,
      timestamp: new Date(),
    }

    // Extract additional error information if available
    if (errorDetails) {
      if (typeof errorDetails === 'object') {
        if ('code' in errorDetails) {
          uiError.code = errorDetails.code
        }
        if ('statusCode' in errorDetails) {
          uiError.statusCode = errorDetails.statusCode
        }
        if ('status' in errorDetails) {
          uiError.statusCode = errorDetails.status
        }
      }
    }

    setError(uiError)
    setIsLoading(false)
  }, [])

  const reset = useCallback(() => {
    setIsLoading(initialLoading)
    setError(initialError)
    setData(initialData)
  }, [initialLoading, initialError, initialData])

  const execute = useCallback(
    async (asyncOperation: AsyncOperation<T>): Promise<T> => {
      try {
        setLoading(true)
        const result = await asyncOperation()
        setSuccess(result)
        return result
      } catch (err: any) {
        const errorMessage = err?.message || 'Ha ocurrido un error inesperado'
        setFailure(errorMessage, err)
        throw err // Re-throw to allow caller to handle if needed
      }
    },
    [setLoading, setSuccess, setFailure]
  )

  // Computed properties
  const hasError = error !== null
  const hasData = data !== null
  const isIdle = !isLoading && !hasError && !hasData
  const isSuccess = !isLoading && !hasError && hasData

  return {
    // State properties
    isLoading,
    error,
    data,
    hasError,
    hasData,

    // Actions
    setLoading,
    setSuccess,
    setFailure,
    reset,
    execute,

    // Computed properties
    isIdle,
    isSuccess,
  }
}

// Validation errors type for forms
export type ValidationErrors = Record<string, string | string[]>

// Form-specific error type
export interface FormError extends UIError {
  validationErrors?: ValidationErrors
}

// Form state options
export interface UseFormStateOptions<T = any> extends UseUIStateOptions<T> {
  validateOnSubmit?: boolean
  clearErrorsOnSubmit?: boolean
}

// Form state return type
export interface UseFormStateReturn<T = any> extends Omit<UseUIStateReturn<T>, 'error'> {
  // Form-specific properties
  isSubmitting: boolean
  validationErrors: ValidationErrors
  hasValidationErrors: boolean
  error: FormError | null

  // Form-specific methods
  submitForm: <D = any>(formData: D, submitOperation: (data: D) => Promise<T>) => Promise<T>
  clearValidationErrors: () => void
  setValidationError: (field: string, message: string | string[]) => void
  setValidationErrors: (errors: ValidationErrors) => void
}

/**
 * Specialized hook for form state management with validation support
 */
export function useFormState<T = any>(options: UseFormStateOptions<T> = {}): UseFormStateReturn<T> {
  const { validateOnSubmit = true, clearErrorsOnSubmit = true, ...uiStateOptions } = options

  const uiState = useUIState<T>(uiStateOptions)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({})

  const clearValidationErrors = useCallback(() => {
    setValidationErrors({})
  }, [])

  const setValidationError = useCallback((field: string, message: string | string[]) => {
    setValidationErrors(prev => ({
      ...prev,
      [field]: message,
    }))
  }, [])

  const setValidationErrorsCallback = useCallback((errors: ValidationErrors) => {
    setValidationErrors(errors)
  }, [])

  const submitForm = useCallback(
    async <D = any>(formData: D, submitOperation: (data: D) => Promise<T>): Promise<T> => {
      try {
        setIsSubmitting(true)

        if (clearErrorsOnSubmit) {
          clearValidationErrors()
        }

        const result = await uiState.execute(() => submitOperation(formData))
        return result
      } catch (error: any) {
        // Handle validation errors specifically
        if (error && typeof error === 'object') {
          // Check for Laravel-style validation errors
          if (error.status === 422 || error.statusCode === 422) {
            if (error.errors && typeof error.errors === 'object') {
              setValidationErrors(error.errors)
            }
          }

          // Check for other validation error patterns
          if (error.validationErrors && typeof error.validationErrors === 'object') {
            setValidationErrors(error.validationErrors)
          }
        }

        throw error
      } finally {
        setIsSubmitting(false)
      }
    },
    [uiState, clearErrorsOnSubmit, clearValidationErrors]
  )

  // Enhanced error that includes validation errors
  const enhancedError: FormError | null = uiState.error
    ? {
        ...uiState.error,
        validationErrors: Object.keys(validationErrors).length > 0 ? validationErrors : undefined,
      }
    : null

  return {
    ...uiState,
    error: enhancedError,
    isSubmitting,
    validationErrors,
    hasValidationErrors: Object.keys(validationErrors).length > 0,
    submitForm,
    clearValidationErrors,
    setValidationError,
    setValidationErrors: setValidationErrorsCallback,
  }
}

// List state options
export interface UseListStateOptions<T = any, FilterType = any> extends UseUIStateOptions<T[]> {
  defaultSort?: string
  defaultFilters?: FilterType
  allowMultiSelect?: boolean
}

// List state return type
export interface UseListStateReturn<T = any, FilterType = any>
  extends Omit<UseUIStateReturn<T[]>, 'data'> {
  // List-specific properties
  items: T[]
  selectedItems: T[]
  filters: FilterType
  sortBy: string
  hasSelection: boolean
  isAllSelected: boolean

  // List-specific methods
  selectItem: (item: T) => void
  selectItems: (items: T[]) => void
  selectAll: () => void
  clearSelection: () => void
  toggleSelectAll: () => void
  updateFilters: (newFilters: Partial<FilterType>) => void
  clearFilters: () => void
  setSortBy: (sortBy: string) => void
  isItemSelected: (item: T) => boolean
}

/**
 * Hook for managing list/collection states with selection and filtering
 */
export function useListState<T = any, FilterType = any>(
  options: UseListStateOptions<T, FilterType> = {}
): UseListStateReturn<T, FilterType> {
  const {
    defaultSort = '',
    defaultFilters = {} as FilterType,
    allowMultiSelect = true,
    ...uiStateOptions
  } = options

  const uiState = useUIState<T[]>({ ...uiStateOptions, initialData: [] })
  const [selectedItems, setSelectedItems] = useState<T[]>([])
  const [filters, setFilters] = useState<FilterType>(defaultFilters)
  const [sortBy, setSortBy] = useState<string>(defaultSort)

  const items = uiState.data || []

  const selectItem = useCallback(
    (item: T) => {
      setSelectedItems(prev => {
        if (!allowMultiSelect) {
          return [item]
        }

        const isSelected = prev.some(i => (i as any).id === (item as any).id)
        if (isSelected) {
          return prev.filter(i => (i as any).id !== (item as any).id)
        } else {
          return [...prev, item]
        }
      })
    },
    [allowMultiSelect]
  )

  const selectItems = useCallback((items: T[]) => {
    setSelectedItems(items)
  }, [])

  const selectAll = useCallback(() => {
    setSelectedItems(items)
  }, [items])

  const clearSelection = useCallback(() => {
    setSelectedItems([])
  }, [])

  const toggleSelectAll = useCallback(() => {
    if (selectedItems.length === items.length) {
      clearSelection()
    } else {
      selectAll()
    }
  }, [selectedItems.length, items.length, clearSelection, selectAll])

  const updateFilters = useCallback((newFilters: Partial<FilterType>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }, [])

  const clearFilters = useCallback(() => {
    setFilters(defaultFilters)
  }, [defaultFilters])

  const isItemSelected = useCallback(
    (item: T): boolean => {
      return selectedItems.some(selectedItem => (selectedItem as any).id === (item as any).id)
    },
    [selectedItems]
  )

  const hasSelection = selectedItems.length > 0
  const isAllSelected = items.length > 0 && selectedItems.length === items.length

  return {
    ...uiState,
    items,
    selectedItems,
    filters,
    sortBy,
    hasSelection,
    isAllSelected,
    selectItem,
    selectItems,
    selectAll,
    clearSelection,
    toggleSelectAll,
    updateFilters,
    clearFilters,
    setSortBy,
    isItemSelected,
  }
}

// Export the main hook as default
export default useUIState
