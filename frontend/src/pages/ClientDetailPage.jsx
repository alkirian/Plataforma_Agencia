import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getClientById } from '@api/clients.api'
import { ScheduleSection } from '@schedule/components/ScheduleSection'
import { DocumentsSectionV2 } from '@components/documents/DocumentsSectionV2.jsx'
import { ContextSourcesSection } from '@components/contextSources/ContextSourcesSection.jsx'
import { ClientFooterInfo } from '@components/client/ClientFooterInfo.jsx'
import { LoadingSpinner } from '@components/ui/LoadingSpinner'

export const ClientDetailPage = () => {
  const { id: clientId } = useParams()
  const [client, setClient] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('schedule')

  const refreshClient = async () => {
    try {
      setLoading(true)
      const response = await getClientById(clientId)
      setClient(response.data)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshClient()
  }, [clientId])

  if (loading)
    return (
      <div className='text-center'>
        <LoadingSpinner size='lg' variant='primary' />
      </div>
    )
  if (error) return <div className='text-center text-red-500'>Error: {error}</div>
  if (!client) return <div>Cliente no encontrado.</div>

  return (
    <>
      <div className='mb-6'>
        <Link
          to='/dashboard'
          className='text-sm text-text-muted hover:text-text-primary hover:underline transition-colors duration-200'
        >
          &larr; Volver al Dashboard
        </Link>
        <div className='flex items-center justify-between'>
          <h1 className='text-4xl font-bold text-cyber-gradient'>{client.name}</h1>
        </div>
        <p className='text-text-muted'>{client.industry || 'No especificada'}</p>
      </div>
      <hr className='border-[color:var(--color-border-subtle)]' />
      <div className='mt-4'>
        <div className='mb-4 flex gap-2'>
          <button
            onClick={() => setActiveTab('schedule')}
            className={`rounded-md px-4 py-2 text-sm font-medium ${
              activeTab === 'schedule'
                ? 'bg-surface-strong text-text-primary shadow-halo'
                : 'border border-[color:var(--color-border-subtle)] bg-surface-soft text-text-muted hover:border-[color:var(--color-border-strong)] hover:text-text-primary'
            }`}
          >
            Cronograma
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`rounded-md px-4 py-2 text-sm font-medium ${
              activeTab === 'documents'
                ? 'bg-surface-strong text-text-primary shadow-halo'
                : 'border border-[color:var(--color-border-subtle)] bg-surface-soft text-text-muted hover:border-[color:var(--color-border-strong)] hover:text-text-primary'
            }`}
          >
            Documentos
          </button>
          <button
            onClick={() => setActiveTab('context-sources')}
            className={`rounded-md px-4 py-2 text-sm font-medium ${
              activeTab === 'context-sources'
                ? 'bg-surface-strong text-text-primary shadow-halo'
                : 'border border-[color:var(--color-border-subtle)] bg-surface-soft text-text-muted hover:border-[color:var(--color-border-strong)] hover:text-text-primary'
            }`}
          >
            Fuentes de Contexto
          </button>
        </div>
        <div className='card rounded-xl p-4'>
          {activeTab === 'schedule' ? (
            <ScheduleSection clientId={clientId} />
          ) : activeTab === 'documents' ? (
            <DocumentsSectionV2 clientId={clientId} clientName={client.name} />
          ) : (
            <ContextSourcesSection clientId={clientId} clientName={client.name} />
          )}
        </div>
      </div>
      <ClientFooterInfo client={client} onClientUpdated={refreshClient} />
    </>
  )
}
