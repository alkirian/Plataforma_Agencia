import React from 'react';
import { DocumentArrowDownIcon, TrashIcon } from '@heroicons/react/24/outline';

export const DocumentList = ({ documents = [] }) => {
  return (
    <div className="mt-6 flow-root">
      <ul role="list" className="-my-4 divide-y divide-rambla-border">
        {documents.length === 0 && (
          <li className="py-4 text-rambla-text-secondary">No hay documentos aún.</li>
        )}
        {documents.map((doc) => (
          <li key={doc.id} className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <div className="h-10 w-10 flex-shrink-0 rounded-lg bg-rambla-bg flex items-center justify-center">
                <span className="text-xs font-bold text-rambla-accent">
                  {(doc.file_type || '').toUpperCase().includes('PDF') ? 'PDF' : 'DOC'}
                </span>
              </div>
              <div>
                <p className="font-semibold text-white">{doc.file_name}</p>
                <p className="text-sm text-rambla-text-secondary">
                  {doc.file_size ? (doc.file_size / 1024 / 1024).toFixed(2) + ' MB' : ''}
                  {doc.created_at ? ' - ' + new Date(doc.created_at).toLocaleDateString() : ''}
                </p>
              </div>
            </div>
            <div className="flex space-x-2">
              <button className="text-rambla-text-secondary hover:text-rambla-accent" title="Descargar">
                <DocumentArrowDownIcon className="h-5 w-5" />
              </button>
              <button className="text-rambla-text-secondary hover:text-red-500" title="Eliminar">
                <TrashIcon className="h-5 w-5" />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
