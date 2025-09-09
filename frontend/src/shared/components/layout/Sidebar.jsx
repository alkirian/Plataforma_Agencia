import React from 'react'
import { NavLink } from 'react-router-dom'
import { Home, Folder, Settings } from 'lucide-react'

export const Sidebar = () => {
  const getLinkClasses = ({ isActive }) =>
    `flex items-center gap-3 rounded-lg px-3 py-2 transition-colors duration-200 ${
      isActive
        ? 'bg-surface-strong text-text-primary border-l-2 border-[color:var(--color-border-strong)]'
        : 'text-text-muted hover:bg-surface-strong hover:text-text-primary'
    }`

  return (
    <div className='flex h-full w-64 flex-col space-y-6 use-new-palette py-4 px-2 border-r border-[color:var(--palette-secondary-accent)] surface'>
      <h1 className='px-4 text-2xl font-bold text-cyber-gradient'>Cadence</h1>
      <nav className='flex-1 space-y-2'>
        <NavLink to='/dashboard' className={getLinkClasses}>
          <Home className='h-6 w-6' />
          <span>Dashboard</span>
        </NavLink>
        <NavLink to='/dashboard' className={getLinkClasses}>
          <Folder className='h-6 w-6' />
          <span>Clientes</span>
        </NavLink>
        <NavLink to='/settings' className={getLinkClasses}>
          <Settings className='h-6 w-6' />
          <span>Configuración</span>
        </NavLink>
      </nav>
    </div>
  )
}
