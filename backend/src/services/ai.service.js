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

const embedText = async (text) => {
  const resp = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiApiKey}` },
    body: JSON.stringify({ model: 'text-embedding-3-small', input: text })
  });
  if (!resp.ok) throw new Error('Error al generar embeddings');
  const json = await resp.json();
  return json.data?.[0]?.embedding || [];
};

const callLLM = async ({ systemPrompt, userPrompt }) => {
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
      temperature: 0.65,
      max_tokens: 4500,
    }),
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
    const { data, error: matchErr } = await supabaseAdmin.rpc('match_document_chunks', {
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

  const llmResponse = await callLLM({ systemPrompt, userPrompt: userPromptForModel });
  let ideas;
  try {
    ideas = JSON.parse(llmResponse);
  } catch (_e) {
    const jsonStart = llmResponse.indexOf('[');
    const jsonEnd = llmResponse.lastIndexOf(']');
    if (jsonStart >= 0 && jsonEnd >= 0) {
      ideas = JSON.parse(llmResponse.slice(jsonStart, jsonEnd + 1));
    } else {
      throw new Error('La respuesta del modelo no es JSON valido');
    }
  }

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
export const handleChatConversation = async ({ clientId, userPrompt, chatHistory, token }) => {
  // Validar acceso al cliente vía RLS
  const supabaseAuth = createAuthenticatedClient(token);
  const { data: client, error: clientErr } = await supabaseAuth
    .from('clients')
    .select('id, name, agency_id')
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
    return { response };
  }

  // Embedding de la consulta
  const queryEmbedding = await embedText(userPrompt);

  // Buscar chunks relevantes
  const { data: matches, error: matchErr } = await supabaseAdmin.rpc('match_document_chunks', {
    query_embedding: queryEmbedding,
    match_client_id: clientId,
    match_count: 5,
  });
  if (matchErr) throw new Error(`Error al buscar contexto: ${matchErr.message}`);
  const topContext = (matches || []).map(m => m.content).join('\n---\n');

  // Construir historial de conversación
  const conversationHistory = Array.isArray(chatHistory) 
    ? chatHistory.map(msg => ({ role: msg.role, content: msg.content }))
    : [];

  const systemPrompt = `Eres un asistente de marketing digital experto especializado en contenido para redes sociales.

Contexto del cliente ${client.name}:
${topContext}

Instrucciones:
Responde de manera conversacional y útil

Actúa como asistente senior de marca y estrategia de contenido.

Prioriza entender la marca antes de sugerir: negocio, propuesta de valor, audiencia, tono y límites.

Estructura por defecto:

Resumen de entendimiento (3 viñetas)

Sugerencias operativas (pasos claros y accionables)

Bloques opcionales según la necesidad: diagnóstico aplicado, ángulos/ganchos, líneas editoriales, brief mínimo, checklist de compliance, criterios de evaluación, métricas clave.

Preguntas clave (solo si faltan datos críticos; máx. 3)

Supuestos (si los hubo)

Compara opciones con pros/contras y recomienda una, justificando brevemente.

Usa el contexto del cliente para dar respuestas personalizadas

Aprovecha todo el contexto disponible del cliente y cítalo entre comillas cuando fundamentes.

Ajusta tono, estilo y nivel de detalle al de la marca.

Evita lo genérico: aterriza cada consejo a sus canales, recursos, objetivos y audiencia.

Vincula cada recomendación con un objetivo, una audiencia o una ventana de oportunidad del calendario.

Si no tienes información suficiente, pregunta por más detalles

Pide como máximo 3 aclaraciones de alto impacto y explica por qué mejoran la recomendación.

Si faltan datos, continúa con lo posible y declara tus Supuestos de forma breve y honesta.

Nunca inventes información.

Mantén un tono profesional pero amigable

Claro, directo y carismático sin “hype”.

Prioriza viñetas y pasos concretos sobre párrafos largos.

Evita promesas absolutas o claims no sustentados.

Mantén coherencia con el estilo de la marca en todo momento.

Enfócate en estrategias de marketing y contenido

Trabaja sobre: posicionamiento, propuesta de valor, segmentación y pains/gains, tono y territorios creativos, líneas editoriales, planificación y distribución por canal, oportunidades del calendario, optimización de piezas, criterios de evaluación, KPI y mejora continua.

Por defecto brinda marcos, criterios, briefings y checklists; solo genera ideas completas si el usuario lo pide explícitamente.`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory,
    { role: 'user', content: userPrompt }
  ];

  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiApiKey}` },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.7,
      max_tokens: 500,
    }),
  });

  if (!resp.ok) throw new Error('Error al generar respuesta del chat');
  const json = await resp.json();
  const response = json.choices?.[0]?.message?.content || 'No pude generar una respuesta.';

  return { response };
};

/**
 * Genera una imagen utilizando la API de Imagen 3 (Google Gemini API / AI Studio)
 */
export const generateImageWithAI = async ({ prompt, aspectRatio }) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY no está configurada. Agregala en backend/.env y reiniciá el servidor backend.');
  }

  // Mapear proporción del frontend a lo esperado por la API (opcional, pero la API soporta "1:1", "16:9", "9:16")
  const validAspectRatios = ['1:1', '16:9', '9:16', '3:4', '4:3', '2:3', '3:2', '4:5', '5:4', '21:9'];
  const finalAspectRatio = validAspectRatios.includes(aspectRatio) ? aspectRatio : '1:1';
  const model = process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image';

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  console.log(`🤖 [Gemini Imagen] Llamando a Imagen 3 para prompt: "${prompt}" con aspectRatio: "${finalAspectRatio}"`);

  const buildRequestBody = (_ratioValue) => ({
    contents: [{
      parts: [{ text: finalAspectRatio === '1:1' ? prompt : `${prompt}\n\nFormato requerido: imagen en proporcion ${finalAspectRatio}.` }]
    }],
  });

  const callGemini = (ratioValue) => fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify(buildRequestBody(ratioValue))
  });

  let response = await callGemini(null);

  let firstErrorData = null;
  if (!response.ok) {
    firstErrorData = await response.json().catch(() => ({}));
  }

  if (!response.ok) {
    const errorData = firstErrorData || await response.json().catch(() => ({}));
    console.error('❌ [Gemini Imagen] Error de API:', errorData);
    const apiError = new Error(
      errorData?.error?.message || 
      `Error al comunicarse con la API de Gemini (Código: ${response.status})`
    );
    apiError.statusCode = errorData?.error?.status === 'RESOURCE_EXHAUSTED' ? 429 : response.status;
    throw apiError;
  }

  const result = await response.json();
  const parts = result.candidates?.[0]?.content?.parts || [];
  const imagePart = parts.find(part => part.inlineData?.data || part.inline_data?.data);
  const inlineData = imagePart?.inlineData || imagePart?.inline_data;
  const base64 = inlineData?.data;
  const mimeType = inlineData?.mimeType || inlineData?.mime_type || 'image/png';

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

  const llmResponse = await callLLM({ systemPrompt, userPrompt });
  const parsed = JSON.parse(llmResponse);

  return {
    title: cleanText(parsed.title || `Idea: ${trendTitle}`),
    copy: cleanText(parsed.copy || ''),
    creative_idea: cleanText(parsed.creative_idea || ''),
    objective: cleanText(parsed.objective || 'Generar autoridad y conversación sobre la tendencia.')
  };
};
