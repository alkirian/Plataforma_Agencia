import { createAuthenticatedClient, supabaseAdmin } from '../config/supabaseClient.js';
import { logActivity } from './activity.service.js';

// Helper: normaliza el estado al formato esperado por el ENUM de la BD
const normalizeStatus = (status) => {
  if (!status) return status;
  const raw = String(status).trim();
  const lc = raw.toLowerCase();
  const map = {
    // Español (minúsculas) -> Español con mayúsculas
    'pendiente': 'Pendiente',
    'en diseño': 'En Diseño',
    'en diseno': 'En Diseño',
    'en-diseño': 'En Diseño',
    'en-progreso': 'En Progreso',
    'aprobado': 'Aprobado',
    'publicado': 'Publicado',
    'cancelado': 'Cancelado',
    // Inglés comunes -> Español
    'pending': 'Pendiente',
    'in_design': 'En Diseño',
    'in design': 'En Diseño',
    'in_progress': 'En Progreso',
    'approved': 'Aprobado',
    'published': 'Publicado',
    'cancelled': 'Cancelado',
    'canceled': 'Cancelado',
  };
  return map[lc] || raw; // si no hay mapeo, devolver como vino
};

/**
 * Obtiene todos los ítems del cronograma para un cliente específico.
 */
export const getScheduleItemsByClient = async (clientId, token) => {
  const supabaseAuth = createAuthenticatedClient(token);
  const { data, error } = await supabaseAuth
    .from('schedule_items')
    .select('*')
    .eq('client_id', clientId);

  if (error) throw new Error(error.message);
  return data;
};

/**
 * Crea un nuevo ítem en el cronograma.
 */
export const createScheduleItem = async (itemData, token, userId = null) => {
  const supabaseAuth = createAuthenticatedClient(token);
  const allowed = ['Pendiente', 'En Diseño', 'En Progreso', 'Aprobado', 'Publicado', 'Cancelado'];
  const normalizedStatus = normalizeStatus(itemData.status);
  if (normalizedStatus && !allowed.includes(normalizedStatus)) {
    console.warn('[schedule] Status no permitido, recibido:', itemData.status, '-> normalizado:', normalizedStatus);
  }

  // Obtener agency_id del cliente para satisfacer la restricción NOT NULL de la base de datos
  const { data: client, error: clientErr } = await supabaseAuth
    .from('clients')
    .select('agency_id')
    .eq('id', itemData.client_id)
    .single();

  if (clientErr || !client) {
    throw new Error('No se pudo encontrar el cliente o su agencia asociada.');
  }

  const payload = {
    ...itemData,
    agency_id: client.agency_id,
    status: normalizedStatus || itemData.status,
  };
  const { data, error } = await supabaseAuth
    .from('schedule_items')
    .insert(payload)
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Registrar actividad
  if (data && userId) {
    await logActivity({
      agency_id: data.agency_id, // La tabla 'schedule_items' necesita esta columna
      client_id: data.client_id,
      user_id: userId,
      action_type: 'SCHEDULE_ITEM_CREATED',
      details: { 
        item_title: data.title, 
        item_id: data.id,
        start_date: data.start,
        end_date: data.end 
      }
    });
  }

  return data;
};

/**
 * Obtiene un ítem específico del cronograma.
 */
export const getScheduleItemById = async (itemId, clientId, token) => {
  const supabaseAuth = createAuthenticatedClient(token);
  const { data, error } = await supabaseAuth
    .from('schedule_items')
    .select('*')
    .eq('id', itemId)
    .eq('client_id', clientId)
    .single();

  if (error) throw new Error(error.message);
  return data;
};

/**
 * Actualiza un ítem del cronograma.
 */
export const updateScheduleItem = async (itemId, clientId, updateData, token, userId = null) => {
  const supabaseAuth = createAuthenticatedClient(token);
  // Normalizar status si viene en el update
  let normalizedUpdate = { ...updateData };
  if (Object.prototype.hasOwnProperty.call(updateData, 'status')) {
    const allowed = ['Pendiente', 'En Diseño', 'En Progreso', 'Aprobado', 'Publicado', 'Cancelado'];
    const normalizedStatus = normalizeStatus(updateData.status);
    if (normalizedStatus && !allowed.includes(normalizedStatus)) {
      console.warn('[schedule] Update status no permitido, recibido:', updateData.status, '-> normalizado:', normalizedStatus);
    }
    normalizedUpdate.status = normalizedStatus || updateData.status;
  }
  
  // Primero verificar que el item existe y pertenece al cliente
  const { data: existingItem, error: fetchError } = await supabaseAuth
    .from('schedule_items')
    .select('*')
    .eq('id', itemId)
    .eq('client_id', clientId)
    .single();

  if (fetchError) throw new Error('Evento no encontrado');

  // Actualizar el item
  const { data, error } = await supabaseAuth
    .from('schedule_items')
    .update(normalizedUpdate)
    .eq('id', itemId)
    .eq('client_id', clientId)
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Log activity
  if (userId) {
    await logActivity({
      agency_id: data.agency_id,
      client_id: data.client_id,
      user_id: userId,
      action_type: 'SCHEDULE_ITEM_UPDATED',
      details: { 
        item_title: data.title, 
        item_id: data.id,
        previous_status: existingItem.status,
        new_status: data.status
      }
    });
  }

  return data;
};

/**
 * Elimina un ítem del cronograma.
 */
export const deleteScheduleItem = async (itemId, clientId, token, userId = null) => {
  const supabaseAuth = createAuthenticatedClient(token);
  
  // Primero obtener el item para logging
  const { data: item, error: fetchError } = await supabaseAuth
    .from('schedule_items')
    .select('*')
    .eq('id', itemId)
    .eq('client_id', clientId)
    .single();

  if (fetchError) throw new Error('Evento no encontrado');

  // Obtener los assets asociados para poder borrarlos de storage
  const { data: assets, error: assetsError } = await supabaseAuth
    .from('content_assets')
    .select('storage_path')
    .eq('schedule_item_id', itemId);

  if (!assetsError && assets && assets.length > 0) {
    const paths = assets.map(a => a.storage_path).filter(Boolean);
    if (paths.length > 0) {
      const { error: storageError } = await supabaseAdmin.storage
        .from('content-assets')
        .remove(paths);
      if (storageError) {
        console.error('[deleteScheduleItem] Error deleting files from storage:', storageError.message);
      }
    }
  }

  // Eliminar el item (esto borrará en cascada los registros de content_assets en la BD)
  const { error } = await supabaseAuth
    .from('schedule_items')
    .delete()
    .eq('id', itemId)
    .eq('client_id', clientId);

  if (error) throw new Error(error.message);

  // Log activity
  if (userId) {
    await logActivity({
      agency_id: item.agency_id,
      client_id: item.client_id,
      user_id: userId,
      action_type: 'SCHEDULE_ITEM_DELETED',
      details: { 
        item_title: item.title, 
        item_id: item.id
      }
    });
  }

  return true;
};

export const getScheduleItemAssets = async (itemId, clientId, token) => {
  const supabaseAuth = createAuthenticatedClient(token);
  const { data, error } = await supabaseAuth
    .from('content_assets')
    .select('*')
    .eq('schedule_item_id', itemId)
    .eq('client_id', clientId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);
  return data || [];
};

export const createScheduleItemAsset = async (itemId, clientId, assetData, token, userId = null) => {
  const supabaseAuth = createAuthenticatedClient(token);

  const { data: item, error: itemErr } = await supabaseAuth
    .from('schedule_items')
    .select('id, client_id, agency_id')
    .eq('id', itemId)
    .eq('client_id', clientId)
    .single();

  if (itemErr || !item) {
    throw new Error('Evento no encontrado');
  }

  const payload = {
    ...assetData,
    schedule_item_id: itemId,
    client_id: clientId,
    agency_id: item.agency_id,
    created_by: userId || null,
  };

  const { data, error } = await supabaseAuth
    .from('content_assets')
    .insert(payload)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
};

/**
 * Elimina TODOS los ítems del cronograma de un cliente (sin restricción de mes).
 */
export const clearAllScheduleItems = async (clientId, token, userId = null) => {
  const supabaseAuth = createAuthenticatedClient(token);

  // Obtener la lista de items primero para registrar en el log
  const { data: items, error: fetchError } = await supabaseAuth
    .from('schedule_items')
    .select('id, agency_id, client_id, title')
    .eq('client_id', clientId);

  if (fetchError) throw new Error(fetchError.message);

  if (!items || items.length === 0) {
    return { count: 0 };
  }

  // Obtener todos los assets de estos items para borrarlos de storage
  const { data: assets, error: assetsError } = await supabaseAuth
    .from('content_assets')
    .select('storage_path')
    .eq('client_id', clientId);

  if (!assetsError && assets && assets.length > 0) {
    const paths = assets.map(a => a.storage_path).filter(Boolean);
    if (paths.length > 0) {
      await supabaseAdmin.storage.from('content-assets').remove(paths).catch(e => {
        console.error('[clearAllScheduleItems] Error deleting files from storage:', e.message);
      });
    }
  }

  // Eliminar físicamente todos los registros del cliente
  const { error } = await supabaseAuth
    .from('schedule_items')
    .delete()
    .eq('client_id', clientId);

  if (error) throw new Error(error.message);

  // Registrar actividad
  if (userId) {
    const agencyId = items[0].agency_id;
    await logActivity({
      agency_id: agencyId,
      client_id: clientId,
      user_id: userId,
      action_type: 'SCHEDULE_ITEMS_CLEARED',
      details: {
        deleted_count: items.length,
        scope: 'all',
        deleted_titles: items.map(item => item.title)
      }
    });
  }

  return { count: items.length };
};

/**
 * Elimina todos los ítems del cronograma de un cliente para un mes y año específicos.
 */
export const clearScheduleItemsByMonth = async (clientId, year, month, token, userId = null) => {
  const supabaseAuth = createAuthenticatedClient(token);

  // Calcular límites de mes en formato UTC para coincidir con la BD
  const startDate = new Date(Date.UTC(year, month, 1));
  const endDate = new Date(Date.UTC(year, month + 1, 1));

  // Obtener la lista de items primero para registrar en el log
  const { data: items, error: fetchError } = await supabaseAuth
    .from('schedule_items')
    .select('id, agency_id, client_id, title')
    .eq('client_id', clientId)
    .gte('scheduled_at', startDate.toISOString())
    .lt('scheduled_at', endDate.toISOString());

  if (fetchError) throw new Error(fetchError.message);

  if (!items || items.length === 0) {
    return { count: 0 };
  }

  const itemIds = items.map(i => i.id);

  // Obtener assets asociados a estos items para borrarlos de storage
  const { data: assets, error: assetsError } = await supabaseAuth
    .from('content_assets')
    .select('storage_path')
    .in('schedule_item_id', itemIds);

  if (!assetsError && assets && assets.length > 0) {
    const paths = assets.map(a => a.storage_path).filter(Boolean);
    if (paths.length > 0) {
      await supabaseAdmin.storage.from('content-assets').remove(paths).catch(e => {
        console.error('[clearScheduleItemsByMonth] Error deleting files from storage:', e.message);
      });
    }
  }

  // Eliminar físicamente los registros
  const { error } = await supabaseAuth
    .from('schedule_items')
    .delete()
    .eq('client_id', clientId)
    .gte('scheduled_at', startDate.toISOString())
    .lt('scheduled_at', endDate.toISOString());

  if (error) throw new Error(error.message);

  // Registrar actividad agregada en el log
  if (userId) {
    const agencyId = items[0].agency_id;
    await logActivity({
      agency_id: agencyId,
      client_id: clientId,
      user_id: userId,
      action_type: 'SCHEDULE_ITEMS_CLEARED',
      details: {
        year,
        month: month + 1, // Visualización amigable 1-indexed
        deleted_count: items.length,
        deleted_titles: items.map(item => item.title)
      }
    });
  }

  return { count: items.length };
};

/**
 * Obtiene todos los assets del cronograma de un cliente, unidos con su publicación.
 */
export const getScheduleAssetsByClient = async (clientId, token) => {
  const supabaseAuth = createAuthenticatedClient(token);
  const { data, error } = await supabaseAuth
    .from('content_assets')
    .select(`
      *,
      schedule_items (
        title,
        status,
        scheduled_at,
        channel
      )
    `)
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
};

/**
 * Elimina un asset individual del cronograma (storage y base de datos).
 */
export const deleteScheduleItemAsset = async (assetId, clientId, token, userId = null) => {
  const supabaseAuth = createAuthenticatedClient(token);

  // 1. Obtener detalles del asset
  const { data: asset, error: fetchError } = await supabaseAuth
    .from('content_assets')
    .select('*, schedule_items(agency_id)')
    .eq('id', assetId)
    .eq('client_id', clientId)
    .single();

  if (fetchError || !asset) throw new Error('Asset no encontrado');

  // 2. Borrar del Storage de Supabase
  if (asset.storage_path) {
    const { error: storageError } = await supabaseAdmin.storage
      .from('content-assets')
      .remove([asset.storage_path]);
    if (storageError) {
      console.error('[deleteScheduleItemAsset] Error removing from storage:', storageError.message);
    }
  }

  // 3. Eliminar de la base de datos
  const { error } = await supabaseAuth
    .from('content_assets')
    .delete()
    .eq('id', assetId)
    .eq('client_id', clientId);

  if (error) throw new Error(error.message);

  // 4. Registrar actividad
  if (userId) {
    await logActivity({
      agency_id: asset.agency_id || (asset.schedule_items ? asset.schedule_items.agency_id : null),
      client_id: clientId,
      user_id: userId,
      action_type: 'SCHEDULE_ASSET_DELETED',
      details: {
        file_name: asset.file_name,
        asset_id: asset.id,
        schedule_item_id: asset.schedule_item_id
      }
    });
  }

  return true;
};
