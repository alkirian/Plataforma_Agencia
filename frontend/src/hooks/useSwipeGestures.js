import { useEffect, useRef } from 'react';

/**
 * Hook para manejar gestos de swipe en dispositivos táctiles
 * @param {Object} options - Configuración de los gestos
 * @returns {Object} - Ref del elemento y handlers
 */
export const useSwipeGestures = (options = {}) => {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    threshold = 50,
    preventDefaultTouchmoveEvent = false,
    onTouchStart,
    onTouchMove,
    onTouchEnd
  } = options;

  const elementRef = useRef(null);
  const startPos = useRef({ x: 0, y: 0 });
  const isTracking = useRef(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleTouchStart = (e) => {
      const touch = e.touches[0];
      startPos.current = { x: touch.clientX, y: touch.clientY };
      isTracking.current = true;
      
      onTouchStart?.(e);
    };

    const handleTouchMove = (e) => {
      if (preventDefaultTouchmoveEvent) {
        e.preventDefault();
      }
      
      if (!isTracking.current) return;
      
      onTouchMove?.(e);
    };

    const handleTouchEnd = (e) => {
      if (!isTracking.current) return;
      
      isTracking.current = false;
      const touch = e.changedTouches[0];
      const endPos = { x: touch.clientX, y: touch.clientY };
      
      const deltaX = endPos.x - startPos.current.x;
      const deltaY = endPos.y - startPos.current.y;
      
      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);
      
      // Determinar dirección del swipe
      if (Math.max(absDeltaX, absDeltaY) > threshold) {
        if (absDeltaX > absDeltaY) {
          // Swipe horizontal
          if (deltaX > 0) {
            onSwipeRight?.(e, { deltaX, deltaY });
          } else {
            onSwipeLeft?.(e, { deltaX, deltaY });
          }
        } else {
          // Swipe vertical
          if (deltaY > 0) {
            onSwipeDown?.(e, { deltaX, deltaY });
          } else {
            onSwipeUp?.(e, { deltaX, deltaY });
          }
        }
      }
      
      onTouchEnd?.(e);
    };

    // Agregar event listeners
    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: !preventDefaultTouchmoveEvent });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    // Cleanup
    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    threshold,
    preventDefaultTouchmoveEvent,
    onTouchStart,
    onTouchMove,
    onTouchEnd
  ]);

  return {
    ref: elementRef
  };
};

/**
 * Hook especializado para navegación de calendario con swipe
 */
export const useCalendarSwipe = ({ onPrevious, onNext }) => {
  return useSwipeGestures({
    onSwipeLeft: () => {
      onNext?.();
    },
    onSwipeRight: () => {
      onPrevious?.();
    },
    threshold: 75, // Mayor threshold para evitar swipes accidentales
  });
};

/**
 * Hook para pull-to-refresh
 */
export const usePullToRefresh = ({ onRefresh, threshold = 80 }) => {
  const isRefreshing = useRef(false);
  const startY = useRef(0);
  const currentY = useRef(0);

  return useSwipeGestures({
    onTouchStart: (e) => {
      const touch = e.touches[0];
      startY.current = touch.clientY;
      currentY.current = touch.clientY;
    },
    onTouchMove: (e) => {
      const touch = e.touches[0];
      currentY.current = touch.clientY;
      
      const deltaY = currentY.current - startY.current;
      
      // Solo permitir pull-to-refresh si estamos en la parte superior
      if (window.scrollY === 0 && deltaY > 0) {
        const element = e.currentTarget;
        const pullDistance = Math.min(deltaY, threshold * 1.5);
        
        // Aplicar transformación visual
        element.style.transform = `translateY(${pullDistance * 0.3}px)`;
        element.style.transition = 'none';
        
        // Cambiar opacidad basado en la distancia
        const opacity = Math.min(pullDistance / threshold, 1);
        element.style.opacity = 0.7 + (0.3 * opacity);
      }
    },
    onTouchEnd: (e) => {
      const element = e.currentTarget;
      const deltaY = currentY.current - startY.current;
      
      // Resetear estilos
      element.style.transform = '';
      element.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out';
      element.style.opacity = '';
      
      // Activar refresh si se alcanzó el threshold
      if (deltaY > threshold && window.scrollY === 0 && !isRefreshing.current) {
        isRefreshing.current = true;
        onRefresh?.().finally(() => {
          isRefreshing.current = false;
        });
      }
    },
    preventDefaultTouchmoveEvent: false
  });
};

/**
 * Hook para gestos de slide en listas/carousels
 */
export const useSlideGestures = ({ onSlideNext, onSlidePrev, sensitivity = 0.3 }) => {
  return useSwipeGestures({
    onSwipeLeft: (e, { deltaX }) => {
      if (Math.abs(deltaX) > 50) {
        onSlideNext?.();
      }
    },
    onSwipeRight: (e, { deltaX }) => {
      if (Math.abs(deltaX) > 50) {
        onSlidePrev?.();
      }
    },
    threshold: 30
  });
};