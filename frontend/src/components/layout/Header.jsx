import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { HomeIcon, Cog6ToothIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import { CyberButton } from '../ui';

export const Header = ({ userEmail, onLogout }) => {
  const navLinkClasses = ({ isActive }) =>
    `rounded-xl p-2.5 transition-all duration-300 relative overflow-hidden ${
      isActive
        ? 'bg-primary-500/15 text-primary-400 shadow-purple-subtle border border-primary-500/25'
        : 'text-rambla-text-secondary hover:bg-primary-500/8 hover:text-primary-400 hover:border-primary-500/15 border border-transparent'
    }`;

  return (
    <motion.header
      className='header-cyber sticky top-0 z-50'
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, type: 'spring', stiffness: 100 }}
    >
      <div className='flex h-16 w-full items-center justify-between px-6'>
        {/* Izquierda: Logo */}
        <motion.div
          className='flex items-center'
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.2 }}
        >
          <Link to='/dashboard' className='text-2xl font-bold text-cyber-gradient'>
            Rambla
          </Link>
          <motion.div
            className='ml-2 w-2 h-2 bg-glow-cyan rounded-full'
            animate={{
              boxShadow: [
                '0 0 5px rgb(0 246 255 / 0.5)',
                '0 0 15px rgb(0 246 255 / 0.8)',
                '0 0 5px rgb(0 246 255 / 0.5)',
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.div>

        {/* Derecha: Navegación y Menú de Usuario */}
        <div className='flex items-center space-x-4'>
          <motion.nav
            className='flex items-center space-x-2'
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <NavLink to='/dashboard' className={navLinkClasses} title='Dashboard'>
              <HomeIcon className='h-5 w-5' />
            </NavLink>
            <NavLink to='/settings' className={navLinkClasses} title='Configuración'>
              <Cog6ToothIcon className='h-5 w-5' />
            </NavLink>
          </motion.nav>

          {/* Separador Visual con glow */}
          <motion.div
            className='h-6 w-px bg-gradient-to-b from-transparent via-primary-500/50 to-transparent'
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          />

          {/* Menú de Usuario */}
          <motion.div
            className='flex items-center space-x-3'
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <motion.div whileHover={{ scale: 1.1, rotate: 5 }} transition={{ duration: 0.2 }}>
              <UserCircleIcon className='h-7 w-7 text-primary-400' />
            </motion.div>
            <span className='text-sm font-medium text-rambla-text-primary'>{userEmail}</span>
            <CyberButton
              variant='ghost'
              size='sm'
              onClick={onLogout}
              className='text-rambla-text-secondary hover:text-primary-300'
            >
              Salir
            </CyberButton>
          </motion.div>
        </div>
      </div>
    </motion.header>
  );
};
