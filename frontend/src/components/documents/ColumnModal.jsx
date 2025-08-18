import React, { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, FolderPlusIcon, FolderIcon } from '@heroicons/react/24/outline';
import { CyberButton } from '../ui';

const COLUMN_COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald  
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#6b7280', // gray
  '#f97316', // orange
  '#14b8a6', // teal
  '#a855f7'  // violet
];

export const ColumnModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  column = null,
  isEditing = false 
}) => {
  const [formData, setFormData] = useState({
    name: '',
    color: '#3b82f6'
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      if (isEditing && column) {
        setFormData({
          name: column.name || '',
          color: column.color || '#3b82f6'
        });
      } else {
        setFormData({
          name: '',
          color: '#3b82f6'
        });
      }
      setErrors({});
    }
  }, [isOpen, column, isEditing]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    } else if (formData.name.trim().length > 30) {
      newErrors.name = 'El nombre no puede tener más de 30 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const columnData = {
      id: isEditing ? column.id : formData.name.toLowerCase().replace(/[^a-z0-9]/g, '_'),
      name: formData.name.trim(),
      color: formData.color,
      order: isEditing ? column.order : Date.now(), // Usar timestamp para orden
      documentIds: isEditing ? column.documentIds : []
    };

    try {
      await onSave(columnData);
      onClose();
    } catch (error) {
      console.error('Error saving column:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        </Transition.Child>

        {/* Modal */}
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95 translate-y-4"
            enterTo="opacity-100 scale-100 translate-y-0"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100 translate-y-0"
            leaveTo="opacity-0 scale-95 translate-y-4"
          >
            <Dialog.Panel className="w-full max-w-md bg-surface-strong border border-white/10 rounded-xl shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <div className="flex items-center space-x-3">
                  {isEditing ? (
                    <FolderIcon className="h-6 w-6 text-primary-400" />
                  ) : (
                    <FolderPlusIcon className="h-6 w-6 text-primary-400" />
                  )}
                  <Dialog.Title className="text-lg font-semibold text-text-primary">
                    {isEditing ? 'Editar Columna' : 'Nueva Columna'}
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
                    className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg mb-2"
                    style={{ backgroundColor: `${formData.color}20`, borderColor: `${formData.color}40` }}
                  >
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: formData.color }}
                    />
                    <span className="font-medium text-text-primary">
                      {formData.name || 'Nombre de columna'}
                    </span>
                  </div>
                  <p className="text-sm text-text-muted">Vista previa</p>
                </div>

                {/* Nombre */}
                <div>
                  <label htmlFor="column-name" className="block text-sm font-medium text-text-primary mb-2">
                    Nombre de la columna *
                  </label>
                  <input
                    id="column-name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Ej: En progreso, Completado, Revisión..."
                    className={`w-full px-3 py-2 bg-white/5 border rounded-lg text-text-primary placeholder-text-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      errors.name ? 'border-red-500' : 'border-white/20 focus:border-primary-500'
                    }`}
                    autoFocus
                  />
                  {errors.name && (
                    <p className="text-red-400 text-xs mt-1">{errors.name}</p>
                  )}
                </div>

                {/* Color */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Color
                  </label>
                  <div className="grid grid-cols-6 gap-2">
                    {COLUMN_COLORS.map((color) => (
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

                {/* Actions */}
                <div className="flex justify-end space-x-3 pt-4">
                  <CyberButton
                    variant="ghost"
                    onClick={onClose}
                  >
                    Cancelar
                  </CyberButton>
                  <CyberButton
                    type="submit"
                    disabled={!formData.name.trim()}
                  >
                    {isEditing ? 'Actualizar' : 'Crear'} Columna
                  </CyberButton>
                </div>
              </form>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
};