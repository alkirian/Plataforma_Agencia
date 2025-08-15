// src/services/ai.js
import { apiFetch } from '../api/apiFetch.js';

export const generateIdeas = async (clientId, { userPrompt }) => {
  const body = { userPrompt };
  const response = await apiFetch(`/clients/${clientId}/generate-ideas`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return response.data;
};
