// Domain Service: Business Logic Layer
// Orchestrates business rules and use cases

import { DocumentEntity } from './DocumentEntity.js';
import crypto from 'crypto';

export class DocumentService {
  constructor(documentRepository, storageService) {
    this.documentRepository = documentRepository;
    this.storageService = storageService;
    this.maxPinnedPerClient = 10; // Configurable
  }

  /**
   * Upload single or multiple documents
   */
  async uploadDocuments(uploads, clientId, agencyId, uploadedBy) {
    const results = [];
    
    for (const upload of uploads) {
      try {
        const result = await this.uploadSingleDocument(upload, clientId, agencyId, uploadedBy);
        results.push({ success: true, document: result, filename: upload.filename });
      } catch (error) {
        results.push({ success: false, error: error.message, filename: upload.filename });
      }
    }

    return results;
  }

  async uploadSingleDocument(upload, clientId, agencyId, uploadedBy) {
    // 1. Create document entity
    const document = DocumentEntity.createForUpload({
      ...upload,
      client_id: clientId,
      agency_id: agencyId,
      uploaded_by: uploadedBy
    });

    // 2. Validate
    const validation = document.validate();
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // 3. Calculate checksum for deduplication
    const checksum = this.calculateChecksum(upload.buffer);
    document.checksum = checksum;

    // 4. Check for duplicates
    const existingDoc = await this.documentRepository.findByChecksum(checksum, clientId, agencyId);
    if (existingDoc && existingDoc.isActive()) {
      // Create duplicate reference, reuse storage
      document.duplicateOf = existingDoc.id;
      document.storagePath = existingDoc.storagePath;
      document.sizeBytes = existingDoc.sizeBytes;
      
      return await this.documentRepository.save(document);
    }

    // 5. Generate storage path
    const storagePath = this.storageService.generateStoragePath(
      agencyId, 
      clientId, 
      document.versionGroup, 
      document.extension
    );
    document.storagePath = storagePath;

    // 6. Upload to storage
    const storageResult = await this.storageService.upload(
      upload.buffer, 
      storagePath,
      {
        contentType: document.mimeType,
        originalName: document.filenameOriginal,
        uploadedBy
      }
    );
    document.sizeBytes = storageResult.size;

    // 7. Save to database
    return await this.documentRepository.save(document);
  }

  /**
   * List documents with filters and pagination
   */
  async listDocuments(criteria) {
    return await this.documentRepository.findByCriteria(criteria);
  }

  /**
   * Get document details with version history
   */
  async getDocumentDetails(id, agencyId) {
    const document = await this.documentRepository.findById(id, agencyId);
    if (!document) {
      throw new Error('Document not found');
    }

    // Get version history
    const versions = await this.documentRepository.findByVersionGroup(
      document.versionGroup, 
      document.clientId, 
      agencyId
    );

    return {
      document,
      versions: versions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    };
  }

  /**
   * Generate download URL
   */
  async getDownloadUrl(id, agencyId, expiresIn = 3600) {
    const document = await this.documentRepository.findById(id, agencyId);
    if (!document || !document.isActive()) {
      throw new Error('Document not found or deleted');
    }

    return await this.storageService.getSignedUrl(document.storagePath, expiresIn);
  }

  /**
   * Soft delete document
   */
  async deleteDocument(id, agencyId, deletedBy) {
    const document = await this.documentRepository.findById(id, agencyId);
    if (!document) {
      throw new Error('Document not found');
    }

    document.softDelete(deletedBy);
    return await this.documentRepository.save(document);
  }

  /**
   * Restore deleted document
   */
  async restoreDocument(id, agencyId) {
    const document = await this.documentRepository.findById(id, agencyId);
    if (!document) {
      throw new Error('Document not found');
    }

    if (document.isActive()) {
      throw new Error('Document is not deleted');
    }

    document.restore();
    return await this.documentRepository.save(document);
  }

  /**
   * Pin/unpin document
   */
  async togglePin(id, agencyId, userId) {
    const document = await this.documentRepository.findById(id, agencyId);
    if (!document || !document.isActive()) {
      throw new Error('Document not found or deleted');
    }

    if (document.isPinned()) {
      document.unpin();
    } else {
      // Check pin limit
      const pinnedCount = await this.documentRepository.countPinned(document.clientId, agencyId);
      if (pinnedCount >= this.maxPinnedPerClient) {
        throw new Error(`Cannot pin more than ${this.maxPinnedPerClient} documents`);
      }
      document.pin(userId);
    }

    return await this.documentRepository.save(document);
  }

  /**
   * Rename document
   */
  async renameDocument(id, agencyId, newFilename) {
    const document = await this.documentRepository.findById(id, agencyId);
    if (!document || !document.isActive()) {
      throw new Error('Document not found or deleted');
    }

    // Validate new filename
    if (DocumentEntity.isDangerousExtension(DocumentEntity.extractExtension(newFilename))) {
      throw new Error('File extension not allowed');
    }

    document.rename(newFilename);
    return await this.documentRepository.save(document);
  }

  /**
   * Get version history for a file group
   */
  async getVersionHistory(versionGroup, clientId, agencyId) {
    const versions = await this.documentRepository.findByVersionGroup(versionGroup, clientId, agencyId);
    return versions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(agencyId) {
    return await this.documentRepository.getStorageStats(agencyId);
  }

  /**
   * Hard delete (admin only, permanent)
   */
  async hardDeleteDocument(id, agencyId) {
    const document = await this.documentRepository.findById(id, agencyId);
    if (!document) {
      throw new Error('Document not found');
    }

    // Delete from storage if not referenced by duplicates
    if (!document.isDuplicate()) {
      const duplicates = await this.documentRepository.findByCriteria({
        duplicate_of: document.id,
        agencyId
      });
      
      if (duplicates.documents.length === 0) {
        await this.storageService.delete(document.storagePath);
      }
    }

    await this.documentRepository.delete(id, agencyId);
  }

  /**
   * Helper: Calculate SHA256 checksum
   */
  calculateChecksum(buffer) {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Search documents with fuzzy matching
   */
  async searchDocuments(query, clientId, agencyId, options = {}) {
    return await this.documentRepository.findByCriteria({
      search: query,
      clientId,
      agencyId,
      ...options
    });
  }
}