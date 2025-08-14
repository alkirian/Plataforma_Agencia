import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '../config/supabaseClient.js';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_KEY;
const openaiApiKey = process.env.OPENAI_API_KEY;

const createAuthenticatedClient = (token) => {
  if (!token) throw new Error('Token requerido');
  return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
};

const fetchFileFromStorage = async (path) => {
  const { data, error } = await supabaseAdmin.storage.from('documents').download(path);
  if (error) throw new Error(`No se pudo descargar el archivo: ${error.message}`);
  return data; // Blob/Buffer
};

const extractText = async (buffer, fileType) => {
  if (fileType?.includes('pdf')) {
    const data = await pdf(buffer);
    return data.text;
  }
  if (fileType?.includes('docx')) {
    const { value } = await mammoth.extractRawText({ buffer });
    return value;
  }
  // Fallback: try toString
  return buffer.toString?.('utf8') || '';
};

const chunkText = (text, wordsPerChunk = 400) => {
  const words = text.split(/\s+/);
  const chunks = [];
  for (let i = 0; i < words.length; i += wordsPerChunk) {
    chunks.push(words.slice(i, i + wordsPerChunk).join(' '));
  }
  return chunks;
};

const embedText = async (text) => {
  if (!openaiApiKey) throw new Error('OPENAI_API_KEY no configurada');
  const resp = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${openaiApiKey}`,
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text,
    }),
  });
  if (!resp.ok) throw new Error('Error al generar embeddings');
  const json = await resp.json();
  return json.data?.[0]?.embedding || [];
};

export const processDocument = async (documentId, token) => {
  // Obtener documento para conocer storage_path, file_type, client_id, agency_id
  const supabaseAuth = createAuthenticatedClient(token);
  const { data: doc, error: docErr } = await supabaseAuth
    .from('documents')
    .select('id, storage_path, file_type, client_id, agency_id')
    .eq('id', documentId)
    .single();
  if (docErr) throw new Error(`No se pudo cargar el documento: ${docErr.message}`);

  // Marcar como procesando
  await supabaseAdmin.from('documents').update({ ai_status: 'processing' }).eq('id', documentId);

  // Descargar y extraer texto
  const fileData = await fetchFileFromStorage(doc.storage_path);
  // Support Buffer for pdf-parse/mammoth
  const arrayBuffer = await fileData.arrayBuffer?.();
  const buffer = arrayBuffer ? Buffer.from(arrayBuffer) : fileData;
  const text = await extractText(buffer, doc.file_type?.toLowerCase());
  const chunks = chunkText(text, 400);

  // Generar embeddings por chunk y guardar
  for (const chunk of chunks) {
    const vector = await embedText(chunk);
    const { error: insErr } = await supabaseAdmin.from('document_chunks').insert({
      client_id: doc.client_id,
      agency_id: doc.agency_id,
      document_id: doc.id,
      content: chunk,
      embedding: vector,
    });
    if (insErr) throw new Error(`Error guardando chunk: ${insErr.message}`);
  }

  // Marcar como listo
  await supabaseAdmin.from('documents').update({ ai_status: 'ready' }).eq('id', documentId);
};
