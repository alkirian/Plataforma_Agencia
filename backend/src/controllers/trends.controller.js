import {
  runDailyTrendsJob,
  runTrendsForClient,
  getTrendReports,
  getLatestTrendReports,
} from '../services/trends.service.js';
import { createAuthenticatedClient } from '../config/supabaseClient.js';

/**
 * POST /api/v1/trends/run
 * Dispara manualmente el análisis de tendencias para todos los clientes de la agencia.
 */
export const handleRunTrends = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const supabaseAuth = createAuthenticatedClient(token);

    const { data: profile, error: profileErr } = await supabaseAuth
      .from('profiles')
      .select('agency_id')
      .single();

    if (profileErr || !profile?.agency_id) {
      return res.status(403).json({ success: false, message: 'No se encontró la agencia del usuario.' });
    }

    // Disparar job async (no bloquear la respuesta HTTP)
    runDailyTrendsJob(profile.agency_id)
      .then(result => {
        // El resultado se puede loguear, ya guardó en Supabase
        console.log('[trends] Job completado:', result);
      })
      .catch(err => {
        console.error('[trends] Error en job:', err.message);
      });

    return res.status(202).json({
      success: true,
      message: 'Análisis de tendencias iniciado. Los resultados estarán disponibles en unos momentos.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/trends/run/:clientId
 * Dispara el análisis para un cliente específico.
 */
export const handleRunTrendsForClient = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const { clientId } = req.params;

    const supabaseAuth = createAuthenticatedClient(token);
    const { data: client, error: clientErr } = await supabaseAuth
      .from('clients')
      .select('id, name, industry, agency_id, brand_info')
      .eq('id', clientId)
      .single();

    if (clientErr || !client) {
      return res.status(404).json({ success: false, message: 'Cliente no encontrado.' });
    }

    const { customKeywords } = req.body || {};

    // También async para no bloquear
    runTrendsForClient(client, customKeywords)
      .then(report => {
        console.log(`[trends] Reporte generado para cliente ${clientId}:`, report?.id);
      })
      .catch(err => {
        console.error(`[trends] Error generando reporte para ${clientId}:`, err.message);
      });

    return res.status(202).json({
      success: true,
      message: `Análisis de tendencias iniciado para ${client.name}. Los resultados estarán disponibles en unos momentos.`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/trends/:clientId
 * Obtiene los reportes de tendencias de un cliente (últimos 7 días).
 */
export const handleGetTrendReports = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const { clientId } = req.params;
    const limit = Math.max(1, Math.min(30, Number(req.query.limit) || 7));

    const reports = await getTrendReports({ clientId, limit, token });
    return res.status(200).json({ success: true, data: reports });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/trends/latest/all
 * Obtiene el reporte más reciente de cada cliente de la agencia.
 */
export const handleGetLatestTrendReports = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const reports = await getLatestTrendReports({ token });
    return res.status(200).json({ success: true, data: reports });
  } catch (error) {
    next(error);
  }
};
