// components/schedule/IdeasLoadingModal.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WAITING_MESSAGES } from '../../constants/tonePresets';

export const IdeasLoadingModal = ({ isOpen, onCancel }) => {
  const [currentPhase, setCurrentPhase] = useState(0);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      // Reset cuando se cierra
      setCurrentPhase(0);
      setCurrentMessageIndex(0);
      setProgress(0);
      return;
    }

    // Simular progreso realista
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) return 100;
        // Progreso más lento al principio, más rápido al final
        const increment = prev < 30 ? 0.5 : prev < 70 ? 1 : 0.3;
        return Math.min(prev + increment, 100);
      });
    }, 200);

    // Cambiar mensajes cada 3 segundos
    const messageInterval = setInterval(() => {
      setCurrentMessageIndex(prev => {
        const currentPhaseMessages = WAITING_MESSAGES[currentPhase]?.messages || [];
        const nextIndex = (prev + 1) % currentPhaseMessages.length;
        
        // Si completamos todos los mensajes de la fase actual, avanzar fase
        if (nextIndex === 0 && currentPhase < WAITING_MESSAGES.length - 1) {
          setCurrentPhase(prevPhase => prevPhase + 1);
        }
        
        return nextIndex;
      });
    }, 3000);

    return () => {
      clearInterval(progressInterval);
      clearInterval(messageInterval);
    };
  }, [isOpen, currentPhase]);

  const currentMessage = WAITING_MESSAGES[currentPhase]?.messages[currentMessageIndex] || "Generando ideas...";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-3xl p-10 max-w-lg mx-4 shadow-2xl"
          >
            <div className="text-center space-y-6">
              {/* Icono principal animado */}
              <div className="relative">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  className="w-20 h-20 mx-auto"
                >
                  <div className="w-full h-full bg-gradient-to-r from-gray-500 to-gray-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                </motion.div>
                
                {/* Partículas flotantes */}
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{
                      y: [-10, -20, -10],
                      opacity: [0.3, 1, 0.3],
                      scale: [0.8, 1.2, 0.8]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: i * 0.3,
                      ease: "easeInOut"
                    }}
                    className="absolute w-2 h-2 bg-gray-400 rounded-full"
                    style={{
                      top: '50%',
                      left: '50%',
                      transform: `translate(-50%, -50%) rotate(${i * 60}deg) translateY(-30px)`
                    }}
                  />
                ))}
              </div>

              {/* Título */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                  Creando Ideas Personalizadas
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-base">
                  Generando 10 ideas únicas alineadas con tu cliente
                </p>
              </div>

              {/* Mensaje dinámico */}
              <motion.div
                key={currentMessage}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-gray-50 dark:bg-gray-700/20 rounded-xl p-4 border border-gray-200/50 dark:border-gray-500/20"
              >
                <p className="text-gray-700 dark:text-gray-300 text-sm font-medium">
                  {currentMessage}
                </p>
              </motion.div>

              {/* Barra de progreso */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs text-gray-400">
                  <span>Progreso</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                    className="h-full bg-gradient-to-r from-gray-500 to-gray-600 rounded-full relative overflow-hidden"
                  >
                    {/* Efecto de brillo */}
                    <motion.div
                      animate={{ x: [-100, 100] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
                    />
                  </motion.div>
                </div>
              </div>

              {/* Fases del proceso */}
              <div className="flex justify-center space-x-2">
                {WAITING_MESSAGES.map((phase, index) => (
                  <div
                    key={phase.phase}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      index <= currentPhase 
                        ? 'bg-gray-500 scale-110' 
                        : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  />
                ))}
              </div>

              {/* Mensaje de paciencia */}
              <div className="text-xs text-gray-500 space-y-1">
                <p>⏱️ Este proceso puede tomar hasta 2-3 minutos</p>
                <p>🎯 Estamos usando nuestro mejor modelo de IA para crear ideas excepcionales</p>
              </div>

              {/* Botón cancelar (opcional) */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onCancel}
                className="px-6 py-3 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-sm transition-colors border border-gray-300 dark:border-gray-500 rounded-xl hover:border-gray-400 dark:hover:border-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium"
              >
                Cancelar generación
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};