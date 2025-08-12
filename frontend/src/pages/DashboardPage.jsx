import React from 'react';

export const DashboardPage = () => {
  return (
    <div>
      <h2>Mis Clientes</h2>
      <div className="clients-grid">
        {/* Marcador de posición para futuras tarjetas de cliente */}
        <div className="client-card">Cliente A</div>
        <div className="client-card">Cliente B</div>
        <div className="client-card">Cliente C</div>
      </div>
    </div>
  );
};
