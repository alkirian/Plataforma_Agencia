import React, { useMemo, useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { Home } from 'lucide-react';
import { getClientById } from '../../api/clients';

// Dark, connected pill breadcrumbs
// API: items: [{ label, href, icon?, className? }]
export const Breadcrumbs = ({ items, className = '' }) => {
  const location = useLocation();
  const params = useParams();
  const [clientName, setClientName] = useState('');

  useEffect(() => {
    let cancelled = false;
    if (!items && params.id && location.pathname.includes('/clients/')) {
      (async () => {
        try {
          const res = await getClientById(params.id);
          const name = res?.data?.name || res?.name;
          if (!cancelled) setClientName(name || `Cliente ${params.id}`);
        } catch (e) {
          if (!cancelled) setClientName(`Cliente ${params.id}`);
        }
      })();
    }
    return () => { cancelled = true; };
  }, [items, params.id, location.pathname]);

  const autoItems = useMemo(() => {
    if (items && Array.isArray(items)) return items;
    const segments = location.pathname.split('/').filter(Boolean);
    if (segments.length === 0) return [{ label: 'Dashboard', href: '/dashboard', icon: <Home size={14} /> }];

    const result = [];
    segments.forEach((segment, idx) => {
      const path = '/' + segments.slice(0, idx + 1).join('/');
      let label = segment;
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
          if (params.id === segment) {
            label = clientName || 'Cliente';
          } else if (segment.length > 18) {
            label = 'Sección';
          }
      }
      result.push({ label, href: idx < segments.length - 1 ? path : undefined });
    });
    // Always prepend Dashboard
    return [{ label: 'Dashboard', href: '/dashboard', icon: <Home size={14} /> }, ...result];
  }, [items, location.pathname, params.id, clientName]);

  if (!autoItems || autoItems.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className={`breadcrumbs-dark ${className}`}>
      <ol className="breadcrumbs-list" role="list">
        {autoItems.map((item, idx) => {
          const isLast = idx === autoItems.length - 1 || (!item.href && idx === autoItems.length - 1);
          const content = (
            <span className="breadcrumbs-pill-inner">
              {item.icon ? <span className="breadcrumbs-icon" aria-hidden="true">{item.icon}</span> : null}
              <span className="breadcrumbs-label" title={item.label}>{item.label}</span>
            </span>
          );

          return (
            <li key={`${item.label}-${idx}`} className={`breadcrumbs-item ${isLast ? 'is-active' : ''}`}>
              {isLast || !item.href ? (
                <span aria-current="page" className={`breadcrumbs-pill ${isLast ? 'is-active' : ''} ${item.className || ''}`}>{content}</span>
              ) : (
                <Link
                  to={item.href}
                  className={`breadcrumbs-pill ${item.className || ''}`}
                  aria-label={`Ir a ${item.label}`}
                >
                  {content}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;

