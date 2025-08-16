import React, { useRef, useState } from 'react';
import { ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import { uploadDocument } from '../../api/documents';

export const DocumentUploader = ({ clientId, onUploaded, onUpload }) => {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleFiles = async (files) => {
    const file = files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      setError(null);
      if (onUpload) {
        await onUpload(file);
      } else {
        await uploadDocument(clientId, file);
      }
      if (onUploaded) onUploaded();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const onInputChange = (e) => handleFiles(e.target.files);
  const onDrop = (e) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div
      className="mt-4 flex justify-center rounded-lg border border-dashed border-rambla-border px-6 py-10"
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
    >
      <div className="text-center">
        <ArrowUpTrayIcon className="mx-auto h-12 w-12 text-rambla-text-secondary" />
        <div className="mt-4 flex text-sm leading-6 text-rambla-text-secondary">
          <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-semibold text-primary-500 focus-within:outline-none hover:text-primary-400">
            <span>{uploading ? 'Subiendo...' : 'Sube un archivo'}</span>
            <input id="file-upload" name="file-upload" type="file" ref={inputRef} className="sr-only" onChange={onInputChange} />
          </label>
          <p className="pl-1">o arrástralo aquí</p>
        </div>
        <p className="text-xs leading-5 text-rambla-text-secondary">PNG, JPG, PDF hasta 10MB</p>
        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
      </div>
    </div>
  );
};
