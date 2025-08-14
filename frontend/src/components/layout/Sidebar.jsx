import React from 'react';
import { NavLink } from 'react-router-dom';
import { HomeIcon, FolderIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';

export const Sidebar = () => {
  const linkClasses = (
    'flex items-center space-x-3 rounded-lg px-3 py-2 text-rambla-text-secondary '
    + 'hover:bg-rambla-surface hover:text-rambla-text-primary transition-colors'
  );

  return (
    <div className="flex h-full w-64 flex-col space-y-6 bg-rambla-bg py-4 px-2 border-r border-rambla-border">
      <h1 className="px-4 text-2xl font-bold text-white">Rambla</h1>
      <nav className="flex-1 space-y-2">
        <NavLink to="/dashboard" className={linkClasses}>
          <HomeIcon className="h-6 w-6" />
          <span>Dashboard</span>
        </NavLink>
  <NavLink to="/dashboard" className={linkClasses}>
          <FolderIcon className="h-6 w-6" />
          <span>Clientes</span>
        </NavLink>
        <NavLink to="/settings" className={linkClasses}>
          <Cog6ToothIcon className="h-6 w-6" />
          <span>Configuración</span>
        </NavLink>
      </nav>
    </div>
  );
};
