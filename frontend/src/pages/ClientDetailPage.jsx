import React, { useState, useEffect, Fragment } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getClientById } from '../api/clients'; // Nombre corregido
import { ScheduleSection } from '../components/schedule/ScheduleSection';
import { DocumentsSection } from '../components/documents/DocumentsSection';
import { Dialog, Transition } from '@headlessui/react';
import { useMutation } from '@tanstack/react-query';
import { generateIdeas } from '../api/ai';
import toast from 'react-hot-toast';
import { createScheduleItem } from '../api/schedule';
import AIIdeasPreview from '../components/schedule/AIIdeasPreview';

export const ClientDetailPage = () => {
  const { id: clientId } = useParams();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('schedule');
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Handler para generar ideas
  const handleGenerateIdeas = async (prompt) => {
    const ideas = await generateIdeas(clientId, { 
      userPrompt: prompt, 
      monthContext: [] 
    });
    return Array.isArray(ideas) ? ideas : (ideas?.data || []);
  };

  // Handler para agregar idea individual al calendario
  const handleAddIdea = async (ideaData) => {
    await createScheduleItem(clientId, ideaData);
  };

  // Handler cuando se agregan ideas al calendario
  const handleIdeasGenerated = (addedIdeas) => {
    setRefreshKey(k => k + 1);
  };

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        // Accedemos a la propiedad .data de la respuesta
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

  if (loading) return <div className='text-center text-text-muted'>Cargando...</div>;
  if (error) return <div className='text-center text-red-500'>Error: {error}</div>;
  if (!client) return <div>Cliente no encontrado.</div>;

  return (
    <div>
      <div className='mb-6'>
        <Link
          to='/dashboard'
          className='text-sm text-text-muted hover:text-text-primary hover:underline transition-colors duration-200'
        >
          &larr; Volver al Dashboard
        </Link>
        <div className='flex items-center justify-between'>
          <h1 className='text-4xl font-bold text-cyber-gradient'>{client.name}</h1>
          <button
            onClick={() => setIsAIModalOpen(true)}
            className='btn-cyber px-4 py-2 text-sm font-semibold hover-cyber-glow'
          >
            ✨ Generar con IA
          </button>
        </div>
        <p className='text-text-muted'>{client.industry || 'No especificada'}</p>
      </div>
      <hr className='border-[color:var(--color-border-subtle)]' />
      <div className='mt-4'>
        <div className='mb-4 flex gap-2'>
          <button
            onClick={() => setActiveTab('schedule')}
            className={`rounded-md px-4 py-2 text-sm font-medium ${
              activeTab === 'schedule'
                ? 'bg-surface-strong text-text-primary shadow-halo'
                : 'border border-[color:var(--color-border-subtle)] bg-surface-soft text-text-muted hover:border-[color:var(--color-border-strong)] hover:text-text-primary'
            }`}
          >
            Cronograma
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`rounded-md px-4 py-2 text-sm font-medium ${
              activeTab === 'documents'
                ? 'bg-surface-strong text-text-primary shadow-halo'
                : 'border border-[color:var(--color-border-subtle)] bg-surface-soft text-text-muted hover:border-[color:var(--color-border-strong)] hover:text-text-primary'
            }`}
          >
            Documentos
          </button>
        </div>
        <div className='card rounded-xl p-4'>
          {activeTab === 'schedule' ? (
            <ScheduleSection key={refreshKey} clientId={clientId} />
          ) : (
            <DocumentsSection clientId={clientId} />
          )}
        </div>
      </div>

      {/* AI Ideas Preview Modal */}
      <AIIdeasPreview
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        clientId={clientId}
        onGenerateIdeas={handleGenerateIdeas}
        onAddIdea={handleAddIdea}
        onIdeasGenerated={handleIdeasGenerated}
      />
    </div>
  );
};
