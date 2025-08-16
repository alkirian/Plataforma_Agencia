import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { logActivity } from './activity.service.js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_KEY;

// Helper para crear un cliente autenticado bajo demanda
const createAuthenticatedClient = (token) => {
  if (!token) throw new Error('Token de autenticación es requerido.');
  return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
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
  const { data, error } = await supabaseAuth
    .from('schedule_items')
    .insert(itemData)
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
export const updateScheduleItem = async (itemId, clientId, updateData, token) => {
  const supabaseAuth = createAuthenticatedClient(token);
  
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
    .update(updateData)
    .eq('id', itemId)
    .eq('client_id', clientId)
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Log activity
  await logActivity({
    agency_id: data.agency_id,
    client_id: data.client_id,
    user_id: null, // TODO: get from token
    action_type: 'SCHEDULE_ITEM_UPDATED',
    details: { 
      item_title: data.title, 
      item_id: data.id,
      previous_status: existingItem.status,
      new_status: data.status
    }
  });

  return data;
};

/**
 * Elimina un ítem del cronograma.
 */
export const deleteScheduleItem = async (itemId, clientId, token) => {
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
  await logActivity({
    agency_id: item.agency_id,
    client_id: item.client_id,
    user_id: null, // TODO: get from token
    action_type: 'SCHEDULE_ITEM_DELETED',
    details: { 
      item_title: item.title, 
      item_id: item.id
    }
  });

  return true;
};
