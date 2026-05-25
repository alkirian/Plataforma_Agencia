// src/services/clients.service.js

import { createAuthenticatedClient } from '../config/supabaseClient.js';
import { logActivity } from './activity.service.js';

/**
 * Obtiene todos los clientes de una agencia, usando los permisos del usuario.
 */
export const getClientsByAgency = async (agencyId, token) => {
  const supabaseAuth = createAuthenticatedClient(token);
  const { data, error } = await supabaseAuth
    .from('clients')
    .select(`
      id,
      name,
      industry,
      brand_info,
      created_at,
      schedule_items (
        id,
        title,
        status,
        scheduled_at
      )
    `)
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

/**
 * Obtiene la identidad de marca (brand_info) de un cliente.
 */
export const getClientBrandProfile = async (clientId, token) => {
  const supabaseAuth = createAuthenticatedClient(token);
  const { data, error } = await supabaseAuth
    .from('clients')
    .select('id, brand_info')
    .eq('id', clientId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Error al obtener la identidad del cliente: ${error.message}`);
  }

  return data;
};

/**
 * Actualiza la identidad de marca (brand_info) de un cliente.
 */
export const updateClientBrandProfile = async (clientId, brandInfo, token) => {
  const supabaseAuth = createAuthenticatedClient(token);
  const { data, error } = await supabaseAuth
    .from('clients')
    .update({ brand_info: brandInfo })
    .eq('id', clientId)
    .select('id, brand_info')
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Error al actualizar la identidad del cliente: ${error.message}`);
  }

  return data;
};

/**
 * Actualiza solo el color visual de la tarjeta, preservando el resto de brand_info.
 */
export const updateClientCardColor = async (clientId, cardColor, token) => {
  const supabaseAuth = createAuthenticatedClient(token);
  const current = await getClientBrandProfile(clientId, token);

  if (!current) {
    return null;
  }

  const nextBrandInfo = {
    ...(current.brand_info || {}),
    card_color: cardColor,
  };

  if (!cardColor) {
    delete nextBrandInfo.card_color;
  }

  const { data, error } = await supabaseAuth
    .from('clients')
    .update({ brand_info: nextBrandInfo })
    .eq('id', clientId)
    .select('id, name, industry, brand_info, created_at')
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Error al actualizar el color de la tarjeta: ${error.message}`);
  }

  return data;
};

/**
 * Actualiza la información básica (nombre e industria) de un cliente.
 */
export const updateClient = async (clientId, clientData, token, userId = null) => {
  const supabaseAuth = createAuthenticatedClient(token);

  // Primero obtener el cliente existente para logging
  const current = await getClientById(clientId, token);
  if (!current) {
    return null;
  }

  const { data, error } = await supabaseAuth
    .from('clients')
    .update({
      name: clientData.name !== undefined ? clientData.name : current.name,
      industry: clientData.industry !== undefined ? clientData.industry : current.industry,
    })
    .eq('id', clientId)
    .select('id, name, industry, agency_id, brand_info, created_at')
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Error al actualizar el cliente: ${error.message}`);
  }

  // Registrar actividad
  if (userId) {
    await logActivity({
      agency_id: data.agency_id || current.agency_id,
      client_id: clientId,
      user_id: userId,
      action_type: 'CLIENT_UPDATED',
      details: {
        previous_name: current.name,
        new_name: data.name,
        previous_industry: current.industry,
        new_industry: data.industry,
      }
    });
  }

  return data;
};

/**
 * Elimina un cliente y todas sus dependencias en cascada.
 */
export const deleteClient = async (clientId, token, userId = null) => {
  const supabaseAuth = createAuthenticatedClient(token);

  // Obtener detalles del cliente para el log de actividad antes de borrarlo
  const current = await getClientById(clientId, token);
  if (!current) {
    return false;
  }

  const { error } = await supabaseAuth
    .from('clients')
    .delete()
    .eq('id', clientId);

  if (error) {
    throw new Error(`Error al eliminar el cliente: ${error.message}`);
  }

  // Registrar actividad
  if (userId) {
    await logActivity({
      agency_id: current.agency_id,
      client_id: clientId,
      user_id: userId,
      action_type: 'CLIENT_DELETED',
      details: {
        client_name: current.name,
        client_industry: current.industry,
      }
    });
  }

  return true;
};
