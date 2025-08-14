import React, { useState, useEffect, Fragment } from 'react';
import { fetchClients, createClient } from '../api/clients.js';
import { Link } from 'react-router-dom';
import { Dialog, Transition } from '@headlessui/react';

export const DashboardPage = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados para el formulario de nuevo cliente
  const [newClientName, setNewClientName] = useState('');
  const [newClientIndustry, setNewClientIndustry] = useState('');
  const [isNewClientOpen, setIsNewClientOpen] = useState(false);

  // Función para cargar los clientes desde el backend
  const loadClients = async () => {
    try {
      setLoading(true);
      const clientsData = await fetchClients();
      setClients(clientsData);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // useEffect para cargar los clientes cuando el componente se monta
  useEffect(() => {
    loadClients();
  }, []);

  // Manejador para el envío del formulario de nuevo cliente
  const handleCreateClient = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!newClientName) return;

    try {
      await createClient({ name: newClientName, industry: newClientIndustry });
      // Limpiar formulario y recargar la lista de clientes
      setNewClientName('');
      setNewClientIndustry('');
      loadClients(); 
      setIsNewClientOpen(false);
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="text-center text-rambla-text-secondary">Cargando...</div>;
  if (error) return <div className="text-center text-red-500">Error: {error}</div>;

  return (
    <div className="space-y-8">
      {/* Hero centrado */}
      <section className="flex flex-col items-center text-center gap-4 py-4">
        <div className="h-16 w-16 rounded-full border border-white/20 bg-white/5 backdrop-blur flex items-center justify-center text-2xl font-bold text-white">
          R
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => {
              setNewClientName('');
              setNewClientIndustry('');
              setIsNewClientOpen(true);
            }}
            className="rounded-full bg-glow-cyan/20 px-5 py-2 text-white border border-glow-cyan/40 hover:bg-glow-cyan/30 hover:border-glow-cyan/60 transition"
          >
            Nuevo cliente
          </button>
          <button className="rounded-full border border-white/15 bg-white/5 px-5 py-2 text-white hover:bg-white/10 transition">
            Invitar personas
          </button>
        </div>
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
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {clients.length > 0 ? clients.map((client) => (
          <Link to={`/clients/${client.id}`} key={client.id} className="group">
            <div className="
  rounded-xl border border-white/10 bg-glow-card-bg p-5 
  backdrop-blur-lg shadow-lg
  transition-all duration-300 ease-in-out
  hover:!border-glow-cyan hover:scale-105 hover:shadow-glow-cyan/20
">
              <div className="mb-2 text-[10px] uppercase tracking-wider text-white/60">
                Team
              </div>
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
        )) : (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <p className="text-rambla-text-secondary">Aún no has añadido ningún cliente.</p>
            <button
              onClick={() => {
                setNewClientName('');
                setNewClientIndustry('');
                setIsNewClientOpen(true);
              }}
              className="rounded-full bg-glow-cyan/20 px-5 py-2 text-white border border-glow-cyan/40 hover:bg-glow-cyan/30 hover:border-glow-cyan/60 transition"
            >
              Crear el primero
            </button>
          </div>
        )}
      </div>

      {/* Modal para crear nuevo cliente */}
      <Transition appear show={isNewClientOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsNewClientOpen(false)}>
          <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/50" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <Dialog.Panel className="w-full max-w-md rounded-xl border border-white/10 bg-glow-card-bg p-6 backdrop-blur-lg shadow-lg">
                  <Dialog.Title className="mb-2 text-lg font-semibold text-white">Nuevo cliente</Dialog.Title>
                  <form onSubmit={handleCreateClient} className="space-y-4">
                    <div>
                      <label className="mb-1 block text-sm text-rambla-text-secondary">Nombre</label>
                      <input
                        type="text"
                        value={newClientName}
                        onChange={(e) => setNewClientName(e.target.value)}
                        className="w-full rounded-md border border-rambla-border bg-rambla-bg px-3 py-2 text-white placeholder-rambla-text-secondary focus:border-rambla-accent focus:outline-none"
                        placeholder="Nombre del cliente"
                        required
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm text-rambla-text-secondary">Industria (opcional)</label>
                      <input
                        type="text"
                        value={newClientIndustry}
                        onChange={(e) => setNewClientIndustry(e.target.value)}
                        className="w-full rounded-md border border-rambla-border bg-rambla-bg px-3 py-2 text-white placeholder-rambla-text-secondary focus:border-rambla-accent focus:outline-none"
                        placeholder="Industria"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <button type="button" onClick={() => setIsNewClientOpen(false)} className="rounded-md border border-rambla-border px-4 py-2 text-sm text-rambla-text-secondary hover:border-rambla-accent">Cancelar</button>
                      <button type="submit" className="rounded-md bg-rambla-accent px-4 py-2 text-sm font-semibold text-white hover:opacity-90">Crear</button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
};
