// src/api/clients.js
import { apiFetch } from './apiFetch.js';

export const getClients = () => {
  return apiFetch('/clients');
};

export const getClientById = (clientId) => {
  return apiFetch(`/clients/${clientId}`);
};

export const createClient = (clientData) => {
  return apiFetch('/clients', {
    method: 'POST',
    body: JSON.stringify(clientData),
  });
};
