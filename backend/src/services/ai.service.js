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

const callLLM = async (prompt) => {
  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiApiKey}` },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    }),
  });
  if (!resp.ok) throw new Error('Error al llamar al LLM');
  const json = await resp.json();
  const content = json.choices?.[0]?.message?.content || '';
  return content;
};

export const generateScheduleIdeas = async ({ clientId, userPrompt, monthContext, token }) => {
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
    // Intentar programar dentro del mes objetivo si se proporcionó
    let baseYear, baseMonth;
    if (monthContext && typeof monthContext === 'object') {
      baseYear = Number(monthContext.year) || new Date().getFullYear();
      baseMonth = Number(monthContext.month) || (new Date().getMonth() + 1);
    } else {
      const now = new Date();
      baseYear = now.getFullYear();
      baseMonth = now.getMonth() + 1;
    }
    const baseDate = new Date(baseYear, (baseMonth - 1), 1);
    const pad = (n) => String(n).padStart(2, '0');
    const nextDate = (offset) => {
      const d = new Date(baseDate);
      // Distribuir semanalmente pero dentro del mismo mes
      d.setDate(1 + (offset * 3)); // cada ~3 días para repartir 10 ideas en el mes
      const endDay = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0).getDate();
      const day = Math.min(Math.max(d.getDate(), 1), endDay);
      return `${baseDate.getFullYear()}-${pad(baseDate.getMonth() + 1)}-${pad(day)}`;
    };
    const ideas = Array.from({ length: 10 }, (_, i) => ({
      title: `${userPrompt} — Idea ${i + 1} (${client.name})`,
      copy: `🚀 ${userPrompt} para ${client.name}! 

✨ Idea creativa #${i + 1} diseñada especialmente para conectar con tu audiencia.

💡 ¿Qué opinas? ¡Déjanos tu comentario!

#Marketing #RedesSociales #${client.name.replace(/\s+/g, '')}`,
      scheduled_at: nextDate(i + 1),
      status: 'Pendiente',
    }));
    return ideas;
  }

  // Embedding de la consulta
  const queryEmbedding = await embedText(userPrompt);

  // Buscar chunks relevantes (asume función SQL match_document_chunks(query_embedding vector, client_id uuid))
  const { data: matches, error: matchErr } = await supabaseAdmin.rpc('match_document_chunks', {
    query_embedding: queryEmbedding,
    match_client_id: clientId,
    match_count: 8,
  });
  if (matchErr) throw new Error(`Error al buscar contexto: ${matchErr.message}`);
  const topContext = (matches || []).map(m => m.content).join('\n---\n');

  // Normalizar contexto de mes si viene del frontend
  let calendarCtx = '';
  let targetYear, targetMonthNum, targetMonthLabel;
  if (monthContext && typeof monthContext === 'object') {
    const pad = (n) => String(n).padStart(2, '0');
    targetYear = Number(monthContext.year);
    targetMonthNum = Number(monthContext.month);
    const startLabelDate = new Date(targetYear, (targetMonthNum || 1) - 1, 1);
    targetMonthLabel = startLabelDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
    const sd = monthContext.range?.start;
    const ed = monthContext.range?.end;
    const specials = monthContext.specialDates || [];
    calendarCtx = [
      sd && ed ? `Rango visible: ${sd} a ${ed}` : null,
      specials.length ? `Fechas especiales: ${specials.join(', ')}` : null
    ].filter(Boolean).join(' | ');
  } else if (Array.isArray(monthContext)) {
    calendarCtx = monthContext.join(', ');
  }

  // Fallback a mes actual si no se envía monthContext
  const now = new Date();
  const fallbackYear = now.getFullYear();
  const fallbackMonthNum = now.getMonth() + 1;
  const fallbackMonthLabel = now.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
  if (!targetYear) targetYear = fallbackYear;
  if (!targetMonthNum) targetMonthNum = fallbackMonthNum;
  if (!targetMonthLabel) targetMonthLabel = fallbackMonthLabel;

  const megaPrompt = `Eres un estratega de redes sociales experto especializado en crear contenido atractivo y efectivo.

CONTEXTO TEMPORAL:
- Fecha actual: ${now.toLocaleDateString('es-ES')}
- Mes objetivo: ${targetMonthLabel}
- Todas las ideas deben programarse dentro de ${targetMonthLabel}

CONTEXTO DEL CLIENTE:
${topContext}

${calendarCtx ? `CONTEXTO DEL CALENDARIO: ${calendarCtx}` : ''}

TAREA: Genera 8 a 10 ideas de posteos creativos alineadas a: "${userPrompt}" para el cliente ${client.name}.

INSTRUCCIONES ESPECÍFICAS:
1. Cada idea debe incluir COPY COMPLETO para redes sociales (texto del post listo para publicar)
2. Programa estrictamente las ideas en fechas del mes objetivo (${targetMonthLabel})
3. Considera las fechas importantes mencionadas para timing estratégico
4. Varía formatos (reel, carrusel, post estático, story, live, ilustración, producción con cámara, animado)
5. Ajusta el tono a la marca y al historial conocido del cliente

FORMATO DE RESPUESTA: Devuelve únicamente un JSON válido (sin texto adicional). Un array de objetos con:
- title (string)
- copy (string)
- scheduled_at (string): 'YYYY-MM-DD' con año ${targetYear} y mes ${String(targetMonthNum).padStart(2, '0')}
- status (string): 'Pendiente'
- channel (string) opcional: IG | FB | TikTok | LinkedIn

Ejemplo de estructura:
[
  {
    "title": "Título descriptivo",
    "copy": "🌟 Texto completo del post con emojis y call-to-action #hashtags",
    "scheduled_at": "${targetYear}-${String(targetMonthNum).padStart(2, '0')}-15",
    "status": "Pendiente",
    "channel": "IG"
  }
]`;


  const llmResponse = await callLLM(megaPrompt);
// src/services/ai.service.js

// ... (El resto de tus importaciones y funciones como embedText, callLLM, etc., se mantienen igual)

/**
 * Envía una imagen a GPT-4o para que la analice y describa.
 * @param {string} imageUrl - La URL pública de la imagen en Supabase Storage.
 * @returns {Promise<string>} Una descripción detallada de la imagen.
 */
const analyzeImage = async (imageUrl) => {
  const prompt = `Analiza esta imagen en detalle. Describe su contenido, los colores predominantes y proporciona codigo de color exacto que se usa, cualquier texto visible (transcríbelo si es legible) y el sentimiento o mensaje general que transmite. La descripción debe ser completa para que sirva como contexto para un asistente de IA.`;

  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${openaiApiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini', // Usamos un modelo con capacidad de visión
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: { url: imageUrl },
            },
          ],
        },
      ],
      max_tokens: 500, // Limitamos la longitud de la descripción
    }),
  });

  if (!resp.ok) {
    const errorDetails = await resp.json();
    console.error('[ERROR DE OPENAI VISION]:', JSON.stringify(errorDetails, null, 2));
    throw new Error(`Error al analizar la imagen: ${errorDetails.error?.message}`);
  }

  const json = await resp.json();
  return json.choices?.[0]?.message?.content || '';
};

// Asegúrate de exportar la nueva función junto a las demás
// Esta exportación probablemente está en ai.service.js o en un archivo index de servicios.
// Si no estás seguro, busca dónde se exporta generateScheduleIdeas y añádela ahí.
// Por ahora, asumiremos que está en el mismo archivo y la exportamos aquí (ejemplo):
// export { generateScheduleIdeas, analyzeImage }; 
// NOTA: La exportación real depende de la estructura de tu proyecto.
// La clave es que `processDocument` pueda importarla.
// Para simplificar, vamos a importarla directamente en el otro archivo.
  // Intentar parsear JSON
  let ideas;
  try {
    ideas = JSON.parse(llmResponse);
  } catch (_e) {
    // Intento de sanitización básica si el modelo añade texto extra
    const jsonStart = llmResponse.indexOf('[');
    const jsonEnd = llmResponse.lastIndexOf(']');
    if (jsonStart >= 0 && jsonEnd >= 0) {
      ideas = JSON.parse(llmResponse.slice(jsonStart, jsonEnd + 1));
    } else {
      throw new Error('La respuesta del modelo no es JSON válido');
    }
  }
  // Post-procesar: asegurar que las fechas caen dentro del mes objetivo si se proporcionó
  try {
    if (Array.isArray(ideas) && targetYear && targetMonthNum) {
      const pad = (n) => String(n).padStart(2, '0');
      const endDay = new Date(targetYear, targetMonthNum, 0).getDate();
      ideas = ideas.map((it, idx) => {
        const safe = { ...it };
        let day = 1 + (idx % endDay);
        try {
          if (safe.scheduled_at) {
            const d = new Date(safe.scheduled_at);
            if (!isNaN(d.getTime())) day = Math.min(Math.max(d.getDate(), 1), endDay);
          }
        } catch {}
        safe.scheduled_at = `${targetYear}-${pad(targetMonthNum)}-${pad(day)}`;
        if (!safe.status) safe.status = 'Pendiente';
        return safe;
      });
    }
  } catch {}

  return ideas;
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
