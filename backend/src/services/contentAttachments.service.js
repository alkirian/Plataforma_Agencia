/**
 * Content Attachments Service
 * Maneja la carga, descarga y eliminación de archivos multimedia
 * para publicaciones en calendario e ideas generadas
 */

import { supabaseAdmin } from '../config/supabaseClient.js';
import { logger } from '../utils/logger.js';
import crypto from 'crypto';
import sharp from 'sharp';

/**
 * Tipos de archivo permitidos
 */
const ALLOWED_MIME_TYPES = {
  images: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
  ],
  videos: ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'],
  documents: ['application/pdf'],
};

const ALL_ALLOWED_TYPES = [
  ...ALLOWED_MIME_TYPES.images,
  ...ALLOWED_MIME_TYPES.videos,
  ...ALLOWED_MIME_TYPES.documents,
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

/**
 * Valida si un tipo de archivo está permitido
 */
export const isValidFileType = (mimeType) => {
  return ALL_ALLOWED_TYPES.includes(mimeType);
};

/**
 * Genera un path de almacenamiento único
 */
const generateStoragePath = (agencyId, clientId, fileName) => {
  const timestamp = Date.now();
  const randomId = crypto.randomBytes(8).toString('hex');
  const ext = fileName.split('.').pop();
  const sanitizedName = fileName
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .substring(0, 50);

  return `${agencyId}/${clientId}/${timestamp}-${randomId}-${sanitizedName}`;
};

/**
 * Genera thumbnail para imágenes
 */
const generateThumbnail = async (fileBuffer, mimeType) => {
  if (!ALLOWED_MIME_TYPES.images.includes(mimeType)) {
    return null;
  }

  try {
    const thumbnail = await sharp(fileBuffer)
      .resize(400, 400, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: 80 })
      .toBuffer();

    return thumbnail;
  } catch (error) {
    logger.warn('Failed to generate thumbnail', { error: error.message });
    return null;
  }
};

/**
 * Obtiene dimensiones de imagen
 */
const getImageDimensions = async (fileBuffer, mimeType) => {
  if (!ALLOWED_MIME_TYPES.images.includes(mimeType)) {
    return { width: null, height: null };
  }

  try {
    const metadata = await sharp(fileBuffer).metadata();
    return {
      width: metadata.width,
      height: metadata.height,
    };
  } catch (error) {
    logger.warn('Failed to get image dimensions', { error: error.message });
    return { width: null, height: null };
  }
};

/**
 * Sube un archivo adjunto
 * @param {Object} params - Parámetros de carga
 * @param {Buffer} params.fileBuffer - Buffer del archivo
 * @param {string} params.fileName - Nombre del archivo
 * @param {string} params.mimeType - Tipo MIME del archivo
 * @param {number} params.fileSize - Tamaño del archivo en bytes
 * @param {string} params.scheduleItemId - ID del item de calendario (opcional)
 * @param {string} params.ideaId - ID de la idea (opcional)
 * @param {string} params.agencyId - ID de la agencia
 * @param {string} params.clientId - ID del cliente
 * @param {string} params.uploadedBy - ID del usuario que sube
 * @returns {Promise<Object>} Attachment creado
 */
export const uploadAttachment = async ({
  fileBuffer,
  fileName,
  mimeType,
  fileSize,
  scheduleItemId,
  ideaId,
  agencyId,
  clientId,
  uploadedBy,
}) => {
  try {
    // Validaciones
    if (!isValidFileType(mimeType)) {
      throw new Error(
        `Tipo de archivo no permitido: ${mimeType}. Tipos permitidos: ${ALL_ALLOWED_TYPES.join(', ')}`
      );
    }

    if (fileSize > MAX_FILE_SIZE) {
      throw new Error(
        `Archivo demasiado grande. Tamaño máximo: ${MAX_FILE_SIZE / 1024 / 1024}MB`
      );
    }

    if (!scheduleItemId && !ideaId) {
      throw new Error('Debe proporcionar scheduleItemId o ideaId');
    }

    // Generar path de almacenamiento
    const storagePath = generateStoragePath(agencyId, clientId, fileName);

    // Subir archivo principal a Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('content-media')
      .upload(storagePath, fileBuffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Error al subir archivo: ${uploadError.message}`);
    }

    logger.info('File uploaded to storage', { storagePath });

    // Generar thumbnail si es imagen
    let thumbnailUrl = null;
    if (ALLOWED_MIME_TYPES.images.includes(mimeType)) {
      const thumbnail = await generateThumbnail(fileBuffer, mimeType);
      if (thumbnail) {
        const thumbnailPath = `${storagePath}-thumb.jpg`;
        const { error: thumbError } = await supabaseAdmin.storage
          .from('content-media')
          .upload(thumbnailPath, thumbnail, {
            contentType: 'image/jpeg',
            upsert: false,
          });

        if (!thumbError) {
          const { data: thumbUrlData } = supabaseAdmin.storage
            .from('content-media')
            .getPublicUrl(thumbnailPath);
          thumbnailUrl = thumbUrlData.publicUrl;
        }
      }
    }

    // Obtener dimensiones para imágenes
    const { width, height } = await getImageDimensions(fileBuffer, mimeType);

    // Crear registro en base de datos
    const { data: attachment, error: dbError } = await supabaseAdmin
      .from('content_attachments')
      .insert({
        schedule_item_id: scheduleItemId || null,
        idea_id: ideaId || null,
        file_name: fileName,
        storage_path: storagePath,
        file_type: mimeType,
        file_size: fileSize,
        thumbnail_url: thumbnailUrl,
        width,
        height,
        agency_id: agencyId,
        client_id: clientId,
        uploaded_by: uploadedBy,
      })
      .select()
      .single();

    if (dbError) {
      // Limpiar archivo del storage si falla la BD
      await supabaseAdmin.storage.from('content-media').remove([storagePath]);
      throw new Error(`Error al crear registro: ${dbError.message}`);
    }

    // Obtener URL pública del archivo
    const { data: publicUrlData } = supabaseAdmin.storage
      .from('content-media')
      .getPublicUrl(storagePath);

    logger.info('Attachment created successfully', { attachmentId: attachment.id });

    return {
      ...attachment,
      public_url: publicUrlData.publicUrl,
    };
  } catch (error) {
    logger.error('Error in uploadAttachment', error);
    throw error;
  }
};

/**
 * Obtiene adjuntos de un item de calendario o idea
 * @param {Object} params - Parámetros de búsqueda
 * @param {string} params.scheduleItemId - ID del item de calendario (opcional)
 * @param {string} params.ideaId - ID de la idea (opcional)
 * @param {string} params.agencyId - ID de la agencia
 * @returns {Promise<Array>} Lista de attachments
 */
export const getAttachments = async ({ scheduleItemId, ideaId, agencyId }) => {
  try {
    let query = supabaseAdmin
      .from('content_attachments')
      .select('*')
      .eq('agency_id', agencyId)
      .order('created_at', { ascending: false });

    if (scheduleItemId) {
      query = query.eq('schedule_item_id', scheduleItemId);
    } else if (ideaId) {
      query = query.eq('idea_id', ideaId);
    } else {
      throw new Error('Debe proporcionar scheduleItemId o ideaId');
    }

    const { data: attachments, error } = await query;

    if (error) {
      throw new Error(`Error al obtener adjuntos: ${error.message}`);
    }

    // Agregar URLs públicas
    const attachmentsWithUrls = attachments.map((attachment) => {
      const { data: publicUrlData } = supabaseAdmin.storage
        .from('content-media')
        .getPublicUrl(attachment.storage_path);

      return {
        ...attachment,
        public_url: publicUrlData.publicUrl,
      };
    });

    return attachmentsWithUrls;
  } catch (error) {
    logger.error('Error in getAttachments', error);
    throw error;
  }
};

/**
 * Elimina un adjunto
 * @param {string} attachmentId - ID del adjunto
 * @param {string} agencyId - ID de la agencia
 * @returns {Promise<void>}
 */
export const deleteAttachment = async (attachmentId, agencyId) => {
  try {
    // Obtener información del adjunto antes de eliminar
    const { data: attachment, error: fetchError } = await supabaseAdmin
      .from('content_attachments')
      .select('storage_path, thumbnail_url')
      .eq('id', attachmentId)
      .eq('agency_id', agencyId)
      .single();

    if (fetchError) {
      throw new Error(`Adjunto no encontrado: ${fetchError.message}`);
    }

    // Eliminar registro (el trigger se encargará de limpiar el storage)
    const { error: deleteError } = await supabaseAdmin
      .from('content_attachments')
      .delete()
      .eq('id', attachmentId)
      .eq('agency_id', agencyId);

    if (deleteError) {
      throw new Error(`Error al eliminar adjunto: ${deleteError.message}`);
    }

    logger.info('Attachment deleted successfully', { attachmentId });
  } catch (error) {
    logger.error('Error in deleteAttachment', error);
    throw error;
  }
};

/**
 * Obtiene estadísticas de almacenamiento de una agencia
 * @param {string} agencyId - ID de la agencia
 * @returns {Promise<Object>} Estadísticas de almacenamiento
 */
export const getStorageStats = async (agencyId) => {
  try {
    const { data: attachments, error } = await supabaseAdmin
      .from('content_attachments')
      .select('file_size, file_type')
      .eq('agency_id', agencyId);

    if (error) {
      throw new Error(`Error al obtener estadísticas: ${error.message}`);
    }

    const totalSize = attachments.reduce(
      (sum, att) => sum + (att.file_size || 0),
      0
    );
    const totalCount = attachments.length;

    const byType = {
      images: 0,
      videos: 0,
      documents: 0,
      other: 0,
    };

    attachments.forEach((att) => {
      if (ALLOWED_MIME_TYPES.images.includes(att.file_type)) {
        byType.images++;
      } else if (ALLOWED_MIME_TYPES.videos.includes(att.file_type)) {
        byType.videos++;
      } else if (ALLOWED_MIME_TYPES.documents.includes(att.file_type)) {
        byType.documents++;
      } else {
        byType.other++;
      }
    });

    return {
      totalSize,
      totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
      totalCount,
      byType,
      maxSize: MAX_FILE_SIZE,
      maxSizeMB: MAX_FILE_SIZE / 1024 / 1024,
    };
  } catch (error) {
    logger.error('Error in getStorageStats', error);
    throw error;
  }
};
