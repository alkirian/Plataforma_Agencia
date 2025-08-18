// src/api/documents.js
import { apiFetch } from './apiFetch.js';
import { supabase } from '../supabaseClient.js';

/**
 * Obtiene los documentos de un cliente específico.
 * @param {string} clientId - El UUID del cliente.
 * @returns {Promise<Array>} Lista de documentos del cliente.
 */
export const getDocumentsForClient = clientId => {
  return apiFetch(`/clients/${clientId}/documents`);
};

/**
 * Sube un documento para un cliente.
 * @param {string} clientId - El UUID del cliente.
 * @param {File} file - El archivo a subir.
 * @returns {Promise<object>} El documento recién creado.
 */
export const uploadDocument = async (clientId, file) => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${clientId}/${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage.from('documents').upload(fileName, file);

  if (uploadError) throw uploadError;

  const newDocument = {
    file_name: file.name,
    storage_path: fileName,
    file_type: file.type,
    file_size: file.size,
  };

  return apiFetch(`/clients/${clientId}/documents`, {
    method: 'POST',
    body: JSON.stringify(newDocument),
  });
};

/**
 * Elimina un documento de un cliente.
 * @param {string} clientId - El UUID del cliente.
 * @param {string} documentId - El ID del documento a eliminar.
 * @returns {Promise<object>} Confirmación de eliminación.
 */
export const deleteDocument = (clientId, documentId) => {
  return apiFetch(`/clients/${clientId}/documents/${documentId}`, {
    method: 'DELETE',
  });
};

/**
 * Descarga un documento desde Supabase Storage.
 * @param {object} docData - Los datos del documento con storage_path y file_name.
 * @returns {Promise<object>} Confirmación de descarga.
 */
export const downloadDocument = async docData => {
  const { data, error } = await supabase.storage.from('documents').download(docData.storage_path);

  if (error) throw error;

  const url = URL.createObjectURL(data);
  const a = document.createElement('a');
  a.href = url;
  a.download = docData.file_name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  return { success: true };
};
