import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getClients, getClientById } from '../../api/clients';
import { ChevronDownIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

export const ClientSelector = ({ currentClientId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  // Obtener lista de clientes
  const { data: response } = useQuery({
    queryKey: ['clients'],
    queryFn: getClients,
  });

  // Obtener información del cliente actual
  const { data: currentClientResponse } = useQuery({
    queryKey: ['client', currentClientId],
    queryFn: () => getClientById(currentClientId),
    enabled: !!currentClientId,
  });

  const clients = response?.data || [];
  const currentClient = currentClientResponse?.data;

  // Cerrar dropdown cuando se hace click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleClientSelect = (clientId) => {
    navigate(`/clients/${clientId}`);
    setIsOpen(false);
  };

  // No mostrar si hay menos de 2 clientes
  if (clients.length < 2) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 
                   hover:border-primary-500/50 transition-all duration-200 backdrop-blur-sm"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <UserGroupIcon className="h-4 w-4 text-gray-400" />
        <span className="text-sm text-white font-medium truncate max-w-[120px]">
          {currentClient?.name || 'Cliente'}
        </span>
        <ChevronDownIcon 
          className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full mt-2 right-0 w-64 bg-surface-900/95 backdrop-blur-sm border border-white/10 
                       rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto"
          >
            <div className="p-2">
              <div className="text-xs font-medium text-gray-400 px-3 py-2 border-b border-white/10">
                Cambiar a otro cliente
              </div>
              
              {clients
                .filter(client => client.id !== currentClientId)
                .map((client) => (
                  <motion.button
                    key={client.id}
                    onClick={() => handleClientSelect(client.id)}
                    className="w-full text-left px-3 py-2 rounded-md hover:bg-white/10 
                               transition-colors duration-150 group"
                    whileHover={{ x: 4 }}
                  >
                    <div className="font-medium text-white text-sm group-hover:text-primary-400 transition-colors">
                      {client.name}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {client.industry || 'Sin industria'}
                    </div>
                  </motion.button>
                ))
              }
              
              <div className="border-t border-white/10 mt-2 pt-2">
                <motion.button
                  onClick={() => {
                    navigate('/dashboard');
                    setIsOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-md hover:bg-primary-500/20 
                             transition-colors duration-150 text-primary-400 text-sm"
                  whileHover={{ x: 4 }}
                >
                  ← Ver todos los clientes
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};