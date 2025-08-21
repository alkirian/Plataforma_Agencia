// components/schedule/PromptPopover.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TONE_PRESETS, TONE_CATEGORIES } from '../../constants/tonePresets';

export const PromptPopover = ({ 
  isOpen, 
  onClose, 
  onGenerate, 
  isLoading,
  lastUsedPrompt = '',
  aiDetectedTones = [] // Tonos que detectó la IA
}) => {
  const [userPrompt, setUserPrompt] = useState('');
  const [selectedTones, setSelectedTones] = useState(new Set());
  const [showToneSection, setShowToneSection] = useState(false);
  const [activeCategory, setActiveCategory] = useState('profesional');

  useEffect(() => {
    if (isOpen) {
      // Cargar último prompt usado
      if (lastUsedPrompt) {
        setUserPrompt(lastUsedPrompt);
      }
      // Cargar últimos tonos seleccionados
      const savedTones = JSON.parse(localStorage.getItem('lastSelectedTones') || '[]');
      setSelectedTones(new Set(savedTones));
    }
  }, [isOpen, lastUsedPrompt]);

  const handleToneToggle = (toneKey) => {
    const newTones = new Set(selectedTones);
    if (newTones.has(toneKey)) {
      newTones.delete(toneKey);
    } else {
      // Máximo 3 tonos seleccionados
      if (newTones.size < 3) {
        newTones.add(toneKey);
      }
    }
    setSelectedTones(newTones);
  };

  const handleSurpriseMe = () => {
    const tonesArray = Array.from(selectedTones);
    onGenerate({ 
      userPrompt: null, 
      selectedTones: tonesArray 
    });
    
    // Guardar preferencias
    if (tonesArray.length > 0) {
      localStorage.setItem('lastSelectedTones', JSON.stringify(tonesArray));
    }
  };

  const handleGenerateWithPrompt = () => {
    const tonesArray = Array.from(selectedTones);
    onGenerate({ 
      userPrompt: userPrompt.trim() || null, 
      selectedTones: tonesArray 
    });
    
    // Guardar preferencias
    if (userPrompt.trim()) {
      localStorage.setItem('lastIdeaPrompt', userPrompt.trim());
    }
    if (tonesArray.length > 0) {
      localStorage.setItem('lastSelectedTones', JSON.stringify(tonesArray));
    }
  };

  const clearAllSelections = () => {
    setSelectedTones(new Set());
    setUserPrompt('');
  };

  // Agrupar tonos por categoría
  const tonesByCategory = Object.entries(TONE_PRESETS).reduce((acc, [key, tone]) => {
    if (!acc[tone.category]) acc[tone.category] = [];
    acc[tone.category].push({ key, ...tone });
    return acc;
  }, {});

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="fixed z-50 top-[20%] left-1/2 transform -translate-x-1/2 w-full max-w-lg mx-4 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border border-gray-200/50 dark:border-gray-600/50 rounded-2xl shadow-2xl p-6"
          >
            <div className="space-y-5">
              {/* Header minimalista */}
              <div className="text-center border-b border-gray-200/50 dark:border-gray-700/50 pb-4 mb-6">
                <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-gray-500 to-gray-600 rounded-2xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                  Generar Ideas de Contenido
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Personaliza tu estrategia o deja que la IA te sorprenda
                </p>
              </div>

              {/* Input de Prompt Textual */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Directrices personalizadas (opcional)
                </label>
                <div className="relative">
                  <textarea
                    value={userPrompt}
                    onChange={(e) => setUserPrompt(e.target.value)}
                    maxLength={150}
                    placeholder="Ej: Enfócate en contenido educativo para el día del niño..."
                    className="w-full h-20 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none text-sm transition-all duration-200"
                  />
                  <div className="absolute bottom-2 right-3 text-xs text-gray-400">
                    {userPrompt.length}/150
                  </div>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  La IA analizará automáticamente el contexto de tu cliente
                </div>
              </div>

              {/* Tonos detectados por IA */}
              {aiDetectedTones.length > 0 && (
                <div className="p-4 bg-gray-50 dark:bg-gray-700/10 rounded-xl border border-gray-200/50 dark:border-gray-500/20">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-5 h-5 bg-gray-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Tonos detectados automáticamente</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {aiDetectedTones.map(tone => (
                      <span
                        key={tone}
                        className="px-3 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700/30 text-gray-700 dark:text-gray-300 rounded-full border border-gray-200/50 dark:border-gray-500/30"
                      >
                        {TONE_PRESETS[tone]?.label || tone}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Sección de Tonos */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <span>🎨</span>
                    <span>Tono de Comunicación (Opcional - Máx. 3)</span>
                  </label>
                  <button
                    onClick={() => setShowToneSection(!showToneSection)}
                    className="text-xs text-gray-500 hover:text-gray-400 transition-colors flex items-center gap-1"
                  >
                    {showToneSection ? '👆 Ocultar' : '👇 Personalizar'}
                  </button>
                </div>

                {/* Selector manual de tonos */}
                <AnimatePresence>
                  {showToneSection && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      {/* Pestañas de categorías */}
                      <div className="flex gap-1 mb-3 p-1 bg-gray-100 dark:bg-gray-800/50 rounded-lg">
                        {Object.entries(TONE_CATEGORIES).map(([key, category]) => (
                          <button
                            key={key}
                            onClick={() => setActiveCategory(key)}
                            className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                              activeCategory === key
                                ? 'bg-gray-600/30 text-gray-200 dark:text-gray-200 border border-gray-500/30'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700/50'
                            }`}
                          >
                            {category.name}
                          </button>
                        ))}
                      </div>

                      {/* Grid de tonos por categoría */}
                      <div className="grid grid-cols-2 gap-2 p-3 bg-gray-50 dark:bg-gray-800/30 rounded-lg min-h-[120px]">
                        {tonesByCategory[activeCategory]?.map(({ key, label, description }) => (
                          <motion.button
                            key={key}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleToneToggle(key)}
                            disabled={selectedTones.size >= 3 && !selectedTones.has(key)}
                            className={`
                              p-3 rounded-lg text-xs font-medium transition-all duration-200 border text-left
                              ${selectedTones.has(key)
                                ? 'bg-gray-600/30 border-gray-500/50 text-gray-700 dark:text-gray-200 shadow-lg'
                                : selectedTones.size >= 3
                                ? 'bg-gray-200 dark:bg-gray-700/20 border-gray-300 dark:border-gray-600/20 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                                : 'bg-gray-100 dark:bg-gray-700/30 border-gray-200 dark:border-gray-600/30 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700/50 hover:border-gray-300 dark:hover:border-gray-500/50'
                              }
                            `}
                          >
                            <div className="flex flex-col gap-1">
                              <span className="font-semibold">{label}</span>
                              <span className="text-[10px] opacity-80 leading-tight">
                                {description}
                              </span>
                            </div>
                          </motion.button>
                        ))}
                      </div>
                      
                      {selectedTones.size > 0 && (
                        <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-700/20 rounded-lg border border-gray-200 dark:border-gray-500/20">
                          <div className="text-xs text-gray-600 dark:text-gray-300 mb-1">
                            Tonos seleccionados ({selectedTones.size}/3):
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {Array.from(selectedTones).map(toneKey => (
                              <span
                                key={toneKey}
                                className="px-2 py-1 text-xs bg-gray-500/40 text-gray-700 dark:text-gray-100 rounded-full border border-gray-400/40"
                              >
                                {TONE_PRESETS[toneKey]?.label}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Botones de Acción */}
              <div className="flex gap-3 pt-6 border-t border-gray-200/50 dark:border-gray-700/50">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSurpriseMe}
                  disabled={isLoading}
                  className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 font-medium rounded-xl transition-all disabled:opacity-50 border border-gray-200 dark:border-gray-500"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-gray-400/30 border-t-gray-600 rounded-full animate-spin"></div>
                      <span>Generando...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      <span>Sorpréndeme</span>
                    </div>
                  )}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleGenerateWithPrompt}
                  disabled={isLoading}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 text-white font-medium rounded-xl transition-all disabled:opacity-50 shadow-lg hover:shadow-xl"
                >
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>Generar Ideas</span>
                  </div>
                </motion.button>
              </div>

              {/* Info de contexto */}
              <div className="text-xs text-gray-500 dark:text-gray-400 text-center p-2 bg-gray-50 dark:bg-gray-800/30 rounded-lg">
                {selectedTones.size > 0 || userPrompt.trim() ? (
                  <span>
                    🎯 Generando con {selectedTones.size > 0 ? `${selectedTones.size} tonos personalizados` : ''}
                    {selectedTones.size > 0 && userPrompt.trim() ? ' + ' : ''}
                    {userPrompt.trim() ? 'tu prompt específico' : ''}
                  </span>
                ) : (
                  <span>🤖 La IA analizará tu cliente automáticamente para generar ideas perfectas</span>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};