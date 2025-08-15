// src/api/apiFetch.js

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

/**
 * Ayudante centralizado para realizar peticiones a la API del backend.
 * - Extrae automáticamente el token de autenticación desde localStorage.
 * - Configura los headers correctos, incluyendo 'Content-Type' y 'Authorization'.
 * - Maneja las respuestas de error de la API y lanza excepciones claras.
 * - Gestiona respuestas sin contenido (ej. DELETE, status 204).
 *
 * @param {string} endpoint - El endpoint al que se llamará (ej. '/clients').
 * @param {object} options - Opciones estándar de la API Fetch (method, body, etc.).
 * @returns {Promise<any>} Los datos de la respuesta en formato JSON.
 */
export const apiFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem('authToken');

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ message: 'Error en la petición de red' }));
    throw new Error(errorBody.message || 'Ocurrió un error inesperado en el servidor');
  }

  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return { success: true };
  }

  return response.json();
};
