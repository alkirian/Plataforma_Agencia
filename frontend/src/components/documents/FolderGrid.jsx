import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PlusIcon, 
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  Squares2X2Icon,
  ListBulletIcon
} from '@heroicons/react/24/outline';
import { FolderCard } from './FolderCard';
import { DocumentList } from './DocumentList';
import { SimpleFolderModal } from './SimpleFolderModal';

export const FolderGrid = ({ 
  folders = [], 
  documents = [],
  currentFolderId,
  onFolderSelect,
  onCreateFolder,
  onEditFolder,
  onDeleteFolder,
  onDocumentDelete,
  onDocumentDownload,
  onDocumentDrop,
  isLoading = false 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [folderModal, setFolderModal] = useState({
    isOpen: false,
    folder: null,
    isEditing: false
  });

  // Filtrar carpetas por búsqueda
  const filteredFolders = folders.filter(folder =>
    folder.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    folder.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Obtener carpeta actual
  const currentFolder = currentFolderId 
    ? folders.find(f => f.id === currentFolderId)
    : null;

  // Obtener documentos de la carpeta actual
  const currentDocuments = currentFolderId
    ? documents.filter(doc => {
        const folder = folders.find(f => f.id === currentFolderId);
        return folder ? folder.filter(doc) : false;
      })
    : [];

  const handleBack = () => {
    onFolderSelect(null);
  };

  const handleCreateFolder = () => {
    setFolderModal({
      isOpen: true,
      folder: null,
      isEditing: false
    });
  };

  const handleEditFolder = (folder) => {
    setFolderModal({
      isOpen: true,
      folder,
      isEditing: true
    });
  };

  const handleSaveFolder = async (folderData) => {
    if (folderModal.isEditing) {
      await onEditFolder(folderModal.folder.id, folderData);
    } else {
      await onCreateFolder(folderData);
    }
    setFolderModal({ isOpen: false, folder: null, isEditing: false });
  };

  const handleDeleteFolder = async (folder) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar la carpeta "${folder.name}"?`)) {
      await onDeleteFolder(folder.id);
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  const handleDocumentDrop = (document, folder) => {
    if (onDocumentDrop) {
      onDocumentDrop(document, folder);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-white/5 rounded-xl p-6 h-48 animate-pulse" />
        ))}
      </div>
    );
  }

  // Vista de documentos dentro de una carpeta
  if (currentFolderId && currentFolder) {
    return (
      <div className="space-y-6">
        {/* Header de la carpeta */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleBack}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors text-text-muted hover:text-text-primary"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            
            <div className="flex items-center space-x-3">
              <div 
                className="p-3 rounded-xl"
                style={{ backgroundColor: `${currentFolder.color}20` }}
              >
                <span className="text-2xl">{currentFolder.icon}</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-text-primary">
                  {currentFolder.name}
                </h2>
                <p className="text-text-muted">
                  {currentFolder.description} • {currentDocuments.length} documentos
                </p>
              </div>
            </div>
          </div>

          {/* Toggle de vista */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-primary-500/20 text-primary-400' 
                  : 'text-text-muted hover:text-text-primary hover:bg-white/5'
              }`}
            >
              <Squares2X2Icon className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list' 
                  ? 'bg-primary-500/20 text-primary-400' 
                  : 'text-text-muted hover:text-text-primary hover:bg-white/5'
              }`}
            >
              <ListBulletIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Lista de documentos */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          {currentDocuments.length > 0 ? (
            <DocumentList
              documents={currentDocuments}
              onDelete={onDocumentDelete}
              onDownload={onDocumentDownload}
              viewMode={viewMode}
            />
          ) : (
            <div className="text-center py-12">
              <div 
                className="w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: `${currentFolder.color}20` }}
              >
                <span className="text-4xl">{currentFolder.icon}</span>
              </div>
              <h3 className="text-lg font-medium text-text-primary mb-2">
                Carpeta vacía
              </h3>
              <p className="text-text-muted">
                No hay documentos en esta carpeta todavía
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Vista principal del grid de carpetas
  return (
    <div className="space-y-6">
      {/* Header con búsqueda y crear carpeta */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* Búsqueda */}
        <div className="relative flex-1 max-w-md">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-text-muted" />
          <input
            type="text"
            placeholder="Buscar carpetas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-10 py-3 bg-white/5 border border-white/20 rounded-lg text-text-primary placeholder-text-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
          {searchTerm && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded hover:bg-white/10 transition-colors"
            >
              <XMarkIcon className="h-4 w-4 text-text-muted" />
            </button>
          )}
        </div>

        {/* Botón crear carpeta */}
        <motion.button
          onClick={handleCreateFolder}
          className="flex items-center space-x-2 px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors font-medium"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <PlusIcon className="h-5 w-5" />
          <span>Nueva Carpeta</span>
        </motion.button>
      </div>

      {/* Grid de carpetas */}
      <AnimatePresence mode="wait">
        {filteredFolders.length > 0 ? (
          <motion.div
            key="folders-grid"
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {filteredFolders.map((folder, index) => (
              <motion.div
                key={folder.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <FolderCard
                  folder={folder}
                  documentCount={folder.count || 0}
                  onClick={() => onFolderSelect(folder.id)}
                  onEdit={handleEditFolder}
                  onDelete={handleDeleteFolder}
                  onDrop={handleDocumentDrop}
                  isCustom={folder.custom}
                />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="empty-state"
            className="text-center py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="w-20 h-20 mx-auto mb-4 bg-white/5 rounded-2xl flex items-center justify-center">
              <Squares2X2Icon className="h-10 w-10 text-text-muted" />
            </div>
            <h3 className="text-lg font-medium text-text-primary mb-2">
              {searchTerm ? 'No se encontraron carpetas' : 'No hay carpetas'}
            </h3>
            <p className="text-text-muted mb-6">
              {searchTerm 
                ? 'Intenta con otros términos de búsqueda'
                : 'Crea tu primera carpeta para organizar los documentos'
              }
            </p>
            {searchTerm ? (
              <button
                onClick={clearSearch}
                className="text-primary-400 hover:text-primary-300 transition-colors"
              >
                Limpiar búsqueda
              </button>
            ) : (
              <button
                onClick={handleCreateFolder}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
              >
                <PlusIcon className="h-4 w-4" />
                <span>Crear primera carpeta</span>
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de carpeta */}
      <SimpleFolderModal
        isOpen={folderModal.isOpen}
        onClose={() => setFolderModal({ isOpen: false, folder: null, isEditing: false })}
        onSave={handleSaveFolder}
        folder={folderModal.folder}
        isEditing={folderModal.isEditing}
      />
    </div>
  );
};