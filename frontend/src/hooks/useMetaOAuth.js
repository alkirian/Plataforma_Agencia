import { useState } from 'react';
import { apiFetch } from '../api/apiFetch';
import { toast } from 'react-hot-toast';

export const useMetaOAuth = (clientId, toastId = 'oauth-toast') => {
  const [connecting, setConnecting] = useState(false);
  const [oauthStep, setOauthStep] = useState('connect'); // 'connect' | 'select_account'
  const [adAccountsList, setAdAccountsList] = useState([]);
  const [pagesList, setPagesList] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [selectedPageId, setSelectedPageId] = useState('');
  const [tempAccessToken, setTempAccessToken] = useState('');

  const handleFacebookOAuth = async () => {
    try {
      setConnecting(true);

      // 1. Obtener la App ID real desde el backend
      const configRes = await apiFetch(`/clients/${clientId}/meta-integration/config`);
      const appId = configRes.data?.appId;

      if (appId) {
        // FLOW REAL: popup oficial con redirección a callback local
        const redirectUri = window.location.origin + '/meta-callback.html';
        const oauthUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=ads_read,ads_management,business_management,pages_show_list,pages_read_engagement,pages_read_user_content,instagram_basic,instagram_manage_comments,pages_manage_posts,instagram_content_publish,pages_manage_engagement`;

        toast.loading('Esperando autorización en el popup de Facebook...', { id: toastId });

        const popup = window.open(
          oauthUrl,
          'facebook-login',
          'width=650,height=650,scrollbars=yes'
        );

        if (!popup) {
          toast.error(
            'El popup fue bloqueado por el navegador. Habilita las ventanas emergentes.',
            { id: toastId }
          );
          setConnecting(false);
          return;
        }

        const handleMessage = async (event) => {
          if (event.origin !== window.location.origin) return;

          if (event.data?.type === 'META_OAUTH_SUCCESS') {
            window.removeEventListener('message', handleMessage);
            const hash = event.data.hash;
            const params = new URLSearchParams(hash.replace('#', '?'));
            const shortLivedToken = params.get('access_token');

            if (shortLivedToken) {
              try {
                toast.loading('Sincronizando con Meta y recuperando cuentas...', { id: toastId });

                const exchangeRes = await apiFetch(
                  `/clients/${clientId}/meta-integration/exchange`,
                  {
                    method: 'POST',
                    body: JSON.stringify({ shortLivedToken }),
                  }
                );

                toast.success('¡Sesión vinculada con Meta exitosamente!', {
                  id: toastId,
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
                  id: toastId,
                });
              } finally {
                setConnecting(false);
              }
            }
          } else if (event.data?.type === 'META_OAUTH_ERROR') {
            window.removeEventListener('message', handleMessage);
            toast.error(event.data.error || 'Error al iniciar sesión en Facebook.', {
              id: toastId,
            });
            setConnecting(false);
          }
        };

        window.addEventListener('message', handleMessage);

        const checkClosed = setInterval(() => {
          if (!popup || popup.closed) {
            clearInterval(checkClosed);
            window.removeEventListener('message', handleMessage);
            toast.dismiss(toastId);
            setConnecting(false);
          }
        }, 1000);
      } else {
        // FLOW SIMULADO/SANDBOX DE CONTINGENCIA
        toast.loading('Conectando de forma segura con Meta Sandbox...', { id: toastId });

        const res = await apiFetch(`/clients/${clientId}/meta-integration/exchange`, {
          method: 'POST',
          body: JSON.stringify({ shortLivedToken: 'mock_short_lived_token' }),
        });

        toast.success('¡Sesión autorizada por Meta Sandbox!', { id: toastId });
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
      toast.error(err.message || 'Error al autorizar con Facebook.', { id: toastId });
      setConnecting(false);
    }
  };

  return {
    connecting,
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
  };
};
