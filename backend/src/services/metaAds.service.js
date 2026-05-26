// src/services/metaAds.service.js
import axios from 'axios';
import { createAuthenticatedClient } from '../config/supabaseClient.js';

/**
 * Obtiene la configuración de Meta del cliente de la base de datos.
 */
export const getMetaIntegration = async (clientId, token) => {
  const supabase = createAuthenticatedClient(token);
  const { data, error } = await supabase
    .from('client_meta_integrations')
    .select('id, meta_ad_account_id, meta_page_id, status, updated_at')
    .eq('client_id', clientId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // No está conectado
    }
    throw new Error(`Error al verificar la integración de Meta: ${error.message}`);
  }

  return data;
};

/**
 * Guarda o actualiza los datos de conexión de Meta Ads para un cliente.
 */
export const saveMetaIntegration = async (clientId, integrationData, token) => {
  const supabase = createAuthenticatedClient(token);
  
  // Primero, verificar a qué agencia pertenece el cliente para no violar consistencia
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
    meta_ad_account_id: integrationData.meta_ad_account_id,
    meta_page_id: integrationData.meta_page_id || null,
    access_token: integrationData.access_token,
    status: 'active',
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('client_meta_integrations')
    .upsert(payload, { onConflict: 'client_id' })
    .select('id, meta_ad_account_id, meta_page_id, status, updated_at')
    .single();

  if (error) {
    throw new Error(`Error al guardar la integración de Meta: ${error.message}`);
  }

  return data;
};

/**
 * Elimina la conexión de Meta Ads para un cliente.
 */
export const deleteMetaIntegration = async (clientId, token) => {
  const supabase = createAuthenticatedClient(token);
  const { error } = await supabase
    .from('client_meta_integrations')
    .delete()
    .eq('client_id', clientId);

  if (error) {
    throw new Error(`Error al desconectar la cuenta de Meta: ${error.message}`);
  }

  return true;
};

/**
 * Generador de datos simulados premium de analíticas (Mock Data Generator)
 * Se usa cuando no hay token configurado o cuando se usan credenciales de prueba.
 */
const generateMockAdInsights = () => {
  const campaigns = [
    {
      id: 'cam_1092837491',
      name: 'Black Friday - Tráfico al Sitio',
      status: 'ACTIVE',
      objective: 'OUTCOME_TRAFFIC',
      spend: 420.50,
      impressions: 24500,
      clicks: 1280,
      ctr: 5.22,
      cpc: 0.32,
      conversions: 89
    },
    {
      id: 'cam_2983749281',
      name: 'Conversión Lead Gen - Curso Invierno',
      status: 'ACTIVE',
      objective: 'OUTCOME_LEADS',
      spend: 780.00,
      impressions: 48900,
      clicks: 2940,
      ctr: 6.01,
      cpc: 0.26,
      conversions: 312
    },
    {
      id: 'cam_3092839283',
      name: 'Reconocimiento de Marca - Local Palermo',
      status: 'PAUSED',
      objective: 'OUTCOME_AWARENESS',
      spend: 150.00,
      impressions: 78000,
      clicks: 450,
      ctr: 0.57,
      cpc: 0.33,
      conversions: 12
    },
    {
      id: 'cam_4982739281',
      name: 'Venta Directa - Catálogo Zapatillas',
      status: 'ACTIVE',
      objective: 'OUTCOME_SALES',
      spend: 1250.00,
      impressions: 98400,
      clicks: 5620,
      ctr: 5.71,
      cpc: 0.22,
      conversions: 418
    }
  ];

  // Generar datos históricos diarios para las últimas 2 semanas para el gráfico
  const dailyHistory = [];
  const now = new Date();
  for (let i = 14; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    
    // Variación semi-aleatoria estable
    const baseSpend = 120 + Math.sin(i * 0.8) * 40;
    const baseClicks = Math.floor(baseSpend * 4 + Math.cos(i) * 30);
    const baseImpressions = Math.floor(baseClicks * 18 + Math.sin(i) * 200);

    dailyHistory.push({
      date: date.toISOString().split('T')[0],
      spend: parseFloat(baseSpend.toFixed(2)),
      clicks: baseClicks,
      impressions: baseImpressions,
      ctr: parseFloat(((baseClicks / baseImpressions) * 100).toFixed(2))
    });
  }

  // Métricas acumuladas totales
  const totalSpend = campaigns.reduce((acc, c) => acc + c.spend, 0);
  const totalImpressions = campaigns.reduce((acc, c) => acc + c.impressions, 0);
  const totalClicks = campaigns.reduce((acc, c) => acc + c.clicks, 0);
  const avgCtr = parseFloat((campaigns.reduce((acc, c) => acc + c.ctr, 0) / campaigns.length).toFixed(2));
  const avgCpc = parseFloat((campaigns.reduce((acc, c) => acc + c.cpc, 0) / campaigns.length).toFixed(2));
  const totalConversions = campaigns.reduce((acc, c) => acc + c.conversions, 0);

  return {
    isMock: true,
    totals: {
      spend: totalSpend,
      impressions: totalImpressions,
      clicks: totalClicks,
      ctr: avgCtr,
      cpc: avgCpc,
      conversions: totalConversions
    },
    campaigns,
    dailyHistory
  };
};

/**
 * Obtiene campañas y analíticas (insights) desde Meta Ads.
 * Si las credenciales son de sandbox o 'mock', retorna automáticamente simulación realista premium.
 */
export const getClientAdInsights = async (clientId, token, dateRange = 'last_30d') => {
  const supabase = createAuthenticatedClient(token);

  // 1. Intentar obtener la conexión de Meta
  const { data: integration, error } = await supabase
    .from('client_meta_integrations')
    .select('meta_ad_account_id, access_token')
    .eq('client_id', clientId)
    .single();

  // Si no está integrado o hay error, o el token es de prueba explícito 'mock_token', devolver Mock
  if (error || !integration || integration.access_token === 'mock_token' || integration.meta_ad_account_id === 'act_mock') {
    return generateMockAdInsights();
  }

  const { meta_ad_account_id, access_token } = integration;

  try {
    // 2. Consultar la API de campañas reales de Meta
    const url = `https://graph.facebook.com/v19.0/${meta_ad_account_id}/campaigns`;
    const response = await axios.get(url, {
      params: {
        access_token,
        fields: 'id,name,status,objective,insights{spend,impressions,clicks,ctr,cpc,conversions}',
        date_preset: dateRange,
      }
    });

    const metaCampaigns = response.data.data || [];

    // Formatear las campañas reales
    const campaigns = metaCampaigns.map(c => {
      const insights = c.insights?.data?.[0] || {};
      const spend = parseFloat(insights.spend || 0.0);
      const impressions = parseInt(insights.impressions || 0, 10);
      const clicks = parseInt(insights.clicks || 0, 10);
      const ctr = parseFloat(insights.ctr || 0.0) * 100;
      const cpc = parseFloat(insights.cpc || 0.0);
      const conversions = insights.conversions ? insights.conversions.length : 0;

      return {
        id: c.id,
        name: c.name,
        status: c.status,
        objective: c.objective,
        spend,
        impressions,
        clicks,
        ctr: parseFloat(ctr.toFixed(2)),
        cpc: parseFloat(cpc.toFixed(2)),
        conversions
      };
    });

    // Calcular acumulados totales
    const totalSpend = campaigns.reduce((acc, c) => acc + c.spend, 0);
    const totalImpressions = campaigns.reduce((acc, c) => acc + c.impressions, 0);
    const totalClicks = campaigns.reduce((acc, c) => acc + c.clicks, 0);
    const avgCtr = campaigns.length ? parseFloat((campaigns.reduce((acc, c) => acc + c.ctr, 0) / campaigns.length).toFixed(2)) : 0;
    const avgCpc = campaigns.length ? parseFloat((campaigns.reduce((acc, c) => acc + c.cpc, 0) / campaigns.length).toFixed(2)) : 0;
    const totalConversions = campaigns.reduce((acc, c) => acc + c.conversions, 0);

    // Obtener insights agregados por día para el gráfico (se consulta la cuenta publicitaria directamente)
    const insightsUrl = `https://graph.facebook.com/v19.0/${meta_ad_account_id}/insights`;
    const insightsResponse = await axios.get(insightsUrl, {
      params: {
        access_token,
        time_increment: 1, // Diario
        date_preset: dateRange,
        fields: 'date_start,spend,clicks,impressions,ctr'
      }
    });

    const rawHistory = insightsResponse.data.data || [];
    const dailyHistory = rawHistory.map(day => ({
      date: day.date_start,
      spend: parseFloat(parseFloat(day.spend || 0).toFixed(2)),
      clicks: parseInt(day.clicks || 0, 10),
      impressions: parseInt(day.impressions || 0, 10),
      ctr: parseFloat((parseFloat(day.ctr || 0) * 100).toFixed(2))
    })).sort((a, b) => a.date.localeCompare(b.date));

    return {
      isMock: false,
      totals: {
        spend: totalSpend,
        impressions: totalImpressions,
        clicks: totalClicks,
        ctr: avgCtr,
        cpc: avgCpc,
        conversions: totalConversions
      },
      campaigns,
      dailyHistory
    };
  } catch (apiError) {
    console.warn('Falla de API real de Meta o Token inválido, activando mock de contingencia.');
    // En desarrollo, si la API real falla por permisos o tokens expirados, 
    // devolvemos mock para no romper la experiencia visual
    return generateMockAdInsights();
  }
};

/**
 * Intercambia un Token de Acceso de Corta Duración (2 horas) por uno de Larga Duración (60 días).
 */
export const exchangeShortLivedToken = async (shortLivedToken) => {
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;

  if (!appId || !appSecret || appId.includes('YOUR_META_APP') || appSecret.includes('YOUR_META_APP')) {
    console.warn('⚠️ META_APP_ID o META_APP_SECRET no configurados. Retornando token temporal para Sandbox.');
    return 'mock_token';
  }

  try {
    const url = 'https://graph.facebook.com/v19.0/oauth/access_token';
    const response = await axios.get(url, {
      params: {
        grant_type: 'fb_exchange_token',
        client_id: appId,
        client_secret: appSecret,
        fb_exchange_token: shortLivedToken
      }
    });

    return response.data.access_token;
  } catch (err) {
    console.error('Error intercambiando el token en Meta:', err.response?.data || err.message);
    throw new Error('No se pudo intercambiar el token de acceso con Meta.');
  }
};

/**
 * Consulta la lista de cuentas publicitarias asociadas a un token de usuario.
 */
export const getUserAdAccounts = async (accessToken) => {
  if (accessToken === 'mock_token' || accessToken.includes('YOUR_META_APP')) {
    return [
      { id: 'act_mock', name: 'Cuenta Sandbox - Cadence Agency Demo' },
      { id: 'act_1092837492', name: 'Cliente Real S.A. - Campañas' },
      { id: 'act_2938475628', name: 'Ecosistema E-Commerce Palermo' }
    ];
  }

  try {
    const url = 'https://graph.facebook.com/v19.0/me/adaccounts';
    const response = await axios.get(url, {
      params: {
        access_token: accessToken,
        fields: 'id,name'
      }
    });

    return response.data.data || [];
  } catch (err) {
    console.error('Error consultando ad accounts de usuario:', err.response?.data || err.message);
    throw new Error('No se pudieron recuperar las cuentas publicitarias de tu usuario de Facebook.');
  }
};
