// src/components/ui/AgentChatPanel.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  XMarkIcon, 
  PaperAirplaneIcon, 
  ChatBubbleLeftRightIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  CheckIcon,
  NoSymbolIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { InteractiveAvatar } from './InteractiveAvatar';
import { getChatResponse, getChatHistory } from '../../api/ai';
import { updateScheduleItem, createScheduleItem, deleteScheduleItem } from '../../api/schedule';
import { getClientBrandProfile, updateClientBrandProfile } from '../../api/clients';
import { agentSynth } from '../../utils/agentSynth';
import { supabase } from '../../supabaseClient';
import { runTrendsForClient } from '../../api/trends';
import { apiFetch } from '../../api/apiFetch';

const AGENT_BIOS = {
  general: { 
    name: 'Aura', 
    role: 'Directora Estratégica y Agente General IA', 
    color: '#7C5CFC', 
    chips: [
      '¿Qué tendencias del sector podemos programar hoy?',
      'Escribe un copy y prográmalo en el cronograma',
      'Revisa el rendimiento de mi pauta en Meta Ads',
      '¿Hay comentarios pendientes en redes sociales?',
      '¿Cómo podemos mejorar nuestro tono de voz de marca?'
    ] 
  }
};

export const AgentChatPanel = ({ clientId, agent, onClose, client }) => {
  const agentId = 'general'; // Forzar hilo unificado de Aura
  const bio = AGENT_BIOS.general;
  
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [avatarState, setAvatarState] = useState('idle');
  const [isMuted, setIsMuted] = useState(agentSynth.muted);
  
  const chatEndRef = useRef(null);

  // Generar placeholder contextualizado según la pestaña desde la que se abra a Aura
  const cardId = agent?.id;
  const placeholderText = cardId === 'schedule' 
    ? `Chatea con Aura sobre el Cronograma...`
    : cardId === 'trends'
      ? `Chatea con Aura sobre Tendencias...`
      : cardId === 'meta'
        ? `Chatea con Aura sobre Meta Ads...`
        : cardId === 'cm'
          ? `Chatea con Aura sobre el CM...`
          : `Pregúntale a Aura sobre la estrategia general...`;

  // Cargar historial de chat unificado al montar
  useEffect(() => {
    const loadHistory = async () => {
      try {
        setHistoryLoading(true);
        const result = await getChatHistory(clientId, { limit: 60 });
        const allMessages = result?.messages || [];
        
        // Cargar mensajes unificados de Aura (metadata.agentId === 'general')
        // Adicionalmente, cargamos mensajes legacy que no tengan agentId en sus metadatos
        const agentMessages = allMessages
          .filter(msg => !msg.metadata?.agentId || msg.metadata?.agentId === 'general')
          .reverse(); // Ordenar cronológico
           
        setMessages(agentMessages);
      } catch (err) {
        console.error('Error al cargar historial unificado:', err);
      } finally {
        setHistoryLoading(false);
      }
    };
    if (clientId) {
      loadHistory();
    }
  }, [clientId]);

  // Desplazamiento automático al final del chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleMuteToggle = () => {
    const newMuted = agentSynth.toggleMute();
    setIsMuted(newMuted);
    toast.success(newMuted ? 'Efectos de sonido silenciados' : 'Efectos de sonido activados');
  };

  const handleSendMessage = async (textToSend) => {
    const queryText = textToSend || inputValue;
    if (!queryText.trim() || loading) return;

    // Sonido de clic
    agentSynth.playClick();

    // Crear mensaje del usuario local de forma temporal
    const tempUserMsg = {
      id: `temp-${Date.now()}-user`,
      role: 'user',
      content: queryText.trim(),
      created_at: new Date().toISOString(),
      metadata: { agentId }
    };

    setMessages(prev => [...prev, tempUserMsg]);
    setInputValue('');
    setLoading(true);
    setAvatarState('thinking'); // Activa animación de pensar en el avatar!

    try {
      // Formatear historial estructurado para el RAG del backend
      const historyPayload = messages.slice(-10).map(m => ({
        role: m.role,
        content: m.content
      }));

      const response = await getChatResponse(clientId, {
        userPrompt: queryText.trim(),
        chatHistory: historyPayload,
        agentId: agentId
      });

      // Crear mensaje de respuesta del asistente
      const assistantMsg = {
        id: response.messageId || `temp-${Date.now()}-assistant`,
        role: 'assistant',
        content: response.response,
        created_at: new Date().toISOString(),
        metadata: {
          agentId,
          commands: response.commands || (response.command ? [response.command] : []),
          command: response.command // Compatibilidad hacia atrás
        }
      };

      setMessages(prev => [...prev, assistantMsg]);
      
      // Activa animación de hablar en el avatar!
      setAvatarState('talking');
      setTimeout(() => setAvatarState('idle'), 4000); // Vuelve a reposo después de 4s
      
      // Si la respuesta incluye un comando pendiente, reproducir micro-chirp de alerta
      if ((response.commands && response.commands.length > 0) || response.command) {
        agentSynth.playHover();
      }

      // Recargar historial para obtener los IDs reales y metadatos actualizados desde Supabase
      setTimeout(async () => {
        try {
          const result = await getChatHistory(clientId, { limit: 40 });
          const refreshed = (result?.messages || [])
            .filter(msg => !msg.metadata?.agentId || msg.metadata?.agentId === 'general')
            .reverse();
          if (refreshed.length > 0) {
            setMessages(refreshed);
          }
        } catch (e) {
          console.warn('Error al refrescar IDs de mensajes:', e);
        }
      }, 1000);

    } catch (err) {
      console.error('Error al enviar mensaje:', err);
      toast.error('No se pudo conectar con el agente. Intenta de nuevo.');
      setAvatarState('idle');
    } finally {
      setLoading(false);
    }
  };

  // Lógica para confirmar comandos de acción "Double-Check"
  const handleConfirmCommand = async (msg, commandIdx = 0) => {
    const commandsList = msg.metadata?.commands || (msg.metadata?.command ? [msg.metadata.command] : []);
    const command = commandsList[commandIdx];
    if (!command) return;

    const actionToast = toast.loading(`Ejecutando acción propuesta por ${bio.name}...`);
    agentSynth.playClick();

    try {
      // 1. Ejecutar las acciones de base de datos llamando a los helpers adecuados
      if (command.action === 'reschedule') {
        await updateScheduleItem(clientId, command.params.itemId, { scheduled_at: command.params.date });
        window.dispatchEvent(new CustomEvent('cadence:refresh-schedule'));
        toast.success(`¡Publicación "${command.params.title || 'Calendario'}" reprogramada al ${command.params.date}!`, { id: actionToast });
      } 
      else if (command.action === 'update_status') {
        await updateScheduleItem(clientId, command.params.itemId, { status: command.params.status });
        window.dispatchEvent(new CustomEvent('cadence:refresh-schedule'));
        toast.success(`¡Estado actualizado a "${command.params.status}" con éxito!`, { id: actionToast });
      } 
      else if (command.action === 'create') {
        await createScheduleItem(clientId, {
          title: command.params.title,
          scheduled_at: command.params.date,
          channel: command.params.channel,
          copy: command.params.copy || '',
          status: 'pendiente'
        });
        window.dispatchEvent(new CustomEvent('cadence:refresh-schedule'));
        toast.success(`¡Nueva publicación "${command.params.title}" creada en el cronograma!`, { id: actionToast });
      } 
      else if (command.action === 'delete') {
        await deleteScheduleItem(clientId, command.params.itemId);
        window.dispatchEvent(new CustomEvent('cadence:refresh-schedule'));
        toast.success('¡Publicación eliminada correctamente del cronograma!', { id: actionToast });
      } 
      else if (command.action === 'update_brand_profile') {
        // Obtener el perfil actual primero para fusionarlo de forma segura
        const currentProfileResp = await getClientBrandProfile(clientId);
        const current = currentProfileResp?.data || {};
        
        // Fusionar actualizaciones recomendadas
        const updated = {
          ...current,
          ...command.params.updates
        };
        
        await updateClientBrandProfile(clientId, updated);
        window.dispatchEvent(new CustomEvent('cadence:refresh-brand-identity'));
        toast.success('¡Identidad y ADN de marca del cliente actualizados con éxito!', { id: actionToast });
      }
      else if (command.action === 'run_trends') {
        await runTrendsForClient(clientId, command.params.keywords);
        window.dispatchEvent(new CustomEvent('cadence:refresh-trends'));
        toast.success('¡Búsqueda de tendencias en tiempo real iniciada con éxito! Analizando la web...', { id: actionToast });
      }
      else if (command.action === 'reply_comment') {
        await apiFetch(`/clients/${clientId}/meta-integration/comments/${command.params.commentId}/reply`, {
          method: 'POST',
          body: JSON.stringify({
            replyText: command.params.replyText,
            platform: command.params.platform || 'instagram'
          })
        });
        window.dispatchEvent(new CustomEvent('cadence:refresh-comments'));
        toast.success('¡Respuesta publicada con éxito en tus redes sociales!', { id: actionToast });
      }

      // Reproducir sonido sónico de confirmación exitosa
      agentSynth.playSuccess();

      // 2. Modificar el estado local del mensaje en la pantalla
      let updatedCommands = [];
      let updatedLegacyCommand = null;

      setMessages(prev => prev.map(m => {
        if (m.id === msg.id) {
          updatedCommands = m.metadata?.commands 
            ? m.metadata.commands.map((cmd, i) => i === commandIdx ? { ...cmd, status: 'approved' } : cmd)
            : [];
          updatedLegacyCommand = m.metadata?.command && commandIdx === 0
            ? { ...m.metadata.command, status: 'approved' }
            : m.metadata?.command;

          return {
            ...m,
            metadata: {
              ...m.metadata,
              commands: updatedCommands,
              command: updatedLegacyCommand
            }
          };
        }
        return m;
      }));

      // 3. Modificar el registro en Supabase para que persista como APROBADO
      if (msg.id && !msg.id.toString().startsWith('temp-')) {
        await supabase
          .from('chat_messages')
          .update({
            metadata: {
              ...msg.metadata,
              commands: updatedCommands,
              command: updatedLegacyCommand
            }
          })
          .eq('id', msg.id);
      }

    } catch (err) {
      console.error('Error al aplicar comando:', err);
      toast.error(`Error al ejecutar acción: ${err.message}`, { id: actionToast });
    }
  };

  // Lógica para rechazar/descartar comandos de acción
  const handleDiscardCommand = async (msg, commandIdx = 0) => {
    agentSynth.playReject();

    let updatedCommands = [];
    let updatedLegacyCommand = null;

    // 1. Modificar el estado local del mensaje
    setMessages(prev => prev.map(m => {
      if (m.id === msg.id) {
        updatedCommands = m.metadata?.commands 
          ? m.metadata.commands.map((cmd, i) => i === commandIdx ? { ...cmd, status: 'rejected' } : cmd)
          : [];
        updatedLegacyCommand = m.metadata?.command && commandIdx === 0
          ? { ...m.metadata.command, status: 'rejected' }
          : m.metadata?.command;

        return {
          ...m,
          metadata: {
            ...m.metadata,
            commands: updatedCommands,
            command: updatedLegacyCommand
          }
        };
      }
      return m;
    }));

    // 2. Modificar en Supabase
    if (msg.id && !msg.id.toString().startsWith('temp-')) {
      try {
        await supabase
          .from('chat_messages')
          .update({
            metadata: {
              ...msg.metadata,
              commands: updatedCommands,
              command: updatedLegacyCommand
            }
          })
          .eq('id', msg.id);
        toast.success('Propuesta descartada.');
      } catch (e) {
        console.warn('Error al actualizar descarte en DB:', e);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end pointer-events-none">
      {/* Backdrop oscuro translúcido */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/45 backdrop-blur-xs pointer-events-auto cursor-pointer"
      />

      {/* Panel de Chat Deslizable */}
      <motion.div 
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 220 }}
        className="relative w-full max-w-[460px] h-full bg-[#0a0e17]/90 border-l border-white/10 backdrop-blur-xl flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.8)] pointer-events-auto z-10"
      >
        {/* Cabecera del Panel */}
        <div className="relative p-5 border-b border-white/10 flex items-center justify-between gap-4 bg-gradient-to-r from-slate-950 via-slate-900 to-[#0a0e17]">
          <div className="flex items-center gap-3.5">
            {/* Avatar interactivo en miniatura (Sigue al cursor de forma local) */}
            <div className="relative border border-white/10 rounded-2xl overflow-hidden p-1 bg-black/40">
              <InteractiveAvatar 
                variant="ai" 
                state={avatarState} 
                size="sm" 
                className="w-11 h-11"
                interactive={true} 
              />
              <span className="absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-black animate-pulse" />
            </div>

            <div>
              <h2 className="text-sm font-title font-black text-white flex items-center gap-1.5 leading-none">
                <span>{bio.name}</span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-white/5 text-text-muted border border-white/5">
                  EXPERTO IA
                </span>
              </h2>
              <p className="text-[10px] text-text-secondary mt-1 font-medium leading-none">
                {bio.role}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Botón Silenciar */}
            <button 
              onClick={handleMuteToggle}
              title={isMuted ? 'Activar sonido' : 'Silenciar sonido'}
              className="p-2 rounded-xl text-text-muted hover:text-white hover:bg-white/5 transition-all duration-200"
            >
              {isMuted ? <SpeakerXMarkIcon className="h-4 w-4 text-red-400/80" /> : <SpeakerWaveIcon className="h-4 w-4" />}
            </button>

            {/* Botón Cerrar */}
            <button 
              onClick={onClose}
              className="p-2 rounded-xl text-text-muted hover:text-white hover:bg-white/5 transition-all duration-200"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Feed de Conversación */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-[radial-gradient(circle_at_top_right,rgba(30,41,59,0.1),transparent)]">
          {historyLoading ? (
            <div className="h-full flex flex-col items-center justify-center gap-3 text-text-muted">
              <div className="h-8 w-8 border-2 border-white/5 border-t-white/40 rounded-full animate-spin"></div>
              <span className="text-xs font-bold uppercase tracking-wider text-text-muted/80">Sincronizando con {bio.name}...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center text-text-muted space-y-4">
              <div className="p-4 rounded-3xl bg-white/5 border border-white/10">
                <ChatBubbleLeftRightIcon className="h-8 w-8 text-text-secondary" />
              </div>
              <div>
                <p className="text-xs font-bold text-white uppercase tracking-wider">Conversación con {bio.name}</p>
                <p className="text-[11px] text-text-secondary mt-2 max-w-[280px] leading-relaxed">
                  Hola, soy tu co-piloto especialista de {client?.name || 'este cliente'}. Consúltame lo que necesites, ¡estoy para ayudarte a optimizar la marca!
                </p>
              </div>
            </div>
          ) : (
            messages.map((msg, index) => {
              const isUser = msg.role === 'user';
              const commandsList = msg.metadata?.commands || (msg.metadata?.command ? [msg.metadata.command] : []);
              
              return (
                <div 
                  key={msg.id || index} 
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} gap-1.5`}
                >
                  {/* Etiqueta del Remitente */}
                  <span className="text-[8.5px] font-mono font-bold text-text-secondary tracking-widest uppercase px-1">
                    {isUser ? 'Tú' : bio.name}
                  </span>

                  {/* Burbuja del Mensaje */}
                  <div 
                    className={`max-w-[88%] p-3.5 rounded-[20px] text-xs leading-relaxed whitespace-pre-wrap ${
                      isUser 
                        ? 'bg-slate-900 border border-white/10 text-white rounded-tr-xs' 
                        : 'bg-[#121825]/90 border border-white/5 text-slate-100 rounded-tl-xs shadow-md'
                    }`}
                    style={!isUser ? { borderLeftColor: bio.color, borderLeftWidth: '3.5px' } : undefined}
                  >
                    {msg.content}

                    {/* RENDERIZADOR DE TARJETAS DE APROBACIÓN DE COMANDOS (DOUBLE CHECK) */}
                    {!isUser && commandsList.length > 0 && (
                      <div className="mt-4 space-y-3">
                        {commandsList.map((command, cmdIdx) => (
                          <div key={cmdIdx} className="border border-white/10 rounded-2xl bg-black/40 overflow-hidden backdrop-blur-md transition-all duration-300">
                            {/* Header de la Tarjeta Operativa */}
                            <div 
                              className="px-3 py-2 border-b border-white/10 flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-white/95"
                              style={{ background: `linear-gradient(90deg, rgba(15,23,42,0.6) 0%, ${bio.color}33 100%)` }}
                            >
                              <span>Propuesta {commandsList.length > 1 ? `#${cmdIdx + 1}` : ''}</span>
                              <span 
                                className={`px-2 py-0.5 rounded-full text-[8px] border ${
                                  command.status === 'approved' 
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                    : command.status === 'rejected'
                                      ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                      : 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse-soft'
                                }`}
                              >
                                {command.status === 'approved' ? 'Aprobada' : command.status === 'rejected' ? 'Descartada' : 'Pendiente Visto Bueno'}
                              </span>
                            </div>

                            {/* Contenido / Detalles del Comando */}
                            <div className="p-3 text-[11px] space-y-2 text-slate-200">
                              {command.action === 'reschedule' && (
                                <div>
                                  <p className="font-bold text-white">🗓️ Reprogramar Publicación</p>
                                  <p className="text-[10px] text-text-muted mt-1 leading-normal">
                                    Mover post <strong className="text-white">"{command.params.title || 'Calendario'}"</strong> a la fecha:
                                  </p>
                                  <p className="text-xs font-mono font-bold mt-1 text-[#ffd166]">{command.params.date}</p>
                                </div>
                              )}

                              {command.action === 'update_status' && (
                                <div>
                                  <p className="font-bold text-white">🟢 Cambiar Estado del Post</p>
                                  <p className="text-[10px] text-text-muted mt-1">
                                    Actualizar estado de publicación a:
                                  </p>
                                  <p className="text-xs font-bold font-mono mt-1 uppercase text-[#4ECDC4]">{command.params.status}</p>
                                </div>
                              )}

                              {command.action === 'create' && (
                                <div>
                                  <p className="font-bold text-white">✍️ Crear Nueva Publicación</p>
                                  <div className="text-[10px] text-text-muted space-y-1 mt-1 leading-normal">
                                    <p>• Título: <span className="text-white font-bold">{command.params.title}</span></p>
                                    <p>• Fecha: <span className="text-white font-bold">{command.params.date}</span></p>
                                    <p>• Canal: <span className="text-[#38ef7d] font-bold">{command.params.channel}</span></p>
                                    {command.params.copy && <p className="italic mt-1 border-l-2 border-white/10 pl-2 text-slate-300 whitespace-pre-wrap leading-relaxed">"{command.params.copy}"</p>}
                                  </div>
                                </div>
                              )}

                              {command.action === 'delete' && (
                                <div>
                                  <p className="font-bold text-red-400">🗑️ Eliminar Publicación</p>
                                  <p className="text-[10px] text-text-muted mt-1 leading-normal">
                                    Eliminar el post seleccionado de forma permanente.
                                  </p>
                                </div>
                              )}

                              {command.action === 'update_brand_profile' && (
                                <div>
                                  <p className="font-bold text-white">🧬 Ajustar ADN de Marca</p>
                                  <p className="text-[10px] text-text-secondary leading-normal">
                                    Se actualizarán los siguientes campos en la Identidad del Cliente:
                                  </p>
                                  <div className="text-[10px] space-y-1.5 mt-2 bg-black/30 p-2 rounded-xl border border-white/5">
                                    {command.params.updates && Object.entries(command.params.updates).map(([key, val]) => {
                                      const keyLabels = {
                                        brand_voice: 'Tono de Voz',
                                        target_audience: 'Público Objetivo',
                                        business_description: 'Negocio',
                                        reference_style: 'Dirección Estética',
                                        brand_values: 'Valores',
                                        competitors: 'Competidores'
                                      };
                                      return (
                                        <p key={key} className="leading-normal">
                                          <strong className="text-white text-[9px] uppercase tracking-wider">{keyLabels[key] || key}:</strong>
                                          <span className="block text-slate-300 mt-0.5 text-[10px] italic">"{val}"</span>
                                        </p>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {command.action === 'run_trends' && (
                                <div>
                                  <p className="font-bold text-white">🔍 Iniciar Búsqueda de Tendencias</p>
                                  <p className="text-[10px] text-text-muted mt-1 leading-normal">
                                    Escanear la web e indexar novedades en tiempo real con las palabras clave:
                                  </p>
                                  <p className="text-xs font-mono font-bold mt-1 text-cyan-400 bg-black/30 p-2 rounded-xl border border-white/5">
                                    "{command.params.keywords || 'Pilares de la marca'}"
                                  </p>
                                </div>
                              )}

                              {command.action === 'reply_comment' && (
                                <div>
                                  <p className="font-bold text-white">💬 Publicar Respuesta en Redes</p>
                                  <p className="text-[10px] text-text-muted mt-1 leading-normal">
                                    Responder al comentario seleccionado en <span className="text-emerald-400 font-bold uppercase">{command.params.platform || 'instagram'}</span>:
                                  </p>
                                  <p className="text-xs italic font-bold mt-1.5 text-[#ffd166] bg-black/30 p-2.5 rounded-xl border border-white/5 leading-relaxed">
                                    "{command.params.replyText}"
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* Botones de Confirmación / Doble Check */}
                            {command.status === 'pending' ? (
                              <div className="grid grid-cols-2 border-t border-white/10 bg-slate-950/70">
                                <button
                                  onClick={() => handleConfirmCommand(msg, cmdIdx)}
                                  className="px-3 py-2 text-[10px] font-bold text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300 transition-colors flex items-center justify-center gap-1.5 border-r border-white/10"
                                >
                                  <CheckIcon className="h-3.5 w-3.5" />
                                  <span>Confirmar Ajuste</span>
                                </button>
                                <button
                                  onClick={() => handleDiscardCommand(msg, cmdIdx)}
                                  className="px-3 py-2 text-[10px] font-bold text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors flex items-center justify-center gap-1.5"
                                >
                                  <NoSymbolIcon className="h-3.5 w-3.5" />
                                  <span>Descartar</span>
                                </button>
                              </div>
                            ) : (
                              <div className="px-3 py-2 bg-slate-950/90 text-center text-[10px] font-bold text-text-muted border-t border-white/10 flex items-center justify-center gap-1 font-mono">
                                {command.status === 'approved' ? (
                                  <>
                                    <CheckIcon className="h-3.5 w-3.5 text-emerald-400" />
                                    <span className="text-emerald-400/90 uppercase tracking-widest text-[9px]">Ajuste Aplicado con Éxito</span>
                                  </>
                                ) : (
                                  <>
                                    <NoSymbolIcon className="h-3.5 w-3.5 text-red-400/80" />
                                    <span className="text-red-400/80 uppercase tracking-widest text-[9px]">Ajuste Descartado</span>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {/* Estado de "Pensando..." */}
          {loading && (
            <div className="flex flex-col items-start gap-1.5 animate-pulse">
              <span className="text-[8.5px] font-mono font-bold text-text-secondary tracking-widest uppercase px-1">
                {bio.name}
              </span>
              <div className="bg-[#121825]/90 border border-white/5 p-3 rounded-[20px] rounded-tl-xs flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Sugerencias Rápidas (Chips de un clic) */}
        {bio.chips && bio.chips.length > 0 && !loading && (
          <div className="px-5 py-2.5 bg-black/40 border-t border-white/5 flex gap-2 overflow-x-auto select-none no-scrollbar">
            {bio.chips.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(chip)}
                className="flex-shrink-0 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-[10px] text-text-muted hover:text-white transition-all duration-200"
              >
                {chip}
              </button>
            ))}
          </div>
        )}

        {/* Barra de Entrada / Envío */}
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
          className="p-4 border-t border-white/10 bg-slate-950/80 flex items-center gap-2.5"
        >
          <input 
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={placeholderText}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-text-secondary focus:ring-1 focus:ring-accent-blue/30 focus:border-accent-blue/40 focus:outline-none transition-all duration-200"
            disabled={loading}
          />
          <button 
            type="submit"
            disabled={!inputValue.trim() || loading}
            className={`p-2.5 rounded-xl flex items-center justify-center transition-all duration-200 ${
              inputValue.trim() && !loading
                ? 'bg-white text-black hover:bg-slate-200 cursor-pointer shadow-md'
                : 'bg-white/5 text-text-muted border border-white/5 cursor-not-allowed'
            }`}
          >
            <PaperAirplaneIcon className="h-4 w-4" />
          </button>
        </form>
      </motion.div>
    </div>
  );
};
