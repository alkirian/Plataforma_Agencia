import React from 'react';

export const DashboardPage = () => {
  return (
    <div>
      <h2>Mis Clientes</h2>
      <div className="clients-grid" style={{display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(220px, 1fr))',gap:16}}>
        {/* Marcador de posición para futuras tarjetas de cliente */}
        <div className="client-card" style={{border:'1px solid #e5e7eb',borderRadius:12,padding:16}}>Cliente A</div>
        <div className="client-card" style={{border:'1px solid #e5e7eb',borderRadius:12,padding:16}}>Cliente B</div>
        <div className="client-card" style={{border:'1px solid #e5e7eb',borderRadius:12,padding:16}}>Cliente C</div>
      </div>
    </div>
  );
};
