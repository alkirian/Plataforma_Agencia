import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getClients } from '@api/clients'
import { motion } from 'framer-motion'

/**
 * Content component for client selection dropdown
 * Extracted from ClientSelector to be used with SimpleDropdown
 */
export const ClientSelectionContent = ({ currentClientId, onClose }) => {
  const navigate = useNavigate()

  // Obtener lista de clientes
  const { data: response } = useQuery({
    queryKey: ['clients'],
    queryFn: getClients,
  })

  const clients = response?.data || []

  const handleClientSelect = clientId => {
    navigate(`/clients/${clientId}`)
    onClose()
  }

  return (
    <div className='w-64'>
      <div className='p-2'>
        <div className='text-xs font-medium text-gray-400 px-3 py-2 border-b border-white/10'>
          Cambiar a otro cliente
        </div>

        {clients
          .filter(client => client.id !== currentClientId)
          .map(client => (
            <motion.button
              key={client.id}
              onClick={() => handleClientSelect(client.id)}
              className='w-full text-left px-3 py-2 rounded-md hover:bg-surface-strong 
                         transition-colors duration-150 group'
              whileHover={{ x: 4 }}
            >
              <div className='font-medium text-white text-sm group-hover:text-primary-400 transition-colors'>
                {client.name}
              </div>
              <div className='text-xs text-gray-400 mt-0.5'>
                {client.industry || 'Sin industria'}
              </div>
            </motion.button>
          ))}

        <div className='border-t border-white/10 mt-2 pt-2'>
          <motion.button
            onClick={() => {
              navigate('/dashboard')
              onClose()
            }}
            className='w-full text-left px-3 py-2 rounded-md hover:bg-primary-500/20 
                       transition-colors duration-150 text-primary-400 text-sm'
            whileHover={{ x: 4 }}
          >
            ← Ver todos los clientes
          </motion.button>
        </div>
      </div>
    </div>
  )
}
