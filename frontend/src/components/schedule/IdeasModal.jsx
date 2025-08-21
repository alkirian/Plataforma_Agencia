// components/schedule/IdeasModal.jsx
import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import toast from 'react-hot-toast';

const IdeaCard = ({ idea, isSelected, onToggleSelect, onEdit, onPreview, index }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedIdea, setEditedIdea] = useState({ ...idea });

  const handleSaveEdit = () => {
    onEdit(idea.id, editedIdea);
    setIsEditing(false);
    toast.success('Idea actualizada');
  };

  const handleCancelEdit = () => {
    setEditedIdea({ ...idea });
    setIsEditing(false);
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-UY', { 
        day: '2-digit',
        month: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const getChannelEmoji = (channel) => {
    const emojis = {
      'IG': '📸',
      'FB': '📘', 
      'TikTok': '🎵',
      'LinkedIn': '💼',
      'WhatsApp': '💚'
    };
    return emojis[channel] || '📱';
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.4, 
        delay: index * 0.08,
        type: "spring",
        stiffness: 300,
        damping: 24
      }}
      whileHover={{ 
        y: -4,
        transition: { duration: 0.2 }
      }}
      className={`
        relative group p-5 rounded-2xl border transition-all duration-300 cursor-pointer
        ${isSelected 
          ? 'bg-gray-50 dark:bg-gray-700/10 border-gray-400 dark:border-gray-500/50 shadow-lg ring-2 ring-gray-500/20' 
          : 'bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-600/50 hover:border-gray-300 dark:hover:border-gray-500 hover:shadow-xl dark:hover:shadow-black/20'
        }
      `}
    >
      {/* Checkbox de selección */}
      <div className="absolute top-4 left-4 z-10">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onToggleSelect(idea.id)}
          className={`
            w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all shadow-sm
            ${isSelected 
              ? 'bg-gray-600 border-gray-600 text-white shadow-gray-500/25' 
              : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-500 hover:border-gray-400 dark:hover:border-gray-400'
            }
          `}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: isSelected ? 1 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </motion.div>
        </motion.button>
      </div>

      {/* Número de idea */}
      <div className="absolute top-4 right-4">
        <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs px-2 py-1 rounded-lg font-medium">
          {index + 1}
        </span>
      </div>

      <div className="mt-8 space-y-4">
        {/* Fecha y Canal */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700/50 px-3 py-1.5 rounded-lg">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{formatDate(idea.suggestedDate)}</span>
          </div>
          <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700/50 px-3 py-1.5 rounded-lg">
            <span className="text-lg">{getChannelEmoji(idea.channel)}</span>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{idea.channel}</span>
          </div>
        </div>

        {/* Título */}
        {isEditing ? (
          <input
            value={editedIdea.title}
            onChange={(e) => setEditedIdea(prev => ({ ...prev, title: e.target.value }))}
            className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            placeholder="Título de la idea..."
          />
        ) : (
          <h3 className="font-semibold text-gray-900 dark:text-white text-base leading-tight line-clamp-2">
            {idea.title}
          </h3>
        )}

        {/* Copy */}
        {isEditing ? (
          <textarea
            value={editedIdea.copy}
            onChange={(e) => setEditedIdea(prev => ({ ...prev, copy: e.target.value }))}
            rows={4}
            className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            placeholder="Contenido del post..."
          />
        ) : (
          <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed line-clamp-4">
            {idea.copy}
          </p>
        )}

        {/* Hashtags */}
        {idea.hashtags && idea.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {idea.hashtags.slice(0, 3).map((tag, i) => (
              <span 
                key={i}
                className="text-xs bg-gray-50 dark:bg-gray-700/20 text-gray-600 dark:text-gray-400 px-2 py-1 rounded-md border border-gray-200/50 dark:border-gray-500/20 font-medium"
              >
                {tag}
              </span>
            ))}
            {idea.hashtags.length > 3 && (
              <span className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1">
                +{idea.hashtags.length - 3} más
              </span>
            )}
          </div>
        )}

        {/* Evento especial */}
        {idea.specialEvent && (
          <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700/20 rounded-lg border border-gray-200/50 dark:border-gray-500/20">
            <span className="text-lg">🎉</span>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{idea.specialEvent}</span>
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200/50 dark:border-gray-700/30">
          {isEditing ? (
            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Guardar
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCancelEdit}
                className="px-4 py-2 bg-gray-400 hover:bg-gray-500 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Cancelar
              </motion.button>
            </div>
          ) : (
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsEditing(true)}
                className="p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-lg transition-colors"
                title="Editar idea"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onPreview(idea)}
                className="p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-lg transition-colors"
                title="Vista previa"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </motion.button>
            </div>
          )}

          {/* Score de relevancia */}
          {idea.relevanceScore && (
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-400">IA</span>
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <span 
                    key={i}
                    className={`text-sm ${
                      i < Math.round(idea.relevanceScore * 5) 
                        ? 'text-yellow-500' 
                        : 'text-gray-300 dark:text-gray-600'
                    }`}
                  >
                    ★
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export const IdeasModal = ({ 
  isOpen, 
  onClose, 
  ideas = [], 
  onAcceptSelected, 
  onRegenerate,
  isRegenerating = false 
}) => {
  const [selectedIdeas, setSelectedIdeas] = useState(new Set());
  const [editedIdeas, setEditedIdeas] = useState({});
  const [previewIdea, setPreviewIdea] = useState(null);

  const handleToggleSelect = useCallback((ideaId) => {
    setSelectedIdeas(prev => {
      const newSet = new Set(prev);
      if (newSet.has(ideaId)) {
        newSet.delete(ideaId);
      } else {
        newSet.add(ideaId);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedIdeas.size === ideas.length) {
      setSelectedIdeas(new Set());
    } else {
      setSelectedIdeas(new Set(ideas.map(idea => idea.id)));
    }
  }, [ideas, selectedIdeas.size]);

  const handleEditIdea = useCallback((ideaId, editedData) => {
    setEditedIdeas(prev => ({
      ...prev,
      [ideaId]: editedData
    }));
  }, []);

  const handleAcceptSelected = useCallback(() => {
    if (selectedIdeas.size === 0) {
      toast.error('Selecciona al menos una idea');
      return;
    }

    const ideasToAccept = ideas
      .filter(idea => selectedIdeas.has(idea.id))
      .map(idea => editedIdeas[idea.id] || idea);

    onAcceptSelected(ideasToAccept);
  }, [selectedIdeas, ideas, editedIdeas, onAcceptSelected]);

  const handlePreview = useCallback((idea) => {
    setPreviewIdea(idea);
  }, []);

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
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
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
              <Dialog.Panel className="w-full max-w-7xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl">
                {/* Header mejorado */}
                <div className="flex items-center justify-between p-8 border-b border-gray-200 dark:border-gray-600/50">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-gray-500 to-gray-600 rounded-2xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <div>
                      <Dialog.Title className="text-2xl font-bold text-gray-900 dark:text-white">
                        {ideas.length} Ideas Generadas
                      </Dialog.Title>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                        Selecciona y personaliza las ideas que más te gusten
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSelectAll}
                      className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white text-sm rounded-lg transition-colors"
                    >
                      {selectedIdeas.size === ideas.length ? 'Deseleccionar todas' : 'Seleccionar todas'}
                    </motion.button>
                    
                    <button
                      onClick={onClose}
                      className="p-2 text-gray-400 hover:text-gray-200 transition-colors"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Stats bar */}
                <div className="px-6 py-3 bg-gray-100 dark:bg-gray-800/30 border-b border-gray-200 dark:border-gray-600/30">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4 text-gray-600 dark:text-gray-400">
                      <span>📊 Total: {ideas.length} ideas</span>
                      <span>✅ Seleccionadas: {selectedIdeas.size}</span>
                      <span>⭐ Promedio IA: {(ideas.reduce((acc, idea) => acc + (idea.relevanceScore || 0), 0) / ideas.length * 5).toFixed(1)}/5</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onRegenerate}
                        disabled={isRegenerating}
                        className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-500 text-white text-xs rounded-md transition-colors flex items-center gap-1"
                      >
                        {isRegenerating ? (
                          <>
                            <div className="w-3 h-3 border border-white/20 border-t-white rounded-full animate-spin"></div>
                            <span>Regenerando...</span>
                          </>
                        ) : (
                          <>
                            <span>🔄</span>
                            <span>Regenerar</span>
                          </>
                        )}
                      </motion.button>
                    </div>
                  </div>
                </div>

                {/* Grid de ideas */}
                <div className="p-8 max-h-[70vh] overflow-y-auto">
                  <motion.div 
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{
                      staggerChildren: 0.05,
                      delayChildren: 0.1
                    }}
                    className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                  >
                    {ideas.map((idea, index) => (
                      <IdeaCard
                        key={idea.id}
                        idea={idea}
                        index={index}
                        isSelected={selectedIdeas.has(idea.id)}
                        onToggleSelect={handleToggleSelect}
                        onEdit={handleEditIdea}
                        onPreview={handlePreview}
                      />
                    ))}
                  </motion.div>

                  {ideas.length === 0 && (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">🤔</div>
                      <p className="text-gray-400">No se generaron ideas. Intenta nuevamente.</p>
                    </div>
                  )}
                </div>

                {/* Footer mejorado */}
                <div className="flex items-center justify-between p-8 border-t border-gray-200 dark:border-gray-600/50 bg-gray-50/50 dark:bg-gray-800/20">
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Puedes editar cualquier idea antes de aceptarla</span>
                  </div>
                  
                  <div className="flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={onClose}
                      className="px-6 py-3 border border-gray-300 dark:border-gray-500 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-all font-medium"
                    >
                      Cerrar
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: selectedIdeas.size > 0 ? 1.02 : 1 }}
                      whileTap={{ scale: selectedIdeas.size > 0 ? 0.98 : 1 }}
                      onClick={handleAcceptSelected}
                      disabled={selectedIdeas.size === 0}
                      className={`px-6 py-3 rounded-xl transition-all font-medium shadow-lg ${
                        selectedIdeas.size > 0
                          ? 'bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 text-white shadow-gray-500/25'
                          : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 shadow-none cursor-not-allowed'
                      }`}
                    >
                      {selectedIdeas.size > 0 
                        ? `Aceptar ${selectedIdeas.size} ${selectedIdeas.size === 1 ? 'Idea' : 'Ideas'}`
                        : 'Selecciona Ideas'
                      }
                    </motion.button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>

        {/* Modal de Preview */}
        <AnimatePresence>
          {previewIdea && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 backdrop-blur-sm"
              onClick={() => setPreviewIdea(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-gray-800 border border-gray-600 rounded-xl p-6 max-w-md mx-4 shadow-2xl"
              >
                <div className="text-center space-y-4">
                  <div className="text-lg font-semibold text-white">
                    {previewIdea.title}
                  </div>
                  <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                    {previewIdea.copy}
                  </div>
                  <button
                    onClick={() => setPreviewIdea(null)}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                  >
                    Cerrar
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </Dialog>
    </Transition>
  );
};