import React from 'react'
import {
  AlertTriangle,
  RefreshCw,
  FileX,
  WifiOff,
  Shield,
  HardDrive,
  Folder,
  Image,
  Search,
  Clock,
  Home,
} from 'lucide-react'

/**
 * Colección de componentes fallback reutilizables para diferentes tipos de errores
 */

/**
 * Fallback genérico para errores del sistema
 */
export const SystemErrorFallback = ({ onRetry, onGoHome, error, showDetails = false }) => (
  <div className='min-h-96 flex items-center justify-center p-8'>
    <div className='max-w-md w-full text-center'>
      <div className='bg-white rounded-lg border border-red-200 shadow-sm p-8'>
        <AlertTriangle className='mx-auto h-16 w-16 text-red-400 mb-6' />
        <h2 className='text-xl font-semibold text-gray-900 mb-3'>System Error</h2>
        <p className='text-gray-600 mb-6'>
          An unexpected system error occurred. Our team has been notified and is working on a fix.
        </p>

        <div className='flex flex-col sm:flex-row gap-3 justify-center'>
          <button
            onClick={onRetry}
            className='inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors'
          >
            <RefreshCw className='w-4 h-4 mr-2' />
            Try Again
          </button>

          <button
            onClick={onGoHome}
            className='inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors'
          >
            <Home className='w-4 h-4 mr-2' />
            Go Home
          </button>
        </div>

        {showDetails && error && (
          <details className='mt-6 text-left'>
            <summary className='cursor-pointer text-sm text-gray-500 hover:text-gray-700'>
              Technical Details
            </summary>
            <div className='mt-2 p-3 bg-gray-50 rounded text-xs font-mono text-gray-600 overflow-auto max-h-32'>
              <div>
                <strong>Error:</strong> {error.message}
              </div>
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

/**
 * Fallback para errores de red/conectividad
 */
export const NetworkErrorFallback = ({ onRetry, onRefresh }) => (
  <div className='min-h-64 flex items-center justify-center p-8'>
    <div className='max-w-md w-full text-center'>
      <div className='bg-white rounded-lg border border-orange-200 shadow-sm p-8'>
        <WifiOff className='mx-auto h-12 w-12 text-orange-400 mb-4' />
        <h3 className='text-lg font-medium text-gray-900 mb-2'>Connection Problem</h3>
        <p className='text-sm text-gray-600 mb-6'>
          Unable to connect to the server. Please check your internet connection and try again.
        </p>

        <div className='flex flex-col sm:flex-row gap-3 justify-center'>
          <button
            onClick={onRetry}
            className='inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors'
          >
            <RefreshCw className='w-4 h-4 mr-2' />
            Retry Connection
          </button>

          <button
            onClick={onRefresh}
            className='inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors'
          >
            Refresh Page
          </button>
        </div>
      </div>
    </div>
  </div>
)

/**
 * Fallback para errores de permisos
 */
export const PermissionErrorFallback = ({ onContactSupport, onGoBack }) => (
  <div className='min-h-64 flex items-center justify-center p-8'>
    <div className='max-w-md w-full text-center'>
      <div className='bg-white rounded-lg border border-red-200 shadow-sm p-8'>
        <Shield className='mx-auto h-12 w-12 text-red-400 mb-4' />
        <h3 className='text-lg font-medium text-gray-900 mb-2'>Access Denied</h3>
        <p className='text-sm text-gray-600 mb-6'>
          You don't have permission to access this resource. Please contact your administrator or
          try a different action.
        </p>

        <div className='flex flex-col sm:flex-row gap-3 justify-center'>
          <button
            onClick={onContactSupport}
            className='inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors'
          >
            Contact Support
          </button>

          <button
            onClick={onGoBack}
            className='inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors'
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  </div>
)

/**
 * Fallback para errores de cuota/almacenamiento
 */
export const StorageErrorFallback = ({ onManageStorage, onUpgradePlan }) => (
  <div className='min-h-64 flex items-center justify-center p-8'>
    <div className='max-w-md w-full text-center'>
      <div className='bg-white rounded-lg border border-yellow-200 shadow-sm p-8'>
        <HardDrive className='mx-auto h-12 w-12 text-yellow-500 mb-4' />
        <h3 className='text-lg font-medium text-gray-900 mb-2'>Storage Limit Reached</h3>
        <p className='text-sm text-gray-600 mb-6'>
          Your storage quota has been exceeded. Free up space or upgrade your plan to continue.
        </p>

        <div className='flex flex-col sm:flex-row gap-3 justify-center'>
          <button
            onClick={onManageStorage}
            className='inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors'
          >
            <HardDrive className='w-4 h-4 mr-2' />
            Manage Storage
          </button>

          <button
            onClick={onUpgradePlan}
            className='inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors'
          >
            Upgrade Plan
          </button>
        </div>
      </div>
    </div>
  </div>
)

/**
 * Fallback para cuando no se encuentran documentos
 */
export const EmptyStateFallback = ({
  onUploadFiles,
  onCreateFolder,
  title = 'No Documents Found',
}) => (
  <div className='min-h-64 flex items-center justify-center p-8'>
    <div className='max-w-md w-full text-center'>
      <div className='bg-white rounded-lg border border-gray-200 shadow-sm p-8'>
        <Folder className='mx-auto h-12 w-12 text-gray-400 mb-4' />
        <h3 className='text-lg font-medium text-gray-900 mb-2'>{title}</h3>
        <p className='text-sm text-gray-600 mb-6'>
          Get started by uploading your first document or creating a new folder.
        </p>

        <div className='flex flex-col sm:flex-row gap-3 justify-center'>
          <button
            onClick={onUploadFiles}
            className='inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors'
          >
            Upload Files
          </button>

          <button
            onClick={onCreateFolder}
            className='inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors'
          >
            <Folder className='w-4 h-4 mr-2' />
            Create Folder
          </button>
        </div>
      </div>
    </div>
  </div>
)

/**
 * Fallback para errores de carga de imágenes/preview
 */
export const PreviewErrorFallback = ({ fileName, onRetry, onSkip }) => (
  <div className='min-h-48 flex items-center justify-center p-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300'>
    <div className='text-center'>
      <Image className='mx-auto h-10 w-10 text-gray-400 mb-3' />
      <h4 className='text-sm font-medium text-gray-700 mb-1'>Preview Unavailable</h4>
      <p className='text-xs text-gray-500 mb-4'>
        {fileName ? `Unable to load preview for ${fileName}` : 'Unable to load preview'}
      </p>

      <div className='flex gap-2 justify-center'>
        <button
          onClick={onRetry}
          className='text-xs px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded transition-colors'
        >
          Retry
        </button>
        <button
          onClick={onSkip}
          className='text-xs px-3 py-1 bg-white border border-gray-300 hover:bg-gray-50 rounded transition-colors'
        >
          Skip
        </button>
      </div>
    </div>
  </div>
)

/**
 * Fallback para errores de búsqueda
 */
export const SearchErrorFallback = ({ query, onRetrySearch, onClearSearch }) => (
  <div className='min-h-32 flex items-center justify-center p-6'>
    <div className='text-center'>
      <Search className='mx-auto h-8 w-8 text-gray-400 mb-2' />
      <h4 className='text-sm font-medium text-gray-700 mb-1'>Search Failed</h4>
      <p className='text-xs text-gray-500 mb-3'>
        {query ? `Unable to search for "${query}"` : 'Search encountered an error'}
      </p>

      <div className='flex gap-2 justify-center'>
        <button
          onClick={onRetrySearch}
          className='text-xs px-3 py-1 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded transition-colors'
        >
          Retry Search
        </button>
        <button
          onClick={onClearSearch}
          className='text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors'
        >
          Clear Search
        </button>
      </div>
    </div>
  </div>
)

/**
 * Fallback para errores de timeout
 */
export const TimeoutErrorFallback = ({ operation = 'operation', onRetry, onCancel }) => (
  <div className='min-h-48 flex items-center justify-center p-8'>
    <div className='max-w-sm w-full text-center'>
      <div className='bg-white rounded-lg border border-yellow-200 shadow-sm p-6'>
        <Clock className='mx-auto h-10 w-10 text-yellow-500 mb-3' />
        <h3 className='text-base font-medium text-gray-900 mb-2'>Operation Timed Out</h3>
        <p className='text-sm text-gray-600 mb-4'>
          The {operation} is taking longer than expected. This might be due to network conditions or
          server load.
        </p>

        <div className='flex flex-col sm:flex-row gap-2 justify-center'>
          <button
            onClick={onRetry}
            className='inline-flex items-center justify-center px-3 py-2 border border-transparent rounded text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors'
          >
            <RefreshCw className='w-4 h-4 mr-1' />
            Try Again
          </button>

          <button
            onClick={onCancel}
            className='inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors'
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
)

/**
 * HOC para agregar error fallback a cualquier componente
 */
export const withErrorFallback = (Component, FallbackComponent) => {
  return function WrappedComponent(props) {
    return (
      <React.Suspense fallback={<FallbackComponent />}>
        <Component {...props} />
      </React.Suspense>
    )
  }
}
