// src/api/documents.js
import { apiFetch } from './apiFetch.js';
import { supabase } from '../supabaseClient.js';
import { smartToast } from '../utils/toastManager.js';
import { getMessage } from '../constants/notificationMessages.js';

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
 * @param {object} userInfo - Información del usuario que sube el archivo.
 * @returns {Promise<object>} El documento recién creado.
 */
export const uploadDocument = async (clientId, file, userInfo = null) => {
  // Mostrar notificación de carga
  const loadingToastId = smartToast.loading(
    getMessage('document.uploading', file.name),
    {
      category: 'document',
      priority: 'normal'
    }
  );

  try {
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

    const result = await apiFetch(`/clients/${clientId}/documents`, {
      method: 'POST',
      body: JSON.stringify(newDocument),
    });

    // Descartar loading toast
    smartToast.dismiss(loadingToastId);

    // Mostrar notificación de éxito con información del usuario
    const successMessage = userInfo?.displayName 
      ? getMessage('document.uploadSuccess', file.name, userInfo.displayName)
      : getMessage('document.uploadSuccessSimple', file.name);

    smartToast.success(successMessage, {
      category: 'document',
      priority: 'normal',
      title: 'Documento subido',
      actions: [
        {
          type: 'navigate',
          label: getMessage('actions.viewAllDocuments'),
          path: `/clients/${clientId}?tab=documents`,
          primary: true
        },
        {
          type: 'dismiss',
          label: getMessage('actions.dismiss')
        }
      ],
      context: {
        clientId,
        documentId: result.id,
        fileName: file.name,
        category: 'document'
      }
    });

    return result;
  } catch (error) {
    // Descartar loading toast
    smartToast.dismiss(loadingToastId);

    // Mostrar error
    smartToast.error(
      getMessage('document.uploadError', file.name),
      {
        category: 'document',
        priority: 'high',
        title: 'Error al subir documento',
        actions: [
          {
            type: 'custom',
            label: getMessage('actions.tryAgain'),
            handler: () => uploadDocument(clientId, file, userInfo),
            primary: true
          },
          {
            type: 'dismiss',
            label: getMessage('actions.dismiss')
          }
        ]
      }
    );

    throw error;
  }
};

/**
 * Sube múltiples documentos para un cliente.
 * @param {string} clientId - El UUID del cliente.
 * @param {File[]} files - Los archivos a subir.
 * @param {object} userInfo - Información del usuario que sube los archivos.
 * @returns {Promise<object[]>} Los documentos recién creados.
 */
export const uploadMultipleDocuments = async (clientId, files, userInfo = null) => {
  if (!files || files.length === 0) {
    throw new Error(getMessage('document.noFileSelected'));
  }

  const results = [];
  const errors = [];

  // Procesar archivos uno por uno para mejor control
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    try {
      const result = await uploadDocument(clientId, file, userInfo);
      results.push(result);
    } catch (error) {
      errors.push({ file: file.name, error });
    }
  }

  // Mostrar notificación de resumen
  if (results.length === files.length) {
    // Todos exitosos
    const message = userInfo?.displayName
      ? getMessage('document.multipleUploaded', files.length, userInfo.displayName)
      : getMessage('document.multipleUploadedSimple', files.length);

    smartToast.success(message, {
      category: 'document',
      priority: 'normal',
      title: 'Documentos subidos',
      actions: [
        {
          type: 'navigate',
          label: getMessage('actions.viewAllDocuments'),
          path: `/clients/${clientId}?tab=documents`,
          primary: true
        }
      ],
      context: {
        clientId,
        uploadCount: results.length,
        category: 'document'
      }
    });
  } else if (results.length > 0) {
    // Algunos exitosos, algunos fallidos
    smartToast.info(
      getMessage('document.someUploadsFailed', results.length, files.length),
      {
        category: 'document',
        priority: 'high',
        title: 'Subida parcial',
        actions: [
          {
            type: 'navigate',
            label: getMessage('actions.viewAllDocuments'),
            path: `/clients/${clientId}?tab=documents`,
            primary: true
          }
        ]
      }
    );
  }

  return { results, errors };
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
