import { useCallback } from 'react';

/**
 * Hook para manejar drafts persistentes de tareas
 * Los drafts se guardan por cliente y fecha específica
 */
export const useTaskDrafts = (clientId, selectedDate) => {
  // Generar key único para el draft
  const getDraftKey = useCallback(() => {
    if (!clientId || !selectedDate) return null;
    const dateStr = selectedDate.toISOString().split('T')[0]; // YYYY-MM-DD
    return `task-draft-${clientId}-${dateStr}`;
  }, [clientId, selectedDate]);

  // Guardar draft en localStorage con debounce automático
  const saveDraft = useCallback((formData) => {
    const key = getDraftKey();
    if (!key) return;

    try {
      const draftData = {
        ...formData,
        timestamp: Date.now(),
        version: '1.0' // Para futuras migraciones
      };
      
      localStorage.setItem(key, JSON.stringify(draftData));
      
      // Debug info en desarrollo
      if (process.env.NODE_ENV === 'development') {
        console.log('🎯 Draft guardado:', key, draftData);
      }
    } catch (error) {
      console.warn('Error guardando draft:', error);
    }
  }, [getDraftKey]);

  // Cargar draft existente
  const loadDraft = useCallback(() => {
    const key = getDraftKey();
    if (!key) return null;

    try {
      const saved = localStorage.getItem(key);
      if (!saved) return null;

      const draft = JSON.parse(saved);
      
      // Verificar que no sea muy antiguo (24 horas)
      const maxAge = 24 * 60 * 60 * 1000; // 24 horas en ms
      if (Date.now() - draft.timestamp > maxAge) {
        // Draft muy antiguo, eliminarlo
        localStorage.removeItem(key);
        return null;
      }

      // Limpiar timestamp y version antes de retornar
      const { timestamp, version, ...formData } = draft;
      
      if (process.env.NODE_ENV === 'development') {
        console.log('📝 Draft cargado:', key, formData);
      }
      
      return formData;
    } catch (error) {
      console.warn('Error cargando draft:', error);
      return null;
    }
  }, [getDraftKey]);

  // Limpiar draft específico
  const clearDraft = useCallback(() => {
    const key = getDraftKey();
    if (!key) return;

    try {
      localStorage.removeItem(key);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🗑️ Draft eliminado:', key);
      }
    } catch (error) {
      console.warn('Error eliminando draft:', error);
    }
  }, [getDraftKey]);

  // Limpiar todos los drafts antiguos (cleanup)
  const cleanupOldDrafts = useCallback(() => {
    try {
      const keys = Object.keys(localStorage);
      const draftKeys = keys.filter(key => key.startsWith('task-draft-'));
      
      let cleaned = 0;
      const maxAge = 24 * 60 * 60 * 1000; // 24 horas
      
      draftKeys.forEach(key => {
        try {
          const draft = JSON.parse(localStorage.getItem(key));
          if (draft && Date.now() - draft.timestamp > maxAge) {
            localStorage.removeItem(key);
            cleaned++;
          }
        } catch {
          // Draft corrupto, eliminarlo
          localStorage.removeItem(key);
          cleaned++;
        }
      });
      
      if (cleaned > 0 && process.env.NODE_ENV === 'development') {
        console.log(`🧹 ${cleaned} drafts antiguos eliminados`);
      }
    } catch (error) {
      console.warn('Error en cleanup de drafts:', error);
    }
  }, []);

  // Verificar si existe un draft para la fecha actual
  const hasDraft = useCallback(() => {
    const key = getDraftKey();
    if (!key) return false;
    
    const saved = localStorage.getItem(key);
    if (!saved) return false;

    try {
      const draft = JSON.parse(saved);
      const maxAge = 24 * 60 * 60 * 1000;
      return Date.now() - draft.timestamp <= maxAge;
    } catch {
      return false;
    }
  }, [getDraftKey]);

  return {
    saveDraft,
    loadDraft,
    clearDraft,
    cleanupOldDrafts,
    hasDraft
  };
};