import { useState, useCallback, useRef } from 'react';

/**
 * Hook para manejar el estado global de drag & drop
 * Coordina entre GlobalDropZone y otros componentes
 */
export const useGlobalDragDrop = (onFilesUploaded) => {
  const [isGlobalDragActive, setIsGlobalDragActive] = useState(false);
  const [uploadQueue, setUploadQueue] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const dragCounterRef = useRef(0);

  // Detectar cuando se arrastra algo sobre la ventana
  const handleWindowDragEnter = useCallback((e) => {
    e.preventDefault();
    dragCounterRef.current++;
    
    // Solo activar si son archivos del sistema
    if (e.dataTransfer.types?.includes('Files')) {
      setIsGlobalDragActive(true);
    }
  }, []);

  // Detectar cuando se deja de arrastrar
  const handleWindowDragLeave = useCallback((e) => {
    e.preventDefault();
    dragCounterRef.current--;
    
    if (dragCounterRef.current === 0) {
      setIsGlobalDragActive(false);
    }
  }, []);

  // Prevenir comportamiento por defecto en toda la ventana
  const handleWindowDragOver = useCallback((e) => {
    e.preventDefault();
  }, []);

  // Manejar drop en ventana (fallback)
  const handleWindowDrop = useCallback((e) => {
    e.preventDefault();
    dragCounterRef.current = 0;
    setIsGlobalDragActive(false);
  }, []);

  // Procesar archivos recibidos del GlobalDropZone
  const handleFilesDropped = useCallback(async (files) => {
    const fileArray = Array.from(files);
    
    // Crear objetos de upload con metadata
    const uploadItems = fileArray.map((file, index) => ({
      id: `upload-${Date.now()}-${index}`,
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'pending', // pending, uploading, completed, error
      progress: 0,
      error: null
    }));

    setUploadQueue(prev => [...prev, ...uploadItems]);

    // Procesar uploads uno por uno
    for (const item of uploadItems) {
      try {
        // Actualizar estado a uploading
        setUploadQueue(prev => 
          prev.map(upload => 
            upload.id === item.id 
              ? { ...upload, status: 'uploading' }
              : upload
          )
        );

        // Simular progress (aquí iría la llamada real a la API)
        await uploadFileWithProgress(item, (progress) => {
          setUploadProgress(prev => ({
            ...prev,
            [item.id]: progress
          }));
        });

        // Marcar como completado
        setUploadQueue(prev => 
          prev.map(upload => 
            upload.id === item.id 
              ? { ...upload, status: 'completed', progress: 100 }
              : upload
          )
        );

        // Notificar al componente padre
        onFilesUploaded?.(item);

      } catch (error) {
        // Marcar como error
        setUploadQueue(prev => 
          prev.map(upload => 
            upload.id === item.id 
              ? { ...upload, status: 'error', error: error.message }
              : upload
          )
        );
      }
    }

    // Limpiar queue después de un momento
    setTimeout(() => {
      setUploadQueue(prev => prev.filter(item => item.status !== 'completed'));
      setUploadProgress({});
    }, 3000);
  }, [onFilesUploaded]);

  // Simular upload con progress (reemplazar con API real)
  const uploadFileWithProgress = async (uploadItem, onProgress) => {
    return new Promise((resolve, reject) => {
      // Simular upload progresivo
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 20;
        if (progress >= 100) {
          progress = 100;
          onProgress(100);
          clearInterval(interval);
          resolve();
        } else {
          onProgress(Math.min(progress, 100));
        }
      }, 200 + Math.random() * 300); // Velocidad variable realista
    });
  };

  // Retry upload fallido
  const retryUpload = useCallback((uploadId) => {
    const failedItem = uploadQueue.find(item => item.id === uploadId);
    if (failedItem) {
      handleFilesDropped([failedItem.file]);
    }
  }, [uploadQueue, handleFilesDropped]);

  // Cancelar upload
  const cancelUpload = useCallback((uploadId) => {
    setUploadQueue(prev => prev.filter(item => item.id !== uploadId));
    setUploadProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[uploadId];
      return newProgress;
    });
  }, []);

  // Limpiar queue manualmente
  const clearCompletedUploads = useCallback(() => {
    setUploadQueue(prev => prev.filter(item => 
      item.status !== 'completed' && item.status !== 'error'
    ));
  }, []);

  return {
    // Estado
    isGlobalDragActive,
    uploadQueue,
    uploadProgress,
    
    // Handlers para ventana
    handleWindowDragEnter,
    handleWindowDragLeave, 
    handleWindowDragOver,
    handleWindowDrop,
    
    // Handlers para archivos
    handleFilesDropped,
    retryUpload,
    cancelUpload,
    clearCompletedUploads,
    
    // Utils
    hasActiveUploads: uploadQueue.some(item => item.status === 'uploading'),
    hasErrors: uploadQueue.some(item => item.status === 'error'),
    completedCount: uploadQueue.filter(item => item.status === 'completed').length,
    totalUploads: uploadQueue.length
  };
};