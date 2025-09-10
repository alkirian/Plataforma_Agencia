/**
 * useDocumentBoard.ts - Document Board Management Hook with TypeScript
 * Enhanced with type safety and optional integration with shared document core
 */

import { useState, useMemo, useCallback, useEffect } from 'react'
import { useDocumentsCore } from '@shared/hooks/useDocumentsCore'
import type {
  DocumentV2,
  DocumentBoardColumn,
  DocumentBoardStats,
  UseDocumentBoardReturn,
  DocumentQueryParams,
} from '@shared/types/document.types'

// Storage key generators with proper typing
const getStorageKey = (clientId: string, type: 'columns' | 'assignments'): string =>
  `document_board_${clientId}_${type}`

// Type-safe localStorage operations
interface StorageOperations {
  loadClientData: <T>(clientId: string, type: 'columns' | 'assignments', defaultValue: T) => T
  saveClientData: <T>(clientId: string, type: 'columns' | 'assignments', data: T) => void
}

const storage: StorageOperations = {
  loadClientData: <T>(clientId: string, type: 'columns' | 'assignments', defaultValue: T): T => {
    try {
      const saved = localStorage.getItem(getStorageKey(clientId, type))
      return saved ? JSON.parse(saved) : defaultValue
    } catch (error) {
      console.warn(`Error loading ${type} for client ${clientId}:`, error)
      return defaultValue
    }
  },

  saveClientData: <T>(clientId: string, type: 'columns' | 'assignments', data: T): void => {
    try {
      localStorage.setItem(getStorageKey(clientId, type), JSON.stringify(data))
    } catch (error) {
      console.warn(`Error saving ${type} for client ${clientId}:`, error)
    }
  },
}

// Document assignments type (mapping document IDs to column IDs)
type DocumentAssignments = Record<string, string>

// Enhanced column type with UI methods
interface EnhancedDocumentBoardColumn extends DocumentBoardColumn {
  documents: DocumentV2[]

  // Utility methods
  getDocumentCount: () => number
  isEmpty: () => boolean
  hasDocument: (documentId: string | number) => boolean
  getDocumentById: (documentId: string | number) => DocumentV2 | undefined
}

class DocumentBoardColumnImpl implements EnhancedDocumentBoardColumn {
  id: string
  name: string
  color?: string
  order: number
  createdAt?: string
  updatedAt?: string
  documents: DocumentV2[] = []

  constructor(data: DocumentBoardColumn) {
    this.id = data.id
    this.name = data.name
    this.color = data.color
    this.order = data.order
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
  }

  getDocumentCount(): number {
    return this.documents.length
  }

  isEmpty(): boolean {
    return this.documents.length === 0
  }

  hasDocument(documentId: string | number): boolean {
    return this.documents.some(doc => doc.id === documentId)
  }

  getDocumentById(documentId: string | number): DocumentV2 | undefined {
    return this.documents.find(doc => doc.id === documentId)
  }
}

// Hook configuration
export interface UseDocumentBoardConfig {
  useSharedDocuments?: boolean
  documentQueryParams?: Partial<DocumentQueryParams>
  enablePersistence?: boolean
  autoSave?: boolean
  validateColumns?: boolean
}

// Operation result types
interface OperationResult {
  success: boolean
  error?: string
}

interface ColumnOperationResult extends OperationResult {
  column?: EnhancedDocumentBoardColumn
}

/**
 * Enhanced Document Board Hook with TypeScript support and optional shared document integration
 */
export function useDocumentBoard(
  clientId: string,
  documents: DocumentV2[] = [],
  config: UseDocumentBoardConfig = {}
): UseDocumentBoardReturn {
  const {
    useSharedDocuments = false,
    documentQueryParams = {},
    enablePersistence = true,
    autoSave = true,
    validateColumns = true,
  } = config

  // Optional integration with shared document core
  const sharedDocuments = useDocumentCore(
    clientId,
    useSharedDocuments ? { defaultParams: documentQueryParams } : undefined
  )

  // Use shared documents if enabled, otherwise use provided documents
  const effectiveDocuments = useSharedDocuments ? sharedDocuments?.documents || [] : documents

  // Local state with type safety
  const [columns, setColumns] = useState<DocumentBoardColumn[]>(() =>
    enablePersistence ? storage.loadClientData(clientId, 'columns', []) : []
  )

  const [documentAssignments, setDocumentAssignments] = useState<DocumentAssignments>(() =>
    enablePersistence ? storage.loadClientData(clientId, 'assignments', {}) : {}
  )

  const [refreshKey, setRefreshKey] = useState(0)

  // Load data when client changes
  useEffect(() => {
    if (enablePersistence) {
      setColumns(storage.loadClientData(clientId, 'columns', []))
      setDocumentAssignments(storage.loadClientData(clientId, 'assignments', {}))
    }
  }, [clientId, enablePersistence])

  // Auto-save when data changes
  useEffect(() => {
    if (autoSave && enablePersistence) {
      storage.saveClientData(clientId, 'columns', columns)
    }
  }, [columns, clientId, autoSave, enablePersistence])

  useEffect(() => {
    if (autoSave && enablePersistence) {
      storage.saveClientData(clientId, 'assignments', documentAssignments)
    }
  }, [documentAssignments, clientId, autoSave, enablePersistence])

  // Organize documents according to assignments with enhanced columns
  const organizedData = useMemo(() => {
    const enhancedColumns = columns.map(column => {
      const columnImpl = new DocumentBoardColumnImpl(column)

      // Assign documents to this column using string comparison for consistency
      columnImpl.documents = effectiveDocuments.filter(
        doc => documentAssignments[String(doc.id)] === column.id
      )

      return columnImpl
    })

    // Sort columns by order
    enhancedColumns.sort((a, b) => a.order - b.order)

    // Find unassigned documents
    const assignedDocumentIds = new Set(Object.keys(documentAssignments))
    const unassignedDocuments = effectiveDocuments.filter(
      doc => !assignedDocumentIds.has(String(doc.id))
    )

    return {
      columns: enhancedColumns,
      unassignedDocuments,
    }
  }, [columns, effectiveDocuments, documentAssignments, refreshKey])

  // Column validation
  const validateColumnData = useCallback(
    (columnData: Partial<DocumentBoardColumn>): string[] => {
      const errors: string[] = []

      if (!columnData.name || columnData.name.trim().length === 0) {
        errors.push('Column name is required')
      }

      if (columnData.name && columnData.name.length > 100) {
        errors.push('Column name must be less than 100 characters')
      }

      if (columns.some(col => col.name === columnData.name && col.id !== columnData.id)) {
        errors.push('Column name must be unique')
      }

      return errors
    },
    [columns]
  )

  // Create new column
  const createColumn = useCallback(
    async (columnData: Omit<DocumentBoardColumn, 'id'>): Promise<ColumnOperationResult> => {
      try {
        if (validateColumns) {
          const errors = validateColumnData(columnData)
          if (errors.length > 0) {
            return { success: false, error: errors.join(', ') }
          }
        }

        const newColumn: DocumentBoardColumn = {
          ...columnData,
          id: `col-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          order: columnData.order ?? columns.length,
          createdAt: new Date().toISOString(),
        }

        const updatedColumns = [...columns, newColumn]
        setColumns(updatedColumns)

        if (enablePersistence && !autoSave) {
          storage.saveClientData(clientId, 'columns', updatedColumns)
        }

        setRefreshKey(prev => prev + 1)

        const enhancedColumn = new DocumentBoardColumnImpl(newColumn)
        return { success: true, column: enhancedColumn }
      } catch (error) {
        console.error('Error creating column:', error)
        return { success: false, error: (error as Error).message }
      }
    },
    [columns, clientId, enablePersistence, autoSave, validateColumns, validateColumnData]
  )

  // Update existing column
  const updateColumn = useCallback(
    async (columnId: string, updates: Partial<DocumentBoardColumn>): Promise<OperationResult> => {
      try {
        if (validateColumns) {
          const errors = validateColumnData({ ...updates, id: columnId })
          if (errors.length > 0) {
            return { success: false, error: errors.join(', ') }
          }
        }

        const updatedColumns = columns.map(column =>
          column.id === columnId
            ? { ...column, ...updates, updatedAt: new Date().toISOString() }
            : column
        )

        setColumns(updatedColumns)

        if (enablePersistence && !autoSave) {
          storage.saveClientData(clientId, 'columns', updatedColumns)
        }

        setRefreshKey(prev => prev + 1)
        return { success: true }
      } catch (error) {
        console.error('Error updating column:', error)
        return { success: false, error: (error as Error).message }
      }
    },
    [columns, clientId, enablePersistence, autoSave, validateColumns, validateColumnData]
  )

  // Delete column
  const deleteColumn = useCallback(
    async (columnId: string): Promise<OperationResult> => {
      try {
        // Remove the column
        const filteredColumns = columns.filter(column => column.id !== columnId)
        setColumns(filteredColumns)

        // Remove document assignments to this column
        const updatedAssignments = { ...documentAssignments }
        Object.keys(updatedAssignments).forEach(docId => {
          if (updatedAssignments[docId] === columnId) {
            delete updatedAssignments[docId]
          }
        })

        setDocumentAssignments(updatedAssignments)

        if (enablePersistence && !autoSave) {
          storage.saveClientData(clientId, 'columns', filteredColumns)
          storage.saveClientData(clientId, 'assignments', updatedAssignments)
        }

        setRefreshKey(prev => prev + 1)
        return { success: true }
      } catch (error) {
        console.error('Error deleting column:', error)
        return { success: false, error: (error as Error).message }
      }
    },
    [columns, documentAssignments, clientId, enablePersistence, autoSave]
  )

  // Move document between columns
  const moveDocument = useCallback(
    async (
      documentId: string | number,
      sourceColumnId: string,
      targetColumnId: string,
      targetIndex?: number
    ): Promise<OperationResult> => {
      try {
        const updatedAssignments = { ...documentAssignments }
        const docKey = String(documentId)

        if (targetColumnId === 'unassigned') {
          // Move to unassigned (remove assignment)
          delete updatedAssignments[docKey]
        } else {
          // Assign to specific column
          updatedAssignments[docKey] = targetColumnId
        }

        setDocumentAssignments(updatedAssignments)

        if (enablePersistence && !autoSave) {
          storage.saveClientData(clientId, 'assignments', updatedAssignments)
        }

        setRefreshKey(prev => prev + 1)
        return { success: true }
      } catch (error) {
        console.error('Error moving document:', error)
        return { success: false, error: (error as Error).message }
      }
    },
    [documentAssignments, clientId, enablePersistence, autoSave]
  )

  // Reorder columns
  const reorderColumns = useCallback(
    async (sourceIndex: number, targetIndex: number): Promise<OperationResult> => {
      try {
        const reorderedColumns = [...columns]
        const [movedColumn] = reorderedColumns.splice(sourceIndex, 1)
        reorderedColumns.splice(targetIndex, 0, movedColumn)

        // Update order values
        const updatedColumns = reorderedColumns.map((column, index) => ({
          ...column,
          order: index,
          updatedAt: new Date().toISOString(),
        }))

        setColumns(updatedColumns)

        if (enablePersistence && !autoSave) {
          storage.saveClientData(clientId, 'columns', updatedColumns)
        }

        setRefreshKey(prev => prev + 1)
        return { success: true }
      } catch (error) {
        console.error('Error reordering columns:', error)
        return { success: false, error: (error as Error).message }
      }
    },
    [columns, clientId, enablePersistence, autoSave]
  )

  // Calculate statistics
  const stats: DocumentBoardStats = useMemo(() => {
    const totalDocuments = effectiveDocuments.length
    const totalColumns = columns.length
    const organizedDocuments = Object.keys(documentAssignments).length

    return {
      totalDocuments,
      totalColumns,
      organizedDocuments,
      unorganizedDocuments: totalDocuments - organizedDocuments,
    }
  }, [effectiveDocuments.length, columns.length, documentAssignments])

  // Additional utility functions
  const getColumnById = useCallback(
    (columnId: string): EnhancedDocumentBoardColumn | undefined => {
      return organizedData.columns.find(col => col.id === columnId)
    },
    [organizedData.columns]
  )

  const getDocumentColumn = useCallback(
    (documentId: string | number): EnhancedDocumentBoardColumn | null => {
      const columnId = documentAssignments[String(documentId)]
      return columnId ? getColumnById(columnId) || null : null
    },
    [documentAssignments, getColumnById]
  )

  const bulkMoveDocuments = useCallback(
    async (
      documentIds: Array<string | number>,
      targetColumnId: string
    ): Promise<OperationResult> => {
      try {
        const updatedAssignments = { ...documentAssignments }

        documentIds.forEach(docId => {
          const docKey = String(docId)
          if (targetColumnId === 'unassigned') {
            delete updatedAssignments[docKey]
          } else {
            updatedAssignments[docKey] = targetColumnId
          }
        })

        setDocumentAssignments(updatedAssignments)

        if (enablePersistence && !autoSave) {
          storage.saveClientData(clientId, 'assignments', updatedAssignments)
        }

        setRefreshKey(prev => prev + 1)
        return { success: true }
      } catch (error) {
        console.error('Error in bulk move:', error)
        return { success: false, error: (error as Error).message }
      }
    },
    [documentAssignments, clientId, enablePersistence, autoSave]
  )

  return {
    // Main data
    columns: organizedData.columns,
    unassignedDocuments: organizedData.unassignedDocuments,
    stats,

    // Core actions
    createColumn,
    updateColumn,
    deleteColumn,
    moveDocument,
    reorderColumns,

    // Utility functions
    isEmpty: effectiveDocuments.length === 0,
    hasColumns: columns.length > 0,
    getColumnById,
    getDocumentColumn,
    bulkMoveDocuments,
  }
}

// Helper function to conditionally use core hook
function useDocumentCore(clientId: string, config?: any) {
  const shouldUse = !!config
  return shouldUse ? useDocumentsCore(clientId, config) : null
}

export default useDocumentBoard
