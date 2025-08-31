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

/**
 * Envía feedback like/dislike/clear para una idea específica
 * @param {string} clientId
 * @param {string} ideaId
 * @param {'like'|'dislike'|'clear'} value
 */
export const sendIdeaFeedback = (clientId, ideaId, value) => {
  return apiFetch(`/clients/${clientId}/ideas/${ideaId}/feedback`, {
    method: 'POST',
    body: JSON.stringify({ value }),
  }).then((resp) => resp?.data ?? resp);
};

/**
 * Lista ideas persistidas (opcional)
 */
export const listIdeas = (clientId, params = {}) => {
  const usp = new URLSearchParams();
  if (params.month) usp.set('month', String(params.month));
  if (params.year) usp.set('year', String(params.year));
  if (params.sessionId) usp.set('sessionId', params.sessionId);
  const qs = usp.toString();
  return apiFetch(`/clients/${clientId}/ideas${qs ? `?${qs}` : ''}`)
    .then((resp) => resp?.data ?? resp);
};
