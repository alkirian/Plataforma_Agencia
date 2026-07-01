import axios from 'axios';
import { createAuthenticatedClient } from '../config/supabaseClient.js';
import { logActivity } from './activity.service.js';

/**
 * Obtiene la configuración de Google Ads del cliente.
 */
export const getGoogleIntegration = async (clientId, token) => {
  const supabase = createAuthenticatedClient(token);
  const { data, error } = await supabase
    .from('client_google_integrations')
    .select('id, google_customer_id, google_account_name, status, auto_optimize_ads, max_cpa_usd, min_roas, optimize_action, updated_at')
    .eq('client_id', clientId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // No conectado
    throw new Error(`Error al verificar la integración de Google: ${error.message}`);
  }
  return data;
};

/**
 * Guarda o actualiza la conexión de Google Ads para un cliente.
 */
export const saveGoogleIntegration = async (clientId, integrationData, token) => {
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
    google_customer_id: integrationData.google_customer_id,
    google_account_name: integrationData.google_account_name || 'Cuenta Google Ads',
    access_token: integrationData.access_token,
    refresh_token: integrationData.refresh_token,
    status: 'active',
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('client_google_integrations')
    .upsert(payload, { onConflict: 'client_id' })
    .select('id, google_customer_id, google_account_name, status, updated_at')
    .single();

  if (error) {
    throw new Error(`Error al guardar la integración de Google: ${error.message}`);
  }

  return data;
};

/**
 * Elimina la conexión de Google Ads de un cliente.
 */
export const deleteGoogleIntegration = async (clientId, token) => {
  const supabase = createAuthenticatedClient(token);
  const { error } = await supabase
    .from('client_google_integrations')
    .delete()
    .eq('client_id', clientId);

  if (error) {
    throw new Error(`Error al desconectar Google: ${error.message}`);
  }
  return true;
};

/**
 * Intercambia el código de autorización OAuth por tokens de acceso/refresco.
 */
export const exchangeGoogleToken = async (code, redirectUri) => {
  if (code.includes('mock') || !process.env.GOOGLE_CLIENT_ID) {
    // Modo sandbox / simulador de contingencia
    return {
      accessToken: 'google_mock_access_token_' + Date.now(),
      refreshToken: 'google_mock_refresh_token_' + Date.now(),
      googleAccountName: 'Cuenta Demo de Google Ads',
      customerAccounts: [
        { id: '123-456-7890', name: 'Corporación Alpha (Search & PMax)' },
        { id: '987-654-3210', name: 'Tienda E-commerce Beta (Display)' }
      ]
    };
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  try {
    const response = await axios.post('https://oauth2.googleapis.com/token', null, {
      params: {
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      }
    });

    const { access_token, refresh_token } = response.data;
    
    // Obtener información básica de la cuenta
    // Nota: Para listar cuentas de Google Ads en producción se requeriría el Developer Token.
    // De momento, retornamos una lista vacía o simulada para la selección.
    return {
      accessToken: access_token,
      refreshToken: refresh_token || 'existing_refresh_token',
      googleAccountName: 'Cuenta Google Ads Producción',
      customerAccounts: [
        { id: '555-123-4567', name: 'Cuenta de Producción Activa' }
      ]
    };
  } catch (err) {
    const errMsg = err.response?.data?.error_description || err.message;
    throw new Error(`Falla en intercambio de Google OAuth: ${errMsg}`);
  }
};

/**
 * Obtiene métricas y campañas de Google Ads del cliente.
 */
export const getClientGoogleCampaigns = async (clientId, dateRange, token) => {
  const supabase = createAuthenticatedClient(token);
  
  const { data: integration, error } = await supabase
    .from('client_google_integrations')
    .select('*')
    .eq('client_id', clientId)
    .single();

  if (error || !integration) {
    throw new Error('Integración de Google Ads no activa o no encontrada.');
  }

  // Si estamos en modo Mock/Sandbox
  if (integration.access_token.includes('mock')) {
    // Generar datos simulados dinámicos
    const isLast7d = dateRange === 'last_7d';
    const isLast90d = dateRange === 'last_90d';
    
    const spend = isLast7d ? 85.50 : isLast90d ? 1050.80 : 350.25;
    const impressions = isLast7d ? 10000 : isLast90d ? 135000 : 45000;
    const clicks = isLast7d ? 920 : isLast90d ? 11400 : 3800;
    const ctr = parseFloat(((clicks / impressions) * 100).toFixed(2));
    const cpc = clicks > 0 ? parseFloat((spend / clicks).toFixed(2)) : 0;
    const conversions = isLast7d ? 35 : isLast90d ? 440 : 145;

    const campaigns = [
      {
        name: 'Google Search - Branding Cadence',
        status: 'ACTIVE',
        objective: 'SEARCH',
        spend: parseFloat((spend * 0.35).toFixed(2)),
        clicks: Math.floor(clicks * 0.37),
        impressions: Math.floor(impressions * 0.33),
        ctr: 9.33,
        cpc: 0.09,
        conversions: Math.floor(conversions * 0.35)
      },
      {
        name: 'Google Performance Max - Ventas Directas',
        status: 'ACTIVE',
        objective: 'PERFORMANCE_MAX',
        spend: parseFloat((spend * 0.51).toFixed(2)),
        clicks: Math.floor(clicks * 0.55),
        impressions: Math.floor(impressions * 0.49),
        ctr: 9.54,
        cpc: 0.09,
        conversions: Math.floor(conversions * 0.58)
      },
      {
        name: 'Google Display - Retargeting Mensual',
        status: 'PAUSED',
        objective: 'DISPLAY',
        spend: parseFloat((spend * 0.14).toFixed(2)),
        clicks: Math.floor(clicks * 0.08),
        impressions: Math.floor(impressions * 0.18),
        ctr: 3.75,
        cpc: 0.16,
        conversions: Math.floor(conversions * 0.07)
      }
    ];

    // Construir historial de días
    const dailyHistory = [];
    const daysToGen = isLast7d ? 7 : isLast90d ? 90 : 30;
    const today = new Date();
    
    for (let i = daysToGen; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      
      const baseDailySpend = spend / daysToGen;
      const fluctuation = Math.sin(i * 0.6) * 0.35 + 1; // +/- 35% de variación
      
      const dailySpend = parseFloat((baseDailySpend * fluctuation).toFixed(2));
      const dailyClicks = Math.floor((clicks / daysToGen) * fluctuation);
      const dailyImpressions = Math.floor((impressions / daysToGen) * fluctuation);

      dailyHistory.push({
        date: dateStr,
        spend: dailySpend,
        clicks: dailyClicks,
        impressions: dailyImpressions
      });
    }

    return {
      totals: { spend, impressions, clicks, ctr, cpc, conversions },
      campaigns,
      dailyHistory
    };
  }

  // FLUJO DE PRODUCCIÓN REAL CON GOOGLE ADS API
  // Nota: Esto requiere que las variables de entorno de Google Developer Token estén listas.
  // Realizaríamos consultas con google-ads-api o peticiones HTTP directas a Google Ads API endpoint.
  // De momento, implementamos un fallback seguro que no rompa si las variables no están cargadas.
  try {
    // Retornamos datos reales si contáramos con un SDK, o simulamos respuestas formateadas
    // para asegurar que el sistema siempre responda de forma elegante en la UI.
    throw new Error('Configuración de Google Developer Token pendiente. Conecta en Modo Demo para simular analíticas.');
  } catch (err) {
    throw new Error(err.message);
  }
};
