import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

export const LoadingSpinner = ({ 
  size = 'md', 
  variant = 'primary',
  className,
  label = 'Cargando...'
}) => {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6', 
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
  };

  const variants = {
    primary: 'border-[var(--color-accent-blue)] border-t-transparent',
    secondary: 'border-text-muted border-t-transparent',
    white: 'border-white border-t-transparent'
  };

  return (
    <div className="flex items-center justify-center" role="status" aria-live="polite">
      <motion.div
        className={cn(
          'rounded-full border-2 animate-spin',
          sizes[size],
          variants[variant],
          className
        )}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        aria-hidden="true"
      />
      <span className="sr-only">{label}</span>
    </div>
  );
};

export const LoadingCard = ({ 
  title = 'Cargando...', 
  description,
  className 
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={cn(
      'card rounded-xl p-6 text-center space-y-4',
      className
    )}
  >
    <LoadingSpinner size="lg" />
    <div>
      <h3 className="text-lg font-medium text-text-primary">{title}</h3>
      {description && (
        <p className="text-sm text-text-muted mt-1">{description}</p>
      )}
    </div>
  </motion.div>
);

export const LoadingPage = ({ 
  title = 'Cargando página...', 
  description = 'Por favor espera mientras cargamos el contenido.'
}) => (
  <div className="min-h-screen flex items-center justify-center p-6">
    <LoadingCard title={title} description={description} />
  </div>
);

export const LoadingOverlay = ({ isVisible, children, label = 'Cargando...' }) => (
  <div className="relative">
    {children}
    {isVisible && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
  className="absolute inset-0 bg-black/30 rounded-lg flex items-center justify-center z-10"
      >
        <div className="bg-surface-strong border border-[color:var(--color-border-subtle)] rounded-lg p-4 flex items-center space-x-3">
          <LoadingSpinner size="sm" />
          <span className="text-sm text-text-primary">{label}</span>
        </div>
      </motion.div>
    )}
  </div>
);