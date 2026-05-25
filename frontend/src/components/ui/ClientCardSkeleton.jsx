import React from 'react';

/**
 * Esqueleto de carga premium con efecto shimmer animado
 * Simula de forma idéntica la estructura de una tarjeta de cliente en el Dashboard
 */
export const ClientCardSkeleton = () => {
  return (
    <div className="card-cyber rounded-xl p-6 relative overflow-hidden bg-surface-soft/40 border border-border-subtle animate-pulse select-none">
      {/* Efecto Shimmer de barrido de luz */}
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/5 to-transparent" />

      {/* Header del Skeleton */}
      <div className="mb-4 flex items-center justify-between">
        {/* Etiqueta 'Cliente' */}
        <div className="h-3 w-12 rounded bg-white/10" />
        
        {/* Badge de Progreso Circular */}
        <div className="h-6 w-16 rounded-full bg-white/10" />
      </div>

      {/* Nombre del Cliente */}
      <div className="h-6 w-3/4 rounded bg-white/15 mb-2" />

      {/* Industria / Categoría */}
      <div className="h-4 w-1/2 rounded bg-white/10 mb-4" />

      {/* Estadísticas de Tareas rápidas */}
      <div className="flex items-center justify-between pt-1 border-t border-border-subtle/30">
        {/* Grupos de conteo ✓ ⟳ ◯ */}
        <div className="flex space-x-3">
          <div className="h-3 w-8 rounded bg-white/10" />
          <div className="h-3 w-8 rounded bg-white/10" />
          <div className="h-3 w-8 rounded bg-white/10" />
        </div>
        {/* Total de tareas */}
        <div className="h-3 w-12 rounded bg-white/10" />
      </div>
    </div>
  );
};
