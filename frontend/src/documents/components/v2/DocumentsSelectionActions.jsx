// DocumentsSelectionActions.jsx - Selection actions panel for Documents
import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const DocumentsSelectionActions = ({
  selectedDocuments,
  documents,
  onDownloadAll,
  onClearSelection,
}) => {
  const handleDownloadAll = () => {
    selectedDocuments.forEach(docId => {
      const doc = documents.find(d => d.id === docId)
      if (doc) onDownloadAll(doc)
    })
  }

  return (
    <AnimatePresence>
      {selectedDocuments.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className='fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-surface-strong border border-border-muted rounded-xl p-4 shadow-lg z-40'
        >
          <div className='flex items-center space-x-4'>
            <span className='text-sm text-text-primary'>
              {selectedDocuments.length} document(s) selected
            </span>
            <button
              onClick={handleDownloadAll}
              className='px-3 py-2 text-sm bg-[color:var(--palette-primary-accent)] hover:bg-[color:var(--palette-hover-state)] text-white rounded-lg transition-colors'
            >
              Download All
            </button>
            <button
              onClick={onClearSelection}
              className='px-3 py-2 text-sm bg-surface-muted hover:bg-surface-soft text-text-primary rounded-lg transition-colors'
            >
              Clear
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default DocumentsSelectionActions
