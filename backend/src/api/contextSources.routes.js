// src/api/contextSources.routes.js

import { Router } from 'express';
import { protect } from '../middleware/auth.middleware.js';
import {
  handleProcessDocumentSource,
  handleProcessUrlSource,
  handleProcessManualSource,
  handleProcessNoteSource,
  handleGetContextSources,
  handleUpdateContextSource,
  handleDeleteContextSource,
  handleSearchContextChunks,
  handleGetContextSourceStats
} from '../controllers/contextSources.controller.js';
import { 
  validate,
  validateMultiple,
  sanitizeInput,
  documentSourceSchema,
  urlSourceSchema,
  manualSourceSchema,
  noteSourceSchema,
  contextSearchSchema,
  clientIdParamSchema,
  uuidParamSchema
} from '../schemas/validation.js';

const router = Router();

// Aplicar middleware de autenticación y sanitización a todas las rutas
router.use(protect);
router.use(sanitizeInput());

// --- Rutas de Procesamiento de Fuentes ---

/**
 * @route   POST /api/context-sources/:clientId/document
 * @desc    Procesar un documento como fuente de contexto
 * @access  Private (requiere autenticación)
 * @body    { file_name, storage_path, file_type, file_size, metadata? }
 */
router.post('/:clientId/document', 
  validateMultiple(
    { schema: clientIdParamSchema, source: 'params' },
    { schema: documentSourceSchema, source: 'body', options: { logAttempts: true, logSuccess: true } }
  ),
  handleProcessDocumentSource
);

/**
 * @route   POST /api/context-sources/:clientId/url
 * @desc    Procesar una URL como fuente de contexto
 * @access  Private (requiere autenticación)
 * @body    { url, title?, description?, tags? }
 */
router.post('/:clientId/url', 
  validateMultiple(
    { schema: clientIdParamSchema, source: 'params' },
    { schema: urlSourceSchema, source: 'body', options: { logAttempts: true, logSuccess: true } }
  ),
  handleProcessUrlSource
);

/**
 * @route   POST /api/context-sources/:clientId/manual
 * @desc    Agregar información manual como fuente de contexto
 * @access  Private (requiere autenticación)
 * @body    { content, title?, category?, tags?, importance? }
 */
router.post('/:clientId/manual', 
  validateMultiple(
    { schema: clientIdParamSchema, source: 'params' },
    { schema: manualSourceSchema, source: 'body', options: { logSuccess: true } }
  ),
  handleProcessManualSource
);

/**
 * @route   POST /api/context-sources/:clientId/note
 * @desc    Agregar una nota como fuente de contexto
 * @access  Private (requiere autenticación)
 * @body    { note, title?, note_type?, importance?, tags? }
 */
router.post('/:clientId/note', 
  validateMultiple(
    { schema: clientIdParamSchema, source: 'params' },
    { schema: noteSourceSchema, source: 'body', options: { logSuccess: true } }
  ),
  handleProcessNoteSource
);

// --- Rutas de Gestión de Fuentes ---

/**
 * @route   GET /api/context-sources/:clientId
 * @desc    Obtener todas las fuentes de contexto de un cliente
 * @access  Private (requiere autenticación)
 * @query   source_type?, ai_status?, limit?
 */
router.get('/:clientId', 
  validate(clientIdParamSchema, 'params'),
  handleGetContextSources
);

/**
 * @route   PUT /api/context-sources/:clientId/:sourceId
 * @desc    Actualizar una fuente de contexto específica
 * @access  Private (requiere autenticación)
 * @body    { file_name?, source_metadata? }
 */
router.put('/:clientId/:sourceId', 
  validateMultiple(
    { schema: clientIdParamSchema, source: 'params' },
    { schema: uuidParamSchema.extend({ sourceId: uuidParamSchema.shape.id }), source: 'params' }
  ),
  handleUpdateContextSource
);

/**
 * @route   DELETE /api/context-sources/:clientId/:sourceId
 * @desc    Eliminar una fuente de contexto específica
 * @access  Private (requiere autenticación)
 */
router.delete('/:clientId/:sourceId', 
  validateMultiple(
    { schema: clientIdParamSchema, source: 'params' },
    { schema: uuidParamSchema.extend({ sourceId: uuidParamSchema.shape.id }), source: 'params', options: { logAttempts: true } }
  ),
  handleDeleteContextSource
);

// --- Rutas de Búsqueda y Estadísticas ---

/**
 * @route   POST /api/context-sources/:clientId/search
 * @desc    Buscar contenido en las fuentes de contexto usando búsqueda semántica
 * @access  Private (requiere autenticación)
 * @body    { query, source_types?, limit? }
 */
router.post('/:clientId/search', 
  validateMultiple(
    { schema: clientIdParamSchema, source: 'params' },
    { schema: contextSearchSchema, source: 'body', options: { logAttempts: true } }
  ),
  handleSearchContextChunks
);

/**
 * @route   GET /api/context-sources/:clientId/stats
 * @desc    Obtener estadísticas de las fuentes de contexto de un cliente
 * @access  Private (requiere autenticación)
 */
router.get('/:clientId/stats', 
  validate(clientIdParamSchema, 'params'),
  handleGetContextSourceStats
);

export default router;