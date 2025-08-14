import { apiFetch } from './clients';

/**
 * Obtiene los ítems del cronograma para un cliente específico.
 * @param {string} clientId - El UUID del cliente.
 * @returns {Promise<Array>} La lista de ítems del cronograma.
 */
export const fetchScheduleItems = (clientId) => apiFetch(`/clients/${clientId}/schedule`);

/**
 * Crea un nuevo ítem en el cronograma.
 * @param {string} clientId - El UUID del cliente.
 * @param {object} itemData - Los datos del nuevo ítem.
 * @returns {Promise<object>} El ítem recién creado.
 */
export const createScheduleItem = (clientId, itemData) => apiFetch(`/clients/${clientId}/schedule`, {
  method: 'POST',
  body: JSON.stringify(itemData),
});
