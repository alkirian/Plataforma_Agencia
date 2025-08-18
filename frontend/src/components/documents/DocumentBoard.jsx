import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { BoardColumn } from './BoardColumn';
import { ColumnModal } from './ColumnModal';
import { useDocumentBoard } from '../../hooks/useDocumentBoard';

export const DocumentBoard = ({ 
  documents = [], 
  clientId,
  onDocumentDelete,
  onDocumentDownload 
}) => {
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [editingColumn, setEditingColumn] = useState(null);

  // Hook personalizado para manejar el tablero
  const {
    columns,
    unassignedDocuments,
    createColumn,
    updateColumn,
    deleteColumn,
    moveDocument,
    reorderColumns,
    stats
  } = useDocumentBoard(clientId, documents);

  const handleCreateColumn = () => {
    setEditingColumn(null);
    setIsColumnModalOpen(true);
  };

  const handleEditColumn = (column) => {
    setEditingColumn(column);
    setIsColumnModalOpen(true);
  };

  const handleSaveColumn = async (columnData) => {
    if (editingColumn) {
      await updateColumn(editingColumn.id, columnData);
    } else {
      await createColumn(columnData);
    }
    setIsColumnModalOpen(false);
    setEditingColumn(null);
  };

  const handleDeleteColumn = async (columnId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta columna? Los documentos se moverán a "Sin clasificar".')) {
      await deleteColumn(columnId);
    }
  };

  // Manejar drag & drop entre columnas
  const handleDocumentDrop = async (documentId, sourceColumnId, targetColumnId, targetIndex) => {
    await moveDocument(documentId, sourceColumnId, targetColumnId, targetIndex);
  };

  return (
    <div className="space-y-6">
      {/* Header del tablero */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h3 className="text-xl font-bold text-text-primary">📋 Tablero de Documentos</h3>
          {stats.totalDocuments > 0 && (
            <div className="text-sm text-text-muted">
              {stats.totalDocuments} documentos • {stats.totalColumns} columnas
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <motion.button
            onClick={handleCreateColumn}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors font-medium"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <PlusIcon className="h-4 w-4" />
            <span>Nueva Columna</span>
          </motion.button>
        </div>
      </div>

      {/* Tablero de columnas */}
      <div className="flex space-x-4 overflow-x-auto pb-4">
        {/* Columna "Sin clasificar" siempre presente */}
        <BoardColumn
          key="unassigned"
          column={{
            id: 'unassigned',
            name: 'Sin clasificar',
            color: '#6b7280',
            isSystem: true
          }}
          documents={unassignedDocuments}
          onDocumentDrop={handleDocumentDrop}
          onDocumentDelete={onDocumentDelete}
          onDocumentDownload={onDocumentDownload}
          onEditColumn={() => {}} // No se puede editar
          onDeleteColumn={() => {}} // No se puede eliminar
        />

        {/* Columnas personalizadas */}
        {columns.map((column, index) => (
          <BoardColumn
            key={column.id}
            column={column}
            documents={column.documents}
            onDocumentDrop={handleDocumentDrop}
            onDocumentDelete={onDocumentDelete}
            onDocumentDownload={onDocumentDownload}
            onEditColumn={() => handleEditColumn(column)}
            onDeleteColumn={() => handleDeleteColumn(column.id)}
            canReorder={true}
          />
        ))}

        {/* Botón para agregar columna (placeholder visual) */}
        {columns.length === 0 && (
          <motion.div
            className="flex-shrink-0 w-80 h-96 border-2 border-dashed border-white/20 rounded-xl flex items-center justify-center cursor-pointer hover:border-primary-500/50 hover:bg-primary-500/10 transition-colors"
            onClick={handleCreateColumn}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="text-center">
              <PlusIcon className="h-12 w-12 text-text-muted mx-auto mb-2" />
              <p className="text-text-muted font-medium">Crear primera columna</p>
              <p className="text-text-muted text-sm">Organiza tus documentos</p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Modal de columna */}
      <ColumnModal
        isOpen={isColumnModalOpen}
        onClose={() => {
          setIsColumnModalOpen(false);
          setEditingColumn(null);
        }}
        onSave={handleSaveColumn}
        column={editingColumn}
        isEditing={!!editingColumn}
      />
    </div>
  );
};