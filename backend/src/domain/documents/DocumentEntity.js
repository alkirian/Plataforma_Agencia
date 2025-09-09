// Domain Entity: Document
// Pure business logic, no framework dependencies

export class DocumentEntity {
  constructor(data) {
    this.id = data.id;
    this.agencyId = data.agency_id;
    this.clientId = data.client_id;
    this.filenameOriginal = data.filename_original || data.file_name;
    this.filenameSanitized = data.filename_sanitized;
    this.extension = data.extension;
    this.mimeType = data.mime_type;
    this.sizeBytes = data.size_bytes || data.file_size;
    this.storagePath = data.storage_path;
    this.checksum = data.checksum;
    this.duplicateOf = data.duplicate_of;
    this.versionGroup = data.version_group;
    this.uploadedBy = data.uploaded_by;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
    this.deletedAt = data.deleted_at;
    this.deletedBy = data.deleted_by;
    this.pinnedAt = data.pinned_at;
    this.pinnedBy = data.pinned_by;
  }

  // Business rules
  static sanitizeFilename(filename) {
    return filename
      .toLowerCase()
      .replace(/[^a-z0-9._-]/g, '_')
      .replace(/_+/g, '_');
  }

  static extractExtension(filename) {
    const match = filename.match(/\.([^.]+)$/);
    return match ? match[1].toLowerCase() : 'unknown';
  }

  static generateVersionGroup(filename) {
    const extension = this.extractExtension(filename);
    const basename = filename.replace(/\.[^.]+$/, '');
    return `${basename.toLowerCase()}.${extension}`;
  }

  static isDangerousExtension(extension) {
    const dangerous = ['exe', 'msi', 'dll', 'bat', 'cmd', 'sh', 'scr', 'js'];
    return dangerous.includes(extension.toLowerCase());
  }

  // Entity methods
  isActive() {
    return this.deletedAt === null;
  }

  isPinned() {
    return this.pinnedAt !== null;
  }

  isDuplicate() {
    return this.duplicateOf !== null;
  }

  isImage() {
    return this.mimeType?.startsWith('image/') || false;
  }

  isVideo() {
    return this.mimeType?.startsWith('video/') || false;
  }

  isPdf() {
    return this.mimeType === 'application/pdf';
  }

  isText() {
    return this.mimeType?.startsWith('text/') || false;
  }

  getPreviewType() {
    if (this.isImage()) return 'image';
    if (this.isVideo()) return 'video';
    if (this.isPdf()) return 'pdf';
    if (this.isText()) return 'text';
    return 'download';
  }

  getDisplaySize() {
    if (this.sizeBytes < 1024) return `${this.sizeBytes} B`;
    if (this.sizeBytes < 1024 * 1024) return `${(this.sizeBytes / 1024).toFixed(1)} KB`;
    if (this.sizeBytes < 1024 * 1024 * 1024) return `${(this.sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(this.sizeBytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }

  // Validation
  validate() {
    const errors = [];

    if (!this.filenameOriginal) {
      errors.push('Filename is required');
    }

    if (!this.clientId) {
      errors.push('Client ID is required');
    }

    if (!this.uploadedBy) {
      errors.push('Uploaded by is required');
    }

    if (this.extension && DocumentEntity.isDangerousExtension(this.extension)) {
      errors.push(`Extension ${this.extension} is not allowed`);
    }

    if (this.sizeBytes && this.sizeBytes > 100 * 1024 * 1024) { // 100MB limit
      errors.push('File size exceeds 100MB limit');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Factory methods
  static createForUpload(uploadData) {
    const filename = uploadData.filename;
    const sanitized = this.sanitizeFilename(filename);
    const extension = this.extractExtension(filename);
    const versionGroup = this.generateVersionGroup(filename);

    return new DocumentEntity({
      ...uploadData,
      filename_original: filename,
      filename_sanitized: sanitized,
      extension,
      version_group: versionGroup,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  }

  softDelete(userId) {
    this.deletedAt = new Date().toISOString();
    this.deletedBy = userId;
    this.updatedAt = new Date().toISOString();
  }

  restore() {
    this.deletedAt = null;
    this.deletedBy = null;
    this.updatedAt = new Date().toISOString();
  }

  pin(userId) {
    this.pinnedAt = new Date().toISOString();
    this.pinnedBy = userId;
    this.updatedAt = new Date().toISOString();
  }

  unpin() {
    this.pinnedAt = null;
    this.pinnedBy = null;
    this.updatedAt = new Date().toISOString();
  }

  rename(newFilename) {
    this.filenameOriginal = newFilename;
    this.filenameSanitized = DocumentEntity.sanitizeFilename(newFilename);
    this.extension = DocumentEntity.extractExtension(newFilename);
    this.versionGroup = DocumentEntity.generateVersionGroup(newFilename);
    this.updatedAt = new Date().toISOString();
  }
}