// src/api/shared.js
import { apiFetch } from './apiFetch.js';

/**
 * Obtiene la información del cronograma compartido para el cliente (Ruta Pública)
 * @param {string} token
 */
export const getSharedApprovalDetails = token =>
  apiFetch(`/shared/approval/${token}`).then(resp => resp?.data ?? resp);

/**
 * Aprueba un post de forma externa y anónima (Ruta Pública)
 * @param {string} token
 * @param {string} itemId
 */
export const sharedApprovePost = (token, itemId) =>
  apiFetch(`/shared/approval/${token}/items/${itemId}/approve`, { method: 'POST' });

/**
 * Envía comentarios de ajuste para un post (Ruta Pública)
 * @param {string} token
 * @param {string} itemId
 * @param {string} feedback
 */
export const sharedFeedbackPost = (token, itemId, feedback) =>
  apiFetch(`/shared/approval/${token}/items/${itemId}/feedback`, {
    method: 'POST',
    body: JSON.stringify({ feedback }),
  });

/**
 * Revierte la aprobación de un post programado (Ruta Pública)
 * @param {string} token
 * @param {string} itemId
 */
export const sharedRevertPost = (token, itemId) =>
  apiFetch(`/shared/approval/${token}/items/${itemId}/revert`, { method: 'POST' });

/**
 * Obtiene el enlace de aprobación activo de un cliente (Ruta de Agencia - Autenticada)
 * @param {string} clientId
 */
export const getClientApprovalLink = clientId =>
  apiFetch(`/clients/${clientId}/approval-link`).then(resp => resp?.data ?? null);

/**
 * Genera o regenera un enlace de aprobación activo para el cliente (Ruta de Agencia - Autenticada)
 * @param {string} clientId
 */
export const createClientApprovalLink = clientId =>
  apiFetch(`/clients/${clientId}/approval-link`, { method: 'POST' }).then(
    resp => resp?.data ?? null
  );
