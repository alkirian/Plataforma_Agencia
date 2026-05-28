import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '../config/supabaseClient.js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_KEY;
const openaiApiKey = process.env.OPENAI_API_KEY;

const createAuthenticatedClient = (token) => {
  if (!token) throw new Error('Token requerido');
  return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
};

const fetchWithTimeout = async (url, options = {}, timeout = 90000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    if (error.name === 'AbortError') {
      throw new Error('Tiempo de espera agotado al conectar con el servicio de IA (Timeout)');
    }
    throw error;
  }
};

const embedText = async (text) => {
  const resp = await fetchWithTimeout('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiApiKey}` },
    body: JSON.stringify({ model: 'text-embedding-3-small', input: text })
  });
  if (!resp.ok) throw new Error('Error al generar embeddings');
  const json = await resp.json();
  return json.data?.[0]?.embedding || [];
};

const scheduleIdeasSchema = {
  type: "object",
  properties: {
    ideas: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          creative_idea: { type: "string" },
          copy: { type: "string" },
          scheduled_at: { type: "string" },
          channel: { type: "string" },
          format: { type: "string" },
          objective: { type: "string" },
          status: { type: "string" }
        },
        required: ["title", "creative_idea", "copy", "scheduled_at", "channel", "format", "objective", "status"],
        additionalProperties: false
      }
    }
  },
  required: ["ideas"],
  additionalProperties: false
};

const trendCopySchema = {
  type: "object",
  properties: {
    title: { type: "string" },
    copy: { type: "string" },
    creative_idea: { type: "string" },
    objective: { type: "string" }
  },
  required: ["title", "copy", "creative_idea", "objective"],
  additionalProperties: false
};

const chatResponseSchema = {
  type: "object",
  properties: {
    response: { type: "string" },
    hasCommands: { type: "boolean" },
    commands: {
      type: "array",
      items: {
        type: "object",
        properties: {
          action: { type: "string" },
          itemId: { type: "string" },
          date: { type: "string" },
          status: { type: "string" },
          title: { type: "string" },
          channel: { type: "string" },
          copy: { type: "string" },
          updates_brand_voice: { type: "string" },
          updates_target_audience: { type: "string" },
          updates_business_description: { type: "string" },
          updates_reference_style: { type: "string" },
          updates_brand_values: { type: "string" },
          updates_competitors: { type: "string" },
          keywords: { type: "string" },
          commentId: { type: "string" },
          replyText: { type: "string" },
          platform: { type: "string" }
        },
        required: [
          "action", "itemId", "date", "status", "title", "channel", "copy",
          "updates_brand_voice", "updates_target_audience", "updates_business_description", "updates_reference_style", "updates_brand_values", "updates_competitors",
          "keywords", "commentId", "replyText", "platform"
        ],
        additionalProperties: false
      }
    }
  },
  required: ["response", "hasCommands", "commands"],
  additionalProperties: false
};


const callLLM = async ({ systemPrompt, userPrompt, responseSchema }) => {
  const bodyPayload = {
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.65,
    max_tokens: 4500,
  };

  if (responseSchema) {
    bodyPayload.response_format = {
      type: 'json_schema',
      json_schema: {
        name: 'response_schema',
        strict: true,
        schema: responseSchema
      }
    };
  } else {
    bodyPayload.response_format = { type: 'json_object' };
  }

  const resp = await fetchWithTimeout('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiApiKey}` },
    body: JSON.stringify(bodyPayload),
  });
  if (!resp.ok) {
    const details = await resp.json().catch(() => ({}));
    throw new Error(details?.error?.message || 'Error al llamar al LLM');
  }
  const json = await resp.json();
  return json.choices?.[0]?.message?.content || '';
};

const asList = value => Array.isArray(value) ? value.filter(Boolean) : [];

const cleanText = value => String(value || '').trim();

const normalizeSourceLinks = value => (
  Array.isArray(value) ? value : []
).map((source, index) => ({
  id: cleanText(source?.id) || `source-${index + 1}`,
  type: cleanText(source?.type) || 'other',
  url: cleanText(source?.url),
  notes: cleanText(source?.notes),
})).filter(source => source.url);

const hasUsefulIdentity = (client, brandInfo) => {
  const fields = [
    client?.name,
    client?.industry,
    brandInfo?.business_description,
    brandInfo?.target_audience,
    brandInfo?.brand_voice,
    brandInfo?.reference_style,
    ...asList(brandInfo?.content_pillars),
    ...asList(brandInfo?.content_goals),
    ...asList(brandInfo?.products_services),
  ];

  const usefulChars = fields
    .map(cleanText)
    .filter(value => value && !['qwd', 'dqwd', 'test', 'prueba'].includes(value.toLowerCase()))
    .join(' ');

  return usefulChars.length >= 80;
};

const containsPlaceholder = idea => {
  const text = `${idea?.title || ''} ${idea?.copy || ''} ${idea?.objective || ''}`.toLowerCase();
  return [
    'texto completo del post',
    'titulo descriptivo',
    'idea creativa #',
    'cta: guarda este post',
    'pieza sin titulo',
    'no especificado',
  ].some(marker => text.includes(marker));
};

const GEMINI_ASPECT_RATIO_ENUM = {
  '1:1': 'ASPECT_RATIO_1_1',
  '2:3': 'ASPECT_RATIO_2_3',
  '3:2': 'ASPECT_RATIO_3_2',
  '3:4': 'ASPECT_RATIO_3_4',
  '4:3': 'ASPECT_RATIO_4_3',
  '4:5': 'ASPECT_RATIO_4_5',
  '5:4': 'ASPECT_RATIO_5_4',
  '9:16': 'ASPECT_RATIO_9_16',
  '16:9': 'ASPECT_RATIO_16_9',
  '21:9': 'ASPECT_RATIO_21_9',
};

export const generateScheduleIdeas = async ({ clientId, userPrompt, monthContext, quantity = 8, targetDate, token }) => {
  const supabaseAuth = createAuthenticatedClient(token);
  const { data: client, error: clientErr } = await supabaseAuth
    .from('clients')
    .select('id, name, industry, agency_id, brand_info')
    .eq('id', clientId)
    .single();
  if (clientErr) throw new Error(clientErr.message);

  const { data: existingItems, error: scheduleErr } = await supabaseAuth
    .from('schedule_items')
    .select('title, scheduled_at, channel, status')
    .eq('client_id', clientId)
    .order('scheduled_at', { ascending: true })
    .limit(40);
  if (scheduleErr) throw new Error(scheduleErr.message);

  if (!openaiApiKey) {
    const baseDate = new Date();
    const pad = n => String(n).padStart(2, '0');
    const nextDate = offset => {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + offset * 4);
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    };

    return Array.from({ length: 5 }, (_, i) => ({
      title: `${userPrompt} - Idea ${i + 1} (${client.name})`,
      copy: `${userPrompt} para ${client.name}.\n\nIdea creativa #${i + 1} pensada desde la identidad del cliente.\n\nCTA: Guarda este post y comenta si quieres ver mas.`,
      scheduled_at: nextDate(i + 1),
      channel: ['IG', 'TikTok', 'LinkedIn', 'FB'][i % 4],
      format: ['Reel', 'Carrusel', 'Post estatico', 'Historia'][i % 4],
      objective: 'Aumentar reconocimiento y generar conversacion.',
      status: 'Pendiente',
    }));
  }

  let matches = [];
  try {
    const queryEmbedding = await embedText(userPrompt);
    const { data, error: matchErr } = await supabaseAuth.rpc('match_document_chunks', {
      query_embedding: queryEmbedding,
      match_client_id: clientId,
      match_count: 8,
    });
    if (!matchErr) matches = data || [];
  } catch (error) {
    console.warn('[ai] No se pudo usar contexto documental:', error.message);
  }

  const now = new Date();
  const currentMonth = now.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1).toLocaleString('es-ES', { month: 'long', year: 'numeric' });
  const currentYear = now.getFullYear();
  const currentMonthNum = now.getMonth() + 1;
  const nextMonthNum = now.getMonth() + 2 > 12 ? 1 : now.getMonth() + 2;
  const nextMonthYear = now.getMonth() + 2 > 12 ? currentYear + 1 : currentYear;
  const brandInfo = client.brand_info || {};
  const sourceLinks = normalizeSourceLinks(brandInfo.source_links);
  const sourceNotes = cleanText(brandInfo.source_notes);
  const requestedQuantity = Math.max(1, Math.min(12, Number(quantity) || 8));
  const parsedTargetDate = targetDate ? new Date(`${String(targetDate).slice(0, 10)}T12:00:00`) : null;
  const validTargetDate = parsedTargetDate && !Number.isNaN(parsedTargetDate.getTime()) ? parsedTargetDate : null;
  const targetDateText = validTargetDate ? validTargetDate.toISOString().slice(0, 10) : null;

  if (!hasUsefulIdentity(client, brandInfo)) {
    const error = new Error('La identidad del cliente esta incompleta. Completa negocio, audiencia, tono, pilares y productos/servicios antes de generar contenido con IA.');
    error.statusCode = 422;
    throw error;
  }

  const topContext = (matches || []).map(m => m.content).join('\n---\n') || 'Sin documentos cargados.';
  const calendarCtx = Array.isArray(monthContext) ? monthContext.join(', ') : (monthContext || 'Sin fechas especiales.');
  const existingCalendar = (existingItems || [])
    .map(item => `${item.scheduled_at?.slice(0, 10)} - ${item.title} (${item.channel || 'sin canal'}, ${item.status || 'sin estado'})`)
    .join('\n') || 'No hay eventos existentes.';

  const identityPayload = {
    nombre: client.name,
    industria: client.industry || null,
    negocio_y_propuesta: brandInfo.business_description || null,
    audiencia_objetivo: brandInfo.target_audience || null,
    tono_de_voz: brandInfo.brand_voice || null,
    pilares: asList(brandInfo.content_pillars),
    objetivos: asList(brandInfo.content_goals),
    productos_servicios: asList(brandInfo.products_services),
    redes_preferidas: asList(brandInfo.preferred_platforms),
    formatos_preferidos: asList(brandInfo.preferred_formats),
    temas_a_evitar: asList(brandInfo.avoid_topics),
    referencias_de_estilo: brandInfo.reference_style || null,
    fuentes_de_identidad: sourceLinks,
    notas_de_fuentes: sourceNotes || null,
  };

  const allowedMonths = targetDateText ? [
    targetDateText.slice(0, 7),
  ] : [
    `${currentYear}-${String(currentMonthNum).padStart(2, '0')}`,
    `${nextMonthYear}-${String(nextMonthNum).padStart(2, '0')}`,
  ];

  const systemPrompt = `Eres un estratega senior de contenido para redes sociales.
Tu trabajo es generar posteos concretos para un calendario editorial, no plantillas.

Reglas obligatorias:
- Devuelve exclusivamente un objeto JSON valido con esta forma: {"ideas": [...]}.
- Genera exactamente ${requestedQuantity} ideas.
- Cada idea debe ser especifica para la marca, su producto, su audiencia y su tono.
- Prohibido usar placeholders, ejemplos genericos o textos como "Texto completo del post", "Titulo descriptivo", "No especificado".
- Prohibido explicar tu proceso o agregar markdown.
- Cada copy debe estar listo para publicar, con gancho, cuerpo, CTA y hashtags coherentes.
- Si falta algun dato, usa solo inferencias prudentes desde la identidad y documentos; no inventes claims medicos, legales, ambientales o de rendimiento.
- Usa las fuentes_de_identidad y notas_de_fuentes como referencia de marca. Si una fuente no fue analizada, tratala solo como referencia y no inventes datos especificos.
- ${targetDateText ? `La fecha scheduled_at de todas las ideas debe ser exactamente ${targetDateText}.` : 'Elige fechas distribuidas editorialmente entre el mes actual y el proximo, evitando fechas ya ocupadas.'}`;

  const userPromptForModel = JSON.stringify({
    tarea: cleanText(userPrompt),
    cantidad: requestedQuantity,
    contexto_temporal: {
      fecha_actual: now.toISOString().slice(0, 10),
      mes_actual: currentMonth,
      proximo_mes: nextMonth,
      meses_permitidos: allowedMonths,
      fecha_objetivo: targetDateText,
    },
    identidad_del_cliente: identityPayload,
    documentos_del_cliente: topContext,
    eventos_ya_programados: existingCalendar,
    fechas_importantes: calendarCtx,
    estructura_de_cada_idea: {
      title: 'Titulo especifico del post, maximo 80 caracteres',
      creative_idea: 'Idea creativa y concepto visual/video de la pieza (ej: Video influencer explicando el producto en blabla, o infografía detallada mostrando..., o entrevista rápida a un experto, o carrusel paso a paso de fotos...)',
      copy: 'Copy completo listo para publicar',
      scheduled_at: 'YYYY-MM-DD',
      channel: 'Red social recomendada',
      format: 'Formato recomendado',
      objective: 'Objetivo editorial concreto',
      status: 'Pendiente',
    },
  }, null, 2);

  const llmResponse = await callLLM({
    systemPrompt,
    userPrompt: userPromptForModel,
    responseSchema: scheduleIdeasSchema
  });

  const ideas = JSON.parse(llmResponse);
  const rawIdeas = Array.isArray(ideas) ? ideas : Array.isArray(ideas?.ideas) ? ideas.ideas : [];
  const cleanIdeas = rawIdeas
    .filter(idea => idea && !containsPlaceholder(idea))
    .slice(0, requestedQuantity)
    .map(idea => ({
      title: cleanText(idea.title).slice(0, 120),
      creative_idea: cleanText(idea.creative_idea || idea.objective || ''),
      copy: cleanText(idea.copy),
      scheduled_at: targetDateText || cleanText(idea.scheduled_at),
      channel: cleanText(idea.channel) || asList(brandInfo.preferred_platforms)[0] || 'Instagram',
      format: cleanText(idea.format) || asList(brandInfo.preferred_formats)[0] || 'Post',
      objective: cleanText(idea.objective),
      status: cleanText(idea.status) || 'Pendiente',
    }))
    .filter(idea => idea.title && idea.copy && idea.scheduled_at);

  if (!cleanIdeas.length) {
    throw new Error('La IA devolvio una respuesta generica. Ajusta la identidad del cliente y vuelve a intentar.');
  }

  return cleanIdeas;
};

/**
 * Maneja conversaciones de chat con el cliente usando RAG
 */
export const handleChatConversation = async ({ clientId, userPrompt, chatHistory, token, agentId }) => {
  // Validar acceso al cliente vía RLS
  const supabaseAuth = createAuthenticatedClient(token);
  const { data: client, error: clientErr } = await supabaseAuth
    .from('clients')
    .select('id, name, agency_id, brand_info, industry')
    .eq('id', clientId)
    .single();
  if (clientErr) throw new Error(clientErr.message);

  // Fallback de desarrollo si no hay OpenAI
  if (!openaiApiKey) {
    const response = `Soy tu asistente de contenido para ${client.name}. Sobre "${userPrompt}", te sugiero:
- Define el objetivo del contenido y la audiencia.
- Crea 2-3 titulares claros y una llamada a la acción.
- Propón un formato (carrusel, reel, historia) y un calendario de publicación.
¿Quieres que arme ideas concretas para tu calendario?`;
    return { response, command: null };
  }

  // 1) Obtener contexto unificado del Cronograma (Siempre cargado para Aura)
  let scheduleContext = '';
  try {
    const { data: scheduleItems } = await supabaseAuth
      .from('schedule_items')
      .select('id, title, scheduled_at, channel, status')
      .eq('client_id', clientId)
      .order('scheduled_at', { ascending: true })
      .limit(40);
    
    if (scheduleItems && scheduleItems.length > 0) {
      scheduleContext = `\n📅 CRONOGRAMA DE PUBLICACIONES ACTUALES EN EL CALENDARIO (Últimas 40):\n` +
        scheduleItems.map(item => `- ID: "${item.id}", Título: "${item.title}", Canal: "${item.channel || 'IG'}", Fecha: "${item.scheduled_at?.slice(0, 10)}", Estado: "${item.status}"`).join('\n');
    } else {
      scheduleContext = '\n📅 CRONOGRAMA DE PUBLICACIONES: El calendario de publicaciones está actualmente vacío para este cliente.';
    }
  } catch (e) {
    console.warn('Error al cargar items para prompt de Aura:', e);
  }

  // 2) Obtener contexto de los últimos reportes de Tendencias detectados en el mercado
  let trendsContext = '';
  try {
    const { data: latestReport } = await supabaseAuth
      .from('trend_reports')
      .select('title, summary, insights')
      .eq('client_id', clientId)
      .order('generated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestReport) {
      const insightsStr = (latestReport.insights || [])
        .map(ins => `- [TENDENCIA] "${ins.title}": ${ins.description} (Acción recomendada: ${ins.suggested_action})`)
        .join('\n');
      trendsContext = `\n🔥 ÚLTIMAS TENDENCIAS DETECTADAS EN EL MERCADO PARA EL CLIENTE:\n- Reporte: "${latestReport.title}"\n- Resumen: "${latestReport.summary}"\n- Insights de Tendencias Recientes:\n${insightsStr || 'Ninguno'}`;
    } else {
      trendsContext = '\n🔥 TENDENCIAS DE MERCADO: Aún no se han escaneado tendencias para este cliente hoy.';
    }
  } catch (e) {
    console.warn('Error al cargar tendencias en prompt de Aura:', e);
  }

  // 3) Obtener contexto del estado de integración de Meta Ads
  let metaContext = '';
  try {
    const { data: metaIntegration } = await supabaseAuth
      .from('client_meta_integrations')
      .select('meta_ad_account_id, status')
      .eq('client_id', clientId)
      .maybeSingle();

    if (metaIntegration) {
      metaContext = `\n📊 INTEGRACIÓN Y ANALÍTICAS DE META ADS:\n- Estado de Conexión: "${metaIntegration.status}"\n- ID Cuenta Publicitaria vinculada: "${metaIntegration.meta_ad_account_id}"\n- Nota: Tienes acceso autorizado a optimizar la pauta de anuncios y audiencias de esta cuenta.`;
    } else {
      metaContext = '\n📊 INTEGRACIÓN DE META ADS: La cuenta publicitaria de Meta Ads todavía no ha sido conectada por el usuario.';
    }
  } catch (e) {
    console.warn('Error al cargar integración de Meta en prompt de Aura:', e);
  }

  // Formatear el ADN estratégico e Identidad de Marca del cliente
  const brandInfo = client.brand_info || {};
  const brandIdentityContext = `
🧬 PERFIL DE IDENTIDAD Y ADN DE MARCA DEL CLIENTE:
- Nombre Comercial: "${client.name}"
- Industria o Sector: "${client.industry || 'No especificada'}"
- Descripción del Negocio y Propuesta: "${brandInfo.business_description || 'No especificada'}"
- Público Objetivo / Buyer Persona: "${brandInfo.target_audience || 'No especificado'}"
- Tono de Voz y Expresión de Copys: "${brandInfo.brand_voice || 'No especificado'}"
- Dirección Estética y Estilo Visual: "${brandInfo.reference_style || 'No especificado'}"
- Valores Centrales de Marca: "${brandInfo.brand_values || 'No especificados'}"
- Competidores y Benchmarks: "${brandInfo.competitors || 'No especificados'}"
- Pilares de Contenido: ${Array.isArray(brandInfo.content_pillars) ? brandInfo.content_pillars.join(', ') : 'No especificados'}
- Objetivos Editoriales: ${Array.isArray(brandInfo.content_goals) ? brandInfo.content_goals.join(', ') : 'No especificados'}
- Productos y Servicios Ofrecidos: ${Array.isArray(brandInfo.products_services) ? brandInfo.products_services.join(', ') : 'No especificados'}
- Temas a Evitar: ${Array.isArray(brandInfo.avoid_topics) ? brandInfo.avoid_topics.join(', ') : 'Ninguno'}
`;

  // Embedding de la consulta para RAG documental
  const queryEmbedding = await embedText(userPrompt);

  // Buscar chunks relevantes de documentos del cliente de forma segura usando el token autenticado
  let matches = [];
  try {
    const { data, error: matchErr } = await supabaseAuth.rpc('match_document_chunks', {
      query_embedding: queryEmbedding,
      match_client_id: clientId,
      match_count: 5,
    });
    if (!matchErr) {
      matches = data || [];
    } else {
      console.warn('[ai] No se pudo usar contexto documental (RPC Err):', matchErr.message);
    }
  } catch (error) {
    console.warn('[ai] Error al buscar chunks de documentos:', error.message);
  }
  const topContext = (matches || []).map(m => m.content).join('\n---\n');

  // Construir historial de conversación
  const conversationHistory = Array.isArray(chatHistory) 
    ? chatHistory.map(msg => ({ role: msg.role, content: msg.content }))
    : [];

  // Inyectar directrices de expertise y personalidad del Agente Compañero
  const agentContextPrompt = `Te llamas "Aura". Eres la Directora Estratégica de la agencia y una compañera de marketing más del equipo. Hablas de forma totalmente natural, cercana, fresca y humana (como si estuvieras chateando por Slack o WhatsApp con un colega de confianza). 
NO hables como un robot corporativo frío ni uses esquemas tipográficos exageradamente perfectos con interminables viñetas en negrita o bloques gigantes de texto formateado. Escribe oraciones naturales, fluidas, con exclamaciones cálidas y emoticonos oportunos (como 🙌, 🔥, 😉, de una!, dale!).
Adopta el comportamiento y tono de la persona que te habla (si te hablan corto y casual, responde corto, ágil y al grano; si te hablan más formal, sé profesional pero mantén siempre la calidez humana).

Tu gran superpoder es que puedes controlar y armar cada rincón del Cronograma/Calendario del cliente. De forma proactiva puedes proponer crear eventos, reprogramarlos, cambiar su estado o eliminarlos usando los comandos correspondientes. Si el usuario te da una orden como "3 posteos sobre X, 2 fotos y 2 videos", actúa al instante como su mano derecha: sugiérele las fechas ideales del mes, los formatos y redacta copies brutales listos para publicar, invitando a confirmar las tarjetas con un solo click.

🚨 REGLA DE COHERENCIA Y CONSULTA ACTIVA (IMPORTANTÍSIMO):
- Ante cualquier pedido sobre un "producto nuevo", "lanzamiento reciente", "servicio recién anunciado" u otro tema específico de este cliente:
  1. Primero verifica detalladamente si tienes información en tu PERFIL DE IDENTIDAD DE MARCA o CONTEXTO DOCUMENTAL.
  2. Si NO tienes la información clara, o si requieres confirmar tendencias/novedades recientes en internet, avísale con total naturalidad al usuario que vas a buscar si hay algo online y propón de inmediato ejecutar una búsqueda en tiempo real agregando un comando con la acción "run_trends" en tu array de comandos.
  3. Si la búsqueda no es posible o si requieres más especificaciones del producto, pídele con total confianza y calidez humana al usuario que te cuente un poco más sobre el producto (características, beneficios, etc.) en lugar de inventar detalles ficticios o alucinar datos. ¡Un colega honesto y profesional indaga y pregunta para que el contenido sea perfecto!`;

  const systemPrompt = `Eres Aura, una colega de marketing súper talentosa y humana que trabaja codo a codo con el usuario.

🤖 TU PERSONALIDAD DE COMPAÑERA REAL:
${agentContextPrompt}

${brandIdentityContext}
${scheduleContext}
${trendsContext}
${metaContext}

📂 CONTEXTO DOCUMENTAL DE RAG (Briefs cargados):
${topContext || 'Sin documentos relevantes.'}

⚠️ INSTRUCCIONES DE FORMATO Y ESTILO OBLIGATORIAS (MÁXIMA PRIORIDAD):
Debes responder SIEMPRE en formato JSON estructurado y válido. No incluyes explicaciones de texto fuera del JSON. Prohibido usar bloques de formato markdown de código como \`\`\`json. Responde estrictamente un objeto JSON con la siguiente estructura:
{
  "response": "Tu respuesta humana, súper natural, directa y conversacional...",
  "hasCommands": true | false,
  "commands": [
    {
      "action": "reschedule" | "update_status" | "create" | "delete" | "update_brand_profile" | "run_trends" | "reply_comment" | "none",
      "itemId": "UUID o ID requerido para la acción (si aplica, sino dejar vacio)",
      "date": "YYYY-MM-DD (para reschedule o create, sino vacio)",
      "status": "pendiente | en-diseño | aprobado (para update_status, sino vacio)",
      "title": "Título del post (para create, sino vacio)",
      "channel": "IG | TikTok | LinkedIn | FB (para create, sino vacio)",
      "copy": "Texto del copy inicial (para create, sino vacio)",
      "updates_brand_voice": "Nuevo tono de voz (para update_brand_profile, sino vacio)",
      "updates_target_audience": "Nueva audiencia (para update_brand_profile, sino vacio)",
      "updates_business_description": "Nueva descripción (para update_brand_profile, sino vacio)",
      "updates_reference_style": "Nuevo estilo visual (para update_brand_profile, sino vacio)",
      "updates_brand_values": "Nuevos valores (para update_brand_profile, sino vacio)",
      "updates_competitors": "Nuevos competidores (para update_brand_profile, sino vacio)",
      "keywords": "términos de búsqueda (para run_trends, sino vacio)",
      "commentId": "ID del comentario a responder (para reply_comment, sino vacio)",
      "replyText": "Texto de la respuesta (para reply_comment, sino vacio)",
      "platform": "instagram | facebook | linkedin (para reply_comment, sino vacio)"
    }
  ]
}

🚫 REGLAS DE OBLIGATORIO CUMPLIMIENTO EN LA PROPIEDAD "response":
1. PROHIBIDO usar asteriscos de negritas (por ejemplo, **Posteo 1**, **Fecha:**, **Copy:**).
2. PROHIBIDO usar listas numeradas (1., 2., 3.) o viñetas (-, •, *).
3. PROHIBIDO escribir los copys redactados, fechas o formatos técnicos en esta propiedad "response". Toda esa información técnica operativa debe ir ÚNICAMENTE en el array "commands".
4. La propiedad "response" debe contener exclusivamente un párrafo de texto muy corto, afectuoso, estratégico y 100% conversacional (ejemplo: "¡De una! Te he diseñado tres propuestas increíbles sobre este producto para el mes. He colocado las fechas estratégicas en el calendario y redactado los copies enfocados en el público. Abajo tienes las tarjetas de cada publicación listas para confirmar o descartar con un click. ¡Dime qué tal las ves! 🙌").
5. Al no escribir los copys ni listas dos veces, reduces los tokens de salida, haciendo que el chat responda muchísimo más rápido y veloz.

REGLAS DE COMANDO:
- Puedes proponer MÚLTIPLES comandos en la lista "commands" (ej: crear 3 publicaciones independientes para distintas fechas del mes).
- Si no hay comandos o acciones operativas que realizar en este turno, establece "hasCommands" en false y devuelve "commands": []. Esto es crucial para mantener la rapidez del chat.
- Rellena con "" (string vacio) todos los campos de cada objeto en "commands" que no apliquen a la acción elegida.
- Sé extremadamente exacto con los UUIDs de las publicaciones que lees en la sección 📅 CRONOGRAMA DE PUBLICACIONES ACTUALES EN EL CALENDARIO. No inventes IDs.`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory,
    { role: 'user', content: userPrompt }
  ];

  const resp = await fetchWithTimeout('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiApiKey}` },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages,
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'chat_response',
          strict: true,
          schema: chatResponseSchema
        }
      },
      temperature: 0.7,
      max_tokens: 1200,
    }),
  });

  if (!resp.ok) throw new Error('Error al generar respuesta del chat');
  const json = await resp.json();
  const responseContent = json.choices?.[0]?.message?.content || '{}';

  try {
    const parsed = JSON.parse(responseContent);
    const commands = [];
    if (parsed.hasCommands && Array.isArray(parsed.commands)) {
      for (const cmd of parsed.commands) {
        if (cmd && cmd.action && cmd.action !== 'none') {
          const commandObj = {
            action: cmd.action,
            params: {}
          };
          if (cmd.action === 'reschedule') {
            if (cmd.itemId) commandObj.params.itemId = cmd.itemId;
            if (cmd.date) commandObj.params.date = cmd.date;
          } else if (cmd.action === 'update_status') {
            if (cmd.itemId) commandObj.params.itemId = cmd.itemId;
            if (cmd.status) commandObj.params.status = cmd.status;
          } else if (cmd.action === 'create') {
            if (cmd.title) commandObj.params.title = cmd.title;
            if (cmd.date) commandObj.params.date = cmd.date;
            if (cmd.channel) commandObj.params.channel = cmd.channel;
            if (cmd.copy) commandObj.params.copy = cmd.copy;
          } else if (cmd.action === 'delete') {
            if (cmd.itemId) commandObj.params.itemId = cmd.itemId;
          } else if (cmd.action === 'run_trends') {
            if (cmd.keywords) commandObj.params.keywords = cmd.keywords;
          } else if (cmd.action === 'reply_comment') {
            if (cmd.commentId) commandObj.params.commentId = cmd.commentId;
            if (cmd.replyText) commandObj.params.replyText = cmd.replyText;
            if (cmd.platform) commandObj.params.platform = cmd.platform;
          } else if (cmd.action === 'update_brand_profile') {
            commandObj.params.updates = {};
            if (cmd.updates_brand_voice) commandObj.params.updates.brand_voice = cmd.updates_brand_voice;
            if (cmd.updates_target_audience) commandObj.params.updates.target_audience = cmd.updates_target_audience;
            if (cmd.updates_business_description) commandObj.params.updates.business_description = cmd.updates_business_description;
            if (cmd.updates_reference_style) commandObj.params.updates.reference_style = cmd.updates_reference_style;
            if (cmd.updates_brand_values) commandObj.params.updates.brand_values = cmd.updates_brand_values;
            if (cmd.updates_competitors) commandObj.params.updates.competitors = cmd.updates_competitors;
          }
          commands.push(commandObj);
        }
      }
    }
    return {
      response: parsed.response || 'No he podido generar una respuesta conversacional.',
      commands
    };

  } catch (e) {
    console.error('Error al parsear respuesta estructurada de Aura:', responseContent, e);
    return {
      response: 'Lo siento, he tenido un problema interno al procesar mi respuesta estructurada.',
      command: null
    };
  }
};

export const generateImageWithAI = async ({ prompt, aspectRatio }) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY no está configurada. Agregala en backend/.env y reiniciá el servidor backend.');
  }

  // Mapear proporción del frontend a lo esperado por la API de Imagen 3 (1:1, 3:4, 4:3, 9:16, 16:9)
  const validAspectRatios = ['1:1', '3:4', '4:3', '9:16', '16:9'];
  const finalAspectRatio = validAspectRatios.includes(aspectRatio) ? aspectRatio : '1:1';
  const model = process.env.GEMINI_IMAGE_MODEL || 'imagen-3.0-generate-002';

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:predict`;

  console.log(`🤖 [Gemini Imagen] Llamando a Imagen 3 para prompt: "${prompt}" con aspectRatio: "${finalAspectRatio}"`);

  const requestBody = {
    instances: [
      { prompt }
    ],
    parameters: {
      sampleCount: 1,
      aspectRatio: finalAspectRatio
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify(requestBody)
  });

  let firstErrorData = null;
  if (!response.ok) {
    firstErrorData = await response.json().catch(() => ({}));
  }

  if (!response.ok) {
    const errorData = firstErrorData || await response.json().catch(() => ({}));
    console.error('❌ [Gemini Imagen] Error de API:', errorData);
    const apiError = new Error(
      errorData?.error?.message || 
      `Error al comunicarse con la API de Gemini Imagen (Código: ${response.status})`
    );
    apiError.statusCode = errorData?.error?.status === 'RESOURCE_EXHAUSTED' ? 429 : response.status;
    throw apiError;
  }

  const result = await response.json();
  const prediction = result.predictions?.[0];
  const base64 = prediction?.bytesBase64Encoded;
  const mimeType = prediction?.mimeType || 'image/png';

  if (!base64) {
    console.error('❌ [Gemini Imagen] No se recibió imagen base64:', result);
    throw new Error('La API de Google no devolvió datos de imagen válidos.');
  }

  return { base64, mimeType };
};

export const generateCopyFromTrend = async ({ clientId, trendTitle, trendDescription, suggestedAction, channel, token }) => {
  const supabaseAuth = createAuthenticatedClient(token);
  const { data: client, error: clientErr } = await supabaseAuth
    .from('clients')
    .select('id, name, industry, brand_info')
    .eq('id', clientId)
    .single();
  if (clientErr) throw new Error(clientErr.message);

  if (!openaiApiKey) {
    // fallback if no OpenAI key
    return {
      title: `Idea: ${trendTitle}`,
      copy: `✨ ¡Tendencia caliente del mes! ✨\n\nAnalizamos la tendencia "${trendTitle}" y es el momento ideal para que ${client.name} tome acción.\n\n👉 Enfoque: ${suggestedAction || trendDescription}\n\n¿Qué opinan ustedes? ¡Comenten abajo! 👇`,
      creative_idea: `Un video o post estático mostrando la postura de la marca respecto a ${trendTitle}.`,
      objective: `Posicionar a ${client.name} como referente de tendencia en la industria de ${client.industry || 'marketing'}.`
    };
  }

  const brandInfo = client.brand_info || {};
  const identityPayload = {
    nombre: client.name,
    industria: client.industry || null,
    negocio_y_propuesta: brandInfo.business_description || null,
    audiencia_objetivo: brandInfo.target_audience || null,
    tono_de_voz: brandInfo.brand_voice || null,
    pilares: asList(brandInfo.content_pillars),
    objetivos: asList(brandInfo.content_goals),
    productos_servicios: asList(brandInfo.products_services),
    redes_preferidas: asList(brandInfo.preferred_platforms),
  };

  const systemPrompt = `Eres un copywriter creativo y estratega de redes sociales senior. Tu tarea es convertir una tendencia caliente y cruda de internet en un borrador de copy final, listo para publicar, y una idea creativa específica adaptada al 100% a la identidad, voz, productos e industria de la marca. Devuelve únicamente JSON válido.`;

  const userPrompt = JSON.stringify({
    marca: identityPayload,
    tendencia: {
      titulo: trendTitle,
      descripcion: trendDescription,
      accion_sugerida: suggestedAction,
      red_social_objetivo: channel || 'Instagram'
    },
    tarea: `Redacta un post completo para redes sociales sobre esta tendencia. Crea un copy final pulido, listo para publicar en ${channel || 'Instagram'}, con gancho, cuerpo, llamado a la acción (CTA) y hashtags adecuados. Además, genera una idea creativa de diseño/video para acompañar el copy y un objetivo concreto.`,
    estructura_esperada: {
      title: 'Un título corto e ingenioso de la publicación (máx. 50 caracteres)',
      copy: 'El copy del post listo para publicar en la red social con gancho inicial, cuerpo legible, espacios adecuados, hashtags y llamada a la acción.',
      creative_idea: 'Una breve sugerencia del diseño visual o idea de video (ej: "Un carrusel de 3 slides donde...", o "Video corto mostrando el proceso con música en tendencia...")',
      objective: 'El objetivo estratégico del post (ej: "Aumentar engagement de marca" o "Generar conversiones de leads")'
    }
  }, null, 2);

  const llmResponse = await callLLM({
    systemPrompt,
    userPrompt,
    responseSchema: trendCopySchema
  });
  const parsed = JSON.parse(llmResponse);

  return {
    title: cleanText(parsed.title || `Idea: ${trendTitle}`),
    copy: cleanText(parsed.copy || ''),
    creative_idea: cleanText(parsed.creative_idea || ''),
    objective: cleanText(parsed.objective || 'Generar autoridad y conversación sobre la tendencia.')
  };
};
