// src/controllers/metaAds.controller.js
import * as metaAdsService from '../services/metaAds.service.js';

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
