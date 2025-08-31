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

const router = Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(protect);

// --- Rutas de Procesamiento de Fuentes ---

/**
 * @route   POST /api/context-sources/:clientId/document
 * @desc    Procesar un documento como fuente de contexto
 * @access  Private (requiere autenticación)
 * @body    { file_name, storage_path, file_type, file_size, metadata? }
 */
router.post('/:clientId/document', handleProcessDocumentSource);

/**
 * @route   POST /api/context-sources/:clientId/url
 * @desc    Procesar una URL como fuente de contexto
 * @access  Private (requiere autenticación)
 * @body    { url, title?, description?, tags? }
 */
router.post('/:clientId/url', handleProcessUrlSource);

/**
 * @route   POST /api/context-sources/:clientId/manual
 * @desc    Agregar información manual como fuente de contexto
 * @access  Private (requiere autenticación)
 * @body    { content, title?, category?, tags?, importance? }
 */
router.post('/:clientId/manual', handleProcessManualSource);

/**
 * @route   POST /api/context-sources/:clientId/note
 * @desc    Agregar una nota como fuente de contexto
 * @access  Private (requiere autenticación)
 * @body    { note, title?, note_type?, importance?, tags? }
 */
router.post('/:clientId/note', handleProcessNoteSource);

// --- Rutas de Gestión de Fuentes ---

/**
 * @route   GET /api/context-sources/:clientId
 * @desc    Obtener todas las fuentes de contexto de un cliente
 * @access  Private (requiere autenticación)
 * @query   source_type?, ai_status?, limit?
 */
router.get('/:clientId', handleGetContextSources);

/**
 * @route   PUT /api/context-sources/:clientId/:sourceId
 * @desc    Actualizar una fuente de contexto específica
 * @access  Private (requiere autenticación)
 * @body    { file_name?, source_metadata? }
 */
router.put('/:clientId/:sourceId', handleUpdateContextSource);

/**
 * @route   DELETE /api/context-sources/:clientId/:sourceId
 * @desc    Eliminar una fuente de contexto específica
 * @access  Private (requiere autenticación)
 */
router.delete('/:clientId/:sourceId', handleDeleteContextSource);

// --- Rutas de Búsqueda y Estadísticas ---

/**
 * @route   POST /api/context-sources/:clientId/search
 * @desc    Buscar contenido en las fuentes de contexto usando búsqueda semántica
 * @access  Private (requiere autenticación)
 * @body    { query, source_types?, limit? }
 */
router.post('/:clientId/search', handleSearchContextChunks);

/**
 * @route   GET /api/context-sources/:clientId/stats
 * @desc    Obtener estadísticas de las fuentes de contexto de un cliente
 * @access  Private (requiere autenticación)
 */
router.get('/:clientId/stats', handleGetContextSourceStats);

export default router;