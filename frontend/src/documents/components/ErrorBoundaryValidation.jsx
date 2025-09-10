/**
 * Error Boundary Validation Component
 * Used for testing Error Boundary functionality in development
 */

import React, { useState } from 'react'
import DocumentErrorBoundary from './ErrorBoundary'
import UploadErrorBoundary from './UploadErrorBoundary'

// Test component that throws errors on command
const ErrorThrower = ({ errorType = 'default', shouldError = false }) => {
  if (shouldError) {
    switch (errorType) {
      case 'upload-size':
        throw new Error('File too large - Maximum file size is 10MB')
      case 'upload-type':
        throw new Error('Invalid file type - Only PDF, DOC, and images allowed')
      case 'upload-network':
        throw new Error('Network error - Upload failed due to connection issues')
      case 'upload-permission':
        throw new Error('Permission denied - You do not have permission to upload files')
      case 'upload-storage':
        throw new Error('Storage full - Not enough storage space available')
      case 'render':
        throw new Error('Render error - Failed to render document component')
      case 'async':
        Promise.reject(new Error('Async error - Failed to load document data'))
        break
      case 'null-ref':
        const nullObj = null
        return <div>{nullObj.property}</div>
      case 'undefined-method':
        const undefinedObj = {}
        return <div>{undefinedObj.undefinedMethod()}</div>
      default:
        throw new Error('Generic error - Something went wrong')
    }
  }

  return (
    <div className='p-4 bg-green-100 border border-green-300 rounded-lg'>
      <p className='text-green-800'>✅ Component rendered successfully</p>
      <p className='text-sm text-green-600 mt-1'>Error Type: {errorType}</p>
    </div>
  )
}

// Main validation component
export const ErrorBoundaryValidation = () => {
  const [activeTests, setActiveTests] = useState({})

  const toggleError = testId => {
    setActiveTests(prev => ({
      ...prev,
      [testId]: !prev[testId],
    }))
  }

  const resetAllTests = () => {
    setActiveTests({})
  }

  const testCases = [
    {
      id: 'document-generic',
      title: 'Document Error Boundary - Generic Error',
      errorType: 'default',
      BoundaryComponent: DocumentErrorBoundary,
      boundaryProps: {
        componentName: 'Test Document Component',
        fallbackType: 'default',
        onRetry: () => toggleError('document-generic'),
      },
    },
    {
      id: 'document-render',
      title: 'Document Error Boundary - Render Error',
      errorType: 'render',
      BoundaryComponent: DocumentErrorBoundary,
      boundaryProps: {
        componentName: 'Test Document Grid',
        fallbackType: 'grid',
        onRetry: () => toggleError('document-render'),
      },
    },
    {
      id: 'upload-size',
      title: 'Upload Error Boundary - File Size Error',
      errorType: 'upload-size',
      BoundaryComponent: UploadErrorBoundary,
      boundaryProps: {
        componentName: 'Test Upload Zone',
        maxRetries: 3,
        onRetry: () => toggleError('upload-size'),
        onSkipFailed: () => console.log('Skipping failed files'),
        onCancel: () => toggleError('upload-size'),
      },
    },
    {
      id: 'upload-type',
      title: 'Upload Error Boundary - File Type Error',
      errorType: 'upload-type',
      BoundaryComponent: UploadErrorBoundary,
      boundaryProps: {
        componentName: 'Test File Validator',
        maxRetries: 2,
        onRetry: () => toggleError('upload-type'),
        onSkipFailed: () => console.log('Skipping invalid files'),
        onCancel: () => toggleError('upload-type'),
      },
    },
    {
      id: 'upload-network',
      title: 'Upload Error Boundary - Network Error',
      errorType: 'upload-network',
      BoundaryComponent: UploadErrorBoundary,
      boundaryProps: {
        componentName: 'Test Network Upload',
        maxRetries: 3,
        onRetry: () => toggleError('upload-network'),
        onSkipFailed: () => console.log('Skipping failed uploads'),
        onCancel: () => toggleError('upload-network'),
      },
    },
    {
      id: 'upload-permission',
      title: 'Upload Error Boundary - Permission Error',
      errorType: 'upload-permission',
      BoundaryComponent: UploadErrorBoundary,
      boundaryProps: {
        componentName: 'Test Permission Check',
        maxRetries: 1,
        onRetry: () => toggleError('upload-permission'),
        onSkipFailed: () => console.log('Skipping unauthorized uploads'),
        onCancel: () => toggleError('upload-permission'),
      },
    },
    {
      id: 'null-ref',
      title: 'Document Error Boundary - Null Reference Error',
      errorType: 'null-ref',
      BoundaryComponent: DocumentErrorBoundary,
      boundaryProps: {
        componentName: 'Test Null Reference',
        fallbackType: 'default',
        onRetry: () => toggleError('null-ref'),
      },
    },
    {
      id: 'undefined-method',
      title: 'Document Error Boundary - Undefined Method Error',
      errorType: 'undefined-method',
      BoundaryComponent: DocumentErrorBoundary,
      boundaryProps: {
        componentName: 'Test Undefined Method',
        fallbackType: 'folder',
        onRetry: () => toggleError('undefined-method'),
      },
    },
  ]

  return (
    <div className='p-6 bg-gray-50 min-h-screen'>
      <div className='max-w-6xl mx-auto'>
        <div className='mb-8'>
          <h1 className='text-2xl font-bold text-gray-900 mb-2'>Error Boundary Validation Suite</h1>
          <p className='text-gray-600 mb-4'>
            Test Error Boundary functionality and fallback UI components
          </p>

          <div className='flex gap-3'>
            <button
              onClick={resetAllTests}
              className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
            >
              Reset All Tests
            </button>

            <div className='flex items-center gap-2 text-sm text-gray-600'>
              <span>Active Errors: {Object.values(activeTests).filter(Boolean).length}</span>
            </div>
          </div>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          {testCases.map(({ id, title, errorType, BoundaryComponent, boundaryProps }) => (
            <div key={id} className='bg-white rounded-lg border border-gray-200 p-6'>
              <div className='mb-4'>
                <h3 className='text-lg font-semibold text-gray-900 mb-2'>{title}</h3>

                <div className='flex gap-2 mb-4'>
                  <button
                    onClick={() => toggleError(id)}
                    className={`px-3 py-1 text-sm rounded transition-colors ${
                      activeTests[id]
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {activeTests[id] ? 'Stop Error' : 'Trigger Error'}
                  </button>

                  <span
                    className={`px-2 py-1 text-xs rounded ${
                      activeTests[id] ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {errorType}
                  </span>
                </div>
              </div>

              <div className='border border-gray-200 rounded-lg p-4 min-h-[100px]'>
                <BoundaryComponent {...boundaryProps}>
                  <ErrorThrower errorType={errorType} shouldError={activeTests[id]} />
                </BoundaryComponent>
              </div>
            </div>
          ))}
        </div>

        <div className='mt-8 p-6 bg-blue-50 rounded-lg border border-blue-200'>
          <h3 className='text-lg font-semibold text-blue-900 mb-3'>Validation Instructions</h3>

          <div className='text-sm text-blue-800 space-y-2'>
            <p>
              <strong>1.</strong> Click "Trigger Error" to activate an error boundary test
            </p>
            <p>
              <strong>2.</strong> Verify that the appropriate fallback UI is displayed
            </p>
            <p>
              <strong>3.</strong> Test the retry functionality using the fallback UI buttons
            </p>
            <p>
              <strong>4.</strong> Check that error logging is working (browser console)
            </p>
            <p>
              <strong>5.</strong> Verify that other components remain unaffected
            </p>
            <p>
              <strong>6.</strong> Test multiple simultaneous errors to verify isolation
            </p>
          </div>
        </div>

        <div className='mt-6 p-6 bg-yellow-50 rounded-lg border border-yellow-200'>
          <h3 className='text-lg font-semibold text-yellow-900 mb-3'>Expected Behaviors</h3>

          <div className='text-sm text-yellow-800 space-y-2'>
            <p>
              • <strong>Document Error Boundaries:</strong> Show fallback UI with retry button
            </p>
            <p>
              • <strong>Upload Error Boundaries:</strong> Show specialized upload error UI with
              retry/skip/cancel options
            </p>
            <p>
              • <strong>Error Isolation:</strong> Only the component with the error should show
              fallback UI
            </p>
            <p>
              • <strong>Error Logging:</strong> All errors should be logged to console with
              component context
            </p>
            <p>
              • <strong>Retry Functionality:</strong> Retry buttons should reset error state and
              re-render component
            </p>
            <p>
              • <strong>Production Mode:</strong> Error details should be hidden in production
              builds
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ErrorBoundaryValidation
