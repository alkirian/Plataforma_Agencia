// src/api/documents.js
import { apiFetch } from './apiFetch.js'
import { supabase } from '../supabaseClient.js'

/**
 * Obtiene los documentos de un cliente específico.
 * @param {string} clientId - El UUID del cliente.
 * @returns {Promise<Array>} Lista de documentos del cliente.
 */
export const getDocumentsForClient = clientId => {
  return apiFetch(`/clients/${clientId}/documents`)
}

/**
 * Sube un documento para un cliente.
 * @param {string} clientId - El UUID del cliente.
 * @param {File} file - El archivo a subir.
 * @param {object} options - Opciones de upload, incluyendo signal para AbortController.
 * @returns {Promise<object>} El documento recién creado.
 */
export const uploadDocument = async (clientId, file, options = {}) => {
  const { signal } = options

  // Verificar si fue cancelado antes de comenzar
  if (signal?.aborted) {
    throw new Error('Upload cancelled')
  }

  const fileExt = file.name.split('.').pop()
  const fileName = `${clientId}/${Date.now()}.${fileExt}`

  // Upload to Supabase storage with abort signal support
  const uploadPromise = supabase.storage.from('documents').upload(fileName, file)

  let uploadResult
  if (signal) {
    // Crear una promesa que se resuelve o rechaza según el AbortController
    uploadResult = await Promise.race([
      uploadPromise,
      new Promise((_, reject) => {
        signal.addEventListener('abort', () => {
          reject(new Error('Upload cancelled'))
        })
      }),
    ])
  } else {
    uploadResult = await uploadPromise
  }

  const { error: uploadError } = uploadResult
  if (uploadError) throw uploadError

  // Verificar si fue cancelado antes de crear el registro
  if (signal?.aborted) {
    throw new Error('Upload cancelled')
  }

  const newDocument = {
    file_name: file.name,
    storage_path: fileName,
    file_type: file.type,
    file_size: file.size,
  }

  return apiFetch(`/clients/${clientId}/documents`, {
    method: 'POST',
    body: JSON.stringify(newDocument),
    signal, // Pasar signal al fetch
  })
}

/**
 * Elimina un documento de un cliente.
 * @param {string} clientId - El UUID del cliente.
 * @param {string} documentId - El ID del documento a eliminar.
 * @returns {Promise<object>} Confirmación de eliminación.
 */
export const deleteDocument = (clientId, documentId) => {
  return apiFetch(`/clients/${clientId}/documents/${documentId}`, {
    method: 'DELETE',
  })
}

/**
 * Descarga un documento desde Supabase Storage.
 * @param {object} docData - Los datos del documento con storage_path y file_name.
 * @returns {Promise<object>} Confirmación de descarga.
 */
export const downloadDocument = async docData => {
  const { data, error } = await supabase.storage.from('documents').download(docData.storage_path)

  if (error) throw error

  const url = URL.createObjectURL(data)
  const a = document.createElement('a')
  a.href = url
  a.download = docData.file_name
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)

  return { success: true }
}
