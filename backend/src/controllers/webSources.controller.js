// src/controllers/webSources.controller.js
import { startScraping, listWebSourcesByClient } from '../services/webSources.service.js';
import { getUserAgencyId } from '../helpers/userHelpers.js';

export const handleStartScraping = async (req, res, next) => {
  try {
    const { clientId } = req.params;
    const { url } = req.body || {};
    if (!url) return res.status(400).json({ success: false, message: 'url requerida' });

    const agencyId = await getUserAgencyId(req.user.id);
    const created = await startScraping(clientId, url, agencyId);

    // 202 Accepted para indicar procesamiento en background
    res.status(202).json({ success: true, data: created });
  } catch (error) {
    next(error);
  }
};

export const handleListWebSources = async (req, res, next) => {
  try {
    const { clientId } = req.params;
    const agencyId = await getUserAgencyId(req.user.id);
    const list = await listWebSourcesByClient(clientId, agencyId);
    res.status(200).json({ success: true, data: list });
  } catch (error) {
    next(error);
  }
};
