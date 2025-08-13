import { supabaseAdmin as supabase } from '../config/supabaseClient.js';
import { createClient, getClientsByAgency } from '../services/clients.service.js';

const getUserProfile = async (userId) => {
  const { data, error } = await supabase.from('profiles').select('agency_id').eq('id', userId).single();
  if (error) {
    console.error("Error en getUserProfile:", error);
    throw new Error('No se pudo encontrar el perfil del usuario.');
  }
  return data;
};

export const handleCreateClient = async (req, res, next) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    const { name, industry } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'El nombre del cliente es requerido.' });
    }

    // El servicio ya no necesita el agency_id, solo los datos del cliente y el token.
    const newClient = await createClient({ name, industry }, token); 
    
    res.status(201).json({ success: true, data: newClient });
  } catch (error) {
    next(error);
  }
};

export const handleGetClients = async (req, res, next) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    const userProfile = await getUserProfile(req.user.id);
    const clients = await getClientsByAgency(userProfile.agency_id, token);

    res.status(200).json({ success: true, data: clients });
  } catch (error) {
    next(error);
  }
};