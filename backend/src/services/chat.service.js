import { createAuthenticatedClient } from '../config/supabaseClient.js';

// Helpers
const isUndefinedColumnErr = (error, columnName) =>
  !!error && (
    error.code === '42703' ||
    (typeof error.message === 'string' && error.message.toLowerCase().includes('column') &&
      error.message.toLowerCase().includes(columnName.toLowerCase()) &&
      error.message.toLowerCase().includes('does not exist'))
  );

// Detecta violación de NOT NULL para una columna específica
const isNotNullColumnErr = (error, columnName) =>
  !!error && error.code === '23502' &&
  typeof error.message === 'string' &&
  error.message.toLowerCase().includes(`column "${columnName.toLowerCase()}"`) &&
  error.message.toLowerCase().includes('not-null');

/**
 * Inserta un mensaje de chat en la tabla chat_messages respetando RLS
 * @param {object} params
 * @param {string} params.token - JWT del usuario autenticado
 * @param {string} params.userId - ID del usuario autenticado (owner del registro para RLS)
 * @param {string} params.clientId - ID del cliente al que pertenece la conversación
 * @param {('user'|'assistant'|'system')} params.role - Rol del mensaje
 * @param {string} params.content - Contenido del mensaje
 * @param {object} [params.metadata] - Metadatos opcionales (json)
 */
export const saveChatMessage = async ({ token, userId, clientId, role, content, message, response, metadata = null }) => {
  console.log('🔍 saveChatMessage - Entrada:', {
    hasToken: !!token,
    userId,
    clientId,
    role,
    contentLength: content?.length || 0,
    hasMetadata: !!metadata
  });

  try {
    const supabaseAuth = createAuthenticatedClient(token);
    // Permitir que el controlador pase 'content' o 'message'/'response'
    let realContent = content;
    if (!realContent && typeof message === 'string') realContent = message;
    if (!realContent && typeof response === 'string') realContent = response;

    if (!realContent) {
      throw new Error('No hay contenido para guardar');
    }

    // 1) Intentar insertar usando la columna moderna 'content'
    let insertResult = await supabaseAuth
      .from('chat_messages')
      .insert([{ user_id: userId, client_id: clientId, role, content: realContent, metadata }])
      .select('id, user_id, client_id, role, content, metadata, created_at')
      .single();

    if (!insertResult.error) {
      console.log('✅ Mensaje guardado exitosamente:', insertResult.data);
      return insertResult.data;
    }

    // Si la tabla no existe, informar claramente
    if (insertResult.error?.message?.includes('relation "chat_messages" does not exist')) {
      console.error('❌ Tabla chat_messages no existe.');
      throw new Error(
        'No se pudo guardar el mensaje: la tabla chat_messages no existe. Aplica el esquema en Supabase antes de continuar.'
      );
    }

    // 2) Fallbacks de compatibilidad con esquemas antiguos
    // 2a) Si no existe 'content' O si 'message' tiene NOT NULL, intentar con todas las columnas relevantes
    if (isUndefinedColumnErr(insertResult.error, 'content') || isNotNullColumnErr(insertResult.error, 'message')) {
      // Primer intento: incluir content + message + response para satisfacer constraints mixtos
      let legacyPayloadAll = {
        user_id: userId,
        client_id: clientId,
        role,
        content: realContent,
        message: realContent,
        response: realContent,
        metadata
      };

      // Mantener payload actual y reintentar quitando columnas no soportadas
      let currentPayload = { ...legacyPayloadAll };
      let legacyInsert = await supabaseAuth
        .from('chat_messages')
        .insert([currentPayload])
        .select('*')
        .single();

      // Si falla porque 'content' no existe, eliminar y reintentar
      if (legacyInsert.error && isUndefinedColumnErr(legacyInsert.error, 'content')) {
        const { content: _omitContent, ...rest } = currentPayload;
        currentPayload = rest;
        legacyInsert = await supabaseAuth
          .from('chat_messages')
          .insert([currentPayload])
          .select('*')
          .single();
      }

      // Si falla por 'metadata' inexistente, eliminar y reintentar
      if (legacyInsert.error && isUndefinedColumnErr(legacyInsert.error, 'metadata')) {
        const { metadata: _omitMeta, ...rest } = currentPayload;
        currentPayload = rest;
        legacyInsert = await supabaseAuth
          .from('chat_messages')
          .insert([currentPayload])
          .select('*')
          .single();
      }

      if (legacyInsert.error) {
        console.error('❌ Error al guardar mensaje (legacy):', legacyInsert.error);
        throw new Error(`No se pudo guardar el mensaje (legacy): ${legacyInsert.error.message}`);
      }

      // Normalizar salida para que siempre tenga 'content'
      const row = legacyInsert.data;
      const normalized = {
        id: row.id,
        user_id: row.user_id,
        client_id: row.client_id,
        role: row.role,
        content: row.content ?? (row.role === 'assistant' ? row.response : row.message),
        metadata: row.metadata ?? metadata ?? null,
        created_at: row.created_at,
      };
      console.log('✅ Mensaje guardado exitosamente (legacy):', normalized);
      return normalized;
    }

    // 3) Otros errores
    console.error('❌ Error al guardar mensaje:', insertResult.error);
    throw new Error(`No se pudo guardar el mensaje: ${insertResult.error.message}`);
  } catch (error) {
    console.error('❌ Error en saveChatMessage:', {
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
};

/**
 * Lista mensajes recientes paginados por created_at descendente
 * @param {object} params
 * @param {string} params.token - JWT del usuario autenticado
 * @param {string} params.clientId - ID del cliente
 * @param {number} [params.limit=20] - Límite de mensajes a recuperar
 * @param {string} [params.before] - Cursor: ISO string de created_at para paginar hacia atrás
 */
export const listChatMessages = async ({ token, clientId, limit = 20, before }) => {
  const supabaseAuth = createAuthenticatedClient(token);

  // 1) Intento principal: seleccionar usando la columna moderna 'content' (y 'metadata' si existe)
  try {
    let query = supabaseAuth
      .from('chat_messages')
      .select('id, user_id, client_id, role, content, metadata, created_at')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(limit);

    if (before) {
      query = query.lt('created_at', before);
    }

    const { data, error } = await query;
    if (error) throw error;

    const messages = (data || []).map(r => ({
      id: r.id,
      user_id: r.user_id,
      client_id: r.client_id,
      role: r.role,
      content: r.content,
      metadata: r.metadata ?? null,
      created_at: r.created_at,
    }));
    const hasMore = messages.length === limit;
    const nextCursor = messages.length ? messages[messages.length - 1].created_at : null;
    return { messages, hasMore, nextCursor };
  } catch (err) {
    // 2) Fallback: si falla por columna 'content' o 'metadata' inexistente, usar esquema heredado
    if (isUndefinedColumnErr(err, 'content') || isUndefinedColumnErr(err, 'metadata')) {
      let query = supabaseAuth
        .from('chat_messages')
        .select('id, user_id, client_id, role, message, response, created_at')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
        .limit(limit);

      if (before) {
        query = query.lt('created_at', before);
      }

      const { data, error } = await query;
      if (error) {
        throw new Error(`No se pudo obtener el historial (legacy): ${error.message}`);
      }

      const messages = (data || []).map(r => ({
        id: r.id,
        user_id: r.user_id,
        client_id: r.client_id,
        role: r.role,
        content: r.role === 'assistant' ? r.response : r.message,
        metadata: null,
        created_at: r.created_at,
      }));
      const hasMore = messages.length === limit;
      const nextCursor = messages.length ? messages[messages.length - 1].created_at : null;
      return { messages, hasMore, nextCursor };
    }
    throw new Error(`No se pudo obtener el historial: ${err.message}`);
  }
};
