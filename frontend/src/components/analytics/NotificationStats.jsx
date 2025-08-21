/**
 * Widget compacto de estadísticas de notificaciones
 * Para mostrar métricas clave en tiempo real
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FiBell, 
  FiTrendingUp, 
  FiEye, 
  FiClock,
  FiBarChart2
} from 'react-icons/fi';
import { notificationAnalytics } from '../../utils/notificationAnalytics';
import { NotificationDashboard } from './NotificationDashboard';

export const NotificationStats = ({ className = '' }) => {
  const [stats, setStats] = useState(null);
  const [showDashboard, setShowDashboard] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const updateStats = () => {
      const data = notificationAnalytics.generateDashboardData();
      setStats(data);
    };

    // Actualizar al montar
    updateStats();

    // Actualizar cada 30 segundos
    const interval = setInterval(updateStats, 30000);

    // Escuchar eventos de notificaciones para actualizar en tiempo real
    const handleNotificationEvent = () => {
      setTimeout(updateStats, 100); // Pequeño delay para que se procese el evento
    };

    window.addEventListener('notification:shown', handleNotificationEvent);
    window.addEventListener('notification:action', handleNotificationEvent);
    window.addEventListener('notification:dismissed', handleNotificationEvent);

    return () => {
      clearInterval(interval);
      window.removeEventListener('notification:shown', handleNotificationEvent);
      window.removeEventListener('notification:action', handleNotificationEvent);
      window.removeEventListener('notification:dismissed', handleNotificationEvent);
    };
  }, []);

  if (!stats) return null;

  const formatPercentage = (value) => `${value.toFixed(1)}%`;

  return (
    <>
      <motion.div 
        className={`bg-surface-strong/80 backdrop-blur-md border border-gray-700/50 rounded-xl ${className}`}
        whileHover={{ scale: 1.02 }}
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-600/20 rounded-lg">
                <FiBell className="w-4 h-4 text-blue-400" />
              </div>
              <span className="text-sm font-medium text-white">
                Notificaciones
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1 text-gray-400 hover:text-white transition-colors rounded"
              >
                <FiBarChart2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowDashboard(true)}
                className="p-1 text-gray-400 hover:text-white transition-colors rounded"
              >
                <FiTrendingUp className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Stats compactas */}
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center">
              <div className="text-lg font-bold text-white">
                {stats.overview.totalNotifications}
              </div>
              <div className="text-xs text-gray-400">Total</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-400">
                {formatPercentage(stats.overview.engagementRate)}
              </div>
              <div className="text-xs text-gray-400">Engagement</div>
            </div>
          </div>

          {/* Stats expandidas */}
          <motion.div
            initial={false}
            animate={{ height: isExpanded ? 'auto' : 0, opacity: isExpanded ? 1 : 0 }}
            className="overflow-hidden"
          >
            <div className="pt-3 mt-3 border-t border-gray-700/50 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Interacciones</span>
                <span className="text-white">{stats.overview.totalInteractions}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Tasa descarte</span>
                <span className="text-red-400">
                  {formatPercentage(stats.overview.dismissalRate)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Hora más activa</span>
                <span className="text-blue-400">
                  {stats.timePatterns.mostActiveHour}:00
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Batches creados</span>
                <span className="text-purple-400">
                  {stats.batching.totalBatches}
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Dashboard modal */}
      <NotificationDashboard
        isOpen={showDashboard}
        onClose={() => setShowDashboard(false)}
      />
    </>
  );
};

/**
 * Badge simple para mostrar engagement rate
 */
export const EngagementBadge = ({ className = '' }) => {
  const [engagementRate, setEngagementRate] = useState(0);

  useEffect(() => {
    const updateEngagement = () => {
      const rate = notificationAnalytics.getEngagementRate();
      setEngagementRate(rate);
    };

    updateEngagement();
    
    const interval = setInterval(updateEngagement, 30000);
    
    const handleNotificationEvent = () => {
      setTimeout(updateEngagement, 100);
    };

    window.addEventListener('notification:action', handleNotificationEvent);
    window.addEventListener('notification:shown', handleNotificationEvent);

    return () => {
      clearInterval(interval);
      window.removeEventListener('notification:action', handleNotificationEvent);
      window.removeEventListener('notification:shown', handleNotificationEvent);
    };
  }, []);

  const getEngagementColor = (rate) => {
    if (rate >= 60) return 'text-green-400';
    if (rate >= 30) return 'text-orange-400';
    return 'text-red-400';
  };

  return (
    <div className={`inline-flex items-center gap-2 px-2 py-1 rounded-lg bg-surface-strong/50 ${className}`}>
      <FiEye className="w-3 h-3 text-gray-400" />
      <span className={`text-xs font-medium ${getEngagementColor(engagementRate)}`}>
        {engagementRate.toFixed(1)}%
      </span>
    </div>
  );
};

/**
 * Indicador de modo actual
 */
export const NotificationModeIndicator = ({ className = '' }) => {
  const [mode, setMode] = useState('normal');

  useEffect(() => {
    // Detectar modo actual desde settings
    const checkMode = () => {
      const settings = JSON.parse(localStorage.getItem('notification-settings') || '{}');
      if (settings.behavior?.busyModeEnabled) {
        setMode('busy');
      } else if (settings.behavior?.focusModeEnabled) {
        setMode('focus');
      } else {
        setMode('normal');
      }
    };

    checkMode();

    // Escuchar cambios de configuración
    window.addEventListener('notification-settings-updated', checkMode);
    window.addEventListener('notification-mode-changed', (e) => {
      setMode(e.detail.mode);
    });

    return () => {
      window.removeEventListener('notification-settings-updated', checkMode);
      window.removeEventListener('notification-mode-changed', checkMode);
    };
  }, []);

  const modeConfig = {
    normal: { icon: '🔔', color: 'text-green-400', label: 'Normal' },
    busy: { icon: '🔕', color: 'text-red-400', label: 'Ocupado' },
    focus: { icon: '🎯', color: 'text-orange-400', label: 'Concentración' }
  };

  const config = modeConfig[mode];

  return (
    <div className={`inline-flex items-center gap-2 px-2 py-1 rounded-lg bg-surface-strong/50 ${className}`}>
      <span className="text-xs">{config.icon}</span>
      <span className={`text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    </div>
  );
};