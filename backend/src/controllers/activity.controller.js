import { supabaseAdmin } from '../config/supabaseClient.js';
import { getAgencyActivityFeed } from '../services/activity.service.js';

const getUserAgencyId = async (userId) => {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('agency_id')
    .eq('id', userId)
    .single();
  if (error) throw new Error('No se pudo obtener el perfil del usuario.');
  return data.agency_id;
};

export const handleGetAgencyActivityFeed = async (req, res, next) => {
  try {
    const agencyId = await getUserAgencyId(req.user.id);
    const { limit, cursor } = req.query;
    const parsedLimit = Math.max(1, Math.min(50, Number(limit) || 20));

    const { items, nextCursor } = await getAgencyActivityFeed(agencyId, { limit: parsedLimit, cursor });

    res.status(200).json({ success: true, data: items, nextCursor });
  } catch (error) {
    next(error);
  }
};
