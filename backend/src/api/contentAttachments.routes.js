/**
 * Content Attachments Routes
 * Define las rutas API para manejo de archivos adjuntos
 */

import express from 'express'
import multer from 'multer'
import { protect } from '../middleware/auth.middleware.js'
import {
  uploadAttachmentController,
  getAttachmentsController,
  deleteAttachmentController,
  getStorageStatsController,
} from '../controllers/contentAttachments.controller.js'

const router = express.Router()

// Configuración de Multer para manejo de archivos
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'video/mp4',
      'video/quicktime',
      'video/x-msvideo',
      'video/webm',
      'application/pdf',
    ]

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(
        new Error(
          `Tipo de archivo no permitido: ${file.mimetype}. Tipos permitidos: ${allowedTypes.join(', ')}`
        )
      )
    }
  },
})

// Todas las rutas requieren autenticación
router.use(protect)

/**
 * POST /api/v1/attachments/upload
 * Sube un archivo adjunto
 * Body (multipart/form-data):
 *   - file: archivo a subir
 *   - scheduleItemId: ID del item de calendario (opcional)
 *   - ideaId: ID de la idea (opcional)
 *   - clientId: ID del cliente (requerido)
 */
router.post('/upload', upload.single('file'), uploadAttachmentController)

/**
 * GET /api/v1/attachments/:targetId?type=schedule|idea
 * Obtiene adjuntos de un item de calendario o idea
 * Params:
 *   - targetId: ID del schedule_item o idea
 * Query:
 *   - type: 'schedule' o 'idea'
 */
router.get('/:targetId', getAttachmentsController)

/**
 * DELETE /api/v1/attachments/:attachmentId
 * Elimina un adjunto
 * Params:
 *   - attachmentId: ID del adjunto a eliminar
 */
router.delete('/:attachmentId', deleteAttachmentController)

/**
 * GET /api/v1/attachments/stats
 * Obtiene estadísticas de almacenamiento de la agencia
 */
router.get('/stats', getStorageStatsController)

// Manejo de errores de Multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        success: false,
        error: 'Archivo demasiado grande. Tamaño máximo: 50MB',
      })
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: 'Demasiados archivos. Máximo: 1 archivo por solicitud',
      })
    }
  }

  if (error) {
    return res.status(400).json({
      success: false,
      error: error.message,
    })
  }

  next()
})

export default router
