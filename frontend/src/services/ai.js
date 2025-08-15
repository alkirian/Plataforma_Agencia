// src/services/ai.js
import { apiFetch } from '../api/apiFetch.js';

// Esta función se usará para el botón de "Generar Ideas"
export const generateIdeas = async (clientId, { userPrompt }) => {
  const body = { userPrompt };
  const response = await apiFetch(`/clients/${clientId}/generate-ideas`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return response.data;
};

// Esta es la nueva función para el chat conversacional
export const getChatResponse = async (clientId, { userPrompt, chatHistory }) => {
  const body = { userPrompt, chatHistory };
  const response = await apiFetch(`/clients/${clientId}/chat`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  // La respuesta del backend es { success, data: { response: 'texto...' } }
  return response.data;
};
