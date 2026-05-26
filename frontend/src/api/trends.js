// src/api/trends.js
import { apiFetch } from './apiFetch.js';

/**
 * Dispara el análisis de tendencias para todos los clientes de la agencia.
 * El servidor devuelve 202 inmediatamente y procesa en background.
 */
export const runTrendsNow = () => apiFetch('/trends/run', { method: 'POST' }).then(resp => resp);

/**
 * Dispara el análisis de tendencias para un cliente específico.
 * @param {string} clientId
 */
export const runTrendsForClient = (clientId, customKeywords = null) => {
  const options = { method: 'POST' };
  if (customKeywords) {
    options.body = JSON.stringify({ customKeywords });
  }
  return apiFetch(`/trends/run/${clientId}`, options).then(resp => resp);
};

/**
 * Obtiene los reportes de tendencias de un cliente específico.
 * @param {string} clientId
 * @param {number} [limit=7]
 */
export const getTrendReports = (clientId, limit = 7) =>
  apiFetch(`/trends/${clientId}?limit=${limit}`).then(resp => resp?.data ?? []);

/**
 * Obtiene el reporte más reciente de cada cliente de la agencia.
 */
export const getLatestTrendReports = () =>
  apiFetch('/trends/latest/all').then(resp => resp?.data ?? []);
