import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { getClients, getClientById } from '../../api/clients.api'
import { ChevronDown, Users } from 'lucide-react'
import { SimpleDropdown } from '@shared/components/ui'
import { ClientSelectionContent } from '@shared/components/layout/ClientSelectionContent'
import { Button } from '@components/ui/Button'

export const ClientSelector = ({ currentClientId }) => {
  // Obtener lista de clientes
  const { data: response } = useQuery({
    queryKey: ['clients'],
    queryFn: getClients,
  })

  // Obtener información del cliente actual
  const { data: currentClientResponse } = useQuery({
    queryKey: ['client', currentClientId],
    queryFn: () => getClientById(currentClientId),
    enabled: !!currentClientId,
  })

  const clients = response?.data || []
  const currentClient = currentClientResponse?.data

  // No mostrar si hay menos de 2 clientes
  if (clients.length < 2) return null

  return (
    <SimpleDropdown
      trigger={
        <Button
          variant='secondary'
          size='sm'
          icon={<Users className='h-4 w-4' />}
          className='flex items-center gap-1'
        >
          <span className='truncate max-w-[120px]'>{currentClient?.name || 'Cliente'}</span>
          <ChevronDown className='h-4 w-4 ml-auto' />
        </Button>
      }
      align='right'
    >
      {({ onClose }) => (
        <ClientSelectionContent currentClientId={currentClientId} onClose={onClose} />
      )}
    </SimpleDropdown>
  )
}
