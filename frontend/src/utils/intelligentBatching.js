/**
 * Sistema inteligente de batching que aprende del comportamiento del usuario
 * Agrupa notificaciones de forma contextual y predictiva
 */

export class IntelligentBatching {
  constructor() {
    this.userBehavior = this.loadUserBehavior();
    this.batchingRules = this.initializeBatchingRules();
    this.contextAnalyzer = new ContextAnalyzer();
    this.learningEnabled = true;
  }

  loadUserBehavior() {
    const saved = localStorage.getItem('notification-behavior');
    return saved ? JSON.parse(saved) : {
      dismissPatterns: {},
      actionPatterns: {},
      timePreferences: {},
      categoryPreferences: {},
      interactionScore: 0.5, // 0-1, qué tan activo es el usuario
      lastAnalysis: Date.now()
    };
  }

  saveBehavior() {
    localStorage.setItem('notification-behavior', JSON.stringify(this.userBehavior));
  }

  initializeBatchingRules() {
    return {
      // Reglas de agrupación por similitud
      similarity: {
        sameCategory: 0.8,
        sameClient: 0.6,
        sameType: 0.4,
        timeWindow: 5000 // 5 segundos
      },
      
      // Reglas por contexto del usuario
      context: {
        busyMode: {
          enabled: false,
          batchAll: true,
          maxIndividual: 1
        },
        focusMode: {
          enabled: false,
          onlyCritical: true,
          batchNonCritical: true
        }
      },
      
      // Reglas adaptativas
      adaptive: {
        lowInteraction: {
          threshold: 0.3,
          aggressiveBatching: true
        },
        highInteraction: {
          threshold: 0.7,
          respectIndividual: true
        }
      }
    };
  }

  /**
   * Decidir si agrupar notificaciones
   */
  shouldBatch(notifications) {
    if (notifications.length < 2) return false;

    // Análisis de contexto actual
    const context = this.contextAnalyzer.getCurrentContext();
    
    // Aplicar reglas de contexto
    if (this.batchingRules.context.busyMode.enabled) {
      return this.handleBusyMode(notifications);
    }
    
    if (this.batchingRules.context.focusMode.enabled) {
      return this.handleFocusMode(notifications);
    }

    // Batching inteligente basado en comportamiento
    return this.intelligentBatchDecision(notifications, context);
  }

  intelligentBatchDecision(notifications, context) {
    const similarity = this.calculateSimilarity(notifications);
    const userPreference = this.getUserBatchingPreference(notifications);
    const urgency = this.calculateUrgency(notifications);
    
    // Algoritmo de decisión ponderado
    const batchScore = (
      similarity * 0.4 +
      userPreference * 0.3 +
      (1 - urgency) * 0.3
    );

    // Aprender de la decisión
    if (this.learningEnabled) {
      this.recordDecision(notifications, batchScore > 0.6);
    }

    return batchScore > 0.6;
  }

  calculateSimilarity(notifications) {
    if (notifications.length < 2) return 0;

    const scores = [];
    
    // Comparar todas las combinaciones
    for (let i = 0; i < notifications.length - 1; i++) {
      for (let j = i + 1; j < notifications.length; j++) {
        scores.push(this.compareTwoNotifications(notifications[i], notifications[j]));
      }
    }

    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }

  compareTwoNotifications(notif1, notif2) {
    let similarity = 0;

    // Misma categoría
    if (notif1.category === notif2.category) {
      similarity += this.batchingRules.similarity.sameCategory;
    }

    // Mismo cliente
    if (notif1.context?.clientId === notif2.context?.clientId) {
      similarity += this.batchingRules.similarity.sameClient;
    }

    // Mismo tipo
    if (notif1.type === notif2.type) {
      similarity += this.batchingRules.similarity.sameType;
    }

    // Ventana de tiempo
    const timeDiff = Math.abs(notif1.timestamp - notif2.timestamp);
    if (timeDiff < this.batchingRules.similarity.timeWindow) {
      similarity += 0.3;
    }

    return Math.min(similarity, 1);
  }

  getUserBatchingPreference(notifications) {
    const category = notifications[0]?.category;
    if (!category) return 0.5;

    const preference = this.userBehavior.categoryPreferences[category];
    if (!preference) return 0.5;

    // Si el usuario típicamente descarta este tipo, prefiere batching
    return preference.dismissRate > 0.7 ? 0.8 : 0.3;
  }

  calculateUrgency(notifications) {
    const priorities = notifications.map(n => {
      const priorityScores = { critical: 1, high: 0.8, normal: 0.5, low: 0.2 };
      return priorityScores[n.priority] || 0.5;
    });

    return Math.max(...priorities);
  }

  /**
   * Crear agrupación inteligente
   */
  createIntelligentBatch(notifications) {
    const groups = this.groupByAffinity(notifications);
    const batches = [];

    for (const group of groups) {
      if (group.length === 1) {
        batches.push(group[0]);
      } else {
        batches.push(this.createBatchNotification(group));
      }
    }

    return batches;
  }

  groupByAffinity(notifications) {
    const groups = [];
    const processed = new Set();

    for (let i = 0; i < notifications.length; i++) {
      if (processed.has(i)) continue;

      const group = [notifications[i]];
      processed.add(i);

      // Buscar notificaciones similares
      for (let j = i + 1; j < notifications.length; j++) {
        if (processed.has(j)) continue;

        const similarity = this.compareTwoNotifications(notifications[i], notifications[j]);
        if (similarity > 0.6) {
          group.push(notifications[j]);
          processed.add(j);
        }
      }

      groups.push(group);
    }

    return groups;
  }

  createBatchNotification(group) {
    const categories = [...new Set(group.map(n => n.category))];
    const types = [...new Set(group.map(n => n.type))];
    const priority = this.getHighestPriority(group.map(n => n.priority));

    return {
      id: `batch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'batch',
      category: categories.length === 1 ? categories[0] : 'mixed',
      priority,
      title: this.generateBatchTitle(group),
      message: this.generateBatchMessage(group),
      timestamp: Date.now(),
      batchedNotifications: group,
      actions: this.generateBatchActions(group)
    };
  }

  generateBatchTitle(group) {
    const categories = [...new Set(group.map(n => n.category))];
    const count = group.length;

    const categoryNames = {
      task: 'tareas',
      ai: 'IA',
      client: 'clientes',
      auth: 'autenticación',
      system: 'sistema'
    };

    if (categories.length === 1) {
      const categoryName = categoryNames[categories[0]] || categories[0];
      return `${count} notificaciones de ${categoryName}`;
    }

    return `${count} notificaciones`;
  }

  generateBatchMessage(group) {
    const summaries = this.createTypeSummaries(group);
    return summaries.join(' • ');
  }

  createTypeSummaries(group) {
    const typeGroups = group.reduce((acc, notif) => {
      const key = `${notif.category}-${notif.type}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(notif);
      return acc;
    }, {});

    return Object.entries(typeGroups).map(([key, notifs]) => {
      const count = notifs.length;
      const [category, type] = key.split('-');
      
      const summaryTemplates = {
        'task-error': (c) => `${c} error${c > 1 ? 'es' : ''} en tareas`,
        'task-success': (c) => `${c} tarea${c > 1 ? 's' : ''} completada${c > 1 ? 's' : ''}`,
        'ai-success': (c) => `${c} respuesta${c > 1 ? 's' : ''} de IA`,
        'ai-error': (c) => `${c} error${c > 1 ? 'es' : ''} de IA`,
        'client-success': (c) => `${c} cliente${c > 1 ? 's' : ''} actualizado${c > 1 ? 's' : ''}`,
        'auth-success': (c) => `${c} operación${c > 1 ? 'es' : ''} de autenticación`
      };

      const template = summaryTemplates[key] || ((c) => `${c} notificación${c > 1 ? 'es' : ''}`);
      return template(count);
    });
  }

  generateBatchActions(group) {
    const actions = [];
    
    // Acción para expandir
    actions.push({
      type: 'custom',
      label: 'Ver detalles',
      handler: (context) => this.expandBatch(context.batchedNotifications),
      primary: true
    });

    // Acción común si todas las notificaciones son del mismo tipo
    const categories = [...new Set(group.map(n => n.category))];
    if (categories.length === 1 && categories[0] === 'task') {
      actions.push({
        type: 'navigate',
        label: 'Ir a calendario',
        path: '/calendar'
      });
    }

    actions.push({
      type: 'dismiss',
      label: 'Descartar todo'
    });

    return actions;
  }

  expandBatch(notifications) {
    // Mostrar las notificaciones individuales con un delay
    notifications.forEach((notif, index) => {
      setTimeout(() => {
        // Re-emitir la notificación individual
        window.dispatchEvent(new CustomEvent('notification:show', {
          detail: notif
        }));
      }, index * 200);
    });
  }

  getHighestPriority(priorities) {
    const priorityOrder = ['critical', 'high', 'normal', 'low'];
    for (const priority of priorityOrder) {
      if (priorities.includes(priority)) {
        return priority;
      }
    }
    return 'normal';
  }

  /**
   * Modos contextuales
   */
  handleBusyMode(notifications) {
    const criticalCount = notifications.filter(n => n.priority === 'critical').length;
    return criticalCount <= this.batchingRules.context.busyMode.maxIndividual;
  }

  handleFocusMode(notifications) {
    return notifications.some(n => n.priority !== 'critical');
  }

  /**
   * Sistema de aprendizaje
   */
  recordDecision(notifications, wasBatched) {
    const category = notifications[0]?.category;
    if (!category) return;

    if (!this.userBehavior.categoryPreferences[category]) {
      this.userBehavior.categoryPreferences[category] = {
        batchAcceptance: 0.5,
        interactionRate: 0.5,
        dismissRate: 0.5,
        samples: 0
      };
    }

    const pref = this.userBehavior.categoryPreferences[category];
    pref.samples++;
    
    // Actualizar métricas con promedio móvil
    const alpha = 0.1; // Factor de aprendizaje
    if (wasBatched) {
      pref.batchAcceptance = pref.batchAcceptance * (1 - alpha) + alpha;
    } else {
      pref.batchAcceptance = pref.batchAcceptance * (1 - alpha);
    }

    this.saveBehavior();
  }

  recordInteraction(notificationId, action) {
    // Registrar interacción para aprendizaje
    const category = this.getNotificationCategory(notificationId);
    if (!category) return;

    if (!this.userBehavior.categoryPreferences[category]) {
      this.userBehavior.categoryPreferences[category] = {
        batchAcceptance: 0.5,
        interactionRate: 0.5,
        dismissRate: 0.5,
        samples: 0
      };
    }

    const pref = this.userBehavior.categoryPreferences[category];
    const alpha = 0.1;

    switch (action) {
      case 'click':
      case 'action':
        pref.interactionRate = pref.interactionRate * (1 - alpha) + alpha;
        break;
      case 'dismiss':
        pref.dismissRate = pref.dismissRate * (1 - alpha) + alpha;
        break;
    }

    this.saveBehavior();
  }

  getNotificationCategory(notificationId) {
    // Helper para obtener categoría de ID (implementar según necesidad)
    return 'general';
  }

  /**
   * API pública
   */
  enableBusyMode() {
    this.batchingRules.context.busyMode.enabled = true;
    this.batchingRules.context.focusMode.enabled = false;
  }

  enableFocusMode() {
    this.batchingRules.context.focusMode.enabled = true;
    this.batchingRules.context.busyMode.enabled = false;
  }

  disableContextModes() {
    this.batchingRules.context.busyMode.enabled = false;
    this.batchingRules.context.focusMode.enabled = false;
  }

  getStats() {
    return {
      userBehavior: this.userBehavior,
      batchingRules: this.batchingRules,
      learningEnabled: this.learningEnabled
    };
  }

  reset() {
    this.userBehavior = {
      dismissPatterns: {},
      actionPatterns: {},
      timePreferences: {},
      categoryPreferences: {},
      interactionScore: 0.5,
      lastAnalysis: Date.now()
    };
    this.saveBehavior();
  }
}

/**
 * Analizador de contexto del usuario
 */
class ContextAnalyzer {
  getCurrentContext() {
    return {
      timeOfDay: this.getTimeOfDay(),
      dayOfWeek: this.getDayOfWeek(),
      isWorkingHours: this.isWorkingHours(),
      browserActivity: this.getBrowserActivity(),
      currentPage: window.location.pathname,
      hasActiveModal: document.querySelector('[role="dialog"]') !== null
    };
  }

  getTimeOfDay() {
    const hour = new Date().getHours();
    if (hour < 6) return 'night';
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
  }

  getDayOfWeek() {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[new Date().getDay()];
  }

  isWorkingHours() {
    const hour = new Date().getHours();
    const day = new Date().getDay();
    return day >= 1 && day <= 5 && hour >= 9 && hour <= 18;
  }

  getBrowserActivity() {
    return {
      hasFocus: document.hasFocus(),
      isVisible: !document.hidden,
      lastActivity: performance.now()
    };
  }
}

// Instancia singleton
export const intelligentBatching = new IntelligentBatching();