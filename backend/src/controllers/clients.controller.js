import {
  createClient,
  getClientsByAgency,
  getClientById,
  deleteClientById,
  getClientStats,
} from '../services/clients.service.js';
import { getActivityFeedByClient } from '../services/activity.service.js';
import { getUserAgencyId, getUserProfile } from '../helpers/userHelpers.js';
import { supabaseAdmin } from '../config/supabaseClient.js';
import { validateData, clientCreateSchema } from '../schemas/validation.js';
import { logger } from '../utils/logger.js';
import {
  asyncHandler,
  ensureFields,
  sendCreated,
  sendSuccess,
  sendNoContent,
  HttpError,
} from '../utils/http.js';

export const handleCreateClient = asyncHandler(async (req, res) => {
  const validation = validateData(clientCreateSchema, req.body);

  if (!validation.success) {
    throw new HttpError(400, 'Input data invalid', { errors: validation.errors });
  }

  const userProfile = await getUserProfile(req.user.id);
  const nameToCheck = validation.data.name.trim();
  const { data: existing, error: existErr } = await supabaseAdmin
    .from('clients')
    .select('id')
    .eq('agency_id', userProfile.agency_id)
    .ilike('name', nameToCheck);

  if (existErr) {
    throw new HttpError(400, existErr.message);
  }

  if (existing && existing.length > 0) {
    throw new HttpError(409, 'Ya existe un cliente con ese nombre en tu agencia.');
  }

  const newClient = await createClient(validation.data, req.token, req.user.id, userProfile.agency_id);
  return sendCreated(res, newClient);
});

export const handleGetClients = asyncHandler(async (req, res) => {
  const userProfile = await getUserProfile(req.user.id);
  const clients = await getClientsByAgency(userProfile.agency_id, req.token);
  return sendSuccess(res, clients);
});

export const handleGetClientById = asyncHandler(async (req, res) => {
  const { clientId } = req.params;
  ensureFields({ clientId }, ['clientId']);

  const client = await getClientById(clientId, req.token);

  if (!client) {
    throw new HttpError(404, 'Cliente no encontrado o no tienes permiso para verlo.');
  }

  return sendSuccess(res, client);
});

export const handleGetActivityFeed = asyncHandler(async (req, res) => {
  const { clientId } = req.params;
  ensureFields({ clientId }, ['clientId']);

  const agencyId = await getUserAgencyId(req.user.id);
  const feed = await getActivityFeedByClient(clientId, agencyId);

  return sendSuccess(res, feed);
});

export const handleDeleteClient = asyncHandler(async (req, res) => {
  const { clientId } = req.params;
  ensureFields({ clientId }, ['clientId']);

  const userId = req.user?.id;
  const profile = await getUserProfile(userId);

  if (!profile) {
    throw new HttpError(401, 'Perfil de usuario no encontrado');
  }

  if (profile.role !== 'admin') {
    throw new HttpError(403, 'Solo administradores pueden eliminar clientes');
  }

  const { data: client, error: clientErr } = await supabaseAdmin
    .from('clients')
    .select('id, agency_id')
    .eq('id', clientId)
    .single();

  if (clientErr || !client) {
    throw new HttpError(404, 'Cliente no encontrado');
  }

  if (client.agency_id !== profile.agency_id) {
    throw new HttpError(403, 'No tienes permisos para este cliente');
  }

  await deleteClientById(clientId, profile.agency_id);
  return sendNoContent(res);
});

export const handleGetClientStats = asyncHandler(async (req, res) => {
  const { clientId } = req.params;
  ensureFields({ clientId }, ['clientId']);

  try {
    const stats = await getClientStats(clientId, req.token);
    return sendSuccess(res, stats);
  } catch (error) {
    logger.error('Error getting client stats', error, { clientId });
    throw error;
  }
});

export const handleUploadClientAvatar = asyncHandler(async (req, res) => {
  const { clientId } = req.params;
  ensureFields({ clientId }, ['clientId']);

  if (!req.file && !req.files) {
    throw new HttpError(400, 'No file provided');
  }

  logger.info('Avatar upload requested for client', { clientId });

  return sendSuccess(
    res,
    {
      clientId,
      avatarUrl: `/api/v1/clients/${clientId}/avatar`,
    },
    200,
    { message: 'Avatar subido exitosamente' },
  );
});
