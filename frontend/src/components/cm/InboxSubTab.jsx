// src/components/cm/InboxSubTab.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { apiFetch } from '../../api/apiFetch';
import { InteractiveAvatar } from '../ui/InteractiveAvatar';
import {
  ArrowPathIcon,
  SparklesIcon,
  LinkIcon,
  InformationCircleIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';

export const InboxSubTab = ({
  clientId,
  integration,
  // Meta OAuth variables passed down from container
  oauthStep,
  setOauthStep,
  connectingOAuth,
  handleFacebookOAuth,
  adAccountsList,
  pagesList,
  selectedAccountId,
  setSelectedAccountId,
  selectedPageId,
  setSelectedPageId,
  connecting,
  handleConfirmOnboarding,
}) => {
  const [threads, setThreads] = useState([]);
  const [selectedThreadId, setSelectedThreadId] = useState('');
  const [loadingThreads, setLoadingThreads] = useState(false);
  const [platformFilter, setPlatformFilter] = useState('all'); // 'all' | 'facebook' | 'instagram'
  const [statusFilter, setStatusFilter] = useState('pending'); // 'pending' | 'escalated' | 'replied'
  const [searchQuery, setSearchQuery] = useState('');

  // AI draft editing states
  const [activeDraft, setActiveDraft] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [loadingDraft, setLoadingDraft] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [approving, setApproving] = useState(false);
  const [customAIInstruction, setCustomAIInstruction] = useState('');

  // Cargar comentarios en vivo
  const fetchThreads = async (silent = false) => {
    try {
      if (!silent) setLoadingThreads(true);
      const res = await apiFetch(`/clients/${clientId}/meta-integration/comments`);
      const fetchedThreads = res.data || [];
      setThreads(fetchedThreads);
      
      if (fetchedThreads.length > 0) {
        const currentExists = fetchedThreads.some(t => t.id === selectedThreadId);
        if (!currentExists) {
          setSelectedThreadId(fetchedThreads[0].id);
        }
      } else {
        setSelectedThreadId('');
      }
    } catch (err) {
      console.error(err);
      toast.error('No se pudieron cargar los comentarios en vivo.');
    } finally {
      if (!silent) setLoadingThreads(false);
    }
  };

  // Cargar comentarios al montar e integrar
  useEffect(() => {
    if (integration) {
      fetchThreads();
    } else {
      setThreads([]);
      setSelectedThreadId('');
    }
  }, [integration, clientId]);

  // Sync draft when thread changes (Lazy load if missing)
  const activeThread = threads.find(t => t.id === selectedThreadId);
  useEffect(() => {
    if (!activeThread) {
      setActiveDraft('');
      return;
    }
    
    // Si ya posee el borrador de IA, lo fijamos de inmediato sin hacer red redundante (cambio instantáneo de 0ms)
    if (activeThread.aiDraft) {
      setActiveDraft(activeThread.aiDraft);
      setIsEditing(false);
      return;
    }
    
    // Si no posee el borrador, se carga de forma perezosa (lazy load)
    const loadLazyDraft = async () => {
      try {
        setLoadingDraft(true);
        setActiveDraft('Analizando comentario con IA...');
        
        const res = await apiFetch(
          `/clients/${clientId}/meta-integration/comments/${activeThread.id}/draft?commentText=${encodeURIComponent(activeThread.comment)}&platform=${activeThread.platform}`
        );
        
        if (res.data) {
          const { aiDraft, sentiment, tag, aiConfidence, contextUsed } = res.data;
          
          // Actualizar el hilo en el estado local del componente para conservar el análisis e impedir reconexiones
          setThreads(prev => prev.map(t => t.id === activeThread.id ? {
            ...t,
            aiDraft,
            sentiment,
            tag,
            aiConfidence,
            contextUsed
          } : t));
          
          setActiveDraft(aiDraft);
        }
      } catch (err) {
        console.error('Error al cargar borrador perezoso:', err);
        setActiveDraft('No se pudo generar el borrador automático de IA.');
      } finally {
        setLoadingDraft(false);
        setIsEditing(false);
      }
    };
    
    loadLazyDraft();
  }, [selectedThreadId, threads, clientId]);

  // Filter threads using useMemo for optimal rendering performance
  const filteredThreads = useMemo(() => {
    return threads.filter(thread => {
      const matchesSearch = 
        thread.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        thread.comment.toLowerCase().includes(searchQuery.toLowerCase()) ||
        thread.postTitle.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (!matchesSearch) return false;
      
      // Platform Filter
      if (platformFilter !== 'all' && thread.platform?.toLowerCase() !== platformFilter) return false;
      
      // Status Filter
      if (statusFilter === 'pending' && thread.status !== 'pending') return false;
      if (statusFilter === 'escalated' && thread.status !== 'escalated') return false;
      if (statusFilter === 'replied' && thread.status !== 'replied') return false;
      
      return true;
    });
  }, [threads, searchQuery, platformFilter, statusFilter]);

  // Calculate statistics
  const pendingCount = threads.filter(t => t.status === 'pending').length;
  const escalatedCount = threads.filter(t => t.status === 'escalated').length;
  const totalReplied = threads.filter(t => t.status === 'replied').length;

  // Handle Draft Save / Approve
  const handleApprove = async () => {
    if (!activeThread) return;
    setApproving(true);
    
    try {
      await apiFetch(`/clients/${clientId}/meta-integration/comments/${activeThread.id}/reply`, {
        method: 'POST',
        body: JSON.stringify({ replyText: activeDraft, platform: activeThread.platform })
      });
      
      setThreads(prev => prev.map(t => {
        if (t.id === activeThread.id) {
          return {
            ...t,
            status: 'replied',
            replySent: activeDraft,
          };
        }
        return t;
      }));
      
      toast.success(`Respuesta enviada con éxito a @${activeThread.user.name} en ${activeThread.platform}`);
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Error al enviar la respuesta a la red social.');
    } finally {
      setApproving(false);
    }
  };

  // Handle AI Regeneration Tweak
  const handleRegenerate = async (instruction) => {
    if (!activeThread) return;
    setRegenerating(true);
    
    const idToast = toast.loading('Ajustando borrador con IA...', { id: 'tweak-comment-toast' });
    try {
      const res = await apiFetch(`/clients/${clientId}/meta-integration/comments/tweak`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commentText: activeThread.comment,
          currentDraft: activeDraft,
          instruction,
          brandVoice: integration?.brand_voice || '',
          businessDescription: integration?.business_description || ''
        })
      });
      
      if (res.data?.draft) {
        setActiveDraft(res.data.draft);
        toast.success('Borrador ajustado con éxito.', { id: 'tweak-comment-toast' });
      } else {
        throw new Error('La respuesta de IA no devolvió un borrador válido.');
      }
    } catch (err) {
      console.error('Error al ajustar el borrador:', err);
      toast.error(err.message || 'Error al ajustar el borrador.', { id: 'tweak-comment-toast' });
    } finally {
      setRegenerating(false);
    }
  };

  const getSentimentBadge = (sentiment) => {
    if (sentiment === 'positive') return <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide select-none">Positivo</span>;
    if (sentiment === 'negative') return <span className="bg-rose-500/10 text-rose-600 dark:text-rose-400 px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide select-none">Queja</span>;
    return <span className="bg-accent-blue/10 text-accent-blue px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide select-none">Consulta</span>;
  };

  return (
    <div className="w-full">
      {!integration ? (
        <div className="max-w-4xl mx-auto flex flex-col items-center justify-center py-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className={`w-full bg-app-sidebar border border-border-subtle rounded-3xl p-6 md:p-10 shadow-2xl relative backdrop-blur-xl ${
              oauthStep === 'select_account' ? 'overflow-visible z-30' : 'overflow-hidden'
            }`}
          >
            {/* Neon Ecosistema glow effects */}
            <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
            <div className="absolute -left-20 -bottom-20 w-80 h-80 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

            <div className="flex flex-col items-center text-center mb-8 relative z-10">
              <InteractiveAvatar variant="cm" size="xl" className="mb-4" />
              <h3 className="text-2xl font-black text-text-primary font-title">
                CM Inteligente
              </h3>
              <p className="text-xs text-text-muted max-w-lg mt-2 leading-relaxed">
                Activa la auto-respuesta y asistencia en tiempo real de IA en tus redes sociales.
                Vincula la cuenta de Facebook en un solo clic para sincronizar tus páginas y cuentas de Instagram.
              </p>
            </div>

            <AnimatePresence mode="wait">
              {oauthStep === 'connect' ? (
                <motion.div
                  key="oauth-connect"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-6 max-w-md mx-auto relative z-10 text-center"
                >
                  <button
                    type="button"
                    onClick={handleFacebookOAuth}
                    disabled={connectingOAuth}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm py-4 rounded-xl transition-all duration-200 shadow-xl flex items-center justify-center gap-3 transform hover:scale-[1.01] hover:shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                  >
                    {connectingOAuth ? (
                      <ArrowPathIcon className="h-5 w-5 animate-spin" />
                    ) : (
                      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                    )}
                    <span>Conectar de forma rápida con Facebook Login</span>
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="oauth-select"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-5 max-w-md mx-auto relative z-10 text-left overflow-visible"
                >
                  <div className="bg-surface border border-emerald-500/20 p-4 rounded-2xl flex items-center gap-3">
                    <SparklesIcon className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                    <p className="text-[10px] text-emerald-200 leading-relaxed">
                      ¡Autorización sincronizada! Meta ha devuelto tus cuentas vinculadas.
                      Elige los perfiles para automatizar y administrar:
                    </p>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1.5 px-1">
                      1. Cuenta Publicitaria (Meta Ads):
                    </label>
                    {adAccountsList.length > 0 ? (
                      <select
                        value={selectedAccountId}
                        onChange={e => setSelectedAccountId(e.target.value)}
                        className="w-full bg-surface border border-border-subtle rounded-xl px-4 py-3 text-xs text-text-primary font-bold focus:outline-none focus:border-emerald-500 transition-colors z-20 relative cursor-pointer"
                      >
                        {adAccountsList.map(acc => (
                          <option key={acc.id} value={acc.id} className="bg-slate-950 text-white font-sans py-2.5">
                            {acc.name} ({acc.id})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3.5 rounded-xl text-xs flex flex-col gap-1">
                        <span className="font-bold flex items-center gap-1.5 text-[11px]">
                          ⚠️ No se encontraron Cuentas Publicitarias
                        </span>
                        <p className="text-[10px] text-text-muted leading-relaxed">
                          Asegúrate de tener al menos una cuenta de anuncios activa en tu Administrador Comercial de Facebook.
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1.5 px-1">
                      2. Página de Facebook e Instagram (CM):
                    </label>
                    {pagesList.length > 0 ? (
                      <select
                        value={selectedPageId}
                        onChange={e => setSelectedPageId(e.target.value)}
                        className="w-full bg-surface border border-border-subtle rounded-xl px-4 py-3 text-xs text-text-primary font-bold focus:outline-none focus:border-emerald-500 transition-colors z-20 relative cursor-pointer"
                      >
                        {pagesList.map(page => (
                          <option key={page.id} value={page.id} className="bg-slate-950 text-white font-sans py-2.5">
                            {page.name} {page.instagram ? `(@${page.instagram.username})` : '(Sin Instagram conectado)'}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3.5 rounded-xl text-xs flex flex-col gap-1">
                        <span className="font-bold flex items-center gap-1.5 text-[11px]">
                          ⚠️ No se encontraron Páginas o Instagrams
                        </span>
                        <p className="text-[10px] text-text-muted leading-relaxed">
                          Tu perfil de Facebook no parece administrar ninguna Página comercial, o bien no seleccionaste ninguna al iniciar sesión en el popup. Por favor, vuelve a iniciar sesión y marca las casillas de tus páginas.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 flex gap-3">
                    <button
                      type="button"
                      onClick={handleConfirmOnboarding}
                      disabled={connecting || adAccountsList.length === 0 || pagesList.length === 0}
                      className="flex-1 bg-text-primary hover:bg-white text-app-sidebar font-bold text-xs py-3.5 rounded-xl transition-all duration-200 shadow-xl flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {connecting ? (
                        <ArrowPathIcon className="h-4 w-4 animate-spin" />
                      ) : (
                        <LinkIcon className="h-4 w-4" />
                      )}
                      <span>Confirmar Conexión y Activar CM</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setOauthStep('connect')}
                      className="px-4 border border-border-subtle bg-surface hover:bg-surface-soft text-text-secondary font-bold text-xs py-3.5 rounded-xl transition-all duration-200 cursor-pointer"
                    >
                      Atrás
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <div className="mt-8 p-4 bg-surface border border-border-subtle rounded-2xl max-w-lg mx-auto flex items-start gap-3 relative z-10">
            <InformationCircleIcon className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div className="text-[10px] text-text-muted leading-relaxed">
              <span className="font-bold text-text-secondary">Conexión Segura vía OAuth:</span> Al usar el login de Facebook, Meta autoriza a Cadence de forma encriptada para leer y responder comentarios en vivo en tus cuentas vinculadas. Las credenciales se resguardan bajo la estricta seguridad de Supabase.
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto w-full flex flex-col gap-6">
          {/* Filtros y Búsqueda */}
          <div className="bg-surface border border-border-subtle rounded-2xl p-4 flex flex-col gap-4 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-3.5 w-3.5 text-text-muted" />
                <input
                  type="text"
                  placeholder="Buscar comentarios por usuario o contenido..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-surface border border-border-subtle rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-accent-blue transition-colors"
                />
              </div>
              <button
                type="button"
                onClick={() => fetchThreads(false)}
                disabled={loadingThreads}
                className="btn-cyber p-2.5 flex items-center justify-center cursor-pointer"
                title="Actualizar bandeja"
              >
                <ArrowPathIcon className={`h-4 w-4 ${loadingThreads ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border-subtle">
              {/* Selector de Canal */}
              <div className="flex items-center gap-1 bg-surface-soft p-1 rounded-lg border border-border-subtle">
                {[
                  { id: 'all', label: 'Todos los Canales' },
                  { id: 'facebook', label: 'Facebook' },
                  { id: 'instagram', label: 'Instagram' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setPlatformFilter(tab.id)}
                    className={`flex-1 text-[10px] font-bold py-1.5 rounded-md transition-all cursor-pointer ${
                      platformFilter === tab.id 
                        ? 'bg-surface text-text-primary border border-border-subtle shadow-xs' 
                        : 'text-text-muted hover:text-text-primary'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Selector de Estado */}
              <div className="flex items-center gap-1 bg-surface-soft p-1 rounded-lg border border-border-subtle">
                {[
                  { id: 'pending', label: `Pendientes (${pendingCount})` },
                  { id: 'escalated', label: `Escalados (${escalatedCount})` },
                  { id: 'replied', label: `Respondidos (${totalReplied})` },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setStatusFilter(tab.id)}
                    className={`flex-1 text-[10px] font-bold py-1.5 rounded-md transition-all cursor-pointer truncate ${
                      statusFilter === tab.id 
                        ? 'bg-surface text-text-primary border border-border-subtle shadow-xs' 
                        : 'text-text-muted hover:text-text-primary'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Lista de Comentarios en Formato Feed */}
          <div className="space-y-4">
            {loadingThreads ? (
              <div className="flex flex-col items-center justify-center p-12 text-center text-text-muted bg-surface border border-border-subtle rounded-2xl h-64">
                <ArrowPathIcon className="h-6 w-6 animate-spin text-accent-cyan mb-2" />
                <p className="text-xs font-semibold tracking-wider uppercase text-text-muted/65">
                  Cargando comentarios...
                </p>
              </div>
            ) : filteredThreads.length > 0 ? (
              filteredThreads.map(thread => {
                const isExpanded = thread.id === selectedThreadId;
                return (
                  <motion.div
                    key={thread.id}
                    layout="position"
                    transition={{ duration: 0.2 }}
                    className={`bg-surface border rounded-2xl overflow-hidden transition-all duration-200 ${
                      isExpanded 
                        ? 'border-accent-blue/40 shadow-md ring-1 ring-accent-blue/10' 
                        : 'border-border-subtle hover:border-border-muted shadow-xs'
                    }`}
                  >
                    {/* Cabecera del Comentario */}
                    <div 
                      onClick={() => setSelectedThreadId(isExpanded ? '' : thread.id)}
                      className="p-5 cursor-pointer select-none flex flex-col gap-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={thread.user.avatar}
                            alt={thread.user.name}
                            className="w-8 h-8 rounded-full object-cover border border-border-subtle flex-shrink-0"
                          />
                          <div className="flex flex-col min-w-0">
                            <span className="text-[13px] font-bold text-text-primary truncate">
                              @{thread.user.name}
                            </span>
                            <span className="text-[9px] text-text-muted font-medium truncate max-w-[250px] sm:max-w-[400px]">
                              en {thread.postTitle || 'Publicación'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-[9px] font-bold text-text-secondary bg-surface-soft border border-border-subtle px-2.5 py-0.5 rounded-full uppercase tracking-wider select-none">
                            {thread.platform}
                          </span>
                          <span className="text-[10px] text-text-muted">{thread.time}</span>
                        </div>
                      </div>

                      {/* Contenido del Comentario */}
                      <div className="text-xs text-text-secondary leading-relaxed font-medium pl-0.5 whitespace-pre-wrap">
                        {thread.comment}
                      </div>

                      {/* Pie de tarjeta colapsada */}
                      {!isExpanded && (
                        <div className="flex items-center justify-between pt-2 border-t border-border-subtle/50 mt-1">
                          <div className="flex items-center gap-1.5">
                            {getSentimentBadge(thread.sentiment)}
                          </div>
                          <span className="text-[10px] text-accent-blue font-bold hover:underline flex items-center gap-1 cursor-pointer">
                            {thread.status === 'replied' ? 'Ver respuesta' : 'Hacer clic para responder'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Cuerpo Expandido: Editor e IA */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="border-t border-border-subtle bg-surface-soft/20 overflow-hidden"
                        >
                          <div className="p-5 flex flex-col gap-4">
                            <div className="flex gap-3.5 items-start">
                              <div className="w-7 h-7 rounded-full bg-accent-blue/10 border border-accent-blue/20 text-accent-blue flex items-center justify-center flex-shrink-0 text-xs select-none">
                                🤖
                              </div>
                              <div className="flex-1 flex flex-col bg-surface-soft/40 border border-border-subtle rounded-2xl rounded-tl-xs p-4 gap-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-[11px] font-bold text-text-primary">
                                    {thread.status === 'replied' ? 'Respuesta enviada' : 'Borrador sugerido por IA'}
                                  </span>
                                  {getSentimentBadge(thread.sentiment)}
                                </div>

                                {/* Area de Texto de Respuesta */}
                                <div className="relative">
                                  {thread.status === 'replied' ? (
                                    <div className="bg-surface/30 border border-border-subtle rounded-xl p-3.5 text-xs text-text-secondary leading-relaxed font-medium whitespace-pre-wrap select-text">
                                      {thread.replySent || activeDraft}
                                    </div>
                                  ) : isEditing ? (
                                    <textarea
                                      value={activeDraft}
                                      onChange={e => setActiveDraft(e.target.value)}
                                      className="w-full bg-surface border border-accent-blue/40 rounded-xl p-3 text-xs text-text-primary focus:outline-none leading-relaxed font-medium min-h-[100px]"
                                    />
                                  ) : (
                                    <div className="bg-surface/30 border border-border-subtle rounded-xl p-3 text-xs text-text-secondary leading-relaxed font-medium whitespace-pre-wrap select-text min-h-[100px]">
                                      {loadingDraft ? (
                                        <div className="flex items-center justify-center h-20 text-text-muted gap-2">
                                          <ArrowPathIcon className="h-4 w-4 animate-spin text-accent-cyan" />
                                          <span>Generando borrador...</span>
                                        </div>
                                      ) : activeDraft}
                                    </div>
                                  )}
                                </div>

                                {/* Barra de ajuste personalizado con IA */}
                                {!loadingDraft && thread.status !== 'replied' && (
                                  <div className="flex items-center gap-2.5 pt-2 border-t border-border-subtle/50 w-full">
                                    <button
                                      onClick={() => setIsEditing(!isEditing)}
                                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-subtle bg-surface hover:bg-surface-soft text-[10px] font-bold text-text-secondary transition-all cursor-pointer flex-shrink-0"
                                    >
                                      <PencilIcon className="w-3.5 h-3.5" />
                                      <span>{isEditing ? 'Fijar' : 'Editar'}</span>
                                    </button>

                                    <div className="h-4 w-px bg-border-subtle flex-shrink-0" />

                                    <div className="relative flex-1">
                                      <input
                                        type="text"
                                        placeholder="Ajustar respuesta con IA (ej: 'más formal')..."
                                        value={customAIInstruction}
                                        onChange={e => setCustomAIInstruction(e.target.value)}
                                        disabled={regenerating}
                                        className="w-full bg-surface border border-border-subtle rounded-lg px-3 py-1.5 text-[10px] text-text-primary focus:outline-none focus:border-accent-blue transition-colors"
                                        onKeyDown={e => {
                                          if (e.key === 'Enter' && customAIInstruction.trim()) {
                                            handleRegenerate(customAIInstruction.trim());
                                            setCustomAIInstruction('');
                                          }
                                        }}
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Acciones de envío */}
                            <div className="pt-3 border-t border-border-subtle/55 flex items-center justify-between gap-3">
                              {thread.status === 'replied' ? (
                                <div className="w-full bg-accent-blue/5 border border-accent-blue/10 text-accent-blue py-2.5 rounded-xl flex items-center justify-center gap-2 text-xs font-bold select-none">
                                  <CheckIcon className="h-4.5 w-4.5" />
                                  <span>Publicado correctamente</span>
                                </div>
                              ) : (
                                <>
                                  <div className="flex gap-2">
                                    {thread.status !== 'escalated' && (
                                      <button
                                        onClick={() => {
                                          setThreads(prev => prev.map(t => t.id === thread.id ? { ...t, status: 'escalated' } : t));
                                          toast.error('Comentario derivado a soporte humano.');
                                        }}
                                        className="text-xs font-bold text-text-muted hover:text-error px-3 py-2 rounded-xl transition-all cursor-pointer"
                                      >
                                        Derivar a Humano
                                      </button>
                                    )}
                                  </div>

                                  <div className="flex gap-2 ml-auto">
                                    <button
                                      onClick={handleApprove}
                                      disabled={approving || regenerating || !activeDraft.trim() || loadingDraft}
                                      className="flex items-center justify-center gap-1.5 px-6 py-2.5 text-xs font-bold text-white bg-accent-blue hover:bg-accent-blue/90 rounded-xl transition-all cursor-pointer shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                      {approving ? (
                                        <ArrowPathIcon className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <CheckIcon className="h-4 w-4" />
                                      )}
                                      <span>Responder</span>
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center p-12 text-center text-text-muted bg-surface border border-border-subtle rounded-2xl h-64">
                <p className="text-xs font-medium text-text-muted">No hay comentarios en esta bandeja.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
