// src/components/cm/CMSection.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { apiFetch } from '../../api/apiFetch';
import { InteractiveAvatar } from '../ui/InteractiveAvatar';
import { useMetaOAuth } from '../../hooks/useMetaOAuth';
import {
  ChatBubbleLeftRightIcon,
  SparklesIcon,
  CheckIcon,
  PencilIcon,
  ArrowPathIcon,
  UserIcon,
  ShieldCheckIcon,
  FaceSmileIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  LinkIcon,
  InformationCircleIcon,
  TrashIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';

export const CMSection = ({ clientId }) => {
  const [loading, setLoading] = useState(true);
  const [integration, setIntegration] = useState(null);
  const [connecting, setConnecting] = useState(false);

  // Hook de Autenticación de Meta unificado
  const {
    connecting: connectingOAuth,
    oauthStep,
    setOauthStep,
    adAccountsList,
    pagesList,
    selectedAccountId,
    setSelectedAccountId,
    selectedPageId,
    setSelectedPageId,
    tempAccessToken,
    handleFacebookOAuth,
  } = useMetaOAuth(clientId, 'cm-oauth-toast');

  const [linkedinIntegration, setLinkedinIntegration] = useState(null);
  const [tiktokIntegration, setTiktokIntegration] = useState(null);
  const [connectingLI, setConnectingLI] = useState(false);
  const [connectingTK, setConnectingTK] = useState(false);
  const [loadingDraft, setLoadingDraft] = useState(false);
  const [showTechDetails, setShowTechDetails] = useState(false);

  // 1. Cargar estado de todas las integraciones
  const loadAllIntegrations = async () => {
    try {
      setLoading(true);
      const [metaRes, liRes, tkRes] = await Promise.all([
        apiFetch(`/clients/${clientId}/meta-integration`).catch(() => null),
        apiFetch(`/clients/${clientId}/linkedin-integration`).catch(() => null),
        apiFetch(`/clients/${clientId}/tiktok-integration`).catch(() => null)
      ]);
      setIntegration(metaRes?.data || null);
      setLinkedinIntegration(liRes?.data || null);
      setTiktokIntegration(tkRes?.data || null);
    } catch (err) {
      console.error('Error al cargar integraciones:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllIntegrations();
  }, [clientId]);

  // --- LINKEDIN INTEGRATION HANDLERS ---
  const handleLinkedInOAuth = async () => {
    try {
      setConnectingLI(true);
      const isDemoMode = window.confirm("¿Deseas conectar LinkedIn en Modo Demo/Prueba (Aceptar) o con OAuth real (Cancelar)?");
      
      if (isDemoMode) {
        toast.loading('Iniciando sesión simulada en LinkedIn...', { id: 'li-oauth-toast' });
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const saveRes = await apiFetch(`/clients/${clientId}/linkedin-integration`, {
          method: 'POST',
          body: JSON.stringify({
            access_token: 'mock_linkedin_token_' + Date.now(),
            linkedin_urn: 'urn:li:person:mock_user_abc',
            linkedin_name: 'Perfil de Prueba LinkedIn'
          })
        });
        setLinkedinIntegration(saveRes.data);
        toast.success('¡LinkedIn (Perfil de Prueba) conectado con éxito!', { id: 'li-oauth-toast' });
        return;
      }

      // Flujo real
      const clientKey = '86j4vswj3vsc51';
      const redirectUri = window.location.origin + '/linkedin-callback.html';
      const oauthUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientKey}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=openid%20profile%20w_member_social%20email`;

      toast.loading('Esperando autorización en el popup de LinkedIn...', { id: 'li-oauth-toast' });

      const popup = window.open(oauthUrl, 'linkedin-login', 'width=600,height=600,scrollbars=yes');
      if (!popup) {
        toast.error('El popup fue bloqueado. Habilita las ventanas emergentes.', { id: 'li-oauth-toast' });
        return;
      }

      const handleMessage = async (event) => {
        if (event.origin !== window.location.origin) return;
        if (event.data?.type === 'LINKEDIN_OAUTH_SUCCESS') {
          window.removeEventListener('message', handleMessage);
          
          try {
            const exchangeRes = await apiFetch(`/clients/${clientId}/linkedin-integration/exchange-token`, {
              method: 'POST',
              body: JSON.stringify({ code: event.data.code, redirectUri })
            });

            const saveRes = await apiFetch(`/clients/${clientId}/linkedin-integration`, {
              method: 'POST',
              body: JSON.stringify({
                access_token: exchangeRes.data.accessToken,
                linkedin_urn: exchangeRes.data.urn,
                linkedin_name: exchangeRes.data.name
              })
            });

            setLinkedinIntegration(saveRes.data);
            toast.success(`¡LinkedIn conectado como ${exchangeRes.data.name}!`, { id: 'li-oauth-toast' });
          } catch (err) {
            toast.error(err.message || 'Error al conectar LinkedIn.', { id: 'li-oauth-toast' });
          }
        } else if (event.data?.type === 'LINKEDIN_OAUTH_ERROR') {
          window.removeEventListener('message', handleMessage);
          toast.error(event.data.error, { id: 'li-oauth-toast' });
        }
      };

      window.addEventListener('message', handleMessage);
    } catch (err) {
      toast.error(err.message || 'Error en OAuth de LinkedIn.', { id: 'li-oauth-toast' });
    } finally {
      setConnectingLI(false);
    }
  };

  const handleDeleteLinkedIn = async () => {
    if (!window.confirm('¿Estás seguro de que deseas desconectar LinkedIn?')) return;
    try {
      setLoading(true);
      await apiFetch(`/clients/${clientId}/linkedin-integration`, { method: 'DELETE' });
      setLinkedinIntegration(null);
      toast.success('LinkedIn desconectado.');
    } catch (err) {
      toast.error('Error al desconectar LinkedIn.');
    } finally {
      setLoading(false);
    }
  };

  // --- TIKTOK INTEGRATION HANDLERS ---
  const handleTikTokOAuth = async () => {
    try {
      setConnectingTK(true);
      const isDemoMode = window.confirm("¿Deseas conectar TikTok en Modo Demo/Prueba (Aceptar) o con OAuth real (Cancelar)?");
      
      if (isDemoMode) {
        toast.loading('Iniciando sesión simulada en TikTok...', { id: 'tk-oauth-toast' });
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const saveRes = await apiFetch(`/clients/${clientId}/tiktok-integration`, {
          method: 'POST',
          body: JSON.stringify({
            access_token: 'mock_tiktok_token_' + Date.now(),
            tiktok_open_id: 'tiktok_mock_openid_abc',
            tiktok_username: 'PruebaTikTok'
          })
        });
        setTiktokIntegration(saveRes.data);
        toast.success('¡TikTok (Cuenta de Prueba) conectado con éxito!', { id: 'tk-oauth-toast' });
        return;
      }

      // Flujo real
      const clientKey = 'aw123456789';
      const redirectUri = window.location.origin + '/tiktok-callback.html';
      const oauthUrl = `https://www.tiktok.com/v2/auth/authorize/?client_key=${clientKey}&scope=user.info.basic,video.upload&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}`;

      toast.loading('Esperando autorización en el popup de TikTok...', { id: 'tk-oauth-toast' });

      const popup = window.open(oauthUrl, 'tiktok-login', 'width=600,height=600,scrollbars=yes');
      if (!popup) {
        toast.error('El popup fue bloqueado. Habilita las ventanas emergentes.', { id: 'tk-oauth-toast' });
        return;
      }

      const handleMessage = async (event) => {
        if (event.origin !== window.location.origin) return;
        if (event.data?.type === 'TIKTOK_OAUTH_SUCCESS') {
          window.removeEventListener('message', handleMessage);
          
          try {
            const exchangeRes = await apiFetch(`/clients/${clientId}/tiktok-integration/exchange-token`, {
              method: 'POST',
              body: JSON.stringify({ code: event.data.code, redirectUri })
            });

            const saveRes = await apiFetch(`/clients/${clientId}/tiktok-integration`, {
              method: 'POST',
              body: JSON.stringify({
                access_token: exchangeRes.data.accessToken,
                tiktok_open_id: exchangeRes.data.openId,
                tiktok_username: exchangeRes.data.username,
                refresh_token: exchangeRes.data.refreshToken
              })
            });

            setTiktokIntegration(saveRes.data);
            toast.success(`¡TikTok conectado como @${exchangeRes.data.username}!`, { id: 'tk-oauth-toast' });
          } catch (err) {
            toast.error(err.message || 'Error al conectar TikTok.', { id: 'tk-oauth-toast' });
          }
        } else if (event.data?.type === 'TIKTOK_OAUTH_ERROR') {
          window.removeEventListener('message', handleMessage);
          toast.error(event.data.error, { id: 'tk-oauth-toast' });
        }
      };

      window.addEventListener('message', handleMessage);
    } catch (err) {
      toast.error(err.message || 'Error en OAuth de TikTok.', { id: 'tk-oauth-toast' });
    } finally {
      setConnectingTK(false);
    }
  };

  const handleDeleteTikTok = async () => {
    if (!window.confirm('¿Estás seguro de que deseas desconectar TikTok?')) return;
    try {
      setLoading(true);
      await apiFetch(`/clients/${clientId}/tiktok-integration`, { method: 'DELETE' });
      setTiktokIntegration(null);
      toast.success('TikTok desconectado.');
    } catch (err) {
      toast.error('Error al desconectar TikTok.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Automated Meta OAuth Flow centralizado en useMetaOAuth hook.

  // 3. Guardar la configuración seleccionada en el Dropdown
  const handleConfirmOnboarding = async () => {
    if (!selectedAccountId) {
      toast.error('Por favor, selecciona una cuenta publicitaria.');
      return;
    }
    if (!selectedPageId) {
      toast.error('Por favor, selecciona tu página y cuenta de Instagram.');
      return;
    }

    try {
      setConnecting(true);
      const res = await apiFetch(`/clients/${clientId}/meta-integration`, {
        method: 'POST',
        body: JSON.stringify({
          meta_ad_account_id: selectedAccountId,
          meta_page_id: selectedPageId,
          access_token: tempAccessToken,
        }),
      });
      toast.success('¡Estratega de Meta Ads y CM Inteligente integrados con éxito!');
      setIntegration(res.data);
      setOauthStep('connect');
    } catch (err) {
      toast.error(err.message || 'Error al guardar la integración.');
    } finally {
      setConnecting(false);
    }
  };

  // Desconectar integración y purgar accesos
  const handleDisconnect = async () => {
    if (
      !window.confirm(
        '¿Estás seguro de que deseas desconectar esta cuenta de Meta? Se detendrá el CM Inteligente y se purgarán los accesos locales.'
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      await apiFetch(`/clients/${clientId}/meta-integration`, { method: 'DELETE' });
      toast.success('Sesión de Meta y CM Inteligente desconectados.');
      setIntegration(null);
      setThreads([]);
      setSelectedThreadId('');
      setOauthStep('connect');
    } catch (err) {
      toast.error('Error al desconectar la cuenta.');
    } finally {
      setLoading(false);
    }
  };

  const [threads, setThreads] = useState([]);
  const [selectedThreadId, setSelectedThreadId] = useState('');
  const [loadingThreads, setLoadingThreads] = useState(false);
  const [platformFilter, setPlatformFilter] = useState('all'); // 'all' | 'facebook' | 'instagram'
  const [statusFilter, setStatusFilter] = useState('pending'); // 'pending' | 'escalated' | 'replied'
  const [showRulesPanel, setShowRulesPanel] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // AI draft editing states
  const [activeDraft, setActiveDraft] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [approving, setApproving] = useState(false);
  const [customAIInstruction, setCustomAIInstruction] = useState('');

  // Autopilot settings
  const [autopilotGreeting, setAutopilotGreeting] = useState(true);
  const [autopilotFaq, setAutopilotFaq] = useState(false);
  const [escalateNegatives, setEscalateNegatives] = useState(true);

  // Cargar comentarios en vivo
  const fetchThreads = async (silent = false) => {
    try {
      if (!silent) setLoadingThreads(true);
      const res = await apiFetch(`/clients/${clientId}/meta-integration/comments`);
      const fetchedThreads = res.data || [];
      setThreads(fetchedThreads);
      
      if (fetchedThreads.length > 0) {
        // Seleccionar primer thread si no hay uno válido ya seleccionado
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

  // Cargar comentarios en vivo al montar e integrar
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
  const totalTimeSaved = totalReplied * 3; // 3 mins saved per reply
  
  const fbCount = threads.filter(t => t.platform === 'Facebook').length;
  const igCount = threads.filter(t => t.platform === 'Instagram').length;

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

  const getConfidenceLabel = (confidence) => {
    if (!confidence) return 'Confianza alta';
    if (confidence >= 90) return 'Confianza alta';
    if (confidence >= 75) return 'Confianza media';
    return 'Revisión recomendada';
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-text-muted">
        <ArrowPathIcon className="h-8 w-8 animate-spin text-emerald-500 mb-3" />
        <p className="text-xs font-bold tracking-widest uppercase">
          Verificando integración de Meta...
        </p>
      </div>
    );
  }

  // =========================================================================
  // VISTA 1: FORMULARIO DE CONEXIÓN O SELECTOR OAUTH AUTOMÁTICO (SI NO ESTÁ INTEGRADO)
  // =========================================================================
  if (!integration) {
    return (
      <div className="p-6 md:p-8 max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[80vh]">
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
            {/* Elegant robot CM Interactive Avatar */}
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
              /* PASO A: BOTÓN DE CONEXIÓN AUTOMÁTICA O MANUAL */
              <motion.div
                key="oauth-connect"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-6 max-w-md mx-auto relative z-10 text-center"
              >
                {/* Botón Principal OAuth Premium Emerald */}
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
              /* PASO B: SELECTOR DE CUENTAS PUBLICITARIAS Y PAGINAS DROPDOWN */
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

          <div className="mt-8 p-4 bg-surface border border-border-subtle rounded-2xl max-w-lg mx-auto flex items-start gap-3 relative z-10">
            <InformationCircleIcon className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div className="text-[10px] text-text-muted leading-relaxed">
              <span className="font-bold text-text-secondary">Conexión Segura vía OAuth:</span> Al usar el login de Facebook, Meta autoriza a Cadence de forma encriptada para leer y responder comentarios en vivo en tus cuentas vinculadas. Las credenciales se resguardan bajo la estricta seguridad de Supabase.
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // =========================================================================
  // VISTA 2: EL DASHBOARD DE CM INTELIGENTE COMPLETO (SI YA ESTÁ INTEGRADO)
  // =========================================================================
  return (
    <div className="p-6 md:p-8 flex flex-col gap-6 max-w-[1600px] mx-auto w-full text-text-primary">
      
      {/* 1. TOP HEADER - CLEAN & HIGH-END */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 py-3 px-1 border-b border-slate-200 dark:border-white/5 pb-5">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-text-primary font-title">
              CM Inteligente
            </h1>
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-accent-cyan/20 bg-accent-cyan/5 text-accent-cyan text-[10px] font-semibold select-none">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-cyan animate-pulse" />
              Sincronizado
            </span>
          </div>
          <p className="text-xs text-text-muted">
            Monitoreo en tiempo real y auto-respuestas para tus redes sociales.
          </p>
        </div>

        {/* Header Actions & Clean Stats */}
        <div className="flex items-center gap-5 ml-auto sm:ml-0">
          {/* Quick Metrics */}
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 bg-white dark:bg-white/[0.01] border border-slate-200 dark:border-white/5 py-1.5 px-3 rounded-lg shadow-sm">
              <span className="text-text-muted font-medium">Pendientes:</span>
              <span className="text-accent-cyan font-bold text-sm">{pendingCount}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white dark:bg-white/[0.01] border border-slate-200 dark:border-white/5 py-1.5 px-3 rounded-lg shadow-sm">
              <span className="text-text-muted font-medium">Urgentes:</span>
              <span className="font-bold text-sm" style={{ color: 'var(--color-accent-rose)' }}>{escalatedCount}</span>
            </div>
          </div>

          <div className="w-px h-4 bg-slate-200 dark:bg-white/10" />

          {/* Action Tools */}
          <button
            onClick={() => setShowRulesPanel(true)}
            className="btn-cyber flex items-center gap-2 text-xs py-2 px-4 shadow-sm cursor-pointer"
            title="Configurar Reglas y Autopiloto"
          >
            <Cog6ToothIcon className="h-4 w-4 text-accent-cyan" />
            <span>Reglas y Canales</span>
          </button>
        </div>
      </div>

      {/* 2. MAIN WORKSPACE CONTAINER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* COL 1: MINIMALIST SMART INBOX (4 COLS) */}
        <div className="lg:col-span-4 flex flex-col bg-surface border border-border-subtle rounded-2xl overflow-hidden min-h-[580px]">
          
          {/* Header search & consolidated filters */}
          <div className="p-4 border-b border-border-subtle bg-surface-soft/30 space-y-3">
            {/* Search Input */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-3.5 w-3.5 text-text-muted" />
                <input
                  type="text"
                  placeholder="Buscar comentarios..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="input-cyber pl-9 pr-4 py-2 text-xs"
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
            
            {/* Platform & Status Selector */}
            <div className="flex flex-col gap-2 pt-2 border-t border-border-subtle">
              {/* Canal Selector */}
              <div className="flex items-center gap-1 bg-surface-soft p-1 rounded-lg border border-border-subtle">
                {[
                  { id: 'all', label: 'Todos' },
                  { id: 'facebook', label: 'Facebook' },
                  { id: 'instagram', label: 'Instagram' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setPlatformFilter(tab.id)}
                    className={`flex-1 py-1 rounded-md text-[10px] font-medium transition-all duration-150 cursor-pointer text-center ${
                      platformFilter === tab.id
                        ? 'bg-surface text-accent-blue font-semibold border border-border-subtle shadow-xs'
                        : 'text-text-muted hover:text-text-primary'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Status Switcher tabs */}
              <div className="flex border-b border-border-subtle mt-1.5">
                {[
                  { id: 'pending', label: 'Pendientes' },
                  { id: 'escalated', label: 'Urgentes' },
                  { id: 'replied', label: 'Respondidos' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setStatusFilter(tab.id)}
                    className={`flex-1 pb-2 text-center text-xs font-semibold relative transition-colors duration-150 cursor-pointer ${
                      statusFilter === tab.id ? 'text-accent-blue' : 'text-text-muted hover:text-text-primary'
                    }`}
                  >
                    <span>{tab.label}</span>
                    {statusFilter === tab.id && (
                      <motion.div
                        layoutId="cm-status-underline"
                        className="absolute bottom-0 inset-x-0 h-0.5 bg-accent-blue rounded-full"
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Inbox threads list */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1 max-h-[480px]">
            {loadingThreads ? (
              <div className="flex flex-col items-center justify-center p-12 text-center text-text-muted h-64">
                <ArrowPathIcon className="h-6 w-6 animate-spin text-accent-cyan mb-2" />
                <p className="text-xs font-semibold tracking-wider uppercase text-text-muted/65">
                  Cargando...
                </p>
              </div>
            ) : (
              <AnimatePresence>
                {filteredThreads.length > 0 ? (
                  filteredThreads.map(thread => {
                    const isSelected = thread.id === selectedThreadId;
                    return (
                      <motion.div
                        key={thread.id}
                        onClick={() => setSelectedThreadId(thread.id)}
                        className={`p-3.5 cursor-pointer transition-all duration-150 rounded-xl flex flex-col gap-2.5 border-l-2 select-none ${
                          isSelected 
                            ? 'bg-surface-soft border-accent-blue shadow-xs' 
                            : 'bg-transparent border-l-transparent hover:bg-surface-soft/40'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex gap-2 items-center min-w-0">
                            <img
                              src={thread.user.avatar}
                              alt={thread.user.name}
                              className="w-6 h-6 rounded-full object-cover border border-border-subtle flex-shrink-0"
                            />
                            <span className="text-[13px] font-semibold text-text-primary truncate">
                              @{thread.user.name}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <span className="text-[9px] text-text-muted font-semibold bg-surface-soft border border-border-subtle px-2 py-0.5 rounded-full select-none">
                              {thread.platform}
                            </span>
                            <span className="text-[10px] text-text-secondary">{thread.time}</span>
                          </div>
                        </div>

                        <p className="text-[12px] text-text-muted leading-relaxed line-clamp-2 pr-1 font-medium">
                          {thread.comment}
                        </p>

                        <div className="flex items-center justify-between pt-1">
                          <div className="flex items-center gap-1.5">
                            {getSentimentBadge(thread.sentiment)}
                          </div>
                          {thread.postThumbnail ? (
                            <img
                              src={thread.postThumbnail}
                              alt="Post"
                              className="w-4 h-4 rounded object-cover opacity-60 border border-slate-300 dark:border-white/10"
                            />
                          ) : null}
                        </div>
                      </motion.div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center p-12 text-center text-text-muted h-64">
                    <p className="text-xs font-medium text-text-muted">No hay comentarios con este filtro.</p>
                  </div>
                )}
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* COL 2: COPILOT WORKSPACE (8 COLS) */}
        <div className="lg:col-span-8 flex flex-col bg-surface border border-border-subtle rounded-2xl overflow-hidden min-h-[580px]">
          {activeThread ? (
            <div className="p-6 flex flex-col flex-1 gap-6">
              
              {/* HEADER: CONTEXTO DE LA PUBLICACIÓN */}
              <div className="flex items-center justify-between border-b border-border-subtle pb-4">
                <div className="flex items-center gap-3">
                  {activeThread.postThumbnail && (
                    <img
                      src={activeThread.postThumbnail}
                      alt="Post"
                      className="w-10 h-10 rounded-lg object-cover border border-border-subtle"
                    />
                  )}
                  <div>
                    <span className="text-[10px] text-text-muted block font-bold uppercase tracking-wider">Publicación en {activeThread.platform}</span>
                    <span className="text-sm font-bold text-text-primary line-clamp-1 max-w-[400px]">
                      {activeThread.postTitle}
                    </span>
                  </div>
                </div>
                {activeThread.postLink && (
                  <a
                    href={activeThread.postLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs font-bold text-accent-blue hover:underline transition-colors shrink-0 bg-surface-soft px-3 py-1.5 rounded-lg border border-border-subtle shadow-xs"
                  >
                    <LinkIcon className="h-3.5 w-3.5" />
                    <span>Ver publicación</span>
                  </a>
                )}
              </div>

              {/* HILO DE CONVERSACIÓN (ESTILO CHAT/COMENTARIO REAL) */}
              <div className="flex-1 overflow-y-auto space-y-6 pr-2 py-2">
                {/* Comentario del cliente (Alineado a la Izquierda) */}
                <div className="flex items-start gap-3">
                  <img
                    src={activeThread.user.avatar}
                    alt={activeThread.user.name}
                    className="w-9 h-9 rounded-full object-cover border border-border-subtle mt-0.5"
                  />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-text-primary">@{activeThread.user.name}</span>
                      <span className="text-[10px] text-text-secondary">{activeThread.time}</span>
                      {getSentimentBadge(activeThread.sentiment)}
                    </div>
                    <div className="bg-surface-soft border border-border-subtle rounded-2xl rounded-tl-none p-3.5 text-text-primary text-sm leading-relaxed max-w-[85%] inline-block">
                      {activeThread.comment}
                    </div>
                  </div>
                </div>

                {/* Editor / Respuesta (Alineado a la Derecha con indicador de IA) */}
                <div className="flex items-start gap-3 justify-end">
                  <div className="flex-1 flex flex-col items-end space-y-2">
                    <div className="flex items-center gap-1.5 pr-1">
                      <span className="text-[10px] text-text-muted font-medium">Escribe directamente o genera con IA</span>
                    </div>
                    
                    <div className="w-full max-w-[85%] relative bg-surface border border-border-strong rounded-2xl rounded-tr-none p-4 shadow-xs">
                      {/* Concentric Pulse AI indicator */}
                      {(loadingDraft || regenerating) && (
                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-surface-soft/90 rounded-2xl">
                          <div className="relative w-8 h-8 flex items-center justify-center mb-2">
                            <div className="absolute inset-0 rounded-full bg-accent-blue/10 animate-ping" />
                            <div className="absolute w-5 h-5 rounded-full bg-accent-blue/20 animate-ping" />
                            <div className="absolute w-3 h-3 rounded-full bg-accent-blue shadow-[0_0_8px_rgba(24,119,242,0.5)] flex items-center justify-center">
                              <SparklesIcon className="w-2.5 h-2.5 text-white animate-spin" />
                            </div>
                          </div>
                          <span className="text-[10px] font-bold tracking-wider text-accent-blue uppercase animate-pulse">
                            Generando respuesta...
                          </span>
                        </div>
                      )}

                      <textarea
                        value={activeDraft}
                        onChange={e => {
                          setActiveDraft(e.target.value);
                          if (!isEditing) setIsEditing(true);
                        }}
                        className="w-full bg-transparent border-0 resize-none text-sm text-text-primary leading-relaxed focus:ring-0 focus:outline-none min-h-[110px] p-0"
                        placeholder="Escribe tu respuesta real aquí directamente, o haz clic en 'Generar con IA' para que redactemos una sugerencia por ti..."
                      />

                      {/* RAG metadata tag */}
                      {!loadingDraft && activeThread.contextUsed && (
                        <div className="mt-3 pt-2.5 border-t border-border-subtle flex items-center justify-between text-[10px] text-text-muted">
                          <span className="flex items-center gap-1.5 font-mono truncate max-w-[85%]">
                            <ShieldCheckIcon className="h-4 w-4 text-accent-blue flex-shrink-0" />
                            <span>Validado con: <span className="text-text-primary font-bold">{activeThread.contextUsed}</span></span>
                          </span>
                        </div>
                      )}
                    </div>

                    {/* AI Compact Tone Bar - Only visible if there is content or status is pending */}
                    {activeThread.status !== 'replied' && (
                      <div className="w-full max-w-[85%] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <button
                            onClick={() => handleRegenerate('shorter')}
                            disabled={regenerating || !activeDraft}
                            className="text-[10px] font-semibold py-1.5 px-3 rounded-lg bg-surface hover:bg-surface-soft border border-border-subtle transition-all text-text-primary shadow-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            Más Corto
                          </button>
                          <button
                            onClick={() => handleRegenerate('warmer')}
                            disabled={regenerating || !activeDraft}
                            className="text-[10px] font-semibold py-1.5 px-3 rounded-lg bg-surface hover:bg-surface-soft border border-border-subtle transition-all text-text-primary shadow-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            Más Empático
                          </button>
                          <button
                            onClick={() => handleRegenerate('cta')}
                            disabled={regenerating || !activeDraft}
                            className="text-[10px] font-semibold py-1.5 px-3 rounded-lg bg-surface hover:bg-surface-soft border border-border-subtle transition-all text-text-primary shadow-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            Con CTA
                          </button>
                        </div>

                        <div className="relative flex-1 sm:max-w-[180px]">
                          <input
                            type="text"
                            placeholder="Ajuste de IA personalizado..."
                            value={customAIInstruction}
                            onChange={e => setCustomAIInstruction(e.target.value)}
                            disabled={regenerating}
                            className="w-full bg-surface border border-border-subtle rounded-lg px-2.5 py-1.5 text-[10px] text-text-primary focus:outline-none focus:border-accent-blue transition-colors"
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

                  <div className="w-9 h-9 rounded-full bg-accent-blue/10 border border-accent-blue/20 text-accent-blue font-bold text-xs flex items-center justify-center mt-1 select-none flex-shrink-0">
                    IA
                  </div>
                </div>
              </div>

              {/* SECCIÓN DE ACCIONES DE ENVÍO */}
              <div className="pt-4 border-t border-border-subtle flex items-center justify-between gap-3">
                {activeThread.status === 'replied' ? (
                  <div className="w-full bg-accent-blue/5 border border-accent-blue/20 text-accent-blue py-3 rounded-xl flex items-center justify-center gap-2 text-xs font-bold">
                    <CheckIcon className="h-4.5 w-4.5" />
                    <span>Respuesta publicada correctamente en redes</span>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-2">
                      {activeThread.status !== 'escalated' && (
                        <button
                          onClick={() => {
                            setThreads(prev => prev.map(t => t.id === activeThread.id ? { ...t, status: 'escalated' } : t));
                            toast.error('Comentario derivado a atención prioritaria humana.');
                          }}
                          className="text-xs font-bold text-error border border-error/20 hover:bg-error/5 px-4 py-2.5 rounded-xl transition-all cursor-pointer"
                        >
                          Escalar a Humano
                        </button>
                      )}
                    </div>

                    <div className="flex gap-2 ml-auto">
                      <button
                        onClick={() => {
                          handleRegenerate('Generar respuesta profesional adaptada al contexto del comentario');
                        }}
                        disabled={regenerating || loadingDraft}
                        className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-accent-blue bg-accent-blue/5 hover:bg-accent-blue/10 border border-accent-blue/20 rounded-xl transition-all cursor-pointer disabled:opacity-40"
                      >
                        <SparklesIcon className="h-4 w-4" />
                        <span>Generar con IA</span>
                      </button>

                      <button
                        onClick={handleApprove}
                        disabled={approving || regenerating || !activeDraft.trim()}
                        className="flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-accent-blue hover:bg-accent-blue/90 rounded-xl transition-all cursor-pointer shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {approving ? (
                          <ArrowPathIcon className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckIcon className="h-4 w-4" />
                        )}
                        <span>Enviar Respuesta</span>
                      </button>
                    </div>
                  </>
                )}
              </div>

            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-center text-text-muted flex-1 h-full">
              <InteractiveAvatar variant="cm" size="lg" className="mb-4" />
              <p className="text-xs font-semibold text-text-muted">Selecciona una conversación de la bandeja para comenzar.</p>
            </div>
          )}
        </div>
      </div>

      {/* Sliding Rules & Autopilot Drawer */}
      <AnimatePresence>
        {showRulesPanel && (
          <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowRulesPanel(false)}
              className="absolute inset-0 bg-[#07070f]/75 cursor-pointer"
            />
            {/* Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-sm h-full bg-[#07070f]/95 backdrop-blur-md border-l border-white/5 p-6 flex flex-col gap-6 shadow-3xl overflow-y-auto z-10 text-text-primary"
            >
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <h4 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5 font-title">
                  <ShieldCheckIcon className="h-5 w-5 text-accent-cyan" />
                  <span>Reglas y Canales</span>
                </h4>
                <button
                  onClick={() => setShowRulesPanel(false)}
                  className="btn-cyber px-3 py-1.5 text-[10px] font-bold transition-all cursor-pointer bg-white/[0.02] border border-white/5 text-white/80 hover:text-white"
                >
                  Cerrar
                </button>
              </div>

              {/* Tone Card Reference */}
              <div className="bg-white/[0.01] border border-white/5 p-4 rounded-xl space-y-1.5">
                <span className="text-[10px] font-bold text-accent-cyan uppercase tracking-wider block select-none">Tono de Voz Activo</span>
                <p className="text-xs text-text-primary font-bold">Cálido, Cercano & Empático</p>
                <div className="text-[10px] text-text-muted leading-relaxed select-none">
                  Utiliza siempre emojis amistosos, saluda de manera personalizada y mantén un lenguaje optimista y servicial.
                </div>
              </div>

              {/* Autopilot Toggles Panel */}
              <div className="space-y-4">
                <h5 className="text-[10px] font-bold text-text-muted uppercase tracking-wider px-1 select-none">
                  Ajustes de Autopiloto
                </h5>

                <div className="space-y-3">
                  {/* Toggle 1 */}
                  <div className="flex items-center justify-between bg-white/[0.01] p-3 rounded-xl border border-white/5">
                    <div className="flex flex-col gap-0.5 max-w-[80%]">
                      <span className="text-[11px] font-bold text-text-primary">Auto-responder Saludos</span>
                      <span className="text-[9px] text-text-muted leading-tight">La IA responderá automáticamente comentarios de saludos.</span>
                    </div>
                    <button
                      onClick={() => {
                        setAutopilotGreeting(!autopilotGreeting);
                        toast.success(autopilotGreeting ? 'Autopiloto de saludos inactivo' : 'Autopiloto de saludos activado');
                      }}
                      className="w-9 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none cursor-pointer border border-white/10"
                      style={{ backgroundColor: autopilotGreeting ? 'var(--color-accent-cyan)' : 'var(--color-surface-strong)' }}
                    >
                      <div className={`w-3.5 h-3.5 rounded-full bg-white transition-transform duration-200 transform ${
                        autopilotGreeting ? 'translate-x-4' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>

                  {/* Toggle 2 */}
                  <div className="flex items-center justify-between bg-white/[0.01] p-3 rounded-xl border border-white/5">
                    <div className="flex flex-col gap-0.5 max-w-[80%]">
                      <span className="text-[11px] font-bold text-text-primary">Auto-resolver FAQs</span>
                      <span className="text-[9px] text-text-muted leading-tight">Contesta automáticamente preguntas de precios y envíos con alta confianza.</span>
                    </div>
                    <button
                      onClick={() => {
                        setAutopilotFaq(!autopilotFaq);
                        toast.success(autopilotFaq ? 'Autopiloto de FAQ inactivo' : 'Autopiloto de FAQ activado');
                      }}
                      className="w-9 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none cursor-pointer border border-white/10"
                      style={{ backgroundColor: autopilotFaq ? 'var(--color-accent-cyan)' : 'var(--color-surface-strong)' }}
                    >
                      <div className={`w-3.5 h-3.5 rounded-full bg-white transition-transform duration-200 transform ${
                        autopilotFaq ? 'translate-x-4' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>

                  {/* Toggle 3 */}
                  <div className="flex items-center justify-between bg-white/[0.01] p-3 rounded-xl border border-white/5">
                    <div className="flex flex-col gap-0.5 max-w-[80%]">
                      <span className="text-[11px] font-bold text-text-primary">Derivar Críticos</span>
                      <span className="text-[9px] text-text-muted leading-tight">Envía quejas o crisis directamente a revisión del equipo humano.</span>
                    </div>
                    <button
                      onClick={() => {
                        setEscalateNegatives(!escalateNegatives);
                        toast.success(escalateNegatives ? 'Derivación inactiva (Peligro)' : 'Derivación de seguridad activa');
                      }}
                      className="w-9 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none cursor-pointer border border-white/10"
                      style={{ backgroundColor: escalateNegatives ? 'var(--color-accent-cyan)' : 'var(--color-surface-strong)' }}
                    >
                      <div className={`w-3.5 h-3.5 rounded-full bg-white transition-transform duration-200 transform ${
                        escalateNegatives ? 'translate-x-4' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Integraciones Multicanal */}
              <div className="space-y-4 border-t border-white/5 pt-4">
                <h5 className="text-[10px] font-bold text-text-muted uppercase tracking-wider px-1 flex items-center gap-1.5 select-none">
                  <LinkIcon className="h-3.5 w-3.5 text-accent-cyan" />
                  <span>Integraciones Multicanal</span>
                </h5>

                <div className="space-y-3">
                  {/* Facebook / Instagram Card */}
                  <div className="bg-white/[0.01] p-3 rounded-xl border border-white/5 space-y-2.5 transition-all duration-150">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded bg-blue-500/10 text-blue-400">
                          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                          </svg>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[11px] font-bold text-text-primary">Facebook / Instagram</span>
                          <span className="text-[9px] text-text-muted leading-tight">Canal de auto-respuestas CM</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-accent-cyan/10 text-accent-cyan text-[8px] font-bold uppercase tracking-wider select-none">
                        Activo
                      </span>
                    </div>
                    {integration && (
                      <div className="pt-2.5 border-t border-white/5 flex items-center justify-between gap-1 text-[9px]">
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <span className="text-text-muted font-semibold truncate max-w-[130px]">
                            Pág: {integration.page_name || 'Sin nombre'}
                          </span>
                          <span className="text-text-muted font-mono truncate max-w-[130px] opacity-75">
                            ID: {integration.page_id ? `${integration.page_id.substring(0, 6)}...` : 'N/A'}
                          </span>
                        </div>
                        <button
                          onClick={handleDisconnect}
                          className="btn-cyber px-2.5 py-1 rounded border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400 text-[9px] font-bold transition-all cursor-pointer flex-shrink-0"
                        >
                          Desconectar
                        </button>
                      </div>
                    )}
                  </div>

                  {/* LinkedIn Card */}
                  <div className="bg-white/[0.01] p-3 rounded-xl border border-white/5 space-y-2.5 transition-all duration-150">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded bg-sky-500/10 text-sky-400">
                          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                          </svg>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[11px] font-bold text-text-primary">LinkedIn Profile</span>
                          <span className="text-[9px] text-text-muted leading-tight">Publicación directa multicanal</span>
                        </div>
                      </div>
                      {linkedinIntegration ? (
                        <span className="px-2 py-0.5 rounded-full bg-accent-cyan/10 text-accent-cyan text-[8px] font-bold uppercase tracking-wider select-none">
                          Sincronizado
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-slate-900 border border-white/5 text-text-muted text-[8px] font-bold uppercase tracking-wider select-none">
                          Inactivo
                        </span>
                      )}
                    </div>
                    {linkedinIntegration ? (
                      <div className="pt-2.5 border-t border-white/5 flex items-center justify-between gap-1 text-[9px]">
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <span className="text-text-muted font-semibold truncate max-w-[130px]">
                            {linkedinIntegration.linkedin_name}
                          </span>
                          <span className="text-text-muted font-mono truncate max-w-[130px] opacity-75">
                            {linkedinIntegration.linkedin_urn ? `${linkedinIntegration.linkedin_urn.substring(0, 15)}...` : 'N/A'}
                          </span>
                        </div>
                        <button
                          onClick={handleDeleteLinkedIn}
                          className="btn-cyber px-2.5 py-1 rounded border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400 text-[9px] font-bold transition-all cursor-pointer flex-shrink-0"
                        >
                          Desconectar
                        </button>
                      </div>
                    ) : (
                      <div className="pt-0.5">
                        <button
                          onClick={handleLinkedInOAuth}
                          className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold text-[9px] py-1.5 rounded-lg transition-all duration-200 flex items-center justify-center gap-1 shadow-md cursor-pointer"
                        >
                          <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24">
                            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                          </svg>
                          <span>Conectar LinkedIn</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* TikTok Card */}
                  <div className="bg-white/[0.01] p-3 rounded-xl border border-white/5 space-y-2.5 transition-all duration-150">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded bg-pink-500/10 text-pink-400">
                          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                            <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.86-.6-4.08-1.4-1.18-.78-2.07-1.9-2.57-3.19-.03 1.11-.02 2.22-.02 3.33v8.3c.02 1.39-.33 2.82-1.13 3.96-.8 1.16-2.05 1.99-3.46 2.3-1.45.31-3.03.11-4.37-.5-1.37-.62-2.48-1.75-3.09-3.13-.61-1.42-.64-3.07-.12-4.5.5-1.39 1.53-2.61 2.88-3.3 1.43-.72 3.12-.86 4.63-.4v4.07c-.9-.28-1.92-.19-2.73.35-.8.54-1.3 1.49-1.33 2.46.03.97.55 1.91 1.36 2.44.82.52 1.88.57 2.75.14.88-.43 1.47-1.33 1.52-2.3.01-3.12 0-6.24 0-9.36.03-3.38.01-6.76.02-10.15z" />
                          </svg>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[11px] font-bold text-text-primary">TikTok Business</span>
                          <span className="text-[9px] text-text-muted leading-tight">Publicación directa de videos</span>
                        </div>
                      </div>
                      {tiktokIntegration ? (
                        <span className="px-2 py-0.5 rounded-full bg-accent-cyan/10 text-accent-cyan text-[8px] font-bold uppercase tracking-wider select-none">
                          Sincronizado
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-slate-900 border border-white/5 text-text-muted text-[8px] font-bold uppercase tracking-wider select-none">
                          Inactivo
                        </span>
                      )}
                    </div>
                    {tiktokIntegration ? (
                      <div className="pt-2.5 border-t border-white/5 flex items-center justify-between gap-1 text-[9px]">
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <span className="text-text-muted font-semibold truncate max-w-[130px]">
                            @{tiktokIntegration.tiktok_username}
                          </span>
                          <span className="text-text-muted font-mono truncate max-w-[130px] opacity-75">
                            {tiktokIntegration.tiktok_open_id ? `${tiktokIntegration.tiktok_open_id.substring(0, 15)}...` : 'N/A'}
                          </span>
                        </div>
                        <button
                          onClick={handleDeleteTikTok}
                          className="btn-cyber px-2.5 py-1 rounded border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400 text-[9px] font-bold transition-all cursor-pointer flex-shrink-0"
                        >
                          Desconectar
                        </button>
                      </div>
                    ) : (
                      <div className="pt-0.5">
                        <button
                          onClick={handleTikTokOAuth}
                          className="w-full bg-pink-600 hover:bg-pink-500 text-white font-bold text-[9px] py-1.5 rounded-lg transition-all duration-200 flex items-center justify-center gap-1 shadow-md cursor-pointer"
                        >
                          <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24">
                            <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.86-.6-4.08-1.4-1.18-.78-2.07-1.9-2.57-3.19-.03 1.11-.02 2.22-.02 3.33v8.3c.02 1.39-.33 2.82-1.13 3.96-.8 1.16-2.05 1.99-3.46 2.3-1.45.31-3.03.11-4.37-.5-1.37-.62-2.48-1.75-3.09-3.13-.61-1.42-.64-3.07-.12-4.5.5-1.39 1.53-2.61 2.88-3.3 1.43-.72 3.12-.86 4.63-.4v4.07c-.9-.28-1.92-.19-2.73.35-.8.54-1.3 1.49-1.33 2.46.03.97.55 1.91 1.36 2.44.82.52 1.88.57 2.75.14.88-.43 1.47-1.33 1.52-2.3.01-3.12 0-6.24 0-9.36.03-3.38.01-6.76.02-10.15z" />
                          </svg>
                          <span>Conectar TikTok</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Guidelines info */}
              <div className="bg-white/[0.01] border border-white/5 p-4 rounded-xl flex items-start gap-2.5 mt-auto">
                <ShieldCheckIcon className="h-4.5 w-4.5 text-accent-cyan flex-shrink-0 mt-0.5" />
                <div className="text-[10px] text-text-muted leading-relaxed">
                  <span className="font-bold text-text-secondary">Seguridad RAG:</span> El CM Inteligente está restringido a responder únicamente en base a los documentos cargados en tu sección "Documentos". Nunca inventará links o datos que no estén explícitamente verificados.
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
