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
    timeout: 180000, // 3 minutos de timeout para generación de ideas
  }).then((resp) => resp?.data ?? resp);
};

/**
 * Obtiene respuesta de chat conversacional con IA.
 * @param {string} clientId - El UUID del cliente.
 * @param {object} chatData - Los datos del chat (userPrompt, chatHistory).
 * @returns {Promise<object>} La respuesta del chat.
 */
export const getChatResponse = (clientId, chatData) => {
  return apiFetch(`/clients/${clientId}/chat`, {
    method: 'POST',
    body: JSON.stringify(chatData),
  }).then((resp) => resp?.data ?? resp);
};

/**
 * Lista historial de chat paginado
 * @param {string} clientId
 * @param {{ limit?: number, before?: string }} params
 */
export const getChatHistory = (clientId, params = {}) => {
  const usp = new URLSearchParams();
  if (params.limit) usp.set('limit', String(params.limit));
  if (params.before) usp.set('before', params.before);
  const qs = usp.toString();
  return apiFetch(`/clients/${clientId}/chat/history${qs ? `?${qs}` : ''}`)
    .then((resp) => resp?.data ?? resp);
};
