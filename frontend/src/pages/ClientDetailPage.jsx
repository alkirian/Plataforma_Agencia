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

export const ClientDetailPage = () => {
  const { id: clientId } = useParams();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('schedule');
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const aiMutation = useMutation({
    mutationFn: () => toast.promise(
      generateIdeas(clientId, { userPrompt: aiPrompt, monthContext: [] }),
      {
        loading: 'Nuestro asistente está creando... 🧠',
        success: '¡Ideas generadas! Añadiendo al calendario...',
        error: (e) => e.message || 'No se pudieron generar ideas',
      }
    ),
    onSuccess: async (response) => {
      const ideas = response.data || [];
      for (const idea of ideas) {
        try {
          await createScheduleItem(clientId, idea);
        } catch (e) {
          console.error('Error creando evento de idea', e);
        }
      }
      setIsAIModalOpen(false);
      setAiPrompt('');
      setRefreshKey((k) => k + 1);
      toast.success('¡Nuevas ideas han sido añadidas a tu calendario!');
    },
  });

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

  if (loading) return <div className="text-center text-rambla-text-secondary">Cargando...</div>;
  if (error) return <div className="text-center text-red-500">Error: {error}</div>;
  if (!client) return <div>Cliente no encontrado.</div>;

  return (
    <div>
      <div className="mb-6">
        <Link to="/dashboard" className="text-sm text-rambla-accent hover:underline">&larr; Volver al Dashboard</Link>
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-bold text-white">{client.name}</h1>
          <button onClick={() => setIsAIModalOpen(true)} className="rounded-md bg-glow-cyan px-4 py-2 text-sm font-semibold text-black hover:opacity-90">
            ✨ Generar con IA
          </button>
        </div>
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
            <ScheduleSection key={refreshKey} clientId={clientId} />
          ) : (
            <DocumentsSection clientId={clientId} />
          )}
        </div>
      </div>

      <Transition appear show={isAIModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsAIModalOpen(false)}>
          <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/50" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <Dialog.Panel className="w-full max-w-lg rounded-xl border border-white/10 bg-glow-card-bg p-6 backdrop-blur-lg shadow-lg">
                  <Dialog.Title className="mb-2 text-lg font-semibold text-white">Generar ideas con IA</Dialog.Title>
                  <p className="mb-4 text-sm text-rambla-text-secondary">¿Sobre qué tema te gustaría generar ideas para este mes?</p>
                  <textarea value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} rows={4} className="w-full rounded-md border border-rambla-border bg-rambla-bg px-3 py-2 text-white placeholder-rambla-text-secondary focus:border-rambla-accent focus:outline-none" placeholder="Ej. ideas para el Día del Padre" />
                  <div className="mt-4 flex justify-end gap-2">
                    <button onClick={() => setIsAIModalOpen(false)} className="rounded-md border border-rambla-border px-4 py-2 text-sm text-rambla-text-secondary hover:border-rambla-accent">Cancelar</button>
                    <button onClick={() => aiMutation.mutate()} disabled={!aiPrompt || aiMutation.isPending} className="rounded-md bg-rambla-accent px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
                      {aiMutation.isPending ? 'Creando…' : 'Generar Ideas'}
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
};