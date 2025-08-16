import React from 'react';
import { motion } from 'framer-motion';

/**
 * Componente seguro para texto animado con efectos cyber
 * Reemplaza la función formatCyberText insegura con un componente React
 * @param {Object} props - Props del componente
 * @param {string} props.text - Texto a animar
 * @param {number} props.delay - Delay base entre caracteres (default: 0.05)
 * @param {string} props.className - Clases CSS adicionales
 * @param {'cyber'|'modern'} props.variant - Variante del efecto
 */
export const AnimatedText = ({ text, delay = 0.05, className = '', variant = 'modern' }) => {
  if (!text || typeof text !== 'string') {
    return null;
  }

  const chars = text.split('');

  const variants = {
    cyber: {
      initial: { opacity: 0, y: 20, textShadow: '0 0 0px rgba(0, 246, 255, 0)' },
      animate: {
        opacity: 1,
        y: 0,
        textShadow: '0 0 8px rgba(0, 246, 255, 0.8)',
      },
    },
    modern: {
      initial: { opacity: 0, y: 10 },
      animate: { opacity: 1, y: 0 },
    },
  };

  return (
    <span className={`inline-block ${className}`}>
      {chars.map((char, index) => (
        <motion.span
          key={`${char}-${index}`}
          className='inline-block'
          variants={variants[variant]}
          initial='initial'
          animate='animate'
          transition={{
            duration: 0.3,
            delay: index * delay,
            ease: 'easeOut',
          }}
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </span>
  );
};

/**
 * Hook para delay escalonado seguro
 * Reemplaza la función staggerDelay
 * @param {number} index - Índice del elemento
 * @param {number} baseDelay - Delay base en segundos
 * @returns {number} Delay calculado
 */
export const useStaggerDelay = (index, baseDelay = 0.1) => {
  return React.useMemo(() => index * baseDelay, [index, baseDelay]);
};
