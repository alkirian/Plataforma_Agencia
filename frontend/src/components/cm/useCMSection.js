// src/components/cm/useCMSection.js
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { apiFetch } from '../../api/apiFetch';
import { useMetaOAuth } from '../../hooks/useMetaOAuth';

export const useCMSection = (clientId) => {
  const [loading, setLoading] = useState(true);
  const [integration, setIntegration] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState('inbox'); // 'inbox' | 'posts' | 'ads'
  const [activeNetwork, setActiveNetwork] = useState('meta'); // 'meta' | 'google'
  const [showRulesPanel, setShowRulesPanel] = useState(false);

  // Google Ads integration & rules states
  const [autoOptimizeGoogleAds, setAutoOptimizeGoogleAds] = useState(false);
  const [maxCpaGoogleUsd, setMaxCpaGoogleUsd] = useState('');
  const [minRoasGoogle, setMinRoasGoogle] = useState('');
  const [optimizeActionGoogle, setOptimizeActionGoogle] = useState('notify_only');
  const [savingGoogleRules, setSavingGoogleRules] = useState(false);
  const [googleIntegration, setGoogleIntegration] = useState(null);

  // Meta OAuth hook integration
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

  // Cargar estado de todas las integraciones
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

  const fetchGoogleRules = async () => {
    try {
      const res = await apiFetch(`/clients/${clientId}/google-integration/rules`);
      if (res.data) {
        setAutoOptimizeGoogleAds(res.data.auto_optimize_ads || false);
        setMaxCpaGoogleUsd(res.data.max_cpa_usd !== null && res.data.max_cpa_usd !== undefined ? String(res.data.max_cpa_usd) : '');
        setMinRoasGoogle(res.data.min_roas !== null && res.data.min_roas !== undefined ? String(res.data.min_roas) : '');
        setOptimizeActionGoogle(res.data.optimize_action || 'notify_only');
      }
      
      const intRes = await apiFetch(`/clients/${clientId}/google-integration`).catch(() => null);
      setGoogleIntegration(intRes?.data || null);
    } catch (err) {
      console.error('Error al cargar reglas de Google Ads:', err);
    }
  };

  useEffect(() => {
    loadAllIntegrations();
    fetchGoogleRules();
  }, [clientId]);

  // Google Rules Save
  const handleSaveGoogleRules = async () => {
    try {
      setSavingGoogleRules(true);
      const idToast = toast.loading('Guardando reglas de Google Ads...', { id: 'save-google-rules-toast' });
      await apiFetch(`/clients/${clientId}/google-integration/rules`, {
        method: 'POST',
        body: JSON.stringify({
          auto_optimize_ads: autoOptimizeGoogleAds,
          max_cpa_usd: maxCpaGoogleUsd === '' ? null : parseFloat(maxCpaGoogleUsd),
          min_roas: minRoasGoogle === '' ? null : parseFloat(minRoasGoogle),
          optimize_action: optimizeActionGoogle,
        })
      });
      toast.success('¡Reglas de Google Ads actualizadas correctamente!', { id: 'save-google-rules-toast' });
    } catch (err) {
      console.error('Error al guardar reglas de Google:', err);
      toast.error(err.message || 'Error al guardar reglas.', { id: 'save-google-rules-toast' });
    } finally {
      setSavingGoogleRules(false);
    }
  };

  // Google Ads Disconnect
  const handleDeleteGoogleIntegration = async () => {
    if (!window.confirm('¿Estás seguro de que deseas desconectar Google Ads?')) return;
    try {
      setLoading(true);
      await apiFetch(`/clients/${clientId}/google-integration`, { method: 'DELETE' });
      setGoogleIntegration(null);
      toast.success('Google Ads desconectado.');
    } catch (err) {
      toast.error('Error al desconectar Google Ads.');
    } finally {
      setLoading(false);
    }
  };

  // LinkedIn Auth Handlers
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

  // TikTok Auth Handlers
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

  // Meta Integration Onboarding Save
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

  // Meta Ads Disconnect
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
      setOauthStep('connect');
    } catch (err) {
      toast.error('Error al desconectar la cuenta.');
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    integration,
    setIntegration,
    connecting,
    activeSubTab,
    setActiveSubTab,
    activeNetwork,
    setActiveNetwork,
    showRulesPanel,
    setShowRulesPanel,
    // Google Ads rules states
    autoOptimizeGoogleAds,
    setAutoOptimizeGoogleAds,
    maxCpaGoogleUsd,
    setMaxCpaGoogleUsd,
    minRoasGoogle,
    setMinRoasGoogle,
    optimizeActionGoogle,
    setOptimizeActionGoogle,
    savingGoogleRules,
    googleIntegration,
    // Google handlers
    handleSaveGoogleRules,
    handleDeleteGoogleIntegration,
    fetchGoogleRules,
    // Meta OAuth
    connectingOAuth,
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
    // Other channels
    linkedinIntegration,
    tiktokIntegration,
    connectingLI,
    connectingTK,
    handleLinkedInOAuth,
    handleDeleteLinkedIn,
    handleTikTokOAuth,
    handleDeleteTikTok,
    // Meta actions
    handleConfirmOnboarding,
    handleDisconnect,
    loadAllIntegrations,
  };
};
