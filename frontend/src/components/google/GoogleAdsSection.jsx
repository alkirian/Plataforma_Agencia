// src/components/google/GoogleAdsSection.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '../../api/apiFetch';
import { InteractiveAvatar } from '../ui/InteractiveAvatar';
import { toast } from 'react-hot-toast';
import { cmCache } from '../cm/cmCache';
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

export const GoogleAdsSection = ({ clientId, isEmbedded = false }) => {
  const [dateRange, setDateRange] = useState('last_30d');

  const cachedIntegration = cmCache.get(clientId).googleIntegrationState;
  const cachedInsights = cmCache.getGoogleInsights(clientId, dateRange);

  const [loading, setLoading] = useState(!cachedIntegration);
  const [fetchingData, setFetchingData] = useState(!cachedInsights && !!cachedIntegration);
  const [integration, setIntegration] = useState(cachedIntegration || null);
  const [insights, setInsights] = useState(cachedInsights || null);

  // Form states
  const [googleCustomerId, setGoogleCustomerId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [refreshToken, setRefreshToken] = useState('');

  // OAuth states
  const [connecting, setConnecting] = useState(false);
  const [oauthStep, setOauthStep] = useState('connect'); // 'connect' | 'select_account'
  const [customerAccountsList, setCustomerAccountsList] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [tempAccessToken, setTempAccessToken] = useState('');
  const [tempRefreshToken, setTempRefreshToken] = useState('');

  // Tooltip graph state
  const [activeDataIndex, setActiveDataIndex] = useState(null);

  // 1. Cargar estado de la integración
  const loadIntegration = async () => {
    const cached = cmCache.get(clientId).googleIntegrationState;
    if (cached) {
      setIntegration(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }

    try {
      const res = await apiFetch(`/clients/${clientId}/google-integration`);
      setIntegration(res.data);
      if (res.data) {
        await loadInsights();
      }
    } catch (err) {
      console.error(err);
      toast.error('No se pudo verificar el estado de integración de Google.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Cargar analíticas de Google Ads
  const loadInsights = async () => {
    const cached = cmCache.getGoogleInsights(clientId, dateRange);
    if (cached) {
      setInsights(cached);
      setFetchingData(false);
    } else {
      setFetchingData(true);
    }

    try {
      const res = await apiFetch(
        `/clients/${clientId}/google-integration/campaigns?dateRange=${dateRange}`
      );
      setInsights(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Error al descargar analíticas de Google Ads.');
    } finally {
      setFetchingData(false);
    }
  };

  useEffect(() => {
    loadIntegration();
  }, [clientId, dateRange]);

  // Sincronizar integración con la caché
  useEffect(() => {
    if (!loading) {
      cmCache.setGoogleIntegrationState(clientId, integration);
    }
  }, [integration, clientId, loading]);

  // Sincronizar insights con la caché
  useEffect(() => {
    if (insights) {
      cmCache.setGoogleInsights(clientId, dateRange, insights);
    }
  }, [insights, clientId, dateRange]);

  // 3. Flujo OAuth de Google
  const handleGoogleOAuth = async () => {
    try {
      setConnecting(true);
      
      const configRes = await apiFetch(`/clients/${clientId}/google-integration/config`);
      const googleClientId = configRes.data?.appId;

      if (googleClientId && googleClientId !== 'demo_google_client_id') {
        const redirectUri = window.location.origin + '/google-callback.html';
        const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${googleClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent('https://www.googleapis.com/auth/adwords')}&access_type=offline&prompt=consent`;

        toast.loading('Esperando autorización en el popup de Google...', { id: 'google-oauth-toast' });

        const popup = window.open(oauthUrl, 'google-login', 'width=650,height=600,scrollbars=yes');
        if (!popup) {
          toast.error('El popup fue bloqueado. Habilita las ventanas emergentes.', { id: 'google-oauth-toast' });
          setConnecting(false);
          return;
        }

        const handleMessage = async (event) => {
          if (event.origin !== window.location.origin) return;

          if (event.data?.type === 'GOOGLE_OAUTH_SUCCESS') {
            window.removeEventListener('message', handleMessage);
            const authCode = event.data.code;

            try {
              toast.loading('Sincronizando con Google y recuperando cuentas...', { id: 'google-oauth-toast' });
              
              const exchangeRes = await apiFetch(`/clients/${clientId}/google-integration/exchange-token`, {
                method: 'POST',
                body: JSON.stringify({ code: authCode, redirectUri })
              });

              toast.success('¡Sesión vinculada con Google Ads exitosamente!', { id: 'google-oauth-toast' });
              
              setTempAccessToken(exchangeRes.data.accessToken);
              setTempRefreshToken(exchangeRes.data.refreshToken);
              setCustomerAccountsList(exchangeRes.data.customerAccounts || []);

              if (exchangeRes.data.customerAccounts?.length > 0) {
                setSelectedCustomerId(exchangeRes.data.customerAccounts[0].id);
              }
              setOauthStep('select_account');
            } catch (err) {
              toast.error(err.message || 'Error al procesar la vinculación.', { id: 'google-oauth-toast' });
            } finally {
              setConnecting(false);
            }
          } else if (event.data?.type === 'GOOGLE_OAUTH_ERROR') {
            window.removeEventListener('message', handleMessage);
            toast.error(event.data.error || 'Error al iniciar sesión en Google.', { id: 'google-oauth-toast' });
            setConnecting(false);
          }
        };

        window.addEventListener('message', handleMessage);
      } else {
        // MODO DEMO / SIMULADO
        toast.loading('Iniciando conexión simulada en Sandbox de Google Ads...', { id: 'google-oauth-toast' });
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const exchangeRes = await apiFetch(`/clients/${clientId}/google-integration/exchange-token`, {
          method: 'POST',
          body: JSON.stringify({ code: 'mock_google_code_123', redirectUri: '' })
        });
        
        toast.success('¡Sesión simulada por Google Sandbox!', { id: 'google-oauth-toast' });
        setTempAccessToken(exchangeRes.data.accessToken);
        setTempRefreshToken(exchangeRes.data.refreshToken);
        setCustomerAccountsList(exchangeRes.data.customerAccounts || []);
        
        if (exchangeRes.data.customerAccounts?.length > 0) {
          setSelectedCustomerId(exchangeRes.data.customerAccounts[0].id);
        }
        setOauthStep('select_account');
        setConnecting(false);
      }
    } catch (err) {
      toast.error(err.message || 'Error en Google OAuth.', { id: 'google-oauth-toast' });
      setConnecting(false);
    }
  };

  // 4. Confirmar cuenta de Google seleccionada
  const handleConfirmAccountSelection = async () => {
    if (!selectedCustomerId) {
      toast.error('Por favor, selecciona una cuenta de Google Ads.');
      return;
    }

    const selectedAcc = customerAccountsList.find(c => c.id === selectedCustomerId);

    try {
      setConnecting(true);
      const res = await apiFetch(`/clients/${clientId}/google-integration`, {
        method: 'POST',
        body: JSON.stringify({
          google_customer_id: selectedCustomerId,
          google_account_name: selectedAcc?.name || 'Cuenta Google Ads',
          access_token: tempAccessToken,
          refresh_token: tempRefreshToken,
        }),
      });
      toast.success('¡Integración de Google Ads configurada con éxito!');
      setIntegration(res.data);
      setOauthStep('connect');
      await loadInsights();
    } catch (err) {
      toast.error(err.message || 'Error al guardar la selección de la cuenta.');
    } finally {
      setConnecting(false);
    }
  };

  // 5. Conexión clásica manual (Fallback)
  const handleManualConnect = async e => {
    if (e) e.preventDefault();
    if (!googleCustomerId.trim() || !accessToken.trim() || !refreshToken.trim()) {
      toast.error('El Customer ID, Access Token y Refresh Token son obligatorios.');
      return;
    }

    try {
      setConnecting(true);
      const res = await apiFetch(`/clients/${clientId}/google-integration`, {
        method: 'POST',
        body: JSON.stringify({
          google_customer_id: googleCustomerId.trim(),
          google_account_name: 'Cuenta Google Manual',
          access_token: accessToken.trim(),
          refresh_token: refreshToken.trim(),
        }),
      });
      toast.success('Cuenta de Google Ads conectada manualmente.');
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
        '¿Estás seguro de que deseas desconectar esta cuenta de Google Ads? Se purgarán los accesos locales.'
      )
    ) {
      return;
    }

    try {
      setFetchingData(true);
      await apiFetch(`/clients/${clientId}/google-integration`, { method: 'DELETE' });
      toast.success('Cuenta de Google Ads desconectada.');
      setIntegration(null);
      setInsights(null);
      setGoogleCustomerId('');
      setAccessToken('');
      setRefreshToken('');
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
        <ArrowPathIcon className='h-8 w-8 animate-spin text-blue-500 mb-3' />
        <p className='text-xs font-bold tracking-widest uppercase'>
          Cargando integración de Google Ads...
        </p>
      </div>
    );
  }

  // =========================================================================
  // VISTA 1: FORMULARIO DE CONEXIÓN O SELECTOR OAUTH (SI NO ESTÁ INTEGRADO)
  // =========================================================================
  if (!integration) {
    return (
      <div className={isEmbedded ? 'w-full max-w-4xl mx-auto flex flex-col items-center justify-center py-4' : 'p-6 md:p-8 max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[80vh]'}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className='w-full bg-app-sidebar border border-border-subtle rounded-3xl p-6 md:p-10 shadow-2xl relative overflow-hidden backdrop-blur-xl'
        >
          {/* Ecosistema Holográfico de fondo */}
          <div className='absolute -right-20 -top-20 w-80 h-80 rounded-full bg-blue-600/10 blur-3xl pointer-events-none' />
          <div className='absolute -left-20 -bottom-20 w-80 h-80 rounded-full bg-cyan-600/10 blur-3xl pointer-events-none' />

          <div className='flex flex-col items-center text-center mb-8 relative z-10'>
            {/* Animación del robot Google Ads */}
            <InteractiveAvatar variant='meta' size='xl' className='mb-4' />
            <h3 className='text-2xl font-black text-text-primary font-title'>
              Estratega de Google Ads
            </h3>
            <p className='text-xs text-text-muted max-w-lg mt-2'>
              Vincula la cuenta publicitaria de Google Ads de este cliente usando el flujo
              de Google OAuth o configurándola manualmente.
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
                {/* Botón Principal OAuth Premium de Google */}
                <button
                  type='button'
                  onClick={handleGoogleOAuth}
                  disabled={connecting}
                  className='w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm py-4 rounded-xl transition-all duration-200 shadow-xl flex items-center justify-center gap-3 transform hover:scale-[1.01] cursor-pointer'
                >
                  {connecting ? (
                    <ArrowPathIcon className='h-5 w-5 animate-spin' />
                  ) : (
                    <svg className='w-5 h-5 fill-current' viewBox='0 0 24 24'>
                      <path d='M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.41 0-6.19-2.772-6.19-6.184 0-3.41 2.78-6.183 6.19-6.183 1.572 0 3.011.59 4.12 1.564l3.056-3.056C19.167 1.83 16.037.93 12.24.93c-6.136 0-11.11 4.974-11.11 11.109 0 6.136 4.974 11.11 11.11 11.11 5.926 0 10.428-4.172 10.428-10.609 0-.649-.079-1.272-.189-1.854h-10.24z' />
                    </svg>
                  )}
                  <span>Conectar Cuenta con Google Ads Login</span>
                </button>

                <div className='flex items-center justify-between text-[10px] font-bold text-text-muted uppercase tracking-widest my-4'>
                  <div className='h-px bg-border-subtle flex-1' />
                  <span className='px-3'>O ingresa los datos de forma manual</span>
                  <div className='h-px bg-border-subtle flex-1' />
                </div>

                {/* Formulario clásico manual */}
                <form onSubmit={handleManualConnect} className='space-y-4 text-left'>
                  <div>
                    <label className='block text-[9px] font-bold text-text-secondary uppercase tracking-widest mb-1 px-1'>
                      ID de Cuenta Google (Customer ID)
                    </label>
                    <input
                      type='text'
                      value={googleCustomerId}
                      onChange={e => setGoogleCustomerId(e.target.value)}
                      placeholder='Ej: 123-456-7890'
                      className='w-full bg-surface border border-border-subtle rounded-xl px-4 py-2.5 text-xs text-text-primary focus:outline-none focus:border-blue-500 transition-colors'
                      required
                    />
                  </div>
                  <div>
                    <label className='block text-[9px] font-bold text-text-secondary uppercase tracking-widest mb-1 px-1'>
                      Google Access Token
                    </label>
                    <input
                      type='password'
                      value={accessToken}
                      onChange={e => setAccessToken(e.target.value)}
                      placeholder='Token de acceso temporal...'
                      className='w-full bg-surface border border-border-subtle rounded-xl px-4 py-2.5 text-xs text-text-primary focus:outline-none focus:border-blue-500 transition-colors'
                      required
                    />
                  </div>
                  <div>
                    <label className='block text-[9px] font-bold text-text-secondary uppercase tracking-widest mb-1 px-1'>
                      Google Refresh Token
                    </label>
                    <input
                      type='password'
                      value={refreshToken}
                      onChange={e => setRefreshToken(e.target.value)}
                      placeholder='Pega tu token de refresco offline...'
                      className='w-full bg-surface border border-border-subtle rounded-xl px-4 py-2.5 text-xs text-text-primary focus:outline-none focus:border-blue-500 transition-colors'
                      required
                    />
                  </div>
                  <button
                    type='submit'
                    className='w-full border border-border-subtle bg-surface hover:bg-surface-soft text-text-primary font-bold text-xs py-2.5 rounded-xl transition-all duration-200 cursor-pointer'
                  >
                    Guardar Configuración Manual
                  </button>
                </form>
              </motion.div>
            ) : (
              /* PASO B: SELECTOR DE CUENTAS PUBLICITARIAS DROPDOWN */
              <motion.div
                key='oauth-select'
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className='space-y-5 max-w-md mx-auto relative z-10 text-left'
              >
                <div className='bg-surface border border-blue-500/20 p-4 rounded-2xl flex items-center gap-3'>
                  <SparklesIcon className='h-5 w-5 text-blue-400 flex-shrink-0' />
                  <p className='text-[10px] text-blue-200'>
                    Tu cuenta de Google se ha sincronizado correctamente. Elige la cuenta publicitaria de Google Ads para monitorear y optimizar:
                  </p>
                </div>

                <div>
                  <label className='block text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1.5 px-1'>
                    Selecciona una Cuenta Publicitaria (Google Ads):
                  </label>
                  <select
                    value={selectedCustomerId}
                    onChange={e => setSelectedCustomerId(e.target.value)}
                    className='w-full bg-surface border border-border-subtle rounded-xl px-4 py-3 text-xs text-text-primary font-bold focus:outline-none focus:border-blue-500 transition-colors cursor-pointer'
                  >
                    {customerAccountsList.map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({acc.id})
                      </option>
                    ))}
                  </select>
                </div>

                <div className='pt-2 flex gap-3'>
                  <button
                    type='button'
                    onClick={handleConfirmAccountSelection}
                    disabled={connecting}
                    className='flex-1 bg-text-primary hover:bg-white text-app-sidebar font-bold text-xs py-3.5 rounded-xl transition-all duration-200 shadow-xl flex items-center justify-center gap-2 cursor-pointer'
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
                    className='px-4 border border-border-subtle bg-surface hover:bg-surface-soft text-text-secondary font-bold text-xs py-3.5 rounded-xl transition-all duration-200 cursor-pointer'
                  >
                    Atrás
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Información Táctica */}
          <div className='mt-8 p-4 bg-surface border border-border-subtle rounded-2xl max-w-lg mx-auto flex items-start gap-3 relative z-10'>
            <InformationCircleIcon className='h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5' />
            <div className='text-[10px] text-text-muted leading-relaxed'>
              <span className='font-bold text-text-secondary'>Conexión Segura vía OAuth:</span> Al
              usar el login de Google, obtendremos credenciales encriptadas para leer y auditar tus campañas de Google Ads 24/7 de forma segura mediante políticas RLS en Supabase.
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // =========================================================================
  // VISTA 2: PANEL DE CONTROL DE ANALÍTICAS DE GOOGLE ADS
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

  // Generar trazados de curvas suavizadas Bézier para dibujo SVG
  const getCurvePath = (key, maxValue) => {
    if (!dailyHistory.length) return '';
    const points = dailyHistory.map((day, idx) => {
      const x = chartPadding + (idx / (dailyHistory.length - 1)) * graphWidth;
      const val = day[key];
      const y = chartPadding + graphHeight - (val / maxValue) * graphHeight;
      return { x, y };
    });

    if (points.length === 0) return '';
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const curr = points[i];
      const next = points[i + 1];
      const cpX1 = curr.x + (next.x - curr.x) / 3;
      const cpY1 = curr.y;
      const cpX2 = curr.x + 2 * (next.x - curr.x) / 3;
      const cpY2 = next.y;
      d += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${next.x} ${next.y}`;
    }
    return d;
  };

  const getAreaPath = (key, maxValue) => {
    const curve = getCurvePath(key, maxValue);
    if (!curve) return '';
    return `${curve} L ${chartPadding + graphWidth} ${chartPadding + graphHeight} L ${chartPadding} ${chartPadding + graphHeight} Z`;
  };

  const spendCurvePath = getCurvePath('spend', maxSpend);
  const spendAreaPath = getAreaPath('spend', maxSpend);
  const clicksCurvePath = getCurvePath('clicks', maxClicks);
  const clicksAreaPath = getAreaPath('clicks', maxClicks);

  return (
    <div className={isEmbedded ? 'flex flex-col gap-6 w-full' : 'p-6 md:p-8 flex flex-col gap-6 max-w-[1600px] mx-auto w-full'}>
      {/* 1. HEADER DEL DASHBOARD */}
      {isEmbedded ? (
        <div className='bg-surface border border-border-subtle p-3.5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 relative overflow-hidden backdrop-blur-xl'>
          <div className='flex items-center gap-2'>
            <span className='h-2 w-2 rounded-full bg-blue-500 animate-pulse' />
            <span className='text-[10px] font-bold text-text-muted uppercase tracking-wider font-mono'>
              Google Ads - Cuenta de Cliente: {integration.google_customer_id}
            </span>
          </div>
          <div className='flex items-center gap-2 w-full sm:w-auto justify-end'>
            {/* Selector de periodo */}
            <select
              value={dateRange}
              onChange={e => setDateRange(e.target.value)}
              className='bg-surface border border-border-subtle rounded-xl px-3 py-1.5 text-xs font-bold text-text-secondary focus:outline-none transition-colors cursor-pointer'
            >
              <option value='last_7d'>Últimos 7 días</option>
              <option value='last_30d'>Últimos 30 días</option>
              <option value='last_90d'>Últimos 90 días</option>
            </select>

            {/* Botón de Refrescar */}
            <button
              onClick={loadInsights}
              disabled={fetchingData}
              className='p-2 border border-border-subtle bg-surface hover:bg-surface-soft text-text-muted hover:text-text-primary rounded-xl transition-all duration-200 cursor-pointer'
              title='Sincronizar ahora'
            >
              <ArrowPathIcon className={`h-4 w-4 ${fetchingData ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      ) : (
        <div className='bg-app-sidebar border border-border-subtle p-3 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-3.5 relative overflow-hidden backdrop-blur-xl'>
          <div className='flex items-center gap-3'>
            <div className='p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/25 flex-shrink-0'>
              <InteractiveAvatar variant='meta' size='sm' />
            </div>
            <div>
              <h3 className='text-sm font-extrabold text-text-primary font-title'>
                Cuenta Google Ads: {integration.google_account_name} ({integration.google_customer_id})
              </h3>
            </div>
          </div>

          <div className='flex items-center gap-3 w-full md:w-auto justify-end'>
            {/* Selector de periodo */}
            <select
              value={dateRange}
              onChange={e => setDateRange(e.target.value)}
              className='bg-surface border border-border-subtle rounded-xl px-3 py-2 text-xs font-bold text-text-secondary focus:outline-none transition-colors cursor-pointer'
            >
              <option value='last_7d'>Últimos 7 días</option>
              <option value='last_30d'>Últimos 30 días</option>
              <option value='last_90d'>Últimos 90 días</option>
            </select>

            {/* Botón de Refrescar */}
            <button
              onClick={loadInsights}
              disabled={fetchingData}
              className='p-2 border border-border-subtle bg-surface hover:bg-surface-soft text-text-muted hover:text-text-primary rounded-xl transition-all duration-200 cursor-pointer'
              title='Sincronizar ahora'
            >
              <ArrowPathIcon className={`h-4 w-4 ${fetchingData ? 'animate-spin' : ''}`} />
            </button>

            {/* Botón Desconectar */}
            <button
              onClick={handleDisconnect}
              className='flex items-center gap-1.5 px-3 py-2 border border-red-500/20 bg-red-500/5 hover:bg-red-500/15 text-red-400 font-bold text-xs rounded-xl transition-all duration-200 cursor-pointer'
            >
              <TrashIcon className='h-3.5 w-3.5' />
              <span className='hidden sm:inline'>Desconectar</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. KPI CARDS GRID */}
      <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4'>
        {[
          {
            label: 'Inversión (Spend)',
            val: `$${totals.spend.toFixed(2)}`,
            desc: 'Costo total en Google',
            color: '#3b82f6',
            bg: 'rgba(59,130,246,0.05)',
            icon: CurrencyDollarIcon,
            historyKey: 'spend',
          },
          {
            label: 'Impresiones',
            val: totals.impressions.toLocaleString(),
            desc: 'Búsquedas y display',
            color: '#22d3ee',
            bg: 'rgba(34,211,238,0.05)',
            icon: EyeIcon,
            historyKey: 'impressions',
          },
          {
            label: 'Clics',
            val: totals.clicks.toLocaleString(),
            desc: 'Entradas a la web',
            color: '#f59e0b',
            bg: 'rgba(245,158,11,0.05)',
            icon: CursorArrowRaysIcon,
            historyKey: 'clicks',
          },
          {
            label: 'CTR Promedio',
            val: `${totals.ctr}%`,
            desc: 'Porcentaje de clics',
            color: '#10b981',
            bg: 'rgba(16,185,129,0.05)',
            icon: PercentBadgeIcon,
            historyKey: 'ctr',
          },
          {
            label: 'CPC Medio',
            val: `$${totals.cpc.toFixed(2)}`,
            desc: 'Costo por cada clic',
            color: '#6366f1',
            bg: 'rgba(99,102,241,0.05)',
            icon: CurrencyDollarIcon,
            historyKey: 'cpc',
          },
          {
            label: 'Conversiones',
            val: totals.conversions.toString(),
            desc: 'Leads y ventas Google',
            color: '#ec4899',
            bg: 'rgba(236,72,153,0.05)',
            icon: SparklesIcon,
            historyKey: 'clicks',
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
            <div
              className='absolute right-0 top-0 w-16 h-16 rounded-full pointer-events-none blur-2xl'
              style={{ backgroundColor: card.color, opacity: 0.12 }}
            />

            <div className='flex items-center justify-between gap-2 mb-2'>
              <span className='text-[10px] font-bold text-text-secondary uppercase tracking-widest'>
                {card.label}
              </span>
              <card.icon className='h-4 w-4 text-text-muted' style={{ color: card.color }} />
            </div>
            <div className='text-xl font-black text-text-primary font-title mb-1'>{card.val}</div>
            <span className='text-[9px] text-text-muted font-semibold'>{card.desc}</span>

            {/* Sparkline mini-grafico SVG */}
            {dailyHistory && dailyHistory.length > 0 && card.historyKey && card.label !== 'CPC Medio' && (
              <div className='h-6 w-full mt-3 opacity-65'>
                <svg className='w-full h-full overflow-visible'>
                  <path
                     d={(() => {
                       const maxVal = Math.max(...dailyHistory.map(d => d[card.historyKey])) || 1;
                       const points = dailyHistory.map((day, dIdx) => {
                         const x = (dIdx / (dailyHistory.length - 1)) * 100 + "%";
                         const y = 90 - (day[card.historyKey] / maxVal) * 70 + "%";
                         return `${dIdx === 0 ? 'M' : 'L'} ${x} ${y}`;
                       });
                       return points.join(' ');
                     })()}
                    fill='none'
                    stroke={card.color}
                    strokeWidth='1.5'
                    strokeLinecap='round'
                  />
                </svg>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* 3. CHART & ANALYTICS GRAPHS */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Gráfico Histórico en SVG */}
        <div className='lg:col-span-2 bg-app-sidebar border border-border-subtle p-5 rounded-2xl backdrop-blur-xl relative flex flex-col'>
          <div className='flex justify-between items-center mb-4'>
            <h4 className='text-xs font-bold text-text-secondary uppercase tracking-widest flex items-center gap-1.5'>
              <ChartBarIcon className='h-4 w-4 text-blue-400' />
              <span>Rendimiento Histórico Diario</span>
            </h4>
            <div className='flex gap-4 text-[9px] font-bold uppercase tracking-wider'>
              <span className='flex items-center gap-1'>
                <span className='w-2.5 h-2.5 rounded-full bg-blue-500' /> Gasto (USD)
              </span>
              <span className='flex items-center gap-1'>
                <span className='w-2.5 h-2.5 rounded-full bg-yellow-500' /> Clics
              </span>
            </div>
          </div>

          <div className='flex-1 w-full relative min-h-[220px]'>
            {dailyHistory.length > 0 ? (
              <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className='w-full h-full overflow-visible'
              >
                <defs>
                  <linearGradient id='spendGradGoogle' x1='0' y1='0' x2='0' y2='1'>
                    <stop offset='5%' stopColor='#3b82f6' stopOpacity='0.25' />
                    <stop offset='95%' stopColor='#3b82f6' stopOpacity='0.0' />
                  </linearGradient>
                  <linearGradient id='clicksGradGoogle' x1='0' y1='0' x2='0' y2='1'>
                    <stop offset='5%' stopColor='#eab308' stopOpacity='0.2' />
                    <stop offset='95%' stopColor='#eab308' stopOpacity='0.0' />
                  </linearGradient>
                  <filter id='glowGoogle' x='-20%' y='-20%' width='140%' height='140%'>
                    <feGaussianBlur stdDeviation='3.5' result='blur' />
                    <feComposite in='SourceGraphic' in2='blur' operator='over' />
                  </filter>
                </defs>

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

                <path d={spendAreaPath} fill='url(#spendGradGoogle)' />
                <motion.path
                  fill='none'
                  stroke='#3b82f6'
                  strokeWidth='3'
                  filter='url(#glowGoogle)'
                  d={spendCurvePath}
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1 }}
                />

                <path d={clicksAreaPath} fill='url(#clicksGradGoogle)' />
                <motion.path
                  fill='none'
                  stroke='#eab308'
                  strokeWidth='2'
                  strokeDasharray='4 2'
                  filter='url(#glowGoogle)'
                  d={clicksCurvePath}
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.2 }}
                />

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
                        <circle cx={x} cy={ySpend} r='4.5' fill='#ffffff' stroke='#3b82f6' strokeWidth='2' />
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
                  <div className='flex justify-between gap-6 text-blue-300 font-bold'>
                    <span>Inversión:</span>
                    <span>${dailyHistory[activeDataIndex].spend.toFixed(2)}</span>
                  </div>
                  <div className='flex justify-between gap-6 text-yellow-300 font-bold'>
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

        {/* Distribución de Objetivos */}
        <div className='bg-app-sidebar border border-border-subtle p-5 rounded-2xl backdrop-blur-xl flex flex-col justify-between'>
          <div>
            <h4 className='text-xs font-bold text-text-secondary uppercase tracking-widest mb-4'>
              Distribución de Objetivos
            </h4>
            <div className='space-y-4'>
              {[
                { label: 'Búsqueda (Search)', key: 'SEARCH', color: 'bg-blue-500' },
                { label: 'Máx. Rendimiento (PMax)', key: 'PERFORMANCE_MAX', color: 'bg-yellow-500' },
                { label: 'Display (Red de Display)', key: 'DISPLAY', color: 'bg-cyan-500' }
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
        </div>
      </div>

      {/* 4. CAMPAIGNS LIST TABLE */}
      <div className='bg-app-sidebar border border-border-subtle rounded-2xl overflow-hidden backdrop-blur-xl'>
        <div className='p-5 border-b border-border-subtle flex justify-between items-center'>
          <h4 className='text-xs font-bold text-text-secondary uppercase tracking-widest'>
            Detalle de Campañas Google Ads
          </h4>
          <span className='text-[10px] bg-blue-500/10 text-blue-300 border border-blue-500/20 px-2.5 py-0.5 rounded-full font-bold'>
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
                  <th className='py-3 px-5'>Tipo de Red</th>
                  <th className='py-3 px-5 text-right'>Gasto</th>
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
                    <td className='py-3.5 px-5 text-right font-bold text-blue-400'>
                      {camp.conversions}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className='p-10 text-center text-text-muted'>
              No se encontraron campañas registradas en esta cuenta de Google Ads.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
