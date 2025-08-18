import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook para auto-guardar datos con debounce
 * @param {any} data - Datos a guardar
 * @param {Function} saveFunction - Función que guarda los datos
 * @param {number} delay - Delay en ms para el debounce (default: 2000)
 * @param {boolean} enabled - Si está habilitado el auto-save
 */
export const useAutoSave = (data, saveFunction, delay = 2000, enabled = true) => {
  const timeoutRef = useRef(null);
  const previousDataRef = useRef(data);
  const saveCallbackRef = useRef(saveFunction);

  // Mantener la referencia actualizada
  saveCallbackRef.current = saveFunction;

  // Función debounced para guardar
  const debouncedSave = useCallback((dataToSave) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      if (saveCallbackRef.current && enabled) {
        saveCallbackRef.current(dataToSave);
      }
    }, delay);
  }, [delay, enabled]);

  // Efecto para detectar cambios en los datos
  useEffect(() => {
    // Solo guardar si los datos han cambiado realmente
    const dataChanged = JSON.stringify(data) !== JSON.stringify(previousDataRef.current);
    
    if (dataChanged && enabled) {
      // Verificar que hay contenido significativo antes de guardar
      const hasContent = data && (
        (data.title && data.title.trim()) ||
        (data.copy && data.copy.trim())
      );

      if (hasContent) {
        debouncedSave(data);
      }
      
      previousDataRef.current = data;
    }
  }, [data, debouncedSave, enabled]);

  // Cleanup del timeout al desmontar
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Función para guardar inmediatamente (sin debounce)
  const saveNow = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (saveCallbackRef.current && enabled) {
      saveCallbackRef.current(data);
    }
  }, [data, enabled]);

  return { saveNow };
};