import axios from 'axios';
import { createAuthenticatedClient } from '../config/supabaseClient.js';
import { logActivity } from './activity.service.js';

/**
 * Obtiene la configuración de LinkedIn del cliente.
 */
export const getLinkedInIntegration = async (clientId, token) => {
  const supabase = createAuthenticatedClient(token);
  const { data, error } = await supabase
    .from('client_linkedin_integrations')
    .select('id, linkedin_urn, linkedin_name, status, updated_at')
    .eq('client_id', clientId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // No conectado
    throw new Error(`Error al verificar la integración de LinkedIn: ${error.message}`);
  }
  return data;
};

/**
 * Guarda o actualiza la conexión de LinkedIn para un cliente.
 */
export const saveLinkedInIntegration = async (clientId, integrationData, token) => {
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
    linkedin_urn: integrationData.linkedin_urn,
    linkedin_name: integrationData.linkedin_name || 'Perfil de LinkedIn',
    access_token: integrationData.access_token,
    status: 'active',
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('client_linkedin_integrations')
    .upsert(payload, { onConflict: 'client_id' })
    .select('id, linkedin_urn, linkedin_name, status, updated_at')
    .single();

  if (error) {
    throw new Error(`Error al guardar la integración de LinkedIn: ${error.message}`);
  }

  return data;
};

/**
 * Elimina la conexión de LinkedIn de un cliente.
 */
export const deleteLinkedInIntegration = async (clientId, token) => {
  const supabase = createAuthenticatedClient(token);
  const { error } = await supabase
    .from('client_linkedin_integrations')
    .delete()
    .eq('client_id', clientId);

  if (error) {
    throw new Error(`Error al desconectar LinkedIn: ${error.message}`);
  }
  return true;
};

/**
 * Intercambia el código de autorización OAuth por un token de acceso.
 * Para ambientes de prueba, si el código contiene 'mock', retorna credenciales simuladas.
 */
export const exchangeLinkedInToken = async (code, redirectUri) => {
  if (code.includes('mock')) {
    return {
      accessToken: 'linkedin_mock_token_' + Date.now(),
      urn: 'urn:li:person:mock_user_123',
      name: 'Perfil de Prueba LinkedIn'
    };
  }

  // En producción, realizar el POST a LinkedIn OAuth token endpoint
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET || '';
  const clientId = process.env.LINKEDIN_CLIENT_ID || '';

  try {
    const response = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', null, {
      params: {
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const accessToken = response.data.access_token;

    // Consultar el perfil del usuario para obtener URN y Nombre
    const profileRes = await axios.get('https://api.linkedin.com/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    const urn = `urn:li:person:${profileRes.data.sub}`;
    const name = `${profileRes.data.given_name} ${profileRes.data.family_name}`;

    return { accessToken, urn, name };
  } catch (err) {
    console.error('Error al intercambiar token de LinkedIn:', err.response?.data || err.message);
    throw new Error(err.response?.data?.error_description || 'Error al autenticar con LinkedIn.');
  }
};

/**
 * Publica físicamente un posteo con imagen en LinkedIn.
 */
export const publishToLinkedIn = async (clientId, copy, mediaUrl, token) => {
  const supabase = createAuthenticatedClient(token);

  const { data: integration, error: intErr } = await supabase
    .from('client_linkedin_integrations')
    .select('linkedin_urn, access_token')
    .eq('client_id', clientId)
    .single();

  if (intErr || !integration || integration.access_token.includes('mock')) {
    // Modo Simulación Premium
    console.log(`📡 [LINKEDIN MOCK] Publicando en ${integration?.linkedin_urn || 'urn:li:person:mock'} con copy: "${copy?.slice(0, 30)}..."`);
    await new Promise(resolve => setTimeout(resolve, 1500));
    return {
      success: true,
      id: 'urn:li:share:mock_' + Date.now(),
      mock: true
    };
  }

  const { linkedin_urn: authorUrn, access_token: accessToken } = integration;

  try {
    let postPayload = {
      author: authorUrn,
      commentary: copy || '',
      visibility: 'PUBLIC',
      distribution: {
        feedDistribution: 'MAIN_FEED',
        targetEntities: []
      },
      lifecycleState: 'PUBLISHED'
    };

    // Subida e inyección de imagen si existe mediaUrl
    if (mediaUrl) {
      // 1. Registrar la subida del asset en LinkedIn
      const registerRes = await axios.post('https://api.linkedin.com/v2/images?action=registerUpload', {
        registerUploadRequest: {
          recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
          owner: authorUrn,
          supportedUploadMechanisms: ['SYNCHRONOUS_UPLOAD']
        }
      }, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      const uploadUrl = registerRes.data.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadMechanism'].uploadUrl;
      const assetUrn = registerRes.data.value.image;

      // 2. Descargar la imagen firmada y subirla binariamente a LinkedIn
      const imageBinary = await axios.get(mediaUrl, { responseType: 'arraybuffer' });
      await axios.put(uploadUrl, imageBinary.data, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'image/jpeg'
        }
      });

      // 3. Modificar el payload del posteo para incorporar el URN del asset
      postPayload.content = {
        media: {
          title: 'Publicado desde Cadence',
          id: assetUrn
        }
      };
    }

    // 4. Publicar el posteo
    const publishRes = await axios.post('https://api.linkedin.com/v2/posts', postPayload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'X-Restli-Protocol-Version': '2.0.0',
        'Content-Type': 'application/json'
      }
    });

    const shareId = publishRes.headers['x-restli-id'] || 'urn:li:share:' + Date.now();
    return { success: true, id: shareId };
  } catch (err) {
    console.error('Error al publicar en LinkedIn API:', err.response?.data || err.message);
    return {
      success: false,
      error: err.response?.data?.message || err.message
    };
  }
};
