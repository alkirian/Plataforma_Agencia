import { supabase } from '../supabaseClient.js';
import { apiFetch } from './clients.js';

export const fetchDocuments = (clientId) => apiFetch(`/clients/${clientId}/documents`);

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
