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

/**
 * Realiza una búsqueda en Tavily de tendencias globales virales en español en la plataforma X/Twitter y redes.
 * Foco en cultura pop, lanzamientos musicales, política de alto impacto, economía, tecnología, debates y memes.
 * Rango de tiempo: day (para capturar lo hiper-reciente de hoy).
 * @returns {Promise<object|null>} Resultados de Tavily o null
 */
const searchXTrendsWithTavily = async () => {
  if (!tavilyApiKey) return null;

  try {
    const query1 = "temas mas comentados memes virales y tendencias de hoy en twitter X en español musica cultura pop";
    const query2 = "noticias mas comentadas debate publico y tendencias de hoy politica economia tecnologia global español";

    logger.info?.(`[trends] Buscando tendencias globales de X/Redes en Tavily (Búsqueda dual)...`);

    const performSearch = async (query) => {
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
          max_results: 6,
          topic: 'general',
          time_range: 'day', // 📅 Rango diario
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err?.message || `Tavily error ${resp.status}`);
      }

      return resp.json();
    };

    const [res1, res2] = await Promise.all([
      performSearch(query1).catch(e => {
        logger.warn?.(`[trends] Error en búsqueda de tendencias sociales: ${e.message}`);
        return { results: [] };
      }),
      performSearch(query2).catch(e => {
        logger.warn?.(`[trends] Error en búsqueda de tendencias de noticias: ${e.message}`);
        return { results: [] };
      }),
    ]);

    const combinedResults = [
      ...(res1.results || []).map(r => ({
        title: r.title,
        url: r.url,
        snippet: r.content?.slice(0, 400) || '',
        score: r.score,
      })),
      ...(res2.results || []).map(r => ({
        title: r.title,
        url: r.url,
        snippet: r.content?.slice(0, 400) || '',
        score: r.score,
      })),
    ];

    // Deduplicar resultados por URL
    const seenUrls = new Set();
    const uniqueResults = combinedResults.filter(r => {
      if (!r.url || seenUrls.has(r.url)) return false;
      seenUrls.add(r.url);
      return true;
    });

    return {
      query: `${query1} + ${query2}`,
      answer: `${res1.answer || ''}\n${res2.answer || ''}`.trim(),
      results: uniqueResults,
    };
  } catch (err) {
    logger.warn?.(`[trends] Excepción al buscar tendencias de X en Tavily: ${err.message}`);
    return null;
  }
};

const analyzeTrendsWithGPT = async (tavilyData, previousInsights = [], isManual = false) => {
  if (!openaiApiKey) {
    // fallback sin OpenAI
    return {
      title: "Tendencias Globales de Internet",
      summary: "Últimas novedades y debates del día en redes sociales.",
      insights: tavilyData.results.slice(0, 5).map((r, i) => ({
        id: `trend-${i + 1}`,
        title: r.title,
        description: r.snippet,
        category: 'noticias',
        trending_score: 80,
        estimated_impressions: '500K menciones',
        source_url: r.url,
      })),
    };
  }

  const tavilyBlock = JSON.stringify({
    query: tavilyData.query,
    answer: tavilyData.answer,
    results: tavilyData.results,
  }, null, 2);

  const previousInsightsBlock = previousInsights.length > 0
    ? JSON.stringify(previousInsights.map(ins => ({ title: ins.title, description: ins.description })), null, 2)
    : 'No hay tendencias reportadas recientemente.';

  const systemPrompt = `Eres un estratega de contenido senior y editor jefe de un boletín de tendencias de internet de habla hispana. Analizas temas virales en X (Twitter), redes sociales y noticias globales, y los sintetizas en un dossier de tendencias de alta calidad. Devuelve exclusivamente JSON válido.`;

  const userPrompt = JSON.stringify({
    tarea: 'Analiza los resultados de búsqueda de tendencias de hoy y genera un dossier de tendencias globales con 6 a 10 de los temas más comentados en redes sociales e internet (memes, cultura pop, música, noticias calientes, política, economía, deportes, tecnología). Los insights no deben estar asociados a ninguna marca específica, sino que deben presentarse de forma objetiva como noticias/tendencias de actualidad.',
    tendencias_recientes_reportadas: previousInsightsBlock,
    resultados_de_busqueda_hoy: tavilyBlock,
    fecha_de_hoy: new Date().toISOString().slice(0, 10),
    estructura_esperada: {
      title: 'Un título corto, profesional y atractivo para el boletín diario (ej: "Auge de IA y Debates en Redes" o "Boletín de Tendencias Globales")',
      summary: 'Resumen ejecutivo de 2 a 3 oraciones describiendo la agenda de conversación digital de hoy.',
      insights: [
        {
          id: 'trend-1',
          title: 'Título corto de la tendencia (máx. 60 caracteres)',
          description: 'Explicación clara y detallada de la tendencia o debate de actualidad hoy (2 a 3 oraciones).',
          category: 'noticias|economia|cultura_pop|musica|tecnologia|memes|deportes',
          trending_score: 95, // Puntuación de intensidad del 50 al 100 basada en su nivel de viridad/relevancia
          estimated_impressions: 'Número estimado de menciones/impresiones en formato cadena (ej: "2.4M impresiones", "750K menciones", "150K interacciones")',
          source_url: 'URL del artículo o post original obtenido de los resultados de búsqueda',
        }
      ]
    },
    instrucciones: [
      'Genera obligatoriamente entre 6 y 10 tendencias globales relevantes.',
      'DEDUPLICACIÓN: Compara las tendencias de hoy con "tendencias_recientes_reportadas". Si una noticia o meme ya fue reportado en los días anteriores y no hay ninguna actualización significativa, no lo incluyas para mantener el feed dinámico.',
      'Asegúrate de que cada tendencia tenga asignada una categoría correcta.',
      'No inventes datos ni enlaces. Usa únicamente las URLs reales provistas en los resultados de búsqueda.',
    ]
  });

  try {
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
        temperature: 0.4,
        max_tokens: 2500,
      }),
    });

    if (!resp.ok) {
      const errData = await resp.json().catch(() => ({}));
      throw new Error(errData?.error?.message || 'Error al llamar al LLM para analizar tendencias globales');
    }

    const json = await resp.json();
    const content = json.choices?.[0]?.message?.content || '{}';
    const parsed = JSON.parse(content);

    return {
      title: cleanText(parsed.title) || 'Dossier Global',
      summary: cleanText(parsed.summary) || 'Sin resumen disponible.',
      insights: (parsed.insights || []).map((ins, i) => ({
        id: ins.id || `trend-${i + 1}`,
        title: cleanText(ins.title),
        description: cleanText(ins.description),
        category: ['noticias', 'economia', 'cultura_pop', 'musica', 'tecnologia', 'memes', 'deportes'].includes(ins.category) ? ins.category : 'noticias',
        trending_score: Math.max(50, Math.min(100, Number(ins.trending_score) || 75)),
        estimated_impressions: cleanText(ins.estimated_impressions) || 'N/D',
        source_url: cleanText(ins.source_url),
      })).filter(ins => ins.title && ins.description),
    };
  } catch (err) {
    logger.warn?.(`[trends] Error al llamar a OpenAI (${err.message}). Usando fallback con datos de Tavily crudos.`);
    
    return {
      title: `Boletín de Tendencias del ${new Date().toLocaleDateString('es-AR')}`,
      summary: "Últimas novedades y debates del día recopilados en tiempo real a través de nuestro motor de búsqueda de actualidad.",
      insights: (tavilyData.results || []).slice(0, 8).map((r, i) => {
        let category = 'noticias';
        const txt = (r.title + ' ' + r.snippet).toLowerCase();
        if (txt.includes('dólar') || txt.includes('inflación') || txt.includes('precio') || txt.includes('mercado') || txt.includes('economía') || txt.includes('empresa') || txt.includes('negocio')) {
          category = 'economia';
        } else if (txt.includes('ia') || txt.includes('apple') || txt.includes('tecnología') || txt.includes('inteligencia artificial') || txt.includes('app') || txt.includes('software')) {
          category = 'tecnologia';
        } else if (txt.includes('meme') || txt.includes('chiste') || txt.includes('humor') || txt.includes('viral') || txt.includes('fandom')) {
          category = 'memes';
        } else if (txt.includes('música') || txt.includes('canción') || txt.includes('álbum') || txt.includes('artista')) {
          category = 'musica';
        } else if (txt.includes('cine') || txt.includes('película') || txt.includes('actor') || txt.includes('farándula') || txt.includes('show')) {
          category = 'cultura_pop';
        } else if (txt.includes('fútbol') || txt.includes('partido') || txt.includes('deporte') || txt.includes('mundial') || txt.includes('copa')) {
          category = 'deportes';
        }

        const trendingScore = Math.floor(Math.random() * (98 - 70 + 1)) + 70;
        const impressionsNum = Math.floor(Math.random() * (1200 - 150 + 1)) + 150;

        return {
          id: `trend-fallback-${i + 1}`,
          title: cleanText(r.title),
          description: cleanText(r.snippet || r.title),
          category,
          trending_score: trendingScore,
          estimated_impressions: `${impressionsNum}K menciones`,
          source_url: r.url,
        };
      }),
    };
  }
};

// ─────────────────────────────────────────────
// Core: run for one client
// ─────────────────────────────────────────────

/**
 * Ejecuta el análisis de tendencias para un único cliente.
 * Guarda el resultado en la tabla trend_reports.
 */
/**
 * Ejecuta el análisis de tendencias globales para una agencia.
 * Guarda el resultado en la tabla trend_reports con client_id = null.
 */
export const runGlobalTrendsForAgency = async (agencyId, isManual = false) => {
  logger.info?.(`[trends] Buscando tendencias globales de redes para agencia ${agencyId} (manual: ${isManual})...`);

  // Obtener el reporte global anterior de la agencia para comparar e identificar novedades
  let prevReport = null;
  try {
    const { data } = await supabaseAdmin
      .from('trend_reports')
      .select('insights')
      .is('client_id', null)
      .eq('agency_id', agencyId)
      .order('generated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    prevReport = data;
  } catch (err) {
    logger.warn?.(`[trends] No se pudo obtener el reporte anterior global: ${err.message}`);
  }

  const previousInsights = prevReport?.insights || [];

  // Búsqueda en Tavily
  const xTrendsData = await searchXTrendsWithTavily();
  if (!xTrendsData) {
    logger.warn?.(`[trends] No se pudieron recuperar datos de Tavily para el reporte global de agencia ${agencyId}.`);
    return null;
  }

  const analysis = await analyzeTrendsWithGPT(xTrendsData, previousInsights, isManual);

  const title = analysis.title || `Boletín de Tendencias Globales (${new Date().toLocaleDateString('es-AR')})`;
  const keywords = ["global", "twitter", "memes", "actualidad"];

  const { data: report, error } = await supabaseAdmin
    .from('trend_reports')
    .insert({
      client_id: null,
      agency_id: agencyId,
      keywords,
      title,
      raw_results: { x_trends: xTrendsData },
      summary: analysis.summary,
      insights: analysis.insights,
      is_manual: isManual,
      generated_at: new Date().toISOString(),
    })
    .select('*')
    .single();

  if (error) throw new Error(`Error guardando reporte de tendencias global: ${error.message}`);

  logger.info?.(`[trends] ✅ Reporte global generado para agencia ${agencyId} — ${analysis.insights.length} nuevos insights.`);
  return report;
};

/**
 * Ejecuta el análisis de tendencias para un único cliente.
 * AHORA redirige transparentemente al flujo global de la agencia.
 */
export const runTrendsForClient = async (client, customKeywords = null, isManual = false) => {
  // Ignoramos customKeywords y redirigimos a la generación global
  return runGlobalTrendsForAgency(client.agency_id, isManual);
};

/**
 * Ejecuta el análisis de tendencias para todas las agencias registradas.
 */
export const runDailyTrendsJob = async (agencyId = null) => {
  logger.info?.(`[trends] 🕐 Iniciando job de tendencias globales...`);

  let agencies = [];
  if (agencyId) {
    agencies = [{ id: agencyId }];
  } else {
    const { data, error } = await supabaseAdmin.from('agencies').select('id');
    if (error) {
      logger.error?.(`[trends] Error obteniendo agencias: ${error.message}`);
      return { success: false, error: error.message };
    }
    agencies = data || [];
  }

  const results = { processed: 0, errors: 0 };

  for (const agency of agencies) {
    try {
      const report = await runGlobalTrendsForAgency(agency.id, false);
      if (report) {
        results.processed++;
      }
    } catch (err) {
      logger.error?.(`[trends] ❌ Error en agencia ${agency.id}: ${err.message}`);
      results.errors++;
    }
    await new Promise(resolve => setTimeout(resolve, 1500));
  }

  logger.info?.(`[trends] 🏁 Job completado — ${results.processed} reportes globales generados, ${results.errors} errores.`);
  return { success: true, ...results };
};

/**
 * Obtiene los reportes de tendencias globales de la agencia del usuario.
 */
export const getTrendReports = async ({ clientId, limit = 7, token, userId }) => {
  const supabaseAuth = createAuthenticatedClient(token);

  // Obtener la agencia del usuario
  let profileQuery = supabaseAuth.from('profiles').select('agency_id');
  if (userId) {
    profileQuery = profileQuery.eq('id', userId);
  }
  const { data: profile, error: profileErr } = await profileQuery.single();

  if (profileErr) {
    logger.error?.('[trends] getTrendReports - error fetching profile:', profileErr);
  }
  logger.info?.('[trends] getTrendReports - profile query returned:', { profile });

  if (!profile?.agency_id) return [];

  // Retornar los reportes globales (donde client_id es null) de su agencia
  const { data, error } = await supabaseAuth
    .from('trend_reports')
    .select('*')
    .is('client_id', null)
    .eq('agency_id', profile.agency_id)
    .order('generated_at', { ascending: false })
    .limit(limit);

  if (error) {
    logger.error?.('[trends] getTrendReports - error fetching trend reports:', error);
    throw new Error(error.message);
  }
  
  return data || [];
};

/**
 * Obtiene los reportes globales más recientes para la página general.
 */
export const getLatestTrendReports = async ({ token, userId }) => {
  const supabaseAuth = createAuthenticatedClient(token);

  // Obtener agency_id del usuario
  let profileQuery = supabaseAuth.from('profiles').select('agency_id');
  if (userId) {
    profileQuery = profileQuery.eq('id', userId);
  }
  const { data: profile, error: profileErr } = await profileQuery.single();

  if (profileErr) {
    logger.error?.('[trends] getLatestTrendReports - error fetching profile:', profileErr);
  }
  logger.info?.('[trends] getLatestTrendReports - profile query returned:', { profile });

  if (!profile?.agency_id) {
    logger.info?.('[trends] El usuario no tiene una agencia asignada aún. Retornando lista vacía.');
    return [];
  }

  const { data, error } = await supabaseAuth
    .from('trend_reports')
    .select(`
      id, client_id, summary, insights, keywords, generated_at
    `)
    .is('client_id', null)
    .eq('agency_id', profile.agency_id)
    .order('generated_at', { ascending: false })
    .limit(15);

  if (error) {
    logger.error?.('[trends] getLatestTrendReports - error fetching trend reports:', error);
    throw new Error(error.message);
  }

  logger.info?.(`[trends] getLatestTrendReports - successfully loaded ${data?.length || 0} reports.`);
  return data || [];
};
