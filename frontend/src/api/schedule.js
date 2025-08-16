// src/api/schedule.js
import { apiFetch } from './apiFetch.js';

/**
 * Obtiene los ítems del cronograma para un cliente específico.
 * @param {string} clientId - El UUID del cliente.
 * @returns {Promise<Array>} La lista de ítems del cronograma.
 */
export const getSchedule = (clientId) => {
  return apiFetch(`/clients/${clientId}/schedule`);
};

/**
 * Crea un nuevo ítem en el cronograma.
 * @param {string} clientId - El UUID del cliente.
 * @param {object} itemData - Los datos del nuevo ítem.
 * @returns {Promise<object>} El ítem recién creado.
 */
export const createScheduleItem = (clientId, itemData) => {
  return apiFetch(`/clients/${clientId}/schedule`, {
    method: 'POST',
    body: JSON.stringify(itemData),
  });
};

/**
 * Obtiene un ítem específico del cronograma.
 * @param {string} clientId - El UUID del cliente.
 * @param {string} itemId - El ID del ítem del cronograma.
 * @returns {Promise<object>} Los datos del ítem.
 */
export const getScheduleItem = (clientId, itemId) => {
  return apiFetch(`/clients/${clientId}/schedule/${itemId}`);
};

/**
 * Actualiza un ítem del cronograma.
 * @param {string} clientId - El UUID del cliente.
 * @param {string} itemId - El ID del ítem del cronograma.
 * @param {object} updateData - Los datos a actualizar.
 * @returns {Promise<object>} El ítem actualizado.
 */
export const updateScheduleItem = (clientId, itemId, updateData) => {
  return apiFetch(`/clients/${clientId}/schedule/${itemId}`, {
    method: 'PUT',
    body: JSON.stringify(updateData),
  });
};

/**
 * Elimina un ítem del cronograma.
 * @param {string} clientId - El UUID del cliente.
 * @param {string} itemId - El ID del ítem del cronograma.
 * @returns {Promise<object>} Confirmación de eliminación.
 */
export const deleteScheduleItem = (clientId, itemId) => {
  return apiFetch(`/clients/${clientId}/schedule/${itemId}`, {
    method: 'DELETE',
  });
};
