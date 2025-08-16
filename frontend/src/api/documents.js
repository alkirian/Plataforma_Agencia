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

export const deleteDocument = (clientId, documentId) => {
  return apiFetch(`/clients/${clientId}/documents/${documentId}`, {
    method: 'DELETE',
  });
};

export const downloadDocument = async (docData) => {
  try {
    // Obtener la URL de descarga desde Supabase Storage
    const { data, error } = await supabase.storage
      .from('documents')
      .download(docData.storage_path);

    if (error) throw error;

    // Crear un blob URL y descargar el archivo
    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = docData.file_name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return { success: true };
  } catch (error) {
    console.error('Error downloading document:', error);
    throw error;
  }
};
