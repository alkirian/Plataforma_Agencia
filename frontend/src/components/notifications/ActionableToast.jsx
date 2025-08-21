/**
 * Toast con acciones contextuales
 * Permite al usuario tomar acciones directas desde las notificaciones
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  FiExternalLink, 
  FiCheck, 
  FiClock, 
  FiSettings,
  FiRefreshCw,
  FiX
} from 'react-icons/fi';

export const ActionableToast = ({ 
  t, 
  title, 
  message, 
  actions = [], 
  icon,
  variant = 'default',
  onAction,
  context = {}
}) => {
  const navigate = useNavigate();

  const handleAction = async (action) => {
    // Analytics: tracking de acción
    window.dispatchEvent(new CustomEvent('notification:action', {
      detail: {
        id: t.id,
        actionType: action.type,
        actionLabel: action.label,
        category: context.category || 'unknown',
        timestamp: Date.now()
      }
    }));

    try {
      switch (action.type) {
        case 'navigate':
          // Navegar a una ruta
          const path = action.path.replace(/\{(\w+)\}/g, (match, key) => {
            return context[key] || match;
          });
          navigate(path);
          toast.dismiss(t.id);
          break;

        case 'api':
          // Llamar a una API
          if (onAction) {
            await onAction(action, context);
          }
          toast.dismiss(t.id);
          break;

        case 'modal':
          // Abrir modal
          if (onAction) {
            await onAction(action, context);
          }
          break;

        case 'snooze':
          // Posponer notificación
          toast.dismiss(t.id);
          setTimeout(() => {
            toast.custom((t) => (
              <ActionableToast
                t={t}
                title={title}
                message={`${message} (reactivada)`}
                actions={actions}
                icon={icon}
                variant={variant}
                onAction={onAction}
                context={context}
              />
            ));
          }, action.duration || 3600000); // 1 hora por defecto
          break;

        case 'dismiss':
          toast.dismiss(t.id);
          break;

        case 'custom':
          if (action.handler) {
            await action.handler(context);
          }
          break;

        default:
          console.warn('Tipo de acción no reconocido:', action.type);
      }
    } catch (error) {
      console.error('Error ejecutando acción:', error);
      toast.error('Error al ejecutar la acción');
    }
  };

  const getVariantStyles = () => {
    const variants = {
      success: 'border-green-500/30 bg-green-900/20',
      error: 'border-red-500/30 bg-red-900/20',
      warning: 'border-orange-500/30 bg-orange-900/20',
      info: 'border-blue-500/30 bg-blue-900/20',
      default: 'border-gray-500/30 bg-gray-900/20'
    };
    return variants[variant] || variants.default;
  };

  const getActionIcon = (actionType) => {
    const iconMap = {
      navigate: FiExternalLink,
      api: FiCheck,
      snooze: FiClock,
      modal: FiSettings,
      refresh: FiRefreshCw,
      dismiss: FiX,
      custom: FiCheck
    };
    return iconMap[actionType] || FiCheck;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 50, scale: 0.9 }}
      className={`
        max-w-md w-full bg-surface-strong/95 backdrop-blur-md border rounded-xl p-4 shadow-xl
        ${getVariantStyles()}
      `}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        {icon && (
          <div className="flex-shrink-0 mt-1">
            {typeof icon === 'string' ? (
              <span className="text-lg">{icon}</span>
            ) : (
              icon
            )}
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className="text-sm font-semibold text-white mb-1">
              {title}
            </h4>
          )}
          <p className="text-sm text-gray-300 leading-relaxed">
            {message}
          </p>
        </div>

        {/* Dismiss button */}
        <button
          onClick={() => {
            // Analytics: tracking de dismissal
            window.dispatchEvent(new CustomEvent('notification:dismissed', {
              detail: {
                id: t.id,
                category: context.category || 'unknown',
                timestamp: Date.now()
              }
            }));
            toast.dismiss(t.id);
          }}
          className="flex-shrink-0 p-1 text-gray-400 hover:text-white transition-colors rounded"
        >
          <FiX className="w-4 h-4" />
        </button>
      </div>

      {/* Actions */}
      {actions.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-700/50">
          {actions.map((action, index) => {
            const IconComponent = getActionIcon(action.type);
            
            return (
              <motion.button
                key={index}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleAction(action)}
                className={`
                  inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg
                  transition-all duration-200
                  ${action.primary 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 hover:text-white'
                  }
                `}
                disabled={action.loading}
              >
                {action.loading ? (
                  <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <IconComponent className="w-3 h-3" />
                )}
                <span>{action.label}</span>
              </motion.button>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};

/**
 * Helper para crear toasts con acciones
 */
export const createActionableToast = (options) => {
  const {
    title,
    message,
    actions = [],
    icon,
    variant = 'default',
    duration = 8000,
    onAction,
    context = {},
    ...toastOptions
  } = options;

  return toast.custom(
    (t) => (
      <ActionableToast
        t={t}
        title={title}
        message={message}
        actions={actions}
        icon={icon}
        variant={variant}
        onAction={onAction}
        context={context}
      />
    ),
    {
      duration,
      ...toastOptions
    }
  );
};

/**
 * Presets de acciones comunes
 */
export const COMMON_ACTIONS = {
  viewTask: (clientId, taskId) => ({
    type: 'navigate',
    label: 'Ver tarea',
    path: `/clients/${clientId}`,
    primary: true
  }),

  completeTask: (taskId) => ({
    type: 'api',
    label: 'Completar',
    endpoint: 'PUT',
    url: `/api/tasks/${taskId}`,
    data: { status: 'completado' }
  }),

  snoozeHour: () => ({
    type: 'snooze',
    label: 'Posponer 1h',
    duration: 3600000
  }),

  snoozeDay: () => ({
    type: 'snooze',
    label: 'Posponer 1 día',
    duration: 86400000
  }),

  goToClient: (clientId) => ({
    type: 'navigate',
    label: 'Ir al cliente',
    path: `/clients/${clientId}`,
    primary: true
  }),

  openCalendar: () => ({
    type: 'navigate',
    label: 'Abrir calendario',
    path: '/calendar'
  }),

  dismiss: () => ({
    type: 'dismiss',
    label: 'Descartar'
  })
};