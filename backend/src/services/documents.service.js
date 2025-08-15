// src/services/documents.service.js

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '../config/supabaseClient.js';
import pdf from 'pdf-parse/lib/pdf-parse.js';
import mammoth from 'mammoth';
import { get_encoding } from 'tiktoken';

// --- Variables de Entorno ---
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_KEY;
const openaiApiKey = process.env.OPENAI_API_KEY;

// --- Funciones Auxiliares ---

const createAuthenticatedClient = (token) => {
  if (!token) throw new Error('Token requerido');
  return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
};

const fetchFileFromStorage = async (path) => {
  const { data, error } = await supabaseAdmin.storage.from('documents').download(path);
  if (error) throw new Error(`No se pudo descargar el archivo: ${error.message}`);
  return data;
};

const extractText = async (buffer, fileType) => {
  if (fileType?.includes('pdf')) {
    const data = await pdf(buffer, { max: 200 });
    return data.text;
  }
  if (fileType?.includes('docx')) {
    const { value } = await mammoth.extractRawText({ buffer });
    return value;
  }
  return buffer.toString?.('utf8') || '';
};

const chunkText = (text, tokenLimit = 4000) => {
  const encoder = get_encoding('cl100k_base');
  const tokens = encoder.encode(text);
  const chunks = [];
  for (let i = 0; i < tokens.length; i += tokenLimit) {
    const chunkTokens = tokens.slice(i, i + tokenLimit);
    const textChunk = new TextDecoder().decode(encoder.decode(chunkTokens));
    chunks.push(textChunk);
  }
  encoder.free();
  return chunks;
};

const embedText = async (text) => {
  if (!openaiApiKey) throw new Error('OPENAI_API_KEY no configurada');
  const resp = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiApiKey}` },
    body: JSON.stringify({ model: 'text-embedding-3-small', input: text }),
  });
  if (!resp.ok) {
    const errorDetails = await resp.json();
    console.error('[ERROR DE OPENAI EMBEDDING]:', JSON.stringify(errorDetails, null, 2));
    throw new Error(`Error al generar embeddings: ${errorDetails.error?.message}`);
  }
  const json = await resp.json();
  const embedding = json.data?.[0]?.embedding;
  if (!embedding) {
    console.error('[ERROR] La respuesta de OpenAI no contenía un embedding para el texto:', text.substring(0, 100));
    throw new Error('La respuesta de OpenAI fue exitosa pero no se encontró el embedding.');
  }
  return embedding;
};

// ✨ AQUÍ ESTÁ LA FUNCIÓN QUE FALTABA ✨
const analyzeImageWithGPT = async (imageUrl) => {
  const prompt = `Analiza esta imagen en detalle. Describe su contenido, los colores predominantes, cualquier texto visible (transcríbelo si es legible) y el sentimiento o mensaje general que transmite. La descripción debe ser completa para que sirva como contexto para un asistente de IA.`;
  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiApiKey}` },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: [{ type: 'text', text: prompt }, { type: 'image_url', image_url: { url: imageUrl } }] }],
      max_tokens: 500,
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

// --- Función Principal del Pipeline ---

export const processDocument = async (documentId, token) => {
  const supabaseAuth = createAuthenticatedClient(token);
  const { data: doc, error: docErr } = await supabaseAuth
    .from('documents')
    .select('id, storage_path, file_type, client_id, agency_id')
    .eq('id', documentId)
    .single();
  if (docErr) throw new Error(`No se pudo cargar el documento: ${docErr.message}`);

  try {
    await supabaseAdmin.from('documents').update({ ai_status: 'processing' }).eq('id', documentId);
    let textToProcess = '';
    const isImage = doc.file_type?.startsWith('image/');
    if (isImage) {
      const { data: publicUrlData } = supabaseAdmin.storage.from('documents').getPublicUrl(doc.storage_path);
      if (!publicUrlData) throw new Error('No se pudo obtener la URL pública de la imagen.');
      console.log(`Analizando imagen: ${publicUrlData.publicUrl}`);
      textToProcess = await analyzeImageWithGPT(publicUrlData.publicUrl);
    } else {
      const fileData = await fetchFileFromStorage(doc.storage_path);
      const arrayBuffer = await fileData.arrayBuffer?.();
      const buffer = arrayBuffer ? Buffer.from(arrayBuffer) : fileData;
      textToProcess = await extractText(buffer, doc.file_type?.toLowerCase());
    }
    const chunks = chunkText(textToProcess);
    for (const chunk of chunks) {
      if (!chunk || chunk.trim() === '') continue;
      const sanitizedChunk = chunk.replace(/\u0000/g, '');
      const vector = await embedText(sanitizedChunk);
      const { error: insErr } = await supabaseAdmin.from('document_chunks').insert({
        client_id: doc.client_id,
        agency_id: doc.agency_id,
        document_id: doc.id,
        content: sanitizedChunk,
        embedding: vector,
      });
      if (insErr) throw new Error(`Error guardando chunk: ${insErr.message}`);
    }
    await supabaseAdmin.from('documents').update({ ai_status: 'ready' }).eq('id', documentId);
  } catch (error) {
    await supabaseAdmin.from('documents').update({ ai_status: 'error' }).eq('id', documentId);
    throw error;
  }
};

// --- Otras Funciones Exportadas del Servicio ---

export const getDocumentsByClient = async (clientId, agencyId) => {
  const { data, error } = await supabaseAdmin
    .from('documents')
    .select('*')
    .eq('client_id', clientId)
    .eq('agency_id', agencyId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(`No se pudieron obtener los documentos: ${error.message}`);
  return data || [];
};

export const createDocument = async (doc) => {
  const { data, error } = await supabaseAdmin
    .from('documents')
    .insert(doc)
    .select()
    .single();
  if (error) throw new Error(`No se pudo crear el documento: ${error.message}`);
  return data;
};

export const deleteDocumentById = async (documentId, agencyId) => {
  const { data: doc, error: docError } = await supabaseAdmin
    .from('documents')
    .select('storage_path')
    .eq('id', documentId)
    .eq('agency_id', agencyId)
    .single();
  if (docError) throw new Error(`No se encontró el documento para eliminar: ${docError.message}`);
  if (doc.storage_path) {
    const { error: storageError } = await supabaseAdmin.storage.from('documents').remove([doc.storage_path]);
    if (storageError) console.error(`Advertencia: No se pudo eliminar el archivo del storage: ${storageError.message}`);
  }
  const { error } = await supabaseAdmin
    .from('documents')
    .delete()
    .eq('id', documentId)
    .eq('agency_id', agencyId);
  if (error) throw new Error(`No se pudo eliminar el registro del documento: ${error.message}`);
};