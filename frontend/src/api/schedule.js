// src/api/schedule.js
import { apiFetch } from './apiFetch.js';
import { supabase } from '../supabaseClient.js';

// Normaliza/limpia el payload según el esquema del backend
const normalizeSchedulePayload = (raw = {}) => {
  const out = {};

  // Título
  if (typeof raw.title === 'string') {
    const t = raw.title.trim();
    if (t) out.title = t;
  }

  // Descripción (opcional)
  if (typeof raw.description === 'string') {
    out.description = raw.description.trim() || null;
  }

  // Copy (opcional)
  if (typeof raw.copy === 'string') {
    out.copy = raw.copy.trim() || null;
  }

  // Idea creativa (opcional)
  if (typeof raw.creative_idea === 'string') {
    out.creative_idea = raw.creative_idea.trim() || null;
  }

  // Objetivo (opcional)
  if (typeof raw.goal === 'string') {
    out.goal = raw.goal.trim() || null;
  }

  // Formato (opcional)
  if (typeof raw.format === 'string') {
    out.format = raw.format.trim() || null;
  }

  // Plataformas (opcional)
  if (typeof raw.platforms === 'string') {
    out.platforms = raw.platforms.trim() || null;
  }

  // Fecha/hora ISO 8601
  if (raw.scheduled_at instanceof Date) {
    out.scheduled_at = raw.scheduled_at.toISOString();
  } else if (typeof raw.scheduled_at === 'string') {
    // Aceptar strings ya ISO o convertibles a Date
    const dt = new Date(raw.scheduled_at);
    out.scheduled_at = isNaN(dt.getTime()) ? raw.scheduled_at : dt.toISOString();
  }

  // Estado: aceptar valores conocidos (en español, también variantes en minúsculas)
  if (typeof raw.status === 'string') {
    const s = raw.status.trim();
    // Mantener en español/minúsculas si viene así; el backend normaliza a mayúsculas donde aplica
    const allowed = new Set([
      'pendiente',
      'en-diseño',
      'en-progreso',
      'aprobado',
      'publicado',
      'cancelado',
      'Pendiente',
      'En Diseño',
      'En Progreso',
      'Aprobado',
      'Publicado',
      'Cancelado',
    ]);
    out.status = allowed.has(s) ? s : 'pendiente';
  }

  // Prioridad: mapear a valores permitidos por el schema
  if (typeof raw.priority === 'string') {
    const p = raw.priority.trim();
    const map = {
      // inglés a minúsculas
      LOW: 'low',
      Low: 'low',
      low: 'low',
      MEDIUM: 'medium',
      Medium: 'medium',
      medium: 'medium',
      HIGH: 'high',
      High: 'high',
      high: 'high',
      URGENT: 'urgente',
      Urgent: 'urgente',
      urgent: 'urgente',
      // español
      baja: 'baja',
      Baja: 'Baja',
      media: 'media',
      Media: 'Media',
      alta: 'alta',
      Alta: 'Alta',
      urgente: 'urgente',
      Urgente: 'Urgente',
    };
    out.priority =
      map[p] ||
      ([
        'low',
        'medium',
        'high',
        'baja',
        'media',
        'alta',
        'urgente',
        'Baja',
        'Media',
        'Alta',
        'Urgente',
      ].includes(p)
        ? p
        : 'medium');
  }

  // Canal (opcional, máx 50)
  if (typeof raw.channel === 'string') {
    out.channel = raw.channel.slice(0, 50);
  }

  // Ignorar otras claves no soportadas por el schema
  return out;
};

// Normaliza la respuesta del backend a un array consistente
const toArray = resp => {
  if (Array.isArray(resp)) return resp;
  if (Array.isArray(resp?.data)) return resp.data;
  if (Array.isArray(resp?.data?.items)) return resp.data.items;
  if (Array.isArray(resp?.items)) return resp.items;
  if (Array.isArray(resp?.records)) return resp.records;
  return [];
};

/**
 * Obtiene los ítems del cronograma para un cliente específico.
 * @param {string} clientId - El UUID del cliente.
 * @returns {Promise<Array>} La lista de ítems del cronograma.
 */
export const getSchedule = async clientId => {
  const resp = await apiFetch(`/clients/${clientId}/schedule`);
  return toArray(resp);
};

/**
 * Crea un nuevo ítem en el cronograma.
 * @param {string} clientId - El UUID del cliente.
 * @param {object} itemData - Los datos del nuevo ítem.
 * @returns {Promise<object>} El ítem recién creado.
 */
export const createScheduleItem = async (clientId, itemData) => {
  const payload = normalizeSchedulePayload(itemData);
  const resp = await apiFetch(`/clients/${clientId}/schedule`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return resp?.data ?? resp;
};

/**
 * Obtiene un ítem específico del cronograma.
 * @param {string} clientId - El UUID del cliente.
 * @param {string} itemId - El ID del ítem del cronograma.
 * @returns {Promise<object>} Los datos del ítem.
 */
export const getScheduleItem = async (clientId, itemId) => {
  const resp = await apiFetch(`/clients/${clientId}/schedule/${itemId}`);
  return resp?.data ?? resp;
};

/**
 * Actualiza un ítem del cronograma.
 * @param {string} clientId - El UUID del cliente.
 * @param {string} itemId - El ID del ítem del cronograma.
 * @param {object} updateData - Los datos a actualizar.
 * @returns {Promise<object>} El ítem actualizado.
 */
export const updateScheduleItem = async (clientId, itemId, updateData) => {
  const payload = normalizeSchedulePayload(updateData);
  const resp = await apiFetch(`/clients/${clientId}/schedule/${itemId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return resp?.data ?? resp;
};

/**
 * Elimina un ítem del cronograma.
 * @param {string} clientId - El UUID del cliente.
 * @param {string} itemId - El ID del ítem del cronograma.
 * @returns {Promise<object>} Confirmación de eliminación.
 */
export const deleteScheduleItem = async (clientId, itemId) => {
  const resp = await apiFetch(`/clients/${clientId}/schedule/${itemId}`, {
    method: 'DELETE',
  });
  return resp?.data ?? resp ?? { success: true };
};

export const getScheduleItemAssets = async (clientId, itemId) => {
  const resp = await apiFetch(`/clients/${clientId}/schedule/${itemId}/assets`);
  return resp?.data ?? [];
};

export const getScheduleItemAssetsWithPreview = async (clientId, itemId) => {
  const assets = await getScheduleItemAssets(clientId, itemId);
  const enriched = await Promise.all(
    assets.map(async asset => {
      const mime = asset.mime_type || '';
      const isVisual = mime.startsWith('image/') || mime.startsWith('video/');
      if (!isVisual || !asset.storage_path) {
        return { ...asset, preview_url: null };
      }

      const { data, error } = await supabase.storage
        .from('content-assets')
        .createSignedUrl(asset.storage_path, 60 * 30);

      if (error || !data?.signedUrl) {
        return { ...asset, preview_url: null };
      }

      return { ...asset, preview_url: data.signedUrl };
    })
  );

  return enriched;
};

export const createScheduleItemAsset = async (clientId, itemId, payload) => {
  const resp = await apiFetch(`/clients/${clientId}/schedule/${itemId}/assets`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return resp?.data ?? resp;
};

export const uploadScheduleAsset = async (clientId, itemId, file, options = {}) => {
  const fileExt = file.name.includes('.') ? file.name.split('.').pop() : 'bin';
  const safeName = file.name.replace(/\s+/g, '-');
  const storagePath = `${clientId}/${itemId}/${Date.now()}-${safeName}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('content-assets')
    .upload(storagePath, file);
  if (uploadError) throw uploadError;

  return createScheduleItemAsset(clientId, itemId, {
    file_name: file.name,
    storage_path: storagePath,
    mime_type: file.type || null,
    size_bytes: file.size || null,
    asset_role: options.asset_role || 'final',
    sort_order: options.sort_order || 0,
  });
};

/**
 * Genera una imagen con IA a través del backend y la guarda como asset
 * @param {string} clientId
 * @param {string} itemId
 * @param {object} params - { prompt, aspectRatio }
 * @returns {Promise<object>} El asset creado enriquecido con preview_url
 */
export const generateImageForEvent = async (clientId, itemId, { prompt, aspectRatio }) => {
  const resp = await apiFetch(`/clients/${clientId}/schedule/${itemId}/generate-image`, {
    method: 'POST',
    body: JSON.stringify({ prompt, aspectRatio }),
  });

  const asset = resp?.data ?? resp;
  if (asset && asset.storage_path) {
    const { data, error } = await supabase.storage
      .from('content-assets')
      .createSignedUrl(asset.storage_path, 60 * 30);

    if (!error && data?.signedUrl) {
      asset.preview_url = data.signedUrl;
    }
  }

  return asset;
};

/**
 * Elimina todos los eventos del cronograma para un mes y año específicos.
 * @param {string} clientId
 * @param {number} year
 * @param {number} month (0-indexed, 0 = Enero, 11 = Diciembre)
 */
export const clearSchedule = async (clientId, year, month) => {
  const resp = await apiFetch(`/clients/${clientId}/schedule?year=${year}&month=${month}`, {
    method: 'DELETE',
  });
  return resp?.data ?? resp;
};

/**
 * Elimina TODOS los eventos del cronograma del cliente (sin filtro de mes).
 * @param {string} clientId
 */
export const clearAllSchedule = async clientId => {
  const resp = await apiFetch(`/clients/${clientId}/schedule`, {
    method: 'DELETE',
  });
  return resp?.data ?? resp;
};

/**
 * Obtiene todos los assets del cronograma para un cliente.
 */
export const getClientScheduleAssets = async clientId => {
  const resp = await apiFetch(`/clients/${clientId}/schedule/assets`);
  return resp?.data ?? [];
};

/**
 * Obtiene todos los assets del cronograma con sus URLs firmadas para vista previa.
 */
export const getClientScheduleAssetsWithPreview = async clientId => {
  const assets = await getClientScheduleAssets(clientId);
  const enriched = await Promise.all(
    assets.map(async asset => {
      const mime = asset.mime_type || '';
      const isVisual = mime.startsWith('image/') || mime.startsWith('video/');
      if (!isVisual || !asset.storage_path) {
        return { ...asset, preview_url: null };
      }

      const { data, error } = await supabase.storage
        .from('content-assets')
        .createSignedUrl(asset.storage_path, 60 * 30);

      if (error || !data?.signedUrl) {
        return { ...asset, preview_url: null };
      }

      return { ...asset, preview_url: data.signedUrl };
    })
  );

  return enriched;
};

/**
 * Elimina un asset individual del cronograma.
 */
export const deleteScheduleItemAsset = async (clientId, assetId) => {
  const resp = await apiFetch(`/clients/${clientId}/schedule/assets/${assetId}`, {
    method: 'DELETE',
  });
  return resp?.data ?? resp ?? { success: true };
};

/**
 * Publica una tarea del cronograma directamente en redes de Meta (Facebook/Instagram).
 */
export const publishScheduleItem = async (clientId, itemId) => {
  const resp = await apiFetch(`/clients/${clientId}/schedule/${itemId}/publish`, {
    method: 'POST',
  });
  return resp?.data ?? resp;
};
