import { apiFetch } from './clients.js';

export const generateIdeas = ({ clientId, userPrompt, monthContext }) =>
  apiFetch(`/clients/${clientId}/generate-ideas`, {
    method: 'POST',
    body: JSON.stringify({ userPrompt, monthContext }),
  });
