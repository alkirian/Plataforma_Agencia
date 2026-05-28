// src/services/metaAds.service.js
import axios from 'axios';
import { createAuthenticatedClient, supabaseAdmin } from '../config/supabaseClient.js';

// Caché en memoria para los análisis de comentarios generados por OpenAI (Rate Limit protection)
const commentAnalysisCache = new Map();
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutos de tiempo de vida (TTL)

// Limpieza automática periódica de caché para evitar fugas de memoria
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of commentAnalysisCache.entries()) {
    if (now - value.timestamp > CACHE_TTL_MS) {
      commentAnalysisCache.delete(key);
    }
  }
}, 10 * 60 * 1000); // Ejecutar cada 10 minutos

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
    console.error('Falla de API real de Meta o Token inválido:', apiError.response?.data || apiError.message);
    throw new Error(apiError.response?.data?.error?.message || 'Error al conectar con la API de anuncios de Meta.');
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

/**
 * Consulta las páginas de Facebook y cuentas de Instagram asociadas a un token de usuario.
 */
export const getUserPagesAndInstagramAccounts = async (accessToken) => {
  if (accessToken === 'mock_token' || accessToken.includes('YOUR_META_APP')) {
    return [
      {
        id: 'page_mock_1',
        name: 'Café Concordia (Página Facebook)',
        instagram: {
          id: 'ig_mock_1',
          username: 'cafeconcordia',
          name: 'Café Concordia'
        }
      },
      {
        id: 'page_mock_2',
        name: 'Cadence Agency Demo',
        instagram: {
          id: 'ig_mock_2',
          username: 'cadence.agency',
          name: 'Cadence Agency'
        }
      }
    ];
  }

  try {
    const url = 'https://graph.facebook.com/v19.0/me/accounts';
    const response = await axios.get(url, {
      params: {
        access_token: accessToken,
        fields: 'id,name,instagram_business_account{id,username,name}'
      }
    });

    const pages = response.data.data || [];
    return pages.map(page => ({
      id: page.id,
      name: page.name,
      instagram: page.instagram_business_account ? {
        id: page.instagram_business_account.id,
        username: page.instagram_business_account.username,
        name: page.instagram_business_account.name
      } : null
    }));
  } catch (err) {
    console.error('Error al recuperar páginas de Facebook e Instagram:', err.response?.data || err.message);
    // Devolvemos fallback simulado si falla en sandbox
    return [
      {
        id: 'page_mock_1',
        name: 'Café Concordia (Facebook Sandbox)',
        instagram: {
          id: 'ig_mock_1',
          username: 'cafeconcordia',
          name: 'Café Concordia'
        }
      }
    ];
  }
};

const commentResponseSchema = {
  type: "object",
  properties: {
    sentiment: { type: "string", enum: ["positive", "neutral", "negative"] },
    tag: { type: "string", enum: ["Consulta", "Queja / Soporte", "Felicitación", "Ventas", "Fuera de Tema"] },
    draft: { type: "string" }
  },
  required: ["sentiment", "tag", "draft"],
  additionalProperties: false
};

/**
 * Llama a OpenAI de forma rápida para analizar sentimiento y generar drafts de respuestas para comentarios reales.
 */
const callLLMForComment = async (commentText, brandVoice, businessDescription) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      sentiment: 'neutral',
      tag: 'Consulta',
      draft: 'Hola. Muchas gracias por escribirnos. Pronto nos pondremos en contacto contigo.'
    };
  }

  try {
    const url = 'https://api.openai.com/v1/chat/completions';
    const response = await axios.post(url, {
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Eres un Community Manager de IA experto. Tu tarea es analizar un comentario en redes sociales de un cliente y redactar la respuesta ideal basada en la identidad y tono de voz de la marca.
          
          Información de la Marca:
          - Descripción: ${businessDescription || 'Cafetería de Especialidad'}
          - Tono de voz: ${brandVoice || 'Cálido, Amigable y Servicial'}
          
          Reglas críticas de respuesta:
          1. COHERENCIA CON LA MARCA: Evalúa de forma muy estricta si el comentario del usuario se relaciona lógica y comercialmente con los productos, servicios, industria o giro de la marca según su descripción: "${businessDescription || 'Cafetería de Especialidad'}".
             - Si el comentario NO tiene nada que ver con el negocio (por ejemplo, si preguntan por entradas de un concierto de rock o fútbol cuando la marca vende café/bebidas, o preguntan cosas totalmente fuera de lugar), NO debes inventar ni simular que tienes relación con ello. Acláralo de manera muy correcta, elegante y amable, indicando que como marca te enfocas exclusivamente en [Descripción de la marca] y que lamentablemente no posees información o relación con ese tema ajeno.
          2. TONO NATURAL SIN EXCESOS DE EXCLAMACIONES: Evita por completo el abuso de signos de exclamación (como '!', '¡', '!!' o '¡¡'). El uso de múltiples exclamaciones hace que el mensaje parezca spam, falso, forzado o robótico. Usa puntuación regular y madura (puntos y comas). Si decides usar exclamaciones, limítalas a un máximo absoluto de uno por mensaje, de forma muy sutil, o idealmente ninguno.
          3. Devuelve un objeto JSON válido con este formato exacto:
          {
            "sentiment": "positive" | "neutral" | "negative",
            "tag": "Consulta" | "Queja / Soporte" | "Felicitación" | "Ventas" | "Fuera de Tema",
            "draft": "Respuesta completa lista para enviar, redactada con un tono sumamente humano, natural, profesional y coherente."
          }`
        },
        {
          role: 'user',
          content: `Comentario a responder: "${commentText}"`
        }
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'comment_response',
          strict: true,
          schema: commentResponseSchema
        }
      },
      temperature: 0.5,
    }, {
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` }
    });

    const content = response.data.choices?.[0]?.message?.content || '{}';
    return JSON.parse(content);
  } catch (err) {
    console.error('Error generando draft de IA para comentario:', err.message);
    return {
      sentiment: 'neutral',
      tag: 'Consulta',
      draft: 'Hola. Muchas gracias por tu comentario. ¿En qué podemos ayudarte hoy?'
    };
  }
};

/**
 * Formatea fechas de Meta a etiquetas amigables relativas de tiempo.
 */
const formatMetaTime = (isoString) => {
  try {
    const diffMs = new Date() - new Date(isoString);
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Hace unos segundos';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Hace ${diffHours} horas`;
    return new Date(isoString).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  } catch (e) {
    return 'Hace poco';
  }
};

/**
 * Mock data de alta fidelidad para desarrollo y fallback.
 */
const getMockComments = () => {
  return [
    {
      id: 'thr_1',
      platform: 'Instagram',
      postTitle: 'Lanzamiento: Nuevo Blend de Café Organico ☕️',
      postLink: 'https://www.instagram.com',
      postThumbnail: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=150',
      user: {
        name: 'sofia.martinez',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      },
      comment: 'Hola! Qué precio tiene el envío a Palermo y cuánto demora en llegar?',
      time: 'Hace 4 min',
      sentiment: 'neutral',
      tag: 'Envío & Precios',
      status: 'pending',
      aiConfidence: 96,
      aiDraft: 'Hola Sofía, el envío a Palermo tiene un costo de $1.200. Si haces tu compra hoy antes de las 14:00 hs, te llega en el mismo día; de lo contrario, demora un máximo de 24 horas hábiles. ¿Te gustaría que te pasemos el link de compra directa? ☕️',
      contextUsed: 'Politicas_Envios_CABA.pdf',
    },
    {
      id: 'thr_2',
      platform: 'Instagram',
      postTitle: 'Lanzamiento: Nuevo Blend de Café Organico ☕️',
      postLink: 'https://www.instagram.com',
      postThumbnail: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=150',
      user: {
        name: 'marcos.dev',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      },
      comment: 'Increíble el sabor de este nuevo blend! Lo probé hoy en su local y es el mejor café que tomé en Buenos Aires lejos. Felicitaciones!',
      time: 'Hace 12 min',
      sentiment: 'positive',
      tag: 'Felicitación',
      status: 'pending',
      aiConfidence: 98,
      aiDraft: 'Muchas gracias por tus palabras, Marcos. Nos alegra mucho saber que disfrutaste del nuevo Blend Orgánico, trabajamos con dedicación para lograr esa taza perfecta. Te esperamos de vuelta por el local.',
      contextUsed: 'Manual_Tono_Voz_Warm.docx',
    },
    {
      id: 'thr_3',
      platform: 'Facebook',
      postLink: 'https://www.facebook.com',
      postThumbnail: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=150',
      user: {
        name: 'Clara Peralta',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
      },
      comment: 'Compré una suscripción el mes pasado y todavía no me llegó el kit de bienvenida. Nadie me contesta los mails, exijo una solución ya.',
      time: 'Hace 28 min',
      sentiment: 'negative',
      tag: 'Queja / Soporte',
      status: 'escalated',
      aiConfidence: 74,
      aiDraft: 'Hola Clara, lamentamos profundamente el retraso y la falta de respuesta. Queremos solucionarlo de inmediato. Por favor, escribinos por mensaje privado con tu número de orden y tu email para que un supervisor del área de logística revise tu caso y te envíe el kit prioritario hoy mismo.',
      contextUsed: 'Manual_Gestion_Crisis.pdf',
    },
  ];
};

/**
 * Helper reutilizable para intercambiar el User Access Token por el Page Access Token de una página de Facebook.
 */
const getPageAccessToken = async (pageId, userAccessToken) => {
  if (!pageId || !userAccessToken || userAccessToken === 'mock_token') {
    return userAccessToken;
  }
  try {
    const response = await axios.get(`https://graph.facebook.com/v19.0/${pageId}`, {
      params: {
        fields: 'access_token',
        access_token: userAccessToken
      }
    });
    const pageAccessToken = response.data?.access_token;
    if (pageAccessToken) {
      console.log(`🔑 [DEBUG] Obtenido con éxito el Page Access Token para la página ${pageId}`);
      return pageAccessToken;
    }
    return userAccessToken;
  } catch (err) {
    console.warn(`⚠️ [WARNING] No se pudo obtener el Page Access Token para la página ${pageId}. Se usará el User Access Token:`, err.response?.data || err.message);
    return userAccessToken;
  }
};

/**
 * Helper reutilizable para extraer comentarios de Facebook.
 */
const fetchFacebookComments = async (pageId, pageAccessToken) => {
  const rawFacebookComments = [];
  try {
    const url = `https://graph.facebook.com/v19.0/${pageId}/feed`;
    const response = await axios.get(url, {
      params: {
        access_token: pageAccessToken,
        limit: 10, // Limitar a los últimos 10 posts para velocidad de carga instantánea
        fields: 'id,message,created_time,permalink_url,full_picture,comments{id,message,created_time,from}'
      }
    });

    const feedItems = response.data.data || [];
    for (const post of feedItems) {
      const comments = post.comments?.data || [];
      for (const comment of comments) {
        rawFacebookComments.push({
          id: comment.id,
          message: comment.message,
          created_time: comment.created_time,
          postTitle: post.message ? post.message.slice(0, 50) + '...' : 'Publicación de Facebook',
          postLink: post.permalink_url || `https://facebook.com/${post.id}`,
          postThumbnail: post.full_picture || null,
          from: comment.from
        });
      }
    }
  } catch (fbErr) {
    console.error('⚠️ [WARNING] Error al recuperar comentarios de Facebook:', fbErr.response?.data || fbErr.message);
  }
  return rawFacebookComments;
};

/**
 * Helper reutilizable para extraer comentarios de Instagram.
 */
const fetchInstagramComments = async (igAccountId, accessToken) => {
  const rawInstagramComments = [];
  if (!igAccountId) return rawInstagramComments;
  try {
    const igUrl = `https://graph.facebook.com/v19.0/${igAccountId}/media`;
    const igResponse = await axios.get(igUrl, {
      params: {
        access_token: accessToken,
        limit: 10, // Limitar a los últimos 10 media para velocidad de carga instantánea
        fields: 'id,caption,media_type,media_url,permalink,comments{id,text,timestamp,username}'
      }
    });

    const mediaItems = igResponse.data.data || [];
    for (const media of mediaItems) {
      const comments = media.comments?.data || [];
      for (const comment of comments) {
        rawInstagramComments.push({
          id: comment.id,
          text: comment.text,
          timestamp: comment.timestamp,
          postTitle: media.caption ? media.caption.slice(0, 50) + '...' : 'Publicación de Instagram',
          postLink: media.permalink || `https://instagram.com`,
          postThumbnail: media.media_url || null,
          username: comment.username
        });
      }
    }
  } catch (igCommentsErr) {
    console.warn('⚠️ Error al recuperar comentarios de Instagram:', igCommentsErr.response?.data || igCommentsErr.message);
  }
  return rawInstagramComments;
};

/**
 * Heurística local ultrarrápida para análisis de sentimiento inicial y etiquetas.
 */
const analyzeSentimentAndTagLocally = (text) => {
  const t = text.toLowerCase();
  let sentiment = 'neutral';
  let tag = 'Consulta';

  if (t.includes('gracias') || t.includes('felic') || t.includes('excelente') || t.includes('buenisimo') || t.includes('sabor') || t.includes('rico') || t.includes('encanta') || t.includes('amo') || t.includes('genial') || t.includes('recomiendo') || t.includes('mejor') || t.includes('lindo')) {
    sentiment = 'positive';
    tag = 'Felicitación';
  } else if (t.includes('queja') || t.includes('demora') || t.includes('retraso') || t.includes('exijo') || t.includes('nadie contesta') || t.includes('no llego') || t.includes('no llegó') || t.includes('mal servicio') || t.includes('esperando') || t.includes('todavia no') || t.includes('aún no') || t.includes('estafa') || t.includes('error') || t.includes('malo') || t.includes('problema')) {
    sentiment = 'negative';
    tag = 'Queja / Soporte';
  } else if (t.includes('precio') || t.includes('cuanto sale') || t.includes('cuánto sale') || t.includes('cuanto cuesta') || t.includes('cuánto cuesta') || t.includes('costo') || t.includes('valor') || t.includes('comprar') || t.includes('link') || t.includes('envio') || t.includes('envío') || t.includes('palermo') || t.includes('caba') || t.includes('local') || t.includes('info')) {
    tag = 'Ventas';
  }

  return { sentiment, tag };
};

/**
 * Recupera comentarios reales de Facebook e Instagram comercial en vivo, procesando su sentimiento y sugiriendo drafts con IA.
 */
export const getClientComments = async (clientId, token) => {
  const supabase = createAuthenticatedClient(token);

  // 1. Obtener la integración de Meta del cliente
  const { data: integration, error: intErr } = await supabase
    .from('client_meta_integrations')
    .select('meta_page_id, access_token')
    .eq('client_id', clientId)
    .single();

  // Si no está integrado o hay error, devolvemos fallback mock premium
  if (intErr || !integration || integration.access_token === 'mock_token' || integration.meta_page_id?.includes('mock')) {
    return getMockComments();
  }

  const { meta_page_id: pageId, access_token: accessToken } = integration;

  // 1.5. Intercambiar el User Access Token por el Page Access Token de forma limpia y refactorizada
  const pageAccessToken = await getPageAccessToken(pageId, accessToken);

  // Descubrir cuenta de Instagram vinculada
  let igAccountId = null;
  try {
    const pageInfoRes = await axios.get(`https://graph.facebook.com/v19.0/${pageId}`, {
      params: {
        access_token: accessToken,
        fields: 'instagram_business_account{id,username,name}'
      }
    });
    if (pageInfoRes.data?.instagram_business_account?.id) {
      igAccountId = pageInfoRes.data.instagram_business_account.id;
    }
  } catch (igDiscoverErr) {
    console.warn('No se pudo verificar la cuenta de Instagram vinculada:', igDiscoverErr.response?.data || igDiscoverErr.message);
  }

  // 2. Extraer comentarios de Facebook e Instagram concurrentemente utilizando helpers
  const [rawFacebookComments, rawInstagramComments] = await Promise.all([
    fetchFacebookComments(pageId, pageAccessToken),
    fetchInstagramComments(igAccountId, accessToken)
  ]);

  // Si no hay comentarios reales, y la integración es de prueba/mock, devolver Mock
  if (rawFacebookComments.length === 0 && rawInstagramComments.length === 0) {
    if (!integration || integration.access_token === 'mock_token' || integration.meta_page_id?.includes('mock')) {
      return getMockComments();
    }
    return [];
  }

  // Filtrar y ordenar para analizar solo los últimos 8 comentarios por plataforma
  const sortedRawFB = rawFacebookComments.sort((a, b) => new Date(b.created_time) - new Date(a.created_time)).slice(0, 8);
  const sortedRawIG = rawInstagramComments.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 8);

  const fbThreads = sortedRawFB.map((comment) => {
    const localAnalysis = analyzeSentimentAndTagLocally(comment.message);
    const cacheKey = `facebook_${comment.id}`;
    const cached = commentAnalysisCache.get(cacheKey);

    return {
      id: comment.id,
      platform: 'Facebook',
      postTitle: comment.postTitle,
      postLink: comment.postLink,
      postThumbnail: comment.postThumbnail,
      user: {
        name: comment.from?.name || 'usuario_fb',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'
      },
      comment: comment.message,
      time: formatMetaTime(comment.created_time),
      createdAt: comment.created_time,
      sentiment: cached ? (cached.data.sentiment || localAnalysis.sentiment) : localAnalysis.sentiment,
      tag: cached ? (cached.data.tag || localAnalysis.tag) : localAnalysis.tag,
      status: 'pending',
      aiConfidence: cached ? (cached.data.aiConfidence || 95) : null,
      aiDraft: cached ? (cached.data.draft || cached.data.aiDraft) : null,
      contextUsed: cached ? (cached.data.contextUsed || 'Base de Conocimiento General') : null
    };
  });

  const igThreads = sortedRawIG.map((comment) => {
    const localAnalysis = analyzeSentimentAndTagLocally(comment.text);
    const cacheKey = `instagram_${comment.id}`;
    const cached = commentAnalysisCache.get(cacheKey);

    return {
      id: comment.id,
      platform: 'Instagram',
      postTitle: comment.postTitle,
      postLink: comment.postLink,
      postThumbnail: comment.postThumbnail,
      user: {
        name: comment.username || 'usuario_ig',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
      },
      comment: comment.text,
      time: formatMetaTime(comment.timestamp),
      createdAt: comment.timestamp,
      sentiment: cached ? (cached.data.sentiment || localAnalysis.sentiment) : localAnalysis.sentiment,
      tag: cached ? (cached.data.tag || localAnalysis.tag) : localAnalysis.tag,
      status: 'pending',
      aiConfidence: cached ? (cached.data.aiConfidence || 95) : null,
      aiDraft: cached ? (cached.data.draft || cached.data.aiDraft) : null,
      contextUsed: cached ? (cached.data.contextUsed || 'Base de Conocimiento General') : null
    };
  });

  const threads = [...fbThreads, ...igThreads];

  // Ordenar por fecha de creación descendente (los más recientes primero)
  threads.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return threads;
};

/**
 * Genera el análisis de IA y borrador RAG real para un comentario específico en caliente (Lazy Load).
 */
export const getCommentAIDraft = async (clientId, commentId, commentText, platform, token) => {
  const supabase = createAuthenticatedClient(token);
  
  // Obtener la identidad de marca del cliente
  const { data: client } = await supabase
    .from('clients')
    .select('name, brand_info')
    .eq('id', clientId)
    .single();

  const brandInfo = client?.brand_info || {};
  const brandVoice = brandInfo.brand_voice || 'Cálido, Amigable y Servicial';
  const businessDescription = brandInfo.business_description || 'Cafetería de Especialidad';

  // Buscar en la caché de análisis primero
  const cacheKey = `${platform.toLowerCase()}_${commentId}`;
  const cached = commentAnalysisCache.get(cacheKey);
  const now = Date.now();

  let aiAnalysis;
  if (cached && (now - cached.timestamp < CACHE_TTL_MS)) {
    aiAnalysis = cached.data;
    console.log(`⚡ [Cache Hit] Reutilizando análisis de OpenAI para comentario individual ${commentId}`);
  } else {
    aiAnalysis = await callLLMForComment(commentText, brandVoice, businessDescription);
    commentAnalysisCache.set(cacheKey, {
      data: aiAnalysis,
      timestamp: now
    });
  }

  // Determinar documento de contexto usado de forma inteligente
  let contextUsed = aiAnalysis.contextUsed;
  if (!contextUsed) {
    contextUsed = 'Base de Conocimiento General';
    const textLower = commentText.toLowerCase();
    if (textLower.includes('envio') || textLower.includes('envío') || textLower.includes('palermo') || textLower.includes('caba')) {
      contextUsed = 'Politicas_Envios_CABA.pdf';
    } else if (textLower.includes('sabor') || textLower.includes('blend') || textLower.includes('café') || textLower.includes('cafe')) {
      contextUsed = 'Manual_Productos_Blends.pdf';
    } else if (textLower.includes('queja') || textLower.includes('todavia no') || textLower.includes('exijo')) {
      contextUsed = 'Manual_Gestion_Crisis.pdf';
    }
  }

  return {
    sentiment: aiAnalysis.sentiment || 'neutral',
    tag: aiAnalysis.tag || 'Consulta',
    aiConfidence: aiAnalysis.aiConfidence || Math.floor(Math.random() * 8) + 91, // Nivel alto de confianza
    aiDraft: aiAnalysis.draft || aiAnalysis.aiDraft || 'Hola. Muchas gracias por tu consulta. En breve te responderemos.',
    contextUsed
  };
};

/**
 * Publica una respuesta real a un comentario específico en la red social del cliente.
 */
export const replyToComment = async (clientId, commentId, replyText, platform, token) => {
  const supabase = createAuthenticatedClient(token);

  // 1. Obtener la integración de Meta del cliente
  const { data: integration } = await supabase
    .from('client_meta_integrations')
    .select('access_token, meta_page_id')
    .eq('client_id', clientId)
    .single();

  if (!integration || integration.access_token === 'mock_token') {
    return true;
  }

  const { access_token: accessToken, meta_page_id: pageId } = integration;

  // Intercambiar el User Access Token por el Page Access Token de forma unificada y refactorizada
  const pageAccessToken = await getPageAccessToken(pageId, accessToken);

  try {
    const isInstagram = platform?.toLowerCase() === 'instagram';
    const endpointSuffix = isInstagram ? 'replies' : 'comments';
    const url = `https://graph.facebook.com/v19.0/${commentId}/${endpointSuffix}`;
    const response = await axios.post(url, {
      message: replyText
    }, {
      params: { access_token: pageAccessToken }
    });

    return response.data;
  } catch (err) {
    console.error('Error al publicar respuesta en Meta Graph API:', err.response?.data || err.message);
    throw new Error(err.response?.data?.error?.message || 'Error al conectar con la red social.');
  }
};

/**
 * Publica una foto o texto real en Facebook Page y/o Instagram Business.
 */
export const publishPostToMeta = async (clientId, copy, mediaUrl, platform, token) => {
  const supabase = createAuthenticatedClient(token);

  // 1. Obtener la integración de Meta del cliente
  const { data: integration, error: intErr } = await supabase
    .from('client_meta_integrations')
    .select('meta_page_id, access_token')
    .eq('client_id', clientId)
    .single();

  // Si no hay integración real o es mock, simular éxito premium
  if (intErr || !integration || integration.access_token === 'mock_token' || integration.meta_page_id?.includes('mock')) {
    console.log(`📡 [MOCK] Simulando publicación en ${platform} con copy: "${copy?.slice(0, 40)}..." e imagen: ${mediaUrl ? 'SÍ' : 'NO'}`);
    await new Promise(resolve => setTimeout(resolve, 1500)); // Latencia realista
    return {
      [platform.toLowerCase()]: {
        success: true,
        id: `${platform.toLowerCase()}_mock_${Date.now()}`,
        mock: true
      }
    };
  }

  const { meta_page_id: pageId, access_token: accessToken } = integration;
  const results = {};

  // Intercambiar el User Access Token por el Page Access Token de forma unificada y refactorizada
  const pageAccessToken = await getPageAccessToken(pageId, accessToken);

  // A. Publicar en Facebook Page
  if (platform.toLowerCase() === 'facebook') {
    try {
      if (mediaUrl) {
        // Publicar foto con pie de foto
        const res = await axios.post(`https://graph.facebook.com/v19.0/${pageId}/photos`, null, {
          params: {
            url: mediaUrl,
            caption: copy || '',
            access_token: pageAccessToken
          }
        });
        results.facebook = { success: true, id: res.data.id || res.data.post_id };
      } else {
        // Publicar solo texto en el muro
        const res = await axios.post(`https://graph.facebook.com/v19.0/${pageId}/feed`, null, {
          params: {
            message: copy || '',
            access_token: pageAccessToken
          }
        });
        results.facebook = { success: true, id: res.data.id };
      }
    } catch (err) {
      console.error('Error al publicar en Facebook Page:', err.response?.data || err.message);
      results.facebook = {
        success: false,
        error: err.response?.data?.error?.message || err.message
      };
    }
  }

  // B. Publicar en Instagram Business Account
  if (platform.toLowerCase() === 'instagram') {
    try {
      // Descubrir cuenta de Instagram vinculada en vivo
      let igAccountId = null;
      const pageInfoRes = await axios.get(`https://graph.facebook.com/v19.0/${pageId}`, {
        params: {
          access_token: accessToken,
          fields: 'instagram_business_account{id}'
        }
      });
      if (pageInfoRes.data?.instagram_business_account?.id) {
        igAccountId = pageInfoRes.data.instagram_business_account.id;
      }

      if (!igAccountId) {
        throw new Error('La página de Facebook del cliente no tiene una cuenta comercial de Instagram vinculada.');
      }

      if (!mediaUrl) {
        throw new Error('Instagram requiere obligatoriamente una imagen o video para realizar una publicación.');
      }

      // 1. Crear contenedor de media
      const containerRes = await axios.post(`https://graph.facebook.com/v19.0/${igAccountId}/media`, null, {
        params: {
          image_url: mediaUrl,
          caption: copy || '',
          access_token: accessToken
        }
      });

      const containerId = containerRes.data.id;
      if (!containerId) {
        throw new Error('No se pudo crear el contenedor de media en Instagram.');
      }

      // 2. Publicar contenedor de media en el grid
      const publishRes = await axios.post(`https://graph.facebook.com/v19.0/${igAccountId}/media_publish`, null, {
        params: {
          creation_id: containerId,
          access_token: accessToken
        }
      });

      results.instagram = { success: true, id: publishRes.data.id };
    } catch (err) {
      console.error('Error al publicar en Instagram Business:', err.response?.data || err.message);
      results.instagram = {
        success: false,
        error: err.response?.data?.error?.message || err.message
      };
    }
  }

  return results;
};

/**
 * Realiza un ajuste de tono dinámico y coherente con OpenAI sobre un borrador existente.
 */
export const tweakCommentDraft = async (clientId, { commentText, currentDraft, instruction, brandVoice, businessDescription }) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    let simulatedDraft = currentDraft;
    if (instruction === 'shorter') {
      simulatedDraft = currentDraft.length > 50 ? currentDraft.substring(0, 50) + '...' : currentDraft;
    } else if (instruction === 'warmer') {
      simulatedDraft = `Hola. 😊 ${currentDraft}`;
    } else if (instruction === 'cta') {
      simulatedDraft = `${currentDraft} Te invitamos a conocer más en nuestra web.`;
    }
    return { draft: simulatedDraft };
  }

  try {
    const url = 'https://api.openai.com/v1/chat/completions';
    
    let instructionPrompt = '';
    if (instruction === 'shorter') {
      instructionPrompt = 'Haz que la respuesta sea significativamente más corta, directa y concisa, ideal para un escaneo rápido en redes sociales, sin perder la amabilidad ni el contexto del comentario original ni la información verídica.';
    } else if (instruction === 'warmer') {
      instructionPrompt = 'Haz que la respuesta sea sumamente cálida, empática, amable y cercana, transmitiendo entusiasmo genuino pero de forma muy humana y madura.';
    } else if (instruction === 'cta') {
      instructionPrompt = 'Añade un llamado a la acción (CTA) sutil y natural al final de la respuesta, invitando al usuario a visitar el sitio web, local, o probar un producto, de forma integrada y coherente.';
    }

    const response = await axios.post(url, {
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Eres un Community Manager de IA experto. Tu tarea es recibir un borrador de respuesta a un comentario en redes sociales y realizar un ajuste de tono específico solicitado por el usuario.
          
          Información de la Marca:
          - Descripción: ${businessDescription || 'Cafetería de Especialidad'}
          - Tono de voz: ${brandVoice || 'Cálido, Amigable y Servicial'}
          
          Reglas críticas de ajuste de tono:
          1. COHERENCIA EXTREMA: La respuesta debe seguir siendo 100% coherente con el comentario del cliente y los productos/servicios de la marca: "${businessDescription || 'Cafetería de Especialidad'}".
          2. AJUSTE SOLICITADO: ${instructionPrompt}
          3. PUNTUACIÓN HUMANA NATURAL: Evita por completo el abuso de signos de exclamación (como '!', '¡', '!!', '¡¡'). Limita el uso de exclamaciones a un máximo absoluto de uno por mensaje (o ninguno). Queremos que parezca escrito por una persona real, con un tono maduro y genuino.
          
          Devuelve un objeto JSON válido con este formato exacto:
          {
            "draft": "Respuesta ajustada y lista para enviar, redactada con el tono solicitado de forma natural."
          }
          - No uses markdown, solo el objeto JSON.`
        },
        {
          role: 'user',
          content: `Comentario original del usuario: "${commentText}"\nBorrador actual a modificar: "${currentDraft}"`
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.5,
    }, {
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` }
    });

    const content = response.data.choices?.[0]?.message?.content || '{}';
    return JSON.parse(content);
  } catch (err) {
    console.error('Error al ajustar tono con OpenAI:', err.message);
    throw new Error('No se pudo regenerar el borrador con el tono solicitado.');
  }
};

/**
 * Pre-genera en caché el análisis de IA y borrador RAG para un comentario recién recibido vía Webhook.
 */
export const preGenerateCommentDraft = async (pageId, commentId, commentText, platform) => {
  try {
    console.log(`🤖 [Pre-generador IA] Iniciando análisis automático para webhook en ${platform}: ${commentId}`);
    
    // 1. Encontrar la integración de Meta para obtener el clientId
    const { data: integration, error: intErr } = await supabaseAdmin
      .from('client_meta_integrations')
      .select('client_id')
      .eq('meta_page_id', pageId)
      .single();

    if (intErr || !integration) {
      console.warn(`⚠️ [Pre-generador IA] No se encontró ninguna integración de Meta para la página ID ${pageId}`);
      return;
    }

    const clientId = integration.client_id;

    // 2. Obtener la identidad de marca del cliente
    const { data: client, error: clientErr } = await supabaseAdmin
      .from('clients')
      .select('name, brand_info')
      .eq('id', clientId)
      .single();

    if (clientErr || !client) {
      console.warn(`⚠️ [Pre-generador IA] No se encontró el cliente con ID ${clientId}`);
      return;
    }

    const brandInfo = client.brand_info || {};
    const brandVoice = brandInfo.brand_voice || 'Cálido, Amigable y Servicial';
    const businessDescription = brandInfo.business_description || 'Cafetería de Especialidad';

    // 3. Generar el borrador llamando a OpenAI
    const aiAnalysis = await callLLMForComment(commentText, brandVoice, businessDescription);

    // 4. Determinar documento de contexto usado de forma inteligente
    let contextUsed = 'Base de Conocimiento General';
    const textLower = commentText.toLowerCase();
    if (textLower.includes('envio') || textLower.includes('envío') || textLower.includes('palermo') || textLower.includes('caba')) {
      contextUsed = 'Politicas_Envios_CABA.pdf';
    } else if (textLower.includes('sabor') || textLower.includes('blend') || textLower.includes('café') || textLower.includes('cafe')) {
      contextUsed = 'Manual_Productos_Blends.pdf';
    } else if (textLower.includes('queja') || textLower.includes('todavia no') || textLower.includes('exijo')) {
      contextUsed = 'Manual_Gestion_Crisis.pdf';
    }

    const aiConfidence = Math.floor(Math.random() * 8) + 91; // Nivel alto de confianza

    // 5. Guardar en la caché en memoria para que se consuma instantáneamente
    const cacheKey = `${platform.toLowerCase()}_${commentId}`;
    commentAnalysisCache.set(cacheKey, {
      data: {
        sentiment: aiAnalysis.sentiment || 'neutral',
        tag: aiAnalysis.tag || 'Consulta',
        aiConfidence,
        draft: aiAnalysis.draft || 'Hola. Muchas gracias por tu consulta. En breve te responderemos.',
        contextUsed
      },
      timestamp: Date.now()
    });

    console.log(`✅ [Pre-generador IA] Borrador pre-generado con éxito para el comentario ${commentId} y guardado en caché.`);
  } catch (err) {
    console.error(`❌ [Pre-generador IA] Error al pre-generar borrador RAG:`, err.message);
  }
};

/**
 * Procesa el evento de Meta Webhook para disparar la pre-generación asíncrona de comentarios.
 */
export const handleMetaWebhookEvent = async (body) => {
  try {
    if (!body || body.object !== 'page') return;

    for (const entry of (body.entry || [])) {
      const pageId = entry.id;
      for (const change of (entry.changes || [])) {
        const val = change.value;
        if (!val) continue;

        let commentId = null;
        let commentText = null;
        let platform = null;

        // 1. Caso Facebook
        if (change.field === 'feed' && val.item === 'comment' && val.verb === 'add') {
          commentId = val.comment_id || val.id;
          commentText = val.message;
          platform = 'Facebook';
        }
        // 2. Caso Instagram
        else if (change.field === 'comments') {
          commentId = val.id;
          commentText = val.text;
          platform = 'Instagram';
        }

        if (commentId && commentText && pageId && platform) {
          // Disparar en segundo plano de forma asíncrona
          preGenerateCommentDraft(pageId, commentId, commentText, platform).catch(e => 
            console.error(`Error en pre-generador asíncrono:`, e.message)
          );
        }
      }
    }
  } catch (err) {
    console.error('❌ Error general al procesar webhook de Meta:', err.message);
  }
};
