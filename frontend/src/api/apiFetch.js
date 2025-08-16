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
    let errorMessage = `HTTP ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
    } catch {
      // Si no es JSON, intentar texto
      try {
        const text = await response.text();
        if (text) errorMessage = text;
      } catch {}
    }
    
    console.error(`API Error: ${response.method || 'Unknown'} ${endpoint} - ${response.status}:`, errorMessage);
    const error = new Error(errorMessage);
    error.status = response.status;
    throw error;
  }

  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return { success: true };
  }

  return response.json();
};
