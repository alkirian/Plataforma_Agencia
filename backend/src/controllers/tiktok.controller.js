import * as tiktokService from '../services/tiktok.service.js';

export const handleGetTikTokIntegration = async (req, res, next) => {
  const { clientId } = req.params;
  const token = req.token || req.headers.authorization?.split(' ')[1];

  try {
    const integration = await tiktokService.getTikTokIntegration(clientId, token);
    res.status(200).json({ status: 'success', data: integration });
  } catch (error) {
    next(error);
  }
};

export const handleSaveTikTokIntegration = async (req, res, next) => {
  const { clientId } = req.params;
  const { access_token, tiktok_open_id, tiktok_username, refresh_token } = req.body;
  const token = req.token || req.headers.authorization?.split(' ')[1];

  if (!access_token || !tiktok_open_id) {
    return res.status(400).json({
      status: 'error',
      message: 'El access_token y tiktok_open_id son obligatorios.'
    });
  }

  try {
    const integration = await tiktokService.saveTikTokIntegration(
      clientId,
      { access_token, tiktok_open_id, tiktok_username, refresh_token },
      token
    );
    res.status(200).json({
      status: 'success',
      message: 'TikTok conectado exitosamente.',
      data: integration
    });
  } catch (error) {
    next(error);
  }
};

export const handleDeleteTikTokIntegration = async (req, res, next) => {
  const { clientId } = req.params;
  const token = req.token || req.headers.authorization?.split(' ')[1];

  try {
    await tiktokService.deleteTikTokIntegration(clientId, token);
    res.status(200).json({
      status: 'success',
      message: 'TikTok desconectado exitosamente.'
    });
  } catch (error) {
    next(error);
  }
};

export const handleExchangeTikTokToken = async (req, res, next) => {
  const { code, redirectUri } = req.body;

  if (!code) {
    return res.status(400).json({
      status: 'error',
      message: 'El código de autorización (code) es obligatorio.'
    });
  }

  try {
    const result = await tiktokService.exchangeTikTokToken(code, redirectUri);
    res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    next(error);
  }
};
