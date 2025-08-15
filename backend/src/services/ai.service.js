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
  if (!openaiApiKey) throw new Error('OPENAI_API_KEY no configurada');

  // Validar acceso al cliente vía RLS
  const supabaseAuth = createAuthenticatedClient(token);
  const { data: client, error: clientErr } = await supabaseAuth.from('clients').select('id, name, agency_id').eq('id', clientId).single();
  if (clientErr) throw new Error(clientErr.message);

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

  const calendarCtx = Array.isArray(monthContext) ? monthContext.join(', ') : '';

  const megaPrompt = `Eres un estratega de redes sociales experto.
Contexto del cliente (fragmentos relevantes):\n${topContext}
Fechas importantes del mes: ${calendarCtx}
Tarea: Genera 5 ideas de posteos creativos sobre el tema: "${userPrompt}" para el cliente ${client.name}.

Instrucción de formato: Tu respuesta debe ser únicamente un objeto JSON válido, sin texto introductorio ni explicaciones. Debe ser un array donde cada objeto contenga: title (string), scheduled_at (string 'YYYY-MM-DD'), y status (string, 'Pendiente').`;

  const llmResponse = await callLLM(megaPrompt);
// src/services/ai.service.js

// ... (El resto de tus importaciones y funciones como embedText, callLLM, etc., se mantienen igual)

/**
 * Envía una imagen a GPT-4o para que la analice y describa.
 * @param {string} imageUrl - La URL pública de la imagen en Supabase Storage.
 * @returns {Promise<string>} Una descripción detallada de la imagen.
 */
const analyzeImage = async (imageUrl) => {
  const prompt = `Analiza esta imagen en detalle. Describe su contenido, los colores predominantes, cualquier texto visible (transcríbelo si es legible) y el sentimiento o mensaje general que transmite. La descripción debe ser completa para que sirva como contexto para un asistente de IA.`;

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

  return ideas;
};
