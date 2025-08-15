// src/api/ai.js
import { apiFetch } from './apiFetch.js';

export const generateIdeas = (clientId, promptData) => {
  return apiFetch(`/clients/${clientId}/generate-ideas`, {
    method: 'POST',
    body: JSON.stringify(promptData),
  });
};
