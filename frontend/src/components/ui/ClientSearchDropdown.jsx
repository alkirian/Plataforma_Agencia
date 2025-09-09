import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, User, Building, Plus } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getClients } from '@api/clients'
import { Avatar, Button } from '@shared/components/ui'

export const ClientSearchDropdown = ({ onClose }) => {
  const [searchTerm, setSearchTerm] = useState('')

  const { data: clientsResponse, isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: getClients,
  })

  const clients = clientsResponse?.data || []

  // Filter clients based on search term
  const filteredClients = clients.filter(
    client =>
      client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.company?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Auto focus search input
  useEffect(() => {
    const input = document.getElementById('client-search-input')
    if (input) {
      input.focus()
    }
  }, [])

  const handleClientClick = client => {
    onClose?.()
  }

  return (
    <div className='w-80'>
      {/* Search Header */}
      <div className='p-4 border-b border-[color:var(--color-border-subtle)]'>
        <div className='relative'>
          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-muted' />
          <input
            id='client-search-input'
            type='text'
            placeholder='Buscar clientes...'
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className='w-full pl-10 pr-4 py-2 bg-surface-subtle border border-[color:var(--color-border-subtle)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent-blue)] focus:border-transparent'
          />
        </div>
      </div>

      {/* Results */}
      <div className='max-h-80 overflow-y-auto'>
        {isLoading && (
          <div className='p-4 text-center text-text-muted text-sm'>Cargando clientes...</div>
        )}

        {!isLoading && filteredClients.length === 0 && searchTerm && (
          <div className='p-4 text-center'>
            <User className='h-8 w-8 text-text-muted mx-auto mb-2' />
            <p className='text-sm text-text-muted mb-3'>
              No se encontraron clientes con "{searchTerm}"
            </p>
            <Button
              variant='primary'
              size='sm'
              className='mx-auto'
              onClick={() => {
                // Aquí podrías abrir un modal para crear cliente
                onClose?.()
              }}
            >
              <Plus className='h-4 w-4 mr-2' />
              Crear cliente
            </Button>
          </div>
        )}

        {!isLoading && filteredClients.length === 0 && !searchTerm && (
          <div className='p-4'>
            <h3 className='text-sm font-medium text-text-primary mb-3'>Accesos rápidos</h3>
            <div className='space-y-1'>
              <Link
                to='/clients'
                onClick={onClose}
                className='block p-2 rounded-lg hover:bg-surface-soft transition-colors text-sm text-text-muted hover:text-text-primary'
              >
                📋 Ver todos los clientes
              </Link>
              <button
                onClick={() => {
                  // Crear nuevo cliente
                  onClose?.()
                }}
                className='block w-full text-left p-2 rounded-lg hover:bg-surface-soft transition-colors text-sm text-text-muted hover:text-text-primary'
              >
                <Plus className='h-4 w-4 inline mr-2' />
                Crear nuevo cliente
              </button>
            </div>
          </div>
        )}

        {!isLoading && filteredClients.length > 0 && (
          <div className='py-2'>
            {filteredClients.slice(0, 8).map(client => (
              <motion.div
                key={client.id}
                whileHover={{ backgroundColor: 'var(--color-surface-soft)' }}
                className='transition-colors'
              >
                <Link
                  to={`/clients/${client.id}`}
                  onClick={() => handleClientClick(client)}
                  className='flex items-center p-3 hover:bg-surface-soft transition-colors'
                >
                  <div className='flex-shrink-0 mr-3'>
                    <Avatar name={client.name || client.company} size={32} />
                  </div>
                  <div className='flex-1 min-w-0'>
                    <div className='text-sm font-medium text-text-primary truncate'>
                      {client.name || client.company}
                    </div>
                    {client.company && client.name && (
                      <div className='text-xs text-text-muted truncate flex items-center mt-1'>
                        <Building className='h-3 w-3 mr-1' />
                        {client.company}
                      </div>
                    )}
                    {client.email && (
                      <div className='text-xs text-text-muted truncate'>{client.email}</div>
                    )}
                  </div>
                  <div className='flex-shrink-0 ml-2'>
                    <div className='w-2 h-2 bg-green-400 rounded-full' title='Activo' />
                  </div>
                </Link>
              </motion.div>
            ))}

            {filteredClients.length > 8 && (
              <div className='px-3 py-2 text-xs text-text-muted text-center border-t border-[color:var(--color-border-subtle)]'>
                +{filteredClients.length - 8} clientes más.
                <Link
                  to={`/clients?search=${encodeURIComponent(searchTerm)}`}
                  onClick={onClose}
                  className='ml-1 text-[color:var(--color-accent-blue)] hover:underline'
                >
                  Ver todos
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
