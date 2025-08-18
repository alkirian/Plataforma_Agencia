import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  EllipsisVerticalIcon, 
  PencilIcon, 
  TrashIcon,
  DocumentIcon,
  ArrowUpTrayIcon 
} from '@heroicons/react/24/outline';
import { Menu, Transition } from '@headlessui/react';
import { DocumentCard } from './DocumentCard';

export const BoardColumn = ({
  column,
  documents = [],
  onDocumentDrop,
  onDocumentDelete,
  onDocumentDownload,
  onEditColumn,
  onDeleteColumn,
  canReorder = false
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [draggedDocumentId, setDraggedDocumentId] = useState(null);

  // Drag & Drop handlers mejorados
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Verificar si es un documento interno o archivos externos
    const hasFiles = e.dataTransfer.types.includes('Files');
    const hasDocumentData = e.dataTransfer.types.includes('text/plain');
    
    if (hasFiles || hasDocumentData) {
      setIsDragOver(true);
      e.dataTransfer.dropEffect = 'move';
    }
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Solo desactivar si realmente salimos del área
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    // Manejar archivos externos (desde escritorio)
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      // TODO: Implementar drop directo en columna
      console.log(`Files dropped in column ${column.name}:`, files);
      return;
    }
    
    // Manejar documentos internos
    const documentData = e.dataTransfer.getData('text/plain');
    if (documentData && onDocumentDrop) {
      try {
        const { documentId, sourceColumnId } = JSON.parse(documentData);
        if (sourceColumnId !== column.id) { // Solo mover si es diferente columna
          onDocumentDrop(documentId, sourceColumnId, column.id, documents.length);
        }
      } catch (error) {
        console.error('Error parsing drop data:', error);
      }
    }
  };

  return (
    <motion.div
      className={`flex-shrink-0 w-80 bg-surface-soft border rounded-xl transition-all duration-200 ${
        isDragOver 
          ? 'border-primary-400 bg-primary-500/10 shadow-lg shadow-primary-500/25' 
          : 'border-white/10'
      }`}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      layout
      initial={{ opacity: 0, x: 50 }}
      animate={{ 
        opacity: 1, 
        x: 0,
        scale: isDragOver ? 1.02 : 1
      }}
      transition={{ duration: 0.3 }}
    >
      {/* Header de la columna */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center space-x-3">
          <div 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: column.color }}
          />
          <h4 className="font-semibold text-text-primary">{column.name}</h4>
          <span className="text-xs bg-white/10 text-text-muted px-2 py-1 rounded-full">
            {documents.length}
          </span>
        </div>

        {!column.isSystem && (
          <Menu as="div" className="relative">
            <Menu.Button className="p-1 rounded-lg hover:bg-white/10 transition-colors">
              <EllipsisVerticalIcon className="h-4 w-4 text-text-muted" />
            </Menu.Button>

            <Transition
              as={React.Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 mt-1 w-40 bg-surface-strong border border-white/10 rounded-lg shadow-lg z-50">
                <div className="p-1">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={onEditColumn}
                        className={`flex items-center w-full px-3 py-2 text-sm rounded-md ${
                          active ? 'bg-white/10 text-text-primary' : 'text-text-muted'
                        }`}
                      >
                        <PencilIcon className="h-4 w-4 mr-2" />
                        Editar
                      </button>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={onDeleteColumn}
                        className={`flex items-center w-full px-3 py-2 text-sm rounded-md ${
                          active ? 'bg-red-500/20 text-red-400' : 'text-red-400'
                        }`}
                      >
                        <TrashIcon className="h-4 w-4 mr-2" />
                        Eliminar
                      </button>
                    )}
                  </Menu.Item>
                </div>
              </Menu.Items>
            </Transition>
          </Menu>
        )}
      </div>

      {/* Área de documentos */}
      <div className="p-4 space-y-3 min-h-[300px] max-h-[500px] overflow-y-auto">
        {documents.length > 0 ? (
          documents.map((document, index) => (
            <DocumentCard
              key={document.id}
              document={document}
              columnId={column.id}
              index={index}
              onDelete={onDocumentDelete}
              onDownload={onDocumentDownload}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <DocumentIcon className="h-12 w-12 text-text-muted opacity-50 mb-2" />
            <p className="text-text-muted text-sm">
              {column.isSystem ? 'Documentos sin clasificar' : 'Arrastra documentos aquí'}
            </p>
          </div>
        )}
      </div>

      {/* Indicador de drop zone mejorado */}
      {isDragOver && (
        <motion.div
          className="absolute inset-0 border-2 border-dashed border-blue-400 bg-blue-500/10 rounded-xl flex items-center justify-center backdrop-blur-sm z-10"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex flex-col items-center gap-2">
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
              className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center"
            >
              <ArrowUpTrayIcon className="w-6 h-6 text-blue-400" />
            </motion.div>
            <div className="text-blue-400 font-semibold text-sm">
              Soltar en "{column.name}"
            </div>
            <div className="text-blue-300 text-xs opacity-80">
              Los documentos se organizarán aquí
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};