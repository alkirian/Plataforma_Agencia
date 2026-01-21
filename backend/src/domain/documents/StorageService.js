// Domain Storage Service Interface (Port)
// Defines contract for file storage operations

export class StorageService {
  /**
   * Upload file to storage
   * @param {Buffer|Stream} fileData
   * @param {string} storagePath
   * @param {Object} metadata
   * @returns {Promise<{path: string, size: number}>}
   */
  async upload(fileData, storagePath, metadata = {}) {
    throw new Error("Method must be implemented");
  }

  /**
   * Delete file from storage
   * @param {string} storagePath
   * @returns {Promise<void>}
   */
  async delete(storagePath) {
    throw new Error("Method must be implemented");
  }

  /**
   * Generate signed URL for download
   * @param {string} storagePath
   * @param {number} expiresIn - seconds
   * @returns {Promise<string>}
   */
  async getSignedUrl(storagePath, expiresIn = 3600) {
    throw new Error("Method must be implemented");
  }

  /**
   * Check if file exists in storage
   * @param {string} storagePath
   * @returns {Promise<boolean>}
   */
  async exists(storagePath) {
    throw new Error("Method must be implemented");
  }

  /**
   * Get file metadata from storage
   * @param {string} storagePath
   * @returns {Promise<{size: number, lastModified: Date, contentType: string}>}
   */
  async getMetadata(storagePath) {
    throw new Error("Method must be implemented");
  }

  /**
   * Generate unique storage path
   * @param {string} agencyId
   * @param {string} clientId
   * @param {string} versionGroup
   * @param {string} extension
   * @returns {string}
   */
  generateStoragePath(agencyId, clientId, versionGroup, extension) {
    const uuid = crypto.randomUUID();
    return `${agencyId}/${clientId}/${versionGroup}/${uuid}.${extension}`;
  }
}
