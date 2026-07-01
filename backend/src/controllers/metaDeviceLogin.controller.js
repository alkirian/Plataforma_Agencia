import * as metaAdsService from '../services/metaAds.service.js';
import { logger } from '../utils/logger.js';

// Map en memoria para cachear tokens de Device Login ya procesados
const deviceLoginSessions = new Map();

/**
 * POST /api/v1/shared/meta-device/start
 * Inicia el Facebook Device Login Flow.
 * El usuario va a facebook.com/device en su celular y escribe el user_code mostrado.
 * 
 * No requiere redirect_uri, dominios registrados, ni IPs locales.
 * Docs: https://developers.facebook.com/docs/facebook-login/for-devices
 */
export const handleDeviceLoginStart = async (req, res, next) => {
  try {
    const { clientId } = req.body;

    if (!clientId) {
      return res.status(400).json({ success: false, message: 'Se requiere clientId.' });
    }

    const appId     = process.env.META_APP_ID;
    const appSecret = process.env.META_APP_SECRET;

    if (!appId || !appSecret) {
      return res.status(500).json({
        success: false,
        message: 'La configuracion de Meta (APP_ID / APP_SECRET) no esta disponible en el servidor.'
      });
    }

    const scope = [
      'ads_read', 'ads_management', 'business_management',
      'pages_show_list', 'pages_read_engagement', 'pages_read_user_content',
      'instagram_basic', 'instagram_manage_comments',
      'pages_manage_posts', 'instagram_content_publish', 'pages_manage_engagement'
    ].join(',');

    // Llamar a la API de Device Login de Facebook
    const fbRes = await fetch(
      `https://graph.facebook.com/oauth/device?client_id=${appId}&scope=${scope}`,
      { method: 'POST' }
    );

    const fbData = await fbRes.json();

    if (!fbRes.ok || !fbData.code || !fbData.user_code) {
      logger.error?.(`Error iniciando Device Login de Meta: ${JSON.stringify(fbData)}`);
      return res.status(502).json({
        success: false,
        message: fbData?.error?.message || 'Error al iniciar el flujo con Meta. Asegurate de que el Device Login este habilitado en tu app de Meta for Developers.'
      });
    }

    logger.info?.(`[Device Login] Iniciado para cliente ${clientId} — user_code: ${fbData.user_code}`);

    return res.status(200).json({
      success: true,
      data: {
        userCode:        fbData.user_code,
        verificationUri: fbData.verification_uri || 'https://www.facebook.com/device',
        deviceCode:      fbData.code,
        expiresIn:       fbData.expires_in,
        interval:        fbData.interval || 5,
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/shared/meta-device/poll
 * Hace polling para verificar si el usuario ya autorizo en facebook.com/device.
 * El frontend llama a este endpoint cada ~5 segundos mientras muestra el user_code.
 *
 * Query params: clientId, deviceCode
 * Posibles status en respuesta: 'pending' | 'declined' | 'expired' | 'error' | connected=true
 */
export const handleDeviceLoginPoll = async (req, res, next) => {
  try {
    const { clientId, deviceCode } = req.query;

    if (!clientId || !deviceCode) {
      return res.status(400).json({ success: false, message: 'Se requieren clientId y deviceCode.' });
    }

    const appId     = process.env.META_APP_ID;
    const appSecret = process.env.META_APP_SECRET;

    if (!appId || !appSecret) {
      return res.status(500).json({ success: false, message: 'Configuracion de Meta no disponible.' });
    }

    // Revisar cache para no volver a llamar a Meta si ya se proceso
    const cached = deviceLoginSessions.get(deviceCode);
    if (cached) {
      if (Date.now() - cached.timestamp > 10 * 60 * 1000) {
        deviceLoginSessions.delete(deviceCode);
      } else {
        return res.status(200).json({ success: true, connected: true, data: cached });
      }
    }

    // Llamar a Facebook para verificar si el usuario ya autorizo
    const pollRes = await fetch(
      `https://graph.facebook.com/oauth/device/decision?code=${deviceCode}&access_token=${appId}|${appSecret}&grant_type=urn:ietf:params:oauth:grant-type:device_code`,
      { method: 'POST' }
    );

    const pollData = await pollRes.json();

    if (pollData.error) {
      const errorCode = pollData.error.code;
      // 31 = authorization_pending (normal, seguir esperando)
      if (errorCode === 31) {
        return res.status(200).json({ success: true, connected: false, status: 'pending' });
      }
      // 32 = authorization_declined
      if (errorCode === 32) {
        return res.status(200).json({ success: false, connected: false, status: 'declined', message: 'El usuario rechazo la autorizacion.' });
      }
      // 33 = code_expired
      if (errorCode === 33) {
        return res.status(200).json({ success: false, connected: false, status: 'expired', message: 'El codigo expiro. Por favor, genera uno nuevo.' });
      }
      return res.status(200).json({ success: false, connected: false, status: 'error', message: pollData.error.message });
    }

    const shortLivedToken = pollData.access_token;
    if (!shortLivedToken) {
      return res.status(200).json({ success: false, connected: false, status: 'error', message: 'No se recibio token de acceso.' });
    }

    logger.info?.(`[Device Login] Completado para cliente ${clientId}`);

    // Intercambiar por token de larga duracion y obtener cuentas/paginas
    const longLivedToken = await metaAdsService.exchangeShortLivedToken(shortLivedToken);
    const accounts       = await metaAdsService.getUserAdAccounts(longLivedToken);
    const pages          = await metaAdsService.getUserPagesAndInstagramAccounts(longLivedToken);

    const sessionData = { accessToken: longLivedToken, accounts, pages, timestamp: Date.now() };
    deviceLoginSessions.set(deviceCode, sessionData);

    return res.status(200).json({
      success: true,
      connected: true,
      data: { accessToken: longLivedToken, accounts, pages }
    });

  } catch (error) {
    next(error);
  }
};
