/**
 * Panel de configuración avanzada de notificaciones
 * Configuración granular por categoría y comportamiento inteligente
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiSettings,
  FiBell,
  FiVolume2,
  FiVolumeX,
  FiToggleLeft,
  FiToggleRight,
  FiClock,
  FiSmartphone,
  FiMonitor,
  FiZap,
  FiTarget,
  FiMoon,
  FiRefreshCw,
  FiPlay,
  FiX,
  FiSave,
  FiRotateCcw
} from 'react-icons/fi';
import { useNotificationSettings } from '../../hooks/useNotificationSettings';
import { NotificationDashboard } from '../analytics/NotificationDashboard';

export const NotificationSettings = ({ isOpen, onClose }) => {
  const {
    settings,
    loading,
    updateCategorySetting,
    updateBehaviorSetting,
    updateGlobalSetting,
    resetToDefaults,
    testNotification,
    enableBusyMode,
    enableFocusMode,
    disableContextModes,
    currentMode
  } = useNotificationSettings();

  const [activeTab, setActiveTab] = useState('categories');
  const [showDashboard, setShowDashboard] = useState(false);

  if (!isOpen) return null;

  const tabs = [
    { id: 'categories', label: 'Categorías', icon: FiBell },
    { id: 'behavior', label: 'Comportamiento', icon: FiZap },
    { id: 'schedule', label: 'Horarios', icon: FiClock },
    { id: 'device', label: 'Dispositivo', icon: FiSmartphone },
    { id: 'advanced', label: 'Avanzado', icon: FiSettings }
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-surface-strong/95 backdrop-blur-md border border-gray-700/50 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600/20 rounded-lg">
                <FiSettings className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  Configuración de Notificaciones
                </h2>
                <p className="text-gray-400 text-sm">
                  Personaliza tu experiencia de notificaciones
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Modo actual */}
              <div className="flex items-center gap-2 px-3 py-2 bg-surface-strong/50 rounded-lg">
                <span className="text-sm text-gray-400">Modo:</span>
                <span className={`text-sm font-medium ${
                  currentMode === 'busy' ? 'text-red-400' :
                  currentMode === 'focus' ? 'text-orange-400' : 'text-green-400'
                }`}>
                  {currentMode === 'busy' ? '🔕 Ocupado' :
                   currentMode === 'focus' ? '🎯 Concentración' : '🔔 Normal'}
                </span>
              </div>

              <button
                onClick={() => setShowDashboard(true)}
                className="px-3 py-2 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition-colors text-sm"
              >
                Ver Analytics
              </button>

              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex h-[calc(90vh-120px)]">
            {/* Sidebar */}
            <div className="w-64 border-r border-gray-700/50 p-4">
              <div className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`
                        w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors
                        ${activeTab === tab.id 
                          ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' 
                          : 'text-gray-400 hover:text-white hover:bg-surface-strong/50'
                        }
                      `}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm">{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Quick Actions */}
              <div className="mt-6 pt-6 border-t border-gray-700/50 space-y-2">
                <div className="text-xs font-medium text-gray-400 mb-3">MODOS RÁPIDOS</div>
                
                <button
                  onClick={disableContextModes}
                  disabled={currentMode === 'normal'}
                  className={`
                    w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-colors
                    ${currentMode === 'normal' ? 'bg-green-600/20 text-green-400' : 'text-gray-400 hover:text-white hover:bg-surface-strong/50'}
                  `}
                >
                  🔔 Modo Normal
                </button>

                <button
                  onClick={enableFocusMode}
                  disabled={currentMode === 'focus'}
                  className={`
                    w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-colors
                    ${currentMode === 'focus' ? 'bg-orange-600/20 text-orange-400' : 'text-gray-400 hover:text-white hover:bg-surface-strong/50'}
                  `}
                >
                  🎯 Concentración
                </button>

                <button
                  onClick={enableBusyMode}
                  disabled={currentMode === 'busy'}
                  className={`
                    w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-colors
                    ${currentMode === 'busy' ? 'bg-red-600/20 text-red-400' : 'text-gray-400 hover:text-white hover:bg-surface-strong/50'}
                  `}
                >
                  🔕 Ocupado
                </button>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-700/50">
                <button
                  onClick={resetToDefaults}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm text-gray-400 hover:text-white hover:bg-surface-strong/50 transition-colors"
                >
                  <FiRotateCcw className="w-4 h-4" />
                  Restaurar por defecto
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="flex items-center gap-3 text-gray-400">
                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span>Cargando configuración...</span>
                  </div>
                </div>
              ) : (
                <>
                  {activeTab === 'categories' && (
                    <CategoriesTab
                      settings={settings}
                      onUpdateSetting={updateCategorySetting}
                      onTest={testNotification}
                    />
                  )}
                  {activeTab === 'behavior' && (
                    <BehaviorTab
                      settings={settings}
                      onUpdateSetting={updateBehaviorSetting}
                    />
                  )}
                  {activeTab === 'schedule' && (
                    <ScheduleTab
                      settings={settings}
                      onUpdateGlobal={updateGlobalSetting}
                    />
                  )}
                  {activeTab === 'device' && (
                    <DeviceTab
                      settings={settings}
                      onUpdateGlobal={updateGlobalSetting}
                    />
                  )}
                  {activeTab === 'advanced' && (
                    <AdvancedTab
                      settings={settings}
                      onUpdateGlobal={updateGlobalSetting}
                      onUpdateBehavior={updateBehaviorSetting}
                    />
                  )}
                </>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Dashboard modal */}
      <NotificationDashboard
        isOpen={showDashboard}
        onClose={() => setShowDashboard(false)}
      />
    </AnimatePresence>
  );
};

const CategoriesTab = ({ settings, onUpdateSetting, onTest }) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-2">Configuración por Categoría</h3>
        <p className="text-gray-400 text-sm">
          Personaliza el comportamiento de cada tipo de notificación
        </p>
      </div>

      <div className="space-y-4">
        {Object.entries(settings.categories).map(([category, config]) => (
          <CategoryCard
            key={category}
            category={category}
            config={config}
            onUpdate={(key, value) => onUpdateSetting(category, key, value)}
            onTest={() => onTest(category)}
          />
        ))}
      </div>
    </div>
  );
};

const CategoryCard = ({ category, config, onUpdate, onTest }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const categoryLabels = {
    auth: 'Autenticación',
    client: 'Clientes', 
    task: 'Tareas',
    ai: 'Asistente IA',
    document: 'Documentos',
    system: 'Sistema'
  };

  const categoryIcons = {
    auth: '🔐',
    client: '👤',
    task: '📋',
    ai: '🤖',
    document: '📄',
    system: '⚙️'
  };

  return (
    <div className="bg-surface-strong/30 rounded-xl border border-gray-700/30 overflow-hidden">
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">{categoryIcons[category]}</span>
            <div>
              <div className="font-medium text-white">
                {categoryLabels[category]}
              </div>
              <div className="text-sm text-gray-400">
                {config.enabled ? 'Habilitado' : 'Deshabilitado'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onTest}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <FiPlay className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => onUpdate('enabled', !config.enabled)}
              className="p-2"
            >
              {config.enabled ? (
                <FiToggleRight className="w-6 h-6 text-green-400" />
              ) : (
                <FiToggleLeft className="w-6 h-6 text-gray-400" />
              )}
            </button>

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <FiSettings className="w-4 h-4" />
            </button>
          </div>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-4 mt-4 border-t border-gray-700/50 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ToggleField
                    label="Toast habilitado"
                    value={config.toastEnabled}
                    onChange={(value) => onUpdate('toastEnabled', value)}
                  />
                  <ToggleField
                    label="Panel habilitado"
                    value={config.panelEnabled}
                    onChange={(value) => onUpdate('panelEnabled', value)}
                  />
                  <ToggleField
                    label="Sonido habilitado"
                    value={config.soundEnabled}
                    onChange={(value) => onUpdate('soundEnabled', value)}
                  />
                  <ToggleField
                    label="Cerrar automáticamente"
                    value={config.autoClose}
                    onChange={(value) => onUpdate('autoClose', value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SelectField
                    label="Prioridad"
                    value={config.priority}
                    options={[
                      { value: 'low', label: 'Baja' },
                      { value: 'normal', label: 'Normal' },
                      { value: 'high', label: 'Alta' },
                      { value: 'critical', label: 'Crítica' }
                    ]}
                    onChange={(value) => onUpdate('priority', value)}
                  />

                  <NumberField
                    label="Duración (ms)"
                    value={config.duration}
                    onChange={(value) => onUpdate('duration', value)}
                    min={1000}
                    max={10000}
                    step={500}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const BehaviorTab = ({ settings, onUpdateSetting }) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-2">Comportamiento Inteligente</h3>
        <p className="text-gray-400 text-sm">
          Configura cómo se agrupan y muestran las notificaciones
        </p>
      </div>

      <div className="space-y-6">
        {/* Rate Limiting */}
        <section className="bg-surface-strong/30 rounded-xl p-6 border border-gray-700/30">
          <h4 className="font-medium text-white mb-4">Control de Frecuencia</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <NumberField
              label="Máximo por minuto"
              value={settings.behavior.maxToastsPerMinute}
              onChange={(value) => onUpdateSetting('maxToastsPerMinute', value)}
              min={1}
              max={20}
            />
            <NumberField
              label="Máximo por 30 segundos"
              value={settings.behavior.maxToastsPer30Seconds}
              onChange={(value) => onUpdateSetting('maxToastsPer30Seconds', value)}
              min={1}
              max={10}
            />
          </div>
        </section>

        {/* Batching */}
        <section className="bg-surface-strong/30 rounded-xl p-6 border border-gray-700/30">
          <h4 className="font-medium text-white mb-4">Agrupación Inteligente</h4>
          <div className="space-y-4">
            <ToggleField
              label="Agrupar notificaciones similares"
              description="Combina notificaciones del mismo tipo para reducir ruido"
              value={settings.behavior.batchSimilar}
              onChange={(value) => onUpdateSetting('batchSimilar', value)}
            />
            <ToggleField
              label="Posicionamiento inteligente"
              description="Posiciona toasts evitando conflictos con la UI"
              value={settings.behavior.smartPositioning}
              onChange={(value) => onUpdateSetting('smartPositioning', value)}
            />
            <ToggleField
              label="Aprendizaje habilitado"
              description="El sistema aprende de tus patrones de uso"
              value={settings.behavior.learningEnabled}
              onChange={(value) => onUpdateSetting('learningEnabled', value)}
            />
          </div>
        </section>
      </div>
    </div>
  );
};

const ScheduleTab = ({ settings, onUpdateGlobal }) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-2">Horarios y Contexto</h3>
        <p className="text-gray-400 text-sm">
          Configura cuándo y cómo recibir notificaciones
        </p>
      </div>

      <section className="bg-surface-strong/30 rounded-xl p-6 border border-gray-700/30">
        <h4 className="font-medium text-white mb-4 flex items-center gap-2">
          <FiMoon className="w-4 h-4" />
          Horas Silenciosas
        </h4>
        
        <div className="space-y-4">
          <ToggleField
            label="Habilitar horas silenciosas"
            description="Reduce las notificaciones en horarios específicos"
            value={settings.quietHours.enabled}
            onChange={(value) => onUpdateGlobal('quietHours', { ...settings.quietHours, enabled: value })}
          />

          {settings.quietHours.enabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
              <TimeField
                label="Hora de inicio"
                value={settings.quietHours.start}
                onChange={(value) => onUpdateGlobal('quietHours', { ...settings.quietHours, start: value })}
              />
              <TimeField
                label="Hora de fin"
                value={settings.quietHours.end}
                onChange={(value) => onUpdateGlobal('quietHours', { ...settings.quietHours, end: value })}
              />
              <ToggleField
                label="Solo fines de semana"
                value={settings.quietHours.weekendsOnly}
                onChange={(value) => onUpdateGlobal('quietHours', { ...settings.quietHours, weekendsOnly: value })}
              />
              <ToggleField
                label="Permitir críticas"
                value={settings.quietHours.allowCritical}
                onChange={(value) => onUpdateGlobal('quietHours', { ...settings.quietHours, allowCritical: value })}
              />
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

const DeviceTab = ({ settings, onUpdateGlobal }) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-2">Configuración del Dispositivo</h3>
        <p className="text-gray-400 text-sm">
          Optimiza la experiencia para tu dispositivo específico
        </p>
      </div>

      <div className="space-y-6">
        <section className="bg-surface-strong/30 rounded-xl p-6 border border-gray-700/30">
          <h4 className="font-medium text-white mb-4">Accesibilidad</h4>
          <div className="space-y-4">
            <ToggleField
              label="Reducir movimiento"
              description="Usa animaciones más sutiles"
              value={settings.device.reduceMotion}
              onChange={(value) => onUpdateGlobal('device', { ...settings.device, reduceMotion: value })}
            />
            <ToggleField
              label="Alto contraste"
              description="Mejora la visibilidad de las notificaciones"
              value={settings.device.highContrast}
              onChange={(value) => onUpdateGlobal('device', { ...settings.device, highContrast: value })}
            />
            <ToggleField
              label="Modo compacto"
              description="Reduce el tamaño de las notificaciones"
              value={settings.device.compactMode}
              onChange={(value) => onUpdateGlobal('device', { ...settings.device, compactMode: value })}
            />
          </div>
        </section>

        <section className="bg-surface-strong/30 rounded-xl p-6 border border-gray-700/30">
          <h4 className="font-medium text-white mb-4">Móvil</h4>
          <div className="space-y-4">
            <ToggleField
              label="Optimización móvil"
              description="Adapta automáticamente para dispositivos móviles"
              value={settings.device.mobileOptimized}
              onChange={(value) => onUpdateGlobal('device', { ...settings.device, mobileOptimized: value })}
            />
            <ToggleField
              label="Vibración"
              description="Vibrar con notificaciones importantes"
              value={settings.device.vibration}
              onChange={(value) => onUpdateGlobal('device', { ...settings.device, vibration: value })}
            />
          </div>
        </section>
      </div>
    </div>
  );
};

const AdvancedTab = ({ settings, onUpdateGlobal, onUpdateBehavior }) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-2">Configuración Avanzada</h3>
        <p className="text-gray-400 text-sm">
          Funciones experimentales y configuraciones avanzadas
        </p>
      </div>

      <section className="bg-surface-strong/30 rounded-xl p-6 border border-gray-700/30">
        <h4 className="font-medium text-white mb-4">Características Experimentales</h4>
        <div className="space-y-4">
          <ToggleField
            label="Notificaciones predictivas"
            description="Anticipa notificaciones basándose en patrones"
            value={settings.experimental.predictiveNotifications}
            onChange={(value) => onUpdateGlobal('experimental', { ...settings.experimental, predictiveNotifications: value })}
          />
          <ToggleField
            label="Consciencia contextual"
            description="Adapta notificaciones según el contexto actual"
            value={settings.experimental.contextAwareness}
            onChange={(value) => onUpdateGlobal('experimental', { ...settings.experimental, contextAwareness: value })}
          />
          <ToggleField
            label="Batching con ML"
            description="Usa machine learning para agrupar notificaciones"
            value={settings.experimental.mlBatching}
            onChange={(value) => onUpdateGlobal('experimental', { ...settings.experimental, mlBatching: value })}
          />
        </div>
      </section>

      <section className="bg-surface-strong/30 rounded-xl p-6 border border-gray-700/30">
        <h4 className="font-medium text-white mb-4">Sonidos</h4>
        <div className="space-y-4">
          <ToggleField
            label="Sonidos habilitados"
            value={settings.sounds.enabled}
            onChange={(value) => onUpdateGlobal('sounds', { ...settings.sounds, enabled: value })}
          />
          
          {settings.sounds.enabled && (
            <div className="pl-6 space-y-4">
              <RangeField
                label="Volumen"
                value={settings.sounds.volume}
                onChange={(value) => onUpdateGlobal('sounds', { ...settings.sounds, volume: value })}
                min={0}
                max={1}
                step={0.1}
              />
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

// Helper Components
const ToggleField = ({ label, description, value, onChange }) => (
  <div className="flex items-start justify-between">
    <div className="flex-1">
      <div className="text-sm font-medium text-white">{label}</div>
      {description && (
        <div className="text-xs text-gray-400 mt-1">{description}</div>
      )}
    </div>
    <button
      onClick={() => onChange(!value)}
      className="flex-shrink-0 ml-3"
    >
      {value ? (
        <FiToggleRight className="w-6 h-6 text-green-400" />
      ) : (
        <FiToggleLeft className="w-6 h-6 text-gray-400" />
      )}
    </button>
  </div>
);

const NumberField = ({ label, value, onChange, min, max, step = 1 }) => (
  <div>
    <label className="block text-sm font-medium text-white mb-2">
      {label}
    </label>
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(parseInt(e.target.value))}
      min={min}
      max={max}
      step={step}
      className="w-full bg-surface-strong border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
    />
  </div>
);

const SelectField = ({ label, value, options, onChange }) => (
  <div>
    <label className="block text-sm font-medium text-white mb-2">
      {label}
    </label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-surface-strong border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </div>
);

const TimeField = ({ label, value, onChange }) => (
  <div>
    <label className="block text-sm font-medium text-white mb-2">
      {label}
    </label>
    <input
      type="time"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-surface-strong border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
    />
  </div>
);

const RangeField = ({ label, value, onChange, min, max, step }) => (
  <div>
    <label className="block text-sm font-medium text-white mb-2">
      {label}: {Math.round(value * 100)}%
    </label>
    <input
      type="range"
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      min={min}
      max={max}
      step={step}
      className="w-full"
    />
  </div>
);