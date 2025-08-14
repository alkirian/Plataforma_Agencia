import { createClient as createSupabaseClient } from '@supabase/supabase-js';

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
export const createScheduleItem = async (itemData, token) => {
  const supabaseAuth = createAuthenticatedClient(token);
  const { data, error } = await supabaseAuth
    .from('schedule_items')
    .insert(itemData)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
};
