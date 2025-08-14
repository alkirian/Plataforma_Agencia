import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchClientById } from '../api/clients';
import { ScheduleSection } from '../components/schedule/ScheduleSection';
import { DocumentsSection } from '../components/documents/DocumentsSection';

export const ClientDetailPage = () => {
  const { id: clientId } = useParams();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('schedule');

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        const clientData = await fetchClientById(clientId);
        setClient(clientData);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [clientId]);

  if (loading) return <div className="text-center text-rambla-text-secondary">Cargando...</div>;
  if (error) return <div className="text-center text-red-500">Error: {error}</div>;
  if (!client) return <div>Cliente no encontrado.</div>;

  return (
    <div>
      <div className="mb-6">
        <Link to="/dashboard" className="text-sm text-rambla-accent hover:underline">&larr; Volver al Dashboard</Link>
        <h1 className="text-4xl font-bold text-white">{client.name}</h1>
        <p className="text-rambla-text-secondary">{client.industry || 'No especificada'}</p>
      </div>
      <hr className="border-rambla-border" />
      <div className="mt-4">
        <div className="mb-4 flex gap-2">
          <button
            onClick={() => setActiveTab('schedule')}
            className={`rounded-md px-4 py-2 text-sm font-medium ${
              activeTab === 'schedule'
                ? 'bg-rambla-accent text-white'
                : 'border border-rambla-border bg-rambla-surface text-rambla-text-secondary hover:border-rambla-accent'
            }`}
          >
            Cronograma
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`rounded-md px-4 py-2 text-sm font-medium ${
              activeTab === 'documents'
                ? 'bg-rambla-accent text-white'
                : 'border border-rambla-border bg-rambla-surface text-rambla-text-secondary hover:border-rambla-accent'
            }`}
          >
            Documentos
          </button>
        </div>
        <div className="rounded-lg border border-rambla-border bg-rambla-surface p-4">
          {activeTab === 'schedule' ? (
            <ScheduleSection clientId={clientId} />
          ) : (
            <DocumentsSection clientId={clientId} />
          )}
        </div>
      </div>
    </div>
  );
};
