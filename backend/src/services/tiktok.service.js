import axios from 'axios';
import { createAuthenticatedClient } from '../config/supabaseClient.js';

/**
 * Obtiene la configuración de TikTok del cliente.
 */
export const getTikTokIntegration = async (clientId, token) => {
  const supabase = createAuthenticatedClient(token);
  const { data, error } = await supabase
    .from('client_tiktok_integrations')
    .select('id, tiktok_open_id, tiktok_username, status, updated_at')
    .eq('client_id', clientId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // No conectado
    throw new Error(`Error al verificar la integración de TikTok: ${error.message}`);
  }
  return data;
};

/**
 * Guarda o actualiza la conexión de TikTok para un cliente.
 */
export const saveTikTokIntegration = async (clientId, integrationData, token) => {
  const supabase = createAuthenticatedClient(token);

  const { data: client, error: clientErr } = await supabase
    .from('clients')
    .select('agency_id')
    .eq('id', clientId)
    .single();

  if (clientErr || !client) {
    throw new Error('Cliente no encontrado o no autorizado.');
  }

  const payload = {
    client_id: clientId,
    agency_id: client.agency_id,
    tiktok_open_id: integrationData.tiktok_open_id,
    tiktok_username: integrationData.tiktok_username || 'Usuario de TikTok',
    access_token: integrationData.access_token,
    refresh_token: integrationData.refresh_token || null,
    status: 'active',
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('client_tiktok_integrations')
    .upsert(payload, { onConflict: 'client_id' })
    .select('id, tiktok_open_id, tiktok_username, status, updated_at')
    .single();

  if (error) {
    throw new Error(`Error al guardar la integración de TikTok: ${error.message}`);
  }

  return data;
};

/**
 * Elimina la conexión de TikTok de un cliente.
 */
export const deleteTikTokIntegration = async (clientId, token) => {
  const supabase = createAuthenticatedClient(token);
  const { error } = await supabase
    .from('client_tiktok_integrations')
    .delete()
    .eq('client_id', clientId);

  if (error) {
    throw new Error(`Error al desconectar TikTok: ${error.message}`);
  }
  return true;
};

/**
 * Intercambia el código de TikTok por access_token, open_id y refresh_token.
 */
export const exchangeTikTokToken = async (code, redirectUri) => {
  if (code.includes('mock')) {
    return {
      accessToken: 'tiktok_mock_token_' + Date.now(),
      refreshToken: 'tiktok_mock_refresh_' + Date.now(),
      openId: 'tiktok_mock_openid_123',
      username: 'PruebaTikTok'
    };
  }

  const clientKey = process.env.TIKTOK_CLIENT_KEY || '';
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET || '';

  try {
    const response = await axios.post('https://open.tiktokapis.com/v2/oauth/token/', null, {
      params: {
        client_key: clientKey,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const { access_token, open_id, refresh_token } = response.data;

    // Obtener el perfil del usuario para extraer el nombre de usuario
    const userRes = await axios.get('https://open.tiktokapis.com/v2/user/info/', {
      headers: {
        Authorization: `Bearer ${access_token}`
      },
      params: {
        fields: 'open_id,union_id,avatar_url,display_name,username'
      }
    });

    const username = userRes.data?.data?.user?.username || 'Usuario de TikTok';

    return {
      accessToken: access_token,
      refreshToken: refresh_token || null,
      openId: open_id,
      username
    };
  } catch (err) {
    console.error('Error al intercambiar token de TikTok:', err.response?.data || err.message);
    throw new Error(err.response?.data?.error_description || 'Error al autenticar con TikTok.');
  }
};

/**
 * Publica un video físicamente en TikTok.
 */
export const publishToTikTok = async (clientId, copy, mediaUrl, token) => {
  const supabase = createAuthenticatedClient(token);

  const { data: integration, error: intErr } = await supabase
    .from('client_tiktok_integrations')
    .select('access_token, tiktok_username')
    .eq('client_id', clientId)
    .single();

  if (intErr || !integration || integration.access_token.includes('mock')) {
    // Modo Simulación Premium
    console.log(`📡 [TIKTOK MOCK] Publicando video en @${integration?.tiktok_username || 'mock'} con copy: "${copy?.slice(0, 30)}..."`);
    await new Promise(resolve => setTimeout(resolve, 1500));
    return {
      success: true,
      id: 'tiktok_mock_publish_' + Date.now(),
      mock: true
    };
  }

  const { access_token: accessToken } = integration;

  try {
    if (!mediaUrl) {
      throw new Error('TikTok requiere obligatoriamente un archivo de video para poder publicar.');
    }

    // 1. Inicializar la subida de video directa a TikTok
    // TikTok requiere descargar el video, por lo que le enviamos el URL firmado directamente
    const initRes = await axios.post('https://open.tiktokapis.com/v2/post/publish/video/init/', {
      post_info: {
        title: copy || 'Publicado desde Cadence',
        privacy_level: 'PUBLIC_TO_EVERYONE',
        disable_duet: false,
        disable_stitch: false,
        disable_comment: false
      },
      source_info: {
        source: 'PULL_FROM_URL', // Le pasamos el URL firmado para que los servidores de TikTok lo descarguen directamente
        video_url: mediaUrl
      }
    }, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    const publishId = initRes.data?.data?.publish_id || 'tiktok_publish_' + Date.now();
    return { success: true, id: publishId };
  } catch (err) {
    console.error('Error al publicar en TikTok API:', err.response?.data || err.message);
    return {
      success: false,
      error: err.response?.data?.error?.message || err.message
    };
  }
};
