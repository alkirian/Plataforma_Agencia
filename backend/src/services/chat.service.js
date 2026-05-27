import { createAuthenticatedClient } from '../config/supabaseClient.js';
import { logger } from '../utils/logger.js';

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
export const saveChatMessage = async ({ token, userId, clientId, role, content, metadata = null }) => {
  logger.info('🔍 saveChatMessage - Intentando guardar mensaje de chat:', {
    userId,
    clientId,
    role,
    contentLength: content?.length || 0,
    hasMetadata: !!metadata
  });

  try {
    if (!content) {
      throw new Error('No hay contenido para guardar');
    }

    const supabaseAuth = createAuthenticatedClient(token);

    // Insertar usando el esquema moderno definitivo
    const { data, error } = await supabaseAuth
      .from('chat_messages')
      .insert([{ user_id: userId, client_id: clientId, role, content, metadata }])
      .select('id, user_id, client_id, role, content, metadata, created_at')
      .single();

    if (error) {
      logger.error('❌ Error al guardar mensaje en Supabase:', error, { userId, clientId, role });
      throw new Error(`No se pudo guardar el mensaje: ${error.message}`);
    }

    logger.info('✅ Mensaje guardado exitosamente en base de datos:', { id: data.id });
    return data;
  } catch (error) {
    logger.error('❌ Error crítico en saveChatMessage:', error);
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
  logger.info('🔍 listChatMessages - Obteniendo historial para cliente:', { clientId, limit, before });

  try {
    const supabaseAuth = createAuthenticatedClient(token);

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
    if (error) {
      logger.error('❌ Error al listar mensajes de chat:', error, { clientId });
      throw new Error(`No se pudo obtener el historial: ${error.message}`);
    }

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

    logger.info('✅ Historial de chat recuperado:', { count: messages.length, hasMore });
    return { messages, hasMore, nextCursor };
  } catch (error) {
    logger.error('❌ Error crítico en listChatMessages:', error, { clientId });
    throw error;
  }
};
