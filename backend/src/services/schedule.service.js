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
