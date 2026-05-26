import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { getClientById } from '../api/clients';
import { ScheduleSection } from '../components/schedule/ScheduleSection';
import { DocumentsSection } from '../components/documents/DocumentsSection';
import { BrandIdentitySection } from '../components/brand/BrandIdentitySection';
import { TrendsSection } from '../components/trends/TrendsSection';

// Caché global en memoria para persistir la información básica de clientes entre montajes
const clientCache = new Map();

export const ClientDetailPage = () => {
  const { id: clientId } = useParams();
  const [client, setClient] = useState(() => {
    if (clientId && clientCache.has(clientId)) {
      return clientCache.get(clientId);
    }
    return null;
  });

  const [loading, setLoading] = useState(() => {
    return !(clientId && clientCache.has(clientId));
  });

  const [error, setError] = useState(null);
  const [searchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const activeTab = ['schedule', 'documents', 'identity', 'trends'].includes(requestedTab)
    ? requestedTab
    : 'schedule';

  const [visitedTabs, setVisitedTabs] = useState({
    schedule: false,
    documents: false,
    identity: false,
    trends: false,
  });

  // Reset visited tabs when client changes
  useEffect(() => {
    setVisitedTabs({
      schedule: false,
      documents: false,
      identity: false,
      trends: false,
    });
  }, [clientId]);

  // Mark current tab as visited
  useEffect(() => {
    if (activeTab) {
      setVisitedTabs(prev => ({
        ...prev,
        [activeTab]: true,
      }));
    }
  }, [activeTab]);

  // Trigger window resize event when switching back to schedule tab
  // to ensure FullCalendar recalculates its size beautifully.
  useEffect(() => {
    if (activeTab === 'schedule' && visitedTabs.schedule) {
      const timer = setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [activeTab, visitedTabs.schedule]);

  useEffect(() => {
    const run = async () => {
      try {
        if (!clientCache.has(clientId)) {
          setLoading(true);
        }
        const response = await getClientById(clientId);
        setClient(response.data);
        clientCache.set(clientId, response.data);
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
    <div className="p-1.5 md:p-2 animate-fade-in">
      <div style={{ display: activeTab === 'schedule' ? 'block' : 'none' }}>
        {visitedTabs.schedule && <ScheduleSection clientId={clientId} />}
      </div>
      <div style={{ display: activeTab === 'identity' ? 'block' : 'none' }}>
        {visitedTabs.identity && <BrandIdentitySection clientId={clientId} />}
      </div>
      <div style={{ display: activeTab === 'trends' ? 'block' : 'none' }}>
        {visitedTabs.trends && <TrendsSection clientId={clientId} />}
      </div>
      <div style={{ display: activeTab === 'documents' ? 'block' : 'none' }}>
        {visitedTabs.documents && <DocumentsSection clientId={clientId} />}
      </div>
    </div>
  );
};

