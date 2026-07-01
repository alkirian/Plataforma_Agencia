// src/services/clients.service.js

import { createAuthenticatedClient, supabaseAdmin } from '../config/supabaseClient.js';
import { logActivity } from './activity.service.js';
import { saveChatMessage } from './chat.service.js';

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
      logo_url,
      created_at,
      schedule_items (
        id,
        title,
        status,
        scheduled_at
      )
    `)
    .eq('agency_id', agencyId)
    .is('deleted_at', null);

  if (error) throw new Error(`Error al obtener los clientes: ${error.message}`);
  return data;
};

/**
 * Llama a una función SQL para crear un nuevo cliente.
 */
export const createClient = async (clientData, token) => {
  const supabaseAuth = createAuthenticatedClient(token);
  const { data: newClientId, error } = await supabaseAuth.rpc('create_new_client', {
    client_name: clientData.name,
    client_industry: clientData.industry,
  });

  if (error) throw new Error(`Error al crear el cliente: ${error.message}`);

  // Si se envió logo_url, actualizar el registro con supabaseAdmin
  if (clientData.logo_url) {
    const { error: logoError } = await supabaseAdmin
      .from('clients')
      .update({ logo_url: clientData.logo_url })
      .eq('id', newClientId);
    if (logoError) {
      console.error('[clients.service] Error al guardar logo en creación:', logoError.message);
    }
  }

  // Generar onboarding automático de Aura con su primer mensaje de bienvenida
  try {
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (user) {
      await saveChatMessage({
        token,
        userId: user.id,
        clientId: data, // El ID de cliente retornado es el UUID del nuevo cliente
        role: 'assistant',
        content: `¡Hola! Soy Aura, la Directora Estratégica y tu Agente General de marketing digital para ${clientData.name}. 

He indexado y configurado de forma proactiva todos los módulos de tu marca:
• 🧬 **ADN de Marca:** Listo para que verifiquemos tu tono de voz y público objetivo.
• 📅 **Cronograma:** Listo para estructurar tu plan editorial mensual.
• 🔥 **Tendencias:** Activado para el monitoreo y detección de virales diarios en tu sector de *${clientData.industry || 'tu industria'}*.
• 📊 **Meta Ads:** Preparado para conectar tus cuentas publicitarias y optimizar tu pauta.
• 💬 **CM Inteligente:** Listo para automatizar y optimizar las respuestas en tus canales sociales.

Estoy lista para proponerte ideas proactivas y optimizaciones con coherencia de 360 grados. ¿En qué empezamos a trabajar hoy?`,
        metadata: { agentId: 'general' }
      });
      console.log(`[clients.service] ✅ Agente Aura aprovisionado e inicializado para el cliente: ${clientData.name}`);
    }
  } catch (chatError) {
    console.error('[clients.service] Error al inicializar chat de Aura en onboarding:', chatError.message);
  }

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
      logo_url: clientData.logo_url !== undefined ? clientData.logo_url : current.logo_url,
    })
    .eq('id', clientId)
    .select('id, name, industry, agency_id, brand_info, logo_url, created_at')
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
 * Elimina un cliente lógicamente (soft-delete / papelera) por 7 días.
 */
export const deleteClient = async (clientId, token, userId = null) => {
  // Primero obtener el cliente existente para logging
  const current = await getClientById(clientId, token);
  if (!current) {
    return false;
  }

  // Marcar como eliminado estableciendo deleted_at a la fecha actual usando supabaseAdmin
  const { error } = await supabaseAdmin
    .from('clients')
    .update({ deleted_at: new Date().toISOString() })
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
      action_type: 'CLIENT_SOFT_DELETED',
      details: {
        client_name: current.name,
        client_industry: current.industry,
      }
    });
  }

  return true;
};

/**
 * Obtiene todos los clientes en la papelera de una agencia y ejecuta limpieza física (lazy cleanup) de clientes borrados hace >7 días.
 */
export const getTrashClients = async (agencyId) => {
  // 1. Limpieza física: Eliminar permanentemente los clientes cuya eliminación tenga más de 7 días
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { error: cleanupError } = await supabaseAdmin
    .from('clients')
    .delete()
    .eq('agency_id', agencyId)
    .not('deleted_at', 'is', null)
    .lt('deleted_at', sevenDaysAgo.toISOString());

  if (cleanupError) {
    console.error('[clients.service] Error en la autolimpieza física de la papelera:', cleanupError.message);
  }

  // 2. Obtener los clientes actualmente en la papelera
  const { data, error } = await supabaseAdmin
    .from('clients')
    .select('id, name, industry, logo_url, deleted_at, created_at')
    .eq('agency_id', agencyId)
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false });

  if (error) {
    throw new Error(`Error al obtener la papelera de clientes: ${error.message}`);
  }

  return data;
};

/**
 * Restaura un cliente que estaba en la papelera.
 */
export const restoreClient = async (clientId, token, userId = null) => {
  // Obtener el cliente desde supabaseAdmin (ya que getClientById/supabaseAuth no lo ve debido a RLS)
  const { data: current, error: fetchError } = await supabaseAdmin
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .single();

  if (fetchError || !current) {
    return false;
  }

  // Quitar la fecha de eliminación lógica
  const { error } = await supabaseAdmin
    .from('clients')
    .update({ deleted_at: null })
    .eq('id', clientId);

  if (error) {
    throw new Error(`Error al restaurar el cliente: ${error.message}`);
  }

  // Registrar actividad
  if (userId) {
    await logActivity({
      agency_id: current.agency_id,
      client_id: clientId,
      user_id: userId,
      action_type: 'CLIENT_RESTORED',
      details: {
        client_name: current.name,
        client_industry: current.industry,
      }
    });
  }

  return true;
};
