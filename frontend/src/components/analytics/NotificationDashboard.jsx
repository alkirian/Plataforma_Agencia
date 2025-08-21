/**
 * Dashboard de Analytics de Notificaciones
 * Visualiza métricas, insights y patrones de uso
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiBell,
  FiTrendingUp,
  FiClock,
  FiUsers,
  FiSettings,
  FiDownload,
  FiRefreshCw,
  FiEye,
  FiMousePointer,
  FiX,
  FiPhone,
  FiTablet,
  FiMonitor
} from 'react-icons/fi';
import { notificationAnalytics } from '../../utils/notificationAnalytics';

export const NotificationDashboard = ({ isOpen, onClose }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    if (isOpen) {
      loadDashboardData();
    }
  }, [isOpen, selectedPeriod, selectedCategory]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Generar datos del dashboard
      const data = notificationAnalytics.generateDashboardData();
      const analysisInsights = notificationAnalytics.generateInsights();
      
      setDashboardData(data);
      setInsights(analysisInsights);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportData = () => {
    const exportData = notificationAnalytics.exportData();
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notification-analytics-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatPercentage = (value) => `${value.toFixed(1)}%`;
  const formatTime = (ms) => {
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  };

  if (!isOpen) return null;

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
          className="bg-surface-strong/95 backdrop-blur-md border border-gray-700/50 rounded-xl w-full max-w-6xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600/20 rounded-lg">
                <FiTrendingUp className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  Analytics de Notificaciones
                </h2>
                <p className="text-gray-400 text-sm">
                  Métricas de rendimiento y patrones de uso
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="bg-surface-strong border border-gray-600 rounded-lg px-3 py-2 text-sm text-white"
              >
                <option value="1d">Último día</option>
                <option value="7d">Última semana</option>
                <option value="30d">Último mes</option>
                <option value="all">Todo el tiempo</option>
              </select>

              <button
                onClick={loadDashboardData}
                className="p-2 text-gray-400 hover:text-white transition-colors"
                disabled={loading}
              >
                <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>

              <button
                onClick={exportData}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <FiDownload className="w-4 h-4" />
              </button>

              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center gap-3 text-gray-400">
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span>Cargando analytics...</span>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <OverviewCard
                    title="Total Notificaciones"
                    value={dashboardData?.overview.totalNotifications || 0}
                    icon={FiBell}
                    color="blue"
                  />
                  <OverviewCard
                    title="Interacciones"
                    value={dashboardData?.overview.totalInteractions || 0}
                    icon={FiMousePointer}
                    color="green"
                  />
                  <OverviewCard
                    title="Engagement"
                    value={formatPercentage(dashboardData?.overview.engagementRate || 0)}
                    icon={FiEye}
                    color="purple"
                  />
                  <OverviewCard
                    title="Tasa de Descarte"
                    value={formatPercentage(dashboardData?.overview.dismissalRate || 0)}
                    icon={FiX}
                    color="red"
                  />
                </div>

                {/* Insights */}
                {insights.length > 0 && (
                  <div className="bg-surface-strong/50 rounded-xl p-6 border border-gray-700/30">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <FiBell className="w-5 h-5" />
                      Insights Automáticos
                    </h3>
                    <div className="space-y-3">
                      {insights.map((insight, index) => (
                        <InsightCard key={index} insight={insight} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Category Breakdown */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-surface-strong/50 rounded-xl p-6 border border-gray-700/30">
                    <h3 className="text-lg font-semibold text-white mb-4">
                      Rendimiento por Categoría
                    </h3>
                    <div className="space-y-4">
                      {dashboardData?.byCategory.map((category) => (
                        <CategoryRow key={category.category} category={category} />
                      ))}
                    </div>
                  </div>

                  <div className="bg-surface-strong/50 rounded-xl p-6 border border-gray-700/30">
                    <h3 className="text-lg font-semibold text-white mb-4">
                      Distribución por Dispositivo
                    </h3>
                    <div className="space-y-4">
                      {Object.entries(dashboardData?.devices || {}).map(([device, percentage]) => (
                        <DeviceRow key={device} device={device} percentage={percentage} />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Time Patterns */}
                <div className="bg-surface-strong/50 rounded-xl p-6 border border-gray-700/30">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <FiClock className="w-5 h-5" />
                    Patrones Temporales
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-400">
                        {dashboardData?.timePatterns.mostActiveHour}:00
                      </div>
                      <div className="text-sm text-gray-400">Hora más activa</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400">
                        {dashboardData?.timePatterns.mostActiveDay}
                      </div>
                      <div className="text-sm text-gray-400">Día más activo</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-400">
                        {dashboardData?.batching.averageSize.toFixed(1)}
                      </div>
                      <div className="text-sm text-gray-400">Tamaño promedio de batch</div>
                    </div>
                  </div>

                  {/* Hourly Distribution Chart */}
                  <div className="mt-6">
                    <div className="text-sm font-medium text-gray-300 mb-3">
                      Distribución por hora
                    </div>
                    <div className="flex items-end gap-1 h-24">
                      {dashboardData?.timePatterns.hourlyDistribution.map((count, hour) => {
                        const maxCount = Math.max(...dashboardData.timePatterns.hourlyDistribution);
                        const height = maxCount > 0 ? (count / maxCount) * 100 : 0;
                        
                        return (
                          <div
                            key={hour}
                            className="flex-1 flex flex-col items-center group"
                          >
                            <div
                              className="w-full bg-blue-600/30 rounded-sm transition-all group-hover:bg-blue-600/50"
                              style={{ height: `${height}%` }}
                            />
                            <div className="text-xs text-gray-500 mt-1">
                              {hour.toString().padStart(2, '0')}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="bg-surface-strong/50 rounded-xl p-6 border border-gray-700/30">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Tiempo de Respuesta por Prioridad
                  </h3>
                  <div className="space-y-4">
                    {dashboardData?.performance.avgResponseTime.map((item) => (
                      <div key={item.priority} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`
                            w-3 h-3 rounded-full
                            ${item.priority === 'critical' ? 'bg-red-500' :
                              item.priority === 'high' ? 'bg-orange-500' :
                              item.priority === 'normal' ? 'bg-blue-500' : 'bg-gray-500'}
                          `} />
                          <span className="text-gray-300 capitalize">{item.priority}</span>
                        </div>
                        <span className="text-white font-medium">
                          {formatTime(item.avgTime)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const OverviewCard = ({ title, value, icon: Icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-600/20 text-blue-400 border-blue-500/30',
    green: 'bg-green-600/20 text-green-400 border-green-500/30',
    purple: 'bg-purple-600/20 text-purple-400 border-purple-500/30',
    red: 'bg-red-600/20 text-red-400 border-red-500/30'
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`
        p-4 rounded-xl border backdrop-blur-sm
        ${colorClasses[color]}
      `}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-bold text-white mb-1">{value}</div>
          <div className="text-sm text-gray-300">{title}</div>
        </div>
        <Icon className="w-8 h-8 opacity-60" />
      </div>
    </motion.div>
  );
};

const InsightCard = ({ insight }) => {
  const typeStyles = {
    success: 'border-green-500/30 bg-green-900/20',
    warning: 'border-orange-500/30 bg-orange-900/20',
    info: 'border-blue-500/30 bg-blue-900/20'
  };

  const typeIcons = {
    success: '✅',
    warning: '⚠️',
    info: 'ℹ️'
  };

  return (
    <div className={`p-4 rounded-lg border ${typeStyles[insight.type]}`}>
      <div className="flex items-start gap-3">
        <span className="text-lg">{typeIcons[insight.type]}</span>
        <div className="flex-1">
          <div className="font-medium text-white mb-1">{insight.title}</div>
          <div className="text-sm text-gray-300 mb-2">{insight.message}</div>
          {insight.suggestion && (
            <div className="text-xs text-gray-400 italic">
              💡 {insight.suggestion}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const CategoryRow = ({ category }) => {
  const engagementColor = category.engagementRate > 50 ? 'text-green-400' : 
                         category.engagementRate > 25 ? 'text-orange-400' : 'text-red-400';

  return (
    <div className="flex items-center justify-between p-3 bg-surface-strong/30 rounded-lg">
      <div className="flex items-center gap-3">
        <div className="text-sm font-medium text-white capitalize">
          {category.category}
        </div>
        <div className="text-xs text-gray-400">
          {category.shown} mostradas
        </div>
      </div>
      <div className="flex items-center gap-4 text-sm">
        <div className="text-gray-300">
          {category.clicked} clicks
        </div>
        <div className={`font-medium ${engagementColor}`}>
          {formatPercentage(category.engagementRate)}
        </div>
      </div>
    </div>
  );
};

const DeviceRow = ({ device, percentage }) => {
  const deviceIcons = {
    mobile: FiPhone,
    tablet: FiTablet,
    desktop: FiMonitor
  };

  const Icon = deviceIcons[device] || FiMonitor;

  return (
    <div className="flex items-center justify-between p-3 bg-surface-strong/30 rounded-lg">
      <div className="flex items-center gap-3">
        <Icon className="w-4 h-4 text-gray-400" />
        <span className="text-sm text-white capitalize">{device}</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="w-24 h-2 bg-gray-700 rounded-full">
          <div
            className="h-full bg-blue-500 rounded-full"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-sm text-gray-300 w-12 text-right">
          {formatPercentage(percentage)}
        </span>
      </div>
    </div>
  );
};

const formatPercentage = (value) => `${value.toFixed(1)}%`;