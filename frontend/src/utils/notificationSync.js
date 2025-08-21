/**
 * Sistema de sincronización en tiempo real de notificaciones
 * Sincroniza estado entre dispositivos y usuarios usando Supabase
 */

import { supabase } from '../supabaseClient';
import { smartToast } from './toastManager';

export class NotificationSync {
  constructor() {
    this.subscription = null;
    this.userId = null;
    this.sessionId = this.generateSessionId();
    this.isOnline = navigator.onLine;
    this.syncQueue = [];
    this.lastSync = null;
    this.retryCount = 0;
    this.maxRetries = 3;

    this.setupNetworkListeners();
    this.initializeAuth();
  }

  generateSessionId() {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  setupNetworkListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processSyncQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  async initializeAuth() {
    try {
      // Obtener sesión actual
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        await this.setUser(session.user);
      }

      // Escuchar cambios de autenticación
      supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          await this.setUser(session.user);
        } else if (event === 'SIGNED_OUT') {
          await this.cleanup();
        }
      });
    } catch (error) {
      console.error('Error initializing notification sync auth:', error);
    }
  }

  async setUser(user) {
    this.userId = user.id;
    await this.setupRealtimeSubscription();
    await this.syncUserPreferences();
  }

  async setupRealtimeSubscription() {
    if (!this.userId) return;

    try {
      // Cleanup anterior subscription
      if (this.subscription) {
        this.subscription.unsubscribe();
      }

      // Crear tabla de notificaciones si no existe
      await this.ensureNotificationTable();

      // Suscribirse a cambios en tiempo real
      this.subscription = supabase
        .channel(`notifications-${this.userId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'user_notifications',
          filter: `user_id=eq.${this.userId}`
        }, (payload) => {
          this.handleRealtimeUpdate(payload);
        })
        .on('broadcast', {
          event: 'notification_action'
        }, (payload) => {
          this.handleBroadcastAction(payload);
        })
        .subscribe();

      console.log('✅ Real-time notification sync enabled');
    } catch (error) {
      console.error('Error setting up realtime subscription:', error);
      this.handleSyncError(error);
    }
  }

  async ensureNotificationTable() {
    // Esta función asume que la tabla ya existe o se crea via migración
    // En un entorno real, esto se haría con migraciones de Supabase
    try {
      const { error } = await supabase
        .from('user_notifications')
        .select('id')
        .limit(1);

      if (error && error.code === '42P01') {
        // Tabla no existe, pero no podemos crearla aquí por permisos
        console.warn('user_notifications table does not exist. Please run migrations.');
      }
    } catch (error) {
      console.error('Error checking notification table:', error);
    }
  }

  handleRealtimeUpdate(payload) {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    try {
      switch (eventType) {
        case 'INSERT':
          this.handleNewNotification(newRecord);
          break;
        case 'UPDATE':
          this.handleNotificationUpdate(newRecord, oldRecord);
          break;
        case 'DELETE':
          this.handleNotificationDelete(oldRecord);
          break;
      }
    } catch (error) {
      console.error('Error handling realtime update:', error);
    }
  }

  handleNewNotification(notification) {
    // Solo mostrar si no es de esta sesión
    if (notification.session_id === this.sessionId) return;

    // Convertir a formato local y mostrar
    const localNotification = this.convertToLocalFormat(notification);
    
    if (this.shouldShowCrossDeviceNotification(localNotification)) {
      this.showCrossDeviceNotification(localNotification);
    }
  }

  handleNotificationUpdate(newNotification, oldNotification) {
    // Manejar cambios de estado (leído, descartado, etc.)
    if (newNotification.session_id === this.sessionId) return;

    const action = this.detectAction(newNotification, oldNotification);
    this.applyCrossDeviceAction(action, newNotification);
  }

  handleNotificationDelete(notification) {
    // Sincronizar eliminación entre dispositivos
    if (notification.session_id === this.sessionId) return;
    
    this.removeCrossDeviceNotification(notification.notification_id);
  }

  handleBroadcastAction(payload) {
    // Manejar acciones broadcast (ej: cambio de modo)
    if (payload.session_id === this.sessionId) return;

    switch (payload.type) {
      case 'mode_change':
        this.handleModeChange(payload.data);
        break;
      case 'settings_update':
        this.handleSettingsUpdate(payload.data);
        break;
      case 'bulk_action':
        this.handleBulkAction(payload.data);
        break;
    }
  }

  // Sincronizar notificación a otros dispositivos
  async syncNotification(notificationData, action = 'create') {
    if (!this.userId || !this.isOnline) {
      this.queueSync({ type: 'notification', action, data: notificationData });
      return;
    }

    try {
      const syncData = {
        user_id: this.userId,
        session_id: this.sessionId,
        notification_id: notificationData.id,
        notification_data: notificationData,
        action,
        created_at: new Date().toISOString(),
        device_info: this.getDeviceInfo()
      };

      switch (action) {
        case 'create':
          await this.createNotificationRecord(syncData);
          break;
        case 'update':
          await this.updateNotificationRecord(syncData);
          break;
        case 'delete':
          await this.deleteNotificationRecord(syncData);
          break;
      }

      this.lastSync = Date.now();
      this.retryCount = 0;
    } catch (error) {
      console.error('Error syncing notification:', error);
      this.handleSyncError(error);
      this.queueSync({ type: 'notification', action, data: notificationData });
    }
  }

  async createNotificationRecord(syncData) {
    const { error } = await supabase
      .from('user_notifications')
      .insert(syncData);

    if (error) throw error;
  }

  async updateNotificationRecord(syncData) {
    const { error } = await supabase
      .from('user_notifications')
      .update({
        notification_data: syncData.notification_data,
        action: syncData.action,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', this.userId)
      .eq('notification_id', syncData.notification_id);

    if (error) throw error;
  }

  async deleteNotificationRecord(syncData) {
    const { error } = await supabase
      .from('user_notifications')
      .delete()
      .eq('user_id', this.userId)
      .eq('notification_id', syncData.notification_id);

    if (error) throw error;
  }

  // Sincronizar preferencias de usuario
  async syncUserPreferences() {
    if (!this.userId || !this.isOnline) return;

    try {
      // Obtener preferencias remotas
      const { data: remotePrefs, error } = await supabase
        .from('user_notification_preferences')
        .select('*')
        .eq('user_id', this.userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      const localPrefs = this.getLocalPreferences();
      
      if (!remotePrefs) {
        // Crear preferencias remotas
        await this.createRemotePreferences(localPrefs);
      } else {
        // Sincronizar bidireccional
        await this.mergePreferences(localPrefs, remotePrefs);
      }
    } catch (error) {
      console.error('Error syncing user preferences:', error);
    }
  }

  async createRemotePreferences(localPrefs) {
    const { error } = await supabase
      .from('user_notification_preferences')
      .insert({
        user_id: this.userId,
        preferences: localPrefs,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (error) throw error;
  }

  async mergePreferences(localPrefs, remotePrefs) {
    const localUpdated = new Date(localStorage.getItem('notification-settings-updated') || 0);
    const remoteUpdated = new Date(remotePrefs.updated_at);

    if (remoteUpdated > localUpdated) {
      // Preferencias remotas son más nuevas
      this.applyRemotePreferences(remotePrefs.preferences);
    } else if (localUpdated > remoteUpdated) {
      // Preferencias locales son más nuevas
      await this.updateRemotePreferences(localPrefs);
    }
    // Si son iguales, no hacer nada
  }

  async updateRemotePreferences(localPrefs) {
    const { error } = await supabase
      .from('user_notification_preferences')
      .update({
        preferences: localPrefs,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', this.userId);

    if (error) throw error;
  }

  applyRemotePreferences(remotePrefs) {
    localStorage.setItem('notification-settings', JSON.stringify(remotePrefs));
    localStorage.setItem('notification-settings-updated', new Date().toISOString());
    
    // Notificar cambio de configuración
    window.dispatchEvent(new CustomEvent('notification-settings-updated', {
      detail: remotePrefs
    }));
  }

  getLocalPreferences() {
    const settings = localStorage.getItem('notification-settings');
    return settings ? JSON.parse(settings) : null;
  }

  // Acciones broadcast
  async broadcastAction(type, data) {
    if (!this.userId || !this.isOnline) return;

    try {
      await supabase
        .channel(`notifications-${this.userId}`)
        .send({
          type: 'broadcast',
          event: 'notification_action',
          payload: {
            type,
            data,
            session_id: this.sessionId,
            timestamp: Date.now()
          }
        });
    } catch (error) {
      console.error('Error broadcasting action:', error);
    }
  }

  handleModeChange(data) {
    const { mode } = data;
    
    smartToast.info(`Modo ${mode} activado en otro dispositivo`, {
      category: 'system',
      duration: 3000,
      icon: mode === 'busy' ? '🔕' : mode === 'focus' ? '🎯' : '🔔'
    });

    // Aplicar cambio localmente
    window.dispatchEvent(new CustomEvent('notification-mode-changed', {
      detail: { mode, source: 'remote' }
    }));
  }

  handleSettingsUpdate(data) {
    // Aplicar configuración remota
    this.applyRemotePreferences(data.settings);
  }

  handleBulkAction(data) {
    const { action, notificationIds } = data;
    
    // Aplicar acción bulk
    window.dispatchEvent(new CustomEvent('notification-bulk-action', {
      detail: { action, notificationIds, source: 'remote' }
    }));
  }

  // Utilidades
  convertToLocalFormat(dbNotification) {
    return {
      id: dbNotification.notification_id,
      ...dbNotification.notification_data,
      synced: true,
      fromDevice: dbNotification.device_info?.type || 'unknown'
    };
  }

  shouldShowCrossDeviceNotification(notification) {
    // Solo mostrar notificaciones importantes de otros dispositivos
    return ['high', 'critical'].includes(notification.priority);
  }

  showCrossDeviceNotification(notification) {
    smartToast.info(
      `${notification.message} (desde ${notification.fromDevice})`,
      {
        category: notification.category,
        title: notification.title,
        duration: 4000,
        icon: '📱'
      }
    );
  }

  detectAction(newNotification, oldNotification) {
    if (newNotification.is_read && !oldNotification.is_read) {
      return 'mark_read';
    }
    if (newNotification.is_dismissed && !oldNotification.is_dismissed) {
      return 'dismiss';
    }
    return 'update';
  }

  applyCrossDeviceAction(action, notification) {
    switch (action) {
      case 'mark_read':
        window.dispatchEvent(new CustomEvent('notification-marked-read', {
          detail: { notificationId: notification.notification_id, source: 'remote' }
        }));
        break;
      case 'dismiss':
        window.dispatchEvent(new CustomEvent('notification-dismissed', {
          detail: { notificationId: notification.notification_id, source: 'remote' }
        }));
        break;
    }
  }

  removeCrossDeviceNotification(notificationId) {
    window.dispatchEvent(new CustomEvent('notification-removed', {
      detail: { notificationId, source: 'remote' }
    }));
  }

  getDeviceInfo() {
    return {
      type: this.getDeviceType(),
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      timestamp: Date.now()
    };
  }

  getDeviceType() {
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  // Gestión de cola offline
  queueSync(syncData) {
    this.syncQueue.push({
      ...syncData,
      timestamp: Date.now(),
      retries: 0
    });

    // Limitar tamaño de cola
    if (this.syncQueue.length > 100) {
      this.syncQueue.shift();
    }
  }

  async processSyncQueue() {
    if (!this.isOnline || this.syncQueue.length === 0) return;

    const queue = [...this.syncQueue];
    this.syncQueue = [];

    for (const item of queue) {
      try {
        if (item.type === 'notification') {
          await this.syncNotification(item.data, item.action);
        }
      } catch (error) {
        item.retries++;
        if (item.retries < this.maxRetries) {
          this.syncQueue.push(item);
        } else {
          console.error('Max retries reached for sync item:', item);
        }
      }
    }
  }

  handleSyncError(error) {
    this.retryCount++;
    
    if (this.retryCount >= this.maxRetries) {
      console.error('Max sync retries reached. Sync disabled temporarily.');
      
      // Retry después de un tiempo
      setTimeout(() => {
        this.retryCount = 0;
        this.processSyncQueue();
      }, 30000); // 30 segundos
    }
  }

  // Cleanup
  async cleanup() {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
    
    this.userId = null;
    this.syncQueue = [];
    this.retryCount = 0;
  }

  // API pública
  async markNotificationRead(notificationId) {
    await this.syncNotification({ id: notificationId, isRead: true }, 'update');
  }

  async dismissNotification(notificationId) {
    await this.syncNotification({ id: notificationId, isDismissed: true }, 'update');
  }

  async deleteNotification(notificationId) {
    await this.syncNotification({ id: notificationId }, 'delete');
  }

  async changeMode(mode) {
    await this.broadcastAction('mode_change', { mode });
  }

  async updateSettings(settings) {
    await this.broadcastAction('settings_update', { settings });
    await this.updateRemotePreferences(settings);
  }

  getStats() {
    return {
      isOnline: this.isOnline,
      userId: this.userId,
      sessionId: this.sessionId,
      queueLength: this.syncQueue.length,
      lastSync: this.lastSync,
      retryCount: this.retryCount,
      hasSubscription: !!this.subscription
    };
  }
}

// Instancia singleton
export const notificationSync = new NotificationSync();