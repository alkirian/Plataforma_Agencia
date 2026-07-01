// src/components/cm/InboxSubTab.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useLanguage } from '../../hooks';
import { apiFetch } from '../../api/apiFetch';
import { InteractiveAvatar } from '../ui/InteractiveAvatar';
import { cmCache } from './cmCache';
import {
  ArrowPathIcon,
  SparklesIcon,
  LinkIcon,
  InformationCircleIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';


const formatCommentText = (text) => {
  if (!text) return null;
  const regex = /(@[a-zA-Z0-9_.]+)/g;
  const parts = text.split(regex);
  return parts.map((part, i) => {
    if (part.startsWith('@')) {
      return (
        <span key={i} className="text-accent-cyan font-bold hover:underline select-all cursor-pointer">
          {part}
        </span>
      );
    }
    return part;
  });
};

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
  qrMode,
  setQrMode,
  deviceUserCode,
  deviceStatus,
  qrLoading,
  startQrFlow,
}) => {
  const { t, lang } = useLanguage();
  const cachedThreads = cmCache.get(clientId).threads;
  const [threads, setThreads] = useState(cachedThreads || []);
  const [selectedThreadId, setSelectedThreadId] = useState(() => {
    return cachedThreads && cachedThreads.length > 0 ? cachedThreads[0].id : '';
  });
  const [loadingThreads, setLoadingThreads] = useState(!cachedThreads);
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
      const cached = cmCache.get(clientId).threads;
      if (cached && !silent) {
        setThreads(cached);
        setLoadingThreads(false);
      } else if (!silent) {
        setLoadingThreads(true);
      }

      const res = await apiFetch(`/clients/${clientId}/meta-integration/comments`);
      const fetchedThreads = res.data || [];
      setThreads(fetchedThreads);
      cmCache.setThreads(clientId, fetchedThreads);
      
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
      toast.error(t.cm.loadThreadsError);
    } finally {
      if (!silent) setLoadingThreads(false);
    }
  };

  // Cargar comentarios al montar e integrar
  useEffect(() => {
    if (integration && integration.meta_page_id) {
      fetchThreads();
    } else {
      setThreads([]);
      setSelectedThreadId('');
    }
  }, [integration, clientId]);

  // Sincronizar hilos con la caché
  useEffect(() => {
    if (threads && threads.length > 0) {
      cmCache.setThreads(clientId, threads);
    }
  }, [threads, clientId]);

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
        setActiveDraft(t.cm.analyzingComment);
        
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
        setActiveDraft(t.cm.loadDraftError);
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
      
      toast.success(t.cm.replySuccess.replace('{name}', activeThread.user.name).replace('{platform}', activeThread.platform));
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
    
    const idToast = toast.loading(t.cm.adjustingDraft, { id: 'tweak-comment-toast' });
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
        toast.success(t.cm.adjustSuccess, { id: 'tweak-comment-toast' });
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
    if (sentiment === 'positive') return <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide select-none">{t.cm.sentimentPositive}</span>;
    if (sentiment === 'negative') return <span className="bg-rose-500/10 text-rose-600 dark:text-rose-400 px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide select-none">{t.cm.sentimentComplaint}</span>;
    return <span className="bg-accent-blue/10 text-accent-blue px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide select-none">{t.cm.sentimentQuery}</span>;
  };

  return (
    <div className="w-full">
      {!integration || !integration.meta_page_id ? (
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
                {t.cm.title}
              </h3>
              <p className="text-xs text-text-muted max-w-lg mt-2 leading-relaxed">
                {t.cm.activateDesc}
              </p>
            </div>

            <AnimatePresence mode="wait">
              {qrMode ? (
                /* VISTA DEVICE LOGIN */
                <motion.div
                  key='device-view'
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="space-y-5 max-w-md mx-auto relative z-10 text-center flex flex-col items-center"
                >
                  <div className="bg-surface border border-emerald-500/20 p-4 rounded-2xl flex items-start gap-3 text-left w-full">
                    <SparklesIcon className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <p className="text-[11px] text-emerald-200 leading-relaxed">
                      Abre <strong className="text-white">facebook.com/device</strong> en tu celular e ingresa el siguiente código para vincular tu cuenta.
                    </p>
                  </div>

                  {qrLoading ? (
                    <div className="w-full h-28 bg-surface rounded-2xl flex items-center justify-center border border-border-subtle">
                      <ArrowPathIcon className="h-7 w-7 animate-spin text-emerald-400" />
                    </div>
                  ) : (
                    <div className="w-full flex flex-col sm:flex-row items-center gap-4 bg-gradient-to-br from-emerald-900/40 to-teal-900/30 border-2 border-emerald-500/40 rounded-2xl py-5 px-6 shadow-xl">
                      {/* Código QR con user_code pre-completado */}
                      <div className="relative p-2 bg-white rounded-2xl shadow-md border-2 border-emerald-500/20 overflow-hidden flex-shrink-0">
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&color=0b0b14&data=${encodeURIComponent('https://www.facebook.com/device?user_code=' + deviceUserCode)}`}
                          alt="Código QR de Conexión"
                          className="w-28 h-28 rounded-xl select-none"
                        />
                      </div>
                      {/* Código de texto */}
                      <div className="flex-1 text-center sm:text-left">
                        <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1">Tu código de acceso</p>
                        <p className="text-3xl font-black tracking-[0.2em] text-white select-all font-mono">{deviceUserCode || '------'}</p>
                        <p className="text-[9px] text-emerald-300/70 mt-2 leading-relaxed">
                          Escanea el código QR con la cámara de tu celular para abrir Facebook con el código ya pre-completado de forma automática.
                        </p>
                      </div>
                    </div>
                  )}

                  <a
                    href="https://www.facebook.com/device"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-[#1877F2] hover:bg-[#166FE5] text-white font-bold text-sm py-3.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                    Abrir facebook.com/device
                  </a>

                  <div className="flex flex-col items-center gap-1">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-yellow-400 animate-ping" />
                      <span className="text-xs font-bold text-text-primary">Esperando que ingreses el código...</span>
                    </div>
                    <span className="text-[10px] text-text-muted max-w-xs">
                      Esta pantalla avanzará automáticamente cuando autorices en tu celular.
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setQrMode(false)}
                    className="w-full border border-border-subtle bg-surface hover:bg-surface-soft text-text-secondary font-bold text-xs py-3 rounded-xl transition-all duration-200"
                  >
                    Cancelar y Volver
                  </button>
                </motion.div>
              ) : oauthStep === 'connect' ? (
                <motion.div
                  key="oauth-connect"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-4 max-w-md mx-auto relative z-10 text-center"
                >
                  <button
                    type="button"
                    onClick={handleFacebookOAuth}
                    disabled={connectingOAuth}
                    className="w-full bg-[#1877F2] hover:bg-[#166FE5] text-white font-bold text-sm py-4 rounded-xl transition-all duration-200 shadow-xl flex items-center justify-center gap-3 transform hover:scale-[1.01]"
                  >
                    {connectingOAuth ? (
                      <ArrowPathIcon className="h-5 w-5 animate-spin" />
                    ) : (
                      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                    )}
                    <span>{t.cm.connectFacebook}</span>
                  </button>

                  {/* Botón para iniciar flujo QR */}
                  <button
                    type="button"
                    onClick={startQrFlow}
                    disabled={connectingOAuth}
                    className="w-full border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-200 font-bold text-sm py-3.5 rounded-xl transition-all duration-200 shadow-lg flex items-center justify-center gap-2 transform hover:scale-[1.01]"
                  >
                    <svg className='w-5 h-5' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
                      <path strokeLinecap='round' strokeLinejoin='round' d='M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z' />
                    </svg>
                    <span>Conectar desde el Celular (sin contraseña)</span>
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
                      {t.cm.authSuccessDesc}
                    </p>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1.5 px-1">
                      {t.cm.adAccountLabel}
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
                          {t.cm.noAdAccounts}
                        </span>
                        <p className="text-[10px] text-text-muted leading-relaxed">
                          {t.cm.checkAdAccount}
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1.5 px-1">
                      {t.cm.facebookPageLabel}
                    </label>
                    {pagesList.length > 0 ? (
                      <select
                        value={selectedPageId}
                        onChange={e => setSelectedPageId(e.target.value)}
                        className="w-full bg-surface border border-border-subtle rounded-xl px-4 py-3 text-xs text-text-primary font-bold focus:outline-none focus:border-emerald-500 transition-colors z-20 relative cursor-pointer"
                      >
                        {pagesList.map(page => (
                          <option key={page.id} value={page.id} className="bg-slate-950 text-white font-sans py-2.5">
                            {page.name} {page.instagram ? `(@${page.instagram.username})` : t.cm.noInstagramConnected}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3.5 rounded-xl text-xs flex flex-col gap-1">
                        <span className="font-bold flex items-center gap-1.5 text-[11px]">
                          {t.cm.noPages}
                        </span>
                        <p className="text-[10px] text-text-muted leading-relaxed">
                          {t.cm.checkPages}
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
                      <span>{t.cm.confirmConnection}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setOauthStep('connect')}
                      className="px-4 border border-border-subtle bg-surface hover:bg-surface-soft text-text-secondary font-bold text-xs py-3.5 rounded-xl transition-all duration-200 cursor-pointer"
                    >
                      {t.common.back}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <div className="mt-8 p-4 bg-surface border border-border-subtle rounded-2xl max-w-lg mx-auto flex items-start gap-3 relative z-10">
            <InformationCircleIcon className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div className="text-[10px] text-text-muted leading-relaxed">
              <span className="font-bold text-text-secondary">{t.cm.secureConnectionTitle}</span> {t.cm.secureConnectionDesc}
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto w-full flex flex-col gap-6">
          {/* Filtros y Búsqueda */}
          <div className="flex flex-col lg:flex-row items-center gap-3 w-full">
            {/* Buscador */}
            <div className="relative flex-1 w-full">
              <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-3.5 w-3.5 text-text-muted" />
              <input
                type="text"
                placeholder={t.cm.searchCommentsPlaceholder}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-surface border border-border-subtle rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-accent-blue transition-colors text-text-primary placeholder-text-muted/65 shadow-xs"
              />
            </div>

            {/* Controles de Filtros */}
            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto flex-shrink-0 select-none">
              {/* Selector de Canal */}
              <div className="flex items-center gap-0.5 bg-surface-soft p-1 rounded-xl border border-border-subtle text-[10px] font-bold">
                {[
                  { id: 'all', label: t.cm.allChannels },
                  { id: 'facebook', label: 'Facebook' },
                  { id: 'instagram', label: 'Instagram' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setPlatformFilter(tab.id)}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
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
              <div className="flex items-center gap-0.5 bg-surface-soft p-1 rounded-xl border border-border-subtle text-[10px] font-bold">
                {[
                  { id: 'pending', label: t.cm.pendingWithCount.replace('{count}', pendingCount) },
                  { id: 'escalated', label: t.cm.escalatedWithCount.replace('{count}', escalatedCount) },
                  { id: 'replied', label: t.cm.repliedWithCount.replace('{count}', totalReplied) },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setStatusFilter(tab.id)}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer truncate ${
                      statusFilter === tab.id 
                        ? 'bg-surface text-text-primary border border-border-subtle shadow-xs' 
                        : 'text-text-muted hover:text-text-primary'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Actualizar */}
              <button
                type="button"
                onClick={() => fetchThreads(false)}
                disabled={loadingThreads}
                className="p-2 flex items-center justify-center cursor-pointer rounded-xl border border-border-subtle bg-surface hover:bg-surface-soft text-text-primary hover:text-accent-blue transition-colors flex-shrink-0 shadow-xs"
                title={t.cm.refreshInbox}
              >
                <ArrowPathIcon className={`h-3.5 w-3.5 ${loadingThreads ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Lista de Comentarios en Formato Lista Integrada */}
          <div>
            {loadingThreads ? (
              <div className="flex flex-col items-center justify-center p-12 text-center text-text-muted bg-surface border border-border-subtle rounded-2xl h-64">
                <ArrowPathIcon className="h-6 w-6 animate-spin text-accent-cyan mb-2" />
                <p className="text-xs font-semibold tracking-wider uppercase text-text-muted/65">
                  {t.cm.loadingComments}
                </p>
              </div>
            ) : filteredThreads.length > 0 ? (
              <div className="bg-surface border border-border-subtle rounded-2xl overflow-hidden shadow-xs divide-y divide-border-subtle/50">
                {filteredThreads.map(thread => {
                  const isExpanded = thread.id === selectedThreadId;
                  return (
                    <div
                      key={thread.id}
                      className={`transition-all duration-200 p-4 flex flex-col gap-3.5 ${
                        isExpanded ? 'bg-surface-soft/25' : 'hover:bg-surface-soft/10 bg-surface'
                      }`}
                    >
                      {/* Cabecera y Comentario (Clic para expandir/colapsar) */}
                      <div 
                        onClick={() => setSelectedThreadId(isExpanded ? '' : thread.id)}
                        className="cursor-pointer select-none flex flex-col gap-2"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img
                              src={thread.user.avatar}
                              alt={thread.user.name}
                              className="w-7 h-7 rounded-full object-cover border border-border-subtle flex-shrink-0"
                            />
                            <div className="flex items-center gap-2 min-w-0 flex-wrap">
                              <span className="text-[12.5px] font-bold text-text-primary truncate">
                                @{thread.user.name}
                              </span>
                              <span className="text-[9px] font-extrabold text-text-muted uppercase tracking-wider select-none bg-surface-soft px-2 py-0.5 rounded-md border border-border-subtle/50">
                                {thread.platform}
                              </span>
                              {thread.tag && (
                                <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md border tracking-wider select-none ${
                                  thread.sentiment === 'positive' 
                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25' 
                                    : thread.sentiment === 'negative' 
                                      ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25' 
                                      : 'bg-accent-blue/10 text-accent-blue border-accent-blue/25'
                                }`}>
                                  {thread.tag}
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="text-[10px] text-text-muted font-medium">{thread.time}</span>
                        </div>

                        {/* Comentario del Cliente (Siempre visible y prominente, identado) */}
                        <div className="pl-9.5 text-[13px] text-text-primary leading-relaxed font-bold whitespace-pre-wrap">
                          {formatCommentText(thread.comment)}
                        </div>
                      </div>

                      {/* Cuerpo Expandido: Editor e IA Minimalista */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="overflow-hidden w-full flex flex-col gap-3.5 pl-9.5"
                          >
                            {/* Textarea editable pre-cargado */}
                            <div className="relative w-full">
                              {thread.status === 'replied' ? (
                                <div className="bg-surface-soft/45 border border-border-subtle rounded-xl p-3.5 text-xs text-text-muted leading-relaxed font-semibold whitespace-pre-wrap select-text">
                                  {thread.replySent || activeDraft}
                                </div>
                              ) : (
                                <div className="relative">
                                  {loadingDraft ? (
                                    <div className="flex items-center justify-center bg-surface-soft/30 border border-border-subtle rounded-xl h-24 text-text-muted gap-2 text-xs">
                                      <ArrowPathIcon className="h-4 w-4 animate-spin text-accent-cyan" />
                                      <span>{t.cm.generatingDraft}</span>
                                    </div>
                                  ) : (
                                    <textarea
                                      value={activeDraft}
                                      onChange={e => {
                                        setActiveDraft(e.target.value);
                                        setThreads(prev => prev.map(t => t.id === thread.id ? { ...t, aiDraft: e.target.value } : t));
                                      }}
                                      className="w-full bg-surface border border-border-subtle hover:border-border-muted focus:border-accent-blue rounded-xl p-3.5 text-xs text-text-primary focus:outline-none leading-relaxed font-semibold min-h-[90px] shadow-xs resize-y"
                                      placeholder="Escribe tu respuesta aquí..."
                                    />
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Controles de Refinamiento y Envío */}
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
                              {thread.status === 'replied' ? (
                                <div className="w-full bg-emerald-500/5 border border-emerald-500/10 text-emerald-500 dark:text-emerald-400 py-2.5 rounded-xl flex items-center justify-center gap-2 text-xs font-bold select-none">
                                  <CheckIcon className="h-4 w-4" />
                                  <span>{t.cm.publishedSuccessfully}</span>
                                </div>
                              ) : (
                                <>
                                  {/* Input para refinar con IA */}
                                  {!loadingDraft && (
                                    <div className="relative flex-1 w-full">
                                      <input
                                        type="text"
                                        placeholder={t.cm.tweakPlaceholder}
                                        value={customAIInstruction}
                                        onChange={e => setCustomAIInstruction(e.target.value)}
                                        disabled={regenerating}
                                        className="w-full bg-surface border border-border-subtle rounded-xl px-3.5 py-2 text-[10.5px] text-text-primary placeholder-text-muted/65 focus:outline-none focus:border-accent-blue transition-colors shadow-xs"
                                        onKeyDown={e => {
                                          if (e.key === 'Enter' && customAIInstruction.trim()) {
                                            handleRegenerate(customAIInstruction.trim());
                                            setCustomAIInstruction('');
                                          }
                                        }}
                                      />
                                    </div>
                                  )}

                                  {/* Botones de acción */}
                                  <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end flex-shrink-0">
                                    {thread.status !== 'escalated' ? (
                                      <button
                                        onClick={() => {
                                          setThreads(prev => prev.map(t => t.id === thread.id ? { ...t, status: 'escalated' } : t));
                                          toast.error(lang === 'es' ? 'Comentario derivado a soporte humano.' : 'Comment escalated to human support.');
                                        }}
                                        className="text-xs font-extrabold text-text-muted hover:text-rose-500 hover:bg-rose-500/5 px-3 py-2 rounded-xl transition-all cursor-pointer"
                                      >
                                        {t.cm.escalateToHuman}
                                      </button>
                                    ) : (
                                      <span className="text-[10px] font-bold text-rose-500 bg-rose-500/5 border border-rose-500/10 px-2.5 py-1 rounded-lg">
                                        Escalado
                                      </span>
                                    )}

                                    <button
                                      onClick={handleApprove}
                                      disabled={approving || regenerating || !activeDraft.trim() || loadingDraft}
                                      className="flex items-center justify-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-accent-blue hover:bg-accent-blue/90 rounded-xl transition-all cursor-pointer shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                      {approving ? (
                                        <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" />
                                      ) : (
                                        <CheckIcon className="h-3.5 w-3.5" />
                                      )}
                                      <span>{t.cm.replyBtn}</span>
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-12 text-center text-text-muted bg-surface border border-border-subtle rounded-2xl h-64">
                <p className="text-xs font-medium text-text-muted">{t.cm.noComments}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
