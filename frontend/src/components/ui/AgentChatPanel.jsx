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
  NoSymbolIcon,
  PlusIcon,
  ClockIcon,
  ArrowUpIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { InteractiveGSAPCharacter } from './InteractiveGSAPCharacter';
import { useTheme } from '../../hooks/useTheme';
import { getChatResponse, getChatHistory } from '../../api/ai';
import { 
  updateScheduleItem, 
  createScheduleItem, 
  deleteScheduleItem, 
  generateImageForEvent, 
  createScheduleItemAsset 
} from '../../api/schedule';
import { getClientBrandProfile, updateClientBrandProfile, getClients } from '../../api/clients';
import { agentSynth } from '../../utils/agentSynth';
import { supabase } from '../../supabaseClient';
import { useEscapeClose } from '../../hooks';
import { runTrendsForClient } from '../../api/trends';
import { apiFetch } from '../../api/apiFetch';
import { useQuery } from '@tanstack/react-query';
import { PaperClipIcon, ArrowDownTrayIcon, ShareIcon } from '@heroicons/react/24/outline';
import { compressBrandLogo } from '../../utils/imageCompressor';

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

const MODELS = [
  { id: 'gpt-5', name: 'GPT-5', desc: 'GPT-5 Flagship (OpenAI)', color: '#10B981', glow: 'rgba(16, 185, 129, 0.4)' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', desc: 'GPT-4o Mini Fallback (OpenAI)', color: '#7C5CFC', glow: 'rgba(124, 92, 252, 0.4)' }
];

const ImageToPostAssociator = ({ clientId, resultData }) => {
  const [scheduleItems, setScheduleItems] = useState([]);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [associating, setAssociating] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const loadItems = async () => {
      try {
        const { data } = await supabase
          .from('schedule_items')
          .select('id, title, scheduled_at, channel')
          .eq('client_id', clientId)
          .order('scheduled_at', { ascending: false })
          .limit(30);
        setScheduleItems(data || []);
        if (data && data.length > 0) {
          setSelectedItemId(data[0].id);
        }
      } catch (e) {
        console.warn('Error loading schedule items for dropdown:', e);
      }
    };
    if (clientId) {
      loadItems();
    }
  }, [clientId]);

  const handleAssociate = async () => {
    if (!selectedItemId || associating) return;
    setAssociating(true);
    try {
      await createScheduleItemAsset(clientId, selectedItemId, {
        file_name: resultData.fileName || 'transformed-asset.png',
        storage_path: resultData.storagePath,
        mime_type: resultData.mimeType || 'image/png',
        size_bytes: parseInt(resultData.sizeBytes) || 0,
        asset_role: 'final'
      });
      setDone(true);
      window.dispatchEvent(new CustomEvent('cadence:refresh-schedule'));
      toast.success('¡Imagen asociada al post correctamente!');
    } catch (e) {
      console.error('Error associating image:', e);
      toast.error('Error al asociar imagen: ' + e.message);
    } finally {
      setAssociating(false);
    }
  };

  if (done) {
    return (
      <div className="flex items-center gap-1.5 justify-center py-1 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
        <CheckIcon className="h-4 w-4 text-emerald-400" />
        <span>Asociada con éxito</span>
      </div>
    );
  }

  if (scheduleItems.length === 0) {
    return (
      <p className="text-[10px] text-text-muted text-center italic">No hay publicaciones en el calendario para asociar.</p>
    );
  }

  return (
    <div className="space-y-1.5 pt-1.5 border-t border-white/5">
      <label className="block text-[9px] text-text-secondary font-bold uppercase tracking-wider">Asociar a Publicación:</label>
      <div className="flex gap-1.5">
        <select
          value={selectedItemId}
          onChange={(e) => setSelectedItemId(e.target.value)}
          className="flex-1 bg-slate-900 border border-white/10 rounded-lg px-2 py-1 text-[10px] text-white focus:ring-1 focus:ring-accent-blue/30 focus:outline-none"
          disabled={associating}
        >
          {scheduleItems.map(item => (
            <option key={item.id} value={item.id}>
              [{item.channel || 'IG'}] {item.title} ({item.scheduled_at?.slice(0, 10)})
            </option>
          ))}
        </select>
        <button
          onClick={handleAssociate}
          disabled={associating || !selectedItemId}
          className="px-2.5 py-1 rounded-lg bg-white text-black hover:bg-slate-200 text-[10px] font-bold transition-all disabled:opacity-50 flex items-center gap-1 cursor-pointer"
        >
          {associating ? '...' : <ShareIcon className="h-3.5 w-3.5 text-black" />}
          <span>Asociar</span>
        </button>
      </div>
    </div>
  );
};

export const AgentChatPanel = ({ clientId, agent, onClose, client, onClientIdChange }) => {
  useEscapeClose(true, onClose);
  const agentId = 'general'; // Forzar hilo unificado de Aura
  const bio = AGENT_BIOS.general;

  const [panelWidth, setPanelWidth] = useState(460);

  useEffect(() => {
    const handleResize = () => {
      setPanelWidth(window.innerWidth < 640 ? window.innerWidth : 460);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const [selectedModel, setSelectedModel] = useState('gpt-5');
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedImagePreview, setSelectedImagePreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (!file.type.startsWith('image/')) {
        toast.error('Por favor, arrastra un archivo de imagen.');
        return;
      }
      if (file.size > 8 * 1024 * 1024) {
        toast.error('La imagen supera el límite de 8MB.');
        return;
      }

      try {
        const compressedFile = await compressBrandLogo(file, 1024, 0.82);
        setSelectedImage(compressedFile);
        const reader = new FileReader();
        reader.onloadend = () => {
          setSelectedImagePreview(reader.result);
        };
        reader.readAsDataURL(compressedFile);
      } catch (err) {
        console.error('Error al comprimir la imagen de arrastre, usando la original:', err);
        setSelectedImage(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setSelectedImagePreview(reader.result);
        };
        reader.readAsDataURL(file);
      }
      agentSynth.playClick();
      toast.success('Imagen adjuntada correctamente.');
    }
  };
  
  // Sync selectedModel on client change
  useEffect(() => {
    if (clientId) {
      setSelectedModel('gpt-5');
    }
  }, [clientId]);

  // Escuchar tecla Escape para cerrar el panel
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Cargar lista de clientes
  const { data: clientsResponse } = useQuery({
    queryKey: ['clients'],
    queryFn: getClients,
  });
  const clients = clientsResponse?.data || [];

  const activeModel = MODELS.find(m => m.id === selectedModel) || MODELS[0];
  
  const { theme } = useTheme();
  const [viewMode, setViewMode] = useState('chat'); // 'chat' | 'history'
  const [messages, setMessages] = useState([]);
  const [allMessages, setAllMessages] = useState([]);
  const [threads, setThreads] = useState([]);
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [activeThreadTitle, setActiveThreadTitle] = useState('Nueva Conversación');

  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [avatarState, setAvatarState] = useState('idle');
  const [isMuted, setIsMuted] = useState(agentSynth.muted);
  
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const parseThreads = (allMsgs) => {
    const threadsMap = {};
    const auraMsgs = allMsgs.filter(msg => !msg.metadata?.agentId || msg.metadata?.agentId === 'general');

    auraMsgs.forEach(msg => {
      const threadId = msg.metadata?.threadId || 'general-legacy';
      const threadTitle = msg.metadata?.threadTitle || 'Conversación General';
      const timestamp = msg.created_at || new Date().toISOString();
      
      if (!threadsMap[threadId]) {
        threadsMap[threadId] = {
          id: threadId,
          title: threadTitle,
          updatedAt: timestamp,
          messages: []
        };
      }
      
      threadsMap[threadId].messages.push(msg);
      if (new Date(timestamp) > new Date(threadsMap[threadId].updatedAt)) {
        threadsMap[threadId].updatedAt = timestamp;
      }
    });
    
    return Object.values(threadsMap).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  };

  const refreshAllMessages = async (selectThreadId = null) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('id, role, content, metadata, created_at')
        .eq('client_id', clientId)
        .order('created_at', { ascending: true });
        
      if (error) throw error;
      
      const msgs = data || [];
      setAllMessages(msgs);
      
      const parsedThreads = parseThreads(msgs);
      setThreads(parsedThreads);
      
      let targetThreadId = selectThreadId !== null ? selectThreadId : activeThreadId;
      
      if (!targetThreadId && parsedThreads.length > 0) {
        targetThreadId = parsedThreads[0].id;
      }
      
      if (targetThreadId) {
        setActiveThreadId(targetThreadId);
        const threadObj = parsedThreads.find(t => t.id === targetThreadId);
        setActiveThreadTitle(threadObj ? threadObj.title : 'Nueva Conversación');
        
        const activeMsgs = msgs.filter(msg => {
          const tId = msg.metadata?.threadId || 'general-legacy';
          return tId === targetThreadId;
        });
        setMessages(activeMsgs);
      } else {
        setMessages([]);
        setActiveThreadId(null);
        setActiveThreadTitle('Nueva Conversación');
      }
    } catch (err) {
      console.error('Error al refrescar mensajes de chat:', err);
    }
  };

  const handleNewChat = () => {
    agentSynth.playClick();
    setActiveThreadId(null);
    setActiveThreadTitle('Nueva Conversación');
    setMessages([]);
    setViewMode('chat');
  };

  const handleDeleteThread = async (e, threadIdToDelete) => {
    e.stopPropagation();
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta conversación de forma permanente?')) return;
    
    agentSynth.playReject();
    const actionToast = toast.loading('Eliminando conversación...');
    
    try {
      if (threadIdToDelete === 'general-legacy') {
        const { error } = await supabase
          .from('chat_messages')
          .delete()
          .eq('client_id', clientId)
          .is('metadata->threadId', null);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('chat_messages')
          .delete()
          .eq('client_id', clientId)
          .eq('metadata->>threadId', threadIdToDelete);
        if (error) throw error;
      }
      
      toast.success('Conversación eliminada.', { id: actionToast });
      
      if (activeThreadId === threadIdToDelete) {
        handleNewChat();
        await refreshAllMessages();
      } else {
        await refreshAllMessages(activeThreadId);
      }
    } catch (err) {
      console.error('Error al eliminar hilo:', err);
      toast.error('Error al eliminar: ' + err.message, { id: actionToast });
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecciona un archivo de imagen.');
      return;
    }
    
    if (file.size > 8 * 1024 * 1024) {
      toast.error('La imagen supera el límite de 8MB.');
      return;
    }

    try {
      const compressedFile = await compressBrandLogo(file, 1024, 0.82);
      setSelectedImage(compressedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImagePreview(reader.result);
      };
      reader.readAsDataURL(compressedFile);
    } catch (err) {
      console.error('Error al comprimir la imagen seleccionada, usando la original:', err);
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

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

  useEffect(() => {
    const loadHistory = async () => {
      try {
        setHistoryLoading(true);
        await refreshAllMessages();
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
    if (!queryText.trim() && !selectedImagePreview) return;
    if (loading) return;

    agentSynth.playClick();

    const imgBase64 = selectedImagePreview;
    
    let currentThreadId = activeThreadId;
    let currentThreadTitle = activeThreadTitle;
    
    if (!currentThreadId || currentThreadId === 'general-legacy') {
      currentThreadId = crypto.randomUUID();
      currentThreadTitle = queryText.trim().slice(0, 30) + (queryText.trim().length > 30 ? '...' : '');
      setActiveThreadId(currentThreadId);
      setActiveThreadTitle(currentThreadTitle);
    }

    const tempUserMsg = {
      id: `temp-${Date.now()}-user`,
      role: 'user',
      content: queryText.trim() || "Imagen adjunta",
      created_at: new Date().toISOString(),
      metadata: { agentId, imageUrl: imgBase64, threadId: currentThreadId, threadTitle: currentThreadTitle }
    };

    setMessages(prev => [...prev, tempUserMsg]);
    setInputValue('');
    setSelectedImage(null);
    setSelectedImagePreview(null);
    setLoading(true);
    setAvatarState('thinking');

    try {
      const historyPayload = messages.slice(-10).map(m => ({
        role: m.role,
        content: m.content
      }));

      const response = await getChatResponse(clientId, {
        userPrompt: queryText.trim() || "Imagen adjunta",
        chatHistory: historyPayload,
        agentId: agentId,
        model: selectedModel,
        imageUrl: imgBase64,
        localTime: new Date().toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        threadId: currentThreadId,
        threadTitle: currentThreadTitle
      });

      if (response.isFallback) {
        toast('⚠️ GPT-5 no disponible temporalmente. Aura respondió usando GPT-4o Mini.', {
          duration: 6000,
          style: {
            background: '#D97706',
            color: '#ffffff',
            fontWeight: '600'
          }
        });
      }

      const assistantMsg = {
        id: response.messageId || `temp-${Date.now()}-assistant`,
        role: 'assistant',
        content: response.response,
        created_at: new Date().toISOString(),
        metadata: {
          agentId,
          commands: response.commands || (response.command ? [response.command] : []),
          command: response.command,
          threadId: currentThreadId,
          threadTitle: currentThreadTitle
        }
      };

      setMessages(prev => [...prev, assistantMsg]);
      
      setAvatarState('talking');
      setTimeout(() => setAvatarState('idle'), 4000);
      
      if ((response.commands && response.commands.length > 0) || response.command) {
        agentSynth.playHover();
      }

      setTimeout(async () => {
        try {
          await refreshAllMessages(currentThreadId);
        } catch (e) {
          console.warn('Error al refrescar mensajes de chat tras envío:', e);
        }
      }, 1000);

    } catch (err) {
      console.error('Error al enviar mensaje:', err);
      const errMsg = err.message || '';
      const isQuotaError = errMsg.toLowerCase().includes('quota') || 
                           errMsg.toLowerCase().includes('rate limit') || 
                           errMsg.toLowerCase().includes('limit') || 
                           errMsg.toLowerCase().includes('exhausted') ||
                           errMsg.toLowerCase().includes('billing');
      if (isQuotaError) {
        toast.error('Límite de cuota superado. Por favor, cambiá el modelo en la barra superior (ej. Aura Estándar).', {
          duration: 7000
        });
      } else {
        toast.error('No se pudo conectar con el agente. Intenta de nuevo.');
      }
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
      else if (command.action === 'boost_post') {
        const totalBudget = parseFloat(command.params.budget) || 15;
        const days = parseInt(command.params.days) || 3;
        const dailyBudget = Math.round((totalBudget / days) * 100) / 100;

        await apiFetch(`/clients/${clientId}/meta-integration/boost`, {
          method: 'POST',
          body: JSON.stringify({
            postId: command.params.postId,
            platform: 'instagram',
            campaignName: command.params.campaignName || `Boosted Post - ${command.params.postId}`,
            objective: 'OUTCOME_TRAFFIC',
            dailyBudget: dailyBudget,
            durationDays: days,
            targetLocation: 'AR',
            targetInterests: []
          })
        });
        toast.success(`¡Post pautado con éxito! Se inició una campaña de $${dailyBudget}/día por ${days} días.`, { id: actionToast });
      }
      else if (command.action === 'generate_post_image') {
        const pStr = command.params.image_prompt || `Imagen para el post`;
        const ratio = command.params.aspectRatio || '1:1';
        await generateImageForEvent(clientId, command.params.itemId, { prompt: pStr, aspectRatio: ratio });
        window.dispatchEvent(new CustomEvent('cadence:refresh-schedule'));
        toast.success('¡Imagen generada e incorporada a la publicación!', { id: actionToast });
      }
      else if (command.action === 'transform_product_image') {
        const imageUrl = command.params.image_url;
        const pStr = command.params.image_prompt || `Foto publicitaria`;
        const ratio = command.params.aspectRatio || '1:1';

        const res = await apiFetch(`/clients/${clientId}/design/transform-product`, {
          method: 'POST',
          body: JSON.stringify({
            imageUrl,
            prompt: pStr,
            aspectRatio: ratio,
            aiEngine: 'gemini'
          })
        });

        if (res.success && res.data?.url) {
          // Guardar resultado para renderizarlo interactivo en la tarjeta
          command.resultUrl = res.data.url;
          command.fileName = res.data.fileName;
          command.storagePath = res.data.storagePath;
          command.mimeType = res.data.mimeType;
          command.sizeBytes = res.data.sizeBytes;
          
          window.dispatchEvent(new CustomEvent('cadence:refresh-schedule'));
          toast.success('¡Fondo de producto transformado con éxito!', { id: actionToast });
        } else {
          throw new Error(res.message || 'La transformación no devolvió una URL válida.');
        }
      }
      else if (command.action === 'associate_image_to_post') {
        await createScheduleItemAsset(clientId, command.params.itemId, {
          file_name: command.params.file_name || 'chat-asset.png',
          storage_path: command.params.storage_path,
          mime_type: command.params.mime_type || 'image/png',
          size_bytes: parseInt(command.params.size_bytes) || 0,
          asset_role: 'final'
        });
        window.dispatchEvent(new CustomEvent('cadence:refresh-schedule'));
        toast.success('¡Imagen asociada al post correctamente!', { id: actionToast });
      }

      // Reproducir sonido sónico de confirmación exitosa
      agentSynth.playSuccess();

      // 2. Modificar el estado local del mensaje en la pantalla
      let updatedCommands = [];
      let updatedLegacyCommand = null;

      setMessages(prev => prev.map(m => {
        if (m.id === msg.id) {
          updatedCommands = m.metadata?.commands 
            ? m.metadata.commands.map((cmd, i) => i === commandIdx ? { ...cmd, ...command, status: 'approved' } : cmd)
            : [];
          updatedLegacyCommand = m.metadata?.command && commandIdx === 0
            ? { ...m.metadata.command, ...command, status: 'approved' }
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
    <motion.div 
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: panelWidth, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{ type: 'tween', duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
      className="h-full flex-shrink-0 bg-slate-50 dark:bg-[#0a0e17]/90 border-l border-slate-200 dark:border-white/10 backdrop-blur-xl flex flex-col shadow-[0_0_40px_rgba(0,0,0,0.15)] dark:shadow-[0_0_40px_rgba(0,0,0,0.5)] relative z-30 overflow-hidden text-slate-800 dark:text-slate-100"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div style={{ width: panelWidth }} className="h-full flex flex-col relative">
        {/* Overlay de Arrastrar y Soltar */}
        <AnimatePresence>
          {isDragging && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-white/90 dark:bg-slate-950/80 backdrop-blur-sm border-2 border-dashed border-indigo-500/50 dark:border-[#7C5CFC]/50 m-2 rounded-2xl flex flex-col items-center justify-center gap-3 z-50 pointer-events-none"
            >
              <div className="p-4 rounded-full bg-indigo-500/10 dark:bg-[#7C5CFC]/10 border border-indigo-500/20 dark:border-[#7C5CFC]/20 animate-pulse">
                <PaperClipIcon className="h-8 w-8 text-indigo-600 dark:text-[#7C5CFC]" />
              </div>
              <p className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">Suelte la imagen aquí</p>
              <p className="text-[10px] text-slate-500 dark:text-text-secondary">Máximo 8MB • PNG, JPG, WEBP</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cabecera del Panel */}
        <div className="relative py-2 px-3.5 border-b border-slate-200 dark:border-white/10 flex items-center justify-between gap-3 bg-white dark:bg-slate-950 shadow-sm dark:shadow-none">
          <div className="flex items-center gap-2">
            {/* Avatar interactivo en miniatura (Sigue al cursor de forma local) */}
            <div className="relative border border-slate-200 dark:border-white/10 rounded-xl p-0.5 bg-slate-100 dark:bg-black/40 overflow-visible">
              <div className="w-8 h-8 flex items-center justify-center overflow-visible scale-[0.25] origin-center pointer-events-none">
                <InteractiveGSAPCharacter 
                  preset="chatter" 
                  emotion={avatarState === 'thinking' ? 'thinking' : avatarState === 'talking' ? 'excited' : 'happy'} 
                  size="sm" 
                  className="pointer-events-none"
                />
              </div>
              <span 
                className="absolute bottom-0.5 right-0.5 w-2 h-2 rounded-full border border-white dark:border-black animate-pulse transition-all duration-300"
                style={{ 
                  backgroundColor: activeModel.color,
                  boxShadow: `0 0 6px ${activeModel.glow}`
                }}
              />
            </div>

            <div>
              <h2 className="text-xs font-title font-black text-slate-800 dark:text-white flex items-center gap-1.5 leading-none">
                <span>{bio.name}</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold border border-slate-200/55 dark:border-white/5 text-emerald-500 bg-emerald-500/10">
                  GPT-5 Activo
                </span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Botón Nuevo Chat */}
            <button 
              onClick={handleNewChat}
              title="Nueva conversación"
              className="p-1.5 rounded-lg text-slate-500 dark:text-white/70 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-all duration-200 cursor-pointer"
            >
              <PlusIcon className="h-5 w-5" />
            </button>

            {/* Botón Historial de Chats */}
            <button 
              onClick={() => setViewMode(prev => prev === 'chat' ? 'history' : 'chat')}
              title={viewMode === 'chat' ? "Historial de conversaciones" : "Volver al chat"}
              className={`p-1.5 rounded-lg transition-all duration-200 cursor-pointer ${
                viewMode === 'history'
                  ? 'text-indigo-600 dark:text-cyan-400 bg-indigo-50 dark:bg-cyan-950/30 font-bold'
                  : 'text-slate-500 dark:text-white/70 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10'
              }`}
            >
              <ClockIcon className="h-5 w-5" />
            </button>

            {/* Divisor vertical */}
            <span className="w-px h-4 bg-slate-200 dark:bg-white/10 mx-1" />

            {/* Botón Cerrar Panel */}
            <button 
              onClick={onClose}
              title="Cerrar chat de Aura"
              className="p-1.5 rounded-lg text-slate-500 dark:text-white/70 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-all duration-200 cursor-pointer"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Vista del Historial de Conversaciones */}
        {viewMode === 'history' ? (
          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50 dark:bg-[#0a0e17]/40">
            <h3 className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400 dark:text-text-muted mb-2 px-1">
              Conversaciones Anteriores
            </h3>
            {threads.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400 dark:text-text-muted space-y-4">
                <div className="p-4 rounded-3xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                  <ClockIcon className="h-8 w-8 text-slate-400 dark:text-text-secondary" />
                </div>
                <p className="text-xs">No hay conversaciones previas en el historial.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {threads.map(thread => (
                  <div
                    key={thread.id}
                    onClick={() => {
                      setActiveThreadId(thread.id);
                      setActiveThreadTitle(thread.title);
                      const activeMsgs = allMessages.filter(msg => (msg.metadata?.threadId || 'general-legacy') === thread.id);
                      setMessages(activeMsgs);
                      setViewMode('chat');
                      agentSynth.playClick();
                    }}
                    className={`group flex items-center justify-between p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer ${
                      activeThreadId === thread.id
                        ? 'bg-white dark:bg-slate-900 border-indigo-200 dark:border-[#7C5CFC]/30 shadow-sm'
                        : 'bg-white/60 dark:bg-[#121825]/40 border-slate-200/50 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 hover:bg-white dark:hover:bg-[#121825]/60'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <ChatBubbleLeftRightIcon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                        activeThreadId === thread.id ? 'text-indigo-600 dark:text-cyan-400' : 'text-slate-400 dark:text-text-muted'
                      }`} />
                      <div className="min-w-0">
                        <p className={`text-xs font-semibold truncate ${
                          activeThreadId === thread.id ? 'text-slate-950 dark:text-white' : 'text-slate-700 dark:text-slate-300'
                        }`}>
                          {thread.title}
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-text-secondary mt-0.5">
                          {new Date(thread.updatedAt).toLocaleDateString()} {new Date(thread.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    
                    <button
                      onClick={(e) => handleDeleteThread(e, thread.id)}
                      title="Eliminar conversación"
                      className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-all duration-150 cursor-pointer"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Feed de Conversación */
          <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-slate-50/50 dark:bg-[#0a0e17]/20 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.05),transparent)] dark:bg-[radial-gradient(circle_at_top_right,rgba(30,41,59,0.1),transparent)]">
            {historyLoading ? (
              <div className="h-full flex flex-col items-center justify-center gap-3 text-slate-400 dark:text-text-muted">
                <div className="h-8 w-8 border-2 border-slate-200 dark:border-white/5 border-t-indigo-600 dark:border-t-white/40 rounded-full animate-spin"></div>
                <span className="text-xs font-bold uppercase tracking-wider">Sincronizando con {bio.name}...</span>
              </div>
            ) : messages.length === 0 ? (
              /* Splash de Bienvenida (Estilo Gemini) */
              <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-6">
                {/* Avatar GSAP destacado en el centro */}
                <div className="relative border border-slate-200 dark:border-white/10 rounded-full p-2 bg-white dark:bg-black/20 overflow-visible shadow-sm">
                  <div className="w-24 h-24 flex items-center justify-center overflow-visible scale-[0.7] origin-center">
                    <InteractiveGSAPCharacter 
                      preset="chatter" 
                      emotion="happy" 
                      size="md" 
                    />
                  </div>
                </div>
                
                <div className="space-y-2 animate-fade-in">
                  <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-blue-600 via-indigo-500 to-violet-500 dark:from-cyan-400 dark:via-[#7C5CFC] dark:to-[#FF5A79] bg-clip-text text-transparent pb-1">
                    Pregúntale a {bio.name}
                  </h1>
                  <p className="text-xs text-slate-500 dark:text-text-secondary max-w-[280px] leading-relaxed mx-auto">
                    Tu co-piloto y directora estratégica para <strong className="text-slate-800 dark:text-white font-bold">{client?.name || 'tu marca'}</strong>. ¿Qué optimizamos hoy?
                  </p>
                </div>

                {/* Chips de sugerencias */}
                {bio.chips && bio.chips.length > 0 && (
                  <div className="w-full max-w-[320px] pt-4 space-y-2">
                    <p className="text-[9px] font-bold text-slate-400 dark:text-text-secondary uppercase tracking-widest text-left px-1">Sugerencias para empezar:</p>
                    <div className="flex flex-col gap-1.5 text-left">
                      {bio.chips.slice(0, 3).map((chip, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setInputValue(chip);
                            agentSynth.playClick();
                          }}
                          className="text-[10px] text-slate-600 dark:text-slate-300 bg-white dark:bg-[#121825]/40 hover:bg-slate-100 dark:hover:bg-[#121825]/80 border border-slate-200/60 dark:border-white/5 rounded-xl px-3.5 py-2.5 transition-all duration-150 truncate cursor-pointer shadow-sm dark:shadow-none"
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
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
                    <span className="text-[8.5px] font-mono font-bold text-slate-400 dark:text-text-secondary tracking-widest uppercase px-1">
                      {isUser ? 'Tú' : bio.name}
                    </span>

                    {/* Burbuja del Mensaje */}
                    <div 
                      className={`max-w-[88%] p-3.5 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap shadow-sm dark:shadow-md transition-all duration-200 ${
                        isUser 
                          ? 'bg-indigo-600 dark:bg-slate-800 text-white rounded-tr-none' 
                          : 'bg-white dark:bg-[#121825]/90 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-white/5 rounded-tl-none'
                      }`}
                    >
                      {msg.metadata?.imageUrl && (
                        <div className="mb-2 max-w-[240px] rounded-lg overflow-hidden border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-black/20">
                          <img src={msg.metadata.imageUrl} alt="Adjunto" className="object-contain w-full max-h-48" />
                        </div>
                      )}
                      {msg.content}

                      {/* Renderizador de tarjetas de aprobación de comandos */}
                      {!isUser && commandsList.length > 0 && (
                        <div className="mt-4 space-y-3">
                          {commandsList.map((command, cmdIdx) => (
                            <div key={cmdIdx} className="border border-slate-200 dark:border-white/10 rounded-2xl bg-slate-50 dark:bg-black/40 overflow-hidden backdrop-blur-md transition-all duration-300">
                              {/* Header de la Tarjeta */}
                              <div 
                                className="px-3 py-2 border-b border-slate-200 dark:border-white/10 flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-slate-700 dark:text-white/95"
                                style={{ background: theme === 'light' ? 'rgba(241, 245, 249, 0.8)' : `linear-gradient(90deg, rgba(15,23,42,0.6) 0%, ${bio.color}33 100%)` }}
                              >
                                <span>Propuesta {commandsList.length > 1 ? `#${cmdIdx + 1}` : ''}</span>
                                <span 
                                  className={`px-2 py-0.5 rounded-full text-[8px] border ${
                                    command.status === 'approved' 
                                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' 
                                      : command.status === 'rejected'
                                        ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
                                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 animate-pulse-soft'
                                  }`}
                                >
                                  {command.status === 'approved' ? 'Aprobada' : command.status === 'rejected' ? 'Descartada' : 'Pendiente'}
                                </span>
                              </div>

                              {/* Contenido del Comando */}
                              <div className="p-3 text-[11px] space-y-2 text-slate-700 dark:text-slate-200">
                                {command.action === 'reschedule' && (
                                  <div>
                                    <p className="font-bold text-slate-900 dark:text-white">🗓️ Reprogramar Publicación</p>
                                    <p className="text-[10px] text-slate-500 dark:text-text-muted mt-1 leading-normal">
                                      Mover post <strong className="text-slate-800 dark:text-white">"{command.params.title || 'Calendario'}"</strong> a la fecha:
                                    </p>
                                    <p className="text-xs font-mono font-bold mt-1 text-indigo-600 dark:text-[#ffd166]">{command.params.date}</p>
                                  </div>
                                )}

                                {command.action === 'update_status' && (
                                  <div>
                                    <p className="font-bold text-slate-900 dark:text-white">🟢 Cambiar Estado del Post</p>
                                    <p className="text-[10px] text-slate-500 dark:text-text-muted mt-1">
                                      Actualizar estado de publicación a:
                                    </p>
                                    <p className="text-xs font-bold font-mono mt-1 uppercase text-emerald-600 dark:text-[#4ECDC4]">{command.params.status}</p>
                                  </div>
                                )}

                                {command.action === 'create' && (
                                  <div>
                                    <p className="font-bold text-slate-900 dark:text-white">✍️ Crear Nueva Publicación</p>
                                    <div className="text-[10px] text-slate-500 dark:text-text-muted space-y-1 mt-1 leading-normal">
                                      <p>• Título: <span className="text-slate-800 dark:text-white font-bold">{command.params.title}</span></p>
                                      <p>• Fecha: <span className="text-slate-800 dark:text-white font-bold">{command.params.date}</span></p>
                                      <p>• Canal: <span className="text-indigo-600 dark:text-[#38ef7d] font-bold">{command.params.channel}</span></p>
                                      {command.params.copy && <p className="italic mt-1 border-l-2 border-slate-200 dark:border-white/10 pl-2 text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">"{command.params.copy}"</p>}
                                    </div>
                                  </div>
                                )}

                                {command.action === 'delete' && (
                                  <div>
                                    <p className="font-bold text-red-500 dark:text-red-400">🗑️ Eliminar Publicación</p>
                                    <p className="text-[10px] text-slate-500 dark:text-text-muted mt-1 leading-normal">
                                      Eliminar el post seleccionado de forma permanente.
                                    </p>
                                  </div>
                                )}

                                {command.action === 'update_brand_profile' && (
                                  <div>
                                    <p className="font-bold text-slate-900 dark:text-white">🧬 Ajustar ADN de Marca</p>
                                    <p className="text-[10px] text-slate-500 dark:text-text-secondary leading-normal">
                                      Se actualizarán los siguientes campos en la Identidad del Cliente:
                                    </p>
                                    <div className="text-[10px] space-y-1.5 mt-2 bg-white dark:bg-black/30 p-2 rounded-xl border border-slate-200 dark:border-white/5">
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
                                            <strong className="text-slate-900 dark:text-white text-[9px] uppercase tracking-wider">{keyLabels[key] || key}:</strong>
                                            <span className="block text-slate-600 dark:text-slate-300 mt-0.5 text-[10px] italic">"{val}"</span>
                                          </p>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}

                                {command.action === 'run_trends' && (
                                  <div>
                                    <p className="font-bold text-slate-900 dark:text-white">🔍 Iniciar Búsqueda de Tendencias</p>
                                    <p className="text-[10px] text-slate-500 dark:text-text-muted mt-1 leading-normal">
                                      Escanear la web e indexar novedades en tiempo real con las palabras clave:
                                    </p>
                                    <p className="text-xs font-mono font-bold mt-1 text-indigo-600 dark:text-cyan-400 bg-white dark:bg-black/30 p-2 rounded-xl border border-slate-200 dark:border-white/5">
                                      "{command.params.keywords || 'Pilares de la marca'}"
                                    </p>
                                  </div>
                                )}

                                {command.action === 'reply_comment' && (
                                  <div>
                                    <p className="font-bold text-slate-900 dark:text-white">💬 Publicar Respuesta en Redes</p>
                                    <p className="text-[10px] text-slate-500 dark:text-text-muted mt-1 leading-normal">
                                      Responder al comentario en <span className="text-indigo-600 dark:text-emerald-400 font-bold uppercase">{command.params.platform || 'instagram'}</span>:
                                    </p>
                                    <p className="text-xs italic font-bold mt-1.5 text-indigo-600 dark:text-[#ffd166] bg-white dark:bg-black/30 p-2.5 rounded-xl border border-slate-200 dark:border-white/5 leading-relaxed">
                                      "{command.params.replyText}"
                                    </p>
                                  </div>
                                )}

                                {command.action === 'boost_post' && (
                                  <div>
                                    <p className="font-bold text-slate-900 dark:text-white">🚀 Promocionar Publicación</p>
                                    <div className="text-[10px] text-slate-500 dark:text-text-muted space-y-1 mt-2 leading-normal">
                                      <p>• ID del Post: <span className="text-slate-800 dark:text-white font-mono font-bold">{command.params.postId}</span></p>
                                      <p>• Presupuesto Total: <span className="text-indigo-600 dark:text-[#ffd166] font-bold">${command.params.budget} USD</span></p>
                                      <p>• Duración: <span className="text-indigo-600 dark:text-[#ffd166] font-bold">{command.params.days} días</span></p>
                                      <p>• Presupuesto Diario: <span className="text-slate-800 dark:text-white font-bold">${command.params.budget && command.params.days ? (parseFloat(command.params.budget) / parseInt(command.params.days)).toFixed(2) : '0.00'} USD/día</span></p>
                                    </div>
                                  </div>
                                )}

                                {command.action === 'generate_post_image' && (
                                  <div>
                                    <p className="font-bold text-slate-900 dark:text-white">🖼️ Generar Imagen para Publicación</p>
                                    <div className="text-[10px] text-slate-500 dark:text-text-muted space-y-1 mt-1 leading-normal">
                                      <p>• Post ID: <span className="text-slate-800 dark:text-white font-mono">{command.params.itemId}</span></p>
                                      <p>• Prompt de Imagen: <span className="text-slate-800 dark:text-white italic">"{command.params.image_prompt}"</span></p>
                                      <p>• Relación de Aspecto: <span className="text-indigo-600 dark:text-cyan-400 font-bold">{command.params.aspectRatio || '1:1'}</span></p>
                                    </div>
                                  </div>
                                )}

                                {command.action === 'transform_product_image' && (
                                  <div>
                                    <p className="font-bold text-slate-900 dark:text-white">🎨 Transformar Foto de Producto</p>
                                    <div className="text-[10px] text-slate-500 dark:text-text-muted space-y-1 mt-1 leading-normal">
                                      <p>• Prompt de Fondo: <span className="text-slate-800 dark:text-white italic">"{command.params.image_prompt}"</span></p>
                                      <p>• Formato: <span className="text-indigo-600 dark:text-cyan-400 font-bold">{command.params.aspectRatio || '1:1'}</span></p>
                                      {command.params.image_url && (
                                        <div className="mt-2 relative rounded-lg overflow-hidden border border-slate-200 dark:border-white/5 bg-slate-100 dark:bg-black/40 h-24 w-24">
                                          <img src={command.params.image_url} alt="Producto a editar" className="object-contain h-full w-full" />
                                        </div>
                                      )}
                                    </div>
                                    
                                    {command.status === 'approved' && command.resultUrl && (
                                      <div className="mt-3 bg-white dark:bg-black/50 border border-slate-200 dark:border-white/10 p-3 rounded-xl space-y-3">
                                        <p className="font-bold text-indigo-600 dark:text-[#ffd166] text-[10px] uppercase tracking-wider">Resultado de la Edición:</p>
                                        <div className="relative rounded-lg overflow-hidden border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-black/80 aspect-square w-full max-w-[240px] mx-auto">
                                          <img src={command.resultUrl} alt="Producto Transformado" className="object-contain h-full w-full" />
                                          
                                          <a 
                                            href={command.resultUrl} 
                                            target="_blank" 
                                            rel="noreferrer"
                                            download={`transformed-${Date.now()}.png`}
                                            className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-white/80 dark:bg-black/60 hover:bg-slate-100 dark:hover:bg-black text-slate-800 dark:text-white border border-slate-200 dark:border-white/10 transition-colors flex items-center justify-center cursor-pointer"
                                            title="Descargar imagen"
                                          >
                                            <ArrowDownTrayIcon className="h-4 w-4" />
                                          </a>
                                        </div>
                                        
                                        <ImageToPostAssociator 
                                          clientId={clientId} 
                                          resultData={{
                                            fileName: command.fileName,
                                            storagePath: command.storagePath,
                                            mimeType: command.mimeType,
                                            sizeBytes: command.sizeBytes
                                          }} 
                                        />
                                      </div>
                                    )}
                                  </div>
                                )}

                                {command.action === 'associate_image_to_post' && (
                                  <div>
                                    <p className="font-bold text-slate-900 dark:text-white">🔗 Asociar Imagen a Post</p>
                                    <div className="text-[10px] text-slate-500 dark:text-text-muted space-y-1 mt-1 leading-normal">
                                      <p>• Post ID: <span className="text-slate-800 dark:text-white font-mono">{command.params.itemId}</span></p>
                                      <p>• Ruta Storage: <span className="text-slate-800 dark:text-white font-mono">{command.params.storage_path}</span></p>
                                      {command.params.image_url && (
                                        <div className="mt-2 relative rounded-lg overflow-hidden border border-slate-200 dark:border-white/5 bg-slate-100 dark:bg-black/40 h-20 w-20">
                                          <img src={command.params.image_url} alt="A asociar" className="object-contain h-full w-full" />
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Botones de Doble Check */}
                              {command.status === 'pending' ? (
                                <div className="grid grid-cols-2 border-t border-slate-200 dark:border-white/10 bg-slate-100/60 dark:bg-slate-950/70">
                                  <button
                                    onClick={() => handleConfirmCommand(msg, cmdIdx)}
                                    className="px-3 py-2 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors flex items-center justify-center gap-1.5 border-r border-slate-200 dark:border-white/10 cursor-pointer"
                                  >
                                    <CheckIcon className="h-3.5 w-3.5" />
                                    <span>Confirmar Ajuste</span>
                                  </button>
                                  <button
                                    onClick={() => handleDiscardCommand(msg, cmdIdx)}
                                    className="px-3 py-2 text-[10px] font-bold text-red-500 dark:text-red-400 hover:bg-red-500/10 hover:text-red-700 dark:hover:text-red-300 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                                  >
                                    <NoSymbolIcon className="h-3.5 w-3.5" />
                                    <span>Descartar</span>
                                  </button>
                                </div>
                              ) : (
                                <div className="px-3 py-2 bg-slate-100 dark:bg-slate-950/90 text-center text-[10px] font-bold text-slate-400 dark:text-text-muted border-t border-slate-200 dark:border-white/10 flex items-center justify-center gap-1 font-mono">
                                  {command.status === 'approved' ? (
                                    <>
                                      <CheckIcon className="h-3.5 w-3.5 text-emerald-500" />
                                      <span className="text-emerald-600 dark:text-emerald-400/90 uppercase tracking-widest text-[9px]">Ajuste Aplicado con Éxito</span>
                                    </>
                                  ) : (
                                    <>
                                      <NoSymbolIcon className="h-3.5 w-3.5 text-red-500/80" />
                                      <span className="text-red-600 dark:text-red-400/80 uppercase tracking-widest text-[9px]">Ajuste Descartado</span>
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

            {/* Estado de Pensando */}
            {loading && (
              <div className="flex flex-col items-start gap-1.5 animate-pulse">
                <span className="text-[8.5px] font-mono font-bold text-slate-400 dark:text-text-secondary tracking-widest uppercase px-1">
                  {bio.name}
                </span>
                <div className="bg-white dark:bg-[#121825]/90 border border-slate-200/80 dark:border-white/5 p-3 rounded-2xl rounded-tl-none flex items-center gap-1.5 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 dark:bg-cyan-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 dark:bg-cyan-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 dark:bg-cyan-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>
        )}

        {/* Input de archivo oculto para adjuntar imágenes */}
        <input 
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          disabled={loading}
        />

        {/* Vista previa de imagen adjunta antes de enviar */}
        {selectedImagePreview && (
          <div className="px-3.5 py-1.5 bg-white dark:bg-slate-950/90 border-t border-slate-200 dark:border-white/10 flex items-center gap-2.5">
            <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-black/40 flex-shrink-0">
              <img src={selectedImagePreview} alt="Adjunto" className="object-contain h-full w-full" />
              <button
                type="button"
                onClick={() => { setSelectedImage(null); setSelectedImagePreview(null); }}
                className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-black/80 hover:bg-black text-white hover:text-red-400 transition-colors cursor-pointer"
              >
                <XMarkIcon className="h-2.5 w-2.5" />
              </button>
            </div>
            <div className="text-[9px] text-slate-400 dark:text-text-secondary leading-normal truncate">
              <p className="font-bold text-slate-800 dark:text-white truncate max-w-[220px]">{selectedImage?.name || 'imagen.png'}</p>
              <p>{selectedImage?.size ? (selectedImage.size / 1024).toFixed(0) : '0'} KB • Listo para enviar</p>
            </div>
          </div>
        )}

        {/* Barra de Entrada / Envío Estilo Píldora Flotante (Gemini Style) */}
        {viewMode === 'chat' && (
          <div className="bg-transparent flex flex-col p-3 border-t border-slate-200/50 dark:border-white/5">
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
              className="flex items-center gap-2 p-2.5 rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-sm focus-within:ring-1 focus-within:ring-indigo-500/30 dark:focus-within:ring-cyan-400/30 focus-within:border-indigo-400 dark:focus-within:border-cyan-400/40 transition-all duration-200"
            >
              {/* Botón de Adjuntar - Dentro de la píldora */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="p-1.5 rounded-full text-slate-400 dark:text-text-muted hover:text-indigo-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-all cursor-pointer flex items-center justify-center flex-shrink-0"
                title="Adjuntar Imagen"
              >
                <PlusIcon className="h-5 w-5" />
              </button>

              <input 
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={placeholderText}
                className="flex-1 bg-transparent border-none outline-none px-1 text-xs text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-text-secondary focus:ring-0 focus:outline-none"
                disabled={loading}
              />

              {/* Botón de Envío - Círculo con Flecha arriba */}
              <button 
                type="submit"
                disabled={(!inputValue.trim() && !selectedImagePreview) || loading}
                className={`p-1.5 rounded-full flex items-center justify-center transition-all duration-200 ${
                  (inputValue.trim() || selectedImagePreview) && !loading
                    ? 'bg-indigo-600 dark:bg-white text-white dark:text-black hover:bg-indigo-700 dark:hover:bg-slate-200 cursor-pointer shadow-sm'
                    : 'bg-slate-100 dark:bg-white/5 text-slate-300 dark:text-text-muted cursor-not-allowed'
                }`}
                title="Enviar mensaje"
              >
                <ArrowUpIcon className="h-4 w-4" />
              </button>
            </form>

            {/* Pie de Página de Advertencia */}
            <p className="text-[9px] text-slate-400 dark:text-text-secondary text-center mt-2 px-4 leading-normal">
              Aura puede cometer errores. Considera verificar la información importante.
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};
