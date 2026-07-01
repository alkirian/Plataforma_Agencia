import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '../config/supabaseClient.js';
import { getClientComments } from './metaAds.service.js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_KEY;
const openaiApiKey = process.env.OPENAI_API_KEY;
const geminiApiKey = process.env.GEMINI_API_KEY;

const createAuthenticatedClient = (token) => {
  if (!token) throw new Error('Token requerido');
  return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
};

function fixTruncatedJSON(jsonString) {
  let inString = false;
  let isEscaped = false;
  const stack = [];
  let cleanString = "";

  for (let i = 0; i < jsonString.length; i++) {
    const char = jsonString[i];
    cleanString += char;

    if (inString) {
      if (isEscaped) {
        isEscaped = false;
      } else if (char === '\\') {
        isEscaped = true;
      } else if (char === '"') {
        inString = false;
      }
    } else {
      if (char === '"') {
        inString = true;
        isEscaped = false;
      } else if (char === '{' || char === '[') {
        stack.push(char);
      } else if (char === '}') {
        if (stack[stack.length - 1] === '{') {
          stack.pop();
        }
      } else if (char === ']') {
        if (stack[stack.length - 1] === '[') {
          stack.pop();
        }
      }
    }
  }

  if (inString && isEscaped) {
    cleanString = cleanString.slice(0, -1);
  }

  if (inString) {
    cleanString += '"';
  }

  cleanString = cleanString.trim().replace(/,\s*$/, '');

  while (stack.length > 0) {
    const openChar = stack.pop();
    if (openChar === '{') {
      cleanString += '}';
    } else if (openChar === '[') {
      cleanString += ']';
    }
  }

  return cleanString;
}

export const robustJSONParse = (text) => {
  if (typeof text !== 'string') return text;
  
  let cleanedText = text.trim();
  if (cleanedText.startsWith('```json')) {
    cleanedText = cleanedText.substring(7);
  } else if (cleanedText.startsWith('```')) {
    cleanedText = cleanedText.substring(3);
  }
  if (cleanedText.endsWith('```')) {
    cleanedText = cleanedText.substring(0, cleanedText.length - 3);
  }
  cleanedText = cleanedText.trim();

  try {
    return JSON.parse(cleanedText);
  } catch (err) {
    console.warn('⚠️ [robustJSONParse] Falló parsing directo, intentando reparar JSON truncado/inválido...', err.message);
    try {
      const repaired = fixTruncatedJSON(cleanedText);
      const finalized = repaired.replace(/"([^"\\]*(\\.[^"\\]*)*)"/g, (match, p1) => {
        return '"' + p1.replace(/\n/g, '\\n').replace(/\r/g, '\\r') + '"';
      });
      return JSON.parse(finalized);
    } catch (secondErr) {
      console.error('❌ [robustJSONParse] Falla crítica al decodificar JSON:', text);
      throw err;
    }
  }
};

const fetchWithTimeout = async (url, options = {}, timeout = 120000) => {
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


export const callLLM = async ({ systemPrompt, userPrompt, messages, responseSchema, model = 'gpt-4o', temperature = 0.65, maxTokens = 4500 }) => {
  // --- GOOGLE GEMINI INTEGRATION ---
  if (model.startsWith('gemini-')) {
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY no está configurada.');
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`;

    let systemInstructionText = systemPrompt;
    const contents = [];

    const messagesToProcess = messages || [
      ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
      ...(userPrompt ? [{ role: 'user', content: userPrompt }] : [])
    ];

    for (const msg of messagesToProcess) {
      if (msg.role === 'system') {
        systemInstructionText = msg.content;
      } else {
        const parts = [];
        if (typeof msg.content === 'string') {
          parts.push({ text: msg.content });
        } else if (Array.isArray(msg.content)) {
          for (const part of msg.content) {
            if (part.type === 'text') {
              parts.push({ text: part.text });
            } else if (part.type === 'image_url') {
              parts.push({ text: `[Imagen adjunta: ${part.image_url?.url || ''}]` });
            }
          }
        } else {
          parts.push({ text: String(msg.content || '') });
        }
        contents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts
        });
      }
    }

    const requestBody = {
      contents,
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens
      }
    };

    if (systemInstructionText) {
      requestBody.systemInstruction = {
        parts: [{ text: systemInstructionText }]
      };
    }

    if (responseSchema) {
      requestBody.generationConfig.responseMimeType = 'application/json';
      
      // Gemini no soporta la clave "additionalProperties" en su implementación de JSON Schema.
      // Clonamos y limpiamos recursivamente para asegurar compatibilidad universal entre OpenAI y Gemini.
      const cleanSchemaForGemini = (schema) => {
        if (!schema || typeof schema !== 'object') return schema;
        const clone = Array.isArray(schema) ? [...schema] : { ...schema };
        if (clone.additionalProperties !== undefined) {
          delete clone.additionalProperties;
        }
        for (const key in clone) {
          if (typeof clone[key] === 'object') {
            clone[key] = cleanSchemaForGemini(clone[key]);
          }
        }
        return clone;
      };
      
      requestBody.generationConfig.responseSchema = cleanSchemaForGemini(responseSchema);
    }

    const resp = await fetchWithTimeout(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!resp.ok) {
      const details = await resp.json().catch(() => ({}));
      throw new Error(details?.error?.message || `Error al llamar a Gemini (${resp.status})`);
    }

    const json = await resp.json();
    const responseText = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return responseText;
  }

  // --- OPENAI INTEGRATION ---
  const bodyPayload = {
    model,
    messages: messages || [
      ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
      ...(userPrompt ? [{ role: 'user', content: userPrompt }] : [])
    ]
  };

  // Modern OpenAI models (like gpt-5, o1, o3) use max_completion_tokens and do not support custom temperature
  if (model.startsWith('gpt-5') || model.startsWith('o1') || model.startsWith('o3')) {
    bodyPayload.max_completion_tokens = maxTokens;
  } else {
    bodyPayload.max_tokens = maxTokens;
    bodyPayload.temperature = temperature;
  }

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

  // Intentar con gpt-4o, con fallback automático a Gemini si falla
  let llmResponse;
  try {
    llmResponse = await callLLM({
      systemPrompt,
      userPrompt: userPromptForModel,
      responseSchema: scheduleIdeasSchema,
      model: 'gpt-4o'
    });
  } catch (openaiError) {
    console.warn('[generateScheduleIdeas] OpenAI falló, intentando con Gemini como fallback:', openaiError.message);
    if (!geminiApiKey) throw openaiError;
    llmResponse = await callLLM({
      systemPrompt,
      userPrompt: userPromptForModel,
      responseSchema: scheduleIdeasSchema,
      model: 'gemini-2.0-flash'
    });
  }

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
export const handleChatConversation = async ({ clientId, userPrompt, chatHistory, token, agentId, model, uploadedImageUrl }) => {
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

  // Lanzar consultas independientes en paralelo para reducir latencia
  const schedulePromise = (async () => {
    try {
      const res = await supabaseAuth
        .from('schedule_items')
        .select('id, title, scheduled_at, channel, status')
        .eq('client_id', clientId)
        .order('scheduled_at', { ascending: true })
        .limit(40);
      return res;
    } catch (e) {
      console.warn('⚠️ Error al cargar cronograma en chat de Aura:', e.message);
      return { data: [] };
    }
  })();

  const trendsPromise = (async () => {
    try {
      const res = await supabaseAuth
        .from('trend_reports')
        .select('title, summary, insights')
        .eq('client_id', clientId)
        .order('generated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      return res;
    } catch (e) {
      console.warn('⚠️ Error al cargar tendencias en chat de Aura:', e.message);
      return { data: null };
    }
  })();

  const metaPromise = (async () => {
    try {
      const res = await supabaseAuth
        .from('client_meta_integrations')
        .select('meta_ad_account_id, status')
        .eq('client_id', clientId)
        .maybeSingle();
      return res;
    } catch (e) {
      console.warn('⚠️ Error al cargar integración de Meta en chat de Aura:', e.message);
      return { data: null };
    }
  })();

  // Omitir embedding si el mensaje es corto y conversacional (evita llamada externa lenta a OpenAI)
  const isShortConversational = (text) => {
    const clean = text.trim().toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g,"");
    const shortWords = ['hola', 'buen dia', 'buenas', 'hello', 'hi', 'ok', 'okay', 'dale', 'de una', 'procede', 'confirmar', 'descartar', 'gracias', 'grx', 'chau', 'adios', 'bye', 'si', 'no', 'entendido'];
    return clean.length < 15 || shortWords.includes(clean);
  };

  const skipEmbedding = isShortConversational(userPrompt);
  const embeddingPromise = skipEmbedding 
    ? Promise.resolve(null) 
    : embedText(userPrompt).catch((err) => {
        console.warn('Error al generar embedding para RAG:', err.message);
        return null;
      });

  // Consultar comentarios de redes sociales
  const commentsPromise = (async () => {
    try {
      const comments = await getClientComments(clientId, token);
      return comments || [];
    } catch (e) {
      console.warn('⚠️ Error al cargar comentarios en chat de Aura:', e.message);
      return [];
    }
  })();

  let scheduleResult, trendsResult, metaResult, queryEmbedding, commentsResult;

  try {
    const results = await Promise.all([
      schedulePromise,
      trendsPromise,
      metaPromise,
      embeddingPromise,
      commentsPromise
    ]);
    scheduleResult = results[0];
    trendsResult = results[1];
    metaResult = results[2];
    queryEmbedding = results[3];
    commentsResult = results[4];
  } catch (err) {
    console.error('Error al resolver consultas paralelas en chat de Aura:', err);
  }

  // 1) Contexto unificado del Cronograma
  let scheduleContext = '';
  if (scheduleResult && scheduleResult.data && scheduleResult.data.length > 0) {
    scheduleContext = `\n📅 CRONOGRAMA DE PUBLICACIONES ACTUALES EN EL CALENDARIO (Últimas 40):\n` +
      scheduleResult.data.map(item => `- ID: "${item.id}", Título: "${item.title}", Canal: "${item.channel || 'IG'}", Fecha: "${item.scheduled_at?.slice(0, 10)}", Estado: "${item.status}"`).join('\n');
  } else {
    scheduleContext = '\n📅 CRONOGRAMA DE PUBLICACIONES: El calendario de publicaciones está actualmente vacío para este cliente.';
  }

  // 2) Contexto de Reportes de Tendencias
  let trendsContext = '';
  if (trendsResult && trendsResult.data) {
    const latestReport = trendsResult.data;
    const insightsStr = (latestReport.insights || [])
      .map(ins => `- [TENDENCIA] "${ins.title}": ${ins.description} (Acción recomendada: ${ins.suggested_action})`)
      .join('\n');
    trendsContext = `\n🔥 ÚLTIMAS TENDENCIAS DETECTADAS EN EL MERCADO PARA EL CLIENTE:\n- Reporte: "${latestReport.title}"\n- Resumen: "${latestReport.summary}"\n- Insights de Tendencias Recientes:\n${insightsStr || 'Ninguno'}`;
  } else {
    trendsContext = '\n🔥 TENDENCIAS DE MERCADO: Aún no se han escaneado tendencias para este cliente hoy.';
  }

  // 3) Contexto de Meta Ads
  let metaContext = '';
  if (metaResult && metaResult.data) {
    const metaIntegration = metaResult.data;
    metaContext = `\n📊 INTEGRACIÓN Y ANALÍTICAS DE META ADS:\n- Estado de Conexión: "${metaIntegration.status}"\n- ID Cuenta Publicitaria vinculada: "${metaIntegration.meta_ad_account_id}"\n- Nota: Tienes acceso autorizado a optimizar la pauta de anuncios y audiencias de esta cuenta.`;
  } else {
    metaContext = '\n📊 INTEGRACIÓN DE META ADS: La cuenta publicitaria de Meta Ads todavía no ha sido conectada por el usuario.';
  }

  // 4) Contexto de Comentarios de Social Inbox
  let commentsContext = '';
  if (commentsResult && commentsResult.length > 0) {
    commentsContext = `\n💬 COMENTARIOS RECIENTES DE CLIENTES EN REDES SOCIALES (Social Inbox):\n` +
      commentsResult.map(c => `- ID: "${c.id}", Usuario: "@${c.username}", Red: "${c.platform}", Post: "${c.post_title}", Mensaje: "${c.text}", Estado: "${c.status}"`).join('\n') +
      `\nNota: Si el usuario te pide responder a un comentario específico, propón un comando de tipo "reply_comment" con el ID del comentario, la plataforma y el texto de tu respuesta redactada.`;
  } else {
    commentsContext = '\n💬 COMENTARIOS DE REDES SOCIALES: No hay comentarios recientes pendientes de respuesta en este momento.';
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

  // Buscar chunks relevantes de documentos si hay embedding
  let matches = [];
  if (queryEmbedding && queryEmbedding.length > 0) {
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
  }
  const topContext = (matches || []).map(m => m.content).join('\n---\n');

  // Construir historial de conversación
  const conversationHistory = Array.isArray(chatHistory) 
    ? chatHistory.map(msg => ({ role: msg.role, content: msg.content }))
    : [];

  // Inyectar directrices de expertise y personalidad del Agente Compañero
  const agentContextPrompt = `Te llamas "Aura". Eres la Directora Estratégica de la agencia y la principal Asesora y Consultora de Marketing del usuario. Hablas de forma totalmente natural, cercana, fresca y humana (como si estuvieras chateando por Slack o WhatsApp con un colega de confianza).
NO hables como un robot corporativo frío ni uses esquemas tipográficos exageradamente perfectos con interminables viñetas en negrita o bloques gigantes de texto formateado. Escribe oraciones naturales, fluidas, con exclamaciones cálidas y emoticonos oportunos (como 🙌, 🔥, 😉, de una!, dale!).
Adopta el comportamiento y tono de la persona que te habla.

🧠 TU ROL DE ASESORA Y CONSULTORA ESTRATÉGICA:
- Actúas como el puente y compañero interactivo entre el usuario y la plataforma web. Tienes la facultad de sugerir y programar publicaciones, responder comentarios de redes sociales y actualizar la identidad/ADN de marca del negocio.
- Si el usuario te plantea una duda, un problema de su negocio (ej. "no vendo", "tengo poco engagement", "mis campañas no funcionan") o te pide feedback sobre cómo comunicar:
  1. Analiza el ADN de su marca (Industria, Público objetivo, Tono de voz, Valores) y el contexto de sus anuncios/cronograma.
  2. Ofrece un diagnóstico honesto, profesional y empático. Diles qué podría estar fallando en su comunicación actual.
  3. Presenta propuestas y planes concretos para mejorar sus campañas en Meta Ads o cambiar su tono/estilo de comunicación para conectar mejor con la audiencia.
  4. Si tu propuesta requiere cambiar o afinar su identidad de marca actual (como re-definir su tono o público objetivo), explícaselo y proponle al instante un comando de tipo "update_brand_profile" con las sugerencias para que lo apruebe con un click.

Tu gran superpoder es que puedes controlar y armar cada rincón del Cronograma/Calendario del cliente. De forma proactiva puedes proponer crear eventos, reprogramarlos, cambiar su estado o eliminarlos usando los comandos correspondientes. Si el usuario te da una orden o aprueba una idea tuya, actúa al instante como su mano derecha: sugiérele las fechas ideales del mes, los formatos y redacta copies brutales listos para publicar, invitando a confirmar las tarjetas con un solo click.
Siempre que realices o sugieras un cambio estructural o de identidad, hazlo a través de un comando explícito de tipo "update_brand_profile", "create", "reply_comment", etc., para que el usuario pueda aplicarlo haciendo clic en 'Aprobar'.

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
${commentsContext}

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

  let userContent = userPrompt;
  if (uploadedImageUrl) {
    userContent = [
      { type: 'text', text: userPrompt },
      { type: 'image_url', image_url: { url: uploadedImageUrl } }
    ];
  }

  const messages = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory,
    { role: 'user', content: userContent }
  ];

  let responseContent;
  let modelUsed = model || 'gpt-5';
  let isFallback = false;

  try {
    responseContent = await callLLM({
      messages,
      responseSchema: chatResponseSchema,
      model: modelUsed,
      temperature: 0.7,
      maxTokens: 4000
    });
  } catch (err) {
    const isGemini = modelUsed.startsWith('gemini-');
    const isGPT5 = modelUsed.startsWith('gpt-5');

    if ((isGemini || isGPT5) && openaiApiKey && modelUsed !== 'gpt-4o-mini') {
      console.warn(`⚠️ [${modelUsed} Chat Error] ${err.message}. Intentando fallback automático a gpt-4o-mini...`);
      modelUsed = 'gpt-4o-mini';
      isFallback = true;
      responseContent = await callLLM({
        messages,
        responseSchema: chatResponseSchema,
        model: modelUsed,
        temperature: 0.7,
        maxTokens: 4000
      });
    } else {
      throw err;
    }
  }

  try {
    const parsed = robustJSONParse(responseContent);
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
      commands,
      modelUsed,
      isFallback
    };

  } catch (e) {
    console.error('Error al parsear respuesta estructurada de Aura:', responseContent, e);
    return {
      response: 'Lo siento, he tenido un problema interno al procesar mi respuesta estructurada.',
      command: null,
      modelUsed,
      isFallback
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

export const extractImageBase64 = async (url) => {
  if (url.startsWith('data:')) {
    const match = url.match(/^data:([^;]+);base64,(.+)$/);
    if (match) {
      return { mimeType: match[1], data: match[2] };
    }
  }
  const resp = await fetch(url);
  const buffer = await resp.arrayBuffer();
  const mimeType = resp.headers.get('content-type') || 'image/jpeg';
  const data = Buffer.from(buffer).toString('base64');
  return { mimeType, data };
};

export const cropToAspectRatio = async (base64Str, mimeType, aspectRatio) => {
  if (!base64Str || base64Str.length < 100) return base64Str;
  if (mimeType && mimeType.includes('svg')) return base64Str;

  try {
    const imgBuffer = Buffer.from(base64Str, 'base64');
    const metadata = await sharp(imgBuffer).metadata();
    const originalWidth = metadata.width;
    const originalHeight = metadata.height;
    const channels = metadata.channels || 4;

    const parts = aspectRatio.split(':');
    if (parts.length !== 2) return base64Str;

    const targetW = parseFloat(parts[0]);
    const targetH = parseFloat(parts[1]);
    const targetRatio = targetW / targetH;
    const currentRatio = originalWidth / originalHeight;

    const ratioDiff = Math.abs(currentRatio - targetRatio) / currentRatio;

    let formatExtension = 'png';
    if (mimeType) {
      if (mimeType.includes('jpeg') || mimeType.includes('jpg')) formatExtension = 'jpeg';
      else if (mimeType.includes('webp')) formatExtension = 'webp';
      else if (mimeType.includes('gif')) formatExtension = 'gif';
    }

    if (ratioDiff <= 0.03) {
      console.log(`📏 [Sharp Crop] Relación muy similar (diff: ${(ratioDiff * 100).toFixed(1)}%). Redimensionando sutilmente.`);
      const resizedBuffer = await sharp(imgBuffer)
        .resize(originalWidth, Math.round(originalWidth / targetRatio))
        .toFormat(formatExtension)
        .toBuffer();
      return resizedBuffer.toString('base64');
    }

    let finalW = originalWidth;
    let finalH = Math.round(originalWidth / targetRatio);

    if (finalH > 2048) {
      finalH = 2048;
      finalW = Math.round(finalH * targetRatio);
    } else if (finalW > 2048) {
      finalW = 2048;
      finalH = Math.round(finalW / targetRatio);
    }

    console.log(`🎨 [Sharp Crop] Adaptando de ${originalWidth}x${originalHeight} a ${finalW}x${finalH} (Relación ${aspectRatio}) usando relleno.`);

    const topPixels = await sharp(imgBuffer).extract({ left: 0, top: 0, width: originalWidth, height: 1 }).raw().toBuffer();
    const bottomPixels = await sharp(imgBuffer).extract({ left: 0, top: originalHeight - 1, width: originalWidth, height: 1 }).raw().toBuffer();
    const leftPixels = await sharp(imgBuffer).extract({ left: 0, top: 0, width: 1, height: originalHeight }).raw().toBuffer();
    const rightPixels = await sharp(imgBuffer).extract({ left: originalWidth - 1, top: 0, width: 1, height: originalHeight }).raw().toBuffer();

    const rgbColors = [];

    for (let i = 0; i < 10; i++) {
      const x = Math.floor((originalWidth - 1) * (i / 9));
      const topIdx = x * channels;
      rgbColors.push({
        r: topPixels[topIdx],
        g: topPixels[topIdx + 1],
        b: topPixels[topIdx + 2],
        a: channels === 4 ? topPixels[topIdx + 3] : 255
      });
      const botIdx = x * channels;
      rgbColors.push({
        r: bottomPixels[botIdx],
        g: bottomPixels[botIdx + 1],
        b: bottomPixels[botIdx + 2],
        a: channels === 4 ? bottomPixels[botIdx + 3] : 255
      });
    }

    for (let i = 0; i < 10; i++) {
      const y = Math.floor((originalHeight - 1) * (i / 9));
      const leftIdx = y * channels;
      rgbColors.push({
        r: leftPixels[leftIdx],
        g: leftPixels[leftIdx + 1],
        b: leftPixels[leftIdx + 2],
        a: channels === 4 ? leftPixels[leftIdx + 3] : 255
      });
      const rightIdx = y * channels;
      rgbColors.push({
        r: rightPixels[rightIdx],
        g: rightPixels[rightIdx + 1],
        b: rightPixels[rightIdx + 2],
        a: channels === 4 ? rightPixels[rightIdx + 3] : 255
      });
    }

    const avgR = rgbColors.reduce((sum, c) => sum + c.r, 0) / rgbColors.length;
    const avgG = rgbColors.reduce((sum, c) => sum + c.g, 0) / rgbColors.length;
    const avgB = rgbColors.reduce((sum, c) => sum + c.b, 0) / rgbColors.length;
    const avgA = rgbColors.reduce((sum, c) => sum + c.a, 0) / rgbColors.length;

    const varianceR = rgbColors.reduce((sum, c) => sum + Math.pow(c.r - avgR, 2), 0) / rgbColors.length;
    const varianceG = rgbColors.reduce((sum, c) => sum + Math.pow(c.g - avgG, 2), 0) / rgbColors.length;
    const varianceB = rgbColors.reduce((sum, c) => sum + Math.pow(c.b - avgB, 2), 0) / rgbColors.length;
    const stdDev = Math.sqrt((varianceR + varianceG + varianceB) / 3);

    let bgBuffer;
    let isSolid = stdDev < 18 && avgA > 200;

    if (isSolid) {
      console.log(`🧼 [Sharp Crop] Fondo sólido detectado. Color de relleno: rgba(${Math.round(avgR)}, ${Math.round(avgG)}, ${Math.round(avgB)}, ${(avgA/255).toFixed(2)})`);
    } else {
      console.log(`🖼️ [Sharp Crop] Fondo complejo detectado. Generando relleno desenfocado.`);
      let bgScaleFactor;
      if (currentRatio > targetRatio) {
        bgScaleFactor = finalH / originalHeight;
      } else {
        bgScaleFactor = finalW / originalWidth;
      }
      const bgW = Math.round(originalWidth * bgScaleFactor);
      const bgH = Math.round(originalHeight * bgScaleFactor);

      bgBuffer = await sharp(imgBuffer)
        .resize(bgW, bgH)
        .extract({
          left: Math.round((bgW - finalW) / 2),
          top: Math.round((bgH - finalH) / 2),
          width: finalW,
          height: finalH
        })
        .blur(30)
        .toBuffer();
    }

    let fgScaleFactor;
    if (currentRatio > targetRatio) {
      fgScaleFactor = finalW / originalWidth;
    } else {
      fgScaleFactor = finalH / originalHeight;
    }

    const fgW = Math.round(originalWidth * fgScaleFactor);
    const fgH = Math.round(originalHeight * fgScaleFactor);

    const fgBuffer = await sharp(imgBuffer)
      .resize(fgW, fgH)
      .toBuffer();

    const posX = Math.round((finalW - fgW) / 2);
    const posY = Math.round((finalH - fgH) / 2);

    let finalImageBuffer;
    if (isSolid) {
      finalImageBuffer = await sharp({
        create: {
          width: finalW,
          height: finalH,
          channels: 4,
          background: { r: Math.round(avgR), g: Math.round(avgG), b: Math.round(avgB), alpha: avgA / 255 }
        }
      })
      .composite([{ input: fgBuffer, left: posX, top: posY }])
      .toFormat(formatExtension)
      .toBuffer();
    } else {
      finalImageBuffer = await sharp(bgBuffer)
        .composite([{ input: fgBuffer, left: posX, top: posY }])
        .toFormat(formatExtension)
        .toBuffer();
    }

    return finalImageBuffer.toString('base64');
  } catch (err) {
    console.error('⚠️ [Sharp Crop] Error al adaptar imagen:', err.message);
  }
  return base64Str;
};

export const analyzePostImageForAdaptation = async ({ imageUrl }) => {
  if (!openaiApiKey) {
    throw new Error('OPENAI_API_KEY no está configurada.');
  }

  const layoutDefinition = {
    type: "object",
    properties: {
      texts: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "number" },
            text: { type: "string" },
            color: { type: "string", description: "Approximate hex color of the text (e.g. #FFFFFF)" },
            fontSize: { type: "string", description: "Relative approximate font size (e.g. 24px, 16px, 12px)" },
            fontWeight: { type: "string", description: "bold | normal | medium" },
            xPct: { type: "number", description: "Recommended X coordinate percentage (0-100) from left edge for this specific aspect ratio" },
            yPct: { type: "number", description: "Recommended Y coordinate percentage (0-100) from top edge for this specific aspect ratio" }
          },
          required: ["id", "text", "color", "fontSize", "fontWeight", "xPct", "yPct"],
          additionalProperties: false
        }
      },
      logo: {
        type: "object",
        properties: {
          detected: { type: "boolean" },
          xPct: { type: "number", description: "Recommended X coordinate percentage (0-100) from left edge for this specific aspect ratio" },
          yPct: { type: "number", description: "Recommended Y coordinate percentage (0-100) from top edge for this specific aspect ratio" }
        },
        required: ["detected", "xPct", "yPct"],
        additionalProperties: false
      }
    },
    required: ["texts", "logo"],
    additionalProperties: false
  };

  const postAnalysisSchema = {
    type: "object",
    properties: {
      analysis: {
        type: "object",
        properties: {
          product: { type: "string" },
          background: { type: "string" },
          style: { type: "string" },
          text: { type: "string" }
        },
        required: ["product", "background", "style", "text"],
        additionalProperties: false
      },
      layers: {
        type: "object",
        properties: {
          "1:1": layoutDefinition,
          "9:16": layoutDefinition,
          "16:9": layoutDefinition,
          "4:5": layoutDefinition,
          "4:3": layoutDefinition
        },
        required: ["1:1", "9:16", "16:9", "4:5", "4:3"],
        additionalProperties: false
      },
      outpaint_prompt: { 
        type: "string", 
        description: "Detailed prompt for generating the background extension (outpaint), describing the lighting, textures, colors, and environment matching the original background, without mentioning any text, copy, or logos." 
      }
    },
    required: ["analysis", "layers", "outpaint_prompt"],
    additionalProperties: false
  };

  const messages = [
    {
      role: 'user',
      content: [
        {
          type: 'text',
          text: `You are an expert graphic designer and advertising layout director. 
Your task is to analyze the provided image of a finished social media post or banner and detect its layers to build an interactive canvas overlay.

Since the layout must be adapted to different aspect ratios, you must generate a RECOMMENDED layer layout (texts and logo coordinates) for EACH target ratio:
- "1:1": Square feed. Standard balanced layout.
- "9:16": Vertical story/reel. Recompose the layout vertically (e.g., stack texts and logo vertically, centered, spaced out to fit a tall canvas).
- "16:9": Horizontal web banner. Recompose the layout horizontally or wide (e.g. side-by-side arrangement, keeping texts grouped to one side and the logo/empty space balanced).
- "4:5": Vertical portrait feed. Slightly taller than square, adjust coordinates accordingly.
- "4:3": Standard feed. Slightly wider than square.

For each text element (which keeps the same 'id' and 'text' content across all formats), estimate the optimal center coordinates (xPct 0-100, yPct 0-100) and styling (color, fontSize, fontWeight) appropriate for each aspect ratio so the composition looks visually balanced and professional.

Respond STRICTLY with a JSON object matching the schema provided.`
        },
        {
          type: 'image_url',
          image_url: {
            url: imageUrl
          }
        }
      ]
    }
  ];

  const responseText = await callLLM({
    messages,
    model: 'gpt-4o-mini',
    responseSchema: postAnalysisSchema,
    temperature: 0.3
  });

  return robustJSONParse(responseText);
};

// nodemon-trigger-change-force-restart

