import { createClient, getClientsByAgency, getClientById, deleteClientById } from '../services/clients.service.js';
import { getActivityFeedByClient } from '../services/activity.service.js';
import { getUserAgencyId, getUserProfile } from '../helpers/userHelpers.js';
import { supabaseAdmin } from '../config/supabaseClient.js';
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

    // Unicidad por agencia (case-insensitive)
    const userProfile = await getUserProfile(req.user.id);
    const nameToCheck = validation.data.name.trim();
    const { data: existing, error: existErr } = await supabaseAdmin
      .from('clients')
      .select('id')
      .eq('agency_id', userProfile.agency_id)
      .ilike('name', nameToCheck);
    if (existErr) {
      return res.status(400).json({ success: false, message: existErr.message });
    }
    if (existing && existing.length > 0) {
      return res.status(409).json({ success: false, message: 'Ya existe un cliente con ese nombre en tu agencia.' });
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

export const handleDeleteClient = async (req, res, next) => {
  try {
    const { clientId } = req.params;
    const userId = req.user?.id;
    if (!clientId) return res.status(400).json({ success: false, message: 'clientId requerido' });

    // 1) Verificar perfil y rol
    const profile = await getUserProfile(userId);
    if (!profile) {
      return res.status(401).json({ success: false, message: 'Perfil de usuario no encontrado' });
    }
    if (profile.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Solo administradores pueden eliminar clientes' });
    }

    // 2) Verificar que el cliente pertenece a la misma agencia
    const { data: client, error: clientErr } = await supabaseAdmin
      .from('clients')
      .select('id, agency_id')
      .eq('id', clientId)
      .single();
    if (clientErr || !client) {
      return res.status(404).json({ success: false, message: 'Cliente no encontrado' });
    }
    if (client.agency_id !== profile.agency_id) {
      return res.status(403).json({ success: false, message: 'No tienes permisos para este cliente' });
    }

    // 3) Eliminar cliente (cascade en tablas relacionadas)
    await deleteClientById(clientId, profile.agency_id);

    return res.status(204).send();
  } catch (error) {
    next(error);
  }
};
