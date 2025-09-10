// src/api/apiFetch.js
import { supabase } from '../supabaseClient.js'

const API_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:3001/api/v1'

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
  // Prefer the live Supabase session token to avoid using stale tokens
  const { data: sessionData } = await supabase.auth.getSession()
  const liveToken = sessionData?.session?.access_token || null
  const legacyToken = !liveToken ? localStorage.getItem('authToken') : null

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  const tokenToUse = liveToken || legacyToken
  if (tokenToUse) {
    headers.Authorization = `Bearer ${tokenToUse}`
  }

  const doFetch = async () =>
    fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    })

  let response = await doFetch()

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`
    try {
      const errorData = await response.json()
      errorMessage = errorData.message || errorMessage
    } catch {
      // Si no es JSON, intentar texto
      try {
        const text = await response.text()
        if (text) errorMessage = text
      } catch {
        // Ignore text parsing errors
      }
    }

    // If unauthorized and we used a live Supabase token, try one silent refresh + retry
    if (response.status === 401 && liveToken) {
      try {
        const { data, error } = await supabase.auth.refreshSession()
        if (!error && data?.session?.access_token) {
          headers.Authorization = `Bearer ${data.session.access_token}`
          response = await doFetch()
          if (response.ok) {
            // Successful retry path: return parsed json or empty
            if (response.status === 204 || response.headers.get('content-length') === '0') {
              return { success: true }
            }
            return response.json()
          }
        }
      } catch {
        // Ignore refresh errors
      }
    }

    // Use provided HTTP method from options for clearer logs
    if (import.meta.env.DEV) {
      const method = options.method || 'GET'
      console.error(`API Error: ${method} ${endpoint} - ${response.status}:`, errorMessage)
    }
    const error = new Error(errorMessage)
    error.status = response.status
    throw error
  }

  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return { success: true }
  }

  return response.json()
}

/**
 * Manage active agency ID for API requests
 */
const ACTIVE_AGENCY_KEY = 'activeAgencyId'

export const setActiveAgencyIdForAPI = agencyId => {
  if (agencyId) {
    localStorage.setItem(ACTIVE_AGENCY_KEY, agencyId)
  } else {
    localStorage.removeItem(ACTIVE_AGENCY_KEY)
  }
}

export const getActiveAgencyIdFromAPI = () => {
  return localStorage.getItem(ACTIVE_AGENCY_KEY)
}
