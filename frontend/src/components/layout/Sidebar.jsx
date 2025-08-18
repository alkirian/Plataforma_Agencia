import React from 'react';
import { NavLink } from 'react-router-dom';
import { HomeIcon, FolderIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';

export const Sidebar = () => {
  const getLinkClasses = ({ isActive }) =>
    `flex items-center gap-3 rounded-lg px-3 py-2 transition-colors duration-200 ${
      isActive
        ? 'bg-surface-strong text-text-primary border-l-2 border-[color:var(--color-border-strong)]'
        : 'text-text-muted hover:bg-surface-strong hover:text-text-primary'
    }`;

  return (
    <div className='flex h-full w-64 flex-col space-y-6 bg-surface-soft py-4 px-2 border-r border-[color:var(--color-border-subtle)] text-text-primary'>
  <h1 className='px-4 text-2xl font-bold text-cyber-gradient'>Cadence</h1>
      <nav className='flex-1 space-y-2'>
        <NavLink to='/dashboard' className={getLinkClasses}>
          <HomeIcon className='h-6 w-6' />
          <span>Dashboard</span>
        </NavLink>
        <NavLink to='/dashboard' className={getLinkClasses}>
          <FolderIcon className='h-6 w-6' />
          <span>Clientes</span>
        </NavLink>
        <NavLink to='/settings' className={getLinkClasses}>
          <Cog6ToothIcon className='h-6 w-6' />
          <span>Configuración</span>
        </NavLink>
      </nav>
    </div>
  );
};
