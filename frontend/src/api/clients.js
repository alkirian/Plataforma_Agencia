import { supabase } from '../supabaseClient.js';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Función de ayuda centralizada para todas las llamadas a nuestra API
const apiFetch = async (endpoint, options = {}) => {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const responseData = await response.json();
  if (!response.ok) {
    throw new Error(responseData.message || 'Error en la petición a la API.');
  }
  return responseData.data;
};

export const fetchClients = () => apiFetch('/clients');

export const createClient = (clientData) => apiFetch('/clients', {
  method: 'POST',
  body: JSON.stringify(clientData),
});

// Obtiene los detalles de un solo cliente por su ID
export const fetchClientById = (clientId) => apiFetch(`/clients/${clientId}`);
