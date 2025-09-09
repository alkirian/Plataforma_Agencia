// Domain Repository Interface (Port)
// Defines the contract for data access, independent of implementation

export class DocumentRepository {
  /**
   * Find documents with pagination and filters
   * @param {Object} criteria
   * @param {string} criteria.clientId
   * @param {string} criteria.agencyId  
   * @param {string} [criteria.search]
   * @param {string} [criteria.type] - 'image', 'video', 'document', etc.
   * @param {boolean} [criteria.pinned]
   * @param {boolean} [criteria.deleted] - include deleted
   * @param {string} [criteria.versionGroup]
   * @param {string} [criteria.cursor] - for pagination
   * @param {number} [criteria.limit=50]
   * @returns {Promise<{documents: DocumentEntity[], nextCursor: string|null, total: number}>}
   */
  async findByCriteria(criteria) {
    throw new Error('Method must be implemented');
  }

  /**
   * Find document by ID
   * @param {string} id
   * @param {string} agencyId - for security
   * @returns {Promise<DocumentEntity|null>}
   */
  async findById(id, agencyId) {
    throw new Error('Method must be implemented');
  }

  /**
   * Find documents by version group
   * @param {string} versionGroup
   * @param {string} clientId
   * @param {string} agencyId
   * @returns {Promise<DocumentEntity[]>}
   */
  async findByVersionGroup(versionGroup, clientId, agencyId) {
    throw new Error('Method must be implemented');
  }

  /**
   * Find document by checksum (for deduplication)
   * @param {string} checksum
   * @param {string} clientId
   * @param {string} agencyId
   * @returns {Promise<DocumentEntity|null>}
   */
  async findByChecksum(checksum, clientId, agencyId) {
    throw new Error('Method must be implemented');
  }

  /**
   * Count pinned documents for a client
   * @param {string} clientId
   * @param {string} agencyId
   * @returns {Promise<number>}
   */
  async countPinned(clientId, agencyId) {
    throw new Error('Method must be implemented');
  }

  /**
   * Save document (insert or update)
   * @param {DocumentEntity} document
   * @returns {Promise<DocumentEntity>}
   */
  async save(document) {
    throw new Error('Method must be implemented');
  }

  /**
   * Delete document permanently (hard delete)
   * @param {string} id
   * @param {string} agencyId
   * @returns {Promise<void>}
   */
  async delete(id, agencyId) {
    throw new Error('Method must be implemented');
  }

  /**
   * Get storage statistics for an agency
   * @param {string} agencyId
   * @returns {Promise<{totalSize: number, totalCount: number, activeCount: number, deletedCount: number}>}
   */
  async getStorageStats(agencyId) {
    throw new Error('Method must be implemented');
  }
}