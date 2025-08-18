import { useEffect, useRef } from 'react';

/**
 * Hook para detectar clicks fuera de un elemento y ejecutar callback
 * @param {Function} callback - Función a ejecutar cuando se hace click fuera
 * @param {boolean} enabled - Si está habilitado el listener
 */
export const useClickOutside = (callback, enabled = true) => {
  const ref = useRef(null);

  useEffect(() => {
    if (!enabled) return;

    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        callback();
      }
    };

    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        callback();
      }
    };

    // Agregar listeners
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [callback, enabled]);

  return ref;
};