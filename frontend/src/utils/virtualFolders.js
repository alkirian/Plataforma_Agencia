// src/utils/virtualFolders.js
// Sistema de carpetas virtuales para organización visual de documentos

/**
 * Configuración de carpetas virtuales predefinidas
 */
export const VIRTUAL_FOLDERS = {
  // Carpetas por tipo de archivo
  images: {
    id: 'images',
    name: '📸 Imágenes',
    description: 'Fotos, logos, gráficos',
    icon: '🖼️',
    color: '#10b981',
    filter: (doc) => doc.file_type?.startsWith('image/'),
    sortOrder: 1
  },
  documents: {
    id: 'documents',
    name: '📄 Documentos',
    description: 'PDFs, Word, Excel',
    icon: '📄',
    color: '#3b82f6',
    filter: (doc) => doc.file_type?.includes('pdf') || 
                    doc.file_type?.includes('word') || 
                    doc.file_type?.includes('excel') || 
                    doc.file_type?.includes('text'),
    sortOrder: 2
  },
  contracts: {
    id: 'contracts',
    name: '📋 Contratos',
    description: 'Documentos contractuales',
    icon: '📋',
    color: '#8b5cf6',
    filter: (doc) => /contrat|agreement|acuerdo/i.test(doc.file_name),
    sortOrder: 3
  },
  proposals: {
    id: 'proposals',
    name: '💼 Propuestas',
    description: 'Propuestas comerciales',
    icon: '💼',
    color: '#f59e0b',
    filter: (doc) => /propuesta|proposal|quote|cotiz/i.test(doc.file_name),
    sortOrder: 4
  },
  marketing: {
    id: 'marketing',
    name: '🎨 Marketing',
    description: 'Material publicitario',
    icon: '🎨',
    color: '#ec4899',
    filter: (doc) => /marketing|publicidad|campaign|social|redes/i.test(doc.file_name),
    sortOrder: 5
  },
  reports: {
    id: 'reports',
    name: '📊 Reportes',
    description: 'Informes y análisis',
    icon: '📊',
    color: '#06b6d4',
    filter: (doc) => /report|informe|analisis|dashboard|metrics/i.test(doc.file_name),
    sortOrder: 6
  },
  others: {
    id: 'others',
    name: '📁 Otros',
    description: 'Documentos sin categorizar',
    icon: '📁',
    color: '#6b7280',
    filter: () => true, // Catch-all
    sortOrder: 99
  }
};

/**
 * Organiza documentos en carpetas virtuales
 */
export const organizeDocumentsIntoVirtualFolders = (documents = []) => {
  const folders = {};
  const uncategorized = [];

  // Inicializar carpetas
  Object.values(VIRTUAL_FOLDERS).forEach(folder => {
    folders[folder.id] = {
      ...folder,
      documents: [],
      count: 0
    };
  });

  // Clasificar documentos
  documents.forEach(doc => {
    let categorized = false;
    
    // Intentar clasificar en carpetas específicas (excluyendo 'others')
    Object.values(VIRTUAL_FOLDERS).forEach(folder => {
      if (folder.id !== 'others' && folder.filter(doc)) {
        folders[folder.id].documents.push(doc);
        folders[folder.id].count++;
        categorized = true;
      }
    });

    // Si no se categorizó, va a 'others'
    if (!categorized) {
      folders.others.documents.push(doc);
      folders.others.count++;
    }
  });

  // Filtrar carpetas vacías y ordenar
  const activeFolders = Object.values(folders)
    .filter(folder => folder.count > 0)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return {
    folders: activeFolders,
    totalDocuments: documents.length,
    folderMap: folders
  };
};

/**
 * Busca documentos en todas las carpetas virtuales
 */
export const searchInVirtualFolders = (folders, searchTerm) => {
  if (!searchTerm.trim()) return folders;

  const lowerSearch = searchTerm.toLowerCase();
  
  return folders.map(folder => ({
    ...folder,
    documents: folder.documents.filter(doc =>
      doc.file_name.toLowerCase().includes(lowerSearch) ||
      doc.description?.toLowerCase().includes(lowerSearch)
    ),
    count: folder.documents.filter(doc =>
      doc.file_name.toLowerCase().includes(lowerSearch) ||
      doc.description?.toLowerCase().includes(lowerSearch)
    ).length
  })).filter(folder => folder.count > 0);
};

/**
 * Obtiene estadísticas de las carpetas virtuales
 */
export const getVirtualFolderStats = (folders) => {
  return {
    totalFolders: folders.length,
    totalDocuments: folders.reduce((sum, folder) => sum + folder.count, 0),
    largestFolder: folders.reduce((max, folder) => 
      folder.count > max.count ? folder : max, { count: 0 }
    ),
    folderDistribution: folders.map(folder => ({
      name: folder.name,
      count: folder.count,
      percentage: folders.reduce((sum, f) => sum + f.count, 0) > 0 
        ? ((folder.count / folders.reduce((sum, f) => sum + f.count, 0)) * 100).toFixed(1)
        : 0
    }))
  };
};

/**
 * Configuración personalizable de carpetas (guardada en localStorage)
 */
export const STORAGE_KEY = 'virtual_folders_config';

export const saveVirtualFoldersConfig = (config) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (error) {
    console.warn('No se pudo guardar la configuración de carpetas:', error);
  }
};

export const loadVirtualFoldersConfig = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    console.warn('No se pudo cargar la configuración de carpetas:', error);
    return null;
  }
};

/**
 * Crea una carpeta virtual personalizada
 */
export const createCustomVirtualFolder = (name, description, filter, color = '#6b7280') => {
  const id = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
  return {
    id,
    name: `📁 ${name}`,
    description,
    icon: '📁',
    color,
    filter: typeof filter === 'string' 
      ? (doc) => new RegExp(filter, 'i').test(doc.file_name)
      : filter,
    sortOrder: 50,
    custom: true
  };
};

/**
 * Obtiene sugerencias de carpetas basadas en los nombres de archivos
 */
export const suggestVirtualFolders = (documents = []) => {
  const suggestions = new Map();
  
  documents.forEach(doc => {
    const fileName = doc.file_name.toLowerCase();
    
    // Buscar patrones comunes
    const patterns = [
      { regex: /invoice|factura/i, name: 'Facturas', icon: '🧾' },
      { regex: /receipt|recibo/i, name: 'Recibos', icon: '🧾' },
      { regex: /legal|juridico/i, name: 'Documentos Legales', icon: '⚖️' },
      { regex: /tax|impuesto/i, name: 'Documentos Fiscales', icon: '💰' },
      { regex: /meeting|reunion/i, name: 'Reuniones', icon: '👥' },
      { regex: /presentation|presentacion/i, name: 'Presentaciones', icon: '📊' }
    ];

    patterns.forEach(pattern => {
      if (pattern.regex.test(fileName)) {
        if (!suggestions.has(pattern.name)) {
          suggestions.set(pattern.name, {
            name: pattern.name,
            icon: pattern.icon,
            count: 0,
            documents: []
          });
        }
        suggestions.get(pattern.name).count++;
        suggestions.get(pattern.name).documents.push(doc);
      }
    });
  });

  // Solo sugerir carpetas con al menos 2 documentos
  return Array.from(suggestions.values()).filter(s => s.count >= 2);
};