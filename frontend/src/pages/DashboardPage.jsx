import React, { useState, useEffect } from 'react';
import { fetchClients, createClient } from '../api/clients.js';
import { Link } from 'react-router-dom';

export const DashboardPage = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados para el formulario de nuevo cliente
  const [newClientName, setNewClientName] = useState('');
  const [newClientIndustry, setNewClientIndustry] = useState('');

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
    e.preventDefault();
    if (!newClientName) return;

    try {
      await createClient({ name: newClientName, industry: newClientIndustry });
      // Limpiar formulario y recargar la lista de clientes
      setNewClientName('');
      setNewClientIndustry('');
      loadClients(); 
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="text-center text-rambla-text-secondary">Cargando...</div>;
  if (error) return <div className="text-center text-red-500">Error: {error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-white">Mis Clientes</h2>
        <form onSubmit={handleCreateClient} className="flex space-x-2">
          <input
            type="text"
            placeholder="Nombre del nuevo cliente"
            value={newClientName}
            onChange={(e) => setNewClientName(e.target.value)}
            className="rounded-md border border-rambla-border bg-rambla-surface px-3 py-2 text-white placeholder-rambla-text-secondary focus:border-rambla-accent focus:outline-none"
            required
          />
          <input
            type="text"
            placeholder="Industria (opcional)"
            value={newClientIndustry}
            onChange={(e) => setNewClientIndustry(e.target.value)}
            className="rounded-md border border-rambla-border bg-rambla-surface px-3 py-2 text-white placeholder-rambla-text-secondary focus:border-rambla-accent focus:outline-none"
          />
          <button type="submit" className="rounded-md bg-rambla-accent px-4 py-2 font-semibold text-white transition hover:opacity-90">
            Añadir Cliente
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {clients.length > 0 ? clients.map((client) => (
          <Link to={`/clients/${client.id}`} key={client.id} className="group">
            <div className="rounded-lg border border-rambla-border bg-rambla-surface p-5 transition duration-300 ease-in-out group-hover:-translate-y-1 group-hover:border-rambla-accent">
              <h3 className="font-bold text-white">{client.name}</h3>
              <p className="text-sm text-rambla-text-secondary">{client.industry || 'Sin industria'}</p>
            </div>
          </Link>
        )) : (
          <p className="text-rambla-text-secondary">Aún no has añadido ningún cliente.</p>
        )}
      </div>
    </div>
  );
};
