// src/services/clients.service.js

import { createAuthenticatedClient } from '../config/supabaseClient.js';

/**
 * Obtiene todos los clientes de una agencia, usando los permisos del usuario.
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

/**
 * Llama a una función SQL para crear un nuevo cliente.
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

/**
 * Obtiene un cliente específico por su ID.
 * La política RLS de Supabase asegura que el usuario solo vea clientes de su agencia.
 */
export const getClientById = async (clientId, token) => {
  const supabaseAuth = createAuthenticatedClient(token);
  const { data, error } = await supabaseAuth
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .single();

  if (error) {
    // Si el error es 'PGRST116', significa que no se encontró ninguna fila (o no tiene permiso).
    // Devolvemos null para que el controlador lo maneje como un 404 Not Found.
    if (error.code === 'PGRST116') {
      return null;
    }
    // Para cualquier otro error, lanzamos una excepción.
    throw new Error(`Error al obtener el cliente: ${error.message}`);
  }

  return data;
};