// src/api/clients.js
import { apiFetch } from './apiFetch.js';

/**
 * Obtiene la lista de todos los clientes.
 * @returns {Promise<Array>} Lista de clientes.
 */
export const getClients = () => {
  return apiFetch('/clients');
};

/**
 * Obtiene un cliente específico por su ID.
 * @param {string} clientId - El UUID del cliente.
 * @returns {Promise<object>} Los datos del cliente.
 */
export const getClientById = clientId => {
  return apiFetch(`/clients/${clientId}`);
};

/**
 * Crea un nuevo cliente.
 * @param {object} clientData - Los datos del nuevo cliente.
 * @returns {Promise<object>} El cliente recién creado.
 */
export const createClient = clientData => {
  return apiFetch('/clients', {
    method: 'POST',
    body: JSON.stringify(clientData),
  });
};

export const updateClientCardColor = (clientId, cardColor) => {
  return apiFetch(`/clients/${clientId}/card-color`, {
    method: 'PUT',
    body: JSON.stringify({ card_color: cardColor }),
  });
};

export const getClientBrandProfile = clientId => {
  return apiFetch(`/clients/${clientId}/brand-profile`);
};

export const updateClientBrandProfile = (clientId, brandProfile) => {
  return apiFetch(`/clients/${clientId}/brand-profile`, {
    method: 'PUT',
    body: JSON.stringify(brandProfile),
  });
};

export const autoFillBrandProfile = (clientId, payload) => {
  return apiFetch(`/clients/${clientId}/brand-profile/auto-fill`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

export const searchCompanyBrandProfile = (clientId, companyName) => {
  return apiFetch(`/clients/${clientId}/brand-profile/search-company`, {
    method: 'POST',
    body: JSON.stringify({ companyName }),
  });
};

export const updateClient = (clientId, clientData) => {
  return apiFetch(`/clients/${clientId}`, {
    method: 'PUT',
    body: JSON.stringify(clientData),
  });
};

export const deleteClient = clientId => {
  return apiFetch(`/clients/${clientId}`, {
    method: 'DELETE',
  });
};
