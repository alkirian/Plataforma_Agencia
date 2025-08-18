import { useState, useEffect } from 'react';

/**
 * Hook para detectar el tipo de dispositivo basado en el ancho de pantalla
 * @returns {'mobile' | 'tablet' | 'desktop'}
 */
export const useDeviceType = () => {
  const [deviceType, setDeviceType] = useState(() => {
    if (typeof window === 'undefined') return 'desktop';
    
    const width = window.innerWidth;
    if (width <= 640) return 'mobile';
    if (width <= 1024) return 'tablet';
    return 'desktop';
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      let newDeviceType;
      
      if (width <= 640) {
        newDeviceType = 'mobile';
      } else if (width <= 1024) {
        newDeviceType = 'tablet';
      } else {
        newDeviceType = 'desktop';
      }

      if (newDeviceType !== deviceType) {
        setDeviceType(newDeviceType);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [deviceType]);

  return deviceType;
};