// src/api/schedule.js
import { apiFetch } from './apiFetch.js';

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
  const resp = await apiFetch(`/clients/${clientId}/schedule`, {
    method: 'POST',
    body: JSON.stringify(itemData),
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
  const resp = await apiFetch(`/clients/${clientId}/schedule/${itemId}`, {
    method: 'PUT',
    body: JSON.stringify(updateData),
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
