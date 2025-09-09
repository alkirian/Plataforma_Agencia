// API Controllers - Documents V2
// Handles HTTP requests and responses

import { DocumentService } from '../domain/documents/DocumentService.js';
import { SupabaseDocumentRepository } from '../infrastructure/documents/SupabaseDocumentRepository.js';
import { SupabaseStorageService } from '../infrastructure/documents/SupabaseStorageService.js';
import { supabaseAdmin } from '../config/supabaseClient.js';
import { getUserAgencyId } from '../helpers/userHelpers.js';
import multer from 'multer';

// Initialize services (Dependency Injection)
const documentRepository = new SupabaseDocumentRepository(supabaseAdmin);
const storageService = new SupabaseStorageService(supabaseAdmin);
const documentService = new DocumentService(documentRepository, storageService);

// Multer configuration for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
    files: 10 // Max 10 files per request
  },
  fileFilter: (req, file, cb) => {
    // Block dangerous extensions
    const dangerousExts = ['exe', 'msi', 'dll', 'bat', 'cmd', 'sh', 'scr'];
    const ext = file.originalname.split('.').pop()?.toLowerCase();
    
    if (dangerousExts.includes(ext)) {
      return cb(new Error(`File extension .${ext} is not allowed`));
    }
    
    cb(null, true);
  }
});

/**
 * POST /api/v2/documents
 * Upload multiple documents
 */
export const uploadDocuments = [
  upload.array('files', 10),
  async (req, res, next) => {
    try {
      const { clientId } = req.body;
      const files = req.files;

      if (!clientId) {
        return res.status(400).json({
          success: false,
          message: 'Client ID is required'
        });
      }

      if (!files || files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No files provided'
        });
      }

      const agencyId = await getUserAgencyId(req.user.id);
      const uploadedBy = req.user.id;

      // Convert multer files to upload format
      const uploads = files.map(file => ({
        filename: file.originalname,
        buffer: file.buffer,
        mime_type: file.mimetype,
        size_bytes: file.size
      }));

      const results = await documentService.uploadDocuments(
        uploads,
        clientId,
        agencyId,
        uploadedBy
      );

      // Separate successful and failed uploads
      const successful = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);

      res.status(201).json({
        success: true,
        data: {
          successful: successful.map(r => r.document),
          failed: failed.map(r => ({ filename: r.filename, error: r.error })),
          summary: {
            total: results.length,
            successful: successful.length,
            failed: failed.length
          }
        }
      });

    } catch (error) {
      next(error);
    }
  }
];

/**
 * GET /api/v2/documents
 * List documents with filters and pagination
 */
export const listDocuments = async (req, res, next) => {
  try {
    const {
      clientId,
      search,
      type,
      pinned,
      deleted,
      versionGroup,
      cursor,
      limit = 50
    } = req.query;

    if (!clientId) {
      return res.status(400).json({
        success: false,
        message: 'Client ID is required'
      });
    }

    const agencyId = await getUserAgencyId(req.user.id);

    const result = await documentService.listDocuments({
      clientId,
      agencyId,
      search,
      type,
      pinned: pinned === 'true' ? true : pinned === 'false' ? false : undefined,
      deleted: deleted === 'true',
      versionGroup,
      cursor,
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: result.documents,
      pagination: {
        nextCursor: result.nextCursor,
        total: result.total
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v2/documents/:id
 * Get document details with version history
 */
export const getDocumentDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const agencyId = await getUserAgencyId(req.user.id);

    const result = await documentService.getDocumentDetails(id, agencyId);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    if (error.message === 'Document not found') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

/**
 * GET /api/v2/documents/:id/download
 * Generate signed URL for download
 */
export const getDownloadUrl = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { expires } = req.query;
    
    const agencyId = await getUserAgencyId(req.user.id);
    const expiresIn = expires ? parseInt(expires) : 3600; // 1 hour default

    const signedUrl = await documentService.getDownloadUrl(id, agencyId, expiresIn);

    res.json({
      success: true,
      data: { url: signedUrl, expiresIn }
    });

  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

/**
 * GET /api/v2/documents/:id/preview
 * Generate signed URL for preview (shorter expiration)
 */
export const getPreviewUrl = async (req, res, next) => {
  try {
    const { id } = req.params;
    const agencyId = await getUserAgencyId(req.user.id);

    const signedUrl = await documentService.getDownloadUrl(id, agencyId, 300); // 5 minutes

    res.json({
      success: true,
      data: { url: signedUrl, expiresIn: 300 }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v2/documents/:id/pin
 * Pin document
 */
export const pinDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const agencyId = await getUserAgencyId(req.user.id);
    const userId = req.user.id;

    const document = await documentService.togglePin(id, agencyId, userId);

    res.json({
      success: true,
      data: document,
      message: document.isPinned() ? 'Document pinned' : 'Document unpinned'
    });

  } catch (error) {
    if (error.message.includes('Cannot pin more than')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

/**
 * DELETE /api/v2/documents/:id/pin
 * Unpin document
 */
export const unpinDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const agencyId = await getUserAgencyId(req.user.id);
    const userId = req.user.id;

    const document = await documentService.togglePin(id, agencyId, userId);

    res.json({
      success: true,
      data: document,
      message: 'Document unpinned'
    });

  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v2/documents/:id
 * Rename document
 */
export const renameDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { filename } = req.body;

    if (!filename) {
      return res.status(400).json({
        success: false,
        message: 'Filename is required'
      });
    }

    const agencyId = await getUserAgencyId(req.user.id);

    const document = await documentService.renameDocument(id, agencyId, filename);

    res.json({
      success: true,
      data: document,
      message: 'Document renamed successfully'
    });

  } catch (error) {
    if (error.message === 'File extension not allowed') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

/**
 * DELETE /api/v2/documents/:id
 * Soft delete document
 */
export const deleteDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const agencyId = await getUserAgencyId(req.user.id);
    const deletedBy = req.user.id;

    await documentService.deleteDocument(id, agencyId, deletedBy);

    res.status(204).send();

  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v2/documents/:id/restore
 * Restore deleted document
 */
export const restoreDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const agencyId = await getUserAgencyId(req.user.id);

    const document = await documentService.restoreDocument(id, agencyId);

    res.json({
      success: true,
      data: document,
      message: 'Document restored successfully'
    });

  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v2/documents/version-group/:group
 * Get version history for a file group
 */
export const getVersionHistory = async (req, res, next) => {
  try {
    const { group } = req.params;
    const { clientId } = req.query;

    if (!clientId) {
      return res.status(400).json({
        success: false,
        message: 'Client ID is required'
      });
    }

    const agencyId = await getUserAgencyId(req.user.id);

    const versions = await documentService.getVersionHistory(
      decodeURIComponent(group),
      clientId,
      agencyId
    );

    res.json({
      success: true,
      data: versions
    });

  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v2/documents/stats
 * Get storage statistics
 */
export const getStorageStats = async (req, res, next) => {
  try {
    // Log the request for debugging
    console.log('getStorageStats: User ID:', req.user?.id);

    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Get the user's agency ID with proper error handling
    let agencyId;
    try {
      agencyId = await getUserAgencyId(req.user.id);
      console.log('getStorageStats: Agency ID retrieved:', agencyId);
    } catch (userError) {
      console.error('getStorageStats: Error getting user agency ID:', userError.message);
      return res.status(403).json({
        success: false,
        message: 'Unable to retrieve user agency information'
      });
    }

    // Check if user has an agency_id
    if (!agencyId) {
      console.error('getStorageStats: User has no agency_id:', req.user.id);
      return res.status(403).json({
        success: false,
        message: 'User is not associated with any agency'
      });
    }

    // Call the service with proper error handling
    let stats;
    try {
      stats = await documentService.getStorageStats(agencyId);
      console.log('getStorageStats: Stats retrieved successfully for agency:', agencyId);
    } catch (serviceError) {
      console.error('getStorageStats: Service error:', serviceError.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve storage statistics',
        error: serviceError.message
      });
    }

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('getStorageStats: Unexpected error:', error);
    next(error);
  }
};

/**
 * GET /api/v2/documents/search
 * Search documents
 */
export const searchDocuments = async (req, res, next) => {
  try {
    const { q: query, clientId, limit = 20 } = req.query;

    if (!query || query.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Query must be at least 2 characters'
      });
    }

    if (!clientId) {
      return res.status(400).json({
        success: false,
        message: 'Client ID is required'
      });
    }

    const agencyId = await getUserAgencyId(req.user.id);

    const result = await documentService.searchDocuments(
      query,
      clientId,
      agencyId,
      { limit: parseInt(limit) }
    );

    res.json({
      success: true,
      data: result.documents,
      pagination: {
        total: result.total
      }
    });

  } catch (error) {
    next(error);
  }
};