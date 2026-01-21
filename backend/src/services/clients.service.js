// src/services/clients.service.js

import {
  createAuthenticatedClient,
  supabaseAdmin,
} from "../config/supabaseClient.js";

/**
 * Obtiene todos los clientes de una agencia, usando los permisos del usuario.
 */
export const getClientsByAgency = async (agencyId, token) => {
  const supabaseAuth = createAuthenticatedClient(token);
  const { data, error } = await supabaseAuth
    .from("clients")
    .select("id, name, industry")
    .eq("agency_id", agencyId);

  if (error) throw new Error(`Error al obtener los clientes: ${error.message}`);
  return data;
};

/**
 * Llama a una función SQL para crear un nuevo cliente.
 */
export const createClient = async (clientData, token, userId, agencyId) => {
  const supabaseAuth = createAuthenticatedClient(token);
  
  // Usamos insert directo en lugar de RPC para mayor control y compatibilidad
  // Filtramos campos que sabemos que podrían no existir en la BD actual para evitar errores
  // (Aunque lo ideal es correr la migración, esto permite que funcione parcialmente)
  const payload = {
    name: clientData.name,
    industry: clientData.industry,
    email: clientData.email,
    phone: clientData.phone,
    website: clientData.website,
    // description: clientData.description, // Posiblemente mapeado a 'notes' que falta
    agency_id: agencyId,
    user_id: userId // Fix constraint NOT NULL
  };

  // Si la BD tiene las columnas, se pueden descomentar o agregar dinámicamente
  // Por ahora enviamos lo básico seguro
  
  const { data, error } = await supabaseAuth
    .from("clients")
    .insert(payload)
    .select()
    .single();

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
    .from("clients")
    .select("*")
    .eq("id", clientId)
    .single();

  if (error) {
    // Si el error es 'PGRST116', significa que no se encontró ninguna fila (o no tiene permiso).
    // Devolvemos null para que el controlador lo maneje como un 404 Not Found.
    if (error.code === "PGRST116") {
      return null;
    }
    // Para cualquier otro error, lanzamos una excepción.
    throw new Error(`Error al obtener el cliente: ${error.message}`);
  }

  return data;
};

/**
 * Elimina un cliente por ID dentro de una agencia (verificado previamente en el controlador).
 * Usa supabaseAdmin para asegurar borrado atómico y respetar FKs ON DELETE CASCADE.
 */
export const deleteClientById = async (clientId, agencyId) => {
  const { error } = await supabaseAdmin
    .from("clients")
    .delete()
    .eq("id", clientId)
    .eq("agency_id", agencyId)
    .single();
  if (error)
    throw new Error(`No se pudo eliminar el cliente: ${error.message}`);
  return true;
};

/**
 * Obtiene estadísticas de un cliente específico
 */
export const getClientStats = async (clientId, token) => {
  const supabaseAuth = createAuthenticatedClient(token);

  try {
    // Obtener estadísticas básicas del cliente
    const [documentsResult, tasksResult, ideasResult] = await Promise.all([
      // Contar documentos
      supabaseAuth
        .from("documents")
        .select("id", { count: "exact" })
        .eq("client_id", clientId)
        .eq("deleted", false),

      // Contar tareas
      supabaseAuth
        .from("schedule_items")
        .select("id, status", { count: "exact" })
        .eq("client_id", clientId),

      // Contar ideas de IA
      supabaseAuth
        .from("ai_ideas")
        .select("id", { count: "exact" })
        .eq("client_id", clientId),
    ]);

    const documentsCount = documentsResult.count || 0;
    const tasksCount = tasksResult.count || 0;
    const ideasCount = ideasResult.count || 0;

    // Calcular estadísticas de tareas por estado
    const tasksByStatus = {};
    if (tasksResult.data) {
      tasksResult.data.forEach((task) => {
        const status = task.status || "pending";
        tasksByStatus[status] = (tasksByStatus[status] || 0) + 1;
      });
    }

    return {
      documents: {
        total: documentsCount,
      },
      tasks: {
        total: tasksCount,
        byStatus: tasksByStatus,
      },
      aiIdeas: {
        total: ideasCount,
      },
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    throw new Error(
      `Error al obtener estadísticas del cliente: ${error.message}`,
    );
  }
};
