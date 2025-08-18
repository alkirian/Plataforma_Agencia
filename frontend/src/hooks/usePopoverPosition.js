import { useState, useEffect, useCallback } from 'react';

/**
 * Hook para calcular la posición óptima del popover
 * Evita que se salga del viewport y ajusta automáticamente
 */
export const usePopoverPosition = (clickCoords, popoverDimensions = { width: 320, height: 420 }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);

  const calculatePosition = useCallback(() => {
    if (!clickCoords) return { x: 0, y: 0 };

    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };

    const { x: clickX, y: clickY } = clickCoords;
    const { width: popoverWidth, height: popoverHeight } = popoverDimensions;

    // Margen de seguridad
    const margin = 20;

    // ========== CÁLCULO HORIZONTAL ==========
    // Posición inicial preferida: ligeramente a la derecha del click
    let x = clickX + 10;

    // Ajustar si se sale por la derecha
    if (x + popoverWidth > viewport.width - margin) {
      x = clickX - popoverWidth - 10;
    }

    // Ajustar si se sale por la izquierda
    if (x < margin) {
      x = margin;
    }

    // ========== CÁLCULO VERTICAL - LÓGICA MEJORADA ==========
    const spaceBelow = viewport.height - clickY - margin;
    const spaceAbove = clickY - margin;
    
    let y;

    // Estrategia: Si cabe abajo del click, ponerlo ahí. Si no, evaluar mejor opción.
    if (spaceBelow >= popoverHeight) {
      // Cabe perfectamente abajo del click
      y = clickY + 10;
    } else if (spaceAbove >= popoverHeight) {
      // No cabe abajo, pero sí arriba
      y = clickY - popoverHeight - 10;
    } else {
      // No cabe completo ni arriba ni abajo - elegir el lado con más espacio
      if (spaceAbove > spaceBelow) {
        // Más espacio arriba - alinear con el top del viewport
        y = margin;
      } else {
        // Más espacio abajo - alinear con el bottom del viewport
        y = viewport.height - popoverHeight - margin;
      }
    }

    // Asegurar que no se salga del viewport (double-check)
    x = Math.max(margin, Math.min(x, viewport.width - popoverWidth - margin));
    y = Math.max(margin, Math.min(y, viewport.height - popoverHeight - margin));
    
    // Debug info mejorado
    if (process.env.NODE_ENV === 'development') {
      console.log('PopoverPosition Debug:', {
        clickCoords: { x: clickX, y: clickY },
        viewport: { width: viewport.width, height: viewport.height },
        popoverDimensions,
        spaces: { above: spaceAbove, below: spaceBelow },
        fitsBelow: spaceBelow >= popoverHeight,
        fitsAbove: spaceAbove >= popoverHeight,
        strategy: spaceBelow >= popoverHeight ? 'below' : spaceAbove >= popoverHeight ? 'above' : 'best-fit',
        calculatedPosition: { x, y }
      });
    }

    return { x, y };
  }, [clickCoords, popoverDimensions.width, popoverDimensions.height]);

  // Recalcular posición cuando cambian las coordenadas
  useEffect(() => {
    if (clickCoords) {
      const newPosition = calculatePosition();
      setPosition(newPosition);
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [clickCoords, calculatePosition]);

  // Recalcular en resize
  useEffect(() => {
    const handleResize = () => {
      if (clickCoords) {
        const newPosition = calculatePosition();
        setPosition(newPosition);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [calculatePosition, clickCoords]);

  return {
    position,
    isVisible
  };
};