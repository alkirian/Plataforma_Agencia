import { supabaseAdmin, createAuthenticatedClient } from '../config/supabaseClient.js';
import { logger } from '../utils/logger.js';

const openaiApiKey = process.env.OPENAI_API_KEY;
const tavilyApiKey = process.env.TAVILY_API_KEY;

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

const asList = value => (Array.isArray(value) ? value.filter(Boolean) : []);
const cleanText = value => String(value || '').trim();

/**
 * Genera keywords de búsqueda a partir del brand_info del cliente.
 * @param {object} client - Objeto cliente con industry y brand_info
 * @returns {string[]} Array de keywords
 */
const buildKeywordsFromClient = (client) => {
  const brandInfo = client.brand_info || {};
  const keywords = new Set();

  if (client.industry) keywords.add(client.industry);

  asList(brandInfo.content_pillars).forEach(p => {
    if (cleanText(p).length > 2) keywords.add(cleanText(p));
  });

  if (brandInfo.business_description) {
    // extraer primeras 3 palabras significativas
    const words = cleanText(brandInfo.business_description)
      .split(/\s+/)
      .filter(w => w.length > 4)
      .slice(0, 2);
    words.forEach(w => keywords.add(w));
  }

  asList(brandInfo.products_services).slice(0, 2).forEach(p => {
    if (cleanText(p).length > 2) keywords.add(cleanText(p));
  });

  return [...keywords].slice(0, 5);
};

// ─────────────────────────────────────────────
// Tavily search
// ─────────────────────────────────────────────

/**
 * Realiza una búsqueda en Tavily para un conjunto de keywords.
 * @param {string[]} keywords
 * @returns {Promise<object[]>} Resultados crudos de Tavily
 */
const searchWithTavily = async (keywords) => {
  if (!tavilyApiKey) {
    throw new Error('TAVILY_API_KEY no está configurada.');
  }

  // Consulta limpia sin el año para evitar redundancia con el filtro de mes
  const query = `tendencias ${keywords.join(' ')}`;

  const resp = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tavilyApiKey}`,
    },
    body: JSON.stringify({
      query,
      search_depth: 'basic',
      include_answer: true,
      include_raw_content: false,
      max_results: 8,
      topic: 'general',
      time_range: 'month', // 📅 Búsqueda hiper-reciente: último mes
    }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err?.message || `Tavily error ${resp.status}`);
  }

  const json = await resp.json();
  return {
    query,
    answer: json.answer || '',
    results: (json.results || []).map(r => ({
      title: r.title,
      url: r.url,
      snippet: r.content?.slice(0, 400) || '',
      score: r.score,
    })),
  };
};

// ─────────────────────────────────────────────
// GPT Analysis
// ─────────────────────────────────────────────

/**
 * Analiza los resultados de Tavily con GPT y genera insights accionables.
 */
const analyzeTrendsWithGPT = async (client, tavilyData, previousInsights = [], isCustomSearch = false) => {
  if (!openaiApiKey) {
    // fallback sin OpenAI
    return {
      summary: `Tendencias detectadas para ${client.name} en ${client.industry || 'su industria'}.`,
      insights: tavilyData.results.slice(0, 3).map((r, i) => ({
        id: `insight-${i + 1}`,
        title: r.title,
        description: r.snippet,
        relevance: 'media',
        suggested_action: 'Crear contenido sobre este tema.',
        source_url: r.url,
      })),
    };
  }

  const brandInfo = client.brand_info || {};
  const contextBlock = JSON.stringify({
    cliente: client.name,
    industria: client.industry || 'sin especificar',
    audiencia: brandInfo.target_audience || 'sin especificar',
    tono: brandInfo.brand_voice || 'sin especificar',
    pilares: asList(brandInfo.content_pillars),
    plataformas: asList(brandInfo.preferred_platforms),
  }, null, 2);

  const tavilyBlock = JSON.stringify({
    query: tavilyData.query,
    answer: tavilyData.answer,
    results: tavilyData.results,
  }, null, 2);

  const previousInsightsBlock = previousInsights.length > 0
    ? JSON.stringify(previousInsights.map(ins => ({ title: ins.title, description: ins.description })), null, 2)
    : 'No hay tendencias reportadas anteriormente para este cliente.';

  const systemPrompt = `Eres un estratega de contenido senior. Analizas tendencias recientes de mercado y las conviertes en oportunidades de contenido para marcas. Devuelve exclusivamente JSON válido.`;

  const userPrompt = JSON.stringify({
    tarea: isCustomSearch
      ? `Analiza las tendencias encontradas para los términos de búsqueda específicos "${tavilyData.query}" y genera insights accionables para esta marca.`
      : 'Analiza las tendencias encontradas y genera insights accionables para esta marca. Compara estas tendencias con las que ya reportamos anteriormente y solo genera nuevas tendencias si son realmente novedosas y diferentes.',
    identidad_del_cliente: contextBlock,
    tendencias_ya_reportadas: previousInsightsBlock,
    resultados_de_busqueda: tavilyBlock,
    fecha_de_hoy: new Date().toISOString().slice(0, 10),
    estructura_esperada: {
      title: 'Un título corto, altamente profesional y corporativo del reporte (de 3 a 5 palabras, ej: "Auge de E-commerce Sostenible" o "Tendencias en IA y Marketing")',
      summary: 'Párrafo de 2-3 oraciones resumiendo el estado de las tendencias. Si no hay nada nuevo, escribe: "No se encontraron nuevas tendencias hoy respecto al análisis anterior."',
      insights: [
        {
          id: 'insight-1',
          title: 'Título corto de la tendencia (máx. 60 chars)',
          description: 'Descripción de la tendencia y por qué es relevante para la marca (2-3 oraciones)',
          relevance: 'alta|media|baja',
          suggested_action: 'Acción concreta que la marca puede tomar (ej: "Crear un carrusel sobre...")',
          source_url: 'URL de la fuente o vacío',
        },
      ],
    },
    instrucciones: isCustomSearch
      ? [
          'Crea un título muy profesional y descriptivo para el reporte y colócalo en el campo "title". Evita términos fantasiosos u ostentosos.',
          'Genera entre 3 y 6 insights accionables basados en los resultados de búsqueda hiper-recientes.',
          'Prioriza tendencias con relevance alta.',
          'Las suggested_action deben ser específicas y ejecutables.',
          'Adapta el tono de las sugerencias al brand_voice del cliente.',
          'No inventes datos. Basate solo en los resultados proporcionados.',
        ]
      : [
          'Crea un título muy profesional y descriptivo para el reporte y colócalo en el campo "title". Evita términos fantasiosos u ostentosos.',
          'Genera entre 3 y 6 insights SOLO si hay tendencias de este mes que sean genuinamente nuevas o presenten un ángulo diferente a las tendencias_ya_reportadas.',
          'Si las tendencias web obtenidas hoy son sustancialmente iguales o repetitivas comparadas con las tendencias_ya_reportadas, debes devolver el array de "insights" vacío: [].',
          'Prioriza tendencias con relevance alta.',
          'Las suggested_action deben ser específicas y ejecutables.',
          'Adapta el tono de las sugerencias al brand_voice del cliente.',
          'No inventes datos. Basate solo en los resultados proporcionados.',
        ],
  });

  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiApiKey}` },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3, // temperatura más baja para mayor fidelidad en la comparación
      max_tokens: 2000,
    }),
  });

  if (!resp.ok) {
    const errData = await resp.json().catch(() => ({}));
    throw new Error(errData?.error?.message || 'Error al llamar al LLM para analizar tendencias');
  }

  const json = await resp.json();
  const content = json.choices?.[0]?.message?.content || '{}';
  const parsed = JSON.parse(content);

  return {
    title: cleanText(parsed.title) || '',
    summary: cleanText(parsed.summary) || 'Sin resumen disponible.',
    insights: (parsed.insights || []).map((ins, i) => ({
      id: ins.id || `insight-${i + 1}`,
      title: cleanText(ins.title),
      description: cleanText(ins.description),
      relevance: ['alta', 'media', 'baja'].includes(ins.relevance) ? ins.relevance : 'media',
      suggested_action: cleanText(ins.suggested_action),
      source_url: cleanText(ins.source_url),
    })).filter(ins => ins.title && ins.description),
  };
};

// ─────────────────────────────────────────────
// Core: run for one client
// ─────────────────────────────────────────────

/**
 * Ejecuta el análisis de tendencias para un único cliente.
 * Guarda el resultado en la tabla trend_reports.
 */
export const runTrendsForClient = async (client, customKeywords = null, isManual = false) => {
  let keywords = [];
  let isCustomSearch = false;

  if (customKeywords) {
    if (Array.isArray(customKeywords)) {
      keywords = customKeywords.filter(Boolean);
    } else if (typeof customKeywords === 'string' && customKeywords.trim()) {
      keywords = customKeywords
        .split(',')
        .map(k => k.trim())
        .filter(Boolean);
    }
    if (keywords.length > 0) {
      isCustomSearch = true;
    }
  }

  // Si no hay palabras clave personalizadas, usamos el flujo automático original
  if (keywords.length === 0) {
    keywords = buildKeywordsFromClient(client);
  }

  if (keywords.length === 0) {
    logger.warn?.(`[trends] Cliente ${client.id} no tiene suficiente brand_info. Saltando.`);
    return null;
  }

  logger.info?.(`[trends] Buscando tendencias para "${client.name}" — keywords: ${keywords.join(', ')} (isCustomSearch: ${isCustomSearch}, isManual: ${isManual})`);

  // Obtener el reporte anterior para comparar e identificar si hay novedades
  // Si es una búsqueda customizada, no comparamos contra reportes generales anteriores para no filtrar
  let prevReport = null;
  if (!isCustomSearch) {
    try {
      const { data } = await supabaseAdmin
        .from('trend_reports')
        .select('insights')
        .eq('client_id', client.id)
        .order('generated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      prevReport = data;
    } catch (err) {
      logger.warn?.(`[trends] No se pudo obtener el reporte anterior para comparar: ${err.message}`);
    }
  }

  const previousInsights = prevReport?.insights || [];

  const tavilyData = await searchWithTavily(keywords);
  const analysis = await analyzeTrendsWithGPT(client, tavilyData, previousInsights, isCustomSearch);

  let title = analysis.title || '';
  if (!title) {
    if (keywords.length > 0) {
      title = `Análisis: ${keywords.slice(0, 3).join(', ')}`;
    } else {
      title = `Análisis de Tendencias (${new Date().toLocaleDateString('es-AR')})`;
    }
  }

  if (!analysis.insights || analysis.insights.length === 0) {
    if (isManual) {
      // Guardar de todas formas para indicar término exitoso de la búsqueda manual y detener el polling
      const { data: report, error } = await supabaseAdmin
        .from('trend_reports')
        .insert({
          client_id: client.id,
          agency_id: client.agency_id,
          keywords,
          title,
          raw_results: tavilyData,
          summary: analysis.summary || "No se encontraron nuevas tendencias hoy respecto al análisis anterior.",
          insights: [],
          generated_at: new Date().toISOString(),
        })
        .select('*')
        .single();

      if (error) throw new Error(`Error guardando reporte de tendencias vacío manual: ${error.message}`);
      logger.info?.(`[trends] ℹ️ No se encontraron nuevas tendencias para "${client.name}" (manual). Reporte vacío guardado.`);
      return report;
    } else {
      logger.info?.(`[trends] ℹ️ No se encontraron nuevas tendencias para "${client.name}". Saltando guardado en Base de Datos.`);
      return null;
    }
  }

  const { data: report, error } = await supabaseAdmin
    .from('trend_reports')
    .insert({
      client_id: client.id,
      agency_id: client.agency_id,
      keywords,
      title,
      raw_results: tavilyData,
      summary: analysis.summary,
      insights: analysis.insights,
      generated_at: new Date().toISOString(),
    })
    .select('*')
    .single();

  if (error) throw new Error(`Error guardando reporte de tendencias: ${error.message}`);

  logger.info?.(`[trends] ✅ Reporte generado para "${client.name}" — ${analysis.insights.length} nuevos insights.`);
  return report;
};

// ─────────────────────────────────────────────
// Core: run for all clients of an agency
// ─────────────────────────────────────────────

/**
 * Ejecuta el análisis de tendencias para todos los clientes de una agencia.
 * Si no se pasa agencyId, procesa todos los clientes activos (uso en cron global).
 */
export const runDailyTrendsJob = async (agencyId = null) => {
  logger.info?.(`[trends] 🕐 Iniciando job de tendencias${agencyId ? ` para agency ${agencyId}` : ' global'}...`);

  let query = supabaseAdmin
    .from('clients')
    .select('id, name, industry, agency_id, brand_info')
    .not('brand_info', 'is', null);

  if (agencyId) query = query.eq('agency_id', agencyId);

  const { data: clients, error } = await query;

  if (error) {
    logger.error?.(`[trends] Error obteniendo clientes: ${error.message}`);
    return { success: false, error: error.message };
  }

  const results = { processed: 0, errors: 0, reports: [] };

  for (const client of clients || []) {
    try {
      const report = await runTrendsForClient(client);
      if (report) {
        results.processed++;
        results.reports.push({ clientId: client.id, reportId: report.id });
      }
    } catch (err) {
      logger.error?.(`[trends] ❌ Error con cliente ${client.name}: ${err.message}`);
      results.errors++;
    }

    // Pequeña pausa para no saturar las APIs
    await new Promise(resolve => setTimeout(resolve, 1500));
  }

  logger.info?.(`[trends] 🏁 Job completado — ${results.processed} reportes generados, ${results.errors} errores.`);
  return { success: true, ...results };
};

// ─────────────────────────────────────────────
// Read reports
// ─────────────────────────────────────────────

/**
 * Obtiene los reportes de tendencias de un cliente.
 * Usa RLS vía token del usuario para autorización.
 */
export const getTrendReports = async ({ clientId, limit = 7, token }) => {
  const supabaseAuth = createAuthenticatedClient(token);

  const { data, error } = await supabaseAuth
    .from('trend_reports')
    .select('*')
    .eq('client_id', clientId)
    .order('generated_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  
  return data || [];
};

/**
 * Obtiene el reporte más reciente de cada cliente de la agencia del usuario.
 */
export const getLatestTrendReports = async ({ token }) => {
  const supabaseAuth = createAuthenticatedClient(token);

  // Obtener agency_id del usuario
  const { data: profile } = await supabaseAuth
    .from('profiles')
    .select('agency_id')
    .single();

  if (!profile?.agency_id) {
    logger.info?.('[trends] El usuario no tiene una agencia asignada aún. Retornando lista vacía.');
    return [];
  }

  // Obtener el reporte más reciente por cliente
  const { data, error } = await supabaseAuth
    .from('trend_reports')
    .select(`
      id, client_id, summary, insights, keywords, generated_at,
      clients (id, name, industry)
    `)
    .eq('agency_id', profile.agency_id)
    .order('generated_at', { ascending: false })
    .limit(50);

  if (error) throw new Error(error.message);

  // Filtrar reportes que tengan al menos 1 insight (no vacíos) y deduplicar
  const seen = new Set();
  return (data || [])
    .filter(r => Array.isArray(r.insights) && r.insights.length > 0)
    .filter(r => {
      if (seen.has(r.client_id)) return false;
      seen.add(r.client_id);
      return true;
    });
};
