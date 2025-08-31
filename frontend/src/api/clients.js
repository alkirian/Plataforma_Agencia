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

/**
 * Actualiza metadatos del cliente (website y social_links)
 */
export const updateClientMeta = (clientId, { website, social_links }) => {
  return apiFetch(`/clients/${clientId}`, {
    method: 'PATCH',
    body: JSON.stringify({ website, social_links })
  });
};

/**
 * Contactos del cliente
 */
export const listClientContacts = (clientId) => {
  return apiFetch(`/clients/${clientId}/contacts`);
};

export const upsertClientContacts = (clientId, contacts) => {
  return apiFetch(`/clients/${clientId}/contacts`, {
    method: 'POST',
    body: JSON.stringify({ contacts })
  });
};

export const deleteClientContact = (clientId, contactId) => {
  return apiFetch(`/clients/${clientId}/contacts/${contactId}`, { method: 'DELETE' });
};
