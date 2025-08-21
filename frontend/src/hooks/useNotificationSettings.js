/**
 * Hook para gestionar configuración de notificaciones
 * Proporciona funcionalidad completa de settings
 */

import { useState, useEffect, useCallback } from 'react';
import { smartToast } from '../utils/toastManager';
import { intelligentBatching } from '../utils/intelligentBatching';

export const useNotificationSettings = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  // Cargar configuración al montar
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = useCallback(() => {
    try {
      const saved = localStorage.getItem('notification-settings');
      const defaultSettings = getDefaultSettings();
      
      if (saved) {
        const parsed = JSON.parse(saved);
        const mergedSettings = mergeSettings(defaultSettings, parsed);
        setSettings(mergedSettings);
        applySettings(mergedSettings);
      } else {
        setSettings(defaultSettings);
        applySettings(defaultSettings);
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
      const defaultSettings = getDefaultSettings();
      setSettings(defaultSettings);
    } finally {
      setLoading(false);
    }
  }, []);

  const getDefaultSettings = () => ({
    version: '1.0',
    globalEnabled: true,
    
    categories: {
      auth: {
        enabled: true,
        toastEnabled: true,
        panelEnabled: true,
        soundEnabled: false,
        priority: 'normal',
        autoClose: true,
        duration: 3000,
        position: 'auto'
      },
      client: {
        enabled: true,
        toastEnabled: true,
        panelEnabled: true,
        soundEnabled: false,
        priority: 'normal',
        autoClose: true,
        duration: 4000,
        position: 'auto'
      },
      task: {
        enabled: true,
        toastEnabled: true,
        panelEnabled: true,
        soundEnabled: true,
        priority: 'high',
        autoClose: false,
        duration: 6000,
        position: 'auto'
      },
      ai: {
        enabled: true,
        toastEnabled: true,
        panelEnabled: true,
        soundEnabled: false,
        priority: 'normal',
        autoClose: true,
        duration: 4000,
        position: 'auto'
      },
      system: {
        enabled: true,
        toastEnabled: true,
        panelEnabled: true,
        soundEnabled: true,
        priority: 'high',
        autoClose: false,
        duration: 5000,
        position: 'auto'
      },
      document: {
        enabled: true,
        toastEnabled: true,
        panelEnabled: true,
        soundEnabled: false,
        priority: 'normal',
        autoClose: true,
        duration: 4000,
        position: 'auto'
      }
    },

    behavior: {
      batchSimilar: true,
      maxToastsPerMinute: 5,
      maxToastsPer30Seconds: 3,
      smartPositioning: true,
      respectQuietHours: false,
      learningEnabled: true,
      busyModeEnabled: false,
      focusModeEnabled: false
    },

    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00',
      allowCritical: true,
      weekendsOnly: false
    },

    device: {
      reduceMotion: false,
      highContrast: false,
      compactMode: false,
      mobileOptimized: true,
      vibration: true
    },

    sounds: {
      enabled: false,
      volume: 0.5,
      success: 'gentle',
      error: 'alert',
      info: 'soft',
      critical: 'urgent'
    },

    experimental: {
      predictiveNotifications: false,
      contextAwareness: true,
      mlBatching: true
    }
  });

  const mergeSettings = (defaultSettings, userSettings) => {
    // Merge profundo manteniendo estructura de default
    const merged = { ...defaultSettings };
    
    Object.keys(userSettings).forEach(key => {
      if (typeof userSettings[key] === 'object' && !Array.isArray(userSettings[key])) {
        merged[key] = { ...defaultSettings[key], ...userSettings[key] };
        
        // Merge profundo para categorías
        if (key === 'categories') {
          Object.keys(userSettings[key]).forEach(category => {
            if (defaultSettings[key][category]) {
              merged[key][category] = { 
                ...defaultSettings[key][category], 
                ...userSettings[key][category] 
              };
            }
          });
        }
      } else {
        merged[key] = userSettings[key];
      }
    });

    return merged;
  };

  const saveSettings = useCallback((newSettings) => {
    try {
      setSettings(newSettings);
      localStorage.setItem('notification-settings', JSON.stringify(newSettings));
      applySettings(newSettings);
      
      // Notificar cambio guardado
      smartToast.success('Configuración guardada', {
        category: 'system',
        priority: 'low',
        duration: 2000
      });
    } catch (error) {
      console.error('Error saving notification settings:', error);
      smartToast.error('Error al guardar configuración', {
        category: 'system'
      });
    }
  }, []);

  const applySettings = (settings) => {
    if (!settings) return;

    try {
      // Configurar toastManager
      smartToast.configure({
        maxToastsPerMinute: settings.behavior.maxToastsPerMinute,
        maxToastsPer30Seconds: settings.behavior.maxToastsPer30Seconds,
        batchingEnabled: settings.behavior.batchSimilar
      });

      // Configurar intelligent batching
      intelligentBatching.learningEnabled = settings.behavior.learningEnabled;
      
      if (settings.behavior.busyModeEnabled) {
        intelligentBatching.enableBusyMode();
      } else if (settings.behavior.focusModeEnabled) {
        intelligentBatching.enableFocusMode();
      } else {
        intelligentBatching.disableContextModes();
      }

      // Aplicar configuración de accesibilidad
      if (settings.device.reduceMotion) {
        document.documentElement.style.setProperty('--notification-duration', '0.1s');
      } else {
        document.documentElement.style.removeProperty('--notification-duration');
      }

    } catch (error) {
      console.error('Error applying notification settings:', error);
    }
  };

  // Métodos de actualización específicos
  const updateCategorySetting = useCallback((category, key, value) => {
    if (!settings) return;

    const newSettings = {
      ...settings,
      categories: {
        ...settings.categories,
        [category]: {
          ...settings.categories[category],
          [key]: value
        }
      }
    };
    
    saveSettings(newSettings);
  }, [settings, saveSettings]);

  const updateBehaviorSetting = useCallback((key, value) => {
    if (!settings) return;

    const newSettings = {
      ...settings,
      behavior: {
        ...settings.behavior,
        [key]: value
      }
    };
    
    saveSettings(newSettings);
  }, [settings, saveSettings]);

  const updateGlobalSetting = useCallback((key, value) => {
    if (!settings) return;

    const newSettings = {
      ...settings,
      [key]: value
    };
    
    saveSettings(newSettings);
  }, [settings, saveSettings]);

  const toggleCategory = useCallback((category) => {
    updateCategorySetting(category, 'enabled', !settings?.categories[category]?.enabled);
  }, [settings, updateCategorySetting]);

  const resetToDefaults = useCallback(() => {
    const defaultSettings = getDefaultSettings();
    saveSettings(defaultSettings);
    
    smartToast.success('Configuración restaurada a valores por defecto', {
      category: 'system'
    });
  }, [saveSettings]);

  // Métodos de modo contextual
  const enableBusyMode = useCallback(() => {
    updateBehaviorSetting('busyModeEnabled', true);
    updateBehaviorSetting('focusModeEnabled', false);
    
    smartToast.info('Modo ocupado activado', {
      category: 'system',
      icon: '🔕'
    });
  }, [updateBehaviorSetting]);

  const enableFocusMode = useCallback(() => {
    updateBehaviorSetting('focusModeEnabled', true);
    updateBehaviorSetting('busyModeEnabled', false);
    
    smartToast.info('Modo concentración activado', {
      category: 'system',
      icon: '🎯'
    });
  }, [updateBehaviorSetting]);

  const disableContextModes = useCallback(() => {
    updateBehaviorSetting('busyModeEnabled', false);
    updateBehaviorSetting('focusModeEnabled', false);
    
    smartToast.info('Modos contextuales desactivados', {
      category: 'system'
    });
  }, [updateBehaviorSetting]);

  // Validar si una notificación debe mostrarse según settings
  const shouldShowNotification = useCallback((notificationData) => {
    if (!settings || !settings.globalEnabled) return false;

    const category = notificationData.category || 'system';
    const categorySettings = settings.categories[category];
    
    if (!categorySettings || !categorySettings.enabled) return false;

    // Verificar horas silenciosas
    if (settings.quietHours.enabled && isInQuietHours()) {
      return notificationData.priority === 'critical' && settings.quietHours.allowCritical;
    }

    // Verificar modos contextuales
    if (settings.behavior.busyModeEnabled) {
      return notificationData.priority === 'critical';
    }

    if (settings.behavior.focusModeEnabled) {
      return ['critical', 'high'].includes(notificationData.priority);
    }

    return true;
  }, [settings]);

  const isInQuietHours = () => {
    if (!settings?.quietHours.enabled) return false;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [startHour, startMin] = settings.quietHours.start.split(':').map(Number);
    const [endHour, endMin] = settings.quietHours.end.split(':').map(Number);
    
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    // Verificar si es fin de semana y está configurado solo para fines de semana
    if (settings.quietHours.weekendsOnly) {
      const isWeekend = now.getDay() === 0 || now.getDay() === 6;
      if (!isWeekend) return false;
    }

    // Manejar el caso donde las horas cruzan medianoche
    if (startTime > endTime) {
      return currentTime >= startTime || currentTime <= endTime;
    } else {
      return currentTime >= startTime && currentTime <= endTime;
    }
  };

  // Test de notificación
  const testNotification = useCallback((category) => {
    const testMessages = {
      auth: { message: 'Prueba de autenticación exitosa', type: 'success' },
      client: { message: 'Cliente de prueba actualizado correctamente', type: 'success' },
      task: { message: 'Tarea de prueba creada con acciones', type: 'success', actions: [{ type: 'dismiss', label: 'OK' }] },
      ai: { message: 'Respuesta de IA de prueba generada', type: 'info' },
      document: { message: 'Documento de prueba subido por Usuario', type: 'success', actions: [{ type: 'dismiss', label: 'OK' }] },
      system: { message: 'Notificación del sistema de prueba', type: 'info' }
    };

    const test = testMessages[category] || testMessages.system;
    
    if (test.type === 'success') {
      smartToast.success(test.message, {
        category,
        title: 'Notificación de prueba',
        actions: test.actions
      });
    } else {
      smartToast.info(test.message, {
        category,
        title: 'Notificación de prueba'
      });
    }
  }, []);

  // Exportar estadísticas de configuración
  const getSettingsStats = useCallback(() => {
    if (!settings) return null;

    const enabledCategories = Object.values(settings.categories).filter(cat => cat.enabled).length;
    const totalCategories = Object.keys(settings.categories).length;
    
    return {
      globalEnabled: settings.globalEnabled,
      enabledCategories,
      totalCategories,
      batchingEnabled: settings.behavior.batchSimilar,
      learningEnabled: settings.behavior.learningEnabled,
      quietHoursEnabled: settings.quietHours.enabled,
      soundsEnabled: settings.sounds.enabled,
      currentMode: settings.behavior.busyModeEnabled ? 'busy' : 
                   settings.behavior.focusModeEnabled ? 'focus' : 'normal'
    };
  }, [settings]);

  return {
    // Estado
    settings,
    loading,
    
    // Métodos de actualización
    updateCategorySetting,
    updateBehaviorSetting,
    updateGlobalSetting,
    toggleCategory,
    resetToDefaults,
    
    // Modos contextuales
    enableBusyMode,
    enableFocusMode,
    disableContextModes,
    
    // Validación
    shouldShowNotification,
    isInQuietHours,
    
    // Utilidades
    testNotification,
    getSettingsStats,
    
    // Datos derivados
    isGlobalEnabled: settings?.globalEnabled || false,
    currentMode: settings?.behavior.busyModeEnabled ? 'busy' : 
                 settings?.behavior.focusModeEnabled ? 'focus' : 'normal'
  };
};