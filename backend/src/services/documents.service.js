// src/services/documents.service.js

import { supabaseAdmin, createAuthenticatedClient } from '../config/supabaseClient.js';
import pdf from 'pdf-parse/lib/pdf-parse.js';
import mammoth from 'mammoth';
import { get_encoding } from 'tiktoken';
import axios from 'axios';

// --- Variables de Entorno ---
const openaiApiKey = process.env.OPENAI_API_KEY;

// --- Funciones Auxiliares ---

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
    const isVideo = doc.file_type?.startsWith('video/');
    const isAudio = doc.file_type?.startsWith('audio/');

    if (isImage) {
      const { data: publicUrlData } = supabaseAdmin.storage.from('documents').getPublicUrl(doc.storage_path);
      if (!publicUrlData) throw new Error('No se pudo obtener la URL pública de la imagen.');
      console.log(`Analizando imagen: ${publicUrlData.publicUrl}`);
      textToProcess = await analyzeImageWithGPT(publicUrlData.publicUrl);
    } else if (isVideo) {
      console.log(`[RAG-Bypass] Saltando extracción para video: ${doc.storage_path}`);
      textToProcess = `Archivo de video cargado como entregable multimedia. Formato: ${doc.file_type || 'video/mp4'}`;
    } else if (isAudio) {
      console.log(`[RAG-Bypass] Saltando extracción para audio: ${doc.storage_path}`);
      textToProcess = `Archivo de audio cargado como entregable multimedia. Formato: ${doc.file_type || 'audio/mpeg'}`;
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

/**
 * Resuelve y descarga contenido multimedia desde un enlace (YouTube, Pinterest, o direct links)
 * y lo sube al bucket de documentos de Supabase.
 * 
 * @param {string} url - El enlace a descargar.
 * @param {string} clientId - El UUID del cliente.
 * @returns {Promise<object>} Metadatos del archivo subido.
 */
export const downloadMediaFromLink = async (url, clientId) => {
  let downloadUrl = url;
  let fileType = 'application/octet-stream';
  let originalFilename = 'archivo_descargado';
  let buffer = null;

  // 1. Resolver redirecciones iniciales (útil para acortadores como pin.it o youtu.be)
  let resolvedUrl = url;
  try {
    const res = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
      },
      maxRedirects: 5,
      timeout: 8000,
    });
    resolvedUrl = res.config.url || url;
  } catch (err) {
    console.warn('[downloader] No se pudieron resolver redirecciones de la URL, se usará la original:', err.message);
  }

  // 2. CASO A: Pinterest (Scraping elástico del HTML)
  if (resolvedUrl.includes('pinterest.com') || resolvedUrl.includes('pin.it')) {
    console.log('[downloader] Identificado enlace de Pinterest:', resolvedUrl);
    try {
      const htmlRes = await axios.get(resolvedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
        },
        timeout: 10000,
      });
      const html = htmlRes.data;

      // Buscar si el pin es un video (tag og:video) o imagen (tag og:image)
      const videoMatch = html.match(/<meta[^>]*property=["']og:video["'][^>]*content=["']([^"']+)["']/i) ||
                         html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:video["']/i);
      const imageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
                         html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);

      if (videoMatch) {
        downloadUrl = videoMatch[1];
        console.log('[downloader] Video de Pinterest detectado:', downloadUrl);
      } else if (imageMatch) {
        downloadUrl = imageMatch[1];
        console.log('[downloader] Imagen de Pinterest detectada:', downloadUrl);
      } else {
        throw new Error('No se encontraron tags de metadatos og:image ni og:video en Pinterest.');
      }
    } catch (pinterestErr) {
      console.error('[downloader] Error procesando enlace de Pinterest:', pinterestErr.message);
      throw new Error(`Fallo al extraer contenido de Pinterest: ${pinterestErr.message}`);
    }
  }

  // 3. CASO B: YouTube (Cobalt API + Fallback de Miniatura HD)
  else if (resolvedUrl.includes('youtube.com') || resolvedUrl.includes('youtu.be')) {
    console.log('[downloader] Identificado enlace de YouTube:', resolvedUrl);
    let success = false;

    // Intentar descargar el video completo por Cobalt API
    try {
      const cobaltUrl = 'https://api.cobalt.tools/api/json';
      const cobaltRes = await axios.post(cobaltUrl, {
        url: resolvedUrl,
        filenamePattern: 'basic',
      }, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });

      if (cobaltRes.data && cobaltRes.data.url) {
        downloadUrl = cobaltRes.data.url;
        success = true;
        console.log('[downloader] URL de YouTube resuelta vía Cobalt:', downloadUrl);
      }
    } catch (cobaltErr) {
      console.warn('[downloader] La API de Cobalt falló o fue bloqueada, aplicando Fallback a Miniatura HD:', cobaltErr.message);
    }

    // Fallback: Si Cobalt no responde, descargamos la Miniatura HD de YouTube como imagen
    if (!success) {
      let videoId = null;
      if (resolvedUrl.includes('youtu.be/')) {
        videoId = resolvedUrl.split('youtu.be/')[1]?.split(/[?#]/)[0];
      } else {
        videoId = resolvedUrl.split('v=')[1]?.split('&')[0];
      }

      if (videoId) {
        downloadUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
        console.log('[downloader] Fallback de Miniatura de YouTube resuelto:', downloadUrl);
      } else {
        throw new Error('No se pudo extraer el ID de video para el fallback de YouTube.');
      }
    }
  }

  // 4. Descargar el archivo binario final
  console.log('[downloader] Descargando binario final de la URL:', downloadUrl);
  try {
    const mediaRes = await axios.get(downloadUrl, {
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
      },
      timeout: 20000,
    });

    buffer = Buffer.from(mediaRes.data);
    fileType = mediaRes.headers['content-type'] || 'application/octet-stream';
  } catch (downloadErr) {
    // Si falla el maxresdefault.jpg de YouTube (algunos videos viejos no tienen miniatura HD)
    if (downloadUrl.includes('maxresdefault.jpg')) {
      console.log('[downloader] Fallback de Miniatura HD falló, reintentando con calidad media (hqdefault)...');
      try {
        const fallbackUrl = downloadUrl.replace('maxresdefault.jpg', 'hqdefault.jpg');
        const mediaRes = await axios.get(fallbackUrl, {
          responseType: 'arraybuffer',
          timeout: 15000,
        });
        buffer = Buffer.from(mediaRes.data);
        fileType = 'image/jpeg';
      } catch (err) {
        throw new Error(`Fallo al descargar miniatura de fallback: ${err.message}`);
      }
    } else {
      throw new Error(`Error al conectarse a la URL de descarga: ${downloadErr.message}`);
    }
  }

  // 5. Determinar extensión de archivo
  let extension = 'bin';
  if (fileType.includes('image/png')) extension = 'png';
  else if (fileType.includes('image/jpeg')) extension = 'jpg';
  else if (fileType.includes('image/gif')) extension = 'gif';
  else if (fileType.includes('video/mp4')) extension = 'mp4';
  else if (fileType.includes('audio/mpeg')) extension = 'mp3';
  else if (fileType.includes('application/pdf')) extension = 'pdf';
  else {
    // Intentar deducir de la URL original o final
    const parts = downloadUrl.split('/');
    const lastPart = parts[parts.length - 1]?.split(/[?#]/)[0];
    if (lastPart && lastPart.includes('.')) {
      extension = lastPart.split('.').pop();
    }
  }

  // Generar nombre de archivo amigable
  try {
    const urlObj = new URL(url);
    const domainName = urlObj.hostname.replace('www.', '');
    originalFilename = `${domainName}_${Date.now()}.${extension}`;
  } catch {
    originalFilename = `enlace_${Date.now()}.${extension}`;
  }

  // 6. Subir a Supabase Storage
  const storagePath = `${clientId}/${Date.now()}.${extension}`;
  console.log('[downloader] Subiendo a Supabase Storage bucket documents:', storagePath);
  const { error: uploadError } = await supabaseAdmin.storage
    .from('documents')
    .upload(storagePath, buffer, {
      contentType: fileType,
      duplex: 'half',
    });

  if (uploadError) {
    throw new Error(`Fallo al cargar el archivo en el storage de Supabase: ${uploadError.message}`);
  }

  return {
    file_name: originalFilename,
    storage_path: storagePath,
    file_type: fileType,
    file_size: buffer.length,
  };
};