import React, { useRef, useState } from 'react';
import { ArrowUpTrayIcon, DocumentIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { uploadDocument } from '../../api/documents';

export const DocumentUploader = ({ clientId, onUploaded, onUpload }) => {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});

  const validateFile = (file) => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    
    if (file.size > maxSize) {
      return `${file.name} es muy grande. Máximo 10MB permitido.`;
    }
    
    if (!allowedTypes.includes(file.type)) {
      return `${file.name} no es un tipo de archivo permitido.`;
    }
    
    return null;
  };

  const handleFiles = (files) => {
    const fileArray = Array.from(files);
    const validFiles = [];
    const errors = [];

    fileArray.forEach(file => {
      const error = validateFile(file);
      if (error) {
        errors.push(error);
      } else {
        validFiles.push({
          file,
          id: Date.now() + Math.random(),
          name: file.name,
          size: file.size,
          type: file.type
        });
      }
    });

    if (errors.length > 0) {
      setError(errors.join(', '));
    } else {
      setError(null);
    }

    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (fileId) => {
    setSelectedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const uploadFiles = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    setError(null);

    try {
      for (const fileItem of selectedFiles) {
        setUploadProgress(prev => ({ ...prev, [fileItem.id]: 0 }));
        
        if (onUpload) {
          await onUpload(fileItem.file);
        } else {
          await uploadDocument(clientId, fileItem.file);
        }
        
        setUploadProgress(prev => ({ ...prev, [fileItem.id]: 100 }));
      }

      if (onUploaded) onUploaded();
      setSelectedFiles([]);
      setUploadProgress({});
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const onInputChange = e => handleFiles(e.target.files);
  
  const onDrop = e => {
    e.preventDefault();
    setIsDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const onDragOver = e => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const onDragLeave = e => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const formatFileSize = (bytes) => {
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  };

  const getFileIcon = (type) => {
    if (type.includes('image')) return '🖼️';
    if (type.includes('pdf')) return '📄';
    if (type.includes('word')) return '📝';
    return '📎';
  };

  return (
    <div className="space-y-4">
      {/* Área de drag & drop */}
      <motion.div
        className={`relative rounded-lg border-2 border-dashed transition-all duration-300 ${
          isDragOver
            ? 'border-primary-500 bg-primary-500/10'
            : 'border-white/20 hover:border-white/40'
        } ${uploading ? 'pointer-events-none opacity-50' : ''}`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        whileHover={{ scale: 1.01 }}
        transition={{ duration: 0.2 }}
      >
        <div className="px-6 py-10 text-center">
          <motion.div
            animate={{ 
              scale: isDragOver ? 1.1 : 1,
              rotate: isDragOver ? 5 : 0 
            }}
            transition={{ duration: 0.2 }}
          >
            <ArrowUpTrayIcon className={`mx-auto h-12 w-12 ${
              isDragOver ? 'text-primary-400' : 'text-gray-400'
            }`} />
          </motion.div>
          
          <div className="mt-4">
            <label
              htmlFor="file-upload"
              className="cursor-pointer rounded-md font-semibold text-primary-500 
                         hover:text-primary-400 transition-colors"
            >
              <span className="text-lg">
                {uploading ? 'Subiendo archivos...' : isDragOver ? '¡Suelta los archivos aquí!' : 'Seleccionar archivos'}
              </span>
              <input
                id="file-upload"
                name="file-upload"
                type="file"
                multiple
                ref={inputRef}
                className="sr-only"
                onChange={onInputChange}
                disabled={uploading}
              />
            </label>
            <p className="mt-2 text-sm text-gray-400">
              o arrastra y suelta archivos aquí
            </p>
          </div>
          
          <p className="mt-4 text-xs text-gray-500">
            PNG, JPG, GIF, PDF, DOC, DOCX hasta 10MB
          </p>
          
          {isDragOver && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 text-primary-400 font-medium"
            >
              ✨ Archivos listos para subir
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Lista de archivos seleccionados */}
      <AnimatePresence>
        {selectedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-white">
                Archivos seleccionados ({selectedFiles.length})
              </h4>
              <div className="flex space-x-2">
                <motion.button
                  onClick={() => setSelectedFiles([])}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="text-xs text-gray-400 hover:text-red-400 transition-colors"
                  disabled={uploading}
                >
                  Limpiar todo
                </motion.button>
                <motion.button
                  onClick={uploadFiles}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={uploading || selectedFiles.length === 0}
                  className="px-3 py-1 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 
                             text-white text-xs rounded-md transition-colors"
                >
                  {uploading ? 'Subiendo...' : 'Subir archivos'}
                </motion.button>
              </div>
            </div>

            <div className="max-h-40 overflow-y-auto space-y-2">
              {selectedFiles.map((fileItem) => (
                <motion.div
                  key={fileItem.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center justify-between p-3 bg-surface-soft rounded-lg border border-white/10"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{getFileIcon(fileItem.type)}</span>
                    <div>
                      <p className="text-sm font-medium text-white truncate max-w-xs">
                        {fileItem.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatFileSize(fileItem.size)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {uploadProgress[fileItem.id] !== undefined && (
                      <div className="w-16 bg-gray-700 rounded-full h-1">
                        <motion.div
                          className="bg-primary-500 h-1 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${uploadProgress[fileItem.id]}%` }}
                        />
                      </div>
                    )}
                    
                    {!uploading && (
                      <motion.button
                        onClick={() => removeFile(fileItem.id)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mensajes de error */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg"
        >
          <p className="text-sm text-red-400">{error}</p>
        </motion.div>
      )}
    </div>
  );
};
