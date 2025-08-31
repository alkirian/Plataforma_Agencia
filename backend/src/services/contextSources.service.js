// src/services/contextSources.service.js

import { supabaseAdmin, createAuthenticatedClient } from '../config/supabaseClient.js';
import pdf from 'pdf-parse/lib/pdf-parse.js';
import mammoth from 'mammoth';
import { get_encoding } from 'tiktoken';
import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';
import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';

// --- Variables de Entorno ---
const openaiApiKey = process.env.OPENAI_API_KEY;

// --- Funciones Auxiliares Reutilizadas ---

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

// --- Nuevas Funciones para Scraping de URLs ---

const scrapeUrlWithPuppeteer = async (url) => {
  let browser;
  try {
    console.log(`[SCRAPING] Iniciando scraping de URL: ${url}`);
    
    browser = await puppeteer.launch({ 
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    // Configurar timeout y esperar a que cargue la página
    await page.goto(url, { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Extraer contenido HTML
    const content = await page.content();
    
    // Usar Readability para extraer el contenido principal
    const dom = new JSDOM(content, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();
    
    let extractedText = '';
    let title = '';
    let excerpt = '';
    
    if (article) {
      title = article.title || '';
      extractedText = article.textContent || '';
      excerpt = article.excerpt || '';
    } else {
      // Fallback con Cheerio si Readability falla
      const $ = cheerio.load(content);
      title = $('title').text() || $('h1').first().text() || '';
      
      $('script, style, nav, header, footer, aside, .advertisement, .ads, .comments').remove();
      
      // Extraer texto principal
      const mainContent = $('main, article, .content, .post-content, .entry-content, body').first();
      extractedText = mainContent.text() || $('body').text() || '';
      
      // Crear excerpt del primer párrafo
      excerpt = $('p').first().text().substring(0, 200) + '...';
    }
    
    // Limpiar texto
    extractedText = extractedText
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      .trim();
    
    return {
      title: title.trim(),
      content: extractedText,
      excerpt: excerpt.trim(),
      url: url
    };
    
  } catch (error) {
    console.error('[ERROR SCRAPING]:', error.message);
    throw new Error(`Error al procesar URL: ${error.message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

// --- Funciones de Procesamiento Específicas por Tipo ---

export const processDocumentSource = async (file, clientId, agencyId, token, metadata = {}, userId = null) => {
  console.log('[CONTEXT SOURCES] Procesando documento:', { clientId, agencyId });
  
  // Obtener user_id del token si no se proporciona
  let actualUserId = userId;
  if (!actualUserId) {
    const supabaseAuth = createAuthenticatedClient(token);
    const { data: { user }, error: userErr } = await supabaseAuth.auth.getUser();
    if (userErr) throw new Error('No se pudo obtener el usuario');
    actualUserId = user.id;
  }
  
  // Crear registro en la tabla documents con source_type
  const documentData = {
    client_id: clientId,
    agency_id: agencyId,
    user_id: actualUserId, // ✅ AGREGADO: Campo user_id requerido
    file_name: file.originalname,
    storage_path: metadata.storage_path,
    file_type: file.mimetype,
    file_size: file.size,
    ai_status: 'pending',
    source_type: 'document', // Nuevo campo para identificar el tipo
    source_metadata: {
      original_filename: file.originalname,
      upload_method: 'context_source'
    }
  };
  
  const { data: doc, error: docErr } = await supabaseAdmin
    .from('documents')
    .insert(documentData)
    .select()
    .single();
    
  if (docErr) throw new Error(`No se pudo crear el documento: ${docErr.message}`);
  
  // Procesar el archivo usando la lógica existente
  await processDocumentChunks(doc.id, token);
  
  return doc;
};

export const processUrlSource = async (url, clientId, agencyId, token, metadata = {}, userId = null) => {
  console.log('[CONTEXT SOURCES] Procesando URL:', { url, clientId, agencyId });
  
  try {
    // Validar URL
    new URL(url);
    
    // Scraping del contenido
    const scrapedContent = await scrapeUrlWithPuppeteer(url);
    
    if (!scrapedContent.content || scrapedContent.content.length < 50) {
      throw new Error('No se pudo extraer contenido suficiente de la URL');
    }
    
    // Obtener user_id del token si no se proporciona
    let actualUserId = userId;
    if (!actualUserId) {
      const supabaseAuth = createAuthenticatedClient(token);
      const { data: { user }, error: userErr } = await supabaseAuth.auth.getUser();
      if (userErr) throw new Error('No se pudo obtener el usuario');
      actualUserId = user.id;
    }
    
    // Crear registro en la tabla documents
    const documentData = {
      client_id: clientId,
      agency_id: agencyId,
      user_id: actualUserId, // ✅ AGREGADO: Campo user_id requerido
      file_name: scrapedContent.title || 'Página Web',
      storage_path: null, // No hay archivo físico
      file_type: 'text/html',
      file_size: scrapedContent.content.length,
      ai_status: 'processing',
      source_type: 'url',
      source_metadata: {
        url: url,
        title: scrapedContent.title,
        excerpt: scrapedContent.excerpt,
        scraped_at: new Date().toISOString(),
        ...metadata
      }
    };
    
    const { data: doc, error: docErr } = await supabaseAdmin
      .from('documents')
      .insert(documentData)
      .select()
      .single();
      
    if (docErr) throw new Error(`No se pudo crear el registro de URL: ${docErr.message}`);
    
    // Procesar el contenido extraído directamente a chunks
    await processTextToChunks(scrapedContent.content, doc);
    
    await supabaseAdmin
      .from('documents')
      .update({ ai_status: 'ready' })
      .eq('id', doc.id);
    
    return doc;
    
  } catch (error) {
    console.error('[ERROR URL PROCESSING]:', error.message);
    throw new Error(`Error al procesar URL: ${error.message}`);
  }
};

export const processManualSource = async (content, title, clientId, agencyId, token, metadata = {}, userId = null) => {
  console.log('[CONTEXT SOURCES] Procesando información manual:', { title, clientId, agencyId });
  
  if (!content || content.trim().length < 10) {
    throw new Error('El contenido debe tener al menos 10 caracteres');
  }
  
  // Obtener user_id del token si no se proporciona
  let actualUserId = userId;
  if (!actualUserId) {
    const supabaseAuth = createAuthenticatedClient(token);
    const { data: { user }, error: userErr } = await supabaseAuth.auth.getUser();
    if (userErr) throw new Error('No se pudo obtener el usuario');
    actualUserId = user.id;
  }
  
  // Crear registro en la tabla documents
  const documentData = {
    client_id: clientId,
    agency_id: agencyId,
    user_id: actualUserId, // ✅ AGREGADO: Campo user_id requerido
    file_name: title || 'Información Manual',
    storage_path: null,
    file_type: 'text/plain',
    file_size: content.length,
    ai_status: 'processing',
    source_type: 'manual',
    source_metadata: {
      created_method: 'manual_input',
      created_at: new Date().toISOString(),
      ...metadata
    }
  };
  
  const { data: doc, error: docErr } = await supabaseAdmin
    .from('documents')
    .insert(documentData)
    .select()
    .single();
    
  if (docErr) throw new Error(`No se pudo crear el registro manual: ${docErr.message}`);
  
  try {
    // Procesar el contenido directamente a chunks
    await processTextToChunks(content, doc);
    
    await supabaseAdmin
      .from('documents')
      .update({ ai_status: 'ready' })
      .eq('id', doc.id);
    
    return doc;
    
  } catch (error) {
    await supabaseAdmin
      .from('documents')
      .update({ ai_status: 'error' })
      .eq('id', doc.id);
    throw error;
  }
};

export const processNoteSource = async (note, title, clientId, agencyId, token, metadata = {}, userId = null) => {
  console.log('[CONTEXT SOURCES] Procesando nota contextual:', { title, clientId, agencyId });
  
  if (!note || note.trim().length < 5) {
    throw new Error('La nota debe tener al menos 5 caracteres');
  }
  
  // Obtener user_id del token si no se proporciona
  let actualUserId = userId;
  if (!actualUserId) {
    const supabaseAuth = createAuthenticatedClient(token);
    const { data: { user }, error: userErr } = await supabaseAuth.auth.getUser();
    if (userErr) throw new Error('No se pudo obtener el usuario');
    actualUserId = user.id;
  }
  
  // Las notas son contenido contextual adicional
  const documentData = {
    client_id: clientId,
    agency_id: agencyId,
    user_id: actualUserId, // ✅ AGREGADO: Campo user_id requerido
    file_name: title || 'Nota Contextual',
    storage_path: null,
    file_type: 'text/note',
    file_size: note.length,
    ai_status: 'processing',
    source_type: 'note',
    source_metadata: {
      note_type: metadata.note_type || 'general',
      importance: metadata.importance || 'medium',
      created_at: new Date().toISOString(),
      ...metadata
    }
  };
  
  const { data: doc, error: docErr } = await supabaseAdmin
    .from('documents')
    .insert(documentData)
    .select()
    .single();
    
  if (docErr) throw new Error(`No se pudo crear la nota: ${docErr.message}`);
  
  try {
    // Procesar la nota directamente (sin chunks si es muy corta)
    if (note.length < 500) {
      // Para notas cortas, crear un solo chunk
      const sanitizedNote = note.replace(/\u0000/g, '');
      const vector = await embedText(sanitizedNote);
      
      const { error: insErr } = await supabaseAdmin.from('context_chunks').insert({
        client_id: clientId,
        agency_id: agencyId,
        user_id: actualUserId, // ✅ AGREGADO: Campo user_id requerido
        source_id: null, // ✅ AGREGADO: null porque usamos document_id
        document_id: doc.id, // ✅ Relación con documents
        chunk_index: 0, // ✅ AGREGADO: Para notas cortas, un solo chunk
        content: sanitizedNote,
        embedding: vector,
        chunk_type: 'text', // ✅ AGREGADO: Tipo de chunk
        metadata: {
          processing_method: 'note_source',
          source_type: 'note',
          note_type: metadata.note_type || 'general'
        }
      });
      
      if (insErr) throw new Error(`Error guardando chunk de nota: ${insErr.message}`);
    } else {
      // Para notas largas, usar el procesamiento de chunks normal
      await processTextToChunks(note, doc);
    }
    
    await supabaseAdmin
      .from('documents')
      .update({ ai_status: 'ready' })
      .eq('id', doc.id);
    
    return doc;
    
  } catch (error) {
    await supabaseAdmin
      .from('documents')
      .update({ ai_status: 'error' })
      .eq('id', doc.id);
    throw error;
  }
};

// --- Funciones Auxiliares de Procesamiento ---

const processTextToChunks = async (text, doc) => {
  const chunks = chunkText(text);
  
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    if (!chunk || chunk.trim() === '') continue;
    
    const sanitizedChunk = chunk.replace(/\u0000/g, '');
    const vector = await embedText(sanitizedChunk);
    
    const { error: insErr } = await supabaseAdmin.from('context_chunks').insert({
      client_id: doc.client_id,
      agency_id: doc.agency_id,
      user_id: doc.user_id, // ✅ AGREGADO: Campo user_id requerido
      source_id: null, // ✅ AGREGADO: null porque usamos document_id en lugar de source_id
      document_id: doc.id, // ✅ Relación con documents
      chunk_index: i, // ✅ AGREGADO: Índice del chunk requerido
      content: sanitizedChunk,
      embedding: vector,
      chunk_type: 'text', // ✅ AGREGADO: Tipo de chunk (por defecto text)
      metadata: {
        processing_method: 'document_source',
        source_type: doc.source_type || 'document'
      }
    });
    
    if (insErr) throw new Error(`Error guardando chunk: ${insErr.message}`);
  }
};

const processDocumentChunks = async (documentId, token) => {
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
    
    await processTextToChunks(textToProcess, doc);
    await supabaseAdmin.from('documents').update({ ai_status: 'ready' }).eq('id', documentId);
  } catch (error) {
    await supabaseAdmin.from('documents').update({ ai_status: 'error' }).eq('id', documentId);
    throw error;
  }
};

// --- Funciones de Gestión de Fuentes ---

export const getContextSourcesByClient = async (clientId, agencyId) => {
  const { data, error } = await supabaseAdmin
    .from('documents')
    .select('*')
    .eq('client_id', clientId)
    .eq('agency_id', agencyId)
    .not('source_type', 'is', null) // Solo fuentes de contexto
    .order('created_at', { ascending: false });
  if (error) throw new Error(`No se pudieron obtener las fuentes de contexto: ${error.message}`);
  return data || [];
};

export const updateContextSource = async (sourceId, updateData, agencyId) => {
  const { data, error } = await supabaseAdmin
    .from('documents')
    .update(updateData)
    .eq('id', sourceId)
    .eq('agency_id', agencyId)
    .select()
    .single();
  if (error) throw new Error(`No se pudo actualizar la fuente de contexto: ${error.message}`);
  return data;
};

export const deleteContextSource = async (sourceId, agencyId) => {
  // Primero obtener información del documento
  const { data: doc, error: docError } = await supabaseAdmin
    .from('documents')
    .select('storage_path, source_type')
    .eq('id', sourceId)
    .eq('agency_id', agencyId)
    .single();
  if (docError) throw new Error(`No se encontró la fuente de contexto para eliminar: ${docError.message}`);
  
  // Eliminar archivo del storage solo si existe (documentos)
  if (doc.storage_path && doc.source_type === 'document') {
    const { error: storageError } = await supabaseAdmin.storage.from('documents').remove([doc.storage_path]);
    if (storageError) console.error(`Advertencia: No se pudo eliminar el archivo del storage: ${storageError.message}`);
  }
  
  // Eliminar el registro (los chunks se eliminan automáticamente por cascade)
  const { error } = await supabaseAdmin
    .from('documents')
    .delete()
    .eq('id', sourceId)
    .eq('agency_id', agencyId);
  if (error) throw new Error(`No se pudo eliminar la fuente de contexto: ${error.message}`);
};

// --- Funciones de Búsqueda y Estadísticas ---

export const searchContextChunks = async (query, clientId, agencyId, sourceTypes = null, limit = 10) => {
  if (!openaiApiKey) {
    throw new Error('OPENAI_API_KEY no configurada para búsqueda semántica');
  }
  
  // Generar embedding de la consulta
  const queryEmbedding = await embedText(query);
  
  // Construir filtros adicionales
  let rpcParams = {
    query_embedding: queryEmbedding,
    match_client_id: clientId,
    match_count: limit,
  };
  
  // Si se especifican tipos de fuente específicos
  if (sourceTypes && sourceTypes.length > 0) {
    rpcParams.source_types = sourceTypes;
  }
  
  const { data: matches, error: matchErr } = await supabaseAdmin.rpc('match_context_chunks', rpcParams);
  if (matchErr) throw new Error(`Error al buscar chunks de contexto: ${matchErr.message}`);
  
  return matches || [];
};

export const getContextSourceStats = async (clientId, agencyId) => {
  const { data, error } = await supabaseAdmin
    .from('documents')
    .select('source_type, ai_status')
    .eq('client_id', clientId)
    .eq('agency_id', agencyId)
    .not('source_type', 'is', null);
    
  if (error) throw new Error(`Error al obtener estadísticas: ${error.message}`);
  
  const stats = {
    total: data.length,
    by_type: {},
    by_status: {},
    ready_count: 0
  };
  
  data.forEach(item => {
    // Por tipo
    if (!stats.by_type[item.source_type]) {
      stats.by_type[item.source_type] = 0;
    }
    stats.by_type[item.source_type]++;
    
    // Por estado
    if (!stats.by_status[item.ai_status]) {
      stats.by_status[item.ai_status] = 0;
    }
    stats.by_status[item.ai_status]++;
    
    // Contar listos para usar
    if (item.ai_status === 'ready') {
      stats.ready_count++;
    }
  });
  
  return stats;
};