import * as googleAdsService from '../services/googleAds.service.js';
import { createAuthenticatedClient } from '../config/supabaseClient.js';

export const handleGetGoogleConfig = async (req, res, next) => {
  try {
    const appId = process.env.GOOGLE_CLIENT_ID || 'demo_google_client_id';
    return res.status(200).json({
      status: 'success',
      data: { appId }
    });
  } catch (err) {
    next(err);
  }
};

export const handleGetGoogleIntegration = async (req, res, next) => {
  try {
    const { clientId } = req.params;
    const token = req.headers.authorization?.split(' ')[1];

    const data = await googleAdsService.getGoogleIntegration(clientId, token);
    return res.status(200).json({
      status: 'success',
      data
    });
  } catch (err) {
    next(err);
  }
};

export const handleSaveGoogleIntegration = async (req, res, next) => {
  try {
    const { clientId } = req.params;
    const { google_customer_id, google_account_name, access_token, refresh_token } = req.body;
    const token = req.headers.authorization?.split(' ')[1];

    if (!google_customer_id || !access_token) {
      return res.status(400).json({
        status: 'error',
        message: 'El google_customer_id y access_token son obligatorios.'
      });
    }

    const data = await googleAdsService.saveGoogleIntegration(
      clientId, 
      { google_customer_id, google_account_name, access_token, refresh_token }, 
      token
    );

    return res.status(200).json({
      status: 'success',
      message: 'Conexión a Google Ads establecida correctamente.',
      data
    });
  } catch (err) {
    next(err);
  }
};

export const handleDeleteGoogleIntegration = async (req, res, next) => {
  try {
    const { clientId } = req.params;
    const token = req.headers.authorization?.split(' ')[1];

    await googleAdsService.deleteGoogleIntegration(clientId, token);
    return res.status(200).json({
      status: 'success',
      message: 'Google Ads desconectado exitosamente.'
    });
  } catch (err) {
    next(err);
  }
};

export const handleExchangeGoogleToken = async (req, res, next) => {
  try {
    const { code, redirectUri } = req.body;
    if (!code) {
      return res.status(400).json({
        status: 'error',
        message: 'El código de autorización OAuth es obligatorio.'
      });
    }

    const result = await googleAdsService.exchangeGoogleToken(code, redirectUri);
    return res.status(200).json({
      status: 'success',
      data: result
    });
  } catch (err) {
    next(err);
  }
};

export const handleGetGoogleCampaigns = async (req, res, next) => {
  try {
    const { clientId } = req.params;
    const { dateRange } = req.query;
    const token = req.headers.authorization?.split(' ')[1];

    const result = await googleAdsService.getClientGoogleCampaigns(clientId, dateRange || 'last_30d', token);
    return res.status(200).json({
      status: 'success',
      data: result
    });
  } catch (err) {
    next(err);
  }
};

export const handleGetGoogleRules = async (req, res, next) => {
  try {
    const { clientId } = req.params;
    const token = req.headers.authorization?.split(' ')[1];
    const supabase = createAuthenticatedClient(token);

    const { data, error } = await supabase
      .from('client_google_integrations')
      .select('auto_optimize_ads, max_cpa_usd, min_roas, optimize_action')
      .eq('client_id', clientId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(200).json({ status: 'success', data: null });
      }
      throw error;
    }

    return res.status(200).json({
      status: 'success',
      data
    });
  } catch (err) {
    next(err);
  }
};

export const handleSaveGoogleRules = async (req, res, next) => {
  try {
    const { clientId } = req.params;
    const { auto_optimize_ads, max_cpa_usd, min_roas, optimize_action } = req.body;
    const token = req.headers.authorization?.split(' ')[1];
    const supabase = createAuthenticatedClient(token);

    const { data: client, error: clientErr } = await supabase
      .from('clients')
      .select('agency_id')
      .eq('id', clientId)
      .single();

    if (clientErr || !client) {
      return res.status(404).json({
        status: 'error',
        message: 'Cliente no encontrado.'
      });
    }

    const { data, error } = await supabase
      .from('client_google_integrations')
      .update({
        auto_optimize_ads: auto_optimize_ads || false,
        max_cpa_usd: max_cpa_usd !== undefined ? max_cpa_usd : null,
        min_roas: min_roas !== undefined ? min_roas : null,
        optimize_action: optimize_action || 'notify_only',
        updated_at: new Date().toISOString()
      })
      .eq('client_id', clientId)
      .select('auto_optimize_ads, max_cpa_usd, min_roas, optimize_action')
      .single();

    if (error) {
      throw error;
    }

    return res.status(200).json({
      status: 'success',
      message: 'Reglas de Google Ads actualizadas.',
      data
    });
  } catch (err) {
    next(err);
  }
};
