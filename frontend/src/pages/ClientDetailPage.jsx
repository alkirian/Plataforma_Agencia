import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { getClientById } from '../api/clients';
import { ScheduleSection } from '../components/schedule/ScheduleSection';
import { DocumentsSection } from '../components/documents/DocumentsSection';
import { BrandIdentitySection } from '../components/brand/BrandIdentitySection';
import { TrendsSection } from '../components/trends/TrendsSection';

export const ClientDetailPage = () => {
  const { id: clientId } = useParams();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const activeTab = ['schedule', 'documents', 'identity', 'trends'].includes(requestedTab)
    ? requestedTab
    : 'schedule';

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        const response = await getClientById(clientId);
        setClient(response.data);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [clientId]);

  if (loading) return <div className="text-center text-text-muted">Cargando...</div>;
  if (error) return <div className="text-center text-red-500">Error: {error}</div>;
  if (!client) return <div>Cliente no encontrado.</div>;

  return (
    <div className="p-1.5 md:p-2">
      {activeTab === 'schedule' ? (
        <ScheduleSection clientId={clientId} />
      ) : activeTab === 'identity' ? (
        <BrandIdentitySection clientId={clientId} />
      ) : activeTab === 'trends' ? (
        <TrendsSection clientId={clientId} />
      ) : (
        <DocumentsSection clientId={clientId} />
      )}
    </div>
  );
};

