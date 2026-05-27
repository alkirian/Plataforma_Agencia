// src/components/meta/MetaAdsSection.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '../../api/apiFetch';
import { InteractiveAvatar } from '../ui/InteractiveAvatar';
import { toast } from 'react-hot-toast';
import {
  CurrencyDollarIcon,
  EyeIcon,
  CursorArrowRaysIcon,
  PercentBadgeIcon,
  ArrowPathIcon,
  LinkIcon,
  TrashIcon,
  ChartBarIcon,
  SparklesIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';

export const MetaAdsSection = ({ clientId }) => {
  const [loading, setLoading] = useState(true);
  const [fetchingData, setFetchingData] = useState(false);
  const [integration, setIntegration] = useState(null);
  const [insights, setInsights] = useState(null);
  const [dateRange, setDateRange] = useState('last_30d');

  // Form states
  const [adAccountId, setAdAccountId] = useState('');
  const [pageId, setPageId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [connecting, setConnecting] = useState(false);

  // Estados del Flujo OAuth Automatizado
  const [oauthStep, setOauthStep] = useState('connect'); // 'connect' | 'select_account'
  const [adAccountsList, setAdAccountsList] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [pagesList, setPagesList] = useState([]);
  const [selectedPageId, setSelectedPageId] = useState('');
  const [tempAccessToken, setTempAccessToken] = useState('');

  // Tooltip graph state
  const [activeDataIndex, setActiveDataIndex] = useState(null);

  // 1. Cargar estado de la integración
  const loadIntegration = async () => {
    try {
      setLoading(true);
      const res = await apiFetch(`/clients/${clientId}/meta-integration`);
      setIntegration(res.data);
      if (res.data) {
        await loadInsights();
      }
    } catch (err) {
      console.error(err);
      toast.error('No se pudo verificar el estado de integración de Meta.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Cargar analíticas de Meta Ads
  const loadInsights = async () => {
    try {
      setFetchingData(true);
      const res = await apiFetch(
        `/clients/${clientId}/meta-integration/campaigns?dateRange=${dateRange}`
      );
      setInsights(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Error al descargar analíticas de Meta.');
    } finally {
      setFetchingData(false);
    }
  };

  useEffect(() => {
    loadIntegration();
  }, [clientId, dateRange]);

  // 3. Flujo OAuth Real / Simulación Interactiva
  const handleFacebookOAuth = async () => {
    try {
      setConnecting(true);

      // 1. Obtener la App ID real desde el backend
      const configRes = await apiFetch(`/clients/${clientId}/meta-integration/config`);
      const appId = configRes.data?.appId;
      console.log('🔍 [DEBUG FRONTEND] appId recuperado:', appId, 'Respuesta completa:', configRes);

      if (appId) {
        // FLOW REAL: Abrir popup de Facebook OAuth oficial redireccionando al callback estático
        const redirectUri = window.location.origin + '/meta-callback.html';
        const oauthUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=ads_read,ads_management,business_management,pages_show_list,pages_read_engagement,pages_read_user_content,instagram_basic,instagram_manage_comments,pages_manage_posts,instagram_content_publish,pages_manage_engagement`;

        toast.loading('Esperando autorización en el popup de Facebook...', { id: 'oauth-toast' });

        const popup = window.open(
          oauthUrl,
          'facebook-login',
          'width=650,height=650,scrollbars=yes'
        );

        if (!popup) {
          toast.error(
            'El popup fue bloqueado por el navegador. Habilita las ventanas emergentes.',
            { id: 'oauth-toast' }
          );
          setConnecting(false);
          return;
        }

        // Registrar el event listener para escuchar el mensaje de meta-callback.html
        const handleMessage = async event => {
          if (event.origin !== window.location.origin) return;

          if (event.data?.type === 'META_OAUTH_SUCCESS') {
            window.removeEventListener('message', handleMessage);
            const hash = event.data.hash;
            const params = new URLSearchParams(hash.replace('#', '?'));
            const shortLivedToken = params.get('access_token');

            if (shortLivedToken) {
              try {
                toast.loading('Sincronizando cuentas con el backend...', { id: 'oauth-toast' });

                // Enviar el token real al backend para intercambiar y listar cuentas reales
                const exchangeRes = await apiFetch(
                  `/clients/${clientId}/meta-integration/exchange`,
                  {
                    method: 'POST',
                    body: JSON.stringify({ shortLivedToken }),
                  }
                );

                toast.success('¡Cuentas publicitarias y páginas vinculadas con éxito!', {
                  id: 'oauth-toast',
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
                  id: 'oauth-toast',
                });
              } finally {
                setConnecting(false);
              }
            }
          } else if (event.data?.type === 'META_OAUTH_ERROR') {
            window.removeEventListener('message', handleMessage);
            toast.error(event.data.error || 'Error al iniciar sesión en Facebook.', {
              id: 'oauth-toast',
            });
            setConnecting(false);
          }
        };

        window.addEventListener('message', handleMessage);

        // Limpiador en caso de que cierren el popup manualmente sin autorizar
        const checkClosed = setInterval(() => {
          if (!popup || popup.closed) {
            clearInterval(checkClosed);
            window.removeEventListener('message', handleMessage);
            toast.dismiss('oauth-toast');
            setConnecting(false);
          }
        }, 1000);
      } else {
        // FLOW SIMULADO/SANDBOX (Cuando no hay variables de entorno configuradas)
        toast.loading('Iniciando sesión segura con Meta Sandbox...', { id: 'oauth-toast' });

        const res = await apiFetch(`/clients/${clientId}/meta-integration/exchange`, {
          method: 'POST',
          body: JSON.stringify({ shortLivedToken: 'mock_short_lived_token' }),
        });

        toast.success('¡Sesión autorizada por Meta Sandbox!', { id: 'oauth-toast' });
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
      toast.error(err.message || 'Error al autorizar con Facebook.', { id: 'oauth-toast' });
      setConnecting(false);
    }
  };

  // 4. Confirmar la cuenta seleccionada en el Dropdown de OAuth
  const handleConfirmAccountSelection = async () => {
    if (!selectedAccountId) {
      toast.error('Por favor, selecciona una cuenta publicitaria.');
      return;
    }

    try {
      setConnecting(true);
      const res = await apiFetch(`/clients/${clientId}/meta-integration`, {
        method: 'POST',
        body: JSON.stringify({
          meta_ad_account_id: selectedAccountId,
          meta_page_id: selectedPageId || null,
          access_token: tempAccessToken,
        }),
      });
      toast.success('¡Integración de Meta Ads y CM completada exitosamente!');
      setIntegration(res.data);
      setOauthStep('connect'); // resetear paso
      await loadInsights();
    } catch (err) {
      toast.error(err.message || 'Error al guardar la selección de la cuenta.');
    } finally {
      setConnecting(false);
    }
  };

  // 5. Conexión clásica manual (Fallback si prefieren meter claves manuales)
  const handleManualConnect = async e => {
    if (e) e.preventDefault();
    if (!adAccountId.trim() || !accessToken.trim()) {
      toast.error('El ID de Cuenta Publicitaria y el Token son obligatorios.');
      return;
    }

    try {
      setConnecting(true);
      const res = await apiFetch(`/clients/${clientId}/meta-integration`, {
        method: 'POST',
        body: JSON.stringify({
          meta_ad_account_id: adAccountId.trim(),
          meta_page_id: pageId.trim() || null,
          access_token: accessToken.trim(),
        }),
      });
      toast.success('Cuenta de Meta Ads conectada manualmente.');
      setIntegration(res.data);
      await loadInsights();
    } catch (err) {
      toast.error(err.message || 'Error al conectar cuenta publicitaria.');
    } finally {
      setConnecting(false);
    }
  };

  // 6. Desconectar integración
  const handleDisconnect = async () => {
    if (
      !window.confirm(
        '¿Estás seguro de que deseas desconectar esta cuenta publicitaria de Meta? Se purgarán los accesos locales.'
      )
    ) {
      return;
    }

    try {
      setFetchingData(true);
      await apiFetch(`/clients/${clientId}/meta-integration`, { method: 'DELETE' });
      toast.success('Cuenta de Meta Ads desconectada.');
      setIntegration(null);
      setInsights(null);
      setAdAccountId('');
      setPageId('');
      setAccessToken('');
      setOauthStep('connect');
    } catch (err) {
      toast.error('Error al desconectar la cuenta.');
    } finally {
      setFetchingData(false);
    }
  };

  if (loading) {
    return (
      <div className='flex flex-col items-center justify-center h-96 text-text-muted'>
        <ArrowPathIcon className='h-8 w-8 animate-spin text-purple-500 mb-3' />
        <p className='text-xs font-bold tracking-widest uppercase'>
          Cargando integración de Meta Ads...
        </p>
      </div>
    );
  }

  // =========================================================================
  // VISTA 1: FORMULARIO DE CONEXIÓN O SELECTOR OAUTH (SI NO ESTÁ INTEGRADO)
  // =========================================================================
  if (!integration) {
    return (
      <div className='p-6 md:p-8 max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[80vh]'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className='w-full bg-app-sidebar border border-border-subtle rounded-3xl p-6 md:p-10 shadow-2xl relative overflow-hidden backdrop-blur-xl'
        >
          {/* Ecosistema Holográfico de fondo */}
          <div className='absolute -right-20 -top-20 w-80 h-80 rounded-full bg-purple-500/10 blur-3xl pointer-events-none' />
          <div className='absolute -left-20 -bottom-20 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl pointer-events-none' />

          <div className='flex flex-col items-center text-center mb-8 relative z-10'>
            {/* Animación del robot Meta Ads */}
            <InteractiveAvatar variant='meta' size='xl' className='mb-4' />
            <h3 className='text-2xl font-black text-text-primary font-title'>
              Estratega de Meta Ads
            </h3>
            <p className='text-xs text-text-muted max-w-lg mt-2'>
              Vincula la cuenta publicitaria de este cliente de forma instantánea usando el flujo
              automatizado de Facebook OAuth o configurándola manualmente.
            </p>
          </div>

          <AnimatePresence mode='wait'>
            {oauthStep === 'connect' ? (
              /* PASO A: BOTÓN DE CONEXIÓN AUTOMÁTICA O MANUAL */
              <motion.div
                key='oauth-connect'
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className='space-y-6 max-w-md mx-auto relative z-10 text-center'
              >
                {/* Botón Principal OAuth Premium */}
                <button
                  type='button'
                  onClick={handleFacebookOAuth}
                  disabled={connecting}
                  className='w-full bg-[#1877F2] hover:bg-[#166FE5] text-white font-bold text-sm py-4 rounded-xl transition-all duration-200 shadow-xl flex items-center justify-center gap-3 transform hover:scale-[1.01]'
                >
                  {connecting ? (
                    <ArrowPathIcon className='h-5 w-5 animate-spin' />
                  ) : (
                    <svg className='w-5 h-5 fill-current' viewBox='0 0 24 24'>
                      <path d='M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z' />
                    </svg>
                  )}
                  <span>Conectar Cuenta con Facebook Login</span>
                </button>

                <div className='flex items-center justify-between text-[10px] font-bold text-text-muted uppercase tracking-widest my-4'>
                  <div className='h-px bg-border-subtle flex-1' />
                  <span className='px-3'>O ingresa los datos de forma manual</span>
                  <div className='h-px bg-border-subtle flex-1' />
                </div>

                {/* Formulario clásico manual colapsado en toggle */}
                <form onSubmit={handleManualConnect} className='space-y-4 text-left'>
                  <div>
                    <label className='block text-[9px] font-bold text-text-secondary uppercase tracking-widest mb-1 px-1'>
                      ID de Cuenta Publicitaria
                    </label>
                    <input
                      type='text'
                      value={adAccountId}
                      onChange={e => setAdAccountId(e.target.value)}
                      placeholder='Ej: act_1029384756'
                      className='w-full bg-surface border border-border-subtle rounded-xl px-4 py-2.5 text-xs text-text-primary focus:outline-none focus:border-purple-500 transition-colors'
                      required
                    />
                  </div>
                  <div>
                    <label className='block text-[9px] font-bold text-text-secondary uppercase tracking-widest mb-1 px-1'>
                      Meta Access Token
                    </label>
                    <input
                      type='password'
                      value={accessToken}
                      onChange={e => setAccessToken(e.target.value)}
                      placeholder='Pega tu token de larga duración de la Graph API...'
                      className='w-full bg-surface border border-border-subtle rounded-xl px-4 py-2.5 text-xs text-text-primary focus:outline-none focus:border-purple-500 transition-colors'
                      required
                    />
                  </div>
                  <button
                    type='submit'
                    className='w-full border border-border-subtle bg-surface hover:bg-surface-soft text-text-primary font-bold text-xs py-2.5 rounded-xl transition-all duration-200'
                  >
                    Guardar Configuración Manual
                  </button>
                </form>
              </motion.div>
            ) : (
              /* PASO B: SELECTOR DE CUENTAS PUBLICITARIAS OAUTH DROPDOWN */
              <motion.div
                key='oauth-select'
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className='space-y-5 max-w-md mx-auto relative z-10 text-left'
              >
                <div className='bg-surface border border-purple-500/20 p-4 rounded-2xl flex items-center gap-3'>
                  <SparklesIcon className='h-5 w-5 text-purple-400 flex-shrink-0' />
                  <p className='text-[10px] text-purple-200'>
                    Tu sesión se ha sincronizado correctamente. Meta ha detectado las siguientes
                    cuentas de anuncios válidas para tu usuario:
                  </p>
                </div>

                <div>
                  <label className='block text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1.5 px-1'>
                    Selecciona una Cuenta Publicitaria:
                  </label>
                  <select
                    value={selectedAccountId}
                    onChange={e => setSelectedAccountId(e.target.value)}
                    className='w-full bg-surface border border-border-subtle rounded-xl px-4 py-3 text-xs text-text-primary font-bold focus:outline-none focus:border-purple-500 transition-colors'
                  >
                    {adAccountsList.map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({acc.id})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className='block text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1.5 px-1'>
                    Selecciona una Página y Cuenta de Instagram (CM):
                  </label>
                  <select
                    value={selectedPageId}
                    onChange={e => setSelectedPageId(e.target.value)}
                    className='w-full bg-surface border border-border-subtle rounded-xl px-4 py-3 text-xs text-text-primary font-bold focus:outline-none focus:border-purple-500 transition-colors'
                  >
                    {pagesList.map(page => (
                      <option key={page.id} value={page.id}>
                        {page.name} {page.instagram ? `(@${page.instagram.username})` : '(Sin Instagram conectado)'}
                      </option>
                    ))}
                  </select>
                </div>

                <div className='pt-2 flex gap-3'>
                  <button
                    type='button'
                    onClick={handleConfirmAccountSelection}
                    disabled={connecting}
                    className='flex-1 bg-text-primary hover:bg-white text-app-sidebar font-bold text-xs py-3.5 rounded-xl transition-all duration-200 shadow-xl flex items-center justify-center gap-2'
                  >
                    {connecting ? (
                      <ArrowPathIcon className='h-4 w-4 animate-spin' />
                    ) : (
                      <LinkIcon className='h-4 w-4' />
                    )}
                    <span>Confirmar Conexión</span>
                  </button>

                  <button
                    type='button'
                    onClick={() => setOauthStep('connect')}
                    className='px-4 border border-border-subtle bg-surface hover:bg-surface-soft text-text-secondary font-bold text-xs py-3.5 rounded-xl transition-all duration-200'
                  >
                    Atrás
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Información Táctica */}
          <div className='mt-8 p-4 bg-surface border border-border-subtle rounded-2xl max-w-lg mx-auto flex items-start gap-3 relative z-10'>
            <InformationCircleIcon className='h-5 w-5 text-purple-400 flex-shrink-0 mt-0.5' />
            <div className='text-[10px] text-text-muted leading-relaxed'>
              <span className='font-bold text-text-secondary'>Conexión Segura vía OAuth:</span> Al
              usar el login de Facebook, Meta devuelve un token a Cadence que se almacena de forma
              encriptada en la base de datos Supabase de tu agencia, restringida mediante estrictas
              directivas de seguridad RLS por cliente.
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // =========================================================================
  // VISTA 2: PANEL DE CONTROL DE ANALÍTICAS DE META ADS
  // =========================================================================
  const totals = insights?.totals || {
    spend: 0,
    impressions: 0,
    clicks: 0,
    ctr: 0,
    cpc: 0,
    conversions: 0,
  };
  const campaigns = insights?.campaigns || [];
  const dailyHistory = insights?.dailyHistory || [];

  // Configurar parámetros de SVG Chart
  const svgWidth = 700;
  const svgHeight = 220;
  const chartPadding = 25;
  const graphWidth = svgWidth - chartPadding * 2;
  const graphHeight = svgHeight - chartPadding * 2;

  // Encontrar valores máximos para escalar gráfico
  const maxSpend = dailyHistory.length ? Math.max(...dailyHistory.map(d => d.spend)) : 100;
  const maxClicks = dailyHistory.length ? Math.max(...dailyHistory.map(d => d.clicks)) : 100;

  // Generar puntos para dibujo SVG
  const generateChartPoints = (key, maxValue) => {
    if (!dailyHistory.length) return '';
    return dailyHistory
      .map((day, idx) => {
        const x = chartPadding + (idx / (dailyHistory.length - 1)) * graphWidth;
        const val = day[key];
        const y = chartPadding + graphHeight - (val / maxValue) * graphHeight;
        return `${x},${y}`;
      })
      .join(' ');
  };

  const spendPoints = generateChartPoints('spend', maxSpend);
  const clicksPoints = generateChartPoints('clicks', maxClicks);

  return (
    <div className='p-6 md:p-8 flex flex-col gap-6 max-w-[1600px] mx-auto w-full'>
      {/* 1. HEADER DEL DASHBOARD */}
      <div className='bg-app-sidebar border border-border-subtle p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden backdrop-blur-xl'>
        <div className='flex items-center gap-4'>
          <div className='p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/25 flex-shrink-0'>
            <InteractiveAvatar variant='meta' size='sm' />
          </div>
          <div>
            <h3 className='text-lg font-black text-text-primary font-title'>
              Cuenta de Meta Conectada
            </h3>
            <div className='flex items-center gap-3 mt-1 text-[11px] text-text-muted'>
              <span className='font-mono bg-surface border border-border-subtle px-2 py-0.5 rounded-md text-text-secondary font-bold'>
                {integration.meta_ad_account_id}
              </span>
              <span>•</span>
              <span className='flex items-center gap-1'>
                <span className='w-1.5 h-1.5 rounded-full bg-emerald-500' />
                Sincronizado {insights?.isMock ? '(Modo Sandbox)' : '(Tiempo Real)'}
              </span>
            </div>
          </div>
        </div>

        <div className='flex items-center gap-3 w-full md:w-auto justify-end'>
          {/* Selector de periodo */}
          <select
            value={dateRange}
            onChange={e => setDateRange(e.target.value)}
            className='bg-surface border border-border-subtle rounded-xl px-3 py-2 text-xs font-bold text-text-secondary focus:outline-none transition-colors'
          >
            <option value='last_7d'>Últimos 7 días</option>
            <option value='last_30d'>Últimos 30 días</option>
            <option value='last_90d'>Últimos 90 días</option>
          </select>

          {/* Botón de Refrescar */}
          <button
            onClick={loadInsights}
            disabled={fetchingData}
            className='p-2 border border-border-subtle bg-surface hover:bg-surface-soft text-text-muted hover:text-text-primary rounded-xl transition-all duration-200'
            title='Sincronizar ahora'
          >
            <ArrowPathIcon className={`h-4 w-4 ${fetchingData ? 'animate-spin' : ''}`} />
          </button>

          {/* Botón Desconectar */}
          <button
            onClick={handleDisconnect}
            className='flex items-center gap-1.5 px-3 py-2 border border-red-500/20 bg-red-500/5 hover:bg-red-500/15 text-red-400 font-bold text-xs rounded-xl transition-all duration-200'
          >
            <TrashIcon className='h-3.5 w-3.5' />
            <span className='hidden sm:inline'>Desconectar</span>
          </button>
        </div>
      </div>

      {/* 2. KPI CARDS GRID */}
      <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4'>
        {[
          {
            label: 'Gasto (Spend)',
            val: `$${totals.spend.toFixed(2)}`,
            desc: 'Inversión total',
            color: '#a855f7',
            bg: 'rgba(168,85,247,0.05)',
            icon: CurrencyDollarIcon,
          },
          {
            label: 'Impresiones',
            val: totals.impressions.toLocaleString(),
            desc: 'Visualizaciones',
            color: '#3b82f6',
            bg: 'rgba(59,130,246,0.05)',
            icon: EyeIcon,
          },
          {
            label: 'Clics',
            val: totals.clicks.toLocaleString(),
            desc: 'Acciones de tráfico',
            color: '#06b6d4',
            bg: 'rgba(6,182,212,0.05)',
            icon: CursorArrowRaysIcon,
          },
          {
            label: 'CTR Promedio',
            val: `${totals.ctr}%`,
            desc: 'Tasa de clics/impresiones',
            color: '#10b981',
            bg: 'rgba(16,185,129,0.05)',
            icon: PercentBadgeIcon,
          },
          {
            label: 'CPC Medio',
            val: `$${totals.cpc.toFixed(2)}`,
            desc: 'Costo por clic',
            color: '#f59e0b',
            bg: 'rgba(245,158,11,0.05)',
            icon: CurrencyDollarIcon,
          },
          {
            label: 'Conversiones',
            val: totals.conversions.toString(),
            desc: 'Acciones clave',
            color: '#ec4899',
            bg: 'rgba(236,72,153,0.05)',
            icon: SparklesIcon,
          },
        ].map((card, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.05 }}
            whileHover={{ y: -3 }}
            className='bg-app-sidebar border border-border-subtle rounded-2xl p-4 flex flex-col relative overflow-hidden transition-all duration-300'
            style={{ borderLeft: `3.5px solid ${card.color}` }}
          >
            {/* Visual background glow */}
            <div
              className='absolute right-0 top-0 w-16 h-16 rounded-full pointer-events-none blur-2xl'
              style={{ backgroundColor: card.color, opacity: 0.15 }}
            />

            <div className='flex items-center justify-between gap-2 mb-2'>
              <span className='text-[10px] font-bold text-text-secondary uppercase tracking-widest'>
                {card.label}
              </span>
              <card.icon className='h-4 w-4 text-text-muted' style={{ color: card.color }} />
            </div>
            <div className='text-xl font-black text-text-primary font-title mb-1'>{card.val}</div>
            <span className='text-[9px] text-text-muted font-semibold'>{card.desc}</span>
          </motion.div>
        ))}
      </div>

      {/* 3. CHART & ANALYTICS GRAPHS */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Gráfico Histórico en SVG (Aislado de librerías pesadas) */}
        <div className='lg:col-span-2 bg-app-sidebar border border-border-subtle p-5 rounded-2xl backdrop-blur-xl relative flex flex-col'>
          <div className='flex justify-between items-center mb-4'>
            <h4 className='text-xs font-bold text-text-secondary uppercase tracking-widest flex items-center gap-1.5'>
              <ChartBarIcon className='h-4 w-4 text-purple-400' />
              <span>Rendimiento Histórico Diario</span>
            </h4>
            <div className='flex gap-4 text-[9px] font-bold uppercase tracking-wider'>
              <span className='flex items-center gap-1'>
                <span className='w-2.5 h-2.5 rounded-full bg-purple-500' /> Gasto (USD)
              </span>
              <span className='flex items-center gap-1'>
                <span className='w-2.5 h-2.5 rounded-full bg-cyan-400' /> Clics
              </span>
            </div>
          </div>

          <div className='flex-1 w-full relative min-h-[220px]'>
            {dailyHistory.length > 0 ? (
              <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className='w-full h-full overflow-visible'
              >
                {/* Defs para Gradients de Relleno */}
                <defs>
                  <linearGradient id='spendGrad' x1='0' y1='0' x2='0' y2='1'>
                    <stop offset='5%' stopColor='#a855f7' stopOpacity='0.25' />
                    <stop offset='95%' stopColor='#a855f7' stopOpacity='0.0' />
                  </linearGradient>
                  <linearGradient id='clicksGrad' x1='0' y1='0' x2='0' y2='1'>
                    <stop offset='5%' stopColor='#22d3ee' stopOpacity='0.2' />
                    <stop offset='95%' stopColor='#22d3ee' stopOpacity='0.0' />
                  </linearGradient>
                </defs>

                {/* Líneas horizontales de guía */}
                {[0, 0.25, 0.5, 0.75, 1].map((r, i) => (
                  <line
                    key={i}
                    x1={chartPadding}
                    y1={chartPadding + graphHeight * r}
                    x2={chartPadding + graphWidth}
                    y2={chartPadding + graphHeight * r}
                    stroke='rgba(255,255,255,0.04)'
                    strokeWidth='1'
                  />
                ))}

                {/* Relleno e Histórico de Inversión (Gasto) */}
                <path
                  d={`M${chartPadding},${chartPadding + graphHeight} L${spendPoints} L${chartPadding + graphWidth},${chartPadding + graphHeight} Z`}
                  fill='url(#spendGrad)'
                />
                <motion.polyline
                  fill='none'
                  stroke='#a855f7'
                  strokeWidth='2.5'
                  points={spendPoints}
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1 }}
                />

                {/* Relleno e Histórico de Clics */}
                <path
                  d={`M${chartPadding},${chartPadding + graphHeight} L${clicksPoints} L${chartPadding + graphWidth},${chartPadding + graphHeight} Z`}
                  fill='url(#clicksGrad)'
                />
                <motion.polyline
                  fill='none'
                  stroke='#22d3ee'
                  strokeWidth='2'
                  strokeDasharray='4 2'
                  points={clicksPoints}
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.2 }}
                />

                {/* Círculos interactivos de Datos */}
                {dailyHistory.map((day, idx) => {
                  const x = chartPadding + (idx / (dailyHistory.length - 1)) * graphWidth;
                  const ySpend = chartPadding + graphHeight - (day.spend / maxSpend) * graphHeight;

                  return (
                    <g key={idx}>
                      <circle
                        cx={x}
                        cy={ySpend}
                        r='6'
                        fill='transparent'
                        className='cursor-pointer'
                        onMouseEnter={() => setActiveDataIndex(idx)}
                        onMouseLeave={() => setActiveDataIndex(null)}
                      />
                      {activeDataIndex === idx && (
                        <circle
                          cx={x}
                          cy={ySpend}
                          r='4.5'
                          fill='#ffffff'
                          stroke='#a855f7'
                          strokeWidth='2'
                        />
                      )}
                    </g>
                  );
                })}
              </svg>
            ) : (
              <div className='absolute inset-0 flex items-center justify-center text-[10px] text-text-muted'>
                No hay datos históricos para graficar en este periodo.
              </div>
            )}

            {/* Custom Tooltip Flotante */}
            <AnimatePresence>
              {activeDataIndex !== null && dailyHistory[activeDataIndex] && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className='absolute z-20 bg-surface-soft border border-border-subtle p-3 rounded-xl shadow-2xl text-[10px] space-y-1'
                  style={{
                    left: `${(activeDataIndex / (dailyHistory.length - 1)) * 90}%`,
                    top: '10%',
                  }}
                >
                  <div className='font-bold text-text-primary border-b border-border-subtle pb-1 mb-1 font-mono'>
                    {dailyHistory[activeDataIndex].date}
                  </div>
                  <div className='flex justify-between gap-6 text-purple-300 font-bold'>
                    <span>Inversión:</span>
                    <span>${dailyHistory[activeDataIndex].spend.toFixed(2)}</span>
                  </div>
                  <div className='flex justify-between gap-6 text-cyan-300 font-bold'>
                    <span>Clics:</span>
                    <span>{dailyHistory[activeDataIndex].clicks}</span>
                  </div>
                  <div className='flex justify-between gap-6 text-text-muted'>
                    <span>Impresiones:</span>
                    <span>{dailyHistory[activeDataIndex].impressions.toLocaleString()}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Distribución de Objetivos / Resumen */}
        <div className='bg-app-sidebar border border-border-subtle p-5 rounded-2xl backdrop-blur-xl flex flex-col justify-between'>
          <div>
            <h4 className='text-xs font-bold text-text-secondary uppercase tracking-widest mb-4'>
              Distribución de Objetivos
            </h4>
            <div className='space-y-4'>
              {[
                { label: 'Leads (Leads Gen)', key: 'OUTCOME_LEADS', color: 'bg-purple-500' },
                { label: 'Ventas (Sales)', key: 'OUTCOME_SALES', color: 'bg-pink-500' },
                { label: 'Tráfico (Traffic)', key: 'OUTCOME_TRAFFIC', color: 'bg-cyan-500' },
                { label: 'Alcance (Awareness)', key: 'OUTCOME_AWARENESS', color: 'bg-slate-600' },
              ].map((obj, i) => {
                const totalObjectiveSpend = campaigns
                  .filter(c => c.objective === obj.key)
                  .reduce((acc, c) => acc + c.spend, 0);
                const pct = totals.spend > 0 ? (totalObjectiveSpend / totals.spend) * 100 : 0;

                return (
                  <div key={i} className='space-y-1.5'>
                    <div className='flex justify-between text-[10px] font-bold'>
                      <span className='text-text-secondary'>{obj.label}</span>
                      <span className='text-text-primary'>
                        ${totalObjectiveSpend.toFixed(2)} ({pct.toFixed(0)}%)
                      </span>
                    </div>
                    <div className='w-full h-1.5 bg-surface border border-border-subtle rounded-full overflow-hidden'>
                      <motion.div
                        className={`h-full ${obj.color}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, delay: i * 0.1 }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className='mt-4 pt-4 border-t border-border-subtle text-[9px] text-text-muted leading-relaxed flex gap-2'>
            <InformationCircleIcon className='h-4.5 w-4.5 text-purple-400 flex-shrink-0' />
            <span>
              Esta distribución representa cómo el cliente distribuye su presupuesto entre capturar
              clientes, cerrar compras en catálogo, conseguir visitas, o lograr impacto visual.
            </span>
          </div>
        </div>
      </div>

      {/* 4. CAMPAIGNS LIST TABLE */}
      <div className='bg-app-sidebar border border-border-subtle rounded-2xl overflow-hidden backdrop-blur-xl'>
        <div className='p-5 border-b border-border-subtle flex justify-between items-center'>
          <h4 className='text-xs font-bold text-text-secondary uppercase tracking-widest'>
            Detalle de Campañas publicitarias
          </h4>
          <span className='text-[10px] bg-purple-500/10 text-purple-300 border border-purple-500/20 px-2.5 py-0.5 rounded-full font-bold'>
            {campaigns.length} Campañas
          </span>
        </div>

        <div className='overflow-x-auto w-full'>
          {campaigns.length > 0 ? (
            <table className='w-full text-left text-xs'>
              <thead className='bg-surface text-[10px] font-bold uppercase tracking-wider text-text-secondary border-b border-border-subtle'>
                <tr>
                  <th className='py-3 px-5'>Nombre de Campaña</th>
                  <th className='py-3 px-5'>Estado</th>
                  <th className='py-3 px-5'>Objetivo</th>
                  <th className='py-3 px-5 text-right'>Inversión</th>
                  <th className='py-3 px-5 text-right'>Clics</th>
                  <th className='py-3 px-5 text-right'>Impresiones</th>
                  <th className='py-3 px-5 text-right'>CTR</th>
                  <th className='py-3 px-5 text-right'>CPC</th>
                  <th className='py-3 px-5 text-right'>Conversiones</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-border-subtle'>
                {campaigns.map((camp, idx) => (
                  <tr
                    key={idx}
                    className='hover:bg-surface-soft transition-colors text-text-secondary hover:text-text-primary'
                  >
                    <td className='py-3.5 px-5 font-bold'>{camp.name}</td>
                    <td className='py-3.5 px-5'>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                          camp.status === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                        }`}
                      >
                        {camp.status}
                      </span>
                    </td>
                    <td className='py-3.5 px-5 font-mono text-[10px] text-text-muted'>
                      {camp.objective}
                    </td>
                    <td className='py-3.5 px-5 text-right font-bold text-text-primary'>
                      ${camp.spend.toFixed(2)}
                    </td>
                    <td className='py-3.5 px-5 text-right'>{camp.clicks.toLocaleString()}</td>
                    <td className='py-3.5 px-5 text-right text-text-muted'>
                      {camp.impressions.toLocaleString()}
                    </td>
                    <td className='py-3.5 px-5 text-right font-semibold text-emerald-400'>
                      {camp.ctr}%
                    </td>
                    <td className='py-3.5 px-5 text-right text-text-muted'>
                      ${camp.cpc.toFixed(2)}
                    </td>
                    <td className='py-3.5 px-5 text-right font-bold text-purple-400'>
                      {camp.conversions}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className='p-10 text-center text-text-muted'>
              No se encontraron campañas publicitarias registradas en esta cuenta.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
