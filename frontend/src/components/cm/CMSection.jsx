// src/components/cm/CMSection.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { apiFetch } from '../../api/apiFetch';
import { InteractiveAvatar } from '../ui/InteractiveAvatar';
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

  // States for automated Meta Onboarding
  const [oauthStep, setOauthStep] = useState('connect'); // 'connect' | 'select_account'
  const [adAccountsList, setAdAccountsList] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [pagesList, setPagesList] = useState([]);
  const [selectedPageId, setSelectedPageId] = useState('');
  const [tempAccessToken, setTempAccessToken] = useState('');

  const [linkedinIntegration, setLinkedinIntegration] = useState(null);
  const [tiktokIntegration, setTiktokIntegration] = useState(null);
  const [connectingLI, setConnectingLI] = useState(false);
  const [connectingTK, setConnectingTK] = useState(false);

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

  // 2. Automated Meta OAuth Flow with Extended Scopes (Ads + Pages + Instagram Comments)
  const handleFacebookOAuth = async () => {
    try {
      setConnecting(true);

      // Obtener el App ID real desde el backend
      const configRes = await apiFetch(`/clients/${clientId}/meta-integration/config`);
      const appId = configRes.data?.appId;

      if (appId) {
        // FLOW REAL: popup oficial con redirección a callback local
        const redirectUri = window.location.origin + '/meta-callback.html';
        
        // Scope automatizado y extendido: ¡Pide todo lo necesario para Ads, Facebook Pages e Instagram en un solo flujo fácil!
        const oauthUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=ads_read,ads_management,business_management,pages_show_list,pages_read_engagement,pages_read_user_content,instagram_basic,instagram_manage_comments,pages_manage_posts,instagram_content_publish,pages_manage_engagement`;

        toast.loading('Esperando autorización en el popup de Facebook...', { id: 'cm-oauth-toast' });

        const popup = window.open(
          oauthUrl,
          'facebook-login',
          'width=650,height=650,scrollbars=yes'
        );

        if (!popup) {
          toast.error(
            'El popup fue bloqueado por el navegador. Habilita las ventanas emergentes.',
            { id: 'cm-oauth-toast' }
          );
          setConnecting(false);
          return;
        }

        const handleMessage = async event => {
          if (event.origin !== window.location.origin) return;

          if (event.data?.type === 'META_OAUTH_SUCCESS') {
            window.removeEventListener('message', handleMessage);
            const hash = event.data.hash;
            const params = new URLSearchParams(hash.replace('#', '?'));
            const shortLivedToken = params.get('access_token');

            if (shortLivedToken) {
              try {
                toast.loading('Sincronizando con Meta y recuperando cuentas...', { id: 'cm-oauth-toast' });

                // Intercambio a token de 60 días y recupera AdAccounts + Facebook/Instagram Pages
                const exchangeRes = await apiFetch(
                  `/clients/${clientId}/meta-integration/exchange`,
                  {
                    method: 'POST',
                    body: JSON.stringify({ shortLivedToken }),
                  }
                );

                toast.success('¡Sesión vinculada con Meta exitosamente!', {
                  id: 'cm-oauth-toast',
                });
                setTempAccessToken(exchangeRes.data.accessToken);
                setAdAccountsList(exchangeRes.data.accounts || []);
                setPagesList(exchangeRes.data.pages || []);

                if (exchangeRes.data.accounts?.length > 0) {
                  setSelectedAccountId(exchangeRes.data.accounts[0].id);
                }
                if (exchangeRes.data.pages?.length > 0) {
                  setSelectedPageId(exchangeRes.data.pages[0].id);
                }
                setOauthStep('select_account');
              } catch (err) {
                toast.error(err.message || 'Error al procesar la vinculación.', {
                  id: 'cm-oauth-toast',
                });
              } finally {
                setConnecting(false);
              }
            }
          } else if (event.data?.type === 'META_OAUTH_ERROR') {
            window.removeEventListener('message', handleMessage);
            toast.error(event.data.error || 'Error al iniciar sesión en Facebook.', {
              id: 'cm-oauth-toast',
            });
            setConnecting(false);
          }
        };

        window.addEventListener('message', handleMessage);

        const checkClosed = setInterval(() => {
          if (!popup || popup.closed) {
            clearInterval(checkClosed);
            window.removeEventListener('message', handleMessage);
            toast.dismiss('cm-oauth-toast');
            setConnecting(false);
          }
        }, 1000);
      } else {
        // FLOW SIMULADO/SANDBOX DE CONTINGENCIA
        toast.loading('Conectando de forma segura con Meta Sandbox...', { id: 'cm-oauth-toast' });

        const res = await apiFetch(`/clients/${clientId}/meta-integration/exchange`, {
          method: 'POST',
          body: JSON.stringify({ shortLivedToken: 'mock_short_lived_token' }),
        });

        toast.success('¡Sesión autorizada por Meta Sandbox!', { id: 'cm-oauth-toast' });
        setTempAccessToken(res.data.accessToken);
        setAdAccountsList(res.data.accounts || []);
        setPagesList(res.data.pages || []);

        if (res.data.accounts?.length > 0) {
          setSelectedAccountId(res.data.accounts[0].id);
        }
        if (res.data.pages?.length > 0) {
          setSelectedPageId(res.data.pages[0].id);
        }
        setOauthStep('select_account');
        setConnecting(false);
      }
    } catch (err) {
      toast.error(err.message || 'Error al autorizar con Facebook.', { id: 'cm-oauth-toast' });
      setConnecting(false);
    }
  };

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

  // Sync draft when thread changes
  const activeThread = threads.find(t => t.id === selectedThreadId);
  useEffect(() => {
    if (activeThread) {
      setActiveDraft(activeThread.aiDraft);
      setIsEditing(false);
    } else {
      setActiveDraft('');
    }
  }, [selectedThreadId, threads]);

  // Filter threads
  const filteredThreads = threads.filter(thread => {
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
    setRegenerating(true);
    // Simulate LLM Call to ai.service.js
    await new Promise(r => setTimeout(r, 1000));
    
    let newDraft = activeDraft;
    if (instruction === 'shorter') {
      newDraft = `¡Hola ${activeThread.user.name}! El envío a Palermo sale $1.200 y llega hoy mismo si compras antes de las 14 hs (máx 24hs). ¿Te paso el link de compra? ☕️`;
    } else if (instruction === 'warmer') {
      newDraft = `¡Hola Sofi hermosa! 😊 Qué alegría tu interés en nuestro Blend Orgánico. El envío a Palermo tiene un valor de $1.200. Si hacés tu pedido hoy antes de las 14:00, ¡te lo llevamos volando hoy mismo! Sino, te llega en 24 horas hábiles. ¿Te gustaría que te pasemos el link para asegurar el tuyo? Que tengas un día hermoso! ☕️🌸`;
    } else if (instruction === 'cta') {
      newDraft = `¡Hola Sofía! El envío a Palermo tiene un costo de $1.200 y demora menos de 24 horas. ¡Realiza tu compra ahora haciendo clic en el siguiente enlace y asegura tu Blend Orgánico con un 10% de descuento de bienvenida! 👉 https://cafeconcordia.com/shop ☕️✨`;
    }
    
    setActiveDraft(newDraft);
    setRegenerating(false);
    toast.success('Borrador ajustado con IA');
  };

  const getSentimentBadge = (sentiment) => {
    if (sentiment === 'positive') return <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full text-[9px] font-bold">🟢 Positivo</span>;
    if (sentiment === 'negative') return <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded-full text-[9px] font-bold">🔴 Queja</span>;
    return <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full text-[9px] font-bold">🟡 Consulta</span>;
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
                  disabled={connecting}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm py-4 rounded-xl transition-all duration-200 shadow-xl flex items-center justify-center gap-3 transform hover:scale-[1.01] hover:shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                >
                  {connecting ? (
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
      
      {/* 1. AGENT CARD TOP STATUS BAR */}
      <div className="bg-app-sidebar border border-border-subtle p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex-shrink-0">
            <InteractiveAvatar variant="cm" size="sm" />
          </div>
          <div>
            <h3 className="text-lg font-black text-text-primary font-title">
              CM Inteligente Activo
            </h3>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[11px] text-text-muted">
              <span className="font-mono bg-surface border border-border-subtle px-2 py-0.5 rounded-md text-text-secondary font-bold">
                Página ID: {integration.meta_page_id || 'Conectada'}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Sincronizado {integration.meta_page_id?.includes('mock') ? '(Modo Sandbox)' : '(Tiempo Real)'}
              </span>
            </div>
          </div>
        </div>

        {/* Stats & Disconnect Actions */}
        <div className="flex flex-wrap items-center gap-6 self-end md:self-center">
          {/* Dynamic statistics */}
          <div className="flex items-center gap-6 pr-2">
            <div className="text-center sm:text-left">
              <div className="text-base font-black text-emerald-400 font-title">{pendingCount}</div>
              <div className="text-[9px] text-text-secondary font-bold uppercase tracking-wider mt-0.5">
                Pendientes
              </div>
            </div>
            <div className="h-8 w-px bg-border-subtle" />
            <div className="text-center sm:text-left">
              <div className="text-base font-black text-rose-400 font-title">{escalatedCount}</div>
              <div className="text-[9px] text-text-secondary font-bold uppercase tracking-wider mt-0.5">
                Escalados CM
              </div>
            </div>
            <div className="h-8 w-px bg-border-subtle" />
            <div className="text-center sm:text-left">
              <div className="text-base font-black text-blue-400 font-title">{totalTimeSaved} min</div>
              <div className="text-[9px] text-text-secondary font-bold uppercase tracking-wider mt-0.5">
                Tiempo Ahorrado
              </div>
            </div>
          </div>

          <div className="h-8 w-px bg-border-subtle hidden md:block" />

          {/* Botón Reglas Copiloto */}
          <button
            onClick={() => setShowRulesPanel(true)}
            className="flex items-center gap-1.5 px-3 py-2 border border-border-subtle bg-surface hover:bg-surface-soft text-text-secondary hover:text-text-primary font-bold text-xs rounded-xl transition-all duration-200 cursor-pointer shadow-sm animate-fade-in"
            title="Configurar Reglas y Autopiloto"
          >
            <Cog6ToothIcon className="h-3.5 w-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Reglas & Autopiloto</span>
          </button>

          {/* Botón Desconectar */}
          <button
            onClick={handleDisconnect}
            className="flex items-center gap-1.5 px-3 py-2 border border-red-500/20 bg-red-500/5 hover:bg-red-500/15 text-red-400 font-bold text-xs rounded-xl transition-all duration-200 cursor-pointer shadow-sm"
            title="Desconectar cuenta"
          >
            <TrashIcon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Desconectar</span>
          </button>
        </div>
      </div>

      {/* 2. MAIN WORKSPACE CONTAINER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* COL 1: SMART INBOX LIST (4 COLS) */}
        <div className="lg:col-span-4 flex flex-col bg-app-sidebar border border-border-subtle rounded-2xl overflow-hidden min-h-[600px]">
          {/* Header search */}
          <div className="p-4 border-b border-border-subtle space-y-3">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-4 w-4 text-text-muted" />
              <input
                type="text"
                placeholder="Buscar comentario o usuario..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-surface border border-border-subtle rounded-xl pl-9 pr-10 py-2 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-emerald-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => fetchThreads(false)}
                disabled={loadingThreads}
                className="absolute right-2 top-1.5 p-1 rounded-lg hover:bg-surface-soft text-text-muted hover:text-emerald-400 transition-colors"
                title="Actualizar bandeja"
              >
                <ArrowPathIcon className={`h-4 w-4 ${loadingThreads ? 'animate-spin' : ''}`} />
              </button>
            </div>
            
            {/* Horizontal Platform Filter Tabs */}
            <div className="flex gap-1.5 overflow-x-auto pb-2 border-b border-border-subtle/40">
              {[
                { id: 'all', label: 'Todos', count: threads.length },
                { id: 'facebook', label: 'Facebook', count: fbCount },
                { id: 'instagram', label: 'Instagram', count: igCount },
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setPlatformFilter(tab.id)}
                  className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                    platformFilter === tab.id
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'border border-border-subtle bg-surface text-text-muted hover:text-text-primary'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`px-1.2 py-0.2 rounded-md text-[8px] font-black ${
                    platformFilter === tab.id ? 'bg-emerald-500/20 text-emerald-300' : 'bg-surface-soft text-text-secondary'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Underlined Status Filter Switcher */}
            <div className="flex gap-4 text-[10px] font-bold text-text-secondary px-1 pt-1">
              {[
                { id: 'pending', label: `Pendientes (${pendingCount})` },
                { id: 'escalated', label: `Urgentes (${escalatedCount})` },
                { id: 'replied', label: 'Respondidos' },
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id)}
                  className={`hover:text-text-primary transition-colors cursor-pointer relative pb-1.5 ${
                    statusFilter === tab.id ? 'text-emerald-400 font-black' : 'text-text-muted font-medium'
                  }`}
                >
                  <span>{tab.label}</span>
                  {statusFilter === tab.id && (
                    <motion.div
                      layoutId="cm-status-underline"
                      className="absolute bottom-0 inset-x-0 h-0.5 bg-emerald-500 rounded-full"
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Inbox threads list */}
          <div className="flex-1 overflow-y-auto divide-y divide-border-subtle max-h-[500px]">
            {loadingThreads ? (
              <div className="flex flex-col items-center justify-center p-12 text-center text-text-muted h-64">
                <ArrowPathIcon className="h-8 w-8 animate-spin text-emerald-500 mb-3" />
                <p className="text-xs font-bold tracking-widest uppercase">
                  Cargando comentarios...
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
                        className={`p-3.5 cursor-pointer transition-all flex flex-col gap-1.5 hover:bg-surface-soft/40 relative border-b border-border-subtle/30 ${
                          isSelected ? 'bg-surface-soft border-l-4 border-emerald-500' : 'bg-transparent'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={thread.user.avatar}
                              alt={thread.user.name}
                              className="w-6.5 h-6.5 rounded-full object-cover border border-border-subtle"
                            />
                            <div>
                              <span className="text-xs font-bold text-text-primary">
                                @{thread.user.name}
                              </span>
                              <div className="flex items-center gap-1.5 mt-0.5 text-[8px] text-text-muted">
                                {thread.platform === 'Instagram' ? (
                                  <span className="text-pink-400 font-bold uppercase tracking-wider text-[7px]">Instagram</span>
                                ) : (
                                  <span className="text-blue-400 font-bold uppercase tracking-wider text-[7px]">Facebook</span>
                                )}
                                <span>•</span>
                                <span>{thread.time}</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Sentiment dot indicator instead of massive badge */}
                          <div className="flex items-center gap-1.5 pt-0.5">
                            {thread.sentiment === 'positive' ? (
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.4)]" title="Sentimiento Positivo" />
                            ) : thread.sentiment === 'negative' ? (
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shadow-[0_0_8px_rgba(248,113,113,0.4)]" title="Queja / Crítico" />
                            ) : (
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.4)]" title="Consulta / Neutral" />
                            )}
                          </div>
                        </div>

                        <p className="text-[11px] text-text-secondary leading-relaxed pl-9 pr-1 font-medium line-clamp-2">
                          "{thread.comment}"
                        </p>

                        <div className="text-[8px] text-text-muted pl-9 truncate font-mono tracking-tight opacity-75">
                          Post: {thread.postTitle}
                        </div>
                      </motion.div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center p-12 text-center text-text-muted h-64">
                    <ChatBubbleLeftRightIcon className="h-8 w-8 opacity-20 mb-2" />
                    <p className="text-[11px] font-bold">No hay comentarios en esta bandeja</p>
                  </div>
                )}
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* COL 2: COPILOT WORKSPACE (8 COLS) */}
        <div className="lg:col-span-8 flex flex-col bg-app-sidebar border border-border-subtle rounded-2xl overflow-hidden min-h-[600px]">
          {activeThread ? (
            <div className="p-5 flex flex-col flex-1 gap-5">
              
              {/* Thread Context Header */}
              <div className="border-b border-border-subtle pb-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-xs font-bold text-text-secondary uppercase tracking-widest flex items-center gap-1.5">
                    <UserIcon className="h-4 w-4 text-emerald-400" />
                    <span>Detalle de Interacción</span>
                  </h4>
                  <span className="text-[9px] font-bold font-mono px-2 py-0.5 rounded bg-surface border border-border-subtle text-text-muted">
                    ID: {activeThread.id}
                  </span>
                </div>
                
                <div className="bg-surface/50 border border-border-subtle p-3.5 rounded-xl flex gap-3 items-stretch relative overflow-hidden">
                  {/* Thumbnail of original post if available */}
                  {activeThread.postThumbnail ? (
                    <div className="w-16 h-16 rounded-xl overflow-hidden border border-border-subtle flex-shrink-0 relative group">
                      <img 
                        src={activeThread.postThumbnail} 
                        alt="Thumbnail" 
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      {/* Subtle gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-surface border border-border-subtle flex items-center justify-center flex-shrink-0 text-text-muted text-[9px] font-bold">
                      Sin foto
                    </div>
                  )}

                  {/* Post details & Comment */}
                  <div className="flex-1 flex flex-col justify-between gap-1 min-w-0">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2 text-[9px] text-text-muted font-bold uppercase tracking-wider">
                        <span className="truncate">Post: {activeThread.postTitle}</span>
                        {activeThread.platform === 'Instagram' ? (
                          <span className="bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600 text-white font-black px-1.5 py-0.5 rounded text-[8px] tracking-wider uppercase scale-90">
                            Instagram
                          </span>
                        ) : (
                          <span className="bg-blue-600 text-white font-black px-1.5 py-0.5 rounded text-[8px] tracking-wider uppercase scale-90">
                            Facebook
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-text-primary font-medium line-clamp-2 pl-2 border-l-2 border-emerald-500/40">
                        "{activeThread.comment}"
                      </div>
                    </div>

                    {/* View Original Post Link Action */}
                    {activeThread.postLink && (
                      <a
                        href={activeThread.postLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="self-start flex items-center gap-1 text-[9px] font-black uppercase text-emerald-400 hover:text-emerald-300 transition-colors tracking-widest mt-1 cursor-pointer"
                      >
                        <LinkIcon className="h-3 w-3" />
                        <span>Ver publicación original</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* AI Draft Suggestion Box */}
              <div className="flex-1 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <SparklesIcon className="h-4.5 w-4.5 text-emerald-400" />
                    <span className="text-xs font-bold text-text-secondary">Propuesta de Respuesta IA</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      Confianza: {activeThread.aiConfidence}%
                    </span>
                  </div>
                </div>

                <div className="relative flex-1 flex flex-col bg-surface border border-border-subtle rounded-xl p-4 shadow-xl">
                  {/* Subtle Background Glow representing AI presence */}
                  <div className="absolute right-4 top-4 w-12 h-12 rounded-full bg-emerald-500/10 blur-xl pointer-events-none" />

                  {isEditing ? (
                    <textarea
                      value={activeDraft}
                      onChange={e => setActiveDraft(e.target.value)}
                      className="w-full flex-1 bg-transparent border-0 resize-none text-xs text-text-primary leading-relaxed focus:ring-0 focus:outline-none min-h-[140px]"
                      placeholder="Modifica el borrador de la IA aquí..."
                    />
                  ) : (
                    <div className="text-xs text-text-secondary leading-relaxed flex-1 font-medium select-text pr-2">
                      {activeDraft}
                    </div>
                  )}

                  {/* Context files used */}
                  <div className="border-t border-border-subtle/50 mt-3 pt-3 flex justify-between items-center text-[10px] text-text-muted">
                    <span className="flex items-center gap-1 font-mono">
                      <ShieldCheckIcon className="h-3.5 w-3.5 text-emerald-400" />
                      Documento Citado: {activeThread.contextUsed}
                    </span>
                    
                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      className="flex items-center gap-1 text-[10px] font-bold text-text-secondary hover:text-emerald-400 transition-colors"
                    >
                      <PencilIcon className="h-3 w-3" />
                      <span>{isEditing ? 'Fijar' : 'Editar'}</span>
                    </button>
                  </div>
                </div>

                {/* AI Copilot Regeneration Controls */}
                <div className="bg-surface/50 border border-border-subtle p-3 rounded-xl space-y-2">
                  <div className="text-[9px] font-bold text-text-muted uppercase tracking-wider px-1">
                    Ajustar Tono con IA (Borrador Rápido)
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => handleRegenerate('shorter')}
                      disabled={regenerating || activeThread.status === 'replied'}
                      className="border border-border-subtle bg-surface hover:bg-surface-soft text-[10px] font-bold py-1.5 rounded-lg text-text-secondary hover:text-text-primary transition-colors flex items-center justify-center gap-1"
                    >
                      <ClockIcon className="h-3.5 w-3.5" />
                      <span>Más Corto</span>
                    </button>
                    <button
                      onClick={() => handleRegenerate('warmer')}
                      disabled={regenerating || activeThread.status === 'replied'}
                      className="border border-border-subtle bg-surface hover:bg-surface-soft text-[10px] font-bold py-1.5 rounded-lg text-text-secondary hover:text-text-primary transition-colors flex items-center justify-center gap-1"
                    >
                      <FaceSmileIcon className="h-3.5 w-3.5" />
                      <span>Más Empático</span>
                    </button>
                    <button
                      onClick={() => handleRegenerate('cta')}
                      disabled={regenerating || activeThread.status === 'replied'}
                      className="border border-border-subtle bg-surface hover:bg-surface-soft text-[10px] font-bold py-1.5 rounded-lg text-text-secondary hover:text-text-primary transition-colors flex items-center justify-center gap-1"
                    >
                      <SparklesIcon className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Con CTA</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Main Actions Box */}
              <div className="pt-3 border-t border-border-subtle flex gap-3">
                {activeThread.status === 'replied' ? (
                  <div className="w-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 py-3 rounded-xl flex items-center justify-center gap-2 text-xs font-bold font-title">
                    <CheckIcon className="h-5 w-5" />
                    <span>Mensaje Respondido • Ver en Red Social</span>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={handleApprove}
                      disabled={approving || regenerating}
                      className="flex-1 bg-text-primary hover:bg-white text-app-sidebar py-3 rounded-xl flex items-center justify-center gap-2 text-xs font-black font-title transition-all shadow-xl hover:scale-[1.01]"
                    >
                      {approving ? (
                        <ArrowPathIcon className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckIcon className="h-4 w-4" />
                      )}
                      <span>Aprobar y Enviar Respuesta</span>
                    </button>

                    {activeThread.status !== 'escalated' && (
                      <button
                        onClick={() => {
                          setThreads(prev => prev.map(t => t.id === activeThread.id ? { ...t, status: 'escalated' } : t));
                          toast.error('Comentario derivado a atención prioritaria humana.');
                        }}
                        className="px-4 border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 text-rose-400 py-3 rounded-xl text-xs font-bold transition-colors"
                      >
                        Escalar a CM
                      </button>
                    )}
                  </>
                )}
              </div>

            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-center text-text-muted flex-1 h-full">
              <InteractiveAvatar variant="cm" size="lg" className="mb-4" />
              <p className="text-xs font-bold">Selecciona un hilo para ver la conversación y la sugerencia de IA</p>
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
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowRulesPanel(false)}
              className="absolute inset-0 bg-black backdrop-blur-xs cursor-pointer"
            />
            {/* Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-sm h-full bg-app-sidebar border-l border-border-subtle p-6 flex flex-col gap-6 shadow-2xl overflow-y-auto z-10 text-text-primary"
            >
              <div className="flex justify-between items-center border-b border-border-subtle pb-4">
                <h4 className="text-sm font-black text-text-primary uppercase tracking-widest flex items-center gap-1.5">
                  <ShieldCheckIcon className="h-5 w-5 text-emerald-400" />
                  <span>Reglas del Copiloto</span>
                </h4>
                <button
                  onClick={() => setShowRulesPanel(false)}
                  className="px-3 py-1.5 rounded-xl border border-border-subtle bg-surface hover:bg-surface-soft text-text-muted hover:text-text-primary text-[10px] font-bold transition-all cursor-pointer"
                >
                  Cerrar
                </button>
              </div>

              {/* Tone Card Reference */}
              <div className="bg-surface/50 border border-border-subtle p-4 rounded-2xl space-y-1.5">
                <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">Tono de Voz Activo</span>
                <p className="text-[11px] text-text-primary font-bold">Cálido, Cercano & Empático</p>
                <div className="text-[9px] text-text-muted leading-relaxed">
                  Utiliza siempre emojis amistosos, saluda de manera personalizada y mantén un lenguaje optimista y servicial.
                </div>
              </div>

              {/* Autopilot Toggles Panel */}
              <div className="space-y-4">
                <h5 className="text-[10px] font-bold text-text-secondary uppercase tracking-widest px-1">
                  Ajustes de Autopiloto
                </h5>

                <div className="space-y-3.5">
                  {/* Toggle 1 */}
                  <div className="flex items-center justify-between bg-surface/30 p-3 rounded-2xl border border-border-subtle/50">
                    <div className="flex flex-col gap-0.5 max-w-[80%]">
                      <span className="text-[10px] font-bold text-text-primary">Auto-responder Saludos</span>
                      <span className="text-[8px] text-text-muted leading-tight">La IA responderá de forma autónoma comentarios de emojis y saludos.</span>
                    </div>
                    <button
                      onClick={() => {
                        setAutopilotGreeting(!autopilotGreeting);
                        toast.success(autopilotGreeting ? 'Autopiloto de saludos inactivo' : 'Autopiloto de saludos activado');
                      }}
                      className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none cursor-pointer ${
                        autopilotGreeting ? 'bg-emerald-500' : 'bg-surface border border-border-subtle'
                      }`}
                    >
                      <div className={`w-3.8 h-3.8 rounded-full bg-white transition-transform duration-200 transform ${
                        autopilotGreeting ? 'translate-x-4' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>

                  {/* Toggle 2 */}
                  <div className="flex items-center justify-between bg-surface/30 p-3 rounded-2xl border border-border-subtle/50">
                    <div className="flex flex-col gap-0.5 max-w-[80%]">
                      <span className="text-[10px] font-bold text-text-primary">Auto-resolver FAQs</span>
                      <span className="text-[8px] text-text-muted leading-tight">Contesta automáticamente preguntas de precios/envíos con alta confianza.</span>
                    </div>
                    <button
                      onClick={() => {
                        setAutopilotFaq(!autopilotFaq);
                        toast.success(autopilotFaq ? 'Autopiloto de FAQ inactivo' : 'Autopiloto de FAQ activado');
                      }}
                      className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none cursor-pointer ${
                        autopilotFaq ? 'bg-emerald-500' : 'bg-surface border border-border-subtle'
                      }`}
                    >
                      <div className={`w-3.8 h-3.8 rounded-full bg-white transition-transform duration-200 transform ${
                        autopilotFaq ? 'translate-x-4' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>

                  {/* Toggle 3 */}
                  <div className="flex items-center justify-between bg-surface/30 p-3 rounded-2xl border border-border-subtle/50">
                    <div className="flex flex-col gap-0.5 max-w-[80%]">
                      <span className="text-[10px] font-bold text-text-primary">Derivar Críticos</span>
                      <span className="text-[8px] text-text-muted leading-tight">Envía quejas o crisis directamente a revisión del equipo humano sin responder.</span>
                    </div>
                    <button
                      onClick={() => {
                        setEscalateNegatives(!escalateNegatives);
                        toast.success(escalateNegatives ? 'Derivación inactiva (Peligro)' : 'Derivación de seguridad activa');
                      }}
                      className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none cursor-pointer ${
                        escalateNegatives ? 'bg-emerald-500' : 'bg-surface border border-border-subtle'
                      }`}
                    >
                      <div className={`w-3.8 h-3.8 rounded-full bg-white transition-transform duration-200 transform ${
                        escalateNegatives ? 'translate-x-4' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Integraciones Multicanal */}
              <div className="space-y-4 border-t border-border-subtle/30 pt-4">
                <h5 className="text-[10px] font-bold text-text-secondary uppercase tracking-widest px-1 flex items-center gap-1.5">
                  <LinkIcon className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Integraciones Multicanal</span>
                </h5>

                <div className="space-y-3">
                  {/* Facebook / Instagram Card */}
                  <div className="bg-surface/30 p-3 rounded-2xl border border-border-subtle/50 space-y-2.5 transition-all hover:border-emerald-500/20 hover:bg-surface/40">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
                          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                          </svg>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-text-primary">Facebook / Instagram</span>
                          <span className="text-[8px] text-text-muted leading-tight">Canal de auto-respuestas CM</span>
                        </div>
                      </div>
                      <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[7.5px] font-bold uppercase tracking-wider">
                        Activo
                      </span>
                    </div>
                    {integration && (
                      <div className="pt-2 border-t border-border-subtle/30 flex items-center justify-between text-[8.5px]">
                        <span className="text-text-muted font-medium truncate max-w-[140px]">
                          Pág: {integration.page_name || 'Sin nombre'}
                        </span>
                        <span className="text-text-muted/60 font-mono">
                          ID: {integration.page_id ? `${integration.page_id.substring(0, 6)}...` : 'N/A'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* LinkedIn Card */}
                  <div className="bg-surface/30 p-3 rounded-2xl border border-border-subtle/50 space-y-2.5 transition-all hover:border-emerald-500/20 hover:bg-surface/40">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400">
                          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                          </svg>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-text-primary">LinkedIn Profile</span>
                          <span className="text-[8px] text-text-muted leading-tight">Publicación directa multicanal</span>
                        </div>
                      </div>
                      {linkedinIntegration ? (
                        <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[7.5px] font-bold uppercase tracking-wider animate-pulse">
                          Sincronizado
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded-full bg-surface-soft border border-border-subtle text-text-muted text-[7.5px] font-bold uppercase tracking-wider">
                          Inactivo
                        </span>
                      )}
                    </div>
                    {linkedinIntegration ? (
                      <div className="pt-2 border-t border-border-subtle/30 flex items-center justify-between gap-1">
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <span className="text-[8.5px] text-text-secondary font-bold truncate max-w-[130px]">
                            {linkedinIntegration.linkedin_name}
                          </span>
                          <span className="text-[7.5px] text-text-muted font-mono truncate max-w-[130px]">
                            {linkedinIntegration.linkedin_urn}
                          </span>
                        </div>
                        <button
                          onClick={handleDeleteLinkedIn}
                          className="px-2 py-0.5 rounded-lg border border-red-500/30 bg-red-500/5 hover:bg-red-500/15 text-red-400 text-[8px] font-bold transition-all cursor-pointer flex-shrink-0"
                        >
                          Desconectar
                        </button>
                      </div>
                    ) : (
                      <div className="pt-0.5">
                        <button
                          onClick={handleLinkedInOAuth}
                          className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold text-[8.5px] py-1.5 rounded-lg transition-all duration-200 flex items-center justify-center gap-1 shadow-md transform hover:scale-[1.01]"
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
                  <div className="bg-surface/30 p-3 rounded-2xl border border-border-subtle/50 space-y-2.5 transition-all hover:border-emerald-500/20 hover:bg-surface/40">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-pink-500/10 text-pink-400">
                          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                            <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.86-.6-4.08-1.4-1.18-.78-2.07-1.9-2.57-3.19-.03 1.11-.02 2.22-.02 3.33v8.3c.02 1.39-.33 2.82-1.13 3.96-.8 1.16-2.05 1.99-3.46 2.3-1.45.31-3.03.11-4.37-.5-1.37-.62-2.48-1.75-3.09-3.13-.61-1.42-.64-3.07-.12-4.5.5-1.39 1.53-2.61 2.88-3.3 1.43-.72 3.12-.86 4.63-.4v4.07c-.9-.28-1.92-.19-2.73.35-.8.54-1.3 1.49-1.33 2.46.03.97.55 1.91 1.36 2.44.82.52 1.88.57 2.75.14.88-.43 1.47-1.33 1.52-2.3.01-3.12 0-6.24 0-9.36.03-3.38.01-6.76.02-10.15z" />
                          </svg>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-text-primary">TikTok Business</span>
                          <span className="text-[8px] text-text-muted leading-tight">Publicación directa de videos</span>
                        </div>
                      </div>
                      {tiktokIntegration ? (
                        <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[7.5px] font-bold uppercase tracking-wider animate-pulse">
                          Sincronizado
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded-full bg-surface-soft border border-border-subtle text-text-muted text-[7.5px] font-bold uppercase tracking-wider">
                          Inactivo
                        </span>
                      )}
                    </div>
                    {tiktokIntegration ? (
                      <div className="pt-2 border-t border-border-subtle/30 flex items-center justify-between gap-1">
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <span className="text-[8.5px] text-text-secondary font-bold truncate max-w-[130px]">
                            @{tiktokIntegration.tiktok_username}
                          </span>
                          <span className="text-[7.5px] text-text-muted font-mono truncate max-w-[130px]">
                            {tiktokIntegration.tiktok_open_id}
                          </span>
                        </div>
                        <button
                          onClick={handleDeleteTikTok}
                          className="px-2 py-0.5 rounded-lg border border-red-500/30 bg-red-500/5 hover:bg-red-500/15 text-red-400 text-[8px] font-bold transition-all cursor-pointer flex-shrink-0"
                        >
                          Desconectar
                        </button>
                      </div>
                    ) : (
                      <div className="pt-0.5">
                        <button
                          onClick={handleTikTokOAuth}
                          className="w-full bg-pink-600 hover:bg-pink-500 text-white font-bold text-[8.5px] py-1.5 rounded-lg transition-all duration-200 flex items-center justify-center gap-1 shadow-md transform hover:scale-[1.01]"
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
              <div className="bg-surface border border-border-subtle p-4 rounded-2xl flex items-start gap-2.5 mt-auto">
                <ShieldCheckIcon className="h-4.5 w-4.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div className="text-[9.5px] text-text-muted leading-relaxed">
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
