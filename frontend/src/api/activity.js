// Activity API functions for frontend
import { apiFetch } from './apiFetch.js';

/**
 * Get activity feed for a specific client
 * @param {string} clientId - The client ID to get activity for
 * @param {Object} options - Optional parameters
 * @param {number} options.limit - Maximum number of activities to return (default: 50)
 * @returns {Promise<Array>} Array of activity objects
 */
export const getClientActivityFeed = async (clientId, options = {}) => {
  const { limit = 50 } = options;

  const params = new URLSearchParams();
  if (limit) params.append('limit', limit.toString());

  const url = `/clients/${clientId}/activity-feed${params.toString() ? '?' + params.toString() : ''}`;

  return apiFetch(url);
};

/**
 * Get global activity feed for the current agency (dashboard)
 * @param {Object} options
 * @param {number} options.limit
 * @param {string} options.cursor
 */
export const getAgencyActivityFeed = async ({ limit = 20, cursor } = {}) => {
  const params = new URLSearchParams();
  if (limit) params.append('limit', String(limit));
  if (cursor) params.append('cursor', cursor);
  const url = `/activity-feed${params.toString() ? '?' + params.toString() : ''}`;
  return apiFetch(url);
};
