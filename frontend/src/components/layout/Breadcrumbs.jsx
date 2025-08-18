import React, { useState, useEffect } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline';

// Enhanced breadcrumbs with context-aware labels
export const Breadcrumbs = () => {
  const location = useLocation();
  const params = useParams();
  const [clientName, setClientName] = useState('');

  // Fetch client name if we're on a client page
  useEffect(() => {
    if (params.id && location.pathname.includes('/clients/')) {
      // Try to get client name from local storage or make API call
      const fetchClientName = async () => {
        try {
          // This would be replaced with actual API call
          const response = await fetch(`/api/clients/${params.id}`);
          if (response.ok) {
            const client = await response.json();
            setClientName(client.data?.name || `Cliente ${params.id}`);
          }
        } catch (error) {
          setClientName(`Cliente ${params.id}`);
        }
      };
      fetchClientName();
    }
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
          // If it's a client ID and we have the name
          if (params.id === segment && clientName) {
            label = clientName;
            isClickable = false; // Current page shouldn't be clickable
          } else if (segment.length > 10) {
            // Truncate long IDs
            label = segment.substring(0, 8) + '...';
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
      <ol className='flex items-center space-x-1'>
        {/* Home/Dashboard link */}
        <li>
          <Link 
            to='/dashboard' 
            className='flex items-center text-text-muted hover:text-text-primary transition-colors duration-200'
            aria-label="Ir al dashboard"
          >
            <HomeIcon className='h-4 w-4 mr-1' />
            <span>Dashboard</span>
          </Link>
        </li>
        
        {/* Dynamic breadcrumb items */}
        {crumbs.map((crumb, index) => (
          <li key={crumb.path} className='flex items-center'>
            <ChevronRightIcon className='h-4 w-4 text-text-muted mx-1' aria-hidden="true" />
            {crumb.isClickable ? (
              <Link 
                to={crumb.path} 
                className='text-text-muted hover:text-text-primary transition-colors duration-200 px-1 py-0.5 rounded hover:bg-white/5'
                aria-label={`Ir a ${crumb.label}`}
              >
                {crumb.label}
              </Link>
            ) : (
              <span 
                className='text-text-primary font-medium px-1 py-0.5'
                aria-current="page"
              >
                {crumb.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};
