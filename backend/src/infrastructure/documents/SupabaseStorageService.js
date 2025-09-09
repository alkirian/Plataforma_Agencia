// Infrastructure Adapter: Supabase Storage Implementation
// Implements StorageService interface

import { StorageService } from '../../domain/documents/StorageService.js';
import crypto from 'crypto';

export class SupabaseStorageService extends StorageService {
  constructor(supabaseClient, bucketName = 'documents') {
    super();
    this.supabase = supabaseClient;
    this.bucketName = bucketName;
  }

  async upload(fileData, storagePath, metadata = {}) {
    const { data, error } = await this.supabase.storage
      .from(this.bucketName)
      .upload(storagePath, fileData, {
        contentType: metadata.contentType,
        metadata: {
          originalName: metadata.originalName,
          uploadedBy: metadata.uploadedBy,
          uploadedAt: new Date().toISOString()
        },
        upsert: false // Never overwrite - always create new
      });

    if (error) {
      throw new Error(`Storage upload failed: ${error.message}`);
    }

    // Get file size from metadata
    const fileMetadata = await this.getMetadata(storagePath);

    return {
      path: data.path,
      size: fileMetadata.size
    };
  }

  async delete(storagePath) {
    const { error } = await this.supabase.storage
      .from(this.bucketName)
      .remove([storagePath]);

    if (error) {
      throw new Error(`Storage delete failed: ${error.message}`);
    }
  }

  async getSignedUrl(storagePath, expiresIn = 3600) {
    const { data, error } = await this.supabase.storage
      .from(this.bucketName)
      .createSignedUrl(storagePath, expiresIn, {
        download: true
      });

    if (error) {
      throw new Error(`Failed to create signed URL: ${error.message}`);
    }

    return data.signedUrl;
  }

  async exists(storagePath) {
    try {
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .list(this.getDirectoryPath(storagePath), {
          limit: 1,
          search: this.getFileName(storagePath)
        });

      if (error) return false;
      return data && data.length > 0;
    } catch {
      return false;
    }
  }

  async getMetadata(storagePath) {
    try {
      // Supabase doesn't have direct metadata API, so we use list with search
      const directory = this.getDirectoryPath(storagePath);
      const filename = this.getFileName(storagePath);

      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .list(directory, {
          limit: 1,
          search: filename
        });

      if (error || !data || data.length === 0) {
        throw new Error(`File not found: ${storagePath}`);
      }

      const fileInfo = data[0];
      return {
        size: fileInfo.metadata?.size || 0,
        lastModified: new Date(fileInfo.updated_at),
        contentType: fileInfo.metadata?.mimetype || 'application/octet-stream'
      };
    } catch (error) {
      throw new Error(`Failed to get file metadata: ${error.message}`);
    }
  }

  generateStoragePath(agencyId, clientId, versionGroup, extension) {
    const uuid = crypto.randomUUID();
    // Clean version group for safe path
    const safeVersionGroup = versionGroup.replace(/[^a-z0-9.-]/g, '_');
    return `${agencyId}/${clientId}/${safeVersionGroup}/${uuid}.${extension}`;
  }

  /**
   * Generate signed URL for preview (shorter expiration)
   */
  async getPreviewUrl(storagePath, expiresIn = 300) {
    const { data, error } = await this.supabase.storage
      .from(this.bucketName)
      .createSignedUrl(storagePath, expiresIn);

    if (error) {
      throw new Error(`Failed to create preview URL: ${error.message}`);
    }

    return data.signedUrl;
  }

  /**
   * Get public URL (if bucket is public - not recommended for documents)
   */
  getPublicUrl(storagePath) {
    const { data } = this.supabase.storage
      .from(this.bucketName)
      .getPublicUrl(storagePath);

    return data.publicUrl;
  }

  /**
   * Copy file to another path (useful for duplicates)
   */
  async copy(sourcePath, destinationPath) {
    const { data, error } = await this.supabase.storage
      .from(this.bucketName)
      .copy(sourcePath, destinationPath);

    if (error) {
      throw new Error(`Failed to copy file: ${error.message}`);
    }

    return data.path;
  }

  /**
   * Move file to another path
   */
  async move(sourcePath, destinationPath) {
    const { data, error } = await this.supabase.storage
      .from(this.bucketName)
      .move(sourcePath, destinationPath);

    if (error) {
      throw new Error(`Failed to move file: ${error.message}`);
    }

    return data.path;
  }

  /**
   * List files in directory
   */
  async list(directory, options = {}) {
    const { data, error } = await this.supabase.storage
      .from(this.bucketName)
      .list(directory, {
        limit: options.limit || 100,
        offset: options.offset || 0,
        search: options.search,
        sortBy: options.sortBy || { column: 'name', order: 'asc' }
      });

    if (error) {
      throw new Error(`Failed to list files: ${error.message}`);
    }

    return data;
  }

  // Helper methods
  getDirectoryPath(storagePath) {
    const parts = storagePath.split('/');
    return parts.slice(0, -1).join('/');
  }

  getFileName(storagePath) {
    const parts = storagePath.split('/');
    return parts[parts.length - 1];
  }

  /**
   * Cleanup orphaned files (files in storage without database records)
   * Run this as a maintenance task
   */
  async cleanupOrphanedFiles(agencyId, dryRun = true) {
    // This would require custom logic to compare storage files with database records
    // Implementation depends on specific maintenance requirements
    throw new Error('Cleanup orphaned files not implemented yet');
  }
}