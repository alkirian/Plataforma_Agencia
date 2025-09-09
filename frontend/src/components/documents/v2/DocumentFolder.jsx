/**
 * DocumentFolder Component - Advanced Visual Folder System
 * Provides comprehensive folder-based document organization with animations,
 * search integration, and persistent state management.
 * Refactored: Component broken down into smaller, focused components
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// Extracted components for better maintainability
import FolderHeader from './FolderHeader.jsx'
import FolderCategoryHeader from './FolderCategoryHeader.jsx'
import FolderCategoryContent from './FolderCategoryContent.jsx'
import { FolderEmptyState, FolderLoadingState } from './FolderEmptyState.jsx'

import {
  DOCUMENT_CATEGORIES,
  groupDocumentsByCategory,
  getCategoryStats,
  getCategoryConfig,
  formatFileSize,
} from '@shared/utils/documentCategories'

/**
 * DocumentFolder - Main component for visual folder organization
 */
const DocumentFolder = ({
  documents = [],
  viewMode = 'grid',
  searchQuery = '',
  selectedIds = [],
  onDocumentSelect,
  onDocumentAction,
  onPreview,
  showVersions = true,
  className = '',
  clientId = 'default',
}) => {
  // Generate unique storage key for this client
  const storageKey = `documentFolders_expanded_${clientId}`

  // Load initial expanded state from localStorage
  const loadExpandedState = useCallback(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      return saved ? new Set(JSON.parse(saved)) : new Set(['documents', 'images'])
    } catch {
      return new Set(['documents', 'images']) // Default expanded folders
    }
  }, [storageKey])

  // State management
  const [expandedFolders, setExpandedFolders] = useState(loadExpandedState)
  const [allExpanded, setAllExpanded] = useState(false)

  // Process documents into categories
  const groupedDocuments = useMemo(() => {
    return groupDocumentsByCategory(documents, searchQuery)
  }, [documents, searchQuery])

  // Calculate statistics for each category
  const categoryStats = useMemo(() => {
    return getCategoryStats(groupedDocuments)
  }, [groupedDocuments])

  // Get categories with documents (excluding empty ones unless no search)
  const visibleCategories = useMemo(() => {
    return Object.keys(DOCUMENT_CATEGORIES).filter(categoryKey => {
      const hasDocuments = groupedDocuments[categoryKey]?.length > 0
      // Show empty categories only when no search is active
      return hasDocuments || (!searchQuery && categoryKey !== 'others')
    })
  }, [groupedDocuments, searchQuery])

  // Calculate overall statistics
  const overallStats = useMemo(() => {
    const totalDocuments = Object.values(groupedDocuments).reduce(
      (sum, docs) => sum + docs.length,
      0
    )
    const totalSize = Object.values(categoryStats).reduce((sum, stats) => sum + stats.totalSize, 0)
    const categoriesWithDocs = visibleCategories.filter(
      key => groupedDocuments[key]?.length > 0
    ).length

    return {
      totalDocuments,
      totalSize,
      categoriesWithDocs,
      formattedSize: formatFileSize(totalSize),
    }
  }, [groupedDocuments, categoryStats, visibleCategories])

  // Persist expanded state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify([...expandedFolders]))
    } catch (error) {
      console.warn('Failed to save folder state:', error)
    }
  }, [expandedFolders, storageKey])

  // Update allExpanded state based on current folders
  useEffect(() => {
    const shouldBeAllExpanded =
      visibleCategories.length > 0 && visibleCategories.every(key => expandedFolders.has(key))
    setAllExpanded(shouldBeAllExpanded)
  }, [expandedFolders, visibleCategories])

  // Toggle individual folder
  const toggleFolder = useCallback(categoryKey => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev)
      if (newSet.has(categoryKey)) {
        newSet.delete(categoryKey)
      } else {
        newSet.add(categoryKey)
      }
      return newSet
    })
  }, [])

  // Toggle all folders
  const toggleAllFolders = useCallback(() => {
    if (allExpanded) {
      // Collapse all
      setExpandedFolders(new Set())
    } else {
      // Expand all visible categories
      setExpandedFolders(new Set(visibleCategories))
    }
  }, [allExpanded, visibleCategories])

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e, categoryKey) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        toggleFolder(categoryKey)
      }
    },
    [toggleFolder]
  )

  // Enhanced document action handler
  const handleDocumentAction = useCallback(
    (action, document) => {
      if (action === 'preview') {
        onPreview?.(document)
      } else {
        onDocumentAction?.(action, document)
      }
    },
    [onDocumentAction, onPreview]
  )

  // Enhanced document select handler
  const handleDocumentSelect = useCallback(
    document => {
      onDocumentSelect?.(document)
    },
    [onDocumentSelect]
  )

  // Handle empty states
  const emptyState = FolderEmptyState({ searchQuery, documents, overallStats })
  if (emptyState) {
    return emptyState
  }

  return (
    <div className={`document-folder-container ${className}`}>
      {/* Header with overall stats and controls */}
      <FolderHeader
        overallStats={overallStats}
        allExpanded={allExpanded}
        onToggleAllFolders={toggleAllFolders}
      />

      {/* Folder list with staggered animations */}
      <motion.div className='space-y-2'>
        <AnimatePresence>
          {visibleCategories.map((categoryKey, index) => (
            <DocumentFolderCategory
              key={categoryKey}
              categoryKey={categoryKey}
              documents={groupedDocuments[categoryKey] || []}
              stats={categoryStats[categoryKey]}
              isExpanded={expandedFolders.has(categoryKey)}
              onToggle={() => toggleFolder(categoryKey)}
              onKeyDown={e => handleKeyDown(e, categoryKey)}
              viewMode={viewMode}
              selectedIds={selectedIds}
              onDocumentSelect={handleDocumentSelect}
              onDocumentAction={handleDocumentAction}
              onPreview={onPreview}
              showVersions={showVersions}
              searchQuery={searchQuery}
              animationDelay={index * 0.1}
            />
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Loading states for individual folders */}
      <FolderLoadingState searchQuery={searchQuery} visibleCategories={visibleCategories} />
    </div>
  )
}

/**
 * Individual Folder Category Component
 */
const DocumentFolderCategory = React.memo(
  ({
    categoryKey,
    documents,
    stats,
    isExpanded,
    onToggle,
    onKeyDown,
    viewMode,
    selectedIds,
    onDocumentSelect,
    onDocumentAction,
    onPreview,
    showVersions,
    searchQuery,
    animationDelay = 0,
  }) => {
    const categoryConfig = getCategoryConfig(categoryKey)
    const hasDocuments = documents.length > 0

    // Animation variants for folder expansion
    const folderVariants = {
      initial: { opacity: 0, y: 20 },
      animate: {
        opacity: 1,
        y: 0,
        transition: { delay: animationDelay },
      },
      exit: {
        opacity: 0,
        y: -20,
        transition: { duration: 0.2 },
      },
    }

    return (
      <motion.div
        variants={folderVariants}
        initial='initial'
        animate='animate'
        exit='exit'
        className='bg-surface-soft rounded-lg border border-gray-200/8 overflow-hidden'
      >
        {/* Folder Header */}
        <FolderCategoryHeader
          categoryKey={categoryKey}
          categoryConfig={categoryConfig}
          stats={stats}
          hasDocuments={hasDocuments}
          isExpanded={isExpanded}
          searchQuery={searchQuery}
          onToggle={onToggle}
          onKeyDown={onKeyDown}
        />

        {/* Folder Content */}
        <FolderCategoryContent
          isExpanded={isExpanded}
          hasDocuments={hasDocuments}
          documents={documents}
          viewMode={viewMode}
          selectedIds={selectedIds}
          onDocumentSelect={onDocumentSelect}
          onDocumentAction={onDocumentAction}
          onPreview={onPreview}
          showVersions={showVersions}
          searchQuery={searchQuery}
        />
      </motion.div>
    )
  }
)

DocumentFolderCategory.displayName = 'DocumentFolderCategory'

export default DocumentFolder
