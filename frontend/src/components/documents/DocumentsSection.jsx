import React from 'react';
import { DocumentList } from './DocumentList';
import { DocumentUploader } from './DocumentUploader';
import { useDocuments } from '../../hooks/useDocuments';

export const DocumentsSection = ({ clientId }) => {
  const { documents, isLoading, error, upload, remove, download } = useDocuments(clientId);

  return (
    <div className='space-y-6'>
      <div>
        <h3 className='text-xl font-bold text-white'>Subir Nuevo Documento</h3>
        <DocumentUploader
          clientId={clientId}
          onUpload={async file => {
            await upload({ file });
          }}
        />
      </div>
      <div>
        <h3 className='text-xl font-bold text-white'>Archivos del Cliente</h3>
        {isLoading && <p className='text-rambla-text-secondary'>Cargando documentos...</p>}
        {error && <p className='text-red-500'>Error: {error.message || String(error)}</p>}
        {!isLoading && !error && (
          <DocumentList
            documents={documents}
            clientId={clientId}
            onDelete={async documentId => {
              await remove(documentId);
            }}
            onDownload={async doc => {
              await download(doc);
            }}
          />
        )}
      </div>
    </div>
  );
};
