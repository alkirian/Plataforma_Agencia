import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
    throw new Error('FATAL ERROR: Supabase URL, Anon Key, and Service Key must be defined.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Crea un cliente Supabase autenticado con el token del usuario
 * @param {string} token - JWT token del usuario
 * @returns {Object} Cliente Supabase autenticado
 * @throws {Error} Si no se proporciona el token
 */
export const createAuthenticatedClient = (token) => {
  if (!token) {
    throw new Error('Token de autenticación es requerido.');
  }
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
};