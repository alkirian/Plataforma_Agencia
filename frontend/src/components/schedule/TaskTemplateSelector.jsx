import React, { useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { 
  XMarkIcon, 
  MagnifyingGlassIcon,
  ClockIcon,
  PlusIcon 
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { TASK_TEMPLATES, getAllTemplates, searchTemplates } from '../../constants/taskTemplates';

export const TaskTemplateSelector = ({ 
  isOpen, 
  onClose, 
  onSelectTemplate 
}) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const categories = [
    { id: 'all', name: 'Todas', icon: '📋' },
    ...Object.entries(TASK_TEMPLATES).map(([key, category]) => ({
      id: key,
      name: category.name,
      icon: category.icon,
      color: category.color
    }))
  ];

  const getFilteredTemplates = () => {
    let templates = getAllTemplates();

    // Filtrar por categoría
    if (selectedCategory !== 'all') {
      const categoryData = TASK_TEMPLATES[selectedCategory];
      templates = templates.filter(t => t.category === categoryData.name);
    }

    // Filtrar por búsqueda
    if (searchQuery.trim()) {
      templates = searchTemplates(searchQuery);
    }

    return templates;
  };

  const getTotalDuration = (tasks) => {
    return tasks.reduce((total, task) => total + (task.duration || 0), 0);
  };

  const handleSelectTemplate = (template) => {
    setSelectedTemplate(template);
  };

  const handleConfirmTemplate = () => {
    if (selectedTemplate && onSelectTemplate) {
      onSelectTemplate(selectedTemplate);
      onClose();
      setSelectedTemplate(null);
      setSearchQuery('');
      setSelectedCategory('all');
    }
  };

  const handleClose = () => {
    onClose();
    setSelectedTemplate(null);
    setSearchQuery('');
    setSelectedCategory('all');
  };

  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      green: 'bg-green-500/20 text-green-400 border-green-500/30',
      purple: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      orange: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      indigo: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
    };
    return colors[color] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-xl 
                                        bg-surface-900/95 backdrop-blur-sm border border-white/10 
                                        shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                  <Dialog.Title className="text-xl font-bold text-white flex items-center space-x-2">
                    <span>📋</span>
                    <span>Plantillas de Tareas</span>
                  </Dialog.Title>
                  
                  <motion.button
                    onClick={handleClose}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="rounded-full p-2 text-gray-400 hover:text-white hover:bg-white/10 
                               transition-colors"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </motion.button>
                </div>

                <div className="p-6">
                  {/* Búsqueda */}
                  <div className="mb-6">
                    <div className="relative">
                      <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Buscar plantillas..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full rounded-lg border border-white/10 bg-white/5 py-3 pl-10 pr-4 
                                   text-white placeholder-gray-400 backdrop-blur-sm transition-all 
                                   focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                      />
                    </div>
                  </div>

                  {/* Categorías */}
                  <div className="mb-6">
                    <div className="flex space-x-2 overflow-x-auto pb-2">
                      {categories.map((category) => (
                        <motion.button
                          key={category.id}
                          onClick={() => setSelectedCategory(category.id)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium 
                                     transition-all whitespace-nowrap ${
                                       selectedCategory === category.id
                                         ? 'bg-primary-600 text-white'
                                         : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                                     }`}
                        >
                          <span>{category.icon}</span>
                          <span>{category.name}</span>
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Lista de plantillas */}
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      <AnimatePresence>
                        {getFilteredTemplates().map((template, index) => (
                          <motion.div
                            key={template.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => handleSelectTemplate(template)}
                            className={`p-4 rounded-lg border cursor-pointer transition-all ${
                              selectedTemplate?.id === template.id
                                ? 'border-primary-500 bg-primary-500/10'
                                : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                            }`}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <span className="text-lg">{template.categoryIcon}</span>
                                <h3 className="font-medium text-white">{template.name}</h3>
                              </div>
                              <span className={`text-xs px-2 py-1 rounded-full border ${getColorClasses(template.categoryColor)}`}>
                                {template.category}
                              </span>
                            </div>
                            
                            <p className="text-sm text-gray-400 mb-3">{template.description}</p>
                            
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-500">
                                {template.tasks.length} tareas
                              </span>
                              <div className="flex items-center space-x-1 text-gray-500">
                                <ClockIcon className="h-3 w-3" />
                                <span>{getTotalDuration(template.tasks)}h estimadas</span>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                      
                      {getFilteredTemplates().length === 0 && (
                        <div className="text-center py-8 text-gray-400">
                          <p>No se encontraron plantillas</p>
                          <p className="text-sm mt-1">Intenta con otros términos de búsqueda</p>
                        </div>
                      )}
                    </div>

                    {/* Preview de plantilla seleccionada */}
                    <div className="bg-black/20 rounded-lg border border-white/10 p-4">
                      {selectedTemplate ? (
                        <div>
                          <div className="flex items-center space-x-2 mb-4">
                            <span className="text-xl">{selectedTemplate.categoryIcon}</span>
                            <h3 className="text-lg font-medium text-white">{selectedTemplate.name}</h3>
                          </div>
                          
                          <p className="text-gray-400 mb-4">{selectedTemplate.description}</p>
                          
                          <div className="space-y-2 mb-6 max-h-48 overflow-y-auto">
                            {selectedTemplate.tasks.map((task, index) => (
                              <div key={index} className="flex items-center justify-between p-2 bg-white/5 rounded">
                                <span className="text-sm text-white">{task.title}</span>
                                <div className="flex items-center space-x-2 text-xs text-gray-400">
                                  <ClockIcon className="h-3 w-3" />
                                  <span>{task.duration}h</span>
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          <motion.button
                            onClick={handleConfirmTemplate}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full flex items-center justify-center space-x-2 px-4 py-3 
                                       bg-primary-600 hover:bg-primary-700 text-white rounded-lg 
                                       font-medium transition-colors"
                          >
                            <PlusIcon className="h-4 w-4" />
                            <span>Usar Esta Plantilla</span>
                          </motion.button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                          <span className="text-4xl mb-2">📋</span>
                          <p className="text-center">
                            Selecciona una plantilla para ver los detalles
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};