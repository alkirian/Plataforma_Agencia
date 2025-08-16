import React from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';

// Simple breadcrumbs: Dashboard > Clients > ClientName (if on client detail)
export const Breadcrumbs = () => {
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);

  // Build parts progressively
  const crumbs = [];
  let path = '';
  segments.forEach((seg, idx) => {
    path += `/${seg}`;
    crumbs.push({ label: seg, path });
  });

  if (segments.length === 0) return null;

  return (
    <nav className='mb-4 text-sm text-rambla-text-secondary' aria-label='Breadcrumb'>
      <ol className='flex items-center space-x-2'>
        <li>
          <Link to='/dashboard' className='hover:text-white'>
            Dashboard
          </Link>
        </li>
        {crumbs.map((c, i) => (
          <li key={c.path} className='flex items-center space-x-2'>
            <span className='text-white/20'>/</span>
            {i === crumbs.length - 1 ? (
              <span className='text-white'>{decodeURIComponent(c.label)}</span>
            ) : (
              <Link to={c.path} className='hover:text-white'>
                {decodeURIComponent(c.label)}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};
