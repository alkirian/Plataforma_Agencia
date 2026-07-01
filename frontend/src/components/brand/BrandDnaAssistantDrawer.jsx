// src/components/brand/BrandDnaAssistantDrawer.jsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, PaperAirplaneIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { getBrandDnaChatHistory, updateBrandProfileWithChat } from '../../api/clients';
import { useLanguage } from '../../hooks';

export const BrandDnaAssistantDrawer = ({ clientId, businessDescription, onClose, onBrandProfileUpdated }) => {
  const { t, lang } = useLanguage();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  
  const chatEndRef = useRef(null);

  // Carga inicial del historial del chat de ADN
  useEffect(() => {
    const loadHistory = async () => {
      try {
        setHistoryLoading(true);
        const res = await getBrandDnaChatHistory(clientId);
        if (res?.success) {
          setMessages(res.data || []);
        }
      } catch (err) {
        console.error('Error al cargar historial del chat de ADN:', err);
      } finally {
        setHistoryLoading(false);
      }
    };
    if (clientId) {
      loadHistory();
    }
  }, [clientId]);

  // Auto-scroll al final del chat cuando hay nuevos mensajes
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Calcular porcentaje de completitud basado en el markdown
  const completeness = useMemo(() => {
    if (!businessDescription) return 0;
    const totalSections = 16;
    const pendingMatches = businessDescription.match(/⚠️ \[Información pendiente:/g) || [];
    const pendingCount = pendingMatches.length;
    const completedCount = totalSections - pendingCount;
    return Math.max(0, Math.min(100, Math.round((completedCount / totalSections) * 100)));
  }, [businessDescription]);

  // Extraer las secciones pendientes para el checklist
  const pendingSections = useMemo(() => {
    if (!businessDescription) return [];
    const lines = businessDescription.split('\n');
    const list = [];
    let currentTitle = '';
    lines.forEach(line => {
      const match = line.match(/^##\s+(\d+)\.\s+(.*)$/);
      if (match) {
        currentTitle = match[2];
      } else if (line.includes('⚠️ [Información pendiente') && currentTitle) {
        list.push(currentTitle);
      }
    });
    return list;
  }, [businessDescription]);

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() || loading) return;

    const userText = inputMessage.trim();
    setInputMessage('');
    
    // Añadir localmente el mensaje del usuario de forma inmediata
    const userMsg = { id: 'temp-user-' + Date.now(), role: 'user', content: userText };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      // Filtrar historial para no enviar ids temporales
      const chatHistory = messages
        .filter(m => !String(m.id).startsWith('temp'))
        .map(m => ({ role: m.role, content: m.content }));

      const res = await updateBrandProfileWithChat(clientId, {
        userPrompt: userText,
        chatHistory
      });

      if (res?.success) {
        const assistantMsg = { id: 'assistant-' + Date.now(), role: 'assistant', content: res.reply };
        setMessages(prev => [...prev, assistantMsg]);
        
        // Notificar al componente padre que se actualizó el perfil de marca
        if (onBrandProfileUpdated) {
          onBrandProfileUpdated(res.updated_business_description);
        }
        
        // Disparar evento global para refrescar el Strategic Canvas
        window.dispatchEvent(new CustomEvent('cadence:refresh-brand-identity', { detail: { clientId } }));
        toast.success(lang === 'es' ? '¡ADN de marca actualizado!' : 'Brand DNA updated!');
      } else {
        throw new Error(res?.error || 'Error al procesar el mensaje.');
      }
    } catch (error) {
      console.error('Error al enviar mensaje al chat de ADN:', error);
      toast.error(error.message || (lang === 'es' ? 'Fallo al procesar respuesta.' : 'Failed to process reply.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black z-40 cursor-pointer"
      />

      {/* Drawer */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="absolute top-0 right-0 h-full w-80 sm:w-[420px] bg-[#090910] border-l border-white/10 z-50 p-4 shadow-2xl flex flex-col overflow-hidden text-left"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3 flex-shrink-0 select-none">
          <div className="flex items-center gap-2">
            <span className="text-xl">💬</span>
            <div>
              <h5 className="text-[11.5px] font-black text-[#9b82ff] uppercase tracking-wider">
                {lang === 'es' ? 'Estratega de Marca AI' : 'Brand AI Strategist'}
              </h5>
              <p className="text-[9.5px] text-text-muted">
                {lang === 'es' ? 'ADN 100% exacto del cliente' : '100% verified brand DNA'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-text-muted hover:text-white transition-colors cursor-pointer"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Brand Completeness Bar & Pending Checklist */}
        <div className="mb-4 bg-white/[0.01] border border-white/5 rounded-xl p-3 select-none flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase text-text-secondary tracking-wider">
              {lang === 'es' ? 'Completitud del ADN verídico' : 'Verified DNA Completeness'}
            </span>
            <span className="text-xs font-bold text-accent-lavender">{completeness}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden mb-3">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${completeness}%` }}
              className="h-full bg-gradient-to-r from-[#7C5CFC] to-[#4ECDC4]"
              transition={{ duration: 0.5 }}
            />
          </div>

          {/* Pending items dropdown/summary */}
          {pendingSections.length > 0 ? (
            <div className="space-y-1">
              <span className="text-[8.5px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                <span>⚠️</span> {lang === 'es' ? `Faltan ${pendingSections.length} pilares por definir:` : `${pendingSections.length} pillars left to define:`}
              </span>
              <div className="max-h-[75px] overflow-y-auto pr-1 text-[9.5px] text-text-muted space-y-0.5 scrollbar-thin">
                {pendingSections.map((sec, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 pl-1">
                    <span className="text-amber-500/60">•</span>
                    <span>{sec}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-[9.5px] text-emerald-400 font-bold uppercase tracking-wider">
              <CheckCircleIcon className="h-4 w-4 text-emerald-400" />
              <span>¡ADN de marca completado al 100%!</span>
            </div>
          )}
        </div>

        {/* Chat Messages Log */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin mb-4 bg-slate-950/40 rounded-xl p-3 border border-white/[0.02]">
          {historyLoading ? (
            <div className="h-full flex items-center justify-center py-10">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent-lavender border-t-transparent" />
            </div>
          ) : (
            <>
              {/* Mensaje de bienvenida inicial si no hay mensajes */}
              {messages.length === 0 && (
                <div className="p-3.5 rounded-xl border border-white/5 bg-white/[0.01] text-left space-y-2">
                  <p className="text-[12px] text-white font-bold">
                    {lang === 'es' ? '👋 ¡Hola! Soy tu Estratega de Marca.' : '👋 Hi! I am your Brand Strategist.'}
                  </p>
                  <p className="text-[11px] text-text-secondary leading-relaxed">
                    {lang === 'es' 
                      ? 'Analicé tu negocio y veo que nos faltan definir varios puntos estratégicos para planificar contenido con precisión. ¿Empezamos por definir cuáles son tus principales competidores directos o marcas de referencia?'
                      : 'I analyzed your business and noticed we need to define several strategic pillars. Let\'s start: who are your main competitors or reference brands?'}
                  </p>
                </div>
              )}

              {/* Historial de mensajes */}
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col max-w-[85%] ${
                    msg.role === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'
                  }`}
                >
                  <div
                    className={`p-3 rounded-2xl text-[11px] leading-relaxed select-text ${
                      msg.role === 'user'
                        ? 'bg-[#7C5CFC]/20 border border-[#7C5CFC]/30 text-white rounded-br-none text-right'
                        : 'bg-white/[0.02] border border-white/5 text-text-secondary rounded-bl-none text-left'
                    }`}
                  >
                    {msg.content}
                  </div>
                  <span className="text-[8px] text-text-muted mt-1 px-1">
                    {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>
              ))}

              {/* Pensando... */}
              {loading && (
                <div className="flex flex-col items-start max-w-[85%] mr-auto">
                  <div className="p-3.5 rounded-2xl rounded-bl-none bg-white/[0.02] border border-white/5 flex gap-1 items-center justify-center min-w-[55px] h-9">
                    <span className="h-1.5 w-1.5 bg-[#4ECDC4] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="h-1.5 w-1.5 bg-[#7C5CFC] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="h-1.5 w-1.5 bg-[#4ECDC4] rounded-full animate-bounce" style={{ animationDelay: '300ms', marginRight: 0 }} />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </>
          )}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSendMessage} className="flex gap-2 flex-shrink-0 select-none">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            disabled={loading || historyLoading}
            placeholder={lang === 'es' ? 'Contesta al estratega aquí...' : 'Answer the strategist here...'}
            className="flex-1 rounded-xl bg-slate-900 border border-white/10 px-3.5 py-2.5 text-[11.5px] text-white leading-relaxed focus:outline-none focus:border-[#7C5CFC] focus:ring-1 focus:ring-[#7C5CFC]/20 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !inputMessage.trim() || historyLoading}
            className="p-2.5 rounded-xl bg-[#7C5CFC] hover:bg-[#6b4dfc] text-white flex items-center justify-center transition-all disabled:opacity-50 cursor-pointer active:scale-95 shadow-md shadow-[#7C5CFC]/10"
          >
            <PaperAirplaneIcon className="h-4.5 w-4.5" />
          </button>
        </form>
      </motion.div>
    </>
  );
};
