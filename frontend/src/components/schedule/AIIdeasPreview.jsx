import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import {
  SparklesIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
  CalendarIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

const AIIdeasPreview = ({ 
  isOpen, 
  onClose, 
  clientId, 
  userPrompt,
  onIdeasGenerated,
  onGenerateIdeas,
  onAddIdea,
  isGenerating = false 
}) => {
  const [ideas, setIdeas] = useState([]);
  const [selectedIdeas, setSelectedIdeas] = useState(new Set());
  const [prompt, setPrompt] = useState(userPrompt || '');

  // Handler para generar ideas
  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Por favor ingresa un tema para generar ideas');
      return;
    }

    try {
      const generatedIdeas = await onGenerateIdeas(prompt.trim());
      const ideasWithTempId = (generatedIdeas || []).map((idea, index) => ({
        ...idea,
        tempId: `idea-${Date.now()}-${index}`,
        scheduled_at: idea.scheduled_at || new Date().toISOString().split('T')[0]
      }));
      
      setIdeas(ideasWithTempId);
      setSelectedIdeas(new Set(ideasWithTempId.map(idea => idea.tempId)));
      toast.success(`${ideasWithTempId.length} ideas generadas`);
    } catch (error) {
      toast.error(error.message || 'Error generando ideas');
    }
  };

  // Toggle selección de idea
  const toggleIdeaSelection = (tempId) => {
    const newSelected = new Set(selectedIdeas);
    if (newSelected.has(tempId)) {
      newSelected.delete(tempId);
    } else {
      newSelected.add(tempId);
    }
    setSelectedIdeas(newSelected);
  };

  // Remover idea de la lista
  const removeIdea = (tempId) => {
    setIdeas(prev => prev.filter(idea => idea.tempId !== tempId));
    setSelectedIdeas(prev => {
      const newSet = new Set(prev);
      newSet.delete(tempId);
      return newSet;
    });
  };

  // Agregar ideas seleccionadas al calendario
  const handleAddSelected = async () => {
    const ideasToAdd = ideas.filter(idea => selectedIdeas.has(idea.tempId));
    
    if (ideasToAdd.length === 0) {
      toast.error('Selecciona al menos una idea para agregar');
      return;
    }

    try {
      for (const idea of ideasToAdd) {
        await onAddIdea({
          title: idea.title,
          copy: idea.copy || '', // Incluir el copy para redes sociales
          scheduled_at: `${idea.scheduled_at}T09:00:00.000Z`,
          status: idea.status || 'Pendiente'
        });
      }
      
      toast.success(`${ideasToAdd.length} ideas agregadas al calendario`);
      onIdeasGenerated?.(ideasToAdd);
      onClose();
    } catch (error) {
      toast.error(error.message || 'Error agregando ideas');
    }
  };

  const formatDate = (dateStr) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('es-ES', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/75" />
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
                                        bg-surface-900/95 border border-white/10 
                                        shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                  <div className="flex items-center space-x-3">
                    <SparklesIcon className="h-6 w-6 text-primary-400" />
                    <div>
                      <Dialog.Title className="text-xl font-semibold text-white">
                        Generar Ideas con IA
                      </Dialog.Title>
                      <p className="text-sm text-gray-400 mt-1">
                        Crea ideas personalizadas para tu cliente
                      </p>
                    </div>
                  </div>
                  
                  <motion.button
                    onClick={onClose}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="rounded-full p-2 text-gray-400 hover:text-white hover:bg-white/10 
                               transition-colors"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </motion.button>
                </div>

                {/* Prompt Input */}
                <div className="p-6 border-b border-white/10">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    ¿Sobre qué tema querés generar ideas?
                  </label>
                  <div className="flex space-x-3">
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      rows={3}
                      className="flex-1 rounded-lg border border-white/10 bg-surface-soft py-3 px-4 
                                 text-white placeholder-gray-400 transition-all 
                                 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                      placeholder="Ej: Ideas para el Día del Padre, contenido sobre sustentabilidad, posts motivacionales..."
                    />
                    <motion.button
                      onClick={handleGenerate}
                      disabled={isGenerating || !prompt.trim()}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 
                                 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
                    >
                      {isGenerating ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Generando...</span>
                        </>
                      ) : (
                        <>
                          <SparklesIcon className="h-4 w-4" />
                          <span>Generar</span>
                        </>
                      )}
                    </motion.button>
                  </div>
                </div>

                {/* Ideas List */}
                <div className="p-6 max-h-96 overflow-y-auto">
                  {ideas.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <SparklesIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Ingresá un tema y generá ideas personalizadas</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium text-white">
                          Ideas Generadas ({ideas.length})
                        </h3>
                        <div className="flex items-center space-x-2 text-sm text-gray-400">
                          <span>{selectedIdeas.size} seleccionadas</span>
                        </div>
                      </div>

                      <AnimatePresence>
                        {ideas.map((idea, index) => {
                          const isSelected = selectedIdeas.has(idea.tempId);
                          
                          return (
                            <motion.div
                              key={idea.tempId}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -20 }}
                              transition={{ delay: index * 0.05 }}
                              className={`p-4 rounded-lg border transition-all cursor-pointer ${
                                isSelected
                                  ? 'border-primary-500 bg-primary-500/10'
                                  : 'border-white/10 bg-surface-soft hover:border-white/20 hover:bg-surface-strong'
                              }`}
                              onClick={() => toggleIdeaSelection(idea.tempId)}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <h4 className="font-medium text-white">{idea.title}</h4>
                                    {isSelected && (
                                      <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="w-2 h-2 bg-primary-500 rounded-full"
                                      />
                                    )}
                                  </div>
                                  
                                  {/* Copy del post */}
                                  {idea.copy && (
                                    <div className="mb-3 p-3 rounded bg-surface-soft border border-white/10">
                                      <p className="text-sm text-gray-300 whitespace-pre-line leading-relaxed">
                                        {idea.copy}
                                      </p>
                                    </div>
                                  )}
                                  
                                  <div className="flex items-center space-x-4 text-sm text-gray-400">
                                    <div className="flex items-center space-x-1">
                                      <CalendarIcon className="h-3 w-3" />
                                      <span>{formatDate(idea.scheduled_at)}</span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                      <span className={`px-2 py-1 rounded-full text-xs border ${
                                        idea.status === 'Pendiente' 
                                          ? 'border-yellow-500/30 bg-yellow-500/10 text-yellow-300'
                                          : 'border-gray-500/30 bg-gray-500/10 text-gray-300'
                                      }`}>
                                        {idea.status || 'Pendiente'}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                
                                <motion.button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeIdea(idea.tempId);
                                  }}
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </motion.button>
                              </div>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  )}
                </div>

                {/* Footer */}
                {ideas.length > 0 && (
                  <div className="flex items-center justify-between p-6 border-t border-white/10">
                    <div className="text-sm text-gray-400">
                      Seleccioná las ideas que querés agregar al calendario
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <motion.button
                        onClick={onClose}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                      >
                        Cancelar
                      </motion.button>
                      
                      <motion.button
                        onClick={handleAddSelected}
                        disabled={selectedIdeas.size === 0}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center space-x-2 px-6 py-2 bg-primary-600 hover:bg-primary-700 
                                   disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                      >
                        <PlusIcon className="h-4 w-4" />
                        <span>Agregar {selectedIdeas.size} al Calendario</span>
                      </motion.button>
                    </div>
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default AIIdeasPreview;
