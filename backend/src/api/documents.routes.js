// API Routes - Documents V2
// RESTful endpoints for enhanced document management

import express from "express";
import {
  uploadDocuments,
  listDocuments,
  getDocumentDetails,
  getDownloadUrl,
  getPreviewUrl,
  pinDocument,
  unpinDocument,
  renameDocument,
  deleteDocument,
  restoreDocument,
  getVersionHistory,
  getStorageStats,
  searchDocuments,
  // Legacy compatibility endpoints
  processDocumentLegacy,
  getDocumentsForClient,
  uploadDocumentLegacy,
} from "../controllers/documents.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);

// Upload multiple documents
router.post("/", uploadDocuments);

// Upload multiple documents (alternative endpoint for compatibility)
router.post("/upload", uploadDocuments);

// List documents with filters and pagination
router.get("/", listDocuments);

// Search documents
router.get("/search", searchDocuments);

// Get storage statistics
router.get("/stats", getStorageStats);

// Get version history for a file group
router.get("/version-group/:group", getVersionHistory);

// Get document details with version history
router.get("/:id", getDocumentDetails);

// Generate download URL
router.get("/:id/download", getDownloadUrl);

// Generate preview URL
router.get("/:id/preview", getPreviewUrl);

// Pin/unpin document
router.post("/:id/pin", pinDocument);
router.delete("/:id/pin", unpinDocument);

// Rename document
router.patch("/:id", renameDocument);

// Soft delete document
router.delete("/:id", deleteDocument);

// Restore deleted document
router.post("/:id/restore", restoreDocument);

// Legacy compatibility routes (maintain frontend compatibility)
router.post("/:documentId/process", processDocumentLegacy);
router.get("/client/:clientId", getDocumentsForClient);
router.post("/client/:clientId/upload", uploadDocumentLegacy);

export default router;
