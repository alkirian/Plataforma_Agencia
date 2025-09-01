/**
 * DocumentFolder Component - Advanced Visual Folder System
 * Provides comprehensive folder-based document organization with animations,
 * search integration, and persistent state management.
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  FolderIcon,
  FolderOpenIcon,
  DocumentIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';

import DocumentGrid from './DocumentGrid';
import {
  DOCUMENT_CATEGORIES,
  groupDocumentsByCategory,
  getCategoryStats,
  getCategoryConfig,
  formatFileSize
} from '../../../utils/documentCategories';

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
  clientId = 'default'
}) => {
  // Generate unique storage key for this client
  const storageKey = `documentFolders_expanded_${clientId}`;
  
  // Load initial expanded state from localStorage
  const loadExpandedState = useCallback(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? new Set(JSON.parse(saved)) : new Set(['documents', 'images']);
    } catch {
      return new Set(['documents', 'images']); // Default expanded folders
    }
  }, [storageKey]);

  // State management
  const [expandedFolders, setExpandedFolders] = useState(loadExpandedState);
  const [allExpanded, setAllExpanded] = useState(false);

  // Process documents into categories
  const groupedDocuments = useMemo(() => {
    return groupDocumentsByCategory(documents, searchQuery);
  }, [documents, searchQuery]);

  // Calculate statistics for each category
  const categoryStats = useMemo(() => {
    return getCategoryStats(groupedDocuments);
  }, [groupedDocuments]);

  // Get categories with documents (excluding empty ones unless no search)
  const visibleCategories = useMemo(() => {
    return Object.keys(DOCUMENT_CATEGORIES).filter(categoryKey => {
      const hasDocuments = groupedDocuments[categoryKey]?.length > 0;
      // Show empty categories only when no search is active
      return hasDocuments || (!searchQuery && categoryKey !== 'others');
    });
  }, [groupedDocuments, searchQuery]);

  // Calculate overall statistics
  const overallStats = useMemo(() => {
    const totalDocuments = Object.values(groupedDocuments).reduce(
      (sum, docs) => sum + docs.length, 0
    );
    const totalSize = Object.values(categoryStats).reduce(
      (sum, stats) => sum + stats.totalSize, 0
    );
    const categoriesWithDocs = visibleCategories.filter(
      key => groupedDocuments[key]?.length > 0
    ).length;

    return {
      totalDocuments,
      totalSize,
      categoriesWithDocs,
      formattedSize: formatFileSize(totalSize)
    };
  }, [groupedDocuments, categoryStats, visibleCategories]);

  // Persist expanded state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify([...expandedFolders]));
    } catch (error) {
      console.warn('Failed to save folder state:', error);
    }
  }, [expandedFolders, storageKey]);

  // Update allExpanded state based on current folders
  useEffect(() => {
    const shouldBeAllExpanded = visibleCategories.length > 0 && 
      visibleCategories.every(key => expandedFolders.has(key));
    setAllExpanded(shouldBeAllExpanded);
  }, [expandedFolders, visibleCategories]);

  // Toggle individual folder
  const toggleFolder = useCallback((categoryKey) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryKey)) {
        newSet.delete(categoryKey);
      } else {
        newSet.add(categoryKey);
      }
      return newSet;
    });
  }, []);

  // Toggle all folders
  const toggleAllFolders = useCallback(() => {
    if (allExpanded) {
      // Collapse all
      setExpandedFolders(new Set());
    } else {
      // Expand all visible categories
      setExpandedFolders(new Set(visibleCategories));
    }
  }, [allExpanded, visibleCategories]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e, categoryKey) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleFolder(categoryKey);
    }
  }, [toggleFolder]);

  // Enhanced document action handler
  const handleDocumentAction = useCallback((action, document) => {
    if (action === 'preview') {
      onPreview?.(document);
    } else {
      onDocumentAction?.(action, document);
    }
  }, [onDocumentAction, onPreview]);

  // Enhanced document select handler
  const handleDocumentSelect = useCallback((document) => {
    onDocumentSelect?.(document);
  }, [onDocumentSelect]);

  if (documents.length === 0 && !searchQuery) {
    return (
      <div className="text-center py-12">
        <FolderIcon className="h-16 w-16 text-text-muted mx-auto mb-4" />
        <h3 className="text-lg font-medium text-text-primary mb-2">No documents yet</h3>
        <p className="text-text-muted">Upload documents to organize them into folders</p>
      </div>
    );
  }

  if (searchQuery && overallStats.totalDocuments === 0) {
    return (
      <div className="text-center py-12">
        <DocumentIcon className="h-16 w-16 text-text-muted mx-auto mb-4" />
        <h3 className="text-lg font-medium text-text-primary mb-2">No documents found</h3>
        <p className="text-text-muted">Try adjusting your search terms</p>
      </div>
    );
  }

  return (
    <div className={`document-folder-container ${className}`}>
      {/* Header with overall stats and controls */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-surface-soft rounded-lg border border-border-muted p-4 mb-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <FolderOpenIcon className="h-5 w-5 text-primary-500" />
              <h2 className="text-lg font-semibold text-text-primary">
                Document Folders
              </h2>
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-text-muted">
              <span>
                {overallStats.totalDocuments} document{overallStats.totalDocuments !== 1 ? 's' : ''}
              </span>
              <span>•</span>
              <span>{overallStats.formattedSize}</span>
              <span>•</span>
              <span>
                {overallStats.categoriesWithDocs} categor{overallStats.categoriesWithDocs !== 1 ? 'ies' : 'y'}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <motion.button
              onClick={toggleAllFolders}
              className="flex items-center space-x-2 px-3 py-1.5 text-sm bg-surface-muted hover:bg-surface-pressed rounded-md transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {allExpanded ? (
                <>
                  <EyeSlashIcon className="h-4 w-4" />
                  <span>Collapse All</span>
                </>
              ) : (
                <>
                  <EyeIcon className="h-4 w-4" />
                  <span>Expand All</span>
                </>
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Folder list with staggered animations */}
      <motion.div className="space-y-4">
        <AnimatePresence>
          {visibleCategories.map((categoryKey, index) => (
            <DocumentFolderCategory
              key={categoryKey}
              categoryKey={categoryKey}
              documents={groupedDocuments[categoryKey] || []}
              stats={categoryStats[categoryKey]}
              isExpanded={expandedFolders.has(categoryKey)}
              onToggle={() => toggleFolder(categoryKey)}
              onKeyDown={(e) => handleKeyDown(e, categoryKey)}
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
      {visibleCategories.length === 0 && searchQuery && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          {[...Array(3)].map((_, i) => (
            <FolderSkeleton key={i} />
          ))}
        </motion.div>
      )}
    </div>
  );
};

/**
 * Individual Folder Category Component
 */
const DocumentFolderCategory = React.memo(({
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
  animationDelay = 0
}) => {
  const categoryConfig = getCategoryConfig(categoryKey);
  const hasDocuments = documents.length > 0;
  
  // Animation variants for folder expansion
  const folderVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: { delay: animationDelay }
    },
    exit: { 
      opacity: 0, 
      y: -20,
      transition: { duration: 0.2 }
    }
  };

  const contentVariants = {
    collapsed: { 
      height: 0,
      opacity: 0,
      transition: { duration: 0.3, ease: 'easeInOut' }
    },
    expanded: { 
      height: 'auto',
      opacity: 1,
      transition: { duration: 0.3, ease: 'easeInOut' }
    }
  };

  const headerVariants = {
    rest: { scale: 1 },
    hover: { scale: 1.01 },
    tap: { scale: 0.99 }
  };

  return (
    <motion.div
      variants={folderVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="bg-white rounded-lg border border-border-muted shadow-sm overflow-hidden"
    >
      {/* Folder Header */}
      <motion.div
        variants={headerVariants}
        initial="rest"
        whileHover="hover"
        whileTap="tap"
        className={`
          flex items-center justify-between p-4 cursor-pointer transition-all
          ${hasDocuments 
            ? 'hover:bg-surface-soft' 
            : 'opacity-50 cursor-not-allowed'
          }
          ${categoryConfig.bgColor}
        `}
        onClick={hasDocuments ? onToggle : undefined}
        onKeyDown={hasDocuments ? onKeyDown : undefined}
        tabIndex={hasDocuments ? 0 : -1}
        role="button"
        aria-expanded={isExpanded}
        aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${categoryConfig.label} folder`}
      >
        <div className="flex items-center space-x-3">
          {/* Expand/Collapse Icon */}
          <motion.div
            animate={{ rotate: isExpanded ? 90 : 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          >
            {hasDocuments ? (
              <ChevronRightIcon className="h-5 w-5 text-text-muted" />
            ) : (
              <div className="h-5 w-5" />
            )}
          </motion.div>

          {/* Category Icon */}
          <div className="text-2xl" role="img" aria-label={categoryConfig.label}>
            {categoryConfig.icon}
          </div>

          {/* Category Info */}
          <div className="flex items-center space-x-3">
            <h3 className={`font-medium ${categoryConfig.textColor}`}>
              {categoryConfig.label}
            </h3>
            
            <div className="flex items-center space-x-2 text-sm text-text-muted">
              <span>
                ({stats?.count || 0})
              </span>
              {stats?.formattedSize && (
                <>
                  <span>•</span>
                  <span>{stats.formattedSize}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Status indicators */}
        <div className="flex items-center space-x-2">
          {!hasDocuments && !searchQuery && (
            <span className="text-xs text-text-muted bg-surface-muted px-2 py-1 rounded">
              Empty
            </span>
          )}
          
          {searchQuery && !hasDocuments && (
            <span className="text-xs text-text-muted bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
              No matches
            </span>
          )}
          
          {hasDocuments && (
            <motion.div
              className={`w-3 h-3 rounded-full ${
                isExpanded ? 'bg-green-400' : 'bg-gray-300'
              }`}
              animate={{ 
                scale: isExpanded ? [1, 1.2, 1] : 1,
                backgroundColor: isExpanded ? '#4ade80' : '#d1d5db'
              }}
              transition={{ duration: 0.3 }}
            />
          )}
        </div>
      </motion.div>

      {/* Folder Content */}
      <AnimatePresence>
        {isExpanded && hasDocuments && (
          <motion.div
            variants={contentVariants}
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
            className="overflow-hidden"
          >
            <div className="p-4 pt-0 border-t border-border-muted/50">
              {/* Document Grid */}
              <DocumentGrid
                documents={documents}
                viewMode={viewMode}
                isLoading={false}
                selectedIds={selectedIds}
                onDocumentSelect={onDocumentSelect}
                onDocumentAction={onDocumentAction}
                onPreview={onPreview}
                showVersions={showVersions}
                className="transition-all duration-300"
              />
              
              {/* Folder Footer with additional info */}
              {documents.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="mt-4 pt-3 border-t border-border-muted/50 text-xs text-text-muted"
                >
                  <div className="flex items-center justify-between">
                    <span>
                      Showing {documents.length} document{documents.length !== 1 ? 's' : ''}
                      {searchQuery && ` matching "${searchQuery}"`}
                    </span>
                    
                    <div className="flex items-center space-x-3">
                      <span>Last updated: {new Date(Math.max(...documents.map(d => new Date(d.createdAt)))).toLocaleDateString()}</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

DocumentFolderCategory.displayName = 'DocumentFolderCategory';

/**
 * Loading skeleton for folders
 */
const FolderSkeleton = () => (
  <div className="bg-white rounded-lg border border-border-muted shadow-sm">
    <div className="flex items-center justify-between p-4">
      <div className="flex items-center space-x-3">
        <div className="h-5 w-5 bg-surface-muted rounded animate-pulse" />
        <div className="h-6 w-6 bg-surface-muted rounded animate-pulse" />
        <div className="h-5 w-32 bg-surface-muted rounded animate-pulse" />
        <div className="h-4 w-16 bg-surface-muted rounded animate-pulse" />
      </div>
      <div className="h-3 w-3 bg-surface-muted rounded-full animate-pulse" />
    </div>
  </div>
);

export default DocumentFolder;