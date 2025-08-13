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

  if (loading) return <div>Cargando clientes...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <div className="dashboard-header">
        <h2>Mis Clientes</h2>
        {/* Formulario para añadir un nuevo cliente */}
        <form onSubmit={handleCreateClient} className="new-client-form">
          <input
            type="text"
            placeholder="Nombre del nuevo cliente"
            value={newClientName}
            onChange={(e) => setNewClientName(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Industria (opcional)"
            value={newClientIndustry}
            onChange={(e) => setNewClientIndustry(e.target.value)}
          />
          <button type="submit">Añadir Cliente</button>
        </form>
      </div>

      <div className="clients-grid">
        {clients.length > 0 ? (
          clients.map((client) => (
            <Link to={`/clients/${client.id}`} key={client.id} className="client-card-link">
              <div className="client-card">
                <h3>{client.name}</h3>
                <p>{client.industry || 'Sin industria especificada'}</p>
              </div>
            </Link>
          ))
        ) : (
          <p>Aún no has añadido ningún cliente. ¡Crea el primero!</p>
        )}
      </div>
    </div>
  );
};
