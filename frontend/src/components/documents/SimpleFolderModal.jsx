import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog } from '@headlessui/react';
import { XMarkIcon, FolderPlusIcon, FolderIcon } from '@heroicons/react/24/outline';
import { CyberButton } from '../ui';

const FOLDER_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', 
  '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
];

const FOLDER_ICONS = [
  '📁', '📂', '🗂️', '📋', '📊', '📄', '🎨', '💼', 
  '🔧', '💡', '📸', '🎵', '🎥', '📚', '💰', '⚖️'
];

export const SimpleFolderModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  folder = null,
  isEditing = false,
  isLoading = false 
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '📁',
    color: '#3b82f6',
    filterPattern: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      if (isEditing && folder) {
        setFormData({
          name: folder.name?.replace(/^📁\s*/, '') || '',
          description: folder.description || '',
          icon: folder.icon || '📁',
          color: folder.color || '#3b82f6',
          filterPattern: folder.filterPattern || ''
        });
      } else {
        setFormData({
          name: '',
          description: '',
          icon: '📁',
          color: '#3b82f6',
          filterPattern: ''
        });
      }
      setErrors({});
    }
  }, [isOpen, folder, isEditing]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    } else if (formData.name.trim().length > 50) {
      newErrors.name = 'El nombre no puede tener más de 50 caracteres';
    }

    if (formData.description && formData.description.length > 200) {
      newErrors.description = 'La descripción no puede tener más de 200 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const folderData = {
      id: formData.name.toLowerCase().replace(/[^a-z0-9]/g, '_'),
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      icon: formData.icon,
      color: formData.color,
      custom: true,
      filter: formData.filterPattern 
        ? (doc) => new RegExp(formData.filterPattern, 'i').test(doc.file_name)
        : () => false,
      filterPattern: formData.filterPattern,
      sortOrder: 50
    };

    try {
      await onSave(folderData);
      onClose();
    } catch (error) {
      console.error('Error saving folder:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog 
          as={motion.div}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClose={onClose}
          className="relative z-50"
        >
          {/* Backdrop */}
          <motion.div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel
              as={motion.div}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md bg-surface-strong border border-white/10 rounded-xl shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <div className="flex items-center space-x-3">
                  {isEditing ? (
                    <FolderIcon className="h-6 w-6 text-primary-400" />
                  ) : (
                    <FolderPlusIcon className="h-6 w-6 text-primary-400" />
                  )}
                  <Dialog.Title className="text-lg font-semibold text-text-primary">
                    {isEditing ? 'Editar Carpeta' : 'Nueva Carpeta'}
                  </Dialog.Title>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <XMarkIcon className="h-5 w-5 text-text-muted" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Preview */}
                <div className="text-center">
                  <div 
                    className="inline-flex p-4 rounded-2xl mb-2"
                    style={{ backgroundColor: `${formData.color}20` }}
                  >
                    <span className="text-4xl">{formData.icon}</span>
                  </div>
                  <p className="text-sm text-text-muted">Vista previa</p>
                </div>

                {/* Nombre */}
                <div>
                  <label htmlFor="folder-name" className="block text-sm font-medium text-text-primary mb-2">
                    Nombre de la carpeta *
                  </label>
                  <input
                    id="folder-name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Ej: Facturas, Contratos, Marketing..."
                    className={`w-full px-3 py-2 bg-white/5 border rounded-lg text-text-primary placeholder-text-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      errors.name ? 'border-red-500' : 'border-white/20 focus:border-primary-500'
                    }`}
                    disabled={isLoading}
                    autoFocus
                  />
                  {errors.name && (
                    <p className="text-red-400 text-xs mt-1">{errors.name}</p>
                  )}
                </div>

                {/* Descripción */}
                <div>
                  <label htmlFor="folder-description" className="block text-sm font-medium text-text-primary mb-2">
                    Descripción (opcional)
                  </label>
                  <textarea
                    id="folder-description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Breve descripción de la carpeta..."
                    rows={2}
                    className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-text-primary placeholder-text-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                    disabled={isLoading}
                  />
                  {errors.description && (
                    <p className="text-red-400 text-xs mt-1">{errors.description}</p>
                  )}
                </div>

                {/* Icono */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Icono
                  </label>
                  <div className="grid grid-cols-8 gap-2">
                    {FOLDER_ICONS.map((icon) => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => handleInputChange('icon', icon)}
                        className={`p-2 rounded-lg text-xl transition-colors ${
                          formData.icon === icon
                            ? 'bg-primary-500/20 border border-primary-500/30'
                            : 'bg-white/5 hover:bg-white/10 border border-white/10'
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Color
                  </label>
                  <div className="grid grid-cols-8 gap-2">
                    {FOLDER_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => handleInputChange('color', color)}
                        className={`w-8 h-8 rounded-lg transition-all ${
                          formData.color === color
                            ? 'ring-2 ring-white ring-offset-2 ring-offset-surface-strong scale-110'
                            : 'hover:scale-105'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                {/* Filtro automático */}
                <div>
                  <label htmlFor="filter-pattern" className="block text-sm font-medium text-text-primary mb-2">
                    Filtro automático (opcional)
                  </label>
                  <input
                    id="filter-pattern"
                    type="text"
                    value={formData.filterPattern}
                    onChange={(e) => handleInputChange('filterPattern', e.target.value)}
                    placeholder="Ej: factura|invoice para agrupar facturas"
                    className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-text-primary placeholder-text-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    disabled={isLoading}
                  />
                  <p className="text-xs text-text-muted mt-1">
                    Los documentos con nombres que coincidan se agruparán automáticamente
                  </p>
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-3 pt-4">
                  <CyberButton
                    variant="ghost"
                    onClick={onClose}
                    disabled={isLoading}
                  >
                    Cancelar
                  </CyberButton>
                  <CyberButton
                    type="submit"
                    disabled={isLoading || !formData.name.trim()}
                    isLoading={isLoading}
                  >
                    {isEditing ? 'Actualizar' : 'Crear'} Carpeta
                  </CyberButton>
                </div>
              </form>
            </Dialog.Panel>
          </div>
        </Dialog>
      )}
    </AnimatePresence>
  );
};