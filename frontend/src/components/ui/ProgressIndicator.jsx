import React from 'react';
import { motion } from 'framer-motion';

export const ProgressIndicator = ({ 
  percentage = 0, 
  total = 0, 
  completed = 0, 
  inProgress = 0, 
  pending = 0,
  size = 'md',
  showDetails = true 
}) => {
  const getColor = (percentage) => {
    if (percentage >= 80) return 'text-green-400';
    if (percentage >= 50) return 'text-gray-300';
    if (percentage >= 20) return 'text-orange-400';
    return 'text-gray-400';
  };

  const getBarColor = (percentage) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 50) return 'bg-gray-500';
    if (percentage >= 20) return 'bg-orange-500';
    return 'bg-gray-500';
  };

  const sizes = {
    sm: { bar: 'h-1', text: 'text-xs' },
    md: { bar: 'h-2', text: 'text-sm' },
    lg: { bar: 'h-3', text: 'text-base' },
  };

  if (total === 0) {
    return (
      <div className="flex items-center space-x-2">
        <div className="text-xs text-gray-500">Sin tareas</div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Barra de progreso */}
      <div className="flex items-center space-x-2">
        <div className="flex-1 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className={`${getBarColor(percentage)} ${sizes[size].bar} rounded-full`}
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
        <span className={`${getColor(percentage)} ${sizes[size].text} font-medium min-w-[3rem]`}>
          {percentage}%
        </span>
      </div>

      {/* Detalles */}
      {showDetails && (
        <div className="flex items-center space-x-3 text-xs">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-gray-400">{completed}</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
            <span className="text-gray-400">{inProgress}</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
            <span className="text-gray-400">{pending}</span>
          </div>
          <span className="text-gray-500">de {total}</span>
        </div>
      )}
    </div>
  );
};

export const ProgressBadge = ({ percentage = 0, total = 0 }) => {
  // Si no hay tareas, no renderizamos el badge (evita el span "Sin tareas")
  if (!total || total === 0) return null;

  const pct = Math.round(Math.max(0, Math.min(100, percentage || 0)));
  const color = pct >= 90 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-blue-500';
  return (
    <div className="inline-flex items-center gap-2">
      <div className={`h-2 w-12 rounded-full ${color}`} style={{ opacity: 0.95 }} />
      <div className="text-xs font-medium text-text-primary">{pct}%</div>
    </div>
  );
};