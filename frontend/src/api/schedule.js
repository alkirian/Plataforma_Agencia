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
