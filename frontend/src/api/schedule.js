// src/api/schedule.js
import { apiFetch } from './apiFetch.js';

// Normaliza/limpia el payload según el esquema del backend
const normalizeSchedulePayload = (raw = {}) => {
  const out = {};

  // Título
  if (typeof raw.title === 'string') {
    const t = raw.title.trim();
    if (t) out.title = t;
  }

  // Descripción/copy (opcionales)
  // TEMPORAL: mapear copy a description hasta que se ejecute la migración
  if (typeof raw.copy === 'string') {
    const c = raw.copy.trim();
    if (c) out.description = c; else out.description = null;
  } else if (typeof raw.description === 'string') {
    const d = raw.description.trim();
    if (d) out.description = d; else out.description = null;
  }

  // Fecha/hora ISO 8601
  if (raw.scheduled_at instanceof Date) {
    out.scheduled_at = raw.scheduled_at.toISOString();
  } else if (typeof raw.scheduled_at === 'string') {
    // Aceptar strings ya ISO o convertibles a Date
    const dt = new Date(raw.scheduled_at);
    out.scheduled_at = isNaN(dt.getTime()) ? raw.scheduled_at : dt.toISOString();
  }

  // Estado: aceptar valores conocidos (en español, también variantes en minúsculas)
  if (typeof raw.status === 'string') {
    const s = raw.status.trim();
    // Mantener en español/minúsculas si viene así; el backend normaliza a mayúsculas donde aplica
    const allowed = new Set([
      'pendiente','en-diseño','en-progreso','aprobado','publicado','cancelado',
      'Pendiente','En Diseño','En Progreso','Aprobado','Publicado','Cancelado',
    ]);
    out.status = allowed.has(s) ? s : 'pendiente';
  }

  // Prioridad: mapear a valores permitidos por el schema
  if (typeof raw.priority === 'string') {
    const p = raw.priority.trim();
    const map = {
      // inglés a minúsculas
      'LOW': 'low', 'Low': 'low', 'low': 'low',
      'MEDIUM': 'medium', 'Medium': 'medium', 'medium': 'medium',
      'HIGH': 'high', 'High': 'high', 'high': 'high',
      'URGENT': 'urgente', 'Urgent': 'urgente', 'urgent': 'urgente',
      // español
      'baja': 'baja', 'Baja': 'Baja',
      'media': 'media', 'Media': 'Media',
      'alta': 'alta', 'Alta': 'Alta',
      'urgente': 'urgente', 'Urgente': 'Urgente',
    };
    out.priority = map[p] || (['low','medium','high','baja','media','alta','urgente','Baja','Media','Alta','Urgente'].includes(p) ? p : 'medium');
  }

  // Canal (opcional, máx 50)
  if (typeof raw.channel === 'string') {
    out.channel = raw.channel.slice(0, 50);
  }

  // Ignorar otras claves no soportadas por el schema
  return out;
};

// Normaliza la respuesta del backend a un array consistente
const toArray = (resp) => {
  if (Array.isArray(resp)) return resp;
  if (Array.isArray(resp?.data)) return resp.data;
  if (Array.isArray(resp?.data?.items)) return resp.data.items;
  if (Array.isArray(resp?.items)) return resp.items;
  if (Array.isArray(resp?.records)) return resp.records;
  return [];
};

/**
 * Obtiene los ítems del cronograma para un cliente específico.
 * @param {string} clientId - El UUID del cliente.
 * @returns {Promise<Array>} La lista de ítems del cronograma.
 */
export const getSchedule = async (clientId) => {
  const resp = await apiFetch(`/clients/${clientId}/schedule`);
  return toArray(resp);
};

/**
 * Crea un nuevo ítem en el cronograma.
 * @param {string} clientId - El UUID del cliente.
 * @param {object} itemData - Los datos del nuevo ítem.
 * @returns {Promise<object>} El ítem recién creado.
 */
export const createScheduleItem = async (clientId, itemData) => {
  const payload = normalizeSchedulePayload(itemData);
  const resp = await apiFetch(`/clients/${clientId}/schedule`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return resp?.data ?? resp;
};

/**
 * Obtiene un ítem específico del cronograma.
 * @param {string} clientId - El UUID del cliente.
 * @param {string} itemId - El ID del ítem del cronograma.
 * @returns {Promise<object>} Los datos del ítem.
 */
export const getScheduleItem = async (clientId, itemId) => {
  const resp = await apiFetch(`/clients/${clientId}/schedule/${itemId}`);
  return resp?.data ?? resp;
};

/**
 * Actualiza un ítem del cronograma.
 * @param {string} clientId - El UUID del cliente.
 * @param {string} itemId - El ID del ítem del cronograma.
 * @param {object} updateData - Los datos a actualizar.
 * @returns {Promise<object>} El ítem actualizado.
 */
export const updateScheduleItem = async (clientId, itemId, updateData) => {
  const payload = normalizeSchedulePayload(updateData);
  const resp = await apiFetch(`/clients/${clientId}/schedule/${itemId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return resp?.data ?? resp;
};

/**
 * Elimina un ítem del cronograma.
 * @param {string} clientId - El UUID del cliente.
 * @param {string} itemId - El ID del ítem del cronograma.
 * @returns {Promise<object>} Confirmación de eliminación.
 */
export const deleteScheduleItem = async (clientId, itemId) => {
  const resp = await apiFetch(`/clients/${clientId}/schedule/${itemId}`, {
    method: 'DELETE',
  });
  return resp?.data ?? resp ?? { success: true };
};
