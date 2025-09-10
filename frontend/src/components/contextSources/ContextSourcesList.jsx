import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FunnelIcon,
  MagnifyingGlassIcon,
  Squares2X2Icon,
  ListBulletIcon,
  ChevronDownIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { ContextSourceCard } from './ContextSourceCard'
import { SOURCE_TYPE_CONFIG, SOURCE_TYPES, PROCESSING_STATUS } from '../../api/contextSources.api'
import { LoadingSpinner } from '@components/ui/LoadingSpinner'

export const ContextSourcesList = ({
  sources = [],
  onEdit,
  onDelete,
  onDownload,
  onView,
  isLoading = false,
  disabled = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [viewMode, setViewMode] = useState('grid') // 'grid' | 'list'
  const [showFilters, setShowFilters] = useState(false)

  // Filtros y ordenamiento
  const filteredAndSortedSources = useMemo(() => {
    let filtered = [...sources]

    // Filtro por búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        source =>
          source.title?.toLowerCase().includes(term) ||
          source.description?.toLowerCase().includes(term) ||
          source.tags?.some(tag => tag.toLowerCase().includes(term))
      )
    }

    // Filtro por tipo
    if (selectedType !== 'all') {
      filtered = filtered.filter(source => source.source_type === selectedType)
    }

    // Filtro por estado
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(source => source.status === selectedStatus)
    }

    // Ordenamiento
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at) - new Date(a.created_at)
        case 'oldest':
          return new Date(a.created_at) - new Date(b.created_at)
        case 'title':
          return a.title.localeCompare(b.title)
        case 'type':
          return a.source_type.localeCompare(b.source_type)
        default:
          return 0
      }
    })

    return filtered
  }, [sources, searchTerm, selectedType, selectedStatus, sortBy])

  // Estadísticas rápidas
  const stats = useMemo(() => {
    const total = sources.length
    const byType = Object.values(SOURCE_TYPES).reduce((acc, type) => {
      acc[type] = sources.filter(s => s.source_type === type).length
      return acc
    }, {})
    const byStatus = Object.values(PROCESSING_STATUS).reduce((acc, status) => {
      acc[status] = sources.filter(s => s.status === status).length
      return acc
    }, {})

    return { total, byType, byStatus }
  }, [sources])

  const hasActiveFilters = searchTerm || selectedType !== 'all' || selectedStatus !== 'all'

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedType('all')
    setSelectedStatus('all')
  }

  if (isLoading) {
    return (
      <div className='text-center py-12'>
        <LoadingSpinner size='xl' variant='primary' />
        <p className='text-text-muted mt-4'>Cargando fuentes de contexto...</p>
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      {/* Header con estadísticas y controles */}
      <div className='flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between'>
        {/* Estadísticas */}
        <div className='flex items-center space-x-6 text-sm'>
          <div className='text-text-primary font-medium'>{stats.total} fuentes totales</div>
          <div className='flex items-center space-x-4'>
            {Object.entries(stats.byType).map(([type, count]) => {
              if (count === 0) return null
              const config = SOURCE_TYPE_CONFIG[type]
              return (
                <div key={type} className='flex items-center space-x-1 text-text-muted'>
                  <span className='text-xs'>{config.icon}</span>
                  <span>{count}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Controles de vista */}
        <div className='flex items-center space-x-3'>
          {/* Toggle de vista */}
          <div className='flex items-center space-x-1 bg-surface-soft rounded-lg p-1'>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid'
                  ? 'bg-primary-500/20 text-primary-400'
                  : 'text-text-muted hover:text-text-primary hover:bg-surface-strong'
              }`}
              title='Vista de cuadrícula'
              aria-label='Vista de cuadrícula'
            >
              <Squares2X2Icon className='h-4 w-4' />
            </button>

            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-primary-500/20 text-primary-400'
                  : 'text-text-muted hover:text-text-primary hover:bg-surface-strong'
              }`}
              title='Vista de lista'
              aria-label='Vista de lista'
            >
              <ListBulletIcon className='h-4 w-4' />
            </button>
          </div>

          {/* Toggle de filtros */}
          <motion.button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
              showFilters || hasActiveFilters
                ? 'bg-primary-500/20 text-primary-400'
                : 'bg-surface-soft text-text-muted hover:text-text-primary'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <FunnelIcon className='h-4 w-4' />
            <span className='hidden sm:block'>Filtros</span>
            {hasActiveFilters && <div className='w-2 h-2 bg-primary-500 rounded-full' />}
          </motion.button>
        </div>
      </div>

      {/* Panel de filtros */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className='bg-surface-soft border border-white/10 rounded-xl p-6'
          >
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
              {/* Búsqueda */}
              <div>
                <label className='block text-sm font-medium text-text-primary mb-2'>Buscar</label>
                <div className='relative'>
                  <MagnifyingGlassIcon className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted' />
                  <input
                    type='text'
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder='Título, descripción, tags...'
                    className='w-full pl-10 pr-4 py-2 bg-surface-strong border border-white/10 
                             rounded-lg text-white placeholder-text-muted text-sm
                             focus:ring-2 focus:ring-primary-500/50 focus:border-transparent'
                  />
                </div>
              </div>

              {/* Tipo */}
              <div>
                <label className='block text-sm font-medium text-text-primary mb-2'>
                  Tipo de fuente
                </label>
                <select
                  value={selectedType}
                  onChange={e => setSelectedType(e.target.value)}
                  className='w-full px-3 py-2 bg-surface-strong border border-white/10 
                           rounded-lg text-white text-sm
                           focus:ring-2 focus:ring-primary-500/50 focus:border-transparent'
                >
                  <option value='all'>Todos los tipos</option>
                  {Object.entries(SOURCE_TYPE_CONFIG).map(([type, config]) => (
                    <option key={type} value={type}>
                      {config.icon} {config.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Estado */}
              <div>
                <label className='block text-sm font-medium text-text-primary mb-2'>Estado</label>
                <select
                  value={selectedStatus}
                  onChange={e => setSelectedStatus(e.target.value)}
                  className='w-full px-3 py-2 bg-surface-strong border border-white/10 
                           rounded-lg text-white text-sm
                           focus:ring-2 focus:ring-primary-500/50 focus:border-transparent'
                >
                  <option value='all'>Todos los estados</option>
                  <option value={PROCESSING_STATUS.PENDING}>Pendiente</option>
                  <option value={PROCESSING_STATUS.PROCESSING}>Procesando</option>
                  <option value={PROCESSING_STATUS.READY}>Listo</option>
                  <option value={PROCESSING_STATUS.ERROR}>Error</option>
                </select>
              </div>

              {/* Ordenar por */}
              <div>
                <label className='block text-sm font-medium text-text-primary mb-2'>
                  Ordenar por
                </label>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  className='w-full px-3 py-2 bg-surface-strong border border-white/10 
                           rounded-lg text-white text-sm
                           focus:ring-2 focus:ring-primary-500/50 focus:border-transparent'
                >
                  <option value='newest'>Más reciente</option>
                  <option value='oldest'>Más antiguo</option>
                  <option value='title'>Título A-Z</option>
                  <option value='type'>Tipo</option>
                </select>
              </div>
            </div>

            {/* Clear filters */}
            {hasActiveFilters && (
              <div className='flex justify-end mt-4'>
                <motion.button
                  onClick={clearFilters}
                  className='flex items-center space-x-2 px-3 py-2 text-sm text-text-muted hover:text-text-primary transition-colors'
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <XMarkIcon className='h-4 w-4' />
                  <span>Limpiar filtros</span>
                </motion.button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lista de resultados */}
      {filteredAndSortedSources.length === 0 ? (
        <div className='text-center py-12'>
          {sources.length === 0 ? (
            <div>
              <div className='text-6xl mb-4'>📚</div>
              <h3 className='text-lg font-medium text-text-primary mb-2'>
                No hay fuentes de contexto
              </h3>
              <p className='text-text-muted'>Agrega tu primera fuente para comenzar</p>
            </div>
          ) : (
            <div>
              <div className='text-6xl mb-4'>🔍</div>
              <h3 className='text-lg font-medium text-text-primary mb-2'>
                No se encontraron resultados
              </h3>
              <p className='text-text-muted mb-4'>Prueba ajustando los filtros de búsqueda</p>
              {hasActiveFilters && (
                <motion.button
                  onClick={clearFilters}
                  className='text-primary-400 hover:text-primary-300 transition-colors'
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Limpiar filtros
                </motion.button>
              )}
            </div>
          )}
        </div>
      ) : (
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-4'
          }
        >
          <AnimatePresence mode='popLayout'>
            {filteredAndSortedSources.map((source, index) => (
              <motion.div
                key={source.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
              >
                <ContextSourceCard
                  source={source}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onDownload={onDownload}
                  onView={onView}
                  disabled={disabled}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Resultados info */}
      {filteredAndSortedSources.length > 0 && (
        <div className='text-center text-sm text-text-muted'>
          Mostrando {filteredAndSortedSources.length} de {sources.length} fuentes
          {hasActiveFilters && <span> (filtrado)</span>}
        </div>
      )}
    </div>
  )
}

export default ContextSourcesList
