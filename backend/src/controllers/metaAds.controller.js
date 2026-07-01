// src/controllers/metaAds.controller.js
import * as metaAdsService from '../services/metaAds.service.js';
import { sendConversionEvent } from '../services/metaCapi.service.js';

/**
 * Verifica y obtiene el estado de integración de Meta de un cliente.
 */
export const handleGetMetaIntegration = async (req, res) => {
  const { clientId } = req.params;
  const token = req.headers.authorization?.split(' ')[1];

  try {
    const integration = await metaAdsService.getMetaIntegration(clientId, token);
    res.status(200).json({
      status: 'success',
      data: integration // Puede ser null si no está conectado
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

/**
 * Conecta o actualiza las credenciales de Meta Ads del cliente.
 */
export const handleSaveMetaIntegration = async (req, res) => {
  const { clientId } = req.params;
  const { meta_ad_account_id, meta_page_id, access_token } = req.body;
  const token = req.headers.authorization?.split(' ')[1];

  if (!meta_ad_account_id || !access_token) {
    return res.status(400).json({
      status: 'error',
      message: 'El ID de la cuenta publicitaria y el Access Token son requeridos.'
    });
  }

  try {
    const integration = await metaAdsService.saveMetaIntegration(
      clientId, 
      { meta_ad_account_id, meta_page_id, access_token }, 
      token
    );
    res.status(200).json({
      status: 'success',
      message: 'Cuenta de Meta Ads conectada exitosamente.',
      data: integration
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

/**
 * Desconecta la cuenta de Meta de un cliente.
 */
export const handleDeleteMetaIntegration = async (req, res) => {
  const { clientId } = req.params;
  const token = req.headers.authorization?.split(' ')[1];

  try {
    await metaAdsService.deleteMetaIntegration(clientId, token);
    res.status(200).json({
      status: 'success',
      message: 'Cuenta de Meta Ads desconectada exitosamente.'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

/**
 * Obtiene analíticas avanzadas y lista de campañas de Meta Ads.
 */
export const handleGetClientAdInsights = async (req, res) => {
  const { clientId } = req.params;
  const { dateRange } = req.query;
  const token = req.headers.authorization?.split(' ')[1];

  try {
    const insights = await metaAdsService.getClientAdInsights(clientId, token, dateRange);
    res.status(200).json({
      status: 'success',
      data: insights
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

/**
 * Intercambia el token OAuth temporal y devuelve las cuentas publicitarias elegibles.
 */
export const handleExchangeOAuthToken = async (req, res) => {
  const { shortLivedToken } = req.body;

  if (!shortLivedToken) {
    return res.status(400).json({
      status: 'error',
      message: 'El shortLivedToken es requerido para realizar el intercambio.'
    });
  }

  try {
    const longLivedToken = await metaAdsService.exchangeShortLivedToken(shortLivedToken);
    const accounts = await metaAdsService.getUserAdAccounts(longLivedToken);
    const pages = await metaAdsService.getUserPagesAndInstagramAccounts(longLivedToken);

    res.status(200).json({
      status: 'success',
      data: {
        accessToken: longLivedToken,
        accounts,
        pages
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

/**
 * Recupera comentarios reales del cliente.
 */
export const handleGetClientComments = async (req, res) => {
  const { clientId } = req.params;
  const token = req.headers.authorization?.split(' ')[1];

  try {
    const comments = await metaAdsService.getClientComments(clientId, token);
    res.status(200).json({
      status: 'success',
      data: comments
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

/**
 * Publica una respuesta a un comentario específico.
 */
export const handleReplyToComment = async (req, res) => {
  const { clientId, commentId } = req.params;
  const { replyText, platform } = req.body;
  const token = req.headers.authorization?.split(' ')[1];

  if (!replyText) {
    return res.status(400).json({
      status: 'error',
      message: 'El texto de la respuesta (replyText) es requerido.'
    });
  }

  try {
    const result = await metaAdsService.replyToComment(clientId, commentId, replyText, platform, token);
    res.status(200).json({
      status: 'success',
      message: 'Respuesta publicada exitosamente.',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

/**
 * Ajusta dinámicamente el tono de un borrador de comentario con IA.
 */
export const handleTweakCommentDraft = async (req, res) => {
  const { clientId } = req.params;
  const { commentText, currentDraft, instruction, brandVoice, businessDescription } = req.body;

  if (!commentText || !currentDraft || !instruction) {
    return res.status(400).json({
      status: 'error',
      message: 'Los campos commentText, currentDraft e instruction son requeridos.'
    });
  }

  try {
    const result = await metaAdsService.tweakCommentDraft(clientId, {
      commentText,
      currentDraft,
      instruction,
      brandVoice,
      businessDescription
    });
    res.status(200).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

/**
 * Obtiene el borrador IA y análisis detallado para un comentario específico en caliente (Lazy Load).
 */
export const handleGetCommentAIDraft = async (req, res) => {
  const { clientId, commentId } = req.params;
  const { commentText, platform } = req.query;
  const token = req.headers.authorization?.split(' ')[1];

  if (!commentText || !platform) {
    return res.status(400).json({
      status: 'error',
      message: 'Los parámetros de consulta commentText y platform son requeridos.'
    });
  }

  try {
    const result = await metaAdsService.getCommentAIDraft(clientId, commentId, commentText, platform, token);
    res.status(200).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

/**
 * Recupera publicaciones orgánicas de Facebook e Instagram del cliente.
 */
export const handleGetClientPosts = async (req, res) => {
  const { clientId } = req.params;
  const token = req.headers.authorization?.split(' ')[1];

  try {
    const posts = await metaAdsService.getClientPosts(clientId, token);
    res.status(200).json({
      status: 'success',
      data: posts
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

/**
 * Promociona / pauta una publicación orgánica (boosting).
 */
export const handleBoostPost = async (req, res) => {
  const { clientId } = req.params;
  const boostData = req.body;
  const token = req.headers.authorization?.split(' ')[1];

  try {
    const result = await metaAdsService.boostPost(clientId, boostData, token);
    res.status(200).json({
      status: 'success',
      message: 'Publicación promocionada correctamente.',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

/**
 * Recupera las reglas de optimización de anuncios de un cliente.
 */
export const handleGetOptimizationRules = async (req, res) => {
  const { clientId } = req.params;
  const token = req.headers.authorization?.split(' ')[1];

  try {
    const rules = await metaAdsService.getOptimizationRules(clientId, token);
    res.status(200).json({
      status: 'success',
      data: rules
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

/**
 * Guarda o actualiza las reglas de optimización de anuncios de un cliente.
 */
export const handleSaveOptimizationRules = async (req, res) => {
  const { clientId } = req.params;
  const rulesData = req.body;
  const token = req.headers.authorization?.split(' ')[1];

  try {
    const result = await metaAdsService.saveOptimizationRules(clientId, rulesData, token);
    res.status(200).json({
      status: 'success',
      message: 'Reglas de optimización actualizadas correctamente.',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

/**
 * Envía un evento de conversión de prueba (CAPI) para validar configuración.
 */
export const handleTestMetaCapi = async (req, res) => {
  const { clientId } = req.params;

  try {
    const result = await sendConversionEvent(clientId, 'Lead', {
      email: 'test-capi-cadence@example.com',
      phone: '+5491123456789',
      ipAddress: req.ip || '127.0.0.1',
      userAgent: req.headers['user-agent'] || 'Cadence-CAPI-Test-Client'
    }, {
      eventSourceUrl: `${req.protocol}://${req.get('host')}/clients/${clientId}/cm`
    });

    if (result.success) {
      res.status(200).json({
        status: 'success',
        message: 'Evento de prueba enviado con éxito a la API de Conversiones.',
        data: result
      });
    } else {
      res.status(400).json({
        status: 'error',
        message: 'Meta rechazó el evento de conversión.',
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

/**
 * Endpoint para disparar un evento de conversión a Meta CAPI.
 */
export const handleSendClientConversionEvent = async (req, res) => {
  const { clientId } = req.params;
  const { eventName, userData, customData } = req.body;

  if (!eventName) {
    return res.status(400).json({
      status: 'error',
      message: 'El nombre del evento (eventName) es requerido.'
    });
  }

  try {
    const result = await sendConversionEvent(clientId, eventName, {
      email: userData?.email,
      phone: userData?.phone,
      ipAddress: userData?.ipAddress || req.ip || '127.0.0.1',
      userAgent: userData?.userAgent || req.headers['user-agent']
    }, customData || {});

    if (result.success) {
      res.status(200).json({
        status: 'success',
        message: `Evento de conversión '${eventName}' procesado con éxito.`,
        data: result
      });
    } else {
      res.status(400).json({
        status: 'error',
        message: 'Fallo al procesar evento de conversión.',
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};
