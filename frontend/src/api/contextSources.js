// src/api/contextSources.js
import { apiFetch } from './apiFetch.js';
import { supabase } from '../supabaseClient.js';

/**
 * Obtiene todas las fuentes de contexto de un cliente específico.
 * @param {string} clientId - El UUID del cliente.
 * @returns {Promise<Array>} Lista de fuentes de contexto del cliente.
 */
export const getContextSources = clientId => {
  return apiFetch(`/context-sources/${clientId}`);
};

/**
 * Obtiene estadísticas de las fuentes de contexto de un cliente.
 * @param {string} clientId - El UUID del cliente.
 * @returns {Promise<object>} Estadísticas de las fuentes.
 */
export const getContextSourcesStats = clientId => {
  return apiFetch(`/context-sources/${clientId}/stats`);
};

/**
 * Busca dentro de las fuentes de contexto de un cliente.
 * @param {string} clientId - El UUID del cliente.
 * @param {string} query - La consulta de búsqueda.
 * @returns {Promise<Array>} Resultados de búsqueda.
 */
export const searchContextSources = (clientId, query) => {
  return apiFetch(`/context-sources/${clientId}/search`, {
    method: 'POST',
    body: JSON.stringify({ query }),
  });
};

/**
 * Sube un documento como fuente de contexto.
 * @param {string} clientId - El UUID del cliente.
 * @param {File} file - El archivo a subir.
 * @param {object} metadata - Metadatos adicionales.
 * @returns {Promise<object>} La fuente de contexto recién creada.
 */
export const createDocumentSource = async (clientId, file, metadata = {}) => {
  const fileExt = file.name.split('.').pop();
  const fileName = `context-sources/${clientId}/${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage.from('documents').upload(fileName, file);

  if (uploadError) throw uploadError;

  const sourceData = {
    title: metadata.title || file.name,
    description: metadata.description || '',
    tags: metadata.tags || [],
    file_name: file.name,
    storage_path: fileName,
    file_type: file.type,
    file_size: file.size,
  };

  return apiFetch(`/context-sources/${clientId}/document`, {
    method: 'POST',
    body: JSON.stringify(sourceData),
  });
};

/**
 * Crea una fuente de contexto desde una URL.
 * @param {string} clientId - El UUID del cliente.
 * @param {object} urlData - Datos de la URL.
 * @returns {Promise<object>} La fuente de contexto recién creada.
 */
export const createUrlSource = (clientId, urlData) => {
  return apiFetch(`/context-sources/${clientId}/url`, {
    method: 'POST',
    body: JSON.stringify(urlData),
  });
};

/**
 * Crea una fuente de contexto manual.
 * @param {string} clientId - El UUID del cliente.
 * @param {object} manualData - Datos del contenido manual.
 * @returns {Promise<object>} La fuente de contexto recién creada.
 */
export const createManualSource = (clientId, manualData) => {
  return apiFetch(`/context-sources/${clientId}/manual`, {
    method: 'POST',
    body: JSON.stringify(manualData),
  });
};

/**
 * Crea una nota como fuente de contexto.
 * @param {string} clientId - El UUID del cliente.
 * @param {object} noteData - Datos de la nota.
 * @returns {Promise<object>} La fuente de contexto recién creada.
 */
export const createNoteSource = (clientId, noteData) => {
  return apiFetch(`/context-sources/${clientId}/note`, {
    method: 'POST',
    body: JSON.stringify(noteData),
  });
};

/**
 * Actualiza una fuente de contexto existente.
 * @param {string} clientId - El UUID del cliente.
 * @param {string} sourceId - El ID de la fuente a actualizar.
 * @param {object} updateData - Datos a actualizar.
 * @returns {Promise<object>} La fuente actualizada.
 */
export const updateContextSource = (clientId, sourceId, updateData) => {
  return apiFetch(`/context-sources/${clientId}/${sourceId}`, {
    method: 'PUT',
    body: JSON.stringify(updateData),
  });
};

/**
 * Elimina una fuente de contexto.
 * @param {string} clientId - El UUID del cliente.
 * @param {string} sourceId - El ID de la fuente a eliminar.
 * @returns {Promise<object>} Confirmación de eliminación.
 */
export const deleteContextSource = (clientId, sourceId) => {
  return apiFetch(`/context-sources/${clientId}/${sourceId}`, {
    method: 'DELETE',
  });
};

/**
 * Descarga un archivo de fuente de contexto desde Supabase Storage.
 * @param {object} source - Los datos de la fuente con storage_path y file_name.
 * @returns {Promise<object>} Confirmación de descarga.
 */
export const downloadContextSource = async source => {
  if (!source.storage_path) {
    throw new Error('Esta fuente no tiene archivo para descargar');
  }

  const { data, error } = await supabase.storage.from('documents').download(source.storage_path);

  if (error) throw error;

  const url = URL.createObjectURL(data);
  const a = document.createElement('a');
  a.href = url;
  a.download = source.file_name || source.title;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  return { success: true };
};

// Tipos de fuentes disponibles
export const SOURCE_TYPES = {
  DOCUMENT: 'document',
  URL: 'url', 
  MANUAL: 'manual',
  NOTE: 'note',
};

// Estados de procesamiento
export const PROCESSING_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing', 
  READY: 'ready',
  ERROR: 'error',
};

// Configuración de colores por tipo
export const SOURCE_TYPE_CONFIG = {
  [SOURCE_TYPES.DOCUMENT]: {
    name: 'Documentos',
    icon: '📄',
    color: 'blue',
    description: 'Sube archivos PDF, imágenes y documentos',
  },
  [SOURCE_TYPES.URL]: {
    name: 'URLs',
    icon: '🌐', 
    color: 'green',
    description: 'Extrae contenido de páginas web',
  },
  [SOURCE_TYPES.MANUAL]: {
    name: 'Manual',
    icon: '✍️',
    color: 'orange',
    description: 'Ingresa texto directamente',
  },
  [SOURCE_TYPES.NOTE]: {
    name: 'Notas',
    icon: '📝',
    color: 'purple',
    description: 'Información contextual adicional',
  },
};