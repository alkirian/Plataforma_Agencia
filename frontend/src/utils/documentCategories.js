/**
 * Document Categorization System
 * Provides utilities for categorizing, grouping, and managing documents
 * in a visual folder structure for the agency platform.
 */

// Document categories configuration with icons and colors
export const DOCUMENT_CATEGORIES = {
  documents: {
    key: 'documents',
    label: 'Documentos',
    icon: '📄',
    iconClass: 'document-text',
    color: 'slate-500',
    bgColor: 'bg-slate-50/50',
    borderColor: 'border-slate-300/60',
    textColor: 'text-slate-600',
    mimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/rtf',
      'application/rtf',
      'application/vnd.oasis.opendocument.text'
    ],
    extensions: ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt']
  },
  images: {
    key: 'images',
    label: 'Imágenes',
    icon: '📸',
    iconClass: 'photo',
    color: 'emerald-500',
    bgColor: 'bg-emerald-50/50',
    borderColor: 'border-emerald-300/60',
    textColor: 'text-emerald-600',
    mimeTypes: [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/svg+xml',
      'image/webp',
      'image/bmp',
      'image/tiff',
      'image/ico'
    ],
    extensions: ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp', 'tiff', 'tif', 'ico']
  },
  videos: {
    key: 'videos',
    label: 'Videos',
    icon: '🎬',
    iconClass: 'film',
    color: 'violet-500',
    bgColor: 'bg-violet-50/50',
    borderColor: 'border-violet-300/60',
    textColor: 'text-violet-600',
    mimeTypes: [
      'video/mp4',
      'video/avi',
      'video/quicktime',
      'video/webm',
      'video/x-msvideo',
      'video/x-ms-wmv',
      'video/3gpp',
      'video/x-flv'
    ],
    extensions: ['mp4', 'avi', 'mov', 'webm', 'wmv', '3gp', 'flv', 'mkv', 'm4v']
  },
  spreadsheets: {
    key: 'spreadsheets',
    label: 'Hojas de cálculo',
    icon: '📊',
    iconClass: 'table-cells',
    color: 'teal-500',
    bgColor: 'bg-teal-50/50',
    borderColor: 'border-teal-300/60',
    textColor: 'text-teal-600',
    mimeTypes: [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      'application/vnd.oasis.opendocument.spreadsheet'
    ],
    extensions: ['xls', 'xlsx', 'csv', 'ods']
  },
  presentations: {
    key: 'presentations',
    label: 'Presentaciones',
    icon: '📋',
    iconClass: 'presentation-chart-bar',
    color: 'amber-500',
    bgColor: 'bg-amber-50/50',
    borderColor: 'border-amber-300/60',
    textColor: 'text-amber-600',
    mimeTypes: [
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.oasis.opendocument.presentation'
    ],
    extensions: ['ppt', 'pptx', 'key', 'odp']
  },
  archives: {
    key: 'archives',
    label: 'Archivos',
    icon: '🗜️',
    iconClass: 'archive-box',
    color: 'stone-500',
    bgColor: 'bg-stone-50/50',
    borderColor: 'border-stone-300/60',
    textColor: 'text-stone-600',
    mimeTypes: [
      'application/zip',
      'application/x-rar-compressed',
      'application/x-7z-compressed',
      'application/x-tar',
      'application/gzip',
      'application/x-gzip'
    ],
    extensions: ['zip', 'rar', '7z', 'tar', 'gz', 'bz2']
  },
  others: {
    key: 'others',
    label: 'Otros',
    icon: '📁',
    iconClass: 'folder',
    color: 'gray-500',
    bgColor: 'bg-gray-50/50',
    borderColor: 'border-gray-300/60',
    textColor: 'text-gray-600',
    mimeTypes: [],
    extensions: []
  }
};

/**
 * Extracts file extension from filename
 * @param {string} filename - Original filename
 * @returns {string} File extension in lowercase
 */
const getFileExtension = (filename) => {
  if (!filename || typeof filename !== 'string') return '';
  const lastDotIndex = filename.lastIndexOf('.');
  if (lastDotIndex === -1 || lastDotIndex === filename.length - 1) return '';
  return filename.slice(lastDotIndex + 1).toLowerCase();
};

/**
 * Categorizes a single document based on mimeType and file extension
 * @param {Object} document - Document object with mimeType and filenameOriginal
 * @returns {string} Category key
 */
export const categorizeDocument = (document) => {
  if (!document) return 'others';

  const { mimeType, filenameOriginal } = document;
  const extension = getFileExtension(filenameOriginal);

  // Check each category (excluding 'others' as it's the fallback)
  const categories = Object.values(DOCUMENT_CATEGORIES).filter(cat => cat.key !== 'others');
  
  for (const category of categories) {
    // Priority 1: Check mimeType
    if (mimeType && category.mimeTypes.includes(mimeType.toLowerCase())) {
      return category.key;
    }
    
    // Priority 2: Check file extension
    if (extension && category.extensions.includes(extension)) {
      return category.key;
    }
  }

  // Fallback to 'others'
  return 'others';
};

/**
 * Groups an array of documents by category
 * @param {Array} documents - Array of document objects
 * @param {string} searchQuery - Optional search query to filter documents
 * @returns {Object} Object with category keys and arrays of documents
 */
export const groupDocumentsByCategory = (documents, searchQuery = '') => {
  if (!Array.isArray(documents)) return {};

  // Initialize grouped object with empty arrays for each category
  const grouped = {};
  Object.keys(DOCUMENT_CATEGORIES).forEach(key => {
    grouped[key] = [];
  });

  // Filter documents by search query if provided
  let filteredDocuments = documents;
  if (searchQuery && searchQuery.trim()) {
    const query = searchQuery.toLowerCase().trim();
    filteredDocuments = documents.filter(doc => 
      doc.filenameOriginal && 
      doc.filenameOriginal.toLowerCase().includes(query)
    );
  }

  // Group documents by category
  filteredDocuments.forEach(document => {
    try {
      const category = categorizeDocument(document);
      if (grouped[category]) {
        grouped[category].push(document);
      } else {
        // Fallback to 'others' if category doesn't exist
        grouped.others.push(document);
      }
    } catch (error) {
      console.warn('Error categorizing document:', document, error);
      // Add to 'others' on error
      grouped.others.push(document);
    }
  });

  return grouped;
};

/**
 * Searches documents within grouped categories
 * @param {Object} groupedDocuments - Documents grouped by category
 * @param {string} searchQuery - Search query
 * @returns {Object} Filtered grouped documents
 */
export const searchDocumentsInCategories = (groupedDocuments, searchQuery) => {
  if (!searchQuery || !searchQuery.trim()) return groupedDocuments;

  const query = searchQuery.toLowerCase().trim();
  const filteredGroups = {};

  Object.keys(groupedDocuments).forEach(categoryKey => {
    const documents = groupedDocuments[categoryKey];
    const filteredDocs = documents.filter(doc => 
      doc.filenameOriginal && 
      doc.filenameOriginal.toLowerCase().includes(query)
    );

    // Only include categories that have matching documents
    if (filteredDocs.length > 0) {
      filteredGroups[categoryKey] = filteredDocs;
    }
  });

  return filteredGroups;
};

/**
 * Gets statistics for each category
 * @param {Object} groupedDocuments - Documents grouped by category
 * @returns {Object} Statistics object with count and total size per category
 */
export const getCategoryStats = (groupedDocuments) => {
  const stats = {};

  Object.keys(groupedDocuments).forEach(categoryKey => {
    const documents = groupedDocuments[categoryKey];
    const count = documents.length;
    const totalSize = documents.reduce((sum, doc) => {
      const size = doc.sizeBytes || 0;
      return sum + (typeof size === 'number' ? size : 0);
    }, 0);

    stats[categoryKey] = {
      count,
      totalSize,
      formattedSize: formatFileSize(totalSize)
    };
  });

  return stats;
};

/**
 * Formats file size from bytes to human-readable format
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted size string
 */
export const formatFileSize = (bytes) => {
  if (!bytes || typeof bytes !== 'number' || bytes < 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  // Format to 1 decimal place for sizes >= 1KB, no decimals for bytes
  const formattedSize = unitIndex === 0 
    ? size.toString() 
    : size.toFixed(1);

  return `${formattedSize} ${units[unitIndex]}`;
};

/**
 * Gets the icon for a specific category
 * @param {string} categoryKey - Category key
 * @returns {string} Icon emoji or default folder icon
 */
export const getCategoryIcon = (categoryKey) => {
  const category = DOCUMENT_CATEGORIES[categoryKey];
  return category ? category.icon : DOCUMENT_CATEGORIES.others.icon;
};

/**
 * Gets the color class for a specific category
 * @param {string} categoryKey - Category key
 * @returns {string} Tailwind color class
 */
export const getCategoryColor = (categoryKey) => {
  const category = DOCUMENT_CATEGORIES[categoryKey];
  return category ? category.color : DOCUMENT_CATEGORIES.others.color;
};

/**
 * Gets category configuration object
 * @param {string} categoryKey - Category key
 * @returns {Object} Category configuration
 */
export const getCategoryConfig = (categoryKey) => {
  return DOCUMENT_CATEGORIES[categoryKey] || DOCUMENT_CATEGORIES.others;
};

/**
 * Gets all category keys except 'others'
 * @returns {Array} Array of category keys
 */
export const getMainCategoryKeys = () => {
  return Object.keys(DOCUMENT_CATEGORIES).filter(key => key !== 'others');
};

/**
 * Counts total documents across all categories
 * @param {Object} groupedDocuments - Documents grouped by category
 * @returns {number} Total document count
 */
export const getTotalDocumentCount = (groupedDocuments) => {
  return Object.values(groupedDocuments).reduce((total, docs) => total + docs.length, 0);
};

/**
 * Gets documents sorted by creation date within categories
 * @param {Object} groupedDocuments - Documents grouped by category
 * @param {string} sortOrder - 'asc' or 'desc'
 * @returns {Object} Grouped documents with sorted arrays
 */
export const sortDocumentsInCategories = (groupedDocuments, sortOrder = 'desc') => {
  const sortedGroups = {};

  Object.keys(groupedDocuments).forEach(categoryKey => {
    const documents = [...groupedDocuments[categoryKey]];
    documents.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0);
      const dateB = new Date(b.createdAt || 0);
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });
    sortedGroups[categoryKey] = documents;
  });

  return sortedGroups;
};

// Export default object for convenience
export default {
  DOCUMENT_CATEGORIES,
  categorizeDocument,
  groupDocumentsByCategory,
  searchDocumentsInCategories,
  getCategoryStats,
  formatFileSize,
  getCategoryIcon,
  getCategoryColor,
  getCategoryConfig,
  getMainCategoryKeys,
  getTotalDocumentCount,
  sortDocumentsInCategories
};