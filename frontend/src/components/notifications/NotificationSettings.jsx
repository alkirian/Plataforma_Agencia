/**
 * Panel de configuración granular de notificaciones
 * Permite personalizar cada categoría y comportamiento
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiBell, 
  FiSettings, 
  FiToggleLeft, 
  FiToggleRight,
  FiVolume2,
  FiVolumeX,
  FiSmartphone,
  FiMonitor,
  FiClock,
  FiZap,
  FiFilter,
  FiRefreshCw
} from 'react-icons/fi';
import { smartToast } from '../../utils/toastManager';
import { intelligentBatching } from '../../utils/intelligentBatching';

export const NotificationSettings = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('categories');

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const loadSettings = () => {
    setLoading(true);
    // Cargar configuración desde localStorage
    const saved = localStorage.getItem('notification-settings');
    const defaultSettings = getDefaultSettings();
    
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSettings({ ...defaultSettings, ...parsed });
      } catch {
        setSettings(defaultSettings);
      }
    } else {
      setSettings(defaultSettings);
    }
    
    setLoading(false);
  };

  const getDefaultSettings = () => ({
    globalEnabled: true,
    
    // Configuración por categoría
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
      }
    },

    // Configuración de comportamiento
    behavior: {
      batchSimilar: true,
      maxToastsPerMinute: 5,
      maxToastsPer30Seconds: 3,
      smartPositioning: true,
      respectQuietHours: false,
      learningEnabled: true
    },

    // Horas silenciosas
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00',
      allowCritical: true
    },

    // Configuración de dispositivo
    device: {
      reduceMotion: false,
      highContrast: false,
      compactMode: false,
      mobileOptimized: true
    },

    // Sonidos
    sounds: {
      enabled: false,
      volume: 0.5,
      success: 'gentle',
      error: 'alert',
      info: 'soft',
      critical: 'urgent'
    }
  });

  const saveSettings = (newSettings) => {
    setSettings(newSettings);
    localStorage.setItem('notification-settings', JSON.stringify(newSettings));
    
    // Aplicar configuración al sistema
    applySettings(newSettings);
    
    smartToast.success('Configuración guardada', {
      category: 'system',
      priority: 'low'
    });
  };

  const applySettings = (settings) => {
    // Configurar el toastManager
    smartToast.configure({
      maxToastsPerMinute: settings.behavior.maxToastsPerMinute,
      maxToastsPer30Seconds: settings.behavior.maxToastsPer30Seconds,
      batchingEnabled: settings.behavior.batchSimilar
    });

    // Configurar intelligent batching
    if (settings.behavior.learningEnabled) {
      intelligentBatching.learningEnabled = true;
    } else {
      intelligentBatching.learningEnabled = false;
    }
  };

  const updateCategorySetting = (category, key, value) => {
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
  };

  const updateBehaviorSetting = (key, value) => {
    const newSettings = {
      ...settings,
      behavior: {
        ...settings.behavior,
        [key]: value
      }
    };
    saveSettings(newSettings);
  };

  const updateGlobalSetting = (key, value) => {
    const newSettings = {
      ...settings,
      [key]: value
    };
    saveSettings(newSettings);
  };

  const resetToDefaults = () => {
    if (window.confirm('¿Restaurar configuración por defecto? Se perderán todos los ajustes personalizados.')) {
      const defaultSettings = getDefaultSettings();
      saveSettings(defaultSettings);
      smartToast.success('Configuración restaurada', {
        category: 'system'
      });
    }
  };

  const testNotification = (category) => {
    const testMessages = {
      auth: { message: 'Prueba de autenticación', type: 'success' },
      client: { message: 'Cliente de prueba actualizado', type: 'success' },
      task: { message: 'Tarea de prueba creada', type: 'success' },
      ai: { message: 'Respuesta de IA de prueba', type: 'info' },
      system: { message: 'Notificación del sistema', type: 'info' }
    };

    const test = testMessages[category];
    smartToast[test.type](test.message, {
      category,
      title: 'Notificación de prueba'
    });
  };

  if (!settings || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  const tabs = [
    { id: 'categories', label: 'Categorías', icon: FiBell },
    { id: 'behavior', label: 'Comportamiento', icon: FiZap },
    { id: 'schedule', label: 'Horarios', icon: FiClock },
    { id: 'device', label: 'Dispositivo', icon: FiMonitor }
  ];

  const categoryInfo = {
    auth: { label: 'Autenticación', desc: 'Login, registro, errores de sesión', icon: '🔐' },
    client: { label: 'Clientes', desc: 'Creación, actualización, eliminación', icon: '👤' },
    task: { label: 'Tareas', desc: 'Eventos, recordatorios, vencimientos', icon: '📋' },
    ai: { label: 'Asistente IA', desc: 'Respuestas, errores, generación de ideas', icon: '🤖' },
    system: { label: 'Sistema', desc: 'Actualizaciones, errores críticos', icon: '⚙️' }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-surface-strong border border-border-subtle rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border-subtle">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600/20 rounded-xl flex items-center justify-center">
              <FiSettings className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Configuración de Notificaciones</h2>
              <p className="text-sm text-gray-400">Personaliza cómo y cuándo recibir notificaciones</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={resetToDefaults}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              <FiRefreshCw className="w-4 h-4" />
              Restaurar
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
            >
              ×
            </button>
          </div>
        </div>

        <div className="flex h-[calc(90vh-80px)]">
          {/* Sidebar */}
          <div className="w-64 border-r border-border-subtle p-4">
            <div className="space-y-2">
              {tabs.map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all ${
                      activeTab === tab.id
                        ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30'
                        : 'text-gray-400 hover:text-white hover:bg-surface-soft'
                    }`}
                  >
                    <IconComponent className="w-4 h-4" />
                    <span className="text-sm font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              {activeTab === 'categories' && (
                <motion.div
                  key="categories"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="p-6"
                >
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">Configuración por Categoría</h3>
                      <p className="text-sm text-gray-400">Personaliza el comportamiento de cada tipo de notificación</p>
                    </div>

                    {Object.entries(categoryInfo).map(([category, info]) => {
                      const categorySettings = settings.categories[category];
                      
                      return (
                        <div key={category} className="bg-surface-soft rounded-xl p-4 border border-border-subtle">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{info.icon}</span>
                              <div>
                                <h4 className="text-white font-medium">{info.label}</h4>
                                <p className="text-sm text-gray-400">{info.desc}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => testNotification(category)}
                                className="px-3 py-1 text-xs bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition-colors"
                              >
                                Probar
                              </button>
                              
                              <button
                                onClick={() => updateCategorySetting(category, 'enabled', !categorySettings.enabled)}
                                className="flex items-center"
                              >
                                {categorySettings.enabled ? (
                                  <FiToggleRight className="w-8 h-8 text-green-400" />
                                ) : (
                                  <FiToggleLeft className="w-8 h-8 text-gray-500" />
                                )}
                              </button>
                            </div>
                          </div>

                          {categorySettings.enabled && (
                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border-subtle">
                              <div>
                                <label className="block text-xs font-medium text-gray-400 mb-2">
                                  Prioridad
                                </label>
                                <select
                                  value={categorySettings.priority}
                                  onChange={(e) => updateCategorySetting(category, 'priority', e.target.value)}
                                  className="w-full px-3 py-2 bg-surface-strong border border-border-subtle rounded-lg text-white text-sm"
                                >
                                  <option value="low">Baja</option>
                                  <option value="normal">Normal</option>
                                  <option value="high">Alta</option>
                                  <option value="critical">Crítica</option>
                                </select>
                              </div>

                              <div>
                                <label className="block text-xs font-medium text-gray-400 mb-2">
                                  Duración (ms)
                                </label>
                                <input
                                  type="number"
                                  min="1000"
                                  max="10000"
                                  step="500"
                                  value={categorySettings.duration}
                                  onChange={(e) => updateCategorySetting(category, 'duration', parseInt(e.target.value))}
                                  className="w-full px-3 py-2 bg-surface-strong border border-border-subtle rounded-lg text-white text-sm"
                                />
                              </div>

                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-300">Mostrar toast</span>
                                <button
                                  onClick={() => updateCategorySetting(category, 'toastEnabled', !categorySettings.toastEnabled)}
                                >
                                  {categorySettings.toastEnabled ? (
                                    <FiToggleRight className="w-6 h-6 text-green-400" />
                                  ) : (
                                    <FiToggleLeft className="w-6 h-6 text-gray-500" />
                                  )}
                                </button>
                              </div>

                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-300">Auto cerrar</span>
                                <button
                                  onClick={() => updateCategorySetting(category, 'autoClose', !categorySettings.autoClose)}
                                >
                                  {categorySettings.autoClose ? (
                                    <FiToggleRight className="w-6 h-6 text-green-400" />
                                  ) : (
                                    <FiToggleLeft className="w-6 h-6 text-gray-500" />
                                  )}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {activeTab === 'behavior' && (
                <motion.div
                  key="behavior"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="p-6"
                >
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">Comportamiento Inteligente</h3>
                      <p className="text-sm text-gray-400">Configura cómo se agrupan y muestran las notificaciones</p>
                    </div>

                    <div className="space-y-4">
                      <div className="bg-surface-soft rounded-xl p-4 border border-border-subtle">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="text-white font-medium">Agrupación Inteligente</h4>
                            <p className="text-sm text-gray-400">Agrupa notificaciones similares automáticamente</p>
                          </div>
                          <button
                            onClick={() => updateBehaviorSetting('batchSimilar', !settings.behavior.batchSimilar)}
                          >
                            {settings.behavior.batchSimilar ? (
                              <FiToggleRight className="w-8 h-8 text-green-400" />
                            ) : (
                              <FiToggleLeft className="w-8 h-8 text-gray-500" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="bg-surface-soft rounded-xl p-4 border border-border-subtle">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="text-white font-medium">Aprendizaje Automático</h4>
                            <p className="text-sm text-gray-400">El sistema aprende de tus preferencias</p>
                          </div>
                          <button
                            onClick={() => updateBehaviorSetting('learningEnabled', !settings.behavior.learningEnabled)}
                          >
                            {settings.behavior.learningEnabled ? (
                              <FiToggleRight className="w-8 h-8 text-green-400" />
                            ) : (
                              <FiToggleLeft className="w-8 h-8 text-gray-500" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="bg-surface-soft rounded-xl p-4 border border-border-subtle">
                        <h4 className="text-white font-medium mb-4">Límites de Frecuencia</h4>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-400 mb-2">
                              Máximo por minuto
                            </label>
                            <input
                              type="number"
                              min="1"
                              max="20"
                              value={settings.behavior.maxToastsPerMinute}
                              onChange={(e) => updateBehaviorSetting('maxToastsPerMinute', parseInt(e.target.value))}
                              className="w-full px-3 py-2 bg-surface-strong border border-border-subtle rounded-lg text-white text-sm"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-400 mb-2">
                              Máximo por 30 segundos
                            </label>
                            <input
                              type="number"
                              min="1"
                              max="10"
                              value={settings.behavior.maxToastsPer30Seconds}
                              onChange={(e) => updateBehaviorSetting('maxToastsPer30Seconds', parseInt(e.target.value))}
                              className="w-full px-3 py-2 bg-surface-strong border border-border-subtle rounded-lg text-white text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};