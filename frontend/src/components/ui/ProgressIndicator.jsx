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
    if (percentage >= 50) return 'text-blue-400';
    if (percentage >= 20) return 'text-orange-400';
    return 'text-gray-400';
  };

  const getBarColor = (percentage) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 50) return 'bg-blue-500';
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
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
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
  const getColor = (percentage) => {
    if (percentage >= 80) return 'bg-green-500/20 text-green-400 border-green-500/30';
    if (percentage >= 50) return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    if (percentage >= 20) return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  if (total === 0) {
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium 
                       bg-gray-500/20 text-gray-400 border border-gray-500/30">
        Sin tareas
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getColor(percentage)}`}>
      {percentage}% completado
    </span>
  );
};