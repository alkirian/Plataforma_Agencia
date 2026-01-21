/**
 * Content Attachments Controller
 * Maneja las solicitudes HTTP para archivos adjuntos
 */

import {
  uploadAttachment,
  getAttachments,
  deleteAttachment,
  getStorageStats,
} from '../services/contentAttachments.service.js'
import { asyncHandler, HttpError } from '../utils/http.js'
import { logger } from '../utils/logger.js'

/**
 * Obtiene el agency_id del usuario autenticado
 */
const getUserAgencyId = async (userId) => {
  const { supabase } = await import('../config/supabaseClient.js')
  const { data, error } = await supabase
    .from('profiles')
    .select('agency_id')
    .eq('id', userId)
    .single()

  if (error || !data?.agency_id) {
    throw new HttpError(403, 'User is not associated with any agency')
  }

  return data.agency_id
}

/**
 * POST /api/v1/attachments/upload
 * Sube un archivo adjunto
 */
export const uploadAttachmentController = asyncHandler(async (req, res) => {
  const { scheduleItemId, ideaId, clientId } = req.body
  const file = req.file

  if (!file) {
    throw new HttpError(400, 'No file provided')
  }

  if (!scheduleItemId && !ideaId) {
    throw new HttpError(400, 'Must provide scheduleItemId or ideaId')
  }

  if (!clientId) {
    throw new HttpError(400, 'clientId is required')
  }

  const userId = req.user?.id
  if (!userId) {
    throw new HttpError(401, 'User not authenticated')
  }

  const agencyId = await getUserAgencyId(userId)

  try {
    const attachment = await uploadAttachment({
      fileBuffer: file.buffer,
      fileName: file.originalname,
      mimeType: file.mimetype,
      fileSize: file.size,
      scheduleItemId,
      ideaId,
      agencyId,
      clientId,
      uploadedBy: userId,
    })

    logger.info('Attachment uploaded successfully', {
      attachmentId: attachment.id,
      userId,
      agencyId,
    })

    res.status(201).json({
      success: true,
      data: attachment,
    })
  } catch (error) {
    logger.error('Error uploading attachment', error, {
      userId,
      fileName: file.originalname,
    })
    throw error
  }
})

/**
 * GET /api/v1/attachments/:targetId
 * Obtiene adjuntos de un item de calendario o idea
 * Query params: type (schedule|idea)
 */
export const getAttachmentsController = asyncHandler(async (req, res) => {
  const { targetId } = req.params
  const { type } = req.query

  if (!type || !['schedule', 'idea'].includes(type)) {
    throw new HttpError(400, 'type query param must be "schedule" or "idea"')
  }

  const userId = req.user?.id
  if (!userId) {
    throw new HttpError(401, 'User not authenticated')
  }

  const agencyId = await getUserAgencyId(userId)

  try {
    const attachments = await getAttachments({
      scheduleItemId: type === 'schedule' ? targetId : null,
      ideaId: type === 'idea' ? targetId : null,
      agencyId,
    })

    res.json({
      success: true,
      data: attachments,
    })
  } catch (error) {
    logger.error('Error getting attachments', error, { targetId, type })
    throw error
  }
})

/**
 * DELETE /api/v1/attachments/:attachmentId
 * Elimina un adjunto
 */
export const deleteAttachmentController = asyncHandler(async (req, res) => {
  const { attachmentId } = req.params

  const userId = req.user?.id
  if (!userId) {
    throw new HttpError(401, 'User not authenticated')
  }

  const agencyId = await getUserAgencyId(userId)

  try {
    await deleteAttachment(attachmentId, agencyId)

    logger.info('Attachment deleted successfully', {
      attachmentId,
      userId,
      agencyId,
    })

    res.json({
      success: true,
      message: 'Attachment deleted successfully',
    })
  } catch (error) {
    logger.error('Error deleting attachment', error, { attachmentId })
    throw error
  }
})

/**
 * GET /api/v1/attachments/stats
 * Obtiene estadísticas de almacenamiento
 */
export const getStorageStatsController = asyncHandler(async (req, res) => {
  const userId = req.user?.id
  if (!userId) {
    throw new HttpError(401, 'User not authenticated')
  }

  const agencyId = await getUserAgencyId(userId)

  try {
    const stats = await getStorageStats(agencyId)

    res.json({
      success: true,
      data: stats,
    })
  } catch (error) {
    logger.error('Error getting storage stats', error)
    throw error
  }
})
