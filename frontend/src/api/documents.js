// src/api/documents.js
import { apiFetch } from './apiFetch.js';
import { supabase } from '../supabaseClient.js';

export const getDocumentsForClient = (clientId) => {
  return apiFetch(`/clients/${clientId}/documents`);
};

export const uploadDocument = async (clientId, file) => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${clientId}/${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('documents')
    .upload(fileName, file);

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

export const deleteDocument = (documentId) => {
  return apiFetch(`/documents/${documentId}`, {
    method: 'DELETE',
  });
};
