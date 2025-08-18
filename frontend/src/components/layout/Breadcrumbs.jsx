import React, { useState, useEffect } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline';
import { getClientById } from '../../api/clients.js';

// Enhanced breadcrumbs with context-aware labels
export const Breadcrumbs = () => {
  const location = useLocation();
  const params = useParams();
  const [clientName, setClientName] = useState('');

  // Fetch client name if we're on a client page
  useEffect(() => {
    let cancelled = false;
    if (params.id && location.pathname.includes('/clients/')) {
      const fetchClientName = async () => {
        try {
          const res = await getClientById(params.id);
          const name = res?.data?.name || res?.name;
          if (!cancelled) setClientName(name || `Cliente ${params.id}`);
        } catch (error) {
          if (!cancelled) setClientName(`Cliente ${params.id}`);
        }
      };
      fetchClientName();
    }
    return () => { cancelled = true; };
  }, [params.id, location.pathname]);

  const generateBreadcrumbs = () => {
    const segments = location.pathname.split('/').filter(Boolean);
    const crumbs = [];

    segments.forEach((segment, idx) => {
      const path = '/' + segments.slice(0, idx + 1).join('/');
      let label = segment;
      let isClickable = true;

      // Transform segments to human-readable labels
      switch (segment) {
        case 'dashboard':
          label = 'Dashboard';
          break;
        case 'clients':
          label = 'Clientes';
          break;
        case 'settings':
          label = 'Configuración';
          break;
        default:
          // If it's a client ID: never render the raw/truncated ID
          if (params.id === segment) {
            label = clientName || 'Cliente';
            isClickable = false; // Current page shouldn't be clickable
          } else if (segment.length > 10) {
            // For other long machine segments, prefer a neutral label
            label = 'Sección';
          }
      }

      crumbs.push({ 
        label, 
        path, 
        isClickable: isClickable && idx < segments.length - 1 
      });
    });

    return crumbs;
  };

  const crumbs = generateBreadcrumbs();
  
  if (crumbs.length === 0) return null;

  return (
    <nav className='mb-6 text-sm' aria-label='Breadcrumb'>
      <ol className='flex items-center gap-1.5'>
        {/* Home/Dashboard link */}
        <li className='flex items-center'>
          <Link 
            to='/dashboard' 
            className='inline-flex items-center gap-2 px-2.5 py-1 rounded-lg text-text-muted hover:text-text-primary bg-white/0 hover:bg-white/5 border border-transparent hover:border-white/10 transition-colors'
            aria-label="Ir al dashboard"
          >
            <HomeIcon className='h-4 w-4' />
            <span>Dashboard</span>
          </Link>
        </li>

        {/* Dynamic breadcrumb items */}
        {crumbs.map((crumb) => (
          <li key={crumb.path} className='flex items-center'>
            <ChevronRightIcon className='h-4 w-4 text-text-muted/80 mx-1' aria-hidden="true" />
            {crumb.isClickable ? (
              <Link 
                to={crumb.path} 
                className='inline-flex items-center gap-2 px-2.5 py-1 rounded-lg text-text-muted hover:text-text-primary bg-white/0 hover:bg-white/5 border border-transparent hover:border-white/10 transition-colors'
                aria-label={`Ir a ${crumb.label}`}
              >
                <span className='truncate'>{crumb.label}</span>
              </Link>
            ) : (
              <span 
                className='inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-surface-soft/60 border border-white/10 text-text-primary font-medium'
                aria-current="page"
              >
                <span className='truncate'>{crumb.label}</span>
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};
