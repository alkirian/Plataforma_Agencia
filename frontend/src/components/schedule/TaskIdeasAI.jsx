import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateIdeas } from '../../api/ai.js';
import toast from 'react-hot-toast';

/**
 * Mini componente IA para sugerencias de tareas contextuales
 * Se integra dentro del QuickTaskPopover
 */
const TaskIdeasAI = ({ 
  clientId, 
  selectedDate, 
  onSuggestionClick,
  currentFormData = {} 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Generar prompt contextual basado en la fecha y datos del formulario
  const generateContextualPrompt = useCallback(() => {
    const dateStr = selectedDate.toLocaleDateString('es-ES', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    // Detectar contextos especiales de la fecha
    const now = new Date();
    const isToday = selectedDate.toDateString() === now.toDateString();
    const isWeekend = [0, 6].includes(selectedDate.getDay());
    const isMonday = selectedDate.getDay() === 1;
    const isFriday = selectedDate.getDay() === 5;
    
    let prompt = `Genera 3-4 ideas específicas y creativas para contenido de marketing digital para el ${dateStr}.`;
    
    // Agregar contexto temporal
    if (isToday) {
      prompt += ` Es hoy, así que considera contenido que pueda publicarse el mismo día.`;
    } else if (isWeekend) {
      prompt += ` Es fin de semana, considera contenido más relajado y de entretenimiento.`;
    } else if (isMonday) {
      prompt += ` Es lunes, considera contenido motivacional o de inicio de semana.`;
    } else if (isFriday) {
      prompt += ` Es viernes, considera contenido para cerrar la semana o de fin de semana.`;
    }
    
    // Agregar contexto del formulario actual si existe
    if (currentFormData.title && currentFormData.title.trim()) {
      prompt += ` El usuario ya empezó con: "${currentFormData.title.trim()}". Puedes mejorarlo o sugerir alternativas similares.`;
    }
    
    if (currentFormData.channel) {
      const channelContext = {
        'IG': 'Instagram (visual, stories, reels, hashtags populares)',
        'FB': 'Facebook (engagement, comunidad, contenido informativo)', 
        'TikTok': 'TikTok (viral, tendencias, videos cortos, challenges)',
        'LinkedIn': 'LinkedIn (profesional, industria, networking, liderazgo)',
        'WhatsApp': 'WhatsApp (directo, personal, ofertas exclusivas)'
      };
      prompt += ` Para ${channelContext[currentFormData.channel] || currentFormData.channel}.`;
    }
    
    prompt += ` Responde SOLO con los títulos de las ideas, una por línea, sin numeración ni bullets. Sé específico, creativo y relevante para el contexto del cliente.`;
    
    return prompt;
  }, [selectedDate, currentFormData]);

  // Solicitar sugerencias a la IA
  const handleGetSuggestions = useCallback(async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      const prompt = generateContextualPrompt();
      const response = await generateIdeas(clientId, { 
        userPrompt: prompt,
        context: {
          date: selectedDate.toISOString(),
          channel: currentFormData.channel || 'IG',
          currentTitle: currentFormData.title || ''
        }
      });
      
      // Procesar respuesta y extraer ideas individuales
      const rawIdeas = response.response || response.ideas || '';
      const ideaList = rawIdeas
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(line => line.replace(/^[-•*]\s*/, '')) // Limpiar bullets
        .slice(0, 4); // Máximo 4 ideas
      
      setSuggestions(ideaList);
      if (ideaList.length > 0) {
        setIsExpanded(true);
      }
    } catch (error) {
      console.error('Error generating ideas:', error);
      toast.error('Error al generar ideas. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  }, [clientId, generateContextualPrompt, selectedDate, currentFormData]);

  // Manejar clic en sugerencia
  const handleSuggestionClick = useCallback((suggestion) => {
    onSuggestionClick?.(suggestion);
    setIsExpanded(false);
  }, [onSuggestionClick]);

  return (
    <div className="mt-3 pt-3 border-t border-gray-700">
      {/* Botón IA y controles */}
      <div className="flex items-center justify-between mb-2">
        <motion.button
          onClick={handleGetSuggestions}
          disabled={isLoading}
          className="flex items-center gap-2 px-3 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 rounded-lg text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          whileHover={!isLoading ? { scale: 1.02 } : {}}
          whileTap={!isLoading ? { scale: 0.98 } : {}}
        >
          <motion.span 
            className="text-base"
            animate={isLoading ? { rotate: 360 } : {}}
            transition={{ duration: 1, repeat: isLoading ? Infinity : 0, ease: 'linear' }}
          >
            🤖
          </motion.span>
          {isLoading ? 'Generando ideas...' : 'Ideas IA'}
        </motion.button>
        
        <div className="flex items-center gap-2">
          {suggestions.length > 0 && (
            <span className="px-2 py-1 bg-purple-600/20 border border-purple-500/30 text-purple-300 rounded text-xs">
              {suggestions.length}
            </span>
          )}
          {suggestions.length > 0 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 text-gray-500 hover:text-gray-300 transition-colors"
              title={isExpanded ? 'Ocultar ideas' : 'Mostrar ideas'}
            >
              <motion.svg 
                className="w-4 h-4" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </motion.svg>
            </button>
          )}
        </div>
      </div>

      {/* Sugerencias como chips */}
      <AnimatePresence>
        {isExpanded && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="space-y-2 overflow-hidden"
          >
            <p className="text-xs text-gray-400 mb-1.5">Haz clic en una idea para usarla:</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion, index) => (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, scale: 0.8, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.1 }}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="px-3 py-2 bg-gray-800/60 hover:bg-gray-700/80 border border-gray-600/50 hover:border-purple-500/40 text-gray-300 hover:text-white rounded-full text-xs transition-all duration-200 cursor-pointer hover:shadow-lg max-w-full active:bg-gray-700/90 touch-manipulation"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="line-clamp-2">{suggestion}</span>
                </motion.button>
              ))}
            </div>
            
            {/* Botón para regenerar */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: suggestions.length * 0.1 + 0.2 }}
              onClick={handleGetSuggestions}
              disabled={isLoading}
              className="w-full mt-2 px-3 py-1.5 border border-gray-600/50 hover:border-purple-500/40 text-gray-400 hover:text-purple-300 rounded-lg text-xs transition-all duration-200 disabled:opacity-50"
            >
              🔄 Generar nuevas ideas
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TaskIdeasAI;