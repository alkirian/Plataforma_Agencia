import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePopoverPosition } from '../../hooks/usePopoverPosition';
import { useClickOutside } from '../../hooks/useClickOutside';
import { useDeviceType } from '../../hooks/useDeviceType';
import { useTaskDrafts } from '../../hooks/useTaskDrafts';
import { useAutoSave } from '../../hooks/useAutoSave';
import TaskForm from './TaskForm';
import TaskIdeasAI from './TaskIdeasAI';

const QuickTaskPopover = ({
  isOpen,
  onClose,
  clickCoords,
  selectedDate,
  clientId,
  onCreateTask
}) => {
  const deviceType = useDeviceType();
  const [formData, setFormData] = useState({
    title: '',
    copy: '',
    status: 'pendiente',
    channel: 'IG'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isDraftLoaded, setIsDraftLoaded] = useState(false);

  // Hooks para drafts
  const { saveDraft, loadDraft, clearDraft, cleanupOldDrafts, hasDraft } = useTaskDrafts(
    clientId, 
    selectedDate
  );

  // Auto-save con debounce de 2 segundos
  useAutoSave(formData, saveDraft, 2000, isOpen && isDraftLoaded);

  // Efecto para cargar drafts cuando se abre el popover
  useEffect(() => {
    if (isOpen && clientId && selectedDate) {
      // Limpiar drafts antiguos primero
      cleanupOldDrafts();
      
      // Cargar draft existente si existe
      const existingDraft = loadDraft();
      if (existingDraft) {
        setFormData(existingDraft);
      }
      
      setIsDraftLoaded(true);
    } else {
      setIsDraftLoaded(false);
    }
  }, [isOpen, clientId, selectedDate, loadDraft, cleanupOldDrafts]);

  // Efecto para limpiar drafts cuando se crea exitosamente una tarea
  useEffect(() => {
    if (!isOpen && isDraftLoaded) {
      // Solo limpiar si el popover se cerró después de estar cargado
      // (esto sugiere que se completó la acción)
      const timeoutId = setTimeout(() => {
        clearDraft();
      }, 100); // Pequeño delay para asegurar que se cerró por éxito
      
      return () => clearTimeout(timeoutId);
    }
  }, [isOpen, isDraftLoaded, clearDraft]);

  // Posicionamiento dinámico (solo para desktop) 
  const { position, isVisible } = usePopoverPosition(
    deviceType === 'desktop' ? clickCoords : null,
    { width: 340, height: 420 } // Reducida de 500 a 420
  );

  // Click outside para cerrar
  const popoverRef = useClickOutside(() => {
    if (isOpen) onClose();
  }, isOpen);

  // Handler para aplicar sugerencias de IA
  const handleAISuggestion = useCallback((suggestion) => {
    setFormData(prev => ({
      ...prev,
      title: suggestion
    }));
  }, []);

  const handleSubmit = useCallback(async (data) => {
    if (!data.title?.trim()) return;

    setIsLoading(true);
    try {
      // Crear evento con fecha y hora basadas en selectedDate
      const eventData = {
        title: data.title.trim(),
        status: data.status,
        copy: data.copy?.trim() || '',
        channel: data.channel,
        scheduled_at: new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          selectedDate.getDate(),
          9, 0, 0 // 9:00 AM por defecto
        ).toISOString()
      };

      await onCreateTask(eventData);
      
      // Limpiar draft después de crear exitosamente
      clearDraft();
      
      // Limpiar formulario
      setFormData({
        title: '',
        copy: '',
        status: 'pendiente',
        channel: 'IG'
      });
      
      onClose();
    } catch (error) {
      console.error('Error creating task:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate, onCreateTask, onClose]);

  // Variantes de animación según dispositivo
  const getAnimationVariants = () => {
    switch (deviceType) {
      case 'mobile':
        return {
          hidden: { opacity: 0, y: '100%' },
          visible: { 
            opacity: 1, 
            y: 0,
            transition: { 
              duration: 0.3, 
              ease: [0.4, 0, 0.2, 1],
              opacity: { duration: 0.2 }
            }
          },
          exit: { 
            opacity: 0, 
            y: '100%',
            transition: { duration: 0.25, ease: [0.4, 0, 1, 1] }
          }
        };
      case 'tablet':
        return {
          hidden: { opacity: 0, x: '100%' },
          visible: { 
            opacity: 1, 
            x: 0,
            transition: { duration: 0.3, ease: 'easeOut' }
          },
          exit: { 
            opacity: 0, 
            x: '100%',
            transition: { duration: 0.2, ease: 'easeIn' }
          }
        };
      default: // desktop
        return {
          hidden: { 
            opacity: 0, 
            scale: 0.8, 
            y: -10 
          },
          visible: { 
            opacity: 1, 
            scale: 1, 
            y: 0,
            transition: { duration: 0.2, ease: 'easeOut' }
          },
          exit: { 
            opacity: 0, 
            scale: 0.8, 
            y: -10,
            transition: { duration: 0.15, ease: 'easeIn' }
          }
        };
    }
  };

  const getPopoverStyles = () => {
    switch (deviceType) {
      case 'mobile':
        return {
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1000
        };
      case 'tablet':
        return {
          position: 'fixed',
          right: 0,
          top: 0,
          bottom: 0,
          width: '320px',
          zIndex: 1000
        };
      default: // desktop
        if (!clickCoords) {
          // Fallback when opened from a button without click coords
          return {
            position: 'fixed',
            top: 96, // below header
            right: 24,
            zIndex: 1000
          };
        }
        // Use fixed so clientX/clientY (viewport) coordinates align correctly
        return {
          position: 'fixed',
          left: position.x,
          top: position.y,
          zIndex: 1000,
          visibility: isVisible ? 'visible' : 'hidden'
        };
    }
  };

  const getPopoverClasses = () => {
    const baseClasses = "bg-gray-900/95 backdrop-blur-sm border border-gray-600/50 shadow-2xl";
    
    switch (deviceType) {
      case 'mobile':
        return `${baseClasses} rounded-t-2xl p-4 sm:p-6 max-h-[85vh] overflow-y-auto`;
      case 'tablet':
        return `${baseClasses} p-6 overflow-y-auto max-h-[90vh]`;
      default: // desktop
        return `${baseClasses} rounded-xl p-4 w-80`;
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay para mobile/tablet */}
      {deviceType !== 'desktop' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/30 z-50"
          onClick={onClose}
        />
      )}

      <AnimatePresence>
        <motion.div
          ref={popoverRef}
          style={getPopoverStyles()}
          className={getPopoverClasses()}
          variants={getAnimationVariants()}
          initial="hidden"
          animate={isOpen ? "visible" : "hidden"}
          exit="exit"
        >
          {/* Header para mobile/tablet */}
          {deviceType !== 'desktop' && (
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-700">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-white">Nueva Tarea</h2>
                {isDraftLoaded && hasDraft() && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-orange-600/20 border border-orange-500/30 rounded-md">
                    <div className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-pulse"></div>
                    <span className="text-xs text-orange-300">Draft</span>
                  </div>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* Indicador de draft para desktop */}
          {deviceType === 'desktop' && isDraftLoaded && hasDraft() && (
            <div className="flex items-center gap-2 mb-3 p-2 bg-orange-900/20 border border-orange-600/30 rounded-lg">
              <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-orange-300 font-medium">Borrador guardado</span>
            </div>
          )}

          {/* Formulario */}
          <TaskForm
            formData={formData}
            onChange={setFormData}
            onSubmit={handleSubmit}
            selectedDate={selectedDate}
            isLoading={isLoading}
          />

          {/* Componente IA para sugerencias contextuales */}
          <TaskIdeasAI
            clientId={clientId}
            selectedDate={selectedDate}
            onSuggestionClick={handleAISuggestion}
            currentFormData={formData}
          />
        </motion.div>
      </AnimatePresence>
    </>
  );
};

export default QuickTaskPopover;