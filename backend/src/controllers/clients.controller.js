// ✅ CAMBIO: Importamos 'supabaseAdmin' en lugar del 'supabase' público.
import { supabaseAdmin as supabase } from '../config/supabaseClient.js'; 
import { createClient, getClientsByAgency } from '../services/clients.service.js';

// Función auxiliar para obtener el perfil del usuario logueado
const getUserProfile = async (userId) => {
  // Ahora esta consulta se ejecuta con permisos de administrador, por lo que no será bloqueada por RLS.
  const { data, error } = await supabase
    .from('profiles')
    .select('agency_id')
    .eq('id', userId)
    .single();

  if (error) {
    console.error("Error en getUserProfile:", error); // Añadimos un log para ver el error real de la BD
    throw new Error('No se pudo encontrar el perfil del usuario.');
  }
  return data;
};

export const handleCreateClient = async (req, res, next) => {
  try {
    const { name, industry } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'El nombre del cliente es requerido.' });
    }

    const userProfile = await getUserProfile(req.user.id);
    const newClient = await createClient({ name, industry }, userProfile.agency_id);

    res.status(201).json({ success: true, data: newClient });
  } catch (error) {
    next(error);
  }
};

export const handleGetClients = async (req, res, next) => {
  try {
    const userProfile = await getUserProfile(req.user.id);
    const clients = await getClientsByAgency(userProfile.agency_id);

    res.status(200).json({ success: true, data: clients });
  } catch (error) {
    next(error);
  }
};