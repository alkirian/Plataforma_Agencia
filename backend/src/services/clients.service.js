import { supabase } from '../config/supabaseClient.js';

/**
 * Crea un nuevo cliente en la base de datos, asegurando que esté asociado a la agencia correcta.
 * @param {object} clientData - Datos del nuevo cliente (ej. { name, industry }).
 * @param {string} agencyId - El UUID de la agencia a la que pertenece el cliente.
 * @returns {Promise<object>} El objeto del cliente recién creado.
 */
export const createClient = async (clientData, agencyId) => {
  const { data, error } = await supabase
    .from('clients')
    .insert({
      ...clientData,
      agency_id: agencyId, // Vinculamos el cliente a la agencia del usuario.
    })
    .select()
    .single(); // .single() para devolver el objeto creado directamente.

  if (error) {
    throw new Error(`Error al crear el cliente: ${error.message}`);
  }
  return data;
};

/**
 * Obtiene todos los clientes que pertenecen a una agencia específica.
 * @param {string} agencyId - El UUID de la agencia.
 * @returns {Promise<Array>} Una lista de los clientes de la agencia.
 */
export const getClientsByAgency = async (agencyId) => {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('agency_id', agencyId);

  if (error) {
    throw new Error(`Error al obtener los clientes: ${error.message}`);
  }
  return data;
};
