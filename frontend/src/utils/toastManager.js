/**
 * Sistema inteligente de gestión de toasts con rate limiting
 * Evita spam y mejora la experiencia de usuario
 */

import toast from 'react-hot-toast';
import { createActionableToast, COMMON_ACTIONS } from '../components/notifications/ActionableToast';
import { configureSmartPosition } from './smartPositioning';
import { intelligentBatching } from './intelligentBatching';
// Notification sync disabled
// import { notificationSync } from './notificationSync';
import { notificationAnalytics } from './notificationAnalytics';

class ToastManager {
  constructor() {
    // Rate limiting config
    this.maxToastsPerMinute = 5;
    this.maxToastsPer30Seconds = 3;
    this.recentToasts = [];
    
    // Batching config
    this.batchingEnabled = true;
    this.batchTimeout = 1000; // 1 segundo para agrupar
    this.pendingBatch = [];
    this.batchTimer = null;
    
    // Toast categories for smart filtering
    this.categories = new Set();
    this.lastToastByCategory = new Map();
    
    // Priority system
    this.priorityQueue = [];
    this.isProcessing = false;
  }

  /**
   * Método principal para mostrar toasts con rate limiting
   */
  show(type, message, options = {}) {
    const toastData = {
      id: this.generateId(),
      type,
      message,
      options,
      timestamp: Date.now(),
      category: options.category || 'general',
      priority: options.priority || 'normal',
      ...options
    };

    // Verificar si puede mostrar el toast
    if (!this.canShowToast(toastData)) {
      this.handleRejectedToast(toastData);
      return null;
    }

    // Procesar según prioridad
    if (toastData.priority === 'critical') {
      return this.showImmediately(toastData);
    }

    // Agregar a batch si está habilitado
    if (this.batchingEnabled && this.shouldBatch(toastData)) {
      this.addToBatch(toastData);
      return null;
    }

    return this.showImmediately(toastData);
  }

  /**
   * Verificar si puede mostrar el toast (rate limiting)
   */
  canShowToast(toastData) {
    const now = Date.now();
    
    // Limpiar toasts antiguos
    this.cleanOldToasts(now);

    // Verificar límite por 30 segundos
    const recent30s = this.recentToasts.filter(t => now - t.timestamp < 30000);
    if (recent30s.length >= this.maxToastsPer30Seconds) {
      // Permitir solo toasts críticos
      return toastData.priority === 'critical';
    }

    // Verificar límite por minuto
    const recentMinute = this.recentToasts.filter(t => now - t.timestamp < 60000);
    if (recentMinute.length >= this.maxToastsPerMinute) {
      return toastData.priority === 'critical';
    }

    // Verificar duplicados recientes por categoría
    const lastOfCategory = this.lastToastByCategory.get(toastData.category);
    if (lastOfCategory && now - lastOfCategory.timestamp < 5000) {
      // Evitar toasts de la misma categoría en menos de 5 segundos
      return false;
    }

    return true;
  }

  /**
   * Mostrar toast inmediatamente
   */
  showImmediately(toastData) {
    const { type, message, options } = toastData;
    
    // Si tiene acciones, usar ActionableToast
    if (options.actions && options.actions.length > 0) {
      return this.showActionableToast(toastData);
    }
    
    // Configurar smart positioning
    const smartOptions = configureSmartPosition({
      category: toastData.category,
      type: toastData.type,
      priority: toastData.priority,
      ...options
    });

    // Configurar opciones por defecto basadas en tipo
    const finalOptions = {
      duration: this.calculateDuration(toastData),
      ...smartOptions,
      id: toastData.id
    };

    // Agregar iconos contextuales si no se especifica
    if (!finalOptions.icon) {
      finalOptions.icon = this.getDefaultIcon(type, toastData.category);
    }

    // Mostrar toast
    let toastId;
    switch (type) {
      case 'success':
        toastId = toast.success(message, finalOptions);
        break;
      case 'error':
        toastId = toast.error(message, finalOptions);
        break;
      case 'loading':
        toastId = toast.loading(message, finalOptions);
        break;
      case 'info':
      default:
        toastId = toast(message, finalOptions);
        break;
    }

    // Registrar toast
    this.registerToast(toastData);
    
    // Analytics: tracking de notificación mostrada
    window.dispatchEvent(new CustomEvent('notification:shown', {
      detail: { ...toastData, position: finalOptions.position }
    }));
    
    // Sincronizar con otros dispositivos
  // Cross-device sync disabled
  // if (toastData.priority === 'high' || toastData.priority === 'critical') {
  //   notificationSync.syncNotification(toastData, 'create').catch(console.error);
  // }
    
    return toastId;
  }

  /**
   * Mostrar toast con acciones
   */
  showActionableToast(toastData) {
    const { type, message, options } = toastData;
    
    // Configurar smart positioning para toasts con acciones
    const smartOptions = configureSmartPosition({
      category: toastData.category,
      type: 'actionable',
      priority: toastData.priority,
      ...options
    });
    
    const actionableOptions = {
      title: options.title,
      message,
      actions: options.actions,
      icon: options.icon || this.getDefaultIcon(type, toastData.category),
      variant: this.getVariantFromType(type),
      duration: this.calculateDuration(toastData),
      onAction: options.onAction,
      context: options.context || {},
      ...smartOptions
    };

    const toastId = createActionableToast(actionableOptions);
    
    // Registrar toast
    this.registerToast(toastData);
    
    return toastId;
  }

  /**
   * Convertir tipo de toast a variante
   */
  getVariantFromType(type) {
    const variantMap = {
      'success': 'success',
      'error': 'error',
      'info': 'info',
      'loading': 'info'
    };
    return variantMap[type] || 'default';
  }

  /**
   * Gestión de batching
   */
  shouldBatch(toastData) {
    // No hacer batch de toasts críticos o con acciones
    if (toastData.priority === 'critical' || toastData.actions) {
      return false;
    }
    
    // Batch de tipos similares
    return ['success', 'info'].includes(toastData.type);
  }

  addToBatch(toastData) {
    this.pendingBatch.push(toastData);
    
    // Reiniciar timer
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
    }
    
    this.batchTimer = setTimeout(() => {
      this.processBatch();
    }, this.batchTimeout);
  }

  processBatch() {
    if (this.pendingBatch.length === 0) return;

    // Usar batching inteligente
    const shouldBatch = intelligentBatching.shouldBatch(this.pendingBatch);
    
    if (!shouldBatch || this.pendingBatch.length === 1) {
      // Mostrar individualmente
      this.pendingBatch.forEach(toastData => {
        this.showImmediately(toastData);
      });
    } else {
      // Crear batch inteligente
      const batches = intelligentBatching.createIntelligentBatch(this.pendingBatch);
      
      batches.forEach(batch => {
        if (batch.type === 'batch') {
          this.showBatchToast(batch);
        } else {
          this.showImmediately(batch);
        }
      });
    }

    // Limpiar batch
    this.pendingBatch = [];
    this.batchTimer = null;
  }

  showBatchToast(batchData) {
    const actionableOptions = {
      title: batchData.title,
      message: batchData.message,
      actions: batchData.actions,
      icon: '📋',
      variant: 'info',
      duration: 6000,
      onAction: this.handleBatchAction.bind(this),
      context: { batchedNotifications: batchData.batchedNotifications }
    };

    const toastId = createActionableToast(actionableOptions);
    
    // Registrar interacción con el batch
    intelligentBatching.recordDecision(batchData.batchedNotifications, true);
    
    return toastId;
  }

  handleBatchAction(action, context) {
    if (action.type === 'custom' && action.handler) {
      return action.handler(context);
    }
    // Otros tipos de acción se manejan en ActionableToast
    return Promise.resolve();
  }

  createBatchMessage(toasts) {
    const successCount = toasts.filter(t => t.type === 'success').length;
    const infoCount = toasts.filter(t => t.type === 'info').length;
    
    const parts = [];
    if (successCount > 0) {
      parts.push(`${successCount} acción${successCount > 1 ? 'es' : ''} completada${successCount > 1 ? 's' : ''}`);
    }
    if (infoCount > 0) {
      parts.push(`${infoCount} actualización${infoCount > 1 ? 'es' : ''}`);
    }
    
    return parts.join(' y ');
  }

  /**
   * Manejar toasts rechazados por rate limiting
   */
  handleRejectedToast(toastData) {
    // Log para debugging (solo en desarrollo)
    if (process.env.NODE_ENV === 'development') {
      console.log('Toast rechazado por rate limiting:', toastData.message);
    }
    
    // Para toasts importantes, agregar a cola de prioridad
    if (toastData.priority === 'high') {
      this.priorityQueue.push(toastData);
      // Procesar cola después de un delay
      setTimeout(() => this.processPriorityQueue(), 5000);
    }
  }

  processPriorityQueue() {
    if (this.isProcessing || this.priorityQueue.length === 0) return;
    
    this.isProcessing = true;
    const toast = this.priorityQueue.shift();
    
    if (this.canShowToast(toast)) {
      this.showImmediately(toast);
    }
    
    this.isProcessing = false;
    
    // Continuar procesando si hay más
    if (this.priorityQueue.length > 0) {
      setTimeout(() => this.processPriorityQueue(), 1000);
    }
  }

  /**
   * Utilidades
   */
  calculateDuration(toastData) {
    const { type, priority, message } = toastData;
    
    // Duración base por tipo
    const baseDuration = {
      'error': 6000,
      'success': 3000,
      'info': 4000,
      'loading': 0 // No auto-close
    }[type] || 4000;
    
    // Ajuste por prioridad
    const priorityMultiplier = {
      'critical': 1.5,
      'high': 1.2,
      'normal': 1,
      'low': 0.8
    }[priority] || 1;
    
    // Ajuste por longitud del mensaje
    const lengthMultiplier = message.length > 50 ? 1.3 : 1;
    
    return Math.round(baseDuration * priorityMultiplier * lengthMultiplier);
  }

  getDefaultIcon(type, category) {
    // Iconos contextuales por categoría
    const categoryIcons = {
      'auth': '🔐',
      'client': '👤',
      'task': '📋',
      'ai': '🤖',
      'system': '⚙️',
      'document': '📄',
      'batch': '📝'
    };
    
    if (categoryIcons[category]) {
      return categoryIcons[category];
    }
    
    // Iconos por tipo
    return {
      'success': '✅',
      'error': '❌',
      'info': 'ℹ️',
      'loading': '⏳'
    }[type] || '💬';
  }

  registerToast(toastData) {
    this.recentToasts.push({
      id: toastData.id,
      timestamp: toastData.timestamp,
      category: toastData.category,
      type: toastData.type
    });
    
    this.lastToastByCategory.set(toastData.category, toastData);
    this.categories.add(toastData.category);
  }

  cleanOldToasts(now) {
    // Limpiar toasts de más de 1 minuto
    this.recentToasts = this.recentToasts.filter(t => now - t.timestamp < 60000);
  }

  generateId() {
    return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Métodos de conveniencia con categorías
   */
  success(message, options = {}) {
    return this.show('success', message, { ...options, category: options.category || 'general' });
  }

  error(message, options = {}) {
    return this.show('error', message, { ...options, category: options.category || 'general' });
  }

  info(message, options = {}) {
    return this.show('info', message, { ...options, category: options.category || 'general' });
  }

  loading(message, options = {}) {
    return this.show('loading', message, { ...options, category: options.category || 'general' });
  }

  // Métodos específicos por categoría
  auth = {
    success: (message, options) => this.success(message, { ...options, category: 'auth' }),
    error: (message, options) => this.error(message, { ...options, category: 'auth' })
  };

  client = {
    success: (message, options) => this.success(message, { ...options, category: 'client' }),
    error: (message, options) => this.error(message, { ...options, category: 'client' })
  };

  task = {
    success: (message, options) => this.success(message, { ...options, category: 'task' }),
    error: (message, options) => this.error(message, { ...options, category: 'task' }),
    
    // Toast específico para tareas con acciones
    reminder: (taskTitle, clientName, clientId, taskId) => {
      return this.error(`"${taskTitle}" en ${clientName} requiere atención`, {
        category: 'task',
        priority: 'high',
        title: 'Tarea pendiente',
        actions: [
          COMMON_ACTIONS.viewTask(clientId, taskId),
          COMMON_ACTIONS.completeTask(taskId),
          COMMON_ACTIONS.snoozeHour()
        ],
        context: { clientId, taskId, clientName, taskTitle }
      });
    },
    
    overdue: (taskTitle, clientName, clientId, taskId) => {
      return this.error(`"${taskTitle}" en ${clientName} está vencida`, {
        category: 'task',
        priority: 'critical',
        title: 'Tarea vencida',
        actions: [
          COMMON_ACTIONS.viewTask(clientId, taskId),
          COMMON_ACTIONS.completeTask(taskId),
          COMMON_ACTIONS.snoozeDay()
        ],
        context: { clientId, taskId, clientName, taskTitle }
      });
    }
  };

  ai = {
    success: (message, options) => this.success(message, { ...options, category: 'ai' }),
    error: (message, options) => this.error(message, { ...options, category: 'ai' }),
    loading: (message, options) => this.loading(message, { ...options, category: 'ai' }),
    
    // Toast con retry para errores de IA
    errorWithRetry: (message, retryFn) => {
      return this.error(message, {
        category: 'ai',
        title: 'Error del asistente',
        actions: [
          {
            type: 'custom',
            label: 'Reintentar',
            handler: retryFn,
            primary: true
          },
          COMMON_ACTIONS.dismiss()
        ]
      });
    }
  };

  document = {
    success: (message, options) => this.success(message, { ...options, category: 'document' }),
    error: (message, options) => this.error(message, { ...options, category: 'document' }),
    loading: (message, options) => this.loading(message, { ...options, category: 'document' }),
    
    // Toast específico para documentos subidos
    uploaded: (fileName, userName, clientId) => {
      const message = userName 
        ? `📄 ${fileName} subido por ${userName}`
        : `📄 ${fileName} subido exitosamente`;
        
      return this.success(message, {
        category: 'document',
        priority: 'normal',
        title: 'Documento subido',
        actions: [
          {
            type: 'navigate',
            label: 'Ver documentos',
            path: `/clients/${clientId}?tab=documents`,
            primary: true
          },
          COMMON_ACTIONS.dismiss()
        ],
        context: { clientId, fileName }
      });
    },
    
    // Toast para múltiples documentos
    multipleUploaded: (count, userName, clientId) => {
      const message = userName
        ? `📄 ${count} archivos subidos por ${userName}`
        : `📄 ${count} archivos subidos exitosamente`;
        
      return this.success(message, {
        category: 'document',
        priority: 'normal',
        title: 'Documentos subidos',
        actions: [
          {
            type: 'navigate',
            label: 'Ver documentos',
            path: `/clients/${clientId}?tab=documents`,
            primary: true
          }
        ],
        context: { clientId, uploadCount: count }
      });
    }
  };

  /**
   * Configuración dinámica
   */
  configure(options = {}) {
    if (options.maxToastsPerMinute !== undefined) {
      this.maxToastsPerMinute = options.maxToastsPerMinute;
    }
    if (options.maxToastsPer30Seconds !== undefined) {
      this.maxToastsPer30Seconds = options.maxToastsPer30Seconds;
    }
    if (options.batchingEnabled !== undefined) {
      this.batchingEnabled = options.batchingEnabled;
    }
  }

  /**
   * Debug y métricas
   */
  getStats() {
    return {
      recentToasts: this.recentToasts.length,
      categories: Array.from(this.categories),
      pendingBatch: this.pendingBatch.length,
      priorityQueue: this.priorityQueue.length
    };
  }

  reset() {
    this.recentToasts = [];
    this.pendingBatch = [];
    this.priorityQueue = [];
    this.lastToastByCategory.clear();
    this.categories.clear();
    
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
  }
}

// Instancia singleton
export const toastManager = new ToastManager();

// Wrapper para compatibilidad con código existente
export const smartToast = {
  success: (message, options) => toastManager.success(message, options),
  error: (message, options) => toastManager.error(message, options),
  info: (message, options) => toastManager.info(message, options),
  loading: (message, options) => toastManager.loading(message, options),
  dismiss: (toastId) => toast.dismiss(toastId),
  
  // Métodos categorizados
  auth: toastManager.auth,
  client: toastManager.client,
  task: toastManager.task,
  ai: toastManager.ai,
  document: toastManager.document,
  
  // Configuración
  configure: (options) => toastManager.configure(options),
  getStats: () => toastManager.getStats(),
  reset: () => toastManager.reset()
};