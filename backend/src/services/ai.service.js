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
