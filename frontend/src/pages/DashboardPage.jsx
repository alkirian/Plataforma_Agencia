import React, { Fragment } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchClients, createClient } from '../api/clients.js';
import { Link } from 'react-router-dom';
import { Dialog, Transition } from '@headlessui/react';
import { motion, AnimatePresence } from 'framer-motion';

export const DashboardPage = () => {
  const queryClient = useQueryClient();

  const { data: clients, isLoading, isError, error } = useQuery({
    queryKey: ['clients'],
    queryFn: fetchClients,
  });

  const createClientMutation = useMutation({
    mutationFn: createClient,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] }),
  });

  const handleCreateClient = (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    const name = form.get('name');
    const industry = form.get('industry');
    if (!name) return;
    createClientMutation.mutate({ name, industry });
    e.target.reset();
  };

  if (isLoading) return <div className="text-center text-rambla-text-secondary">Cargando clientes...</div>;
  if (isError) return <div className="text-center text-red-500">Error: {error.message}</div>;

  return (
    <div className="space-y-8">
      {/* Hero centrado */}
      <section className="flex flex-col items-center text-center gap-4 py-4">
        <div className="h-16 w-16 rounded-full border border-white/20 bg-white/5 backdrop-blur flex items-center justify-center text-2xl font-bold text-white">
          R
        </div>
        <form onSubmit={handleCreateClient} className="flex w-full max-w-xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
          <input name="name" type="text" placeholder="Nombre del nuevo cliente" required className="w-full rounded-md border border-rambla-border bg-rambla-bg px-3 py-2 text-white placeholder-rambla-text-secondary focus:border-rambla-accent focus:outline-none" />
          <input name="industry" type="text" placeholder="Industria (opcional)" className="w-full rounded-md border border-rambla-border bg-rambla-bg px-3 py-2 text-white placeholder-rambla-text-secondary focus:border-rambla-accent focus:outline-none" />
          <button type="submit" disabled={createClientMutation.isPending} className="rounded-md bg-rambla-accent px-4 py-2 text-sm font-semibold text-white hover:opacity-90 min-w-[160px]">
            {createClientMutation.isPending ? 'Añadiendo…' : 'Añadir Cliente'}
          </button>
        </form>
      </section>

      {/* Separador y título */}
      <div className="relative">
        <div className="mx-auto mb-6 h-px w-full border-t border-white/10" />
        <div className="-mt-4 mb-2 flex justify-center">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs tracking-wide text-rambla-text-secondary">
            CLIENTES RECIENTES
          </span>
        </div>
      </div>

      {/* Grid de tarjetas */}
      <motion.div layout className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <AnimatePresence>
          {clients?.length ? clients.map((client, index) => (
            <motion.div
              key={client.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Link to={`/clients/${client.id}`} className="group block">
                <div className="rounded-xl border border-white/10 bg-glow-card-bg p-5 backdrop-blur-lg shadow-lg transition-all duration-300 ease-in-out hover:!border-glow-cyan hover:scale-105 hover:shadow-glow-cyan/20">
                  <div className="mb-2 text-[10px] uppercase tracking-wider text-white/60">Team</div>
                  <h3 className="font-bold text-white">{client.name}</h3>
                  <p className="text-sm text-rambla-text-secondary">{client.industry || 'Sin industria'}</p>
                  <div className="mt-3 flex -space-x-2">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-6 w-6 rounded-full border border-white/10 bg-white/10" />
                    ))}
                    {clients.length > 4 && (
                      <div className="ml-2 text-xs text-white/60">+{Math.max(0, clients.length - 4)}</div>
                    )}
                  </div>
                </div>
              </Link>
            </motion.div>
          )) : (
            <motion.div className="flex flex-col items-center gap-3 py-10 text-center col-span-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <p className="text-rambla-text-secondary">Aún no has añadido ningún cliente.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

  {/* Se elimina el modal de creación; ahora usamos el formulario superior */}
    </div>
  );
};
