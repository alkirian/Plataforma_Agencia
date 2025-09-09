// API Routes - Documents V2
// RESTful endpoints for enhanced document management

import express from 'express';
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
  searchDocuments
} from '../controllers/documentsV2.controller.js';

const router = express.Router();

// Upload multiple documents
router.post('/', uploadDocuments);

// Upload multiple documents (alternative endpoint for compatibility)
router.post('/upload', uploadDocuments);

// List documents with filters and pagination
router.get('/', listDocuments);

// Search documents
router.get('/search', searchDocuments);

// Get storage statistics
router.get('/stats', getStorageStats);

// Get version history for a file group
router.get('/version-group/:group', getVersionHistory);

// Get document details with version history
router.get('/:id', getDocumentDetails);

// Generate download URL
router.get('/:id/download', getDownloadUrl);

// Generate preview URL
router.get('/:id/preview', getPreviewUrl);

// Pin/unpin document
router.post('/:id/pin', pinDocument);
router.delete('/:id/pin', unpinDocument);

// Rename document
router.patch('/:id', renameDocument);

// Soft delete document
router.delete('/:id', deleteDocument);

// Restore deleted document
router.post('/:id/restore', restoreDocument);

export default router;