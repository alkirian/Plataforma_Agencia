import { createClient, getClientsByAgency, getClientById } from '../services/clients.service.js';
import { getActivityFeedByClient } from '../services/activity.service.js';
import { getUserAgencyId, getUserProfile } from '../helpers/userHelpers.js';
import { validateData, clientSchema } from '../schemas/validation.js';

export const handleCreateClient = async (req, res, next) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    
    // Validar datos de entrada
    const validation = validateData(clientSchema, req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: validation.errors
      });
    }

    const newClient = await createClient(validation.data, token);
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


export const handleGetActivityFeed = async (req, res, next) => {
  try {
    const { clientId } = req.params;
    const agencyId = await getUserAgencyId(req.user.id);
    const feed = await getActivityFeedByClient(clientId, agencyId);
    res.status(200).json({ success: true, data: feed });
  } catch (error) {
    next(error);
  }
};