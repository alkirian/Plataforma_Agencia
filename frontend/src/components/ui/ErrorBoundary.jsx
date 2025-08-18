import React from 'react';
import { motion } from 'framer-motion';
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { Button } from './Button';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback 
          error={this.state.error}
          onRetry={() => this.setState({ hasError: false, error: null })}
        />
      );
    }

    return this.props.children;
  }
}

export const ErrorFallback = ({ 
  error, 
  onRetry, 
  title = 'Algo salió mal',
  description = 'Ha ocurrido un error inesperado. Por favor intenta nuevamente.'
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="min-h-[400px] flex items-center justify-center p-6"
  >
    <div className="card rounded-xl p-8 text-center max-w-md space-y-6">
      <div className="mx-auto w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center">
        <ExclamationTriangleIcon className="h-8 w-8 text-red-500" />
      </div>
      
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-text-primary">{title}</h2>
        <p className="text-text-muted">{description}</p>
        
        {error && process.env.NODE_ENV === 'development' && (
          <details className="mt-4 text-left">
            <summary className="text-sm text-text-muted cursor-pointer hover:text-text-primary">
              Detalles técnicos
            </summary>
            <pre className="mt-2 text-xs bg-red-950/20 border border-red-500/20 rounded p-3 overflow-auto text-red-200">
              {error.toString()}
            </pre>
          </details>
        )}
      </div>
      
      <div className="flex gap-3 justify-center">
        <Button
          variant="ghost"
          onClick={() => window.location.reload()}
          icon={<ArrowPathIcon className="h-4 w-4" />}
        >
          Recargar página
        </Button>
        {onRetry && (
          <Button onClick={onRetry} variant="primary">
            Intentar nuevamente
          </Button>
        )}
      </div>
    </div>
  </motion.div>
);

export const ErrorCard = ({ 
  title = 'Error',
  message = 'Ha ocurrido un error',
  onRetry,
  className
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className={`card rounded-xl p-6 border-red-500/20 bg-red-950/10 ${className}`}
  >
    <div className="flex items-start space-x-3">
      <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mt-0.5" />
      <div className="flex-1 space-y-2">
        <h3 className="font-medium text-text-primary">{title}</h3>
        <p className="text-sm text-text-muted">{message}</p>
        {onRetry && (
          <Button size="sm" variant="ghost" onClick={onRetry} className="mt-3">
            Intentar nuevamente
          </Button>
        )}
      </div>
    </div>
  </motion.div>
);

export const NetworkError = ({ onRetry }) => (
  <ErrorCard
    title="Error de conexión"
    message="No se pudo conectar con el servidor. Verifica tu conexión a internet."
    onRetry={onRetry}
  />
);

export const NotFoundError = ({ resource = 'página' }) => (
  <ErrorCard
    title="No encontrado"
    message={`La ${resource} que buscas no existe o ha sido eliminada.`}
  />
);