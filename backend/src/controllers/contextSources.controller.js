// src/controllers/contextSources.controller.js

import {
  processDocumentSource,
  processUrlSource,
  processManualSource,
  processNoteSource,
  getContextSourcesByClient,
  updateContextSource,
  deleteContextSource,
  searchContextChunks,
  getContextSourceStats,
} from "../services/contextSources.service.js";
import { getUserAgencyId } from "../helpers/userHelpers.js";
import { logger } from "../utils/logger.js";

// --- Controladores de Procesamiento ---

export const handleProcessDocumentSource = async (req, res, next) => {
  try {
    const { clientId } = req.params;
    const token = req.headers.authorization?.split(" ")[1];
    const {
      file_name,
      storage_path,
      file_type,
      file_size,
      metadata = {},
    } = req.body || {};

    if (!clientId || !storage_path || !file_name) {
      return res.status(400).json({
        success: false,
        message: "Faltan campos requeridos: clientId, storage_path, file_name",
      });
    }

    const agencyId = await getUserAgencyId(req.user.id);

    // Simular objeto file para compatibilidad
    const fileObj = {
      originalname: file_name,
      mimetype: file_type,
      size: file_size,
    };

    const fileMetadata = {
      storage_path,
      ...metadata,
    };

    logger.info("Procesando documento", { clientId, agencyId, file_name });

    const createdSource = await processDocumentSource(
      fileObj,
      clientId,
      agencyId,
      token,
      fileMetadata,
      req.user.id,
    );

    res.status(201).json({
      success: true,
      data: createdSource,
      message: "Documento agregado como fuente de contexto",
    });
  } catch (error) {
    logger.error("Error in handleProcessDocumentSource", error, {
      clientId: req.params?.clientId,
    });
    next(error);
  }
};

export const handleProcessUrlSource = async (req, res, next) => {
  try {
    const { clientId } = req.params;
    const token = req.headers.authorization?.split(" ")[1];
    const { url, title, description, tags = [] } = req.body || {};

    if (!clientId || !url) {
      return res.status(400).json({
        success: false,
        message: "Faltan campos requeridos: clientId, url",
      });
    }

    // Validar formato de URL
    try {
      new URL(url);
    } catch {
      return res.status(400).json({
        success: false,
        message: "Formato de URL inválido",
      });
    }

    const agencyId = await getUserAgencyId(req.user.id);

    const metadata = {
      user_title: title,
      user_description: description,
      tags,
      processing_method: "puppeteer_scraping",
    };

    logger.info("Procesando URL", { clientId, agencyId, url });

    const createdSource = await processUrlSource(
      url,
      clientId,
      agencyId,
      token,
      metadata,
      req.user.id,
    );

    res.status(201).json({
      success: true,
      data: createdSource,
      message: "URL procesada como fuente de contexto",
    });
  } catch (error) {
    logger.error("Error in handleProcessUrlSource", error, {
      clientId: req.params?.clientId,
    });
    next(error);
  }
};

export const handleProcessManualSource = async (req, res, next) => {
  try {
    const { clientId } = req.params;
    const token = req.headers.authorization?.split(" ")[1];
    const {
      content,
      title,
      category,
      tags = [],
      importance = "medium",
    } = req.body || {};

    if (!clientId || !content) {
      return res.status(400).json({
        success: false,
        message: "Faltan campos requeridos: clientId, content",
      });
    }

    if (content.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: "El contenido debe tener al menos 10 caracteres",
      });
    }

    const agencyId = await getUserAgencyId(req.user.id);

    const metadata = {
      category,
      tags,
      importance,
      created_by_user: req.user.id,
      input_method: "manual_text",
    };

    logger.info("Procesando información manual", { clientId, agencyId, title });

    const createdSource = await processManualSource(
      content,
      title,
      clientId,
      agencyId,
      token,
      metadata,
      req.user.id,
    );

    res.status(201).json({
      success: true,
      data: createdSource,
      message: "Información manual agregada como fuente de contexto",
    });
  } catch (error) {
    logger.error("Error in handleProcessManualSource", error, {
      clientId: req.params?.clientId,
    });
    next(error);
  }
};

export const handleProcessNoteSource = async (req, res, next) => {
  try {
    const { clientId } = req.params;
    const token = req.headers.authorization?.split(" ")[1];
    const {
      note,
      title,
      note_type = "general",
      importance = "medium",
      tags = [],
    } = req.body || {};

    if (!clientId || !note) {
      return res.status(400).json({
        success: false,
        message: "Faltan campos requeridos: clientId, note",
      });
    }

    if (note.trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: "La nota debe tener al menos 5 caracteres",
      });
    }

    const agencyId = await getUserAgencyId(req.user.id);

    const metadata = {
      note_type,
      importance,
      tags,
      created_by_user: req.user.id,
    };

    logger.info("Procesando nota", { clientId, agencyId, title, note_type });

    const createdSource = await processNoteSource(
      note,
      title,
      clientId,
      agencyId,
      token,
      metadata,
      req.user.id,
    );

    res.status(201).json({
      success: true,
      data: createdSource,
      message: "Nota agregada como fuente de contexto",
    });
  } catch (error) {
    logger.error("Error in handleProcessNoteSource", error, {
      clientId: req.params?.clientId,
    });
    next(error);
  }
};

// --- Controladores de Gestión ---

export const handleGetContextSources = async (req, res, next) => {
  try {
    const { clientId } = req.params;
    const { source_type, ai_status, limit = 50 } = req.query;

    if (!clientId) {
      return res.status(400).json({
        success: false,
        message: "clientId requerido",
      });
    }

    const agencyId = await getUserAgencyId(req.user.id);

    let sources = await getContextSourcesByClient(clientId, agencyId);

    // Filtrar por tipo de fuente si se especifica
    if (source_type) {
      sources = sources.filter((source) => source.source_type === source_type);
    }

    // Filtrar por estado si se especifica
    if (ai_status) {
      sources = sources.filter((source) => source.ai_status === ai_status);
    }

    // Limitar resultados
    if (limit && !isNaN(parseInt(limit))) {
      sources = sources.slice(0, parseInt(limit));
    }

    logger.info("Obteniendo fuentes", {
      clientId,
      agencyId,
      total: sources.length,
      filters: { source_type, ai_status },
    });

    res.status(200).json({
      success: true,
      data: sources,
      count: sources.length,
    });
  } catch (error) {
    logger.error("Error in handleGetContextSources", error, {
      clientId: req.params?.clientId,
    });
    next(error);
  }
};

export const handleUpdateContextSource = async (req, res, next) => {
  try {
    const { clientId, sourceId } = req.params;
    const updateData = req.body;

    if (!clientId || !sourceId) {
      return res.status(400).json({
        success: false,
        message: "clientId y sourceId requeridos",
      });
    }

    const agencyId = await getUserAgencyId(req.user.id);

    // Filtrar campos que se pueden actualizar
    const allowedFields = ["file_name", "source_metadata"];
    const filteredUpdate = {};

    Object.keys(updateData).forEach((key) => {
      if (allowedFields.includes(key)) {
        filteredUpdate[key] = updateData[key];
      }
    });

    if (Object.keys(filteredUpdate).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No se proporcionaron campos válidos para actualizar",
      });
    }

    logger.info("Actualizando fuente", { sourceId, clientId, agencyId });

    const updatedSource = await updateContextSource(
      sourceId,
      filteredUpdate,
      agencyId,
    );

    res.status(200).json({
      success: true,
      data: updatedSource,
      message: "Fuente de contexto actualizada",
    });
  } catch (error) {
    logger.error("Error in handleUpdateContextSource", error, {
      sourceId: req.params?.sourceId,
      clientId: req.params?.clientId,
    });
    next(error);
  }
};

export const handleDeleteContextSource = async (req, res, next) => {
  try {
    const { clientId, sourceId } = req.params;

    if (!clientId || !sourceId) {
      return res.status(400).json({
        success: false,
        message: "clientId y sourceId requeridos",
      });
    }

    const agencyId = await getUserAgencyId(req.user.id);

    logger.info("Eliminando fuente", { sourceId, clientId, agencyId });

    await deleteContextSource(sourceId, agencyId);

    res.status(204).send();
  } catch (error) {
    logger.error("Error in handleDeleteContextSource", error, {
      sourceId: req.params?.sourceId,
      clientId: req.params?.clientId,
    });
    next(error);
  }
};

// --- Controladores de Búsqueda y Estadísticas ---

export const handleSearchContextChunks = async (req, res, next) => {
  try {
    const { clientId } = req.params;
    const { query, source_types, limit = 10 } = req.body || {};

    if (!clientId || !query) {
      return res.status(400).json({
        success: false,
        message: "clientId y query requeridos",
      });
    }

    if (query.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: "La consulta debe tener al menos 3 caracteres",
      });
    }

    const agencyId = await getUserAgencyId(req.user.id);

    logger.info("Buscando chunks", {
      clientId,
      agencyId,
      query: query.substring(0, 50) + "...",
      source_types,
      limit,
    });

    const matches = await searchContextChunks(
      query,
      clientId,
      agencyId,
      source_types,
      parseInt(limit),
    );

    res.status(200).json({
      success: true,
      data: matches,
      count: matches.length,
      query: query,
    });
  } catch (error) {
    logger.error("Error in handleSearchContextChunks", error, {
      clientId: req.params?.clientId,
    });
    next(error);
  }
};

export const handleGetContextSourceStats = async (req, res, next) => {
  try {
    const { clientId } = req.params;

    if (!clientId) {
      return res.status(400).json({
        success: false,
        message: "clientId requerido",
      });
    }

    const agencyId = await getUserAgencyId(req.user.id);

    logger.info("Obteniendo estadísticas", { clientId, agencyId });

    const stats = await getContextSourceStats(clientId, agencyId);

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error("Error in handleGetContextSourceStats", error, {
      clientId: req.params?.clientId,
    });
    next(error);
  }
};

// Nuevo controlador para subir archivos directamente al Brand Universe
import { supabaseAdmin } from "../config/supabaseClient.js";
import crypto from "crypto";

export const handleUploadDocumentSource = async (req, res, next) => {
  try {
    const { clientId } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: "No se proporcionó ningún archivo",
      });
    }

    if (!clientId) {
      return res.status(400).json({
        success: false,
        message: "clientId requerido",
      });
    }

    const token = req.headers.authorization?.split(" ")[1];
    const agencyId = await getUserAgencyId(req.user.id);
    const userId = req.user.id;

    logger.info("Subiendo archivo para Brand Universe", {
      clientId,
      agencyId,
      filename: file.originalname,
      size: file.size,
    });

    // Generar storage path
    const uuid = crypto.randomUUID();
    const extension = file.originalname.split(".").pop()?.toLowerCase() || "bin";
    const storagePath = `${agencyId}/${clientId}/context-sources/${uuid}.${extension}`;

    // Subir al storage de Supabase
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from("documents")
      .upload(storagePath, file.buffer, {
        contentType: file.mimetype,
        metadata: {
          originalName: file.originalname,
          uploadedBy: userId,
          uploadedAt: new Date().toISOString(),
        },
      });

    if (uploadError) {
      logger.error("Error subiendo al storage", uploadError);
      return res.status(500).json({
        success: false,
        message: `Error al subir archivo: ${uploadError.message}`,
      });
    }

    logger.info("Archivo subido al storage", { path: storagePath });

    // Crear fuente de contexto usando el servicio existente
    const fileObj = {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
    };

    const metadata = {
      storage_path: storagePath,
      title: req.body?.title || file.originalname,
      description: req.body?.description || "",
    };

    const createdSource = await processDocumentSource(
      fileObj,
      clientId,
      agencyId,
      token,
      metadata,
      userId
    );

    res.status(201).json({
      success: true,
      data: createdSource,
      message: "Archivo subido y registrado como fuente de contexto",
    });
  } catch (error) {
    logger.error("Error in handleUploadDocumentSource", error, {
      clientId: req.params?.clientId,
    });
    next(error);
  }
};
