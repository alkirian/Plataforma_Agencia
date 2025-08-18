import { useState, useMemo, useCallback } from 'react';
import { VIRTUAL_FOLDERS } from '../utils/virtualFolders';

const STORAGE_KEY = 'grid_folders_custom';

// Cargar carpetas personalizadas del localStorage
const loadCustomFolders = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch (error) {
    console.warn('Error loading custom folders:', error);
    return {};
  }
};

// Guardar carpetas personalizadas en localStorage
const saveCustomFolders = (folders) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(folders));
  } catch (error) {
    console.warn('Error saving custom folders:', error);
  }
};

export const useGridFolders = (documents = []) => {
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [customFolders, setCustomFolders] = useState(() => loadCustomFolders());

  // Combinar carpetas predefinidas con personalizadas
  const allFolders = useMemo(() => ({
    ...VIRTUAL_FOLDERS,
    ...customFolders
  }), [customFolders]);

  // Organizar documentos en carpetas y calcular conteos
  const foldersWithCounts = useMemo(() => {
    const folders = Object.values(allFolders).map(folder => {
      const matchingDocs = documents.filter(doc => folder.filter(doc));
      return {
        ...folder,
        count: matchingDocs.length,
        documents: matchingDocs
      };
    });

    // Filtrar carpetas vacías (excepto las personalizadas que siempre se muestran)
    return folders.filter(folder => folder.count > 0 || folder.custom);
  }, [documents, allFolders]);

  // Obtener carpeta actual
  const currentFolder = useMemo(() => {
    return selectedFolderId ? allFolders[selectedFolderId] : null;
  }, [selectedFolderId, allFolders]);

  // Obtener documentos de la carpeta actual
  const currentDocuments = useMemo(() => {
    if (!selectedFolderId || !currentFolder) return [];
    return documents.filter(doc => currentFolder.filter(doc));
  }, [selectedFolderId, currentFolder, documents]);

  // Seleccionar carpeta
  const selectFolder = useCallback((folderId) => {
    setSelectedFolderId(folderId);
  }, []);

  // Volver a la vista principal
  const goBack = useCallback(() => {
    setSelectedFolderId(null);
  }, []);

  // Crear carpeta personalizada
  const createCustomFolder = useCallback((folderData) => {
    const newCustomFolders = {
      ...customFolders,
      [folderData.id]: folderData
    };
    
    setCustomFolders(newCustomFolders);
    saveCustomFolders(newCustomFolders);
  }, [customFolders]);

  // Editar carpeta personalizada
  const editCustomFolder = useCallback((folderId, updates) => {
    const updatedFolders = {
      ...customFolders,
      [folderId]: {
        ...customFolders[folderId],
        ...updates
      }
    };
    
    setCustomFolders(updatedFolders);
    saveCustomFolders(updatedFolders);
  }, [customFolders]);

  // Eliminar carpeta personalizada
  const deleteCustomFolder = useCallback((folderId) => {
    const { [folderId]: removed, ...remaining } = customFolders;
    
    setCustomFolders(remaining);
    saveCustomFolders(remaining);
    
    // Si era la carpeta seleccionada, volver a la vista principal
    if (selectedFolderId === folderId) {
      setSelectedFolderId(null);
    }
  }, [customFolders, selectedFolderId]);

  // Obtener estadísticas
  const stats = useMemo(() => {
    const totalDocuments = documents.length;
    const organizedDocuments = foldersWithCounts.reduce((sum, folder) => sum + folder.count, 0);
    
    return {
      totalFolders: foldersWithCounts.length,
      totalDocuments,
      organizedDocuments,
      unorganizedDocuments: Math.max(0, totalDocuments - organizedDocuments),
      customFoldersCount: Object.keys(customFolders).length
    };
  }, [documents.length, foldersWithCounts, customFolders]);

  return {
    // Estado
    folders: foldersWithCounts,
    selectedFolderId,
    currentFolder,
    currentDocuments,
    customFolders,
    stats,

    // Acciones
    selectFolder,
    goBack,
    createCustomFolder,
    editCustomFolder,
    deleteCustomFolder,

    // Utilidades
    isInFolderView: !!selectedFolderId,
    isEmpty: documents.length === 0,
    hasCustomFolders: Object.keys(customFolders).length > 0
  };
};