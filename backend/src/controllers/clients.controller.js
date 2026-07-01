import {
  createClient,
  getClientsByAgency,
  getClientById,
  getClientBrandProfile,
  updateClientCardColor,
  updateClientBrandProfile,
  updateClient,
  deleteClient,
  getTrashClients,
  restoreClient,
} from '../services/clients.service.js';
import { getActivityFeedByClient } from '../services/activity.service.js';
import { getUserAgencyId, getUserProfile } from '../helpers/userHelpers.js';

export const handleCreateClient = async (req, res, next) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    const newClient = await createClient(req.validatedBody, token);
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
    const { clientId } = req.params;

    const client = await getClientById(clientId, token);

    if (!client) {
      return res.status(404).json({ success: false, message: 'Cliente no encontrado o no tienes permiso para verlo.' });
    }

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

export const handleGetClientBrandProfile = async (req, res, next) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    const { clientId } = req.params;
    const profile = await getClientBrandProfile(clientId, token);

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado o no tienes permiso para verlo.',
      });
    }

    res.status(200).json({
      success: true,
      data: profile.brand_info || {},
    });
  } catch (error) {
    next(error);
  }
};

export const handleUpdateClientBrandProfile = async (req, res, next) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    const { clientId } = req.params;

    const updated = await updateClientBrandProfile(clientId, req.validatedBody, token);
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado o no tienes permiso para editarlo.',
      });
    }

    res.status(200).json({
      success: true,
      data: updated.brand_info || {},
      message: 'Identidad de cliente actualizada.',
    });
  } catch (error) {
    next(error);
  }
};

export const handleUpdateClientCardColor = async (req, res, next) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    const { clientId } = req.params;

    const updated = await updateClientCardColor(clientId, req.validatedBody.card_color, token);
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado o no tienes permiso para editarlo.',
      });
    }

    res.status(200).json({
      success: true,
      data: updated,
      message: 'Color de tarjeta actualizado.',
    });
  } catch (error) {
    next(error);
  }
};

export const handleUpdateClient = async (req, res, next) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    const { clientId } = req.params;

    const updated = await updateClient(clientId, req.validatedBody, token, req.user.id);
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado o no tienes permiso para editarlo.',
      });
    }

    res.status(200).json({
      success: true,
      data: updated,
      message: 'Cliente actualizado correctamente.'
    });
  } catch (error) {
    next(error);
  }
};

export const handleDeleteClient = async (req, res, next) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    const { clientId } = req.params;

    // Verificar que el usuario sea administrador
    const userProfile = await getUserProfile(req.user.id);
    if (!userProfile || userProfile.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No autorizado. Solo los administradores pueden eliminar clientes.',
      });
    }

    const deleted = await deleteClient(clientId, token, req.user.id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado o no tienes permiso para eliminarlo.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Cliente enviado a la papelera correctamente.'
    });
  } catch (error) {
    next(error);
  }
};

export const handleGetTrashClients = async (req, res, next) => {
  try {
    const userProfile = await getUserProfile(req.user.id);
    if (!userProfile || userProfile.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No autorizado. Solo los administradores pueden ver la papelera.',
      });
    }

    const trashClients = await getTrashClients(userProfile.agency_id);
    res.status(200).json({
      success: true,
      data: trashClients
    });
  } catch (error) {
    next(error);
  }
};

export const handleRestoreClient = async (req, res, next) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    const { clientId } = req.params;

    const userProfile = await getUserProfile(req.user.id);
    if (!userProfile || userProfile.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No autorizado. Solo los administradores pueden restaurar clientes.',
      });
    }

    const restored = await restoreClient(clientId, token, req.user.id);
    if (!restored) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado o no se pudo restaurar.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Cliente restaurado correctamente.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/clients/:clientId/approval-link
 * Obtiene el enlace de aprobación externo activo para el cliente.
 */
import { supabaseAdmin } from '../config/supabaseClient.js'; // Asegurar import de supabaseAdmin
export const handleGetClientApprovalLink = async (req, res, next) => {
  try {
    const { clientId } = req.params;
    const agencyId = await getUserAgencyId(req.user.id);

    // 1. Verificar que el cliente existe y pertenece a la agencia del usuario
    const { data: client, error: clientErr } = await supabaseAdmin
      .from('clients')
      .select('id, agency_id')
      .eq('id', clientId)
      .eq('agency_id', agencyId)
      .maybeSingle();

    if (clientErr || !client) {
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado o cliente no encontrado.',
      });
    }

    // 2. Obtener enlace activo
    const { data: link, error: linkErr } = await supabaseAdmin
      .from('client_approval_links')
      .select('*')
      .eq('client_id', clientId)
      .eq('is_active', true)
      .maybeSingle();

    if (linkErr) throw linkErr;

    return res.status(200).json({
      success: true,
      data: link || null,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/clients/:clientId/approval-link
 * Genera o regenera el enlace de aprobación seguro para el cliente (indefinido por defecto).
 */
export const handleCreateClientApprovalLink = async (req, res, next) => {
  try {
    const { clientId } = req.params;
    const agencyId = await getUserAgencyId(req.user.id);

    // 1. Verificar pertenencia del cliente
    const { data: client, error: clientErr } = await supabaseAdmin
      .from('clients')
      .select('id, agency_id')
      .eq('id', clientId)
      .eq('agency_id', agencyId)
      .maybeSingle();

    if (clientErr || !client) {
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado o cliente no encontrado.',
      });
    }

    // 2. Desactivar enlaces activos anteriores para este cliente
    await supabaseAdmin
      .from('client_approval_links')
      .update({ is_active: false })
      .eq('client_id', clientId);

    // 3. Crear nuevo enlace de aprobación indefinido
    const { data: newLink, error: createErr } = await supabaseAdmin
      .from('client_approval_links')
      .insert({
        client_id: clientId,
        agency_id: agencyId,
        created_by: req.user.id,
        is_active: true,
      })
      .select('*')
      .single();

    if (createErr) throw createErr;

    return res.status(201).json({
      success: true,
      message: 'Enlace de aprobación generado con éxito.',
      data: newLink,
    });
  } catch (error) {
    next(error);
  }
};

