// src/api/webSources.js
import { apiFetch } from './apiFetch';

export const listWebSources = (clientId) =>
  apiFetch(`/clients/${clientId}/web-sources`, { method: 'GET' });

export const startWebScrape = (clientId, url) =>
  apiFetch(`/clients/${clientId}/scrape-website`, {
    method: 'POST',
    body: JSON.stringify({ url }),
  });
