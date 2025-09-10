import React from 'react'
import { AlertTriangle, RefreshCw, FileX, Home } from 'lucide-react'

/**
 * Error Boundary genérico para el módulo de documentos
 * Captura errores de JavaScript en cualquier lugar del árbol de componentes hijo
 */
class DocumentErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    }
  }

  static getDerivedStateFromError(error) {
    // Actualiza el state para que el siguiente renderizado muestre la UI de error
    return {
      hasError: true,
      error,
      errorId: Date.now() + Math.random(), // ID único para debugging
    }
  }

  componentDidCatch(error, errorInfo) {
    // Log del error para debugging
    console.error('DocumentErrorBoundary caught an error:', {
      error,
      errorInfo,
      errorId: this.state.errorId,
      component: this.props.componentName || 'Unknown',
      timestamp: new Date().toISOString(),
    })

    // Actualizar state con información adicional
    this.setState({
      error,
      errorInfo,
    })

    // Aquí se podría integrar con un servicio de logging externo
    // como Sentry, LogRocket, etc.
    if (window.reportError) {
      window.reportError(error, {
        component: this.props.componentName || 'DocumentModule',
        errorInfo,
      })
    }
  }

  handleRetry() {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    })
  }

  handleReportError() {
    const errorData = {
      error: this.state.error?.message || 'Unknown error',
      stack: this.state.error?.stack,
      component: this.props.componentName || 'Document Module',
      errorId: this.state.errorId,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    }

    // Copiar al clipboard para fácil reporte
    navigator.clipboard
      ?.writeText(JSON.stringify(errorData, null, 2))
      .then(() => {
        alert('Error details copied to clipboard. Please share with support.')
      })
      .catch(() => {
        console.log('Error details:', errorData)
        alert('Error details logged to console. Please check browser console.')
      })
  }

  render() {
    if (this.state.hasError) {
      return (
        <DocumentErrorFallback
          error={this.state.error}
          errorId={this.state.errorId}
          componentName={this.props.componentName}
          fallbackType={this.props.fallbackType}
          onRetry={this.handleRetry}
          onReportError={this.handleReportError}
          showDetails={this.props.showDetails}
        />
      )
    }

    return this.props.children
  }
}

/**
 * Componente de UI fallback para errores en documentos
 */
const DocumentErrorFallback = ({
  error,
  errorId,
  componentName = 'Document Module',
  fallbackType = 'default',
  onRetry,
  onReportError,
  showDetails = false,
}) => {
  const renderFallbackContent = () => {
    switch (fallbackType) {
      case 'upload':
        return (
          <div className='text-center'>
            <FileX className='mx-auto h-12 w-12 text-red-400 mb-4' />
            <h3 className='text-lg font-medium text-gray-900 mb-2'>Upload Error</h3>
            <p className='text-sm text-gray-600 mb-6'>
              There was a problem uploading your files. This might be due to file size, format, or
              network issues.
            </p>
          </div>
        )

      case 'grid':
        return (
          <div className='text-center'>
            <FileX className='mx-auto h-12 w-12 text-red-400 mb-4' />
            <h3 className='text-lg font-medium text-gray-900 mb-2'>Display Error</h3>
            <p className='text-sm text-gray-600 mb-6'>
              Unable to display documents. This might be a temporary issue with loading or
              rendering.
            </p>
          </div>
        )

      case 'folder':
        return (
          <div className='text-center'>
            <FileX className='mx-auto h-12 w-12 text-red-400 mb-4' />
            <h3 className='text-lg font-medium text-gray-900 mb-2'>Folder Error</h3>
            <p className='text-sm text-gray-600 mb-6'>
              There was a problem with the folder structure. Some documents might not be accessible.
            </p>
          </div>
        )

      default:
        return (
          <div className='text-center'>
            <AlertTriangle className='mx-auto h-12 w-12 text-red-400 mb-4' />
            <h3 className='text-lg font-medium text-gray-900 mb-2'>Something went wrong</h3>
            <p className='text-sm text-gray-600 mb-6'>
              An unexpected error occurred in the {componentName}. Don't worry, your data is safe.
            </p>
          </div>
        )
    }
  }

  return (
    <div className='min-h-64 flex items-center justify-center p-8'>
      <div className='max-w-md w-full'>
        <div className='bg-white rounded-lg border border-red-200 shadow-sm p-8'>
          {renderFallbackContent()}

          <div className='flex flex-col sm:flex-row gap-3 justify-center'>
            <button
              onClick={onRetry}
              className='inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors'
            >
              <RefreshCw className='w-4 h-4 mr-2' />
              Try Again
            </button>

            <button
              onClick={onReportError}
              className='inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors'
            >
              Report Issue
            </button>
          </div>

          {showDetails && error && (
            <details className='mt-6'>
              <summary className='cursor-pointer text-sm text-gray-500 hover:text-gray-700'>
                Technical Details
              </summary>
              <div className='mt-2 p-3 bg-gray-50 rounded text-xs font-mono text-gray-600 overflow-auto max-h-32'>
                <div>
                  <strong>Error:</strong> {error.message}
                </div>
                {errorId && (
                  <div>
                    <strong>ID:</strong> {errorId}
                  </div>
                )}
                {error.stack && (
                  <div className='mt-2'>
                    <strong>Stack:</strong>
                    <pre className='whitespace-pre-wrap'>{error.stack}</pre>
                  </div>
                )}
              </div>
            </details>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Hook para usar Error Boundary de forma declarativa
 */
export const useErrorHandler = () => {
  return (error, errorInfo) => {
    console.error('Manual error report:', error, errorInfo)

    // Aquí se podría disparar el mismo logging que el Error Boundary
    if (window.reportError) {
      window.reportError(error, errorInfo)
    }
  }
}

/**
 * HOC para envolver componentes con Error Boundary
 */
export const withErrorBoundary = (Component, options = {}) => {
  const WrappedComponent = props => (
    <DocumentErrorBoundary
      componentName={options.componentName || Component.displayName || Component.name}
      fallbackType={options.fallbackType}
      showDetails={options.showDetails}
    >
      <Component {...props} />
    </DocumentErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  return WrappedComponent
}

export default DocumentErrorBoundary
