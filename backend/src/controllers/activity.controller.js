import { getAgencyActivityFeed } from '../services/activity.service.js';
import { getUserAgencyId } from '../helpers/userHelpers.js';

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
