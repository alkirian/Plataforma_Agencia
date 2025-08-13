import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_KEY;

/**
 * Llama a una función de la base de datos para crear un nuevo cliente.
 */
export const createClient = async (clientData, token) => {
  const supabaseAuth = createAuthenticatedClient(token);
  const { data, error } = await supabaseAuth.rpc('create_new_client', {
    client_name: clientData.name,
    client_industry: clientData.industry,
  });
  if (error) throw new Error(`Error al crear el cliente: ${error.message}`);
  return data;
};

// Helper para crear un cliente autenticado bajo demanda
const createAuthenticatedClient = (token) => {
  if (!token) throw new Error('Token de autenticación es requerido.');
  return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
};

/**
 * Obtiene todos los clientes que pertenecen a una agencia específica.
 */
export const getClientsByAgency = async (agencyId, token) => {
  const supabaseAuth = createAuthenticatedClient(token);
  const { data, error } = await supabaseAuth
    .from('clients')
    .select('id, name, industry')
    .eq('agency_id', agencyId);
  if (error) throw new Error(`Error al obtener los clientes: ${error.message}`);
  return data;
};