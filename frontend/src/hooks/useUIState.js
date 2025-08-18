import { useState, useCallback } from 'react';

/**
 * Hook unificado para manejar estados de UI comunes
 * @param {Object} options - Configuración inicial
 * @returns {Object} - Estados y métodos para manejar UI
 */
export const useUIState = (options = {}) => {
  const {
    initialLoading = false,
    initialError = null,
    initialData = null
  } = options;

  const [isLoading, setIsLoading] = useState(initialLoading);
  const [error, setError] = useState(initialError);
  const [data, setData] = useState(initialData);

  const setLoading = useCallback((loading) => {
    setIsLoading(loading);
    if (loading) {
      setError(null); // Clear errors when starting a new operation
    }
  }, []);

  const setSuccess = useCallback((result) => {
    setData(result);
    setIsLoading(false);
    setError(null);
  }, []);

  const setFailure = useCallback((errorMessage, errorDetails = null) => {
    setError({ message: errorMessage, details: errorDetails });
    setIsLoading(false);
  }, []);

  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
    setData(null);
  }, []);

  const execute = useCallback(async (asyncOperation) => {
    try {
      setLoading(true);
      const result = await asyncOperation();
      setSuccess(result);
      return result;
    } catch (err) {
      const errorMessage = err.message || 'Ha ocurrido un error inesperado';
      setFailure(errorMessage, err);
      throw err; // Re-throw to allow caller to handle if needed
    }
  }, [setLoading, setSuccess, setFailure]);

  return {
    // States
    isLoading,
    error,
    data,
    hasError: !!error,
    hasData: !!data,
    
    // Actions
    setLoading,
    setSuccess,
    setFailure,
    reset,
    execute,
    
    // Convenience getters
    isIdle: !isLoading && !error && !data,
    isSuccess: !isLoading && !error && data !== null
  };
};

/**
 * Hook especializado para operaciones de formulario
 */
export const useFormState = (options = {}) => {
  const uiState = useUIState(options);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const submitForm = useCallback(async (formData, submitOperation) => {
    try {
      setIsSubmitting(true);
      setValidationErrors({});
      
      const result = await uiState.execute(() => submitOperation(formData));
      return result;
    } catch (error) {
      // Handle validation errors specifically
      if (error.status === 422 && error.errors) {
        setValidationErrors(error.errors);
      }
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [uiState]);

  const clearValidationErrors = useCallback(() => {
    setValidationErrors({});
  }, []);

  return {
    ...uiState,
    isSubmitting,
    validationErrors,
    hasValidationErrors: Object.keys(validationErrors).length > 0,
    submitForm,
    clearValidationErrors
  };
};

/**
 * Hook para manejar estados de listas/colecciones
 */
export const useListState = (options = {}) => {
  const uiState = useUIState({ ...options, initialData: [] });
  const [selectedItems, setSelectedItems] = useState([]);
  const [filters, setFilters] = useState({});
  const [sortBy, setSortBy] = useState(options.defaultSort || '');

  const selectItem = useCallback((item) => {
    setSelectedItems(prev => 
      prev.find(i => i.id === item.id) 
        ? prev.filter(i => i.id !== item.id)
        : [...prev, item]
    );
  }, []);

  const selectAll = useCallback(() => {
    setSelectedItems(uiState.data || []);
  }, [uiState.data]);

  const clearSelection = useCallback(() => {
    setSelectedItems([]);
  }, []);

  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  return {
    ...uiState,
    selectedItems,
    filters,
    sortBy,
    hasSelection: selectedItems.length > 0,
    selectItem,
    selectAll,
    clearSelection,
    updateFilters,
    clearFilters,
    setSortBy
  };
};