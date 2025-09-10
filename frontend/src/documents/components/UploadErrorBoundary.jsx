import React from 'react';
import { Upload, AlertTriangle, RefreshCw, X, FileX } from 'lucide-react';

/**
 * Error Boundary específico para operaciones de upload
 * Incluye lógica especializada para manejar errores de subida de archivos
 */
class UploadErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorType: null,
      failedFiles: [],
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error) {
    // Clasificar tipos de error de upload
    let errorType = 'unknown';

    if (error.message.includes('File too large')) {
      errorType = 'fileSize';
    } else if (error.message.includes('Invalid file type')) {
      errorType = 'fileType';
    } else if (error.message.includes('Network')) {
      errorType = 'network';
    } else if (error.message.includes('quota') || error.message.includes('storage')) {
      errorType = 'storage';
    } else if (error.message.includes('permission')) {
      errorType = 'permission';
    }

    return {
      hasError: true,
      error: error,
      errorType: errorType,
    };
  }

  componentDidCatch(error, errorInfo) {
    const uploadContext = {
      error: error,
      errorInfo: errorInfo,
      errorType: this.state.errorType,
      failedFiles: this.props.failedFiles || [],
      uploadProgress: this.props.uploadProgress || {},
      timestamp: new Date().toISOString(),
      retryCount: this.state.retryCount,
    };

    console.error('UploadErrorBoundary caught an error:', uploadContext);

    // Log específico para errores de upload
    if (window.reportUploadError) {
      window.reportUploadError(uploadContext);
    }

    // Actualizar failed files si están disponibles
    if (this.props.failedFiles) {
      this.setState({ failedFiles: this.props.failedFiles });
    }
  }

  handleRetry() {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorType: null,
      retryCount: prevState.retryCount + 1,
    }));

    // Llamar al callback de retry si está disponible
    if (this.props.onRetry) {
      this.props.onRetry(this.state.failedFiles);
    }
  };

  handleSkipFailed() {
    this.setState({
      hasError: false,
      error: null,
      errorType: null,
      failedFiles: [],
    });

    // Llamar al callback para continuar sin archivos fallidos
    if (this.props.onSkipFailed) {
      this.props.onSkipFailed(this.state.failedFiles);
    }
  };

  handleCancel = () => {
    this.setState({
      hasError: false,
      error: null,
      errorType: null,
      failedFiles: [],
    });

    // Llamar al callback de cancelación
    if (this.props.onCancel) {
      this.props.onCancel();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <UploadErrorFallback
          error={this.state.error}
          errorType={this.state.errorType}
          failedFiles={this.state.failedFiles}
          retryCount={this.state.retryCount}
          maxRetries={this.props.maxRetries || 3}
          onRetry={this.handleRetry}
          onSkipFailed={this.handleSkipFailed}
          onCancel={this.handleCancel}
          showDetails={this.props.showDetails}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Componente de UI fallback específico para errores de upload
 */
const UploadErrorFallback = ({
  error,
  errorType,
  failedFiles = [],
  retryCount,
  maxRetries,
  onRetry,
  onSkipFailed,
  onCancel,
  showDetails = false,
}) => {
  const getErrorContent = () => {
    switch (errorType) {
      case 'fileSize':
        return {
          icon: <FileX className='mx-auto h-12 w-12 text-red-400 mb-4' />,
          title: 'File Too Large',
          message:
            'One or more files exceed the maximum size limit. Please choose smaller files or compress them.',
          suggestion: 'Maximum file size: 10MB per file',
        };

      case 'fileType':
        return {
          icon: <FileX className='mx-auto h-12 w-12 text-red-400 mb-4' />,
          title: 'Invalid File Type',
          message: 'Some files are not supported. Please check the file types and try again.',
          suggestion: 'Supported: PDF, DOC, DOCX, JPG, PNG, GIF',
        };

      case 'network':
        return {
          icon: <AlertTriangle className='mx-auto h-12 w-12 text-orange-400 mb-4' />,
          title: 'Network Error',
          message:
            'Upload failed due to network connectivity issues. Please check your connection and try again.',
          suggestion: 'Check your internet connection',
        };

      case 'storage':
        return {
          icon: <FileX className='mx-auto h-12 w-12 text-red-400 mb-4' />,
          title: 'Storage Limit Reached',
          message:
            'Your storage quota has been exceeded. Please free up space or upgrade your plan.',
          suggestion: 'Manage your storage or upgrade plan',
        };

      case 'permission':
        return {
          icon: <AlertTriangle className='mx-auto h-12 w-12 text-red-400 mb-4' />,
          title: 'Permission Denied',
          message: "You don't have permission to upload files to this location.",
          suggestion: 'Contact your administrator',
        };

      default:
        return {
          icon: <Upload className='mx-auto h-12 w-12 text-red-400 mb-4' />,
          title: 'Upload Failed',
          message: 'An unexpected error occurred during upload. Please try again.',
          suggestion: 'If the problem persists, contact support',
        };
    }
  };

  const errorContent = getErrorContent();
  const canRetry = retryCount < maxRetries && ['network', 'unknown'].includes(errorType);

  return (
    <div className='min-h-64 flex items-center justify-center p-8'>
      <div className='max-w-lg w-full'>
        <div className='bg-white rounded-lg border border-red-200 shadow-sm p-8'>
          <div className='text-center'>
            {errorContent.icon}
            <h3 className='text-lg font-medium text-gray-900 mb-2'>{errorContent.title}</h3>
            <p className='text-sm text-gray-600 mb-2'>{errorContent.message}</p>
            <p className='text-xs text-gray-500 mb-6'>{errorContent.suggestion}</p>
          </div>

          {/* Failed Files List */}
          {failedFiles.length > 0 && (
            <div className='mb-6'>
              <h4 className='text-sm font-medium text-gray-700 mb-2'>Failed Files:</h4>
              <div className='bg-red-50 rounded-md p-3 max-h-32 overflow-y-auto'>
                {failedFiles.map((file, index) => (
                  <div key={index} className='text-xs text-red-700 flex items-center'>
                    <X className='w-3 h-3 mr-1' />
                    {file.name || file} {file.size && `(${(file.size / 1024 / 1024).toFixed(1)}MB)`}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className='flex flex-col sm:flex-row gap-3 justify-center'>
            {canRetry && (
              <button
                onClick={onRetry}
                className='inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors'
              >
                <RefreshCw className='w-4 h-4 mr-2' />
                Retry Upload {retryCount > 0 && `(${retryCount}/${maxRetries})`}
              </button>
            )}

            {failedFiles.length > 0 && (
              <button
                onClick={onSkipFailed}
                className='inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors'
              >
                Continue Without Failed Files
              </button>
            )}

            <button
              onClick={onCancel}
              className='inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors'
            >
              Cancel Upload
            </button>
          </div>

          {/* Retry Counter */}
          {retryCount > 0 && (
            <div className='mt-4 text-center'>
              <span className='text-xs text-gray-500'>
                Retry attempts: {retryCount}/{maxRetries}
              </span>
            </div>
          )}

          {/* Technical Details */}
          {showDetails && error && (
            <details className='mt-6'>
              <summary className='cursor-pointer text-sm text-gray-500 hover:text-gray-700'>
                Technical Details
              </summary>
              <div className='mt-2 p-3 bg-gray-50 rounded text-xs font-mono text-gray-600 overflow-auto max-h-32'>
                <div>
                  <strong>Error Type:</strong> {errorType}
                </div>
                <div>
                  <strong>Message:</strong> {error.message}
                </div>
                <div>
                  <strong>Retry Count:</strong> {retryCount}
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
  );
};

/**
 * Hook especializado para manejar errores de upload
 */
export const useUploadErrorHandler = () => {
  const [uploadErrors, setUploadErrors] = React.useState([]);

  const handleUploadError = React.useCallback((error, failedFiles = []) => {
    const uploadError = {
      id: Date.now() + Math.random(),
      error,
      failedFiles,
      timestamp: new Date().toISOString(),
    };

    setUploadErrors(prev => [...prev, uploadError]);

    console.error('Upload error handled:', uploadError);

    if (window.reportUploadError) {
      window.reportUploadError(uploadError);
    }

    return uploadError.id;
  }, []);

  const clearUploadError = React.useCallback(errorId => {
    setUploadErrors(prev => prev.filter(err => err.id !== errorId));
  }, []);

  const clearAllUploadErrors = React.useCallback(() => {
    setUploadErrors([]);
  }, []);

  return {
    uploadErrors,
    handleUploadError,
    clearUploadError,
    clearAllUploadErrors,
  };
};

export default UploadErrorBoundary;
