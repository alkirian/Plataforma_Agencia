import * as linkedinService from '../services/linkedin.service.js';

export const handleGetLinkedInIntegration = async (req, res, next) => {
  const { clientId } = req.params;
  const token = req.token || req.headers.authorization?.split(' ')[1];

  try {
    const integration = await linkedinService.getLinkedInIntegration(clientId, token);
    res.status(200).json({ status: 'success', data: integration });
  } catch (error) {
    next(error);
  }
};

export const handleSaveLinkedInIntegration = async (req, res, next) => {
  const { clientId } = req.params;
  const { access_token, linkedin_urn, linkedin_name } = req.body;
  const token = req.token || req.headers.authorization?.split(' ')[1];

  if (!access_token || !linkedin_urn) {
    return res.status(400).json({
      status: 'error',
      message: 'El access_token y linkedin_urn son obligatorios.'
    });
  }

  try {
    const integration = await linkedinService.saveLinkedInIntegration(
      clientId,
      { access_token, linkedin_urn, linkedin_name },
      token
    );
    res.status(200).json({
      status: 'success',
      message: 'LinkedIn conectado exitosamente.',
      data: integration
    });
  } catch (error) {
    next(error);
  }
};

export const handleDeleteLinkedInIntegration = async (req, res, next) => {
  const { clientId } = req.params;
  const token = req.token || req.headers.authorization?.split(' ')[1];

  try {
    await linkedinService.deleteLinkedInIntegration(clientId, token);
    res.status(200).json({
      status: 'success',
      message: 'LinkedIn desconectado exitosamente.'
    });
  } catch (error) {
    next(error);
  }
};

export const handleExchangeLinkedInToken = async (req, res, next) => {
  const { code, redirectUri } = req.body;

  if (!code) {
    return res.status(400).json({
      status: 'error',
      message: 'El código de autorización (code) es obligatorio.'
    });
  }

  try {
    const result = await linkedinService.exchangeLinkedInToken(code, redirectUri);
    res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    next(error);
  }
};
