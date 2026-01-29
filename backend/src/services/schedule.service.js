import { createAuthenticatedClient } from "../config/supabaseClient.js";
import { logActivity } from "./activity.service.js";
import { logger } from "../utils/logger.js";

// Helper: normaliza el estado al formato esperado por el ENUM de la BD
// El enum de Supabase usa español con primera letra mayúscula: Pendiente, En diseño, etc.
const normalizeStatus = (status) => {
  if (!status) return status;
  const raw = String(status).trim();
  const lc = raw.toLowerCase();
  const map = {
    // Inglés (minúsculas) -> Español (mayúscula inicial) [formato del enum DB]
    pending: "Pendiente",
    "in-design": "En diseño",
    in_design: "En diseño",
    "in design": "En diseño",
    approved: "Aprobado",
    published: "Publicado",
    cancelled: "Cancelado",
    canceled: "Cancelado",
    // Español (minúsculas) -> Español (mayúscula inicial)
    pendiente: "Pendiente",
    "en diseño": "En diseño",
    "en diseno": "En diseño",
    "en-diseño": "En diseño",
    aprobado: "Aprobado",
    publicado: "Publicado",
    cancelado: "Cancelado",
    // Ya en formato correcto
    Pendiente: "Pendiente",
    "En diseño": "En diseño",
    Aprobado: "Aprobado",
    Publicado: "Publicado",
    Cancelado: "Cancelado",
  };
  return map[lc] || map[raw] || "Pendiente"; // default a Pendiente si no hay mapeo
};

/**
 * Obtiene todos los ítems del cronograma para un cliente específico.
 */
export const getScheduleItemsByClient = async (clientId, token) => {
  const supabaseAuth = createAuthenticatedClient(token);
  const { data, error } = await supabaseAuth
    .from("schedule_items")
    .select("*")
    .eq("client_id", clientId);

  if (error) throw new Error(error.message);
  return data;
};

/**
 * Crea un nuevo ítem en el cronograma.
 */
export const createScheduleItem = async (itemData, token, userId = null) => {
  const supabaseAuth = createAuthenticatedClient(token);
  // Normalizar y validar status antes de insertar
  // Los valores permitidos son en español con mayúscula inicial (formato del enum de Supabase)
  const allowed = [
    "Pendiente",
    "En diseño",
    "Aprobado",
    "Publicado",
    "Cancelado",
  ];
  const normalizedStatus = normalizeStatus(itemData.status);
  if (normalizedStatus && !allowed.includes(normalizedStatus)) {
    logger.warn("Status no permitido, normalizado", {
      received: itemData.status,
      normalized: normalizedStatus,
    });
  }
  // Ensure agency_id is present
  let agencyId = itemData.agency_id;
  if (!agencyId && itemData.client_id) {
    const { data: clientData, error: clientError } = await supabaseAuth
        .from("clients")
        .select("agency_id")
        .eq("id", itemData.client_id)
        .single();
    
    if (!clientError && clientData) {
        agencyId = clientData.agency_id;
    }
  }

  // Only include fields that exist in the schedule_items table
  const payload = {
    client_id: itemData.client_id,
    title: itemData.title,
    description: itemData.description || itemData.copy || null,
    scheduled_at: itemData.scheduled_at,
    status: normalizedStatus || itemData.status || 'Pendiente',
    channel: itemData.channel || null,
    priority: itemData.priority || null,
    media: itemData.media || null,
    links: itemData.links || [],
    // platform: itemData.platform || null,
    // post_type: itemData.post_type || null,
    // hashtags: itemData.hashtags || [], 
    agency_id: agencyId,
  };
  const { data, error } = await supabaseAuth
    .from("schedule_items")
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
      action_type: "SCHEDULE_ITEM_CREATED",
      details: {
        item_title: data.title,
        item_id: data.id,
        scheduled_at: data.scheduled_at, // Fix: Usar columna real de BD
        // start_date: data.start, // No existe en BD
        // end_date: data.end, // No existe en BD
      },
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
    .from("schedule_items")
    .select("*")
    .eq("id", itemId)
    .eq("client_id", clientId)
    .single();

  if (error) throw new Error(error.message);
  return data;
};

/**
 * Actualiza un ítem del cronograma.
 */
export const updateScheduleItem = async (
  itemId,
  clientId,
  updateData,
  token,
  userId = null,
) => {
  const supabaseAuth = createAuthenticatedClient(token);
  // Normalizar status si viene en el update
  let normalizedUpdate = { ...updateData };
  if (Object.prototype.hasOwnProperty.call(updateData, "status")) {
    const allowed = [
      "pending",
      "in-design",
      "approved",
      "published",
      "cancelled",
    ];
    const normalizedStatus = normalizeStatus(updateData.status);
    if (normalizedStatus && !allowed.includes(normalizedStatus)) {
      logger.warn("Update status no permitido, normalizado", {
        received: updateData.status,
        normalized: normalizedStatus,
      });
    }
    normalizedUpdate.status = normalizedStatus || updateData.status;
  }

  // Primero verificar que el item existe y pertenece al cliente
  const { data: existingItem, error: fetchError } = await supabaseAuth
    .from("schedule_items")
    .select("*")
    .eq("id", itemId)
    .eq("client_id", clientId)
    .single();

  if (fetchError) throw new Error("Evento no encontrado");

  // Actualizar el item
  const { data, error } = await supabaseAuth
    .from("schedule_items")
    .update(normalizedUpdate)
    .eq("id", itemId)
    .eq("client_id", clientId)
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Log activity
  if (userId) {
    await logActivity({
      agency_id: data.agency_id,
      client_id: data.client_id,
      user_id: userId,
      action_type: "SCHEDULE_ITEM_UPDATED",
      details: {
        item_title: data.title,
        item_id: data.id,
        previous_status: existingItem.status,
        new_status: data.status,
      },
    });
  }

  return data;
};

/**
 * Elimina un ítem del cronograma.
 */
export const deleteScheduleItem = async (
  itemId,
  clientId,
  token,
  userId = null,
) => {
  const supabaseAuth = createAuthenticatedClient(token);

  // Primero obtener el item para logging
  const { data: item, error: fetchError } = await supabaseAuth
    .from("schedule_items")
    .select("*")
    .eq("id", itemId)
    .eq("client_id", clientId)
    .single();

  if (fetchError) throw new Error("Evento no encontrado");

  // Eliminar el item
  const { error } = await supabaseAuth
    .from("schedule_items")
    .delete()
    .eq("id", itemId)
    .eq("client_id", clientId);

  if (error) throw new Error(error.message);

  // Log activity
  if (userId) {
    await logActivity({
      agency_id: item.agency_id,
      client_id: item.client_id,
      user_id: userId,
      action_type: "SCHEDULE_ITEM_DELETED",
      details: {
        item_title: item.title,
        item_id: item.id,
      },
    });
  }

  return true;
};
