// API Controllers - Documents V2
// Handles HTTP requests and responses

import { getUserAgencyId } from "../helpers/userHelpers.js";
import {
  processDocument,
  getDocumentsByClient,
  createDocument,
} from "../services/documents.service.js";
import { documentService, documentsUpload } from "./documents.dependencies.js";
import { logger } from "../utils/logger.js";
import {
  asyncHandler,
  ensureFields,
  sendCreated,
  sendSuccess,
  sendNoContent,
  HttpError,
} from "../utils/http.js";

/**
 * POST /api/v2/documents
 * Upload multiple documents
 */
export const uploadDocuments = [
  documentsUpload.array("files", 10),
  asyncHandler(async (req, res) => {
    ensureFields(req.body, ["clientId"]);

    const files = req.files || [];
    if (files.length === 0) {
      throw new HttpError(400, "No se proporcionaron archivos.");
    }

    const agencyId = await getUserAgencyId(req.user.id);
    const uploadedBy = req.user.id;

    const uploads = files.map((file) => ({
      filename: file.originalname,
      buffer: file.buffer,
      mime_type: file.mimetype,
      size_bytes: file.size,
    }));

    const results = await documentService.uploadDocuments(
      uploads,
      req.body.clientId,
      agencyId,
      uploadedBy,
    );

    const successful = results.filter((result) => result.success);
    const failed = results.filter((result) => !result.success);

    return sendCreated(res, {
      successful: successful.map((result) => result.document),
      failed: failed.map((result) => ({
        filename: result.filename,
        error: result.error,
      })),
      summary: {
        total: results.length,
        successful: successful.length,
        failed: failed.length,
      },
    });
  }),
];

/**
 * GET /api/v2/documents
 * List documents with filters and pagination
 */
export const listDocuments = asyncHandler(async (req, res) => {
  const {
    clientId,
    search,
    type,
    pinned,
    deleted,
    versionGroup,
    cursor,
    limit = 50,
  } = req.query;

  ensureFields({ clientId }, ["clientId"], "Client ID requerido");

  const agencyId = await getUserAgencyId(req.user.id);

  const result = await documentService.listDocuments({
    clientId,
    agencyId,
    search,
    type,
    pinned: pinned === "true" ? true : pinned === "false" ? false : undefined,
    deleted: deleted === "true",
    versionGroup,
    cursor,
    limit: parseInt(limit, 10),
  });

  return sendSuccess(res, result.documents, 200, {
    pagination: {
      nextCursor: result.nextCursor,
      total: result.total,
    },
  });
});

/**
 * GET /api/v2/documents/:id
 * Get document details with version history
 */
export const getDocumentDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const agencyId = await getUserAgencyId(req.user.id);

  try {
    const result = await documentService.getDocumentDetails(id, agencyId);
    return sendSuccess(res, result);
  } catch (error) {
    if (error.message === "Document not found") {
      throw new HttpError(404, error.message);
    }
    throw error;
  }
});

/**
 * GET /api/v2/documents/:id/download
 * Generate signed URL for download
 */
export const getDownloadUrl = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { expires } = req.query;

  const agencyId = await getUserAgencyId(req.user.id);
  const expiresIn = expires ? parseInt(expires, 10) : 3600;

  try {
    const signedUrl = await documentService.getDownloadUrl(
      id,
      agencyId,
      expiresIn,
    );
    return sendSuccess(res, { url: signedUrl, expiresIn });
  } catch (error) {
    if (error.message.includes("not found")) {
      throw new HttpError(404, error.message);
    }
    throw error;
  }
});

/**
 * GET /api/v2/documents/:id/preview
 * Generate signed URL for preview (shorter expiration)
 */
export const getPreviewUrl = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const agencyId = await getUserAgencyId(req.user.id);

  const signedUrl = await documentService.getDownloadUrl(id, agencyId, 300);
  return sendSuccess(res, { url: signedUrl, expiresIn: 300 });
});

/**
 * POST /api/v2/documents/:id/pin
 * Pin document
 */
export const pinDocument = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const agencyId = await getUserAgencyId(req.user.id);
  const userId = req.user.id;

  try {
    const document = await documentService.togglePin(id, agencyId, userId);
    return sendSuccess(res, document, 200, {
      message: document.isPinned() ? "Document pinned" : "Document unpinned",
    });
  } catch (error) {
    if (error.message.includes("Cannot pin more than")) {
      throw new HttpError(400, error.message);
    }
    throw error;
  }
});

/**
 * DELETE /api/v2/documents/:id/pin
 * Unpin document
 */
export const unpinDocument = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const agencyId = await getUserAgencyId(req.user.id);
  const userId = req.user.id;

  const document = await documentService.togglePin(id, agencyId, userId);

  return sendSuccess(res, document, 200, { message: "Document unpinned" });
});

/**
 * PATCH /api/v2/documents/:id
 * Rename document
 */
export const renameDocument = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { filename } = req.body;

  ensureFields({ filename }, ["filename"]);

  const agencyId = await getUserAgencyId(req.user.id);

  try {
    const document = await documentService.renameDocument(
      id,
      agencyId,
      filename,
    );
    return sendSuccess(res, document, 200, {
      message: "Document renamed successfully",
    });
  } catch (error) {
    if (error.message === "File extension not allowed") {
      throw new HttpError(400, error.message);
    }
    throw error;
  }
});

/**
 * DELETE /api/v2/documents/:id
 * Soft delete document
 */
export const deleteDocument = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const agencyId = await getUserAgencyId(req.user.id);
  const deletedBy = req.user.id;

  await documentService.deleteDocument(id, agencyId, deletedBy);

  return sendNoContent(res);
});

/**
 * POST /api/v2/documents/:id/restore
 * Restore deleted document
 */
export const restoreDocument = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const agencyId = await getUserAgencyId(req.user.id);

  const document = await documentService.restoreDocument(id, agencyId);

  return sendSuccess(res, document, 200, {
    message: "Document restored successfully",
  });
});

/**
 * GET /api/v2/documents/version-group/:group
 * Get version history for a file group
 */
export const getVersionHistory = asyncHandler(async (req, res) => {
  const { group } = req.params;
  const { clientId } = req.query;

  ensureFields({ clientId }, ["clientId"], "Client ID requerido");

  const agencyId = await getUserAgencyId(req.user.id);

  const versions = await documentService.getVersionHistory(
    decodeURIComponent(group),
    clientId,
    agencyId,
  );

  return sendSuccess(res, versions);
});

/**
 * GET /api/v2/documents/stats
 * Get storage statistics
 */
export const getStorageStats = asyncHandler(async (req, res) => {
  logger.debug("getStorageStats request", { userId: req.user?.id });

  if (!req.user?.id) {
    throw new HttpError(401, "User not authenticated");
  }

  const agencyId = await getUserAgencyId(req.user.id);

  if (!agencyId) {
    logger.error("User has no agency_id", null, { userId: req.user.id });
    throw new HttpError(403, "User is not associated with any agency");
  }

  try {
    const stats = await documentService.getStorageStats(agencyId);
    logger.info("Storage stats retrieved successfully", { agencyId });
    return sendSuccess(res, stats);
  } catch (error) {
    logger.error("Service error in getStorageStats", error, { agencyId });
    throw error;
  }
});

/**
 * GET /api/v2/documents/search
 * Search documents
 */
export const searchDocuments = asyncHandler(async (req, res) => {
  const { q: query, clientId, limit = 20 } = req.query;

  if (!query || query.length < 2) {
    throw new HttpError(400, "Query must be at least 2 characters");
  }

  ensureFields({ clientId }, ["clientId"], "Client ID requerido");

  const agencyId = await getUserAgencyId(req.user.id);

  const result = await documentService.searchDocuments(
    query,
    clientId,
    agencyId,
    { limit: parseInt(limit, 10) },
  );

  return sendSuccess(res, result.documents, 200, {
    pagination: {
      total: result.total,
    },
  });
});

/**
 * POST /api/v2/documents/:documentId/process
 * Process document for AI extraction (Legacy compatibility)
 */
export const processDocumentLegacy = asyncHandler(async (req, res) => {
  const { documentId } = req.params;
  ensureFields({ documentId }, ["documentId"]);

  await processDocument(documentId, req.token);
  return sendSuccess(res, { status: "processing" }, 202);
});

/**
 * GET /api/v2/documents/client/:clientId
 * Get documents for client (Legacy compatibility)
 */
export const getDocumentsForClient = asyncHandler(async (req, res) => {
  const { clientId } = req.params;
  ensureFields({ clientId }, ["clientId"]);

  const agencyId = await getUserAgencyId(req.user.id);
  const documents = await getDocumentsByClient(clientId, agencyId);

  return sendSuccess(res, documents);
});

export const uploadDocumentLegacy = asyncHandler(async (req, res) => {
  const { clientId } = req.params;
  const { file_name, storage_path, file_type, file_size } = req.body || {};

  ensureFields({ clientId }, ["clientId"]);
  ensureFields({ file_name, storage_path }, ["file_name", "storage_path"]);

  const agencyId = await getUserAgencyId(req.user.id);

  const documentData = {
    client_id: clientId,
    agency_id: agencyId,
    user_id: req.user.id,
    file_name,
    storage_path,
    file_type,
    file_size,
    ai_status: "pending",
  };

  logger.debug("Datos a insertar en tabla documents", { documentData });

  const createdDocument = await createDocument(documentData);

  if (createdDocument) {
    processDocument(createdDocument.id, req.token).catch((error) => {
      logger.error("Fallo en procesamiento del documento", error, {
        documentId: createdDocument.id,
      });
    });
  }

  return sendCreated(res, createdDocument);
});

/**
 * POST /api/v2/documents/client/:clientId/upload
 * Upload document for client (Legacy compatibility - single file)
 */
