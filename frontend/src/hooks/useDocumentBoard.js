import { useState, useMemo, useCallback, useEffect } from 'react';

// Claves de localStorage específicas por cliente
const getStorageKey = (clientId, type) => `document_board_${clientId}_${type}`;

// Cargar datos del localStorage
const loadClientData = (clientId, type) => {
  try {
    const saved = localStorage.getItem(getStorageKey(clientId, type));
    return saved ? JSON.parse(saved) : (type === 'columns' ? [] : {});
  } catch (error) {
    console.warn(`Error loading ${type} for client ${clientId}:`, error);
    return type === 'columns' ? [] : {};
  }
};

// Guardar datos en localStorage
const saveClientData = (clientId, type, data) => {
  try {
    localStorage.setItem(getStorageKey(clientId, type), JSON.stringify(data));
  } catch (error) {
    console.warn(`Error saving ${type} for client ${clientId}:`, error);
  }
};

export const useDocumentBoard = (clientId, documents = []) => {
  const [columns, setColumns] = useState(() => loadClientData(clientId, 'columns'));
  const [documentAssignments, setDocumentAssignments] = useState(() => loadClientData(clientId, 'assignments'));
  const [refreshKey, setRefreshKey] = useState(0);

  // Efecto para cargar datos cuando cambia el cliente
  useEffect(() => {
    setColumns(loadClientData(clientId, 'columns'));
    setDocumentAssignments(loadClientData(clientId, 'assignments'));
  }, [clientId]);

  // Organizar documentos según asignaciones
  const organizedData = useMemo(() => {
    const columnsWithDocs = columns.map(column => ({
      ...column,
      documents: documents.filter(doc => documentAssignments[doc.id] === column.id)
    }));

    const assignedDocumentIds = new Set(Object.keys(documentAssignments));
    const unassignedDocuments = documents.filter(doc => !assignedDocumentIds.has(doc.id));

    return {
      columns: columnsWithDocs.sort((a, b) => a.order - b.order),
      unassignedDocuments
    };
  }, [columns, documents, documentAssignments, refreshKey]);

  // Crear nueva columna
  const createColumn = useCallback(async (columnData) => {
    try {
      const newColumns = [...columns, columnData];
      setColumns(newColumns);
      saveClientData(clientId, 'columns', newColumns);
      setRefreshKey(prev => prev + 1);
      return { success: true, column: columnData };
    } catch (error) {
      console.error('Error creating column:', error);
      return { success: false, error: error.message };
    }
  }, [columns, clientId]);

  // Actualizar columna existente
  const updateColumn = useCallback(async (columnId, updates) => {
    try {
      const updatedColumns = columns.map(column => 
        column.id === columnId ? { ...column, ...updates } : column
      );
      setColumns(updatedColumns);
      saveClientData(clientId, 'columns', updatedColumns);
      setRefreshKey(prev => prev + 1);
      return { success: true };
    } catch (error) {
      console.error('Error updating column:', error);
      return { success: false, error: error.message };
    }
  }, [columns, clientId]);

  // Eliminar columna
  const deleteColumn = useCallback(async (columnId) => {
    try {
      // Remover la columna
      const filteredColumns = columns.filter(column => column.id !== columnId);
      setColumns(filteredColumns);
      saveClientData(clientId, 'columns', filteredColumns);

      // Remover asignaciones de documentos a esta columna
      const updatedAssignments = { ...documentAssignments };
      Object.keys(updatedAssignments).forEach(docId => {
        if (updatedAssignments[docId] === columnId) {
          delete updatedAssignments[docId];
        }
      });
      setDocumentAssignments(updatedAssignments);
      saveClientData(clientId, 'assignments', updatedAssignments);

      setRefreshKey(prev => prev + 1);
      return { success: true };
    } catch (error) {
      console.error('Error deleting column:', error);
      return { success: false, error: error.message };
    }
  }, [columns, documentAssignments, clientId]);

  // Mover documento entre columnas
  const moveDocument = useCallback(async (documentId, sourceColumnId, targetColumnId, targetIndex) => {
    try {
      const updatedAssignments = { ...documentAssignments };
      
      if (targetColumnId === 'unassigned') {
        // Mover a sin clasificar (remover asignación)
        delete updatedAssignments[documentId];
      } else {
        // Asignar a columna específica
        updatedAssignments[documentId] = targetColumnId;
      }

      setDocumentAssignments(updatedAssignments);
      saveClientData(clientId, 'assignments', updatedAssignments);
      setRefreshKey(prev => prev + 1);

      return { success: true };
    } catch (error) {
      console.error('Error moving document:', error);
      return { success: false, error: error.message };
    }
  }, [documentAssignments, clientId]);

  // Reordenar columnas
  const reorderColumns = useCallback(async (sourceIndex, targetIndex) => {
    try {
      const reorderedColumns = [...columns];
      const [movedColumn] = reorderedColumns.splice(sourceIndex, 1);
      reorderedColumns.splice(targetIndex, 0, movedColumn);

      // Actualizar órdenes
      const updatedColumns = reorderedColumns.map((column, index) => ({
        ...column,
        order: index
      }));

      setColumns(updatedColumns);
      saveClientData(clientId, 'columns', updatedColumns);
      setRefreshKey(prev => prev + 1);

      return { success: true };
    } catch (error) {
      console.error('Error reordering columns:', error);
      return { success: false, error: error.message };
    }
  }, [columns, clientId]);

  // Obtener estadísticas
  const stats = useMemo(() => {
    const totalDocuments = documents.length;
    const totalColumns = columns.length;
    const organizedDocuments = Object.keys(documentAssignments).length;

    return {
      totalDocuments,
      totalColumns,
      organizedDocuments,
      unorganizedDocuments: totalDocuments - organizedDocuments
    };
  }, [documents.length, columns.length, documentAssignments]);

  return {
    // Datos organizados
    columns: organizedData.columns,
    unassignedDocuments: organizedData.unassignedDocuments,
    stats,

    // Acciones
    createColumn,
    updateColumn,
    deleteColumn,
    moveDocument,
    reorderColumns,

    // Utilidades
    isEmpty: documents.length === 0,
    hasColumns: columns.length > 0
  };
};