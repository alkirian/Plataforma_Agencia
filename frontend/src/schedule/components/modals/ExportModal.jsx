import React, { useState } from 'react'
import { Download, FileText, CalendarDays, Code, BarChart2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { Modal } from '@components/ui/Modal'
import {
  exportToCSV,
  exportToICS,
  exportToJSON,
  getExportSummary,
} from '../../utils/calendarExport'

export const ExportModal = ({
  isOpen,
  onClose,
  events = [],
  clientName = '',
  dateRange = null,
}) => {
  const [selectedFormat, setSelectedFormat] = useState('csv')
  const [isExporting, setIsExporting] = useState(false)

  const exportFormats = [
    {
      id: 'csv',
      name: 'CSV (Excel)',
      description: 'Perfecto para análisis en Excel o Google Sheets',
      icon: FileText,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10 border-green-500/30',
    },
    {
      id: 'ics',
      name: 'iCal (ICS)',
      description: 'Importar a Google Calendar, Outlook, Apple Calendar',
      icon: CalendarDays,
      color: 'text-text-muted',
      bgColor: 'bg-gray-500/10 border-gray-500/30',
    },
    {
      id: 'json',
      name: 'JSON',
      description: 'Para integraciones técnicas y backup completo',
      icon: Code,
      color: 'text-text-primary',
      bgColor: 'bg-gray-600/10 border-gray-600/30',
    },
  ]

  const exportSummary = getExportSummary(events)

  const handleExport = async () => {
    setIsExporting(true)

    try {
      await new Promise(resolve => setTimeout(resolve, 500)) // UX delay

      switch (selectedFormat) {
        case 'csv':
          exportToCSV(events, clientName)
          break
        case 'ics':
          exportToICS(events, clientName)
          break
        case 'json':
          exportToJSON(events, clientName)
          break
        default:
          throw new Error('Formato no soportado')
      }

      onClose()
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error exporting calendar:', error)
      }
    } finally {
      setIsExporting(false)
    }
  }

  const actions = [
    {
      id: 'cancel',
      label: 'Cancelar',
      variant: 'ghost',
      closeOnClick: true,
      disabled: isExporting,
    },
    {
      id: 'export',
      label: isExporting ? 'Exportando...' : 'Exportar',
      variant: 'primary',
      icon: isExporting ? (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className='w-4 h-4 border-2 border-white/30 border-t-white rounded-full'
        />
      ) : (
        <Download className='h-4 w-4' />
      ),
      onClick: handleExport,
      disabled: isExporting || events.length === 0,
      loading: isExporting,
    },
  ]

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title='Exportar Calendario'
      size='lg'
      icon={<Download className='h-6 w-6 text-primary-400' />}
      actions={actions}
    >
      {/* Resumen de eventos */}
      <div className='mb-6 p-4 bg-surface-soft rounded-lg border border-white/10'>
        <div className='flex items-center space-x-2 mb-3'>
          <BarChart2 className='h-5 w-5 text-text-muted' />
          <h3 className='text-sm font-medium text-text-primary'>Resumen de exportación</h3>
        </div>

        <div className='grid grid-cols-2 gap-4 text-sm'>
          <div>
            <span className='text-text-muted'>Total de eventos:</span>
            <span className='ml-2 text-text-primary font-medium'>{exportSummary.total}</span>
          </div>

          {clientName && (
            <div>
              <span className='text-text-muted'>Cliente:</span>
              <span className='ml-2 text-text-primary font-medium'>{clientName}</span>
            </div>
          )}

          {exportSummary.dateRange && (
            <div className='col-span-2'>
              <span className='text-text-muted'>Período:</span>
              <span className='ml-2 text-text-primary font-medium'>
                {exportSummary.dateRange.from} - {exportSummary.dateRange.to}
              </span>
            </div>
          )}
        </div>

        {/* Estados */}
        {Object.keys(exportSummary.byStatus).length > 0 && (
          <div className='mt-3 pt-3 border-t border-white/5'>
            <span className='text-xs text-text-muted uppercase tracking-wide'>Por estado:</span>
            <div className='flex flex-wrap gap-2 mt-2'>
              {Object.entries(exportSummary.byStatus).map(([status, count]) => (
                <span
                  key={status}
                  className='px-2 py-1 bg-white/10 rounded text-xs text-text-primary'
                >
                  {status}: {count}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Selección de formato */}
      <div className='mb-6'>
        <h3 className='text-sm font-medium text-text-primary mb-3'>Seleccionar formato:</h3>
        <div className='space-y-3'>
          {exportFormats.map(format => {
            const Icon = format.icon
            const isSelected = selectedFormat === format.id

            return (
              <motion.div
                key={format.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`p-4 rounded-lg border transition-all cursor-pointer ${
                  isSelected
                    ? format.bgColor
                    : 'border-white/10 hover:border-white/20 bg-surface-soft'
                }`}
                onClick={() => setSelectedFormat(format.id)}
              >
                <div className='flex items-start space-x-3'>
                  <Icon
                    className={`h-6 w-6 mt-0.5 ${isSelected ? format.color : 'text-text-muted'}`}
                  />
                  <div className='flex-1'>
                    <div className='flex items-center space-x-2'>
                      <h4 className='font-medium text-text-primary'>{format.name}</h4>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className='w-2 h-2 bg-primary-500 rounded-full'
                        />
                      )}
                    </div>
                    <p className='text-sm text-text-muted mt-1'>{format.description}</p>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {events.length === 0 && (
        <div className='mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg'>
          <p className='text-sm text-yellow-400'>
            No hay eventos para exportar en el período seleccionado.
          </p>
        </div>
      )}
    </Modal>
  )
}
