import React, { useEffect, useState, useCallback } from 'react';
import { DocumentList } from './DocumentList';
import { DocumentUploader } from './DocumentUploader';
import { getDocumentsForClient } from '../../api/documents';

export const DocumentsSection = ({ clientId }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDocuments = useCallback(async () => {
    try {
      setLoading(true);
  const { data: docs } = await getDocumentsForClient(clientId);
  setDocuments(docs || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handleUploaded = () => {
    loadDocuments();
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white">Subir Nuevo Documento</h3>
        <DocumentUploader clientId={clientId} onUploaded={handleUploaded} />
      </div>
      <div>
        <h3 className="text-xl font-bold text-white">Archivos del Cliente</h3>
        {loading && <p className="text-rambla-text-secondary">Cargando documentos...</p>}
        {error && <p className="text-red-500">Error: {error}</p>}
        {!loading && !error && <DocumentList documents={documents} />}
      </div>
    </div>
  );
};
