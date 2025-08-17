import { createAuthenticatedClient } from '../config/supabaseClient.js';
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
  // Normalizar y validar status antes de insertar
  const allowed = ['Pendiente', 'En Diseño', 'En Progreso', 'Aprobado', 'Publicado', 'Cancelado'];
  const normalizedStatus = normalizeStatus(itemData.status);
  if (normalizedStatus && !allowed.includes(normalizedStatus)) {
    console.warn('[schedule] Status no permitido, recibido:', itemData.status, '-> normalizado:', normalizedStatus);
  }
  const payload = {
    ...itemData,
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

  // Eliminar el item
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
