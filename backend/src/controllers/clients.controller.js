import { supabaseAdmin } from '../config/supabaseClient.js';
import { createClient, getClientsByAgency, getClientById } from '../services/clients.service.js';

// Esta función auxiliar es un caso especial y necesita privilegios para buscar cualquier perfil.
// La cambiaremos para que use supabaseAdmin.
const getUserProfile = async (userId) => {
    const { data, error } = await supabaseAdmin.from('profiles').select('agency_id').eq('id', userId).single();
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
// src/controllers/clients.controller.js

// ... (aquí va el código que ya tienes: getUserProfile, handleCreateClient, handleGetClients)

// 👇 AGREGA ESTA NUEVA FUNCIÓN EXPORTADA 👇
// src/controllers/clients.controller.js

export const handleGetClientById = async (req, res, next) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    // ✅ CORRECCIÓN: Usamos 'clientId' para que coincida con la ruta
    const { clientId } = req.params;

    // Llamamos a la nueva función del servicio con el ID correcto
    const client = await getClientById(clientId, token);

    // Si el servicio devuelve null, significa que el cliente no se encontró
    if (!client) {
      return res.status(404).json({ success: false, message: 'Cliente no encontrado o no tienes permiso para verlo.' });
    }

    // Si todo va bien, devolvemos el cliente encontrado
    res.status(200).json({ success: true, data: client });

  } catch (error) {
    next(error);
  }
};