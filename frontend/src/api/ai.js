// src/api/ai.js
import { apiFetch } from './apiFetch.js';

/**
 * Genera ideas usando IA para un cliente específico.
 * @param {string} clientId - El UUID del cliente.
 * @param {object} promptData - Los datos del prompt para la IA.
 * @returns {Promise<object>} Las ideas generadas por la IA.
 */
export const generateIdeas = (clientId, promptData) => {
  return apiFetch(`/clients/${clientId}/generate-ideas`, {
    method: 'POST',
    body: JSON.stringify(promptData),
  });
};
