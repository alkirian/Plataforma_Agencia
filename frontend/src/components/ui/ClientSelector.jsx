import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getClients } from '../../api/clients';

export const ClientSelector = ({ currentClientId }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentTab = new URLSearchParams(location.search).get('tab') || 'schedule';

  const { data } = useQuery({
    queryKey: ['clients'],
    queryFn: getClients,
  });

  const clients = data?.data || [];

  const handleChange = e => {
    const nextId = e.target.value;
    if (!nextId || nextId === currentClientId) return;
    navigate(`/clients/${nextId}?tab=${currentTab}`);
  };

  return (
    <select
      value={currentClientId || ''}
      onChange={handleChange}
      className='h-8 rounded-md border border-[color:var(--color-border-subtle)] bg-surface-soft px-2 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent-blue)]/30'
      aria-label='Seleccionar cliente'
    >
      {clients.map(client => (
        <option key={client.id} value={client.id}>
          {client.name}
        </option>
      ))}
    </select>
  );
};
