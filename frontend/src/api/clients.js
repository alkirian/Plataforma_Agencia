import { supabase } from '../supabaseClient.js';

const BASE_URL = 'http://localhost:3001/api/v1';

/**
 * Obtiene el token de sesión actual del usuario.
 * @returns {Promise<string|null>} El token de acceso o null si no hay sesión.
 */
const getAuthToken = async () => {
  const { data } = await supabase.auth.getSession();
  return data?.session?.access_token || null;
};

/**
 * Obtiene la lista de clientes de la agencia.
 * @returns {Promise<Array>} La lista de clientes.
 */
export const fetchClients = async () => {
  const token = await getAuthToken();
  const response = await fetch(`${BASE_URL}/clients`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error('Error al obtener los clientes.');
  }
  const data = await response.json();
  return data.data;
};

/**
 * Crea un nuevo cliente.
 * @param {object} clientData - Datos del nuevo cliente (ej. { name, industry }).
 * @returns {Promise<object>} El cliente recién creado.
 */
export const createClient = async (clientData) => {
  const token = await getAuthToken();
  const response = await fetch(`${BASE_URL}/clients`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(clientData),
  });
  if (!response.ok) {
    throw new Error('Error al crear el cliente.');
  }
  const data = await response.json();
  return data.data;
};
