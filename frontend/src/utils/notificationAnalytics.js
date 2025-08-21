/**
 * Sistema de analytics para notificaciones
 * Mide efectividad, patrones de uso y optimiza experiencia
 */

export class NotificationAnalytics {
  constructor() {
    this.events = [];
    this.metrics = this.loadMetrics();
    this.session = {
      id: this.generateSessionId(),
      startTime: Date.now(),
      interactions: 0
    };

    this.setupEventListeners();
    this.startMetricsCollection();
  }

  generateSessionId() {
    return `analytics-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  loadMetrics() {
    const saved = localStorage.getItem('notification-analytics');
    const defaultMetrics = this.getDefaultMetrics();
    
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...defaultMetrics, ...parsed };
      } catch {
        return defaultMetrics;
      }
    }
    
    return defaultMetrics;
  }

  getDefaultMetrics() {
    return {
      version: '1.0',
      totalNotifications: 0,
      totalInteractions: 0,
      totalDismissals: 0,
      
      // Métricas por categoría
      byCategory: {
        auth: { shown: 0, clicked: 0, dismissed: 0, timeToAction: [] },
        client: { shown: 0, clicked: 0, dismissed: 0, timeToAction: [] },
        task: { shown: 0, clicked: 0, dismissed: 0, timeToAction: [] },
        ai: { shown: 0, clicked: 0, dismissed: 0, timeToAction: [] },
        system: { shown: 0, clicked: 0, dismissed: 0, timeToAction: [] }
      },

      // Métricas por tipo
      byType: {
        success: { shown: 0, clicked: 0, dismissed: 0 },
        error: { shown: 0, clicked: 0, dismissed: 0 },
        info: { shown: 0, clicked: 0, dismissed: 0 },
        warning: { shown: 0, clicked: 0, dismissed: 0 }
      },

      // Métricas por prioridad
      byPriority: {
        critical: { shown: 0, clicked: 0, dismissed: 0, avgResponseTime: 0 },
        high: { shown: 0, clicked: 0, dismissed: 0, avgResponseTime: 0 },
        normal: { shown: 0, clicked: 0, dismissed: 0, avgResponseTime: 0 },
        low: { shown: 0, clicked: 0, dismissed: 0, avgResponseTime: 0 }
      },

      // Métricas temporales
      timePatterns: {
        hourly: new Array(24).fill(0),
        daily: new Array(7).fill(0),
        monthly: new Array(12).fill(0)
      },

      // Métricas de batching
      batching: {
        totalBatches: 0,
        batchSizes: [],
        batchInteractions: 0,
        batchDismissals: 0
      },

      // Métricas de dispositivo
      byDevice: {
        mobile: { shown: 0, clicked: 0, dismissed: 0 },
        tablet: { shown: 0, clicked: 0, dismissed: 0 },
        desktop: { shown: 0, clicked: 0, dismissed: 0 }
      },

      // Métricas de posicionamiento
      byPosition: {},

      // Sesiones
      sessions: [],
      
      // Última actualización
      lastUpdated: Date.now()
    };
  }

  saveMetrics() {
    this.metrics.lastUpdated = Date.now();
    localStorage.setItem('notification-analytics', JSON.stringify(this.metrics));
  }

  setupEventListeners() {
    // Escuchar eventos de notificaciones personalizados
    window.addEventListener('notification:shown', (e) => this.trackNotificationShown(e.detail));
    window.addEventListener('notification:clicked', (e) => this.trackNotificationClicked(e.detail));
    window.addEventListener('notification:dismissed', (e) => this.trackNotificationDismissed(e.detail));
    window.addEventListener('notification:action', (e) => this.trackNotificationAction(e.detail));
    window.addEventListener('notification:batch', (e) => this.trackBatch(e.detail));

    // Escuchar cambios de visibilidad
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.trackSessionPause();
      } else {
        this.trackSessionResume();
      }
    });

    // Guardar métricas antes de cerrar
    window.addEventListener('beforeunload', () => {
      this.endSession();
      this.saveMetrics();
    });
  }

  startMetricsCollection() {
    // Limpiar métricas antiguas cada hora
    setInterval(() => {
      this.cleanOldEvents();
    }, 3600000); // 1 hora

    // Guardar métricas cada 5 minutos
    setInterval(() => {
      this.saveMetrics();
    }, 300000); // 5 minutos
  }

  // Tracking de eventos principales
  trackNotificationShown(notificationData) {
    const event = this.createEvent('shown', notificationData);
    this.addEvent(event);
    
    const { category, type, priority } = notificationData;
    
    // Actualizar contadores
    this.metrics.totalNotifications++;
    this.incrementCounter(['byCategory', category, 'shown']);
    this.incrementCounter(['byType', type, 'shown']);
    this.incrementCounter(['byPriority', priority, 'shown']);
    this.incrementCounter(['byDevice', this.getDeviceType(), 'shown']);
    
    // Tracking temporal
    this.trackTimePattern();
    
    // Tracking de posición
    if (notificationData.position) {
      this.incrementCounter(['byPosition', notificationData.position, 'shown']);
    }
    
    this.saveMetrics();
  }

  trackNotificationClicked(notificationData) {
    const event = this.createEvent('clicked', notificationData);
    this.addEvent(event);
    
    const { category, type, priority } = notificationData;
    
    // Actualizar contadores
    this.metrics.totalInteractions++;
    this.session.interactions++;
    
    this.incrementCounter(['byCategory', category, 'clicked']);
    this.incrementCounter(['byType', type, 'clicked']);
    this.incrementCounter(['byPriority', priority, 'clicked']);
    this.incrementCounter(['byDevice', this.getDeviceType(), 'clicked']);
    
    // Calcular tiempo hasta acción
    const timeToAction = this.calculateTimeToAction(notificationData.id);
    if (timeToAction !== null) {
      this.addTimeToAction(category, timeToAction);
      this.updateAvgResponseTime(priority, timeToAction);
    }
    
    this.saveMetrics();
  }

  trackNotificationDismissed(notificationData) {
    const event = this.createEvent('dismissed', notificationData);
    this.addEvent(event);
    
    const { category, type, priority } = notificationData;
    
    // Actualizar contadores
    this.metrics.totalDismissals++;
    
    this.incrementCounter(['byCategory', category, 'dismissed']);
    this.incrementCounter(['byType', type, 'dismissed']);
    this.incrementCounter(['byPriority', priority, 'dismissed']);
    this.incrementCounter(['byDevice', this.getDeviceType(), 'dismissed']);
    
    this.saveMetrics();
  }

  trackNotificationAction(actionData) {
    const event = this.createEvent('action', actionData);
    event.actionType = actionData.actionType;
    event.actionResult = actionData.result;
    
    this.addEvent(event);
    
    // Tracking específico de acciones
    if (!this.metrics.actions) {
      this.metrics.actions = {};
    }
    
    this.incrementCounter(['actions', actionData.actionType, 'used']);
    
    if (actionData.result === 'success') {
      this.incrementCounter(['actions', actionData.actionType, 'successful']);
    }
    
    this.saveMetrics();
  }

  trackBatch(batchData) {
    const event = this.createEvent('batch', batchData);
    event.batchSize = batchData.notifications.length;
    event.batchType = batchData.type;
    
    this.addEvent(event);
    
    // Métricas de batching
    this.metrics.batching.totalBatches++;
    this.metrics.batching.batchSizes.push(batchData.notifications.length);
    
    // Limitar historial de tamaños de batch
    if (this.metrics.batching.batchSizes.length > 100) {
      this.metrics.batching.batchSizes.shift();
    }
    
    this.saveMetrics();
  }

  // Utilidades
  createEvent(type, data) {
    return {
      id: this.generateEventId(),
      type,
      timestamp: Date.now(),
      sessionId: this.session.id,
      notificationId: data.id,
      category: data.category,
      priority: data.priority,
      device: this.getDeviceType(),
      viewport: this.getViewportInfo(),
      userAgent: navigator.userAgent
    };
  }

  generateEventId() {
    return `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  addEvent(event) {
    this.events.push(event);
    
    // Limitar eventos en memoria
    if (this.events.length > 1000) {
      this.events.shift();
    }
  }

  incrementCounter(path) {
    let current = this.metrics;
    
    for (let i = 0; i < path.length - 1; i++) {
      const key = path[i];
      if (!current[key]) {
        current[key] = {};
      }
      current = current[key];
    }
    
    const lastKey = path[path.length - 1];
    if (typeof current[lastKey] !== 'number') {
      current[lastKey] = 0;
    }
    
    current[lastKey]++;
  }

  calculateTimeToAction(notificationId) {
    const shownEvent = this.events.find(e => 
      e.notificationId === notificationId && e.type === 'shown'
    );
    
    if (!shownEvent) return null;
    
    return Date.now() - shownEvent.timestamp;
  }

  addTimeToAction(category, timeToAction) {
    if (!this.metrics.byCategory[category].timeToAction) {
      this.metrics.byCategory[category].timeToAction = [];
    }
    
    this.metrics.byCategory[category].timeToAction.push(timeToAction);
    
    // Limitar historial
    if (this.metrics.byCategory[category].timeToAction.length > 50) {
      this.metrics.byCategory[category].timeToAction.shift();
    }
  }

  updateAvgResponseTime(priority, timeToAction) {
    const current = this.metrics.byPriority[priority].avgResponseTime;
    const count = this.metrics.byPriority[priority].clicked;
    
    // Promedio móvil
    this.metrics.byPriority[priority].avgResponseTime = 
      ((current * (count - 1)) + timeToAction) / count;
  }

  trackTimePattern() {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();
    const month = now.getMonth();
    
    this.metrics.timePatterns.hourly[hour]++;
    this.metrics.timePatterns.daily[day]++;
    this.metrics.timePatterns.monthly[month]++;
  }

  getDeviceType() {
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  getViewportInfo() {
    return {
      width: window.innerWidth,
      height: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio || 1
    };
  }

  // Gestión de sesiones
  trackSessionPause() {
    this.session.pausedAt = Date.now();
  }

  trackSessionResume() {
    if (this.session.pausedAt) {
      const pauseDuration = Date.now() - this.session.pausedAt;
      this.session.totalPauseTime = (this.session.totalPauseTime || 0) + pauseDuration;
      delete this.session.pausedAt;
    }
  }

  endSession() {
    const sessionDuration = Date.now() - this.session.startTime;
    const activeDuration = sessionDuration - (this.session.totalPauseTime || 0);
    
    const sessionData = {
      id: this.session.id,
      startTime: this.session.startTime,
      endTime: Date.now(),
      duration: sessionDuration,
      activeDuration,
      interactions: this.session.interactions,
      notificationsShown: this.events.filter(e => e.type === 'shown' && e.sessionId === this.session.id).length,
      device: this.getDeviceType()
    };
    
    this.metrics.sessions.push(sessionData);
    
    // Limitar historial de sesiones
    if (this.metrics.sessions.length > 50) {
      this.metrics.sessions.shift();
    }
  }

  cleanOldEvents() {
    const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 horas
    this.events = this.events.filter(event => event.timestamp > cutoff);
  }

  // API de métricas calculadas
  getEngagementRate(category = null) {
    let shown, clicked;
    
    if (category) {
      shown = this.metrics.byCategory[category]?.shown || 0;
      clicked = this.metrics.byCategory[category]?.clicked || 0;
    } else {
      shown = this.metrics.totalNotifications;
      clicked = this.metrics.totalInteractions;
    }
    
    return shown > 0 ? (clicked / shown) * 100 : 0;
  }

  getDismissalRate(category = null) {
    let shown, dismissed;
    
    if (category) {
      shown = this.metrics.byCategory[category]?.shown || 0;
      dismissed = this.metrics.byCategory[category]?.dismissed || 0;
    } else {
      shown = this.metrics.totalNotifications;
      dismissed = this.metrics.totalDismissals;
    }
    
    return shown > 0 ? (dismissed / shown) * 100 : 0;
  }

  getAverageTimeToAction(category) {
    const times = this.metrics.byCategory[category]?.timeToAction || [];
    if (times.length === 0) return 0;
    
    return times.reduce((sum, time) => sum + time, 0) / times.length;
  }

  getMostActiveHour() {
    const hourly = this.metrics.timePatterns.hourly;
    const maxIndex = hourly.indexOf(Math.max(...hourly));
    return maxIndex;
  }

  getMostActiveDay() {
    const daily = this.metrics.timePatterns.daily;
    const maxIndex = daily.indexOf(Math.max(...daily));
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return days[maxIndex];
  }

  getAverageBatchSize() {
    const sizes = this.metrics.batching.batchSizes;
    if (sizes.length === 0) return 0;
    
    return sizes.reduce((sum, size) => sum + size, 0) / sizes.length;
  }

  getBatchEffectiveness() {
    const total = this.metrics.batching.batchInteractions + this.metrics.batching.batchDismissals;
    if (total === 0) return 0;
    
    return (this.metrics.batching.batchInteractions / total) * 100;
  }

  getDeviceBreakdown() {
    const total = Object.values(this.metrics.byDevice).reduce((sum, device) => sum + device.shown, 0);
    
    if (total === 0) return {};
    
    return Object.entries(this.metrics.byDevice).reduce((acc, [device, data]) => {
      acc[device] = (data.shown / total) * 100;
      return acc;
    }, {});
  }

  // Reportes
  generateDashboardData() {
    return {
      overview: {
        totalNotifications: this.metrics.totalNotifications,
        totalInteractions: this.metrics.totalInteractions,
        engagementRate: this.getEngagementRate(),
        dismissalRate: this.getDismissalRate()
      },
      
      byCategory: Object.entries(this.metrics.byCategory).map(([category, data]) => ({
        category,
        shown: data.shown,
        clicked: data.clicked,
        dismissed: data.dismissed,
        engagementRate: this.getEngagementRate(category),
        avgTimeToAction: this.getAverageTimeToAction(category)
      })),
      
      timePatterns: {
        mostActiveHour: this.getMostActiveHour(),
        mostActiveDay: this.getMostActiveDay(),
        hourlyDistribution: this.metrics.timePatterns.hourly
      },
      
      batching: {
        totalBatches: this.metrics.batching.totalBatches,
        averageSize: this.getAverageBatchSize(),
        effectiveness: this.getBatchEffectiveness()
      },
      
      devices: this.getDeviceBreakdown(),
      
      performance: {
        avgResponseTime: Object.entries(this.metrics.byPriority).map(([priority, data]) => ({
          priority,
          avgTime: data.avgResponseTime
        }))
      }
    };
  }

  generateInsights() {
    const insights = [];
    
    // Análisis de engagement
    const engagementRate = this.getEngagementRate();
    if (engagementRate < 20) {
      insights.push({
        type: 'warning',
        title: 'Bajo engagement',
        message: `Solo el ${engagementRate.toFixed(1)}% de las notificaciones reciben interacción`,
        suggestion: 'Considera revisar el contenido y timing de las notificaciones'
      });
    } else if (engagementRate > 60) {
      insights.push({
        type: 'success',
        title: 'Excelente engagement',
        message: `${engagementRate.toFixed(1)}% de engagement es muy bueno`,
        suggestion: 'Mantén el formato actual de notificaciones'
      });
    }
    
    // Análisis de dismissal
    const dismissalRate = this.getDismissalRate();
    if (dismissalRate > 40) {
      insights.push({
        type: 'warning',
        title: 'Alta tasa de descarte',
        message: `${dismissalRate.toFixed(1)}% de las notificaciones son descartadas`,
        suggestion: 'Revisa la relevancia y frecuencia de las notificaciones'
      });
    }
    
    // Análisis de horarios
    const mostActiveHour = this.getMostActiveHour();
    insights.push({
      type: 'info',
      title: 'Hora más activa',
      message: `La mayor actividad es a las ${mostActiveHour}:00`,
      suggestion: 'Programa notificaciones importantes en este horario'
    });
    
    return insights;
  }

  // Export/Import
  exportData() {
    return {
      metrics: this.metrics,
      events: this.events,
      session: this.session,
      exportedAt: Date.now()
    };
  }

  importData(data) {
    if (data.metrics) {
      this.metrics = { ...this.getDefaultMetrics(), ...data.metrics };
    }
    if (data.events) {
      this.events = data.events;
    }
    this.saveMetrics();
  }

  reset() {
    this.metrics = this.getDefaultMetrics();
    this.events = [];
    this.session.interactions = 0;
    this.saveMetrics();
  }
}

// Instancia singleton
export const notificationAnalytics = new NotificationAnalytics();