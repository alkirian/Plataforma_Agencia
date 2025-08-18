import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  DocumentIcon,
  EllipsisVerticalIcon,
  TrashIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import { Menu, Transition } from '@headlessui/react';
import { FolderIcon } from '../ui/FolderIcon';

export const FolderCard = ({ 
  folder, 
  documentCount = 0, 
  onClick,
  onEdit,
  onDelete,
  onDrop,
  isCustom = false 
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onClick?.(folder);
  };

  const handleEdit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onEdit?.(folder);
  };

  const handleDelete = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete?.(folder);
  };

  // Drag & Drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const documentData = e.dataTransfer.getData('text/plain');
    if (documentData && onDrop) {
      const document = JSON.parse(documentData);
      onDrop(document, folder);
    }
  };

  return (
    <motion.div
      className={`group relative rounded-xl p-6 transition-all duration-300 cursor-pointer ${
        isDragOver 
          ? 'bg-cyan-500/20 border-2 border-cyan-400 shadow-lg shadow-cyan-500/25' 
          : 'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20'
      }`}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Menu de opciones */}
      {isCustom && (
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <Menu as="div" className="relative">
            <Menu.Button 
              className="p-1 rounded-lg hover:bg-white/10 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
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
                        onClick={handleEdit}
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
                        onClick={handleDelete}
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
        </div>
      )}

      {/* Icono de la carpeta */}
      <div className="flex justify-center mb-4">
        <motion.div 
          className={`p-4 rounded-2xl bg-gradient-to-br ${folder.gradient || 'from-gray-400 to-slate-500'} bg-opacity-20 backdrop-blur-sm`}
          whileHover={{ scale: 1.1, rotate: isDragOver ? 0 : 5 }}
          animate={{ 
            scale: isDragOver ? 1.15 : 1,
            rotate: isDragOver ? 10 : 0 
          }}
          transition={{ duration: 0.2 }}
        >
          <FolderIcon 
            iconType={folder.iconType || folder.icon || 'folder'}
            className="h-12 w-12"
            gradient={folder.gradient || 'from-gray-400 to-slate-500'}
            withGlow={isDragOver}
            animated
          />
        </motion.div>
      </div>

      {/* Nombre de la carpeta */}
      <h3 className="text-lg font-semibold text-text-primary text-center mb-2 truncate">
        {folder.name}
      </h3>

      {/* Descripción */}
      {folder.description && (
        <p className="text-sm text-text-muted text-center mb-4 line-clamp-2">
          {folder.description}
        </p>
      )}

      {/* Contador de documentos */}
      <div className="flex items-center justify-center space-x-2 text-sm text-text-muted">
        <DocumentIcon className="h-4 w-4" />
        <span>
          {documentCount} {documentCount === 1 ? 'documento' : 'documentos'}
        </span>
      </div>

      {/* Indicador visual de hover */}
      <motion.div 
        className="absolute inset-0 rounded-xl border-2 border-transparent"
        animate={{
          borderColor: folder.color + '40'
        }}
        initial={{ borderColor: 'transparent' }}
        whileHover={{ borderColor: folder.color + '80' }}
        transition={{ duration: 0.2 }}
        style={{ pointerEvents: 'none' }}
      />
    </motion.div>
  );
};