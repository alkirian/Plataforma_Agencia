import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchClientById } from '../api/clients.js';

export const ClientDetailPage = () => {
  // useParams es un hook de react-router-dom que nos da los parámetros de la URL (ej. el :id)
  const { id: clientId } = useParams();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadClientDetails = async () => {
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

    loadClientDetails();
  }, [clientId]); // El efecto se vuelve a ejecutar si el ID del cliente en la URL cambia

  if (loading) return <div>Cargando detalles del cliente...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!client) return <div>Cliente no encontrado.</div>;

  return (
    <div>
      <div className="client-detail-header">
        <Link to="/dashboard">&larr; Volver al Dashboard</Link>
        <h1>{client.name}</h1>
        <p><strong>Industria:</strong> {client.industry || 'No especificada'}</p>
        <p><strong>Cliente desde:</strong> {new Date(client.created_at).toLocaleDateString()}</p>
      </div>
      <hr />
      <div className="client-modules">
        {/* Aquí es donde, en el futuro, renderizaremos los módulos */}
        <h2>Módulos</h2>
        <div className="module-placeholder">Cronograma</div>
        <div className="module-placeholder">Documentos</div>
        <div className="module-placeholder">Tendencias</div>
      </div>
    </div>
  );
};
