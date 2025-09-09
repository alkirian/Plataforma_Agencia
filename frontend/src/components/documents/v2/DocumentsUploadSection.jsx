// DocumentsUploadSection.jsx - Upload section component for Documents
import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import UploadZone from './UploadZone.jsx'
import UploadErrorBoundary from '../UploadErrorBoundary.jsx'

const DocumentsUploadSection = ({
  isUploadExpanded,
  onFilesSelected,
  clearUploadProgress,
  setIsUploadExpanded,
}) => {
  return (
    <AnimatePresence>
      {isUploadExpanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className='bg-surface-soft border border-gray-200/10 rounded-xl p-6'
        >
          <UploadErrorBoundary
            componentName='Upload Zone'
            maxRetries={3}
            onRetry={failedFiles => {
              console.log('Retrying upload for files:', failedFiles)
              // Retry upload logic here
            }}
            onSkipFailed={failedFiles => {
              console.log('Skipping failed files:', failedFiles)
              clearUploadProgress()
            }}
            onCancel={() => {
              setIsUploadExpanded(false)
              clearUploadProgress()
            }}
            showDetails={false}
          >
            <UploadZone
              onFilesSelected={onFilesSelected}
              maxFiles={10}
              maxFileSize={100 * 1024 * 1024} // 100MB
              className='w-full'
            />
          </UploadErrorBoundary>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default DocumentsUploadSection
